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

test('localized edits expose generated fields and preserve exact partial overrides without translating source', () => {
  const sourceFingerprint = 'a'.repeat(64);
  const fields = {
    contentLocale: 'en',
    localizations: [
      {
        locale: 'fr-FR',
        sourceFingerprint,
        text: { name: 'Rowing avec appui', movementIntent: 'Ramène le coude vers ta hanche.' },
      },
      { locale: 'nl', sourceFingerprint, text: { description: 'Steun met je vrije hand.' } },
    ],
  };
  const input = { ...command(fields), kind: 'exercise.update', expectedRevision: '5' };
  const original = JSON.stringify(input);
  assert.deepEqual(validateCommand(input).data, fields);
  assert.equal(JSON.stringify(input), original);
  assert.equal(input.data.localizations[1].text.name, undefined);
  const help = commandHelp('exercise.update');
  assert.equal(help.dataSchema.properties.localizations.anyOf[0].maxItems, 16);
  assert.match(help.customExercise.localization, /sourceFingerprint/);
  assert.equal(help.dataSchema.properties.contentSourceFingerprint, undefined);
  for (const localizations of [null, []]) {
    const value = { ...input, data: { contentLocale: null, localizations } };
    assert.deepEqual(validateCommand(value).data, value.data);
  }
});

test('malformed locale collections are rejected before journaling without inventing fingerprints', () => {
  const entry = {
    locale: 'fr',
    sourceFingerprint: 'a'.repeat(64),
    text: { name: 'Rowing avec appui' },
  };
  const bad = [
    { contentLocale: 'fr_FR' },
    { contentLocale: 'fr-u-nu-latn' },
    { contentLocale: 5 },
    { contentSourceFingerprint: 'a'.repeat(64) },
    { localizations: {} },
    { localizations: Array(17).fill(entry) },
    { localizations: [entry, { ...entry, locale: 'FR' }] },
    { localizations: [{ ...entry, sourceFingerprint: 'A'.repeat(64) }] },
    { localizations: [{ ...entry, sourceFingerprint: 'short' }] },
    { localizations: [{ ...entry, text: {} }] },
    { localizations: [{ ...entry, text: { name: null } }] },
    { localizations: [{ ...entry, text: { name: 'x' } }] },
    { localizations: [{ ...entry, text: { description: 'x'.repeat(4001) } }] },
    { localizations: [{ ...entry, text: { movementIntent: 'x'.repeat(281) } }] },
    { localizations: [{ ...entry, text: { description: null, movementIntent: '  ' } }] },
    { localizations: [{ ...entry, text: { name: 'Row\u0000ing' } }] },
    { localizations: [{ ...entry, text: { weight: 40 } }] },
    { localizations: [{ ...entry, role: 'reviewed' }] },
  ];
  for (const fields of bad) {
    assert.throws(
      () => validateCommand({ ...command(fields), kind: 'exercise.update', expectedRevision: '5' }),
      { code: 'invalid_arguments' },
    );
  }
});
