import test from 'node:test';
import assert from 'node:assert/strict';
import { readWorkoutCopyPreview, commandHelp } from '../src/fitness.mjs';
const query = {
  sourceScope: 'project:catalog',
  sourceTraining: 'source',
  targetScope: 'project:student',
};
const response = {
  ...query,
  sourceName: 'Force',
  sourceFingerprint: 'a'.repeat(64),
  targetTraining: null,
  targetFingerprint: null,
  targetRevision: null,
  targetEpoch: 'epoch',
  changed: true,
  exerciseCount: 2,
  comparison: { version: 1, legacy: false, items: [] },
};
test('workout previews require an exact source/destination and immutable content fingerprints', async () => {
  assert.deepEqual(
    await readWorkoutCopyPreview(
      {
        get: async (name, input) => {
          assert.equal(name, 'workout-copy-preview');
          assert.deepEqual(input, { ...query, comparisonVersion: '1' });
          return response;
        },
      },
      query,
    ),
    response,
  );
  for (const patch of [
    { targetScope: 'project:catalog' },
    { sourceScope: 'personal:coach' },
    { allResources: true },
  ]) {
    await assert.rejects(
      readWorkoutCopyPreview(
        { get: () => assert.fail('invalid query must not send') },
        { ...query, ...patch },
      ),
      { code: 'invalid_arguments' },
    );
  }
  for (const patch of [
    { targetScope: 'project:other' },
    { sourceFingerprint: 'changed' },
    { targetTraining: 'unexpected' },
    { targetRevision: '3' },
  ]) {
    await assert.rejects(
      readWorkoutCopyPreview({ get: async () => ({ ...response, ...patch }) }, query),
      { code: 'invalid_response' },
    );
  }
  const sync = {
    ...response,
    targetTraining: 'copy',
    targetFingerprint: 'b'.repeat(64),
    targetRevision: '3',
  };
  assert.deepEqual(
    await readWorkoutCopyPreview({ get: async () => sync }, { ...query, targetTraining: 'copy' }),
    sync,
  );
});
test('comparison preserves field decisions and rejects missing, oversized or contradictory reviews', async () => {
  const item = {
    kind: 'exercise',
    sourceId: 'source-slot',
    targetId: 'copied-slot',
    title: 'Squat',
    action: 'update',
    updatedFields: ['targetSets'],
    retainedFields: ['restSeconds'],
    conflictFields: ['restSeconds'],
  };
  const read = (comparison) =>
    readWorkoutCopyPreview({ get: async () => ({ ...response, comparison }) }, query);
  for (const legacy of [false, true]) {
    const comparison = { version: 1, legacy, items: [item] };
    assert.deepEqual((await read(comparison)).comparison, comparison);
  }
  for (const comparison of [
    undefined,
    { version: 2, legacy: false, items: [] },
    { version: 1, legacy: false, items: Array(203).fill(item) },
    ...[
      { kind: 'unknown' },
      { action: 'overwrite' },
      { updatedFields: ['health'] },
      { title: 'x'.repeat(161) },
      { retainedFields: ['restSeconds', 'restSeconds'] },
      { updatedFields: ['restSeconds'] },
      { conflictFields: ['exercise'] },
      { sourceId: '' },
      { privateHealth: 123 },
    ].map((patch) => ({ version: 1, legacy: false, items: [{ ...item, ...patch }] })),
  ]) {
    await assert.rejects(read(comparison), { code: 'invalid_response' });
  }
});
test('copy and sync expose only source and confirmation fields, never forged origin or private content', () => {
  const create = commandHelp('workout.copy'),
    sync = commandHelp('workout.sync');
  assert.deepEqual(create.fields, ['sourceScope', 'sourceTraining', 'sourceFingerprint']);
  assert.deepEqual(sync.fields, [
    'sourceScope',
    'sourceTraining',
    'sourceFingerprint',
    'targetFingerprint',
  ]);
  assert.equal(create.create, true);
});

test('running targets participate in the complete seven-field workout comparison', async () => {
  const fields = [
    'name',
    'description',
    'icon',
    'estimatedMinutes',
    'mode',
    'capMinutes',
    'runPlan',
  ];
  const comparison = {
    version: 1,
    legacy: false,
    items: [
      {
        kind: 'workout',
        sourceId: 'source',
        targetId: 'target',
        title: 'Intervals',
        action: 'update',
        updatedFields: fields,
        retainedFields: [],
        conflictFields: [],
      },
    ],
  };
  const value = await readWorkoutCopyPreview(
    { get: async () => ({ ...response, comparison }) },
    query,
  );
  assert.deepEqual(value.comparison.items[0].updatedFields, fields);
});
