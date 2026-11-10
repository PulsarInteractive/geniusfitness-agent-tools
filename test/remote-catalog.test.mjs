import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import Ajv from 'ajv';
import sessionWire from './fixtures/session-skip-wire.mjs';
const tools = JSON.parse(await readFile(new URL('../remote/tool-catalog.json', import.meta.url)));
test('remote catalogue has bounded explicit schemas and honest write annotations', () => {
  assert.equal(new Set(tools.map((t) => t.name)).size, tools.length);
  const ajv = new Ajv({ strict: false });
  for (const tool of tools) {
    assert.match(tool.name, /^(tasker|fitness)_[a-z_]+$/);
    assert.ok(tool.title && tool.description);
    assert.equal(tool.inputSchema.type, 'object');
    assert.equal(tool.inputSchema.additionalProperties, false);
    ajv.compile(tool.inputSchema);
    if (tool.write) {
      assert.equal(tool.destructive, tool.name !== 'fitness_session_skip_confirm');
    }
    assert.ok(!tool.route || /^[a-z]+(?:[-/][a-z]+)*$/.test(tool.route));
  }
  const execute = tools.find((t) => t.name.endsWith('_execute_command'));
  assert.equal(execute.write, true);
  const validate = ajv.compile(execute.inputSchema);
  assert.equal(validate({}), false);
  assert.equal(validate({ url: 'https://example.com' }), false);
  const prepare = tools.find((t) => t.name.endsWith('_prepare_command'));
  assert.ok(!prepare.write);
  assert.deepEqual(
    execute.inputSchema.properties.kind.enum,
    prepare.inputSchema.properties.kind.enum,
  );
  assert.ok(!tools.some((t) => /upload|local|profile|permission/.test(t.name)));
});

test('every command can request its exact permission without unrelated write grants', async () => {
  const { default: catalog } = await import('../src/command-catalog.mjs');
  for (const [kind, command] of Object.entries(catalog.commands)) {
    const tool = tools.find(
      (candidate) =>
        candidate.name.includes('_edit_') &&
        candidate.inputSchema.properties.kind.enum.includes(kind),
    );
    assert.ok(tool, kind);
    assert.deepEqual(tool.scopes, [command.permission], kind);
    assert.equal(tool.route, 'commands');
    for (const accepted of tool.inputSchema.properties.kind.enum) {
      assert.equal(catalog.commands[accepted].permission, command.permission);
    }
    const validate = new Ajv({ strict: false }).compile(tool.inputSchema);
    const input = {
      operationId: '00000000-0000-4000-8000-000000000001',
      issuedAt: 1,
      kind,
      scope: 'project:example',
      id: 'record',
      epoch: 'epoch',
      expectedRevision: null,
      data: {},
    };
    assert.equal(validate(input), true, kind);
    const other = Object.keys(catalog.commands).find(
      (name) => catalog.commands[name].permission !== command.permission,
    );
    assert.equal(validate({ ...input, kind: other }), false, `${kind} must reject ${other}`);
  }
  for (const tool of tools.filter((candidate) => candidate.name.includes('_coach_'))) {
    if (
      ['fitness_coach_push', 'fitness_coach_intents', 'fitness_coach_intent_target'].includes(
        tool.name,
      )
    ) {
      assert.deepEqual(tool.scopes, ['planning:read']);
      assert.equal(
        tool.route,
        {
          fitness_coach_push: 'coach-push',
          fitness_coach_intents: 'coach-intents',
          fitness_coach_intent_target: 'coach-intent-target',
        }[tool.name],
      );
      assert.ok(!tool.write);
    } else {
      assert.ok(tool.scopes.includes('coaching:write'));
      assert.equal(tool.route, 'commands');
      assert.equal(tool.write, true);
    }
  }
});

test('precise route tools require location consent and ordinary run commands exclude geometry', async () => {
  const { default: catalog } = await import('../src/command-catalog.mjs');
  assert.ok(!catalog.grants.defaultPermissions.some((p) => p.startsWith('location:')));
  assert.equal(catalog.collections.runRoutes.permission, 'location:read');
  assert.equal(catalog.collections.runRoutes.creatorOnly, true);
  assert.equal(catalog.commands['run.route.update'].permission, 'location:write');
  assert.equal(catalog.commands['run.route.update'].creatorOnly, true);
  for (const kind of ['run.create', 'run.update']) {
    for (const field of ['polyline', 'routeSegments']) {
      assert.ok(!catalog.commands[kind].fields.includes(field));
    }
  }
  for (const field of ['polyline', 'routeSegments']) {
    assert.ok(!catalog.collections.runs.fields.includes(field));
  }
  assert.deepEqual(tools.find((t) => t.name === 'fitness_read_locations').scopes, [
    'location:read',
  ]);
  assert.deepEqual(tools.find((t) => t.name === 'fitness_edit_locations').scopes, [
    'location:write',
  ]);
  assert.ok(
    !tools
      .find((t) => t.name === 'fitness_coach_metrics')
      .inputSchema.properties.kind.enum.includes('run.route.update'),
  );
});

test('canonical session-skip tools remain typed, strictly authorized and separate from generic commands', () => {
  const preview = tools.find((t) => t.name === 'fitness_session_skip_preview');
  const confirm = tools.find((t) => t.name === 'fitness_session_skip_confirm');
  for (const [tool, route, write, input] of [
    [preview, 'session-skip/preview', false, sessionWire.request],
    [confirm, 'session-skip/confirm', true, sessionWire.confirmation],
  ]) {
    assert.equal(tool.route, route);
    assert.equal(tool.write, write);
    assert.equal(tool.destructive, false);
    assert.deepEqual(tool.scopes, ['planning:write']);
    const validate = new Ajv({ strict: false }).compile(tool.inputSchema);
    assert.equal(validate(input), true, JSON.stringify(validate.errors));
    assert.equal(validate({ ...input, actorId: 'forged' }), false);
    assert.equal(validate({}), false);
  }
  const validatePreview = new Ajv({ strict: false }).compile(preview.inputSchema);
  const { operationId, ...missingId } = sessionWire.request;
  assert.ok(operationId);
  assert.equal(validatePreview(missingId), false);
  const validateConfirm = new Ajv({ strict: false }).compile(confirm.inputSchema);
  const { expectedRevision, ...missingRevision } = sessionWire.confirmation;
  assert.equal(expectedRevision, null);
  assert.equal(validateConfirm(missingRevision), false);
  assert.equal(
    validateConfirm({ ...sessionWire.confirmation, expectedRevision: 'opaque:revision' }),
    true,
  );
  assert.equal(
    validateConfirm({
      ...sessionWire.confirmation,
      request: { ...sessionWire.request, action: 'Done' },
    }),
    false,
  );
});
