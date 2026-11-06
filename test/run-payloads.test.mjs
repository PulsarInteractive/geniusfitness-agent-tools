import test from 'node:test';
import assert from 'node:assert/strict';
import { commandHelp } from '../src/fitness.mjs';

test('agent help supplies the actual encoded running prescription and result schemas', () => {
  for (const kind of ['workout.create', 'workout.update', 'run.create', 'run.update']) {
    const help = commandHelp(kind);
    assert.ok(help.encodedRun, `${kind} has no encoded running guidance`);
    assert.equal(help.encodedRun.fields.runPlan.schema.properties.v.const, 1);
    assert.equal(Boolean(help.encodedRun.fields.planProgress), kind.startsWith('run.'));
  }
});

import { randomUUID } from 'node:crypto';
import { Client } from '@modelcontextprotocol/client';
import { InMemoryTransport } from '@modelcontextprotocol/server';
import { createMcpServer } from '../src/mcp.mjs';
import { invalidRunPayload, runPayloadSpec } from '../src/run-payloads.mjs';
import { CommandJournal, validateCommand } from '../src/commands.mjs';
import { main } from '../src/cli.mjs';
import { fixture, origin } from './helpers.mjs';
import Ajv from 'ajv';
const runModule = 'Project/SportRunLog',
  trainingModule = 'Project/SportTraining';
const example = () => runPayloadSpec(runModule).example;
const draft = (data = example()) => ({
  kind: 'run.update',
  scope: 'project:work',
  epoch: 'epoch',
  id: 'run',
  expectedRevision: '1',
  data,
});
const json = JSON.stringify;

test('examples and explicit clearing match the schemas, with no payload invented for ordinary patches', () => {
  for (const module of [runModule, trainingModule]) {
    const spec = runPayloadSpec(module);
    assert.equal(invalidRunPayload(module, spec.example, { create: true }), null);
    for (const [field, rule] of Object.entries(spec.fields)) {
      assert.equal(new Ajv().compile(rule.schema)(JSON.parse(spec.example[field])), true);
    }
    for (const data of [{}, { runPlan: null }, { runPlan: '' }, { notes: 'Rename only' }]) {
      assert.equal(invalidRunPayload(module, data), null);
    }
  }
  assert.equal(
    invalidRunPayload(runModule, { planProgress: example().planProgress }),
    null,
    'stored plan/totals stay server-owned',
  );
  assert.equal(
    invalidRunPayload(trainingModule, { runPlan: runPayloadSpec(trainingModule).example.runPlan }),
    null,
    'stored icon is not guessed',
  );
  assert.equal(runPayloadSpec('Project/SportSessionLog'), null);
  assert.equal(commandHelp('run.delete').encodedRun, undefined);
  assert.equal(commandHelp('workout.copy').encodedRun, undefined);
  assert.equal(commandHelp('workout.sync').encodedRun, undefined);
});

test('encoded running input rejects fabricated fields, targets, totals and completion claims', () => {
  const plan = JSON.parse(example().runPlan);
  for (const raw of [
    '{}',
    'null',
    '[1]',
    '{',
    ' '.repeat(16001),
    json({ ...plan, pace: 120 }),
    json({ ...plan, v: 2 }),
    json({ ...plan, goal: 'hypertrophy' }),
    ...[0, -1, 1.5, '400', Number.POSITIVE_INFINITY].map((target) =>
      json({ ...plan, stages: [{ kind: 'work', unit: 'meters', target }] }),
    ),
    json({ ...plan, stages: [] }),
    json({ ...plan, stages: Array(65).fill(plan.stages[0]) }),
    json({ ...plan, stages: [{ kind: 'easy', unit: 'seconds', target: 86401 }] }),
    json({
      ...plan,
      stages: [
        { kind: 'easy', unit: 'meters', target: 500001 },
        { kind: 'work', unit: 'meters', target: 500000 },
      ],
    }),
    json({ ...plan, stages: [{ ...plan.stages[0], id: 'invented' }] }),
  ]) {
    assert.equal(invalidRunPayload(runModule, { runPlan: raw }), 'runPlan', raw.slice(0, 100));
  }
  for (const data of [
    { ...example(), runPlan: null },
    { ...example(), durationSeconds: 148 },
    { ...example(), distanceMeters: 448 },
    {
      ...example(),
      planProgress: json({
        v: 1,
        stages: [{ outcome: 'reached', distanceMeters: 399, movingSeconds: 120 }],
      }),
    },
    {
      ...example(),
      planProgress: json({
        v: 1,
        stages: [
          { outcome: 'skipped', distanceMeters: 400, movingSeconds: 120 },
          { outcome: 'skipped', distanceMeters: 390, movingSeconds: 121 },
        ],
      }),
    },
    {
      ...example(),
      planProgress: json({
        v: 1,
        stages: [{ outcome: 'done', distanceMeters: 400, movingSeconds: 120 }],
      }),
    },
    {
      ...example(),
      planProgress: json({
        v: 1,
        stages: [{ outcome: 'reached', distanceMeters: '400', movingSeconds: 120 }],
      }),
    },
    {
      ...example(),
      planProgress: json({
        v: 1,
        stages: [
          { outcome: 'skipped', distanceMeters: 0, movingSeconds: Number.POSITIVE_INFINITY },
        ],
      }),
    },
    {
      ...example(),
      planProgress: json({
        v: 1,
        stages: [{ outcome: 'skipped', distanceMeters: 0, movingSeconds: 0, bpm: 130 }],
      }),
    },
    {
      ...example(),
      planProgress: json({
        v: 1,
        stages: Array(3).fill({ outcome: 'skipped', distanceMeters: 0, movingSeconds: 0 }),
      }),
    },
  ]) {
    assert.equal(invalidRunPayload(runModule, data), 'planProgress');
  }
  assert.equal(
    invalidRunPayload(runModule, { planProgress: example().planProgress }, { create: true }),
    'planProgress',
  );
  assert.equal(
    invalidRunPayload(trainingModule, { ...runPayloadSpec(trainingModule).example, icon: 'other' }),
    'runPlan',
  );
  assert.throws(
    () =>
      validateCommand({
        ...draft({ runPlan: '{}' }),
        operationId: randomUUID(),
        issuedAt: Date.now(),
      }),
    { code: 'invalid_arguments' },
  );
});

test('CLI and local MCP expose the same bounded guidance; journal preparation keeps supplied JSON bytes', async (t) => {
  const f = await fixture(t, () =>
    assert.fail('Help and local preparation must not query account data'),
  );
  let out = '',
    err = '';
  const code = await main(
    ['commands', 'describe', '--kind', 'run.update', '--origin', origin, '--allow-local', '--json'],
    {
      directory: f.directory,
      fetchImpl: f.transport.fetch,
      stdout: { write: (s) => (out += s) },
      stderr: { write: (s) => (err += s) },
    },
  );
  assert.equal(code, 0, err);
  assert.deepEqual(JSON.parse(out).data.encodedRun, commandHelp('run.update').encodedRun);
  const server = createMcpServer(f.client),
    client = new Client({ name: 'run-codec-test', version: '1' });
  const [a, b] = InMemoryTransport.createLinkedPair();
  await server.connect(a);
  await client.connect(b);
  try {
    const help = await client.callTool({
      name: 'fitness_command_help',
      arguments: { kind: 'run.update' },
    });
    assert.deepEqual(help.structuredContent.data.encodedRun, commandHelp('run.update').encodedRun);
    const good = draft({
      ...example(),
      runPlan: JSON.stringify(JSON.parse(example().runPlan), null, 2),
    });
    const prepared = await client.callTool({ name: 'fitness_prepare_command', arguments: good });
    assert.notEqual(prepared.isError, true);
    const saved = await new CommandJournal(f.client).inspect(
      prepared.structuredContent.data.operationId,
    );
    assert.deepEqual(saved.request.data, good.data);
    const bad = await client.callTool({
      name: 'fitness_prepare_command',
      arguments: draft({ runPlan: '{}' }),
    });
    assert.equal(bad.isError, true);
  } finally {
    await client.close();
    await server.close();
  }
});
