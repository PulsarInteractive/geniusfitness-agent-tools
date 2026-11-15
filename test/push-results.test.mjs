import test from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/client';
import { InMemoryTransport } from '@modelcontextprotocol/server';
import { createMcpServer } from '../src/mcp.mjs';
import { readPushResults } from '../src/push-results.mjs';
import { main } from '../src/cli.mjs';
import { fixture, origin } from './helpers.mjs';
import remoteTools from '../remote/tool-catalog.json' with { type: 'json' };

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
      assert.deepEqual(query, { ...input, valuesVersion: 2 });
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

test('settled bonus amounts are explicit, optional and never inferred from a legacy award', async () => {
  for (const amount of [undefined, null, 3]) {
    const value = result();
    Object.assign(value.outcomes[0], {
      resolution: 'achieved',
      actual: { repetitions: 9, loadMilliunits: 40000 },
      rewardState: 'awarded',
    });
    if (amount !== undefined) {
      value.outcomes[0].awardedXp = amount;
    }
    let calls = 0;
    const query = { ...input, includeRewardDetails: true };
    const returned = await readPushResults(
      {
        get: async (name, q) => {
          calls++;
          assert.deepEqual(q, { ...query, valuesVersion: 2 });
          return value;
        },
      },
      query,
    );
    assert.deepEqual(returned, value);
    assert.equal(calls, 1);
  }
  for (const amount of [0, -1, 1.5, 2147483648]) {
    const value = result();
    value.outcomes[0].awardedXp = amount;
    await assert.rejects(readPushResults({ get: async () => value }, input), {
      code: 'invalid_response',
    });
  }
  const inconsistent = result();
  inconsistent.outcomes[0].awardedXp = 3;
  await assert.rejects(readPushResults({ get: async () => inconsistent }, input), {
    code: 'invalid_response',
  });
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
      assert.deepEqual(query, { ...input, valuesVersion: 2 });
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

test('CLI and MCP preserve the explicit reward-details opt-in without extra reads', async (t) => {
  const value = result();
  Object.assign(value.outcomes[0], {
    resolution: 'achieved',
    actual: { repetitions: 9, loadMilliunits: 40000 },
    rewardState: 'awarded',
    awardedXp: 3,
  });
  let calls = 0;
  const f = await fixture(t, async (url) => {
    calls++;
    assert.equal(new URL(url).searchParams.get('includeRewardDetails'), 'true');
    return Response.json(value);
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
      '--includeRewardDetails',
      'true',
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
  assert.equal(JSON.parse(stdout).data.outcomes[0].awardedXp, 3);
  assert.equal(calls, 1);
  const server = createMcpServer(f.client);
  const client = new Client({ name: 'xp-test', version: '1' });
  const [a, b] = InMemoryTransport.createLinkedPair();
  await server.connect(a);
  await client.connect(b);
  try {
    const tool = (await client.listTools()).tools.find((t) => t.name === 'fitness_push_results');
    assert.equal(tool.inputSchema.properties.includeRewardDetails.type, 'boolean');
    assert.deepEqual(
      remoteTools.find((t) => t.name === tool.name).inputSchema.properties.includeRewardDetails,
      tool.inputSchema.properties.includeRewardDetails,
    );
    const response = await client.callTool({
      name: 'fitness_push_results',
      arguments: { ...input, includeRewardDetails: true },
    });
    assert.notEqual(response.isError, true);
    assert.equal(response.structuredContent.data.outcomes[0].awardedXp, 3);
    assert.equal(calls, 2);
  } finally {
    await client.close();
    await server.close();
  }
});

const canonicalResult = (load = 12.473790175) => {
  const value = result();
  const canonical = (repetitions) => ({
    repetitions,
    loadMilliunits: null,
    massFormat: 'kg-v1',
    loadKilograms: load,
  });
  value.proposals[0].base = canonical(8);
  value.proposals[0].offeredTarget = canonical(9);
  value.outcomes[0].actual = canonical(7);
  return value;
};

test('canonical kg retains float64 load and zero exactly through one CLI and MCP read', async (t) => {
  for (const load of [12.473790175, 0, 2000, 1e-12]) {
    const value = canonicalResult(load);
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
        'push-results',
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
    const client = new Client({ name: 'canonical-push-test', version: '1' });
    const [a, b] = InMemoryTransport.createLinkedPair();
    await server.connect(a);
    await client.connect(b);
    try {
      const response = await client.callTool({ name: 'fitness_push_results', arguments: input });
      assert.notEqual(response.isError, true);
      assert.deepEqual(response.structuredContent.data, value);
    } finally {
      await client.close();
      await server.close();
    }
    assert.equal(calls, 2, 'One request per explicit invocation, no negotiation or retry request');
  }
});

test('canonical unweighted values omit kg and mixed histories retain each record representation', async () => {
  const value = canonicalResult();
  for (const item of [
    value.proposals[0].base,
    value.proposals[0].offeredTarget,
    value.outcomes[0].actual,
  ]) {
    delete item.loadKilograms;
  }
  value.proposals[0].unit = value.outcomes[0].unit = 'none';
  value.proposals[0].convention = value.outcomes[0].convention = 'none';
  const legacy = result();
  legacy.proposals[0].id = 'legacy';
  legacy.proposals[0].unit = 'lb';
  legacy.outcomes[0].id = 'legacy-result';
  legacy.outcomes[0].proposalId = 'legacy';
  legacy.outcomes[0].unit = 'lb';
  value.proposals.push(legacy.proposals[0]);
  value.outcomes.push(legacy.outcomes[0]);
  assert.deepEqual(await readPushResults({ get: async () => value }, input), value);
});

test('canonical/legacy mixtures, malformed markers and contradictory load contexts are refused', async (t) => {
  const mutations = {
    fractionalLegacy: (p) => {
      p.proposals[0].base = { repetitions: 8, loadMilliunits: 123.5 };
    },
    nullMarker: (p) => {
      p.proposals[0].base.massFormat = null;
    },
    unknownMarker: (p) => {
      p.proposals[0].base.massFormat = 'kg-v2';
    },
    absentMarker: (p) => {
      delete p.proposals[0].base.massFormat;
    },
    explicitUndefinedMarker: (p) => {
      p.proposals[0].base.massFormat = undefined;
    },
    mixedRepresentations: (p) => {
      p.proposals[0].base.loadMilliunits = 12474;
    },
    missingWeightedKg: (p) => {
      delete p.proposals[0].base.loadKilograms;
    },
    explicitUndefinedKg: (p) => {
      p.proposals[0].base.loadKilograms = undefined;
    },
    nullKg: (p) => {
      p.proposals[0].base.loadKilograms = null;
    },
    negativeKg: (p) => {
      p.proposals[0].base.loadKilograms = -1;
    },
    largeKg: (p) => {
      p.proposals[0].base.loadKilograms = 2000.01;
    },
    infiniteKg: (p) => {
      p.proposals[0].base.loadKilograms = Infinity;
    },
    nanKg: (p) => {
      p.proposals[0].base.loadKilograms = NaN;
    },
    poundsCanonical: (p) => {
      p.proposals[0].unit = p.outcomes[0].unit = 'lb';
    },
    unknownCanonical: (p) => {
      p.proposals[0].unit = p.outcomes[0].unit = 'unknown';
    },
    unweightedWithKg: (p) => {
      p.proposals[0].unit = p.outcomes[0].unit = 'none';
    },
    differentProposalVersion: (p) => {
      p.proposals[0].offeredTarget = { repetitions: 9, loadMilliunits: 12474 };
    },
    differentOutcomeVersion: (p) => {
      p.outcomes[0].actual = { repetitions: 7, loadMilliunits: 12474 };
    },
  };
  for (const [name, mutate] of Object.entries(mutations)) {
    await t.test(name, async () => {
      const value = canonicalResult();
      mutate(value);
      await assert.rejects(readPushResults({ get: async () => value }, input), {
        code: 'invalid_response',
      });
    });
  }
});

test('a server upgrade refusal is preserved without retry, cached fallback or a new command', async () => {
  let calls = 0;
  const failure = Object.assign(new Error('Update the client'), {
    code: 'push_values_upgrade_required',
    status: 409,
  });
  await assert.rejects(
    readPushResults(
      {
        get: async () => {
          calls++;
          throw failure;
        },
      },
      input,
    ),
    (error) => error === failure,
  );
  assert.equal(calls, 1);
});
