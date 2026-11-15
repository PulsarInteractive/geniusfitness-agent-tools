import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { writeFile, lstat, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { Client } from '@modelcontextprotocol/client';
import { InMemoryTransport } from '@modelcontextprotocol/server';
import {
  previewExerciseReplacement,
  validateExerciseReplacementConfirmation,
  validExerciseReplacementReceipt,
} from '../src/exercise-replacement.mjs';
import contract from '../src/exercise-replacement-contract.mjs';
import remoteTools from '../remote/tool-catalog.json' with { type: 'json' };
import { CommandJournal } from '../src/commands.mjs';
import { createMcpServer } from '../src/mcp.mjs';
import { main } from '../src/cli.mjs';
import { credentials } from '../src/client.mjs';
import { fixture, tokens, origin } from './helpers.mjs';
import { connectFixtureMcp } from './fixtures/mcp-connection.mjs';

// Synthetic contract fixtures. Real Worker/hosted acceptance is product-owned.
const request = () => ({
  requestId: randomUUID(),
  scope: 'project:own',
  trainingId: 'routine',
  slotId: 'slot',
  oldExerciseId: 'old',
  newExerciseId: 'new',
  locale: 'fr',
});
const confirmation = (r = request()) => ({
  action: 'confirm',
  request: r,
  epoch: 'epoch',
  expectedRevision: '8',
  preparedAt: 100,
  previewKey: 'a'.repeat(64),
});
const preview = (r) => ({
  state: 'review',
  reason: 'review',
  request: r,
  sourceKey: 'b'.repeat(64),
  key: 'a'.repeat(64),
  epoch: 'epoch',
  expectedRevision: '8',
  preparedAt: 100,
  expiresAt: 300100,
  readyToStart: false,
  trace: [{ nodeId: 'review', state: 'end' }],
  diff: {
    before: {
      elementId: 'old',
      name: 'Ancien mouvement',
      exerciseType: 'WeightReps',
      sourceUnit: 'kg',
      targetSets: '[{"t":"n","r":8,"w":27.75}]',
      restSeconds: 60,
      order: 2,
      snapshotMode: 'copied_definition',
    },
    after: {
      elementId: 'new',
      name: 'Nouveau mouvement',
      exerciseType: 'BodyweightReps',
      sourceUnit: 'none',
      targetSets: '[]',
      restSeconds: 60,
      order: 2,
      snapshotMode: 'copied_definition',
    },
    cleared: ['targetSets', 'old_snapshot'],
    retained: ['slot_identity', 'routine', 'order', 'rest_timer'],
    prescriptionStatus: 'requires_configuration',
    doseEquivalenceEstablished: false,
  },
});
const receipt = (c) => ({
  state: 'replaced',
  scope: c.request.scope,
  trainingId: c.request.trainingId,
  slotId: c.request.slotId,
  elementId: c.request.newExerciseId,
  mutationId: `replace-exercise:${c.request.requestId}`,
  epoch: c.epoch,
  cursor: '9',
  revision: '9',
  prescriptionStatus: 'requires_configuration',
});

test('replacement preview performs one POST and preserves localized source and explicit reset without writing a journal', async (t) => {
  const r = request(),
    sent = [],
    value = preview(r);
  const f = await fixture(t, async (url, options) => {
    sent.push(JSON.parse(options.body));
    assert.equal(url.pathname, '/api/agents/v1/exercise-replacement/preview');
    assert.equal(options.method, 'POST');
    return Response.json(value);
  });
  assert.deepEqual(await previewExerciseReplacement(f.client, r), value);
  assert.deepEqual(sent, [r]);
  assert.ok(!(await readdir(f.directory)).includes('operations'));
  for (const [state, reason] of [
    ['unchanged', 'unchanged'],
    ['blocked', 'active_session'],
    ['blocked', 'definition_unconfigured'],
    ['blocked', 'duplicate_element'],
    ['blocked', 'source_unavailable'],
  ]) {
    Object.assign(value, { state, reason, key: null, diff: null });
    assert.deepEqual(await previewExerciseReplacement(f.client, r), value);
  }
  assert.equal(sent.length, 6);
});

test('replacement preview binds all request fields, reset and state, and never follows an invalid reply', async (t) => {
  const r = request();
  let value,
    calls = 0;
  const f = await fixture(t, async () => {
    calls++;
    return Response.json(value);
  });
  const changes = [
    ...Object.keys(r).map((key) => (v) => {
      v.request[key] = key === 'locale' ? 'en' : key === 'requestId' ? randomUUID() : 'foreign';
    }),
    (v) => (v.diff.before.elementId = 'foreign'),
    (v) => (v.diff.after.elementId = 'foreign'),
    (v) => (v.diff.after.targetSets = '[{"r":8}]'),
    (v) => v.diff.after.order++,
    (v) => v.diff.after.restSeconds++,
    (v) => (v.diff.cleared = []),
    (v) => (v.key = null),
    (v) => (v.diff = null),
    (v) => (v.reason = 'unchanged'),
    (v) => (v.state = 'blocked'),
    (v) => (v.expiresAt = 99),
    (v) => (v.preparedAt = Number.MAX_SAFE_INTEGER + 1),
    (v) => (v.readyToStart = true),
    (v) => (v.diff.doseEquivalenceEstablished = true),
    (v) => (v.privateSource = {}),
  ];
  for (const change of changes) {
    value = preview(structuredClone(r));
    change(value);
    await assert.rejects(previewExerciseReplacement(f.client, r), { code: 'invalid_response' });
  }
  assert.equal(calls, changes.length);
});

test('strict UUID, closed fields and exact timestamps reject malformed requests before network or journal creation', async (t) => {
  let calls = 0;
  const f = await fixture(t, async () => {
    calls++;
    throw Error('must not send');
  });
  for (const patch of [
    { requestId: 'not-a-uuid' },
    { requestId: '00000000-0000-4000-8000-000000000001-extra' },
    { scope: 'personal:owner' },
    { ownerId: 'foreign' },
    { athleteId: 'student' },
    { targetSets: '[]' },
    { snapshot: {} },
    { delegation: {} },
    { locale: 'de' },
  ]) {
    await assert.rejects(previewExerciseReplacement(f.client, { ...request(), ...patch }), {
      code: 'invalid_arguments',
    });
  }
  const c = confirmation();
  assert.deepEqual(validateExerciseReplacementConfirmation(c), c);
  for (const patch of [
    { preparedAt: 1.2 },
    { preparedAt: Number.MAX_SAFE_INTEGER + 1 },
    { request: { ...c.request, requestId: 'bad' } },
    { action: 'replace' },
    { authority: 'user_confirmation' },
    { targetSets: '[]' },
    { expectedRevision: null },
  ]) {
    await assert.rejects(
      new CommandJournal(f.client).confirmExerciseReplacement({ ...c, ...patch }),
      { code: 'invalid_arguments' },
    );
  }
  assert.equal(calls, 0);
  assert.ok(!(await readdir(f.directory)).includes('operations'));
});

test('lost reply is durably journaled before send and resumes the identical expired confirmation after restart', async (t) => {
  const c = confirmation(),
    sent = [];
  let journal;
  const f = await fixture(t, async (url, options) => {
    assert.equal(url.pathname, '/api/agents/v1/exercise-replacement/confirm');
    sent.push(options.body);
    const row = await journal.inspect(c.request.requestId);
    assert.equal(row.state, 'uncertain');
    assert.deepEqual(row.request, c);
    if (sent.length === 1) {
      throw Error('reply lost');
    }
    return Response.json(receipt(c));
  });
  journal = new CommandJournal(f.client);
  await assert.rejects(journal.confirmExerciseReplacement(c), { code: 'network_unavailable' });
  const saved = await journal.inspect(c.request.requestId);
  assert.equal(saved.protocol, 'exercise_replacement');
  assert.equal(saved.state, 'uncertain');
  assert.equal((await lstat(journal.store(c.request.requestId).path)).mode & 0o777, 0o600);
  journal = new CommandJournal(f.client);
  assert.equal((await journal.retry(c.request.requestId)).source, 'server');
  assert.equal((await journal.retry(c.request.requestId)).source, 'local_receipt');
  assert.equal(sent.length, 2);
  assert.equal(sent[0], sent[1]);
  assert.deepEqual(JSON.parse(sent[1]), c);
  await assert.rejects(journal.confirmExerciseReplacement({ ...c, preparedAt: 101 }), {
    code: 'idempotency_mismatch',
  });
  await f.store.locked(() =>
    f.store.write(credentials({ ...tokens(), profile_id: 'another' }, origin)),
  );
  await assert.rejects(journal.retry(c.request.requestId), { code: 'operation_identity_mismatch' });
  assert.equal(sent.length, 2);
});

test('foreign or malformed replacement receipts remain uncertain and never establish a local success', async (t) => {
  const c = confirmation();
  let value;
  const f = await fixture(t, async () => Response.json(value));
  const journal = new CommandJournal(f.client);
  const changes = [
    ...['scope', 'trainingId', 'slotId', 'elementId', 'epoch', 'mutationId'].map(
      (key) => (v) => (v[key] = 'foreign'),
    ),
    (v) => (v.state = 'configured'),
    (v) => (v.prescriptionStatus = 'configured'),
    (v) => (v.privateAuthority = {}),
    (v) => delete v.revision,
  ];
  for (const change of changes) {
    value = receipt(c);
    change(value);
    assert.equal(validExerciseReplacementReceipt(value, c), false);
    await assert.rejects(journal.confirmExerciseReplacement(c), { code: 'invalid_response' });
    assert.equal((await journal.inspect(c.request.requestId)).state, 'uncertain');
  }
  assert.equal(validExerciseReplacementReceipt(receipt(c), c), true);
});

test('replacement UUID cannot cross generic or previous typed protocol journals', async (t) => {
  const c = confirmation();
  const f = await fixture(t, async () => Response.json(receipt(c)));
  const journal = new CommandJournal(f.client);
  await journal.confirmExerciseReplacement(c);
  await assert.rejects(
    journal.execute({
      operationId: c.request.requestId,
      issuedAt: 100,
      scope: c.request.scope,
      epoch: c.epoch,
      id: 'slot',
      expectedRevision: '8',
      kind: 'workout.exercise.update',
      data: { restSeconds: 90 },
    }),
    { code: 'idempotency_mismatch' },
  );
  await assert.rejects(
    journal.confirmSessionSkip({
      request: {
        representationVersion: 1,
        operationId: c.request.requestId,
        action: 'skip',
        target: {
          scope: c.request.scope,
          athleteId: 'owner',
          trainingId: 'routine',
          taskId: 'task',
        },
      },
      epoch: c.epoch,
      decisionRevision: 0,
      expectedRevision: null,
      preparedAt: 100,
      previewKey: 'a'.repeat(64),
    }),
    { code: 'idempotency_mismatch' },
  );
  assert.equal((await journal.inspect(c.request.requestId)).protocol, 'exercise_replacement');
});

test('CLI preview/confirm/retry and local MCP use the same contract and destructive reset annotations', async (t) => {
  const r = request(),
    c = confirmation(r),
    sent = [];
  const f = await fixture(t, async (url, options) => {
    sent.push({ path: url.pathname, body: JSON.parse(options.body) });
    return Response.json(url.pathname.endsWith('/preview') ? preview(r) : receipt(c));
  });
  const file = join(f.directory, 'input.json');
  const run = async (args, value) => {
    await writeFile(file, JSON.stringify(value));
    const out = [],
      err = [];
    const code = await main(
      [...args, '--file', file, '--origin', origin, '--allow-local', '--json'],
      {
        directory: f.directory,
        fetchImpl: f.transport.fetch,
        stdout: { write: (v) => out.push(v) },
        stderr: { write: (v) => err.push(v) },
      },
    );
    assert.equal(code, 0, err.join(''));
    assert.equal(err.join(''), '');
    return JSON.parse(out.join('')).data;
  };
  assert.deepEqual(await run(['workouts', 'replace-exercise-preview'], r), preview(r));
  assert.equal((await run(['workouts', 'replace-exercise-confirm'], c)).source, 'server');
  const server = createMcpServer(f.client),
    client = new Client({ name: 'replacement-test', version: '1' }),
    [a, b] = InMemoryTransport.createLinkedPair();
  try {
    await Promise.all([server.connect(a), client.connect(b)]);
    const { tools } = await client.listTools();
    for (const [name, key, write] of [
      ['fitness_exercise_replacement_preview', 'Request', false],
      ['fitness_exercise_replacement_confirm', 'Confirmation', true],
    ]) {
      const tool = tools.find((v) => v.name === name),
        remote = remoteTools.find((v) => v.name === name);
      assert.ok(tool);
      assert.equal(tool.annotations.readOnlyHint, !write);
      assert.equal(tool.annotations.destructiveHint, write);
      assert.equal(tool.annotations.idempotentHint, true);
      assert.deepEqual(remote.inputSchema, contract[key]);
      assert.deepEqual(remote.scopes, ['programs:read', 'programs:write', 'exercises:read']);
    }
    const result = await client.callTool({
      name: 'fitness_exercise_replacement_confirm',
      arguments: c,
    });
    assert.equal(result.isError, undefined);
    assert.equal(result.structuredContent.data.source, 'local_receipt');
    assert.equal(sent.length, 2);
    const rejected = await client.callTool({
      name: 'fitness_exercise_replacement_preview',
      arguments: { ...r, requestId: 'invalid' },
    });
    assert.equal(rejected.isError, true);
    assert.equal(sent.length, 2);
  } finally {
    await client.close();
    await server.close();
  }
});

test('real stdio MCP roundtrip preserves complete confirmation and emits protocol JSON only', async (t) => {
  const r = request(),
    c = confirmation(r),
    sent = [];
  const server = createServer(async (req, res) => {
    let text = '';
    for await (const chunk of req) {
      text += chunk;
    }
    sent.push({ path: req.url, body: JSON.parse(text) });
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(req.url.endsWith('/preview') ? preview(r) : receipt(c)));
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const serverOrigin = `http://127.0.0.1:${server.address().port}`,
    f = await fixture(t, () => {
      throw Error('unused');
    });
  await f.store.locked(() => f.store.write(credentials(tokens(), serverOrigin)));
  const connection = await connectFixtureMcp(f.directory, serverOrigin);
  try {
    const p = await connection.client.callTool({
      name: 'fitness_exercise_replacement_preview',
      arguments: r,
    });
    assert.equal(p.isError, undefined);
    assert.deepEqual(p.structuredContent.data, preview(r));
    const first = await connection.client.callTool({
      name: 'fitness_exercise_replacement_confirm',
      arguments: c,
    });
    assert.equal(first.isError, undefined);
    assert.deepEqual(first.structuredContent.data.receipt, receipt(c));
    const replay = await connection.client.callTool({
      name: 'fitness_retry_command',
      arguments: { operationId: r.requestId },
    });
    assert.equal(replay.isError, undefined);
    assert.equal(replay.structuredContent.data.source, 'local_receipt');
    assert.deepEqual(sent, [
      { path: '/api/agents/v1/exercise-replacement/preview', body: r },
      { path: '/api/agents/v1/exercise-replacement/confirm', body: c },
    ]);
    assert.equal(connection.diagnostics(), '');
  } finally {
    await connection.client.close();
  }
});
