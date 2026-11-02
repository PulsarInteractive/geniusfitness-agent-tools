import test from 'node:test';
import assert from 'node:assert/strict';
import Ajv from 'ajv';
import catalog from '../src/command-catalog.mjs';
import { randomUUID } from 'node:crypto';
import { validateCommand } from '../src/commands.mjs';

test('run commands preserve unknown altitude separately from measured zero', () => {
  const validCoverage = new Ajv().compile(
    catalog.fieldSchemas['Project/SportRunLog'].elevationCoverage,
  );
  for (const [elevationCoverage, elevationGainMeters] of [
    ['Unavailable', null],
    ['Recorded', 0],
    ['Partial', 12],
    ['Unknown', 35],
  ]) {
    const command = {
      operationId: randomUUID(),
      issuedAt: Date.now(),
      scope: 'project:work',
      epoch: 'epoch',
      id: 'run',
      expectedRevision: null,
      kind: 'run.create',
      data: { elevationCoverage, elevationGainMeters },
    };
    assert.deepEqual(validateCommand(command).data, command.data);
    assert.equal(validCoverage(elevationCoverage), true);
    assert.equal(validCoverage('Accurate'), false);
    assert.throws(() => validateCommand({ ...command, data: { inventedCoverage: 'Recorded' } }));
  }
});
