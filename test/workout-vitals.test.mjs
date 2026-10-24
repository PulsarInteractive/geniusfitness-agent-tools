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
  const server = createMcpServer({
    get: async (name, args) => {
      calls.push([name, args]);
      return name === 'workout-vitals' ? result : { scope: args.scope, id: args.id };
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
