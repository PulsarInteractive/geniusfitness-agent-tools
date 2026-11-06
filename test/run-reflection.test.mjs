import test from 'node:test';
import assert from 'node:assert/strict';
import Ajv from 'ajv';
import { randomUUID } from 'node:crypto';
import { commandHelp } from '../src/fitness.mjs';
import { validateCommand } from '../src/commands.mjs';
import { workflow } from '../src/workflows.mjs';
import catalog from '../src/command-catalog.mjs';

test('run context schemas preserve missing versus zero and reject invalid observations', () => {
  const ajv = new Ajv({ formats: { int32: true } });
  for (const kind of ['run.create', 'run.update']) {
    const fields = commandHelp(kind).dataSchema.properties;
    const effort = ajv.compile(fields.perceivedEffort);
    const terrain = ajv.compile(fields.terrain);
    for (const value of [null, 0, 6, 10]) {
      assert.equal(effort(value), true);
    }
    for (const value of [-1, 11, 1.5, '6', false]) {
      assert.equal(effort(value), false);
    }
    for (const value of [null, 'Road', 'Trail', 'Track', 'Treadmill', 'Mixed']) {
      assert.equal(terrain(value), true);
    }
    assert.equal(terrain('guessed from pace'), false);
    const command = {
      operationId: randomUUID(),
      issuedAt: Date.now(),
      scope: 'project:work',
      epoch: 'epoch',
      id: 'run',
      expectedRevision: kind === 'run.create' ? null : '1',
      kind,
      data: { perceivedEffort: 0, terrain: null, notes: 'Wind' },
    };
    assert.deepEqual(validateCommand(command).data, command.data);
    assert.throws(() =>
      validateCommand({ ...command, data: { ...command.data, creator: 'student' } }),
    );
    assert.throws(() =>
      validateCommand({ ...command, data: { ...command.data, polyline: 'private' } }),
    );
  }
  assert.ok(catalog.collections.runs.fields.includes('perceivedEffort'));
  assert.ok(catalog.collections.runs.fields.includes('terrain'));
  assert.equal(catalog.collections.runs.permission, 'metrics:read');
});

test('running guidance keeps athlete observations, identity, location and bounded reads distinct', () => {
  const guide = workflow({ topic: 'running' });
  const text = guide.steps.join(' ');
  assert.match(text, /Never derive effort/);
  assert.match(text, /coach cannot declare a student's feeling/);
  assert.match(text, /Keep operationId and the complete command unchanged/);
  assert.match(text, /Standard run.create\/run.update reject GPS fields/);
  assert.match(text, /Each page is a charged bounded read/);
  assert.ok(JSON.stringify(guide).length < 10000);
});
