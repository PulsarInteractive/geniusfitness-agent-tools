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

test('unmeasured ResistanceReps retains repetitions while rejecting invented zero or measured mass', async () => {
  const data = fixture(),
    row = data.exercises[0];
  row.exerciseType = 'ResistanceReps';
  for (const observation of [row, ...row.weeks]) {
    observation.loadMeasuredSets = 0;
    observation.volumeMeasuredSets = 0;
  }
  assert.deepEqual(await readMuscleInsights({ get: async () => data }, query), data);
  for (const target of ['row', 'week']) {
    for (const [field, value] of [
      ['recordedVolumeKg', 0],
      ['externalResistanceVolumeKg', 0],
      ['recordedVolumeKg', 20],
      ['loadMeasuredSets', 1],
      ['volumeMeasuredSets', 1],
    ]) {
      const changed = structuredClone(data),
        observation = target === 'row' ? changed.exercises[0] : changed.exercises[0].weeks[0];
      observation[field] = value;
      await assert.rejects(readMuscleInsights({ get: async () => changed }, query), {
        code: 'invalid_response',
      });
    }
  }
  const changed = structuredClone(data);
  changed.exercises[0].maxRecordedWeightKg = 0;
  await assert.rejects(readMuscleInsights({ get: async () => changed }, query), {
    code: 'invalid_response',
  });
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

test('precise muscle evidence survives MCP and rejects impossible or invented structure in one call', async () => {
  const page = fixture();
  page.exercises[0].muscleEvidence = {
    taxonomyVersion: 'fitness-muscle-evidence-v1',
    catalogueVersion: 'a'.repeat(64),
    basis: 'current_catalogue_not_historical',
    targets: [
      {
        id: 'rectus_lower',
        labelFr: 'Grand droit · région inférieure',
        labelEn: 'Rectus · lower region',
        kind: 'region',
        parentId: 'rectus_abdominis',
        role: 'primary',
        rawLabels: ['lower abs'],
      },
    ],
    unmappedLabels: ['ankles'],
  };
  const server = createMcpServer({ get: async () => page });
  const client = new Client({ name: 'muscle-evidence-test', version: '1' });
  const [a, b] = InMemoryTransport.createLinkedPair();
  await server.connect(a);
  await client.connect(b);
  try {
    const reply = await client.callTool({ name: 'fitness_muscle_insights', arguments: query });
    assert.notEqual(reply.isError, true);
    const result = JSON.parse(reply.content.find((row) => row.type === 'text').text);
    assert.deepEqual(result.exercises[0].muscleEvidence, page.exercises[0].muscleEvidence);
    assert.equal(result.exercises[0].sets, 2);
  } finally {
    await client.close();
    await server.close();
  }
  for (const edit of [
    (e) => {
      e.basis = 'measured_activation';
    },
    (e) => {
      e.targets[0].parentId = null;
    },
    (e) => {
      e.targets[0].parentId = e.targets[0].id;
    },
    (e) => {
      e.targets.push({ ...e.targets[0] });
    },
    (e) => {
      e.targets[0].activationPercent = 99;
    },
    (e) => {
      e.catalogueVersion = 'unknown';
    },
    (e) => {
      e.targets.push({ ...e.targets[0], id: 'rectus_upper' });
    },
  ]) {
    const invalid = structuredClone(page);
    edit(invalid.exercises[0].muscleEvidence);
    let calls = 0;
    await assert.rejects(
      readMuscleInsights(
        {
          get: async () => {
            calls++;
            return invalid;
          },
        },
        query,
      ),
      { code: 'invalid_response' },
    );
    assert.equal(calls, 1);
  }
});

const reviewedEvidence = () => ({
  taxonomyVersion: 'fitness-muscle-evidence-v1',
  catalogueVersion: 'a'.repeat(64),
  basis: 'reviewed_catalogue_not_historical',
  sourceContentVersion: 'b'.repeat(64),
  subsetVersion: 'c'.repeat(64),
  targets: [
    {
      id: 'pectoralis_major',
      labelFr: 'Grand pectoral',
      labelEn: 'Pectoralis major',
      kind: 'muscle',
      parentId: 'pectorals',
      role: 'primary',
      rawLabels: ['pectoralis_major'],
    },
    {
      id: 'triceps',
      labelFr: 'Triceps brachial',
      labelEn: 'Triceps brachii',
      kind: 'muscle',
      parentId: null,
      role: 'primary',
      rawLabels: ['triceps'],
    },
    {
      id: 'core',
      labelFr: 'Tronc · groupe non précisé',
      labelEn: 'Core · unspecified group',
      kind: 'group',
      parentId: null,
      role: 'unspecified',
      rawLabels: ['core'],
    },
  ],
  unmappedLabels: [],
});

test('reviewed muscle evidence preserves multiple or unknown roles, optional pins and non-mass through MCP', async () => {
  for (const withPins of [true, false]) {
    const page = fixture();
    const row = page.exercises[0];
    row.exerciseType = 'ResistanceReps';
    row.attribution = 'catalogue';
    row.muscleEvidence = reviewedEvidence();
    if (!withPins) {
      delete row.muscleEvidence.sourceContentVersion;
      delete row.muscleEvidence.subsetVersion;
      row.muscleEvidence.targets = [row.muscleEvidence.targets[2]];
    }
    for (const observation of [row, ...row.weeks]) {
      observation.loadMeasuredSets = 0;
      observation.volumeMeasuredSets = 0;
    }
    const original = structuredClone(page);
    let calls = 0;
    const server = createMcpServer({
      get: async (name, input) => {
        calls++;
        assert.equal(name, 'muscle-insights');
        assert.deepEqual(input, query);
        return page;
      },
    });
    const client = new Client({ name: 'reviewed-muscle-test', version: '1' });
    const [a, b] = InMemoryTransport.createLinkedPair();
    await server.connect(a);
    await client.connect(b);
    try {
      const reply = await client.callTool({ name: 'fitness_muscle_insights', arguments: query });
      assert.notEqual(reply.isError, true);
      const result = JSON.parse(reply.content.find((item) => item.type === 'text').text);
      assert.deepEqual(result, original);
      assert.equal(result.exercises[0].primaryMuscle, null);
      assert.equal(result.exercises[0].externalResistanceVolumeKg, null);
      assert.equal(result.exercises[0].weeks[0].recordedVolumeKg, null);
      assert.equal(result.exercises[0].repetitions, 10);
      assert.equal(calls, 1);
      assert.deepEqual(page, original);
    } finally {
      await client.close();
      await server.close();
    }
  }
});

test('reviewed evidence rejects invented fields, roles, source pins and duplicate targets without retries', async () => {
  for (const edit of [
    (e) => {
      e.targets[0].role = 'stabilizer';
    },
    (e) => {
      e.targets[0].activationPercent = 75;
    },
    (e) => {
      e.targets[0].relativeShare = 50;
    },
    (e) => {
      e.targets.push({ ...e.targets[0] });
    },
    (e) => {
      e.sourceContentVersion = 'unknown';
    },
    (e) => {
      e.subsetVersion = 'D'.repeat(64);
    },
    (e) => {
      e.sourceContentVersion = null;
    },
    (e) => {
      e.historicalActivation = true;
    },
    (e) => {
      e.basis = 'reviewed_historical_activation';
    },
  ]) {
    const page = fixture();
    page.exercises[0].muscleEvidence = reviewedEvidence();
    edit(page.exercises[0].muscleEvidence);
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
      {
        code: 'invalid_response',
      },
    );
    assert.equal(calls, 1);
  }
});
