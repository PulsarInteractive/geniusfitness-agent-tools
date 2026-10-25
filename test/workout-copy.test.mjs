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
};
test('workout previews require an exact source/destination and immutable content fingerprints', async () => {
  assert.deepEqual(
    await readWorkoutCopyPreview(
      {
        get: async (name, input) => {
          assert.equal(name, 'workout-copy-preview');
          assert.deepEqual(input, query);
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
