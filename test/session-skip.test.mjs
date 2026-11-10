import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { writeFile, lstat } from 'node:fs/promises';
import { join } from 'node:path';
import { Client } from '@modelcontextprotocol/client';
import { InMemoryTransport } from '@modelcontextprotocol/server';
import {
  sessionSkipRequestSchema,
  validateSessionSkipConfirmation,
  previewSessionSkip,
  validSessionSkipReceipt,
} from '../src/session-skip.mjs';
import { CommandJournal } from '../src/commands.mjs';
import { credentials } from '../src/client.mjs';
import { createMcpServer } from '../src/mcp.mjs';
import { main } from '../src/cli.mjs';
import { fixture, tokens, origin } from './helpers.mjs';
import wire from './fixtures/session-skip-wire.mjs';

const request = (action = 'skip') => ({
  representationVersion: 1,
  operationId: randomUUID(),
  action,
  target: {
    scope: 'project:work',
    athleteId: 'owner',
    trainingId: 'workout:template:0',
    taskId: 'occurrence:next',
  },
});
const confirmation = (r = request()) => ({
  request: r,
  epoch: 'epoch-current',
  decisionRevision: 0,
  expectedRevision: null,
  preparedAt: 1794300000000,
  previewKey: 'a'.repeat(64),
});
const receipt = (c) => ({
  representationVersion: 1,
  target: c.request.target,
  epoch: c.epoch,
  cursor: 'cursor:opaque',
  revision: 'revision:opaque',
  mutationId: `session-skip:${c.request.operationId}`,
  decision: {
    disposition: c.request.action === 'skip' ? 'skipped' : 'restored',
    target: c.request.target,
    startsAt: '2026-11-11T10:00:00Z',
    operationId: c.request.operationId,
    actorId: 'owner',
    decidedAt: c.preparedAt + 1,
    sourceVersion: 'b'.repeat(64),
  },
});
const preview = (r) => ({
  representationVersion: 1,
  state: 'review',
  reason: 'review',
  request: r,
  epoch: 'epoch-current',
  decisionRevision: 0,
  expectedRevision: null,
  preparedAt: 1794300000000,
  expiresAt: 1794300300000,
  startsAt: '2026-11-11T10:00:00Z',
  sourceVersion: 'b'.repeat(64),
  key: 'a'.repeat(64),
  decision: null,
});

// These are transport fixtures, not claims about hosted permission enforcement.
test('strict canonical protocol preserves template IDs, opaque revisions and explicit null; rejects authority extras', () => {
  const c = confirmation();
  c.request.target.trainingId = 't'.repeat(245) + ':template:0';
  c.request.target.taskId = 'é'.repeat(256);
  c.expectedRevision = 'opaque:revision-' + 'x'.repeat(112);
  assert.deepEqual(validateSessionSkipConfirmation(c), c);
  const { expectedRevision, ...absent } = c;
  assert.equal(expectedRevision.length, 128);
  for (const v of [
    absent,
    { ...c, epoch: '' },
    { ...c, actorId: 'forged' },
    { ...c, preparedAt: -1 },
    { ...c, previewKey: null },
    { ...c, decisionRevision: 2147483648 },
    { ...c, expectedRevision: 'x'.repeat(129) },
    { ...c, request: { ...c.request, representationVersion: 2 } },
    { ...c, request: { ...c.request, operationId: '../unsafe' } },
    {
      ...c,
      request: { ...c.request, target: { ...c.request.target, trainingId: 'x'.repeat(257) } },
    },
  ]) {
    assert.throws(() => validateSessionSkipConfirmation(v), { code: 'invalid_arguments' });
  }
  assert.equal(
    sessionSkipRequestSchema.safeParse({ ...c.request, operationId: undefined }).success,
    false,
  );
  assert.equal(sessionSkipRequestSchema.safeParse({ ...c.request, action: 'done' }).success, false);
});

test('preview makes exactly one authorized request, preserves blocked unknown and never confirms', async (t) => {
  const r = request();
  let calls = 0;
  const blocked = {
    ...preview(r),
    state: 'blocked',
    reason: 'activity_unknown',
    key: null,
    startsAt: null,
  };
  const f = await fixture(t, async (url, options) => {
    calls++;
    assert.equal(url.pathname, '/api/agents/v1/session-skip/preview');
    assert.deepEqual(JSON.parse(options.body), r);
    return Response.json(blocked);
  });
  assert.deepEqual(await previewSessionSkip(f.client, r), blocked);
  assert.equal(calls, 1);
  await assert.rejects(new CommandJournal(f.client).inspect(r.operationId), {
    code: 'operation_not_found',
  });
});

test('preview rejects substituted request, authority fields and inconsistent review state; historical training remains descriptive', async (t) => {
  const r = request();
  let response = preview(r);
  const f = await fixture(t, async () => Response.json(response));
  for (const bad of [
    { ...response, request: request() },
    { ...response, key: null },
    { ...response, expiresAt: response.preparedAt - 1 },
    { ...response, privateClaim: {} },
    { ...response, state: 'blocked' },
    {
      ...response,
      decision: {
        ...receipt(confirmation(r)).decision,
        target: { ...r.target, athleteId: 'foreign' },
      },
    },
  ]) {
    response = bad;
    await assert.rejects(previewSessionSkip(f.client, r), { code: 'invalid_response' });
  }
  response = {
    ...preview(r),
    decision: {
      ...receipt(confirmation(r)).decision,
      target: { ...r.target, trainingId: 'old-workout' },
    },
  };
  assert.deepEqual(await previewSessionSkip(f.client, r), response);
});

test('lost confirmation reply uses existing private journal, immutable protocol and exact replay after expiry', async (t) => {
  const c = confirmation();
  const sent = [];
  const f = await fixture(t, async (url, options) => {
    assert.equal(url.pathname, '/api/agents/v1/session-skip/confirm');
    sent.push(JSON.parse(options.body));
    if (sent.length === 1) {
      throw new Error('lost reply after commit');
    }
    return Response.json(receipt(c));
  });
  let invalidations = 0;
  f.client.invalidateReads = () => invalidations++;
  const journal = new CommandJournal(f.client);
  await assert.rejects(
    journal.confirmSessionSkip(c),
    (e) =>
      e.code === 'network_unavailable' &&
      e.details.execution === 'unknown' &&
      e.details.operationId === c.request.operationId,
  );
  assert.equal((await lstat(journal.store(c.request.operationId).path)).mode & 0o777, 0o600);
  const saved = await journal.inspect(c.request.operationId);
  assert.equal(saved.protocol, 'session_skip');
  assert.equal(saved.state, 'uncertain');
  assert.deepEqual(saved.request, c);
  const restarted = new CommandJournal(f.client);
  assert.equal((await restarted.retry(c.request.operationId)).source, 'server');
  assert.equal((await restarted.retry(c.request.operationId)).source, 'local_receipt');
  assert.deepEqual(sent, [c, c]);
  assert.equal(invalidations, 4);
  await assert.rejects(restarted.confirmSessionSkip({ ...c, previewKey: 'c'.repeat(64) }), {
    code: 'idempotency_mismatch',
  });
  assert.equal(sent.length, 2);
});

test('confirmation receipt must bind action, operation, epoch and complete target; malformed success stays uncertain', async (t) => {
  const c = confirmation(),
    good = receipt(c);
  const mutations = [
    { ...good, epoch: 'other' },
    { ...good, mutationId: 'other' },
    { ...good, target: { ...good.target, taskId: 'other' } },
    { ...good, decision: { ...good.decision, operationId: randomUUID() } },
    { ...good, decision: { ...good.decision, disposition: 'restored' } },
    { ...good, decision: { ...good.decision, target: { ...good.target, trainingId: 'other' } } },
    { ...good, privateClaim: {} },
  ];
  const f = await fixture(t, async () => Response.json(mutations.shift()));
  const journal = new CommandJournal(f.client);
  while (mutations.length) {
    await assert.rejects(journal.confirmSessionSkip(c), { code: 'invalid_response' });
    assert.equal((await journal.inspect(c.request.operationId)).state, 'uncertain');
  }
  assert.equal(validSessionSkipReceipt(good, c), true);
});

test('definitive conflict and unavailable server never refresh a preview or silently replace the operation', async (t) => {
  const c = confirmation();
  const sent = [];
  let status = 409;
  const f = await fixture(t, async (url, options) => {
    sent.push({ path: url.pathname, input: JSON.parse(options.body) });
    return Response.json(
      { error: { code: 'revision_conflict', message: 'Read current state.', retryable: false } },
      { status },
    );
  });
  const journal = new CommandJournal(f.client);
  await assert.rejects(
    journal.confirmSessionSkip(c),
    (e) => e.status === 409 && e.details.execution === 'unknown',
  );
  status = 503;
  await assert.rejects(journal.retry(c.request.operationId), (e) => e.status === 503);
  assert.deepEqual(sent, Array(2).fill({ path: '/api/agents/v1/session-skip/confirm', input: c }));
  assert.deepEqual((await journal.inspect(c.request.operationId)).request, c);
});

test('session confirmation cannot cross connection, profile or session, or collide with a legacy protocol UUID', async (t) => {
  const c = confirmation();
  let calls = 0;
  const f = await fixture(t, async () => {
    calls++;
    return Response.json(receipt(c));
  });
  const journal = new CommandJournal(f.client);
  await journal.confirmSessionSkip(c);
  const legacy = {
    operationId: c.request.operationId,
    issuedAt: c.preparedAt,
    scope: c.request.target.scope,
    epoch: c.epoch,
    id: 'new-task',
    kind: 'planning.create',
    expectedRevision: null,
    data: { title: 'Training', owner: 'owner' },
  };
  await assert.rejects(journal.execute(legacy), { code: 'idempotency_mismatch' });
  for (const field of ['profile_id', 'connection_id', 'session_id']) {
    await f.store.locked(() =>
      f.store.write(credentials({ ...tokens(), [field]: 'replacement' }, origin)),
    );
    await assert.rejects(journal.retry(c.request.operationId), {
      code: 'operation_identity_mismatch',
    });
  }
  assert.equal(calls, 1);
  await f.store.locked(() => f.store.write(credentials(tokens(), origin)));
  const prepared = await journal.prepare({
    scope: legacy.scope,
    epoch: legacy.epoch,
    id: legacy.id,
    kind: legacy.kind,
    expectedRevision: null,
    data: legacy.data,
  });
  await assert.rejects(
    journal.confirmSessionSkip(confirmation({ ...c.request, operationId: prepared.operationId })),
    { code: 'idempotency_mismatch' },
  );
});

test('old skip receipt remains historical after restore and a fresh preview observes the later state', async (t) => {
  const skip = confirmation(),
    restore = confirmation({ ...skip.request, operationId: randomUUID(), action: 'restore' });
  let current = null;
  const paths = [];
  const f = await fixture(t, async (url, options) => {
    paths.push(url.pathname);
    const input = JSON.parse(options.body);
    if (url.pathname.endsWith('/preview')) {
      return Response.json({ ...preview(input), decision: current });
    }
    current = receipt(input).decision;
    return Response.json(receipt(input));
  });
  const journal = new CommandJournal(f.client);
  await journal.confirmSessionSkip(skip);
  await journal.confirmSessionSkip(restore);
  const historical = await journal.retry(skip.request.operationId);
  assert.equal(historical.source, 'local_receipt');
  assert.equal(historical.receipt.decision.disposition, 'skipped');
  assert.equal((await previewSessionSkip(f.client, request())).decision.disposition, 'restored');
  assert.equal(paths.length, 3);
  const row = await journal.store(skip.request.operationId).read();
  await journal
    .store(skip.request.operationId)
    .write({ ...row, receipt: { ...row.receipt, epoch: 'tampered' } });
  await assert.rejects(journal.retry(skip.request.operationId), { code: 'invalid_response' });
  assert.equal(paths.length, 3);
});

test('CLI preview/confirm and existing inspect/retry dispatch the canonical protocol without UUID regeneration', async (t) => {
  const r = request();
  const paths = [];
  const f = await fixture(t, async (url, options) => {
    paths.push(url.pathname);
    const input = JSON.parse(options.body);
    return Response.json(url.pathname.endsWith('/preview') ? preview(input) : receipt(input));
  });
  const path = join(f.directory, 'session.json');
  let stdout = '',
    stderr = '';
  const run = async (args) => {
    stdout = '';
    stderr = '';
    const code = await main([...args, '--origin', origin, '--allow-local', '--json'], {
      directory: f.directory,
      fetchImpl: f.transport.fetch,
      stdout: {
        write: (s) => {
          stdout += s;
        },
      },
      stderr: {
        write: (s) => {
          stderr += s;
        },
      },
    });
    assert.equal(code, 0, stderr);
    return JSON.parse(stdout).data;
  };
  await writeFile(path, JSON.stringify(r));
  assert.deepEqual(await run(['sessions', 'skip-preview', '--file', path]), preview(r));
  await writeFile(path, JSON.stringify(confirmation(r)));
  assert.equal((await run(['sessions', 'skip-confirm', '--file', path])).source, 'server');
  assert.equal(
    (await run(['commands', 'inspect', '--operation', r.operationId])).protocol,
    'session_skip',
  );
  assert.equal(
    (await run(['commands', 'retry', '--operation', r.operationId])).source,
    'local_receipt',
  );
  assert.equal(paths.length, 2);
});

test('local MCP exposes exact read/write annotations, no defaults and shared retry/inspect', async (t) => {
  const r = request();
  let calls = 0;
  const f = await fixture(t, async (url, options) => {
    calls++;
    const input = JSON.parse(options.body);
    return Response.json(url.pathname.endsWith('/preview') ? preview(input) : receipt(input));
  });
  const server = createMcpServer(f.client),
    client = new Client({ name: 'session-skip-test', version: '1' });
  const [a, b] = InMemoryTransport.createLinkedPair();
  await Promise.all([client.connect(a), server.connect(b)]);
  try {
    const list = (await client.listTools()).tools;
    const p = list.find((t) => t.name === 'fitness_session_skip_preview'),
      c = list.find((t) => t.name === 'fitness_session_skip_confirm');
    assert.equal(p.annotations.readOnlyHint, true);
    assert.equal(p.annotations.destructiveHint, false);
    assert.equal(c.annotations.readOnlyHint, false);
    assert.equal(c.annotations.destructiveHint, false);
    assert.equal(c.annotations.idempotentHint, true);
    assert.ok(p.inputSchema.required.includes('operationId'));
    assert.ok(p.inputSchema.required.includes('representationVersion'));
    assert.equal(
      (await client.callTool({ name: p.name, arguments: r })).structuredContent.data.state,
      'review',
    );
    assert.equal(
      (await client.callTool({ name: c.name, arguments: confirmation(r) })).structuredContent.data
        .source,
      'server',
    );
    assert.equal(
      (
        await client.callTool({
          name: 'fitness_retry_command',
          arguments: { operationId: r.operationId },
        })
      ).structuredContent.data.source,
      'local_receipt',
    );
    assert.equal(
      (
        await client.callTool({
          name: 'fitness_inspect_operation',
          arguments: { operationId: r.operationId },
        })
      ).structuredContent.data.protocol,
      'session_skip',
    );
    assert.equal(
      (await client.callTool({ name: p.name, arguments: { ...r, operationId: undefined } }))
        .isError,
      true,
    );
    assert.equal(calls, 2);
  } finally {
    await client.close();
    await server.close();
  }
});

test('real synthetic hosted Worker DTOs pass the local preview and durable confirmation paths unchanged', async (t) => {
  const sent = [];
  const f = await fixture(t, async (url, options) => {
    const input = JSON.parse(options.body);
    sent.push(input);
    return Response.json(url.pathname.endsWith('/preview') ? wire.preview : wire.result);
  });
  assert.deepEqual(await previewSessionSkip(f.client, wire.request), wire.preview);
  assert.deepEqual(validateSessionSkipConfirmation(wire.confirmation), wire.confirmation);
  assert.equal(validSessionSkipReceipt(wire.result, wire.confirmation), true);
  const journal = new CommandJournal(f.client);
  assert.deepEqual(await journal.confirmSessionSkip(wire.confirmation), {
    source: 'server',
    receipt: wire.result,
  });
  assert.deepEqual(await journal.retry(wire.request.operationId), {
    source: 'local_receipt',
    receipt: wire.result,
  });
  assert.deepEqual(sent, [wire.request, wire.confirmation]);
});
