import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { validateCommand } from '../src/commands.mjs';
import { commandHelp } from '../src/fitness.mjs';
const data = {
  name: 'Custom pull',
  description: 'Use the available support.',
  movementIntent: 'Bring elbows toward your hips.',
  declaredMuscleContributions: {
    qualification: 'declared_estimate',
    targets: [
      { targetId: 'lats', role: 'primary', relativeShare: 70 },
      { targetId: 'biceps', role: 'secondary' },
    ],
  },
};
const command = (fields = data) => ({
  operationId: randomUUID(),
  issuedAt: 0,
  scope: 'personal:owner',
  epoch: 'epoch',
  id: 'custom',
  expectedRevision: null,
  kind: 'exercise.create',
  data: fields,
});
test('custom command declares estimates explicitly and publishes canonical target vocabulary', () => {
  assert.deepEqual(validateCommand(command()).data, data);
  const help = commandHelp('exercise.create');
  assert.equal(help.customExercise.qualification, 'declared_estimate');
  assert.ok(
    help.customExercise.targets.some(
      (node) => node.id === 'rectus_upper' && node.parentId === 'rectus_abdominis',
    ),
  );
  assert.equal(help.dataSchema.properties.description.anyOf[0].maxLength, 4000);
  assert.equal(help.dataSchema.properties.movementIntent.anyOf[0].maxLength, 280);
});
test('custom writes preserve omission and explicit null without fabricated shares', () => {
  const input = {
    ...command({ description: null, movementIntent: null, declaredMuscleContributions: null }),
    kind: 'exercise.update',
    expectedRevision: '1',
  };
  assert.deepEqual(validateCommand(input).data, input.data);
  assert.deepEqual(validateCommand(command({ name: 'Legacy movement' })).data, {
    name: 'Legacy movement',
  });
  assert.equal(
    validateCommand(command()).data.declaredMuscleContributions.targets[1].relativeShare,
    undefined,
  );
});
test('forged provenance and invalid allocation cannot reach the network', () => {
  const invalid = [
    { ...data, catalogueOrigin: { qualification: 'reviewed_subset' } },
    { ...data, description: 'x'.repeat(4001) },
    ...[
      { qualification: 'reviewed', targets: [] },
      { qualification: 'declared_estimate', targets: [{ targetId: 'fake', role: 'primary' }] },
      {
        qualification: 'declared_estimate',
        targets: [
          { targetId: 'core', role: 'primary', relativeShare: 60 },
          { targetId: 'rectus_upper', role: 'secondary', relativeShare: 40 },
        ],
      },
      {
        qualification: 'declared_estimate',
        targets: [
          { targetId: 'lats', role: 'primary', relativeShare: 60 },
          { targetId: 'biceps', role: 'secondary', relativeShare: 41 },
        ],
      },
      {
        qualification: 'declared_estimate',
        targets: [{ targetId: 'lats', role: 'primary', relativeShare: 0 }],
      },
    ].map((declaredMuscleContributions) => ({ ...data, declaredMuscleContributions })),
  ];
  for (const fields of invalid) {
    assert.throws(() => validateCommand(command(fields)), { code: 'invalid_arguments' });
  }
});
