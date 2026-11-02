import test from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/client';
import { InMemoryTransport } from '@modelcontextprotocol/server';
import { createMcpServer } from '../src/mcp.mjs';
import { readMuscleInsights } from '../src/fitness.mjs';
const query = { scope: 'project:training', from: '2026-10-01', until: '2026-10-24' };
const fixture = () => ({
  ...query,
  athleteId: 'owner',
  epoch: 'epoch',
  checkpoint: '4',
  availableFrom: '2024-10-24',
  timezone: 'UTC',
  premiumOnly: true,
  methodology: 'Explicit units',
  loadUnitPolicy: 'explicit_kg_lb_v1',
  nextAfter: null,
  exercises: [
    {
      exerciseId: 'row',
      name: 'Row',
      catalogKey: null,
      primaryMuscle: null,
      secondaryMuscles: [],
      attribution: 'unmapped',
      exerciseType: 'WeightReps',
      weightConvention: 'total',
      sets: 2,
      sessions: 1,
      repetitions: 10,
      recordedVolumeKg: null,
      maxRecordedWeightKg: null,
      loadMeasuredSets: 1,
      volumeMeasuredSets: 1,
      externalResistanceVolumeKg: null,
      exerciseSeconds: 0,
      timedSets: 0,
      recordedSetElapsedSeconds: null,
      restMeasuredSets: 0,
      recordedRestSeconds: null,
      lastTrained: '2026-10-24',
      weeks: [
        {
          week: '2026-10-19',
          sets: 2,
          repetitions: 10,
          recordedVolumeKg: null,
          loadMeasuredSets: 1,
          volumeMeasuredSets: 1,
          externalResistanceVolumeKg: null,
          exerciseSeconds: 0,
        },
      ],
    },
  ],
});
test('new muscle responses preserve incomplete coverage, complete normalized values and explicit zero', async () => {
  const partial = fixture();
  assert.deepEqual(await readMuscleInsights({ get: async () => partial }, query), partial);
  const complete = fixture();
  const row = complete.exercises[0];
  Object.assign(row, {
    loadMeasuredSets: 2,
    volumeMeasuredSets: 2,
    recordedVolumeKg: 45.359237,
    maxRecordedWeightKg: 4.5359237,
    externalResistanceVolumeKg: 45.359237,
  });
  Object.assign(row.weeks[0], {
    loadMeasuredSets: 2,
    volumeMeasuredSets: 2,
    recordedVolumeKg: 45.359237,
    externalResistanceVolumeKg: 45.359237,
  });
  assert.deepEqual(await readMuscleInsights({ get: async () => complete }, query), complete);
  Object.assign(row, {
    recordedVolumeKg: 0,
    maxRecordedWeightKg: 0,
    externalResistanceVolumeKg: 0,
  });
  Object.assign(row.weeks[0], { recordedVolumeKg: 0, externalResistanceVolumeKg: 0 });
  assert.equal(
    (await readMuscleInsights({ get: async () => complete }, query)).exercises[0].recordedVolumeKg,
    0,
  );
});
test('impossible coverage and partial nonzero volume are rejected without another request', async () => {
  for (const patch of [
    { loadMeasuredSets: 3 },
    { volumeMeasuredSets: 2 },
    { recordedVolumeKg: 999 },
    { externalResistanceVolumeKg: 999 },
    { maxRecordedWeightKg: 60 },
    { loadMeasuredSets: undefined },
  ]) {
    const page = fixture();
    Object.assign(page.exercises[0], patch);
    let calls = 0;
    await assert.rejects(
      readMuscleInsights(
        {
          get: async () => {
            calls++;
            return page;
          },
        },
        query,
      ),
      { code: 'invalid_response' },
    );
    assert.equal(calls, 1);
  }
  const page = fixture();
  page.exercises[0].weeks[0].volumeMeasuredSets = 9;
  await assert.rejects(readMuscleInsights({ get: async () => page }, query), {
    code: 'invalid_response',
  });
});
test('real MCP transport removes legacy kg claims while preserving sets and source identity', async () => {
  const page = fixture();
  delete page.loadUnitPolicy;
  Object.assign(page.exercises[0], {
    recordedVolumeKg: 1000,
    maxRecordedWeightKg: 100,
    externalResistanceVolumeKg: 2000,
  });
  Object.assign(page.exercises[0].weeks[0], {
    recordedVolumeKg: 1000,
    externalResistanceVolumeKg: 2000,
  });
  const original = structuredClone(page);
  let calls = 0;
  const server = createMcpServer({
    get: async (name, args) => {
      calls++;
      assert.equal(name, 'muscle-insights');
      assert.deepEqual(args, query);
      return page;
    },
  });
  const client = new Client({ name: 'unit-test', version: '1' });
  const [a, b] = InMemoryTransport.createLinkedPair();
  await server.connect(a);
  await client.connect(b);
  try {
    const tool = await client.callTool({ name: 'fitness_muscle_insights', arguments: query });
    assert.notEqual(tool.isError, true);
    const output = JSON.parse(tool.content.find((row) => row.type === 'text').text);
    const row = output.exercises[0];
    assert.equal(row.recordedVolumeKg, null);
    assert.equal(row.maxRecordedWeightKg, null);
    assert.equal(row.externalResistanceVolumeKg, null);
    assert.equal(row.weeks[0].recordedVolumeKg, null);
    assert.equal(row.sets, 2);
    assert.equal(output.checkpoint, page.checkpoint);
    assert.equal(output.scope, page.scope);
    assert.match(output.methodology, /unverified/);
    assert.deepEqual(page, original);
    assert.equal(calls, 1);
  } finally {
    await client.close();
    await server.close();
  }
});
