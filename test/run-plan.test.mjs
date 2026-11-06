import { test } from 'node:test';
import assert from 'node:assert/strict';
import { commandHelp } from '../src/fitness.mjs';
import catalog from '../src/command-catalog.mjs';

test('CLI and MCP expose the running prescription and measured outcomes without location permissions', () => {
  for (const kind of ['workout.create', 'workout.update', 'run.create', 'run.update']) {
    const help = commandHelp(kind);
    assert.ok(help.fields.includes('runPlan'));
    const schema = help.dataSchema.properties.runPlan;
    assert.equal(schema.anyOf[0].maxLength, 16000);
    assert.equal(schema.anyOf[0].type, 'string');
  }
  assert.ok(commandHelp('run.update').fields.includes('planProgress'));
  assert.ok(catalog.collections.runs.fields.includes('runPlan'));
  assert.ok(catalog.collections.workouts.fields.includes('runPlan'));
  assert.equal(catalog.collections.runs.permission, 'metrics:read');
  assert.equal(catalog.collections.runRoutes.permission, 'location:read');
  assert.ok(!catalog.collections.runs.fields.includes('polyline'));
});
