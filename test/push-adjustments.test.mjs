import test from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/client';
import { InMemoryTransport } from '@modelcontextprotocol/server';
import { createMcpServer } from '../src/mcp.mjs';
import { readPushAdjustments } from '../src/push-adjustments.mjs';
import { main } from '../src/cli.mjs';
import { fixture, origin } from './helpers.mjs';
import remoteTools from '../remote/tool-catalog.json' with { type: 'json' };

const input = {
  scope: 'project:program',
  athleteId: 'athlete',
  sessionId: '11111111-1111-4111-8111-111111111111',
  outcomeId: 'result',
};
const result = () => ({
  ...input,
  projectId: 'program',
  trainingId: 'training',
  epoch: 'epoch',
  checkpoint: '42',
  sourceRevision: '4',
  occurrence: {
    athleteId: 'athlete',
    projectId: 'program',
    trainingId: 'training',
    occurrenceId: 'next',
  },
  entries: [
    {
      id: 'decision',
      target: {
        projectId: 'program',
        trainingId: 'training',
        occurrenceId: 'next',
        sessionId: null,
        exerciseId: 'bench',
        setIndex: 1,
        round: null,
        side: 'both',
      },
      before: { repetitions: 8, loadMilliunits: 40000 },
      after: { repetitions: 9, loadMilliunits: 40000 },
      unit: 'kg',
      convention: 'total_external',
      state: 'saved',
      savedAt: '2026-11-05T10:00:00.000Z',
      withdrawnAt: null,
      automatic: false,
      goal: 'muscle',
      sourceResults: [{ id: input.outcomeId, sessionId: input.sessionId }],
    },
  ],
  nextCursor: null,
  serverTime: Date.parse('2026-11-05T10:00:00.000Z'),
  readOnly: true,
  planApplication: 'not_verified',
  coverage: 'retained_records',
});

test('one page per call, empty continuation and unknown legacy context remain explicit', async () => {
  let calls = 0;
  const page = result();
  page.entries = [];
  page.nextCursor = 'next-page';
  const client = {
    get: async (route, q) => {
      calls++;
      assert.equal(route, 'push-adjustments');
      assert.deepEqual(q, input);
      return page;
    },
  };
  assert.deepEqual(await readPushAdjustments(client, input), page);
  assert.equal(calls, 1);
  const withdrawn = result();
  Object.assign(withdrawn.entries[0], {
    state: 'withdrawn',
    withdrawnAt: withdrawn.entries[0].savedAt,
    goal: null,
  });
  assert.deepEqual(await readPushAdjustments({ get: async () => withdrawn }, input), withdrawn);
  const finished = { ...page, occurrence: null, nextCursor: null };
  assert.deepEqual(await readPushAdjustments({ get: async () => finished }, input), finished);
});
test('bad inputs are refused before HTTP and request failures do not trigger retries', async () => {
  let calls = 0;
  const client = {
    get: async () => {
      calls++;
      throw Object.assign(new Error('Wait'), { code: 'rate_limited', retryAfter: 30 });
    },
  };
  for (const q of [
    { ...input, scope: 'personal:athlete' },
    { ...input, athleteId: undefined },
    { ...input, cursor: '' },
    { ...input, cursor: 'x'.repeat(4097) },
    { ...input, limit: 1000 },
    { ...input, sessionId: 'not-uuid' },
    { ...input, outcomeId: '' },
  ]) {
    await assert.rejects(readPushAdjustments(client, q), { code: 'invalid_arguments' });
  }
  assert.equal(calls, 0);
  await assert.rejects(readPushAdjustments(client, input), {
    code: 'rate_limited',
    retryAfter: 30,
  });
  assert.equal(calls, 1);
});
test('foreign, overlarge, private and inconsistent history is rejected recursively', async (t) => {
  const mutations = {
    scope: (p) => {
      p.scope = 'project:other';
    },
    athlete: (p) => {
      p.athleteId = 'other';
    },
    session: (p) => {
      p.sessionId = crypto.randomUUID();
    },
    outcome: (p) => {
      p.outcomeId = 'other';
    },
    project: (p) => {
      p.projectId = 'other';
    },
    occurrence: (p) => {
      p.occurrence.athleteId = 'other';
    },
    training: (p) => {
      p.occurrence.trainingId = 'other';
    },
    target: (p) => {
      p.entries[0].target.occurrenceId = 'other';
    },
    liveTarget: (p) => {
      p.entries[0].target.sessionId = input.sessionId;
    },
    missingOccurrence: (p) => {
      p.occurrence = null;
    },
    private: (p) => {
      p.entries[0].readiness = { pain: true };
    },
    privateValue: (p) => {
      p.entries[0].before.effortRpe = 8;
    },
    noSource: (p) => {
      p.entries[0].sourceResults = [];
    },
    foreignSource: (p) => {
      p.entries[0].sourceResults[0].sessionId = crypto.randomUUID();
    },
    duplicateSource: (p) => {
      p.entries[0].sourceResults.push({ ...p.entries[0].sourceResults[0] });
    },
    duplicateDecision: (p) => {
      p.entries.push({ ...p.entries[0] });
    },
    tooMany: (p) => {
      p.entries = Array.from({ length: 17 }, (_, i) => ({ ...p.entries[0], id: String(i) }));
    },
    savedWithdrawal: (p) => {
      p.entries[0].withdrawnAt = p.entries[0].savedAt;
    },
    missingWithdrawal: (p) => {
      p.entries[0].state = 'withdrawn';
    },
    pastWithdrawal: (p) => {
      p.entries[0].state = 'withdrawn';
      p.entries[0].withdrawnAt = '2026-11-04T10:00:00.000Z';
    },
    bodyweight: (p) => {
      p.entries[0].unit = 'none';
    },
    effective: (p) => {
      p.planApplication = 'applied';
    },
    cycle: (p) => {
      p.nextCursor = 'current';
    },
  };
  for (const [name, mutate] of Object.entries(mutations)) {
    await t.test(name, async () => {
      const p = result();
      mutate(p);
      await assert.rejects(
        readPushAdjustments({ get: async () => p }, { ...input, cursor: 'current' }),
        { code: 'invalid_response' },
      );
    });
  }
});
test('CLI performs one authorized read and carries the explicit continuation', async (t) => {
  let calls = 0;
  const f = await fixture(t, async (url, options) => {
    calls++;
    const u = new URL(url);
    assert.equal(u.pathname, '/api/agents/v1/push-adjustments');
    assert.equal(u.searchParams.get('outcomeId'), input.outcomeId);
    assert.equal(u.searchParams.get('cursor'), 'page');
    assert.match(options.headers.Authorization, /^Bearer /);
    return Response.json(result());
  });
  let stdout = '',
    stderr = '';
  const code = await main(
    [
      'sessions',
      'push-adjustments',
      ...Object.entries({ ...input, cursor: 'page' }).flatMap(([k, v]) => ['--' + k, v]),
      '--origin',
      origin,
      '--allow-local',
      '--json',
    ],
    {
      directory: f.directory,
      fetchImpl: f.transport.fetch,
      stdout: { write: (s) => (stdout += s) },
      stderr: { write: (s) => (stderr += s) },
    },
  );
  assert.equal(code, 0, stderr);
  assert.equal(calls, 1);
  assert.deepEqual(JSON.parse(stdout).data, result());
});
test('stdio MCP and remote catalogue expose the bounded read and guidance', async () => {
  let calls = 0;
  const server = createMcpServer({
    get: async (route, q) => {
      calls++;
      assert.equal(route, 'push-adjustments');
      assert.deepEqual(q, input);
      return result();
    },
  });
  const client = new Client({ name: 'adjustment-test', version: '1' }),
    [a, b] = InMemoryTransport.createLinkedPair();
  await server.connect(a);
  await client.connect(b);
  try {
    const tool = (await client.listTools()).tools.find(
      (t) => t.name === 'fitness_push_adjustments',
    );
    assert.equal(tool.annotations.readOnlyHint, true);
    assert.equal(tool.annotations.destructiveHint, false);
    const remote = remoteTools.find((t) => t.name === tool.name);
    assert.deepEqual(remote.scopes, ['metrics:read']);
    assert.equal(remote.description, tool.description);
    assert.match(tool.description, /empty entries page with nextCursor/);
    assert.match(tool.description, /not confirmation of the effective prescription/);
    const response = await client.callTool({ name: tool.name, arguments: input });
    assert.notEqual(response.isError, true);
    assert.deepEqual(response.structuredContent.data, result());
    assert.equal(calls, 1);
  } finally {
    await client.close();
    await server.close();
  }
});
