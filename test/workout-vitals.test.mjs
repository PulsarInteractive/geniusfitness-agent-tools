import test from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/client';
import { InMemoryTransport } from '@modelcontextprotocol/server';
import { createMcpServer } from '../src/mcp.mjs';
import { readWorkoutVitals } from '../src/fitness.mjs';
const input = { scope: 'project:p', sessionId: 's' };
const result = {
  ...input,
  athleteId: 'a',
  availability: 'available',
  source: 'AppleHealth',
  startedAt: '2026-10-24T10:00:00Z',
  endedAt: '2026-10-24T11:00:00Z',
  revision: '2',
  minutes: [{ offset: 0, count: 2, minimum: 80, maximum: 120, average: 100 }],
  interpretation: 'Observed, not inferred.',
};
test('workout observations validate identity, bounds and explicit missing values', async () => {
  assert.deepEqual(await readWorkoutVitals({ get: async () => result }, input), result);
  for (const invalid of [
    { ...result, scope: 'project:other' },
    { ...result, availability: 'unrecorded' },
    { ...result, minutes: [...result.minutes, { ...result.minutes[0] }] },
    { ...result, minutes: [{ ...result.minutes[0], average: 150 }] },
  ]) {
    await assert.rejects(() => readWorkoutVitals({ get: async () => invalid }, input));
  }
  const missing = {
    ...result,
    availability: 'unrecorded',
    source: null,
    startedAt: null,
    endedAt: null,
    revision: null,
    minutes: [],
  };
  assert.deepEqual(await readWorkoutVitals({ get: async () => missing }, input), missing);
  await assert.rejects(
    () =>
      readWorkoutVitals(
        {
          get: async () => {
            throw new Error('denied');
          },
        },
        input,
      ),
    /denied/,
  );
});
test('real MCP invocation dispatches session analysis and wearable tools to their correct handlers', async () => {
  const calls = [];
  const observed = {
    ...result,
    exerciseHeartRates: [
      {
        exerciseId: 'squat',
        averageBpm: 117.5,
        sourceRecordId: '8a20daa0-7841-4c24-8256-756dc5710f22',
        intervals: [{ startedAt: '2026-10-24T10:10:00Z', endedAt: '2026-10-24T10:11:00Z' }],
      },
    ],
  };
  const server = createMcpServer({
    get: async (name, args) => {
      calls.push([name, args]);
      return name === 'workout-vitals' ? observed : { scope: args.scope, id: args.id };
    },
  });
  const client = new Client({ name: 'fixture', version: '1' });
  const [a, b] = InMemoryTransport.createLinkedPair();
  await server.connect(a);
  await client.connect(b);
  try {
    const analyzed = await client.callTool({
      name: 'fitness_session_analysis',
      arguments: { scope: 'project:p', id: 's' },
    });
    assert.notEqual(analyzed.isError, true, JSON.stringify(analyzed));
    const vitals = await client.callTool({ name: 'fitness_workout_vitals', arguments: input });
    assert.notEqual(vitals.isError, true, JSON.stringify(vitals));
    assert.deepEqual(
      JSON.parse(vitals.content.find((row) => row.type === 'text').text).exerciseHeartRates,
      observed.exerciseHeartRates,
    );
    assert.deepEqual(calls, [
      ['session-analysis', { scope: 'project:p', id: 's' }],
      ['workout-vitals', input],
    ]);
  } finally {
    await client.close();
    await server.close();
  }
});

test('authenticated client routes derived insights and never reuses sensitive reads after revocation', async (t) => {
  const { fixture } = await import('./helpers.mjs');
  let calls = 0,
    revoked = false;
  const f = await fixture(t, async (url) => {
    calls++;
    if (revoked) {
      return Response.json({ error: { code: 'workout_vitals_sharing_required' } }, { status: 403 });
    }
    assert.ok(
      ['/api/agents/v1/workout-vitals', '/api/agents/v1/muscle-insights'].includes(url.pathname),
    );
    return Response.json(result);
  });
  await f.client.get('muscle-insights', { scope: 'project:p' });
  await readWorkoutVitals(f.client, input);
  await readWorkoutVitals(f.client, input);
  revoked = true;
  await assert.rejects(() => readWorkoutVitals(f.client, input), {
    code: 'workout_vitals_sharing_required',
  });
  assert.equal(calls, 4, 'Every sensitive request must revalidate its current grant');
});

test('active calories retain their measured interval; older servers and BPM-only data remain compatible', async () => {
  const energy = {
    kilocalories: 218.75,
    startedAt: '2026-10-24T10:10:00Z',
    endedAt: '2026-10-24T10:50:00Z',
    sourceRecordId: '8a20daa0-7841-4c24-8256-756dc5710f22',
  };
  const page = { ...result, minutes: [], energy };
  assert.deepEqual((await readWorkoutVitals({ get: async () => page }, input)).energy, energy);
  for (const invalid of [
    { ...page, availability: 'unrecorded' },
    { ...page, energy: null },
    { ...page, energy: { ...energy, kilocalories: -1 } },
    { ...page, energy: { ...energy, startedAt: '2026-10-24T09:59:00Z' } },
    { ...page, energy: { ...energy, endedAt: '2026-10-24T11:01:00Z' } },
    { ...page, energy: { ...energy, endedAt: energy.startedAt } },
    { ...page, energy: { ...energy, patientNote: 'unexpected' } },
  ]) {
    await assert.rejects(readWorkoutVitals({ get: async () => invalid }, input), {
      code: 'invalid_response',
    });
  }
  assert.deepEqual(await readWorkoutVitals({ get: async () => result }, input), result);
});

test('exercise intervals retain provenance in connector output and reject overlapping measurements', async () => {
  const interval = {
    exerciseId: 'squat',
    setIndex: 1,
    round: null,
    phase: 'effort',
    kilocalories: 7.25,
    durationSeconds: 30,
    startedAt: '2026-10-24T10:10:00Z',
    endedAt: '2026-10-24T10:10:30Z',
    sourceActivityId: 'a820daa0-7841-4c24-8256-756dc5710f22',
  };
  const energy = {
    kilocalories: 200,
    startedAt: result.startedAt,
    endedAt: result.endedAt,
    sourceRecordId: 'c820daa0-7841-4c24-8256-756dc5710f22',
    exerciseIntervals: [interval],
  };
  const value = { ...result, energy };
  assert.deepEqual((await readWorkoutVitals({ get: async () => value }, input)).energy, energy);
  for (const intervals of [
    [interval, interval],
    [{ ...interval, durationSeconds: 31 }],
    [{ ...interval, kilocalories: 201 }],
  ]) {
    await assert.rejects(() =>
      readWorkoutVitals(
        { get: async () => ({ ...value, energy: { ...energy, exerciseIntervals: intervals } }) },
        input,
      ),
    );
  }
});

test('exercise BPM survives without energy and rejects overlapping or invented coverage', async () => {
  const hearts = [
    {
      exerciseId: 'squat',
      averageBpm: 117.5,
      sourceRecordId: '8a20daa0-7841-4c24-8256-756dc5710f22',
      intervals: [{ startedAt: '2026-10-24T10:10:00Z', endedAt: '2026-10-24T10:11:00Z' }],
    },
  ];
  const observed = { ...result, minutes: [], energy: null, exerciseHeartRates: hearts };
  assert.deepEqual(await readWorkoutVitals({ get: async () => observed }, input), observed);
  for (const patch of [
    { availability: 'unrecorded' },
    { exerciseHeartRates: [...hearts, ...hearts] },
    { exerciseHeartRates: [{ ...hearts[0], averageBpm: 401 }] },
    { exerciseHeartRates: [...hearts, { ...hearts[0], exerciseId: 'row' }] },
    {
      exerciseHeartRates: [
        {
          ...hearts[0],
          intervals: [{ startedAt: '2026-10-24T09:00:00Z', endedAt: '2026-10-24T10:11:00Z' }],
        },
      ],
    },
  ]) {
    await assert.rejects(() =>
      readWorkoutVitals({ get: async () => ({ ...observed, ...patch }) }, input),
    );
  }
});
