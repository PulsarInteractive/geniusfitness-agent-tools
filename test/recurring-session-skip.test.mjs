import wire from './fixtures/recurring-session-skip-wire.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { writeFile, lstat } from 'node:fs/promises';
import { join } from 'node:path';
import { Client } from '@modelcontextprotocol/client';
import { InMemoryTransport } from '@modelcontextprotocol/server';
import {
  recurringSessionSkipRequestSchema,
  validateRecurringSessionSkipConfirmation,
  previewRecurringSessionSkip,
  validRecurringSessionSkipReceipt,
} from '../src/recurring-session-skip.mjs';
import contract from '../src/recurring-session-skip-contract.mjs';
import remoteTools from '../remote/tool-catalog.json' with { type: 'json' };
import { CommandJournal } from '../src/commands.mjs';
import { createMcpServer } from '../src/mcp.mjs';
import { main } from '../src/cli.mjs';
import { credentials } from '../src/client.mjs';
import { fixture, tokens, origin } from './helpers.mjs';

const request = () => ({
  representationVersion: 1,
  operationId: randomUUID(),
  target: {
    scope: 'project:work',
    athleteId: 'owner',
    trainingId: 'training:template:0',
    scheduleId: 'schedule:weekly',
  },
});
const confirmation = (r = request()) => ({
  request: r,
  scheduleRevision: 'revision:opaque',
  occurrenceKey: '20261111T100000Z',
  session: {
    request: {
      representationVersion: 1,
      operationId: r.operationId,
      action: 'skip',
      target: {
        scope: r.target.scope,
        athleteId: r.target.athleteId,
        trainingId: r.target.trainingId,
        taskId: 'session-occurrence:synthetic',
      },
    },
    epoch: 'epoch-current',
    decisionRevision: 0,
    expectedRevision: null,
    preparedAt: 1794300000000,
    previewKey: 'a'.repeat(64),
  },
});
const preview = (r) => {
  const c = confirmation(r);
  return {
    representationVersion: 1,
    request: r,
    state: 'review',
    reason: 'review',
    occurrenceKey: c.occurrenceKey,
    session: {
      ...c.session,
      representationVersion: 1,
      previewKey: undefined,
      key: c.session.previewKey,
      state: 'review',
      reason: 'review',
      expiresAt: c.session.preparedAt + 300000,
      startsAt: '2026-11-11T10:00:00Z',
      sourceVersion: 'b'.repeat(64),
      decision: null,
    },
    confirmation: c,
  };
};
const wirePreview = (r) => JSON.parse(JSON.stringify(preview(r)));
const receipt = (c) => ({
  representationVersion: 1,
  request: c.request,
  occurrenceKey: c.occurrenceKey,
  session: {
    representationVersion: 1,
    target: c.session.request.target,
    epoch: c.session.epoch,
    cursor: 'cursor:opaque',
    revision: 'revision:opaque',
    mutationId: `session-recurrence-skip:${c.request.operationId}`,
    decision: {
      disposition: 'skipped',
      target: c.session.request.target,
      startsAt: '2026-11-11T10:00:00Z',
      operationId: c.request.operationId,
      actorId: 'owner',
      decidedAt: c.session.preparedAt + 1,
      sourceVersion: 'b'.repeat(64),
    },
  },
});

// These local transport fixtures do not establish backend authorization.
test('generated strict recurring inputs preserve explicit null and opaque IDs, reject missing and forged authority', () => {
  const c = confirmation();
  c.request.target.scheduleId = 'é'.repeat(256);
  c.scheduleRevision = 'opaque:revision';
  assert.deepEqual(validateRecurringSessionSkipConfirmation(c), c);
  const missing = structuredClone(c);
  delete missing.session.expectedRevision;
  for (const bad of [
    missing,
    { ...c, actorId: 'forged' },
    { ...c, taskId: 'invented' },
    { ...c, request: { ...c.request, operationId: 'invalid' } },
    { ...c, session: { ...c.session, request: { ...c.session.request, action: 'restore' } } },
    {
      ...c,
      session: { ...c.session, request: { ...c.session.request, operationId: randomUUID() } },
    },
    {
      ...c,
      session: {
        ...c.session,
        request: {
          ...c.session.request,
          target: { ...c.session.request.target, trainingId: 'foreign' },
        },
      },
    },
  ]) {
    assert.throws(() => validateRecurringSessionSkipConfirmation(bad), {
      code: 'invalid_arguments',
    });
  }
  assert.equal(
    recurringSessionSkipRequestSchema.safeParse({
      ...c.request,
      target: { ...c.request.target, taskId: 'invented' },
    }).success,
    false,
  );
  assert.equal(
    recurringSessionSkipRequestSchema.safeParse({ ...c.request, representationVersion: undefined })
      .success,
    false,
  );
  for (const [name, key] of [
    ['fitness_recurring_session_skip_preview', 'Request'],
    ['fitness_recurring_session_skip_confirm', 'Confirmation'],
  ]) {
    assert.deepEqual(remoteTools.find((t) => t.name === name).inputSchema, contract[key]);
  }
});

test('materialized and blocked previews make one read, retain exact server target and never create journal or confirm', async (t) => {
  const r = request();
  let response = wirePreview(r);
  let calls = 0;
  const f = await fixture(t, async (url, options) => {
    calls++;
    assert.equal(url.pathname, '/api/agents/v1/session-skip/recurring/preview');
    assert.deepEqual(JSON.parse(options.body), r);
    return Response.json(response);
  });
  response = {
    ...response,
    state: 'materialized',
    reason: 'already_materialized',
    confirmation: null,
  };
  response.session.request.target.taskId = 'legacy:canonical:task';
  assert.deepEqual(await previewRecurringSessionSkip(f.client, r), response);
  response = { ...response, state: 'blocked', reason: 'lookup_incomplete', session: null };
  assert.deepEqual(await previewRecurringSessionSkip(f.client, r), response);
  assert.equal(calls, 2);
  await assert.rejects(new CommandJournal(f.client).inspect(r.operationId), {
    code: 'operation_not_found',
  });
});

test('recurring preview rejects request, target, key, nullable and review inconsistencies without follow-up calls', async (t) => {
  const r = request(),
    good = wirePreview(r);
  let response;
  const f = await fixture(t, async () => Response.json(response));
  for (const bad of [
    { ...good, request: request() },
    { ...good, confirmation: null },
    { ...good, session: null },
    { ...good, occurrenceKey: null },
    { ...good, privateLedger: {} },
    { ...good, state: 'materialized' },
    {
      ...good,
      session: {
        ...good.session,
        request: {
          ...good.session.request,
          target: { ...good.session.request.target, athleteId: 'foreign' },
        },
      },
    },
    { ...good, confirmation: { ...good.confirmation, occurrenceKey: '20261112T100000Z' } },
    { ...good, session: { ...good.session, key: 'c'.repeat(64) } },
    { ...good, session: { ...good.session, expiresAt: 0 } },
    { ...good, state: 'blocked', reason: 'lookup_incomplete', confirmation: null },
  ]) {
    response = bad;
    await assert.rejects(previewRecurringSessionSkip(f.client, r), { code: 'invalid_response' });
  }
});

test('lost reply restarts and replays the same typed confirmation in the original journal and identity', async (t) => {
  const c = confirmation(),
    sent = [];
  const f = await fixture(t, async (url, options) => {
    assert.equal(url.pathname, '/api/agents/v1/session-skip/recurring/confirm');
    sent.push(JSON.parse(options.body));
    if (sent.length === 1) {
      throw new Error('lost reply after commit');
    }
    return Response.json(receipt(c));
  });
  const journal = new CommandJournal(f.client);
  await assert.rejects(
    journal.confirmRecurringSessionSkip(c),
    (e) => e.code === 'network_unavailable' && e.details.execution === 'unknown',
  );
  assert.equal((await lstat(journal.store(c.request.operationId).path)).mode & 0o777, 0o600);
  const saved = await journal.inspect(c.request.operationId);
  assert.equal(saved.protocol, 'recurring_session_skip');
  assert.equal(saved.state, 'uncertain');
  assert.deepEqual(saved.request, c);
  const restarted = new CommandJournal(f.client);
  assert.equal((await restarted.retry(c.request.operationId)).source, 'server');
  assert.equal((await restarted.retry(c.request.operationId)).source, 'local_receipt');
  assert.deepEqual(sent, [c, c]);
  await assert.rejects(
    restarted.confirmRecurringSessionSkip({ ...c, scheduleRevision: 'changed' }),
    { code: 'idempotency_mismatch' },
  );
  await assert.rejects(restarted.confirmSessionSkip(c.session), { code: 'idempotency_mismatch' });
  for (const field of ['profile_id', 'connection_id', 'session_id']) {
    await f.store.locked(() =>
      f.store.write(credentials({ ...tokens(), [field]: 'replacement' }, origin)),
    );
    await assert.rejects(restarted.retry(c.request.operationId), {
      code: 'operation_identity_mismatch',
    });
  }
  assert.equal(sent.length, 2);
});

test('recursive receipt binding rejects foreign cycle, schedule, epoch, action, task and protocol; stays uncertain', async (t) => {
  const c = confirmation(),
    good = receipt(c);
  let response;
  const f = await fixture(t, async () => Response.json(response));
  const journal = new CommandJournal(f.client);
  for (const patch of [
    (r) => (r.request.target.scheduleId = 'foreign'),
    (r) => (r.occurrenceKey = '20261112T100000Z'),
    (r) => (r.session.epoch = 'foreign'),
    (r) => (r.session.decision.operationId = randomUUID()),
    (r) => (r.session.target.taskId = 'foreign'),
    (r) => (r.session.decision.target.trainingId = 'foreign'),
    (r) => (r.session.decision.disposition = 'restored'),
    (r) => (r.session.mutationId = `session-skip:${c.request.operationId}`),
    (r) => (r.privateLedger = {}),
  ]) {
    response = structuredClone(good);
    patch(response);
    assert.equal(validRecurringSessionSkipReceipt(response, c), false);
    await assert.rejects(journal.confirmRecurringSessionSkip(c), { code: 'invalid_response' });
    assert.equal((await journal.inspect(c.request.operationId)).state, 'uncertain');
  }
  assert.equal(validRecurringSessionSkipReceipt(good, c), true);
});

test('HTTP refusals after send preserve uncertainty and never refresh UUID/preview or retry automatically', async (t) => {
  const c = confirmation();
  let status = 403;
  const sent = [];
  const f = await fixture(t, async (url, options) => {
    sent.push([url.pathname, JSON.parse(options.body)]);
    return Response.json(
      { error: { code: 'unavailable', message: 'Cannot proceed.' } },
      { status },
    );
  });
  const journal = new CommandJournal(f.client);
  for (const next of [403, 409, 503]) {
    status = next;
    await assert.rejects(
      journal.confirmRecurringSessionSkip(c),
      (e) => e.status === next && e.details.execution === 'unknown',
    );
  }
  assert.deepEqual(sent, Array(3).fill(['/api/agents/v1/session-skip/recurring/confirm', c]));
  assert.deepEqual((await journal.inspect(c.request.operationId)).request, c);
});

test('historical recurring receipt stays historical after an explicit ordinary restore', async (t) => {
  const c = confirmation(),
    old = receipt(c),
    restore = {
      ...c.session,
      request: { ...c.session.request, action: 'restore', operationId: randomUUID() },
    };
  const restored = {
    ...old.session,
    mutationId: `session-skip:${restore.request.operationId}`,
    decision: {
      ...old.session.decision,
      disposition: 'restored',
      operationId: restore.request.operationId,
    },
  };
  let calls = 0;
  const f = await fixture(t, async (url) => {
    calls++;
    return Response.json(url.pathname.includes('/recurring/') ? old : restored);
  });
  const j = new CommandJournal(f.client);
  await j.confirmRecurringSessionSkip(c);
  await j.confirmSessionSkip(restore);
  assert.deepEqual(await j.retry(c.request.operationId), { source: 'local_receipt', receipt: old });
  assert.equal(calls, 2);
  const row = await j.store(c.request.operationId).read();
  await j
    .store(c.request.operationId)
    .write({ ...row, receipt: { ...old, occurrenceKey: '20261112T100000Z' } });
  await assert.rejects(j.retry(c.request.operationId), { code: 'invalid_response' });
  assert.equal(calls, 2);
});

test('CLI recurring preview/confirm and inspect/retry use the exact protocol', async (t) => {
  const r = request(),
    sent = [];
  const f = await fixture(t, async (url, options) => {
    const input = JSON.parse(options.body);
    sent.push([url.pathname, input]);
    return Response.json(url.pathname.endsWith('/preview') ? wirePreview(input) : receipt(input));
  });
  const path = join(f.directory, 'recurring.json');
  let output = '',
    error = '';
  const run = async (args) => {
    output = '';
    error = '';
    const code = await main([...args, '--origin', origin, '--allow-local', '--json'], {
      directory: f.directory,
      fetchImpl: f.transport.fetch,
      stdout: {
        write: (s) => {
          output += s;
        },
      },
      stderr: {
        write: (s) => {
          error += s;
        },
      },
    });
    assert.equal(code, 0, error);
    return JSON.parse(output).data;
  };
  await writeFile(path, JSON.stringify(r));
  assert.deepEqual(
    await run(['sessions', 'recurring-skip-preview', '--file', path]),
    wirePreview(r),
  );
  await writeFile(path, JSON.stringify(confirmation(r)));
  assert.equal(
    (await run(['sessions', 'recurring-skip-confirm', '--file', path])).source,
    'server',
  );
  assert.equal(
    (await run(['commands', 'inspect', '--operation', r.operationId])).protocol,
    'recurring_session_skip',
  );
  assert.equal(
    (await run(['commands', 'retry', '--operation', r.operationId])).source,
    'local_receipt',
  );
  assert.equal(sent.length, 2);
});

test('MCP recurring tools have strict required inputs, truthful annotations and shared immutable retry', async (t) => {
  const r = request();
  let calls = 0;
  const f = await fixture(t, async (url, options) => {
    calls++;
    const input = JSON.parse(options.body);
    return Response.json(url.pathname.endsWith('/preview') ? wirePreview(input) : receipt(input));
  });
  const server = createMcpServer(f.client),
    client = new Client({ name: 'recurring-test', version: '1' }),
    [a, b] = InMemoryTransport.createLinkedPair();
  await Promise.all([client.connect(a), server.connect(b)]);
  try {
    const tools = (await client.listTools()).tools,
      p = tools.find((t) => t.name === 'fitness_recurring_session_skip_preview'),
      c = tools.find((t) => t.name === 'fitness_recurring_session_skip_confirm');
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

test('actual synthetic OAuth/hosted MCP DTOs preserve initial and materialized previews plus durable receipt', async (t) => {
  const sent = [];
  const f = await fixture(t, async (url, options) => {
    const input = JSON.parse(options.body);
    sent.push(input);
    if (url.pathname.endsWith('/confirm')) {
      return Response.json(wire.result);
    }
    return Response.json(
      input.operationId === wire.request.operationId ? wire.preview : wire.materializedPreview,
    );
  });
  assert.deepEqual(await previewRecurringSessionSkip(f.client, wire.request), wire.preview);
  assert.deepEqual(
    await previewRecurringSessionSkip(f.client, wire.materializedRequest),
    wire.materializedPreview,
  );
  assert.equal(wire.materializedPreview.confirmation, null);
  assert.deepEqual(validateRecurringSessionSkipConfirmation(wire.confirmation), wire.confirmation);
  assert.equal(validRecurringSessionSkipReceipt(wire.result, wire.confirmation), true);
  const journal = new CommandJournal(f.client);
  assert.deepEqual(await journal.confirmRecurringSessionSkip(wire.confirmation), {
    source: 'server',
    receipt: wire.result,
  });
  assert.deepEqual(await journal.retry(wire.request.operationId), {
    source: 'local_receipt',
    receipt: wire.result,
  });
  assert.deepEqual(sent, [wire.request, wire.materializedRequest, wire.confirmation]);
});
