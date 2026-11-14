import test from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/client';
import { InMemoryTransport } from '@modelcontextprotocol/server';
import { readProgressSelection } from '../src/progress-selection.mjs';
import { createMcpServer } from '../src/mcp.mjs';
import { main } from '../src/cli.mjs';
import { fixture, origin } from './helpers.mjs';
import cases from './fixtures/progress-selection-wire.mjs';

const period = () =>
  structuredClone(
    cases.find((item) => item.input.selection === 'last_7_days' && item.result.state === 'ready'),
  );
const latest = () =>
  structuredClone(
    cases.find(
      (item) => item.input.selection === 'latest_training_session' && item.result.state === 'ready',
    ),
  );

test('recorded Worker selections preserve every factual field in exactly one data request', async () => {
  assert.deepEqual(
    new Set(cases.map((item) => item.input.selection)),
    new Set(['last_7_days', 'last_28_days', 'latest_training_session']),
  );
  assert.ok(cases.some((item) => item.result.state === 'insufficient_data'));
  assert.ok(cases.some((item) => item.result.periods.some((p) => p.coverage === 'partial')));
  assert.ok(cases.some((item) => item.result.running?.omittedObservations > 0));
  for (const { name, input, result } of cases) {
    let calls = 0;
    const value = await readProgressSelection(
      {
        get: async (route, query) => {
          calls++;
          assert.equal(route, 'progress-selection');
          assert.deepEqual(query, input);
          return structuredClone(result);
        },
      },
      input,
    );
    assert.deepEqual(value, result, name);
    assert.equal(calls, 1, name);
  }
});

test('strict selection rejects scope, student, time and pagination overrides before HTTP', async () => {
  const { input } = period();
  let calls = 0;
  const client = {
    get: async () => {
      calls++;
    },
  };
  for (const query of [
    {},
    { ...input, scope: 'personal:owner' },
    { ...input, scope: 'project:' + 'a'.repeat(129) },
    { ...input, selection: 'week' },
    { ...input, selection: { kind: 'last_7_days' } },
    { ...input, athleteId: 'student' },
    { ...input, timeZone: 'UTC' },
    { ...input, from: '2026-01-01' },
    { ...input, cursor: 'next' },
    { ...input, limit: 1000 },
  ]) {
    await assert.rejects(readProgressSelection(client, query), { code: 'invalid_arguments' });
  }
  assert.equal(calls, 0);
});

test('scope, temporal, coverage and private-field corruption never becomes usable progress', async () => {
  const mutations = [
    (r) => {
      r.scope = 'project:other';
    },
    (r) => {
      r.selection = 'last_28_days';
    },
    (r) => {
      r.timeZone = 'invalid/timezone';
    },
    (r) => {
      r.sourceKeys = ['a'.repeat(64)];
    },
    (r) => {
      r.periods[0].recommendation = 'increase weight';
    },
    (r) => {
      r.periods[0].workingSets = null;
    },
    (r) => {
      r.periods[0].coverage = 'partial';
    },
    (r) => {
      r.periods[0].observedThrough = '2000-01-01T00:00:00Z';
    },
    (r) => {
      r.periods[0].observedTrainingDays = ['2026-02-30'];
    },
    (r) => {
      r.periods[0].closed = !r.periods[0].closed;
    },
    (r) => {
      r.periods[0].observedWorkingSets = 0;
    },
    (r) => {
      r.running.observationsComplete = false;
    },
    (r) => {
      r.running.candidatePageComplete = false;
    },
    (r) => {
      r.state = 'insufficient_data';
    },
    (r) => {
      r.latestSessionUnavailableReason = 'none_retained';
    },
    (r) => {
      r.physiologicalProgressEstablished = true;
    },
  ];
  for (const mutate of mutations) {
    const { input, result } = period();
    mutate(result);
    let calls = 0;
    await assert.rejects(
      readProgressSelection(
        {
          get: async () => {
            calls++;
            return result;
          },
        },
        input,
      ),
      { code: 'invalid_response' },
    );
    assert.equal(calls, 1);
  }
});

test('latest session preserves completed/skipped/unfinished facts and never substitutes a period', async () => {
  const { input, result } = latest();
  for (const mutate of [
    (r) => {
      r.latestSession.completedSets = r.latestSession.totalSets + 1;
    },
    (r) => {
      r.latestSession.elapsedSeconds++;
    },
    (r) => {
      r.latestSession.workingSets = r.latestSession.completedSets + 1;
    },
    (r) => {
      r.latestSession.endedAt = '2100-01-01T00:00:00Z';
    },
    (r) => {
      r.latestSession = null;
    },
    (r) => {
      r.periods = period().result.periods;
    },
    (r) => {
      r.windowFrom = r.asOf;
    },
  ]) {
    const invalid = structuredClone(result);
    mutate(invalid);
    await assert.rejects(readProgressSelection({ get: async () => invalid }, input), {
      code: 'invalid_response',
    });
  }
});

test('omitted running observations remain incomplete and cannot cross the selected period', async () => {
  const example = cases.find((item) => item.result.running?.omittedObservations > 0);
  assert.ok(example);
  assert.equal(example.result.running.observationsComplete, false);
  for (const mutate of [
    (r) => {
      r.running.observationsComplete = true;
    },
    (r) => {
      r.running.omittedObservations = r.running.examinedRecords;
    },
    (r) => {
      r.running.observations[1].runId = r.running.observations[0].runId;
    },
    (r) => {
      r.running.observations[0].startedAt = new Date(Date.parse(r.windowFrom) - 1).toISOString();
    },
  ]) {
    const result = structuredClone(example.result);
    mutate(result);
    await assert.rejects(readProgressSelection({ get: async () => result }, example.input), {
      code: 'invalid_response',
    });
  }
});

test('access, context, quota and preparation errors make one HTTP call without fallback or stale data', async (t) => {
  const { input } = period();
  for (const [status, code] of [
    [401, 'invalid_token'],
    [403, 'agent_permission_denied'],
    [404, 'not_found'],
    [409, 'agent_context_changed'],
    [429, 'rate_limited'],
    [503, 'progress_preparing'],
  ]) {
    let calls = 0;
    const f = await fixture(t, async (url) => {
      calls++;
      assert.equal(new URL(url).pathname, '/api/agents/v1/progress-selection');
      return Response.json({ error: { code } }, { status });
    });
    await assert.rejects(readProgressSelection(f.client, input), { code });
    assert.equal(calls, 1);
  }
});

test('CLI selection performs one authenticated GET and preserves the result envelope', async (t) => {
  const { input, result } = latest();
  let calls = 0;
  const f = await fixture(t, async (url, options) => {
    calls++;
    const u = new URL(url);
    assert.equal(u.pathname, '/api/agents/v1/progress-selection');
    assert.deepEqual(Object.fromEntries(u.searchParams), input);
    assert.equal(options.method, 'GET');
    assert.match(options.headers.Authorization, /^Bearer /);
    return Response.json(result);
  });
  const output = [];
  const code = await main(
    [
      'metrics',
      'selected',
      '--scope',
      input.scope,
      '--selection',
      input.selection,
      '--origin',
      origin,
      '--allow-local',
      '--json',
    ],
    {
      directory: f.directory,
      fetchImpl: f.transport.fetch,
      stdout: { write: (value) => output.push(value) },
      stderr: { write: () => {} },
    },
  );
  assert.equal(code, 0);
  assert.equal(calls, 1);
  assert.deepEqual(JSON.parse(output.join('')).data, result);
});

test('an explicit second read rechecks access and never serves the earlier successful response', async (t) => {
  const { input, result } = period();
  let calls = 0;
  const f = await fixture(t, async () => {
    calls++;
    return calls === 1
      ? Response.json(result)
      : Response.json({ error: { code: 'agent_permission_denied' } }, { status: 403 });
  });
  assert.deepEqual(await readProgressSelection(f.client, input), result);
  await assert.rejects(readProgressSelection(f.client, input), { code: 'agent_permission_denied' });
  assert.equal(calls, 2);
});

test('MCP advertises a read-only selection and executes one call with strict input', async () => {
  const { input, result } = period();
  let calls = 0;
  const server = createMcpServer({
    get: async (route, query) => {
      calls++;
      assert.equal(route, 'progress-selection');
      assert.deepEqual(query, input);
      return result;
    },
  });
  const client = new Client({ name: 'progress-selection-test', version: '1' });
  const [a, b] = InMemoryTransport.createLinkedPair();
  try {
    await server.connect(a);
    await client.connect(b);
    const tool = (await client.listTools()).tools.find(
      (item) => item.name === 'fitness_progress_selection',
    );
    assert.equal(tool.annotations.readOnlyHint, true);
    assert.equal(tool.annotations.destructiveHint, false);
    const response = await client.callTool({ name: tool.name, arguments: input });
    assert.equal(response.isError, undefined);
    assert.deepEqual(response.structuredContent.data, result);
    assert.equal(calls, 1);
    const invalid = await client.callTool({
      name: tool.name,
      arguments: { ...input, athleteId: 'student' },
    });
    assert.equal(invalid.isError, true);
    assert.equal(calls, 1);
  } finally {
    await client.close();
    await server.close();
  }
});
