import test from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/client';
import { InMemoryTransport } from '@modelcontextprotocol/server';
import { createMcpServer } from '../src/mcp.mjs';
import { readPushResults } from '../src/push-results.mjs';
import { main } from '../src/cli.mjs';
import { fixture, origin } from './helpers.mjs';

const input = {
  scope: 'project:program',
  sessionId: '11111111-1111-4111-8111-111111111111',
  athleteId: 'athlete',
};
const target = {
  projectId: 'program',
  trainingId: 'training',
  occurrenceId: null,
  sessionId: input.sessionId,
  exerciseId: 'bench',
  setIndex: 1,
  round: null,
  side: 'both',
};
const time = '2026-11-04T10:00:00.000Z';
const result = () => ({
  ...input,
  epoch: 'epoch',
  revision: '5',
  readOnly: true,
  outcomesState: 'ready',
  proposals: [
    {
      id: 'proposal',
      revision: 1,
      target,
      base: { repetitions: 8, loadMilliunits: 40000 },
      offeredTarget: { repetitions: 9, loadMilliunits: 40000 },
      axis: 'repetitions',
      unit: 'kg',
      convention: 'total_external',
      state: 'accepted',
      createdAt: time,
      validFrom: time,
      expiresAt: time,
      executionAuthorization: 'not_granted',
    },
  ],
  outcomes: [
    {
      id: 'corrected',
      proposalId: 'proposal',
      proposalRevision: 1,
      target,
      actual: { repetitions: 7, loadMilliunits: 40000 },
      resolution: 'partial',
      unit: 'kg',
      convention: 'total_external',
      completedAt: time,
      recordedAt: time,
      rewardState: 'ineligible',
      supersedesOutcomeId: 'earlier',
    },
  ],
});

test('one explicit read retains corrected actual values, units and missing evidence without writes', async () => {
  let calls = 0;
  const client = {
    get: async (name, query) => {
      calls++;
      assert.equal(name, 'push-results');
      assert.deepEqual(query, input);
      return result();
    },
  };
  assert.deepEqual(await readPushResults(client, input), result());
  assert.equal(calls, 1);
  const incomplete = { ...result(), outcomesState: 'incomplete', outcomes: [] };
  assert.deepEqual(await readPushResults({ get: async () => incomplete }, input), incomplete);
  for (const invalid of [
    { ...input, scope: 'personal:athlete' },
    { ...input, sessionId: 'live_' + input.sessionId },
    { ...input, limit: 1000 },
  ]) {
    await assert.rejects(readPushResults(client, invalid), { code: 'invalid_arguments' });
  }
  assert.equal(calls, 1);
});

test('foreign, inconsistent, oversized and private responses are refused before the agent sees them', async () => {
  const changes = [
    (r) => (r.athleteId = 'other'),
    (r) => (r.scope = 'project:other'),
    (r) => (r.sessionId = '22222222-2222-4222-8222-222222222222'),
    (r) => (r.outcomes[0].unit = 'lb'),
    (r) => (r.outcomes[0].target = { ...target, side: 'left' }),
    (r) => (r.outcomes[0].proposalId = 'missing'),
    (r) => r.outcomes.push(r.outcomes[0]),
    (r) => (r.proposals = Array(33).fill(r.proposals[0])),
    (r) => (r.outcomesState = 'incomplete'),
    (r) => (r.outcomes[0].sourceActor = { userId: 'private' }),
    (r) => (r.outcomes[0].actual = null),
    (r) => (r.proposals[0].executionAuthorization = 'granted'),
    (r) => (r.outcomes[0].completedAt = null),
    (r) => (r.outcomes[0].actual.loadMilliunits = Infinity),
  ];
  for (const change of changes) {
    const r = structuredClone(result());
    change(r);
    await assert.rejects(readPushResults({ get: async () => r }, input), {
      code: 'invalid_response',
    });
  }
});

test('MCP advertises a read-only tool and carries one bounded request', async () => {
  let calls = 0;
  const server = createMcpServer({
    get: async (name, query) => {
      calls++;
      assert.equal(name, 'push-results');
      assert.deepEqual(query, input);
      return result();
    },
  });
  const client = new Client({ name: 'push-test', version: '1' }),
    [a, b] = InMemoryTransport.createLinkedPair();
  await server.connect(a);
  await client.connect(b);
  try {
    const tool = (await client.listTools()).tools.find((t) => t.name === 'fitness_push_results');
    assert.equal(tool.annotations.readOnlyHint, true);
    const response = await client.callTool({ name: 'fitness_push_results', arguments: input });
    assert.notEqual(response.isError, true);
    assert.deepEqual(response.structuredContent.data, result());
    assert.equal(calls, 1);
  } finally {
    await client.close();
    await server.close();
  }
});

test('CLI sends one authorized HTTP read and does not cache the completed result', async (t) => {
  let calls = 0;
  const f = await fixture(t, async (url, options) => {
    calls++;
    const u = new URL(url);
    assert.equal(u.pathname, '/api/agents/v1/push-results');
    assert.equal(u.searchParams.get('sessionId'), input.sessionId);
    assert.match(options.headers.Authorization, /^Bearer /);
    return Response.json(result());
  });
  let stdout = '',
    stderr = '';
  const code = await main(
    [
      'sessions',
      'push-results',
      '--scope',
      input.scope,
      '--sessionId',
      input.sessionId,
      '--athleteId',
      input.athleteId,
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
  assert.deepEqual(JSON.parse(stdout).data, result());
  assert.equal(calls, 1);
  await readPushResults(f.client, input);
  assert.equal(calls, 2, 'Each explicit read reauthorizes through the server');
});
