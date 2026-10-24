import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { validateCommand, CommandJournal } from '../src/commands.mjs';
import { commandHelp } from '../src/fitness.mjs';
import { invalidSetPayload } from '../src/set-payloads.mjs';
import { fixture } from './helpers.mjs';

const draft = (data) => ({
  scope: 'project:program',
  epoch: 'epoch',
  id: 'slot',
  expectedRevision: '1',
  kind: 'workout.exercise.update',
  data,
});
const command = (data) => ({ ...draft(data), operationId: randomUUID(), issuedAt: Date.now() });

test('set help exposes the actual encoded schema and partial update semantics', () => {
  const help = commandHelp('workout.exercise.update');
  assert.equal(help.encodedSets.property, 'targetSets');
  assert.deepEqual(help.encodedSets.fields.t.values, ['n', 'w', 'f', 'd']);
  assert.equal(help.encodedSets.fields.r.kind, 'integer');
  assert.equal(commandHelp('session.update').encodedSets.property, 'performedSets');
  assert.equal(commandHelp('workout.delete').encodedSets, undefined);
  assert.match(help.workflow, /omission preserves/);
});
test('CLI and MCP command validation rejects invalid JSON facts before transmission', () => {
  for (const targetSets of [
    '{}',
    '[null]',
    '[{"r":"8"}]',
    '[{"r":1.5}]',
    '[{"w":-20}]',
    '[{"bpm":120}]',
    '[{"t":"unknown"}]',
  ]) {
    assert.throws(() => validateCommand(command({ targetSets })), { code: 'invalid_arguments' });
  }
  for (const targetSets of ['[]', '[{}]', '[{"w":60,"r":8,"rest":90}]', null]) {
    assert.equal(validateCommand(command({ targetSets })).data.targetSets, targetSets);
  }
  assert.deepEqual(validateCommand(command({ restSeconds: 60 })).data, { restSeconds: 60 });
});
test('performed sets preserve circuit identities and reject duplicate or fabricated observations', () => {
  const module = 'Project/SportSessionLog';
  for (const performedSets of [
    '[{"ex":"squat","i":1},{"ex":"squat","i":1}]',
    '[{"ex":"squat","i":1,"kcal":40}]',
  ]) {
    assert.equal(invalidSetPayload(module, { performedSets }), 'performedSets');
  }
  assert.equal(
    invalidSetPayload(module, {
      performedSets: '[{"ex":"squat","i":1,"rd":1},{"ex":"squat","i":1,"rd":2}]',
    }),
    null,
  );
  assert.equal(invalidSetPayload(module, { notes: 'Only this field changes' }), null);
});
test('bad preparation never calls the network or creates a valid operation', async (t) => {
  let calls = 0;
  const f = await fixture(t, async () => {
    calls++;
    throw new Error('Unexpected network');
  });
  await assert.rejects(new CommandJournal(f.client).prepare(draft({ targetSets: 'not JSON' })), {
    code: 'invalid_arguments',
  });
  assert.equal(calls, 0);
});
