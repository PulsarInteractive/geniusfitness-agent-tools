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
      assert.deepEqual(q, { ...input, valuesVersion: 2 });
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
test('opaque original-goal profile reference is optional, bounded and never a private profile payload', async () => {
  const page = result();
  for (const key of [null, 'a'.repeat(64)]) {
    page.entries[0].goalProfileKey = key;
    assert.deepEqual(await readPushAdjustments({ get: async () => page }, input), page);
  }
  for (const key of ['', 'raw-profile-revision', 'a'.repeat(65), { primaryGoal: 'muscle' }]) {
    page.entries[0].goalProfileKey = key;
    await assert.rejects(readPushAdjustments({ get: async () => page }, input), {
      code: 'invalid_response',
    });
  }
  page.entries[0].goalProfileKey = 'a'.repeat(64);
  page.entries[0].goal = null;
  await assert.rejects(readPushAdjustments({ get: async () => page }, input), {
    code: 'invalid_response',
  });
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
      assert.deepEqual(q, { ...input, valuesVersion: 2 });
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

const canonicalPage = () => {
  const value = result();
  value.entries[0].before = {
    repetitions: 8,
    loadMilliunits: null,
    massFormat: 'kg-v1',
    loadKilograms: 12.473790175,
  };
  value.entries[0].after = {
    repetitions: 9,
    loadMilliunits: null,
    massFormat: 'kg-v1',
    loadKilograms: 12.473790175,
  };
  return value;
};
test('adjustments preserve exact canonical kg, mixed historical entries and unweighted absence', async () => {
  const value = canonicalPage();
  const legacy = result().entries[0];
  legacy.id = 'legacy';
  legacy.unit = 'lb';
  value.entries.push(legacy);
  const bodyweight = structuredClone(value.entries[0]);
  bodyweight.id = 'bodyweight';
  bodyweight.unit = 'none';
  delete bodyweight.before.loadKilograms;
  delete bodyweight.after.loadKilograms;
  value.entries.push(bodyweight);
  let calls = 0;
  assert.deepEqual(
    await readPushAdjustments(
      {
        get: async (route, query) => {
          calls++;
          assert.equal(route, 'push-adjustments');
          assert.deepEqual(query, { ...input, valuesVersion: 2 });
          return value;
        },
      },
      input,
    ),
    value,
  );
  assert.equal(calls, 1);
});
test('adjustment pairs reject incompatible representations and malformed canonical loads', async (t) => {
  const mutations = {
    pound: (p) => (p.entries[0].unit = 'lb'),
    unknown: (p) => (p.entries[0].unit = 'unknown'),
    unweighted: (p) => (p.entries[0].unit = 'none'),
    mixedPair: (p) => (p.entries[0].after = { repetitions: 9, loadMilliunits: 12474 }),
    mixedValue: (p) => (p.entries[0].after.loadMilliunits = 12474),
    absentMarker: (p) => delete p.entries[0].after.massFormat,
    undefinedMarker: (p) => (p.entries[0].after.massFormat = undefined),
    nullMarker: (p) => (p.entries[0].after.massFormat = null),
    unknownMarker: (p) => (p.entries[0].after.massFormat = 'kg-v2'),
    noKg: (p) => delete p.entries[0].after.loadKilograms,
    undefinedKg: (p) => (p.entries[0].after.loadKilograms = undefined),
    nullKg: (p) => (p.entries[0].after.loadKilograms = null),
    large: (p) => (p.entries[0].after.loadKilograms = 2001),
    negative: (p) => (p.entries[0].after.loadKilograms = -1),
    infinite: (p) => (p.entries[0].after.loadKilograms = Infinity),
  };
  for (const [name, mutate] of Object.entries(mutations)) {
    await t.test(name, async () => {
      const value = canonicalPage();
      mutate(value);
      await assert.rejects(readPushAdjustments({ get: async () => value }, input), {
        code: 'invalid_response',
      });
    });
  }
});

test('CLI and MCP deliver canonical adjustment values with one negotiated request each', async (t) => {
  const value = canonicalPage();
  let calls = 0;
  const f = await fixture(t, async (url) => {
    calls++;
    assert.equal(new URL(url).searchParams.get('valuesVersion'), '2');
    return Response.json(value);
  });
  let stdout = '',
    stderr = '';
  const code = await main(
    [
      'sessions',
      'push-adjustments',
      ...Object.entries(input).flatMap(([k, v]) => ['--' + k, v]),
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
  assert.deepEqual(JSON.parse(stdout).data, value);
  const server = createMcpServer(f.client);
  const client = new Client({ name: 'canonical-adjustment-test', version: '1' });
  const [a, b] = InMemoryTransport.createLinkedPair();
  await server.connect(a);
  await client.connect(b);
  try {
    const response = await client.callTool({ name: 'fitness_push_adjustments', arguments: input });
    assert.notEqual(response.isError, true);
    assert.deepEqual(response.structuredContent.data, value);
  } finally {
    await client.close();
    await server.close();
  }
  assert.equal(calls, 2);
});

test('CLI exposes server upgrade refusal and does not retry a historical read', async (t) => {
  let calls = 0;
  const f = await fixture(t, async () => {
    calls++;
    return Response.json(
      {
        error: {
          code: 'push_values_upgrade_required',
          retryable: false,
          remediation: 'Update the client.',
        },
      },
      { status: 409 },
    );
  });
  let stdout = '',
    stderr = '';
  const code = await main(
    [
      'sessions',
      'push-adjustments',
      ...Object.entries(input).flatMap(([k, v]) => ['--' + k, v]),
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
  assert.equal(code, 5, stderr);
  assert.equal(stdout, '');
  assert.equal(JSON.parse(stderr).error.code, 'push_values_upgrade_required');
  assert.equal(JSON.parse(stderr).error.retryable, false);
  assert.equal(calls, 1);
});
