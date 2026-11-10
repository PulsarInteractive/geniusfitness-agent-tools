import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Client } from '@modelcontextprotocol/client';
import { InMemoryTransport } from '@modelcontextprotocol/server';
import { createMcpServer } from '../src/mcp.mjs';
import { readTemporaryActionsV3 } from '../src/temporary-actions-v3.mjs';
import { CommandJournal, validateCommand } from '../src/commands.mjs';
import { commandHelp } from '../src/fitness.mjs';
import { main } from '../src/cli.mjs';
import { inspectPublicFile } from '../tools/check-public.mjs';
import contract from '../src/temporary-actions-v3-contract.mjs';
import remoteTools from '../remote/tool-catalog.json' with { type: 'json' };
import wire from './fixtures/temporary-actions-v3-wire.json' with { type: 'json' };
import { fixture, origin } from './helpers.mjs';

// These bytes are exported from real OAuth/gateway/DATA SQLite and hosted MCP
// tests. The transport below is local: it asserts the public CLI/SDK protocol,
// not another backend deployment or a provider call.
const clone = (value) => structuredClone(value);
const regionalEntry = () => clone(wire.mixed.entries.find((e) => e.regional !== null));
const port = (response, calls = []) => ({
  accessToken: async () => 'synthetic-token',
  transport: {
    request: async (path, options) => {
      calls.push({ path, ...options });
      return clone(response);
    },
  },
});
const patch = (value, mutate) => {
  const result = clone(value);
  mutate(result);
  return result;
};
const draft = (command) => {
  const { operationId, issuedAt, ...result } = clone(command);
  assert.ok(operationId && issuedAt);
  return result;
};

test('public export admits only named V3 files while keeping secret and unrelated path checks', () => {
  for (const name of [
    'src/temporary-actions-v3.mjs',
    'src/temporary-actions-v3-contract.mjs',
    'src/temporary-actions-v3-contract.d.mts',
    'test/temporary-actions-v3.test.mjs',
    'test/fixtures/temporary-actions-v3-wire.json',
  ]) {
    inspectPublicFile(name, 'Public synthetic content');
    assert.throws(() => inspectPublicFile(name, 'sk-proj-' + 'a'.repeat(40)));
  }
  for (const name of [
    'test/fixtures/private-account.json',
    'src/temporary-actions-v4.mjs',
    'test/private-v3.test.mjs',
  ]) {
    assert.throws(() => inspectPublicFile(name, 'ordinary content'));
  }
});

test('V3 reads preserve the complete mixed HTTP wire with one authorized POST per call', async () => {
  const calls = [],
    client = port(wire.mixed, calls);
  assert.deepEqual(await readTemporaryActionsV3(client, wire.read), wire.mixed);
  assert.deepEqual(await readTemporaryActionsV3(client, wire.read), wire.mixed);
  assert.equal(calls.length, 2);
  for (const call of calls) {
    assert.equal(call.path, '/api/agents/v1/coach-intents/v3/read');
    assert.equal(call.method, 'POST');
    assert.deepEqual(call.json, wire.read);
  }
  assert.equal(regionalEntry().regional.regionalEmphasis.lower, null);
  assert.deepEqual(await readTemporaryActionsV3(port(wire.cancelled), wire.read), wire.cancelled);
  assert.deepEqual(await readTemporaryActionsV3(port(wire.applied), wire.read), wire.applied);
});

test('V3 resolves preserve the exact regional or exercise branch and canonical source', async () => {
  for (const example of [wire.regional, wire.exercise, wire.skip]) {
    const calls = [];
    assert.deepEqual(
      await readTemporaryActionsV3(port(example.resolved, calls), example.request, true),
      example.resolved,
    );
    assert.equal(calls.length, 1);
    assert.equal(calls[0].path, '/api/agents/v1/coach-intents/v3/resolve');
    assert.deepEqual(calls[0].json, example.request);
  }
});

test('V3 input semantics reject ambiguous branches, inferred nulls and invalid windows before authorization', async () => {
  const refuse = { accessToken: () => assert.fail('invalid request must not access credentials') };
  for (const input of [
    patch(wire.read, (v) => delete v.sessionId),
    { ...wire.read, representationVersion: 2 },
    { ...wire.read, scope: 'personal:athlete1' },
    { ...wire.read, athleteId: 'unsafe actor' },
  ]) {
    await assert.rejects(readTemporaryActionsV3(refuse, input), { code: 'invalid_arguments' });
  }
  for (const input of [
    patch(wire.regional.request, (v) => delete v.exercise),
    patch(wire.regional.request, (v) => (v.exercise = wire.exercise.request.exercise)),
    patch(wire.regional.request, (v) => (v.regional = null)),
    patch(wire.regional.request, (v) => (v.targetKind = 'exercise')),
    patch(wire.regional.request, (v) => (v.sessionId = null)),
    patch(wire.regional.request, (v) => (v.regional.target.projectId = 'another')),
    patch(wire.regional.request, (v) => (v.regional.target.occurrenceId = 'also-future')),
    patch(wire.regional.request, (v) => (v.regional.regionalEmphasis.upper = null)),
    patch(wire.regional.request, (v) => (v.regional.regionalEmphasis.policyVersion = 'future')),
    patch(wire.regional.request, (v) => (v.regional.endsAt = v.regional.startsAt)),
    patch(wire.regional.request, (v) => (v.regional.endsAt = '2027-11-10T12:00:00Z')),
    patch(wire.exercise.request, (v) => {
      v.exercise.selection = 'next';
      v.sessionId = null;
      v.exercise.target = null;
    }),
  ]) {
    await assert.rejects(readTemporaryActionsV3(refuse, input, true), {
      code: 'invalid_arguments',
    });
  }
});

test('V3 response semantics reject partial, cross-target and current unsupported policies without dropping history', async () => {
  for (const response of [
    { ...wire.mixed, representationVersion: 2 },
    { ...wire.mixed, privateSource: {} },
    patch(wire.mixed, (v) => v.entries.push(clone(v.entries[0]))),
    patch(
      wire.mixed,
      (v) => (v.entries.find((e) => e.regional).regional.target.projectId = 'another'),
    ),
    patch(
      wire.mixed,
      (v) => (v.entries.find((e) => e.regional).regional.target.sessionId = crypto.randomUUID()),
    ),
    patch(
      wire.mixed,
      (v) =>
        (v.entries.find((e) => e.regional).exercise = wire.exercise.resolved.entries[0].exercise),
    ),
    patch(
      wire.mixed,
      (v) => (v.entries.find((e) => e.regional).regional.regionalEmphasis.policyVersion = 'future'),
    ),
  ]) {
    await assert.rejects(readTemporaryActionsV3(port(response), wire.read), {
      code: 'invalid_response',
    });
  }
  for (const response of [
    patch(wire.regional.resolved, (v) => (v.regional.target.trainingId = 'other-workout')),
    patch(wire.regional.resolved, (v) => (v.regional.replaces = ['bad-id'])),
    patch(wire.regional.resolved, (v) => (v.exercise = wire.exercise.resolved.exercise)),
  ]) {
    await assert.rejects(readTemporaryActionsV3(port(response), wire.regional.request, true), {
      code: 'invalid_response',
    });
  }
  const historical = patch(wire.mixed, (v) => {
    const e = v.entries.find((e) => e.regional).regional;
    e.state = 'stale_policy';
    e.regionalEmphasis.policyVersion = 'future';
  });
  assert.deepEqual(await readTemporaryActionsV3(port(historical), wire.read), historical);
});

test('closed V3 command data admits real bodies and keeps legacy versions and help carriers separate', () => {
  const commands = [
    wire.regional.command,
    wire.exercise.command,
    wire.skip.command,
    wire.regional.cancel,
    wire.exercise.cancel,
    wire.apply,
    ...wire.legacy.map((v) => v.command),
  ];
  for (const command of commands) {
    assert.deepEqual(validateCommand(command), command);
  }
  const help = commandHelp('coach.intent.set');
  assert.deepEqual(help.dataSchemas.v3, contract.AgentData);
  assert.deepEqual(help.temporaryRegional, contract.RegionalPolicy);
  assert.ok(!JSON.stringify(help.temporaryRegional).includes('ENABLED'));
  for (const command of [
    patch(wire.regional.command, (v) => (v.data.kind = 'regional_emphasis')),
    patch(wire.regional.command, (v) => delete v.data.exercise),
    patch(wire.regional.command, (v) => (v.data.exercise = wire.exercise.command.data.exercise)),
    patch(wire.regional.command, (v) => (v.data.representationVersion = 2)),
    patch(wire.regional.cancel, (v) => (v.kind = 'coach.intent.apply')),
    patch(
      wire.regional.cancel,
      (v) => (v.data.regional.startsAt = wire.regional.command.data.regional.startsAt),
    ),
    patch(wire.exercise.command, (v) => (v.data.exercise.focusSelection.priority = 'comfort')),
  ]) {
    assert.throws(() => validateCommand(command), { code: 'invalid_arguments' });
  }
});

test('lost V3 reply restarts the existing journal with identical UUID/body and refuses cross-protocol reuse', async (t) => {
  const sent = [];
  const f = await fixture(t, async (url, options) => {
    assert.equal(url.pathname, '/api/agents/v1/commands');
    const c = JSON.parse(options.body);
    sent.push(c);
    if (sent.length === 1) {
      throw new Error('Synthetic lost response after real receipt shape');
    }
    return Response.json(wire.regional.receipt);
  });
  await assert.rejects(new CommandJournal(f.client).execute(wire.regional.command), {
    code: 'network_unavailable',
  });
  const reopened = new CommandJournal(f.client);
  assert.equal((await reopened.retry(wire.regional.command.operationId)).source, 'server');
  assert.deepEqual(sent, [wire.regional.command, wire.regional.command]);
  const divergent = patch(
    wire.regional.command,
    (v) => (v.data.regional.regionalEmphasis.upper = 'moderate'),
  );
  await assert.rejects(reopened.execute(divergent), { code: 'idempotency_mismatch' });
  await assert.rejects(
    reopened.execute({ ...wire.legacy[1].command, operationId: wire.regional.command.operationId }),
    { code: 'idempotency_mismatch' },
  );
  assert.equal(sent.length, 2);
  assert.equal((await reopened.retry(wire.regional.command.operationId)).source, 'local_receipt');
});

test('existing v1/v2 journals recover exact historical receipts even while mixed V3 data exists', async (t) => {
  for (const example of wire.legacy) {
    const sent = [];
    const f = await fixture(t, async (url, options) => {
      assert.equal(url.pathname, '/api/agents/v1/commands');
      sent.push(JSON.parse(options.body));
      if (sent.length === 1) {
        throw new Error('Synthetic lost old ACK');
      }
      return Response.json(example.receipt);
    });
    await assert.rejects(new CommandJournal(f.client).execute(example.command), {
      code: 'network_unavailable',
    });
    assert.equal(
      (await new CommandJournal(f.client).retry(example.command.operationId)).source,
      'server',
    );
    assert.deepEqual(sent, [example.command, example.command]);
  }
});

test('actual CLI file commands send explicit V3 POSTs and return complete canonical output', async (t) => {
  for (const [command, input, output] of [
    ['intents-v3', wire.read, wire.mixed],
    ['resolve-intent-v3', wire.regional.request, wire.regional.resolved],
  ]) {
    const sent = [];
    const f = await fixture(t, async (url, options) => {
      sent.push({ path: url.pathname, method: options.method, body: JSON.parse(options.body) });
      return Response.json(output);
    });
    const file = join(f.directory, 'input.json');
    await writeFile(file, JSON.stringify(input));
    let stdout = '',
      stderr = '';
    const exit = await main(
      ['coaching', command, '--file', file, '--origin', origin, '--allow-local', '--json'],
      {
        directory: f.directory,
        fetchImpl: f.transport.fetch,
        stdout: { write: (s) => (stdout += s) },
        stderr: { write: (s) => (stderr += s) },
      },
    );
    assert.equal(exit, 0, stderr);
    assert.deepEqual(JSON.parse(stdout).data, output);
    assert.deepEqual(sent, [
      {
        path: '/api/agents/v1/coach-intents/v3/' + (command === 'intents-v3' ? 'read' : 'resolve'),
        method: 'POST',
        body: input,
      },
    ]);
  }
});

test('actual MCP SDK exposes readonly V3 tools then prepares and submits the same generic command', async (t) => {
  const calls = [];
  const f = await fixture(t, async (url, options) => {
    const body = JSON.parse(options.body);
    calls.push({ path: url.pathname, body });
    if (url.pathname.endsWith('/v3/read')) {
      return Response.json(wire.mixed);
    }
    if (url.pathname.endsWith('/v3/resolve')) {
      return Response.json(wire.regional.resolved);
    }
    assert.equal(url.pathname, '/api/agents/v1/commands');
    // Local prepared UUID is new; retain the real receipt fields and bind only
    // its operationId to this local transport call, not a new backend claim.
    return Response.json({ ...wire.regional.receipt, operationId: body.operationId });
  });
  const server = createMcpServer(f.client),
    client = new Client({ name: 'temporary-v3-test', version: '1' });
  const [a, b] = InMemoryTransport.createLinkedPair();
  await server.connect(a);
  await client.connect(b);
  try {
    const list = await client.listTools();
    for (const name of ['fitness_coach_intents_v3', 'fitness_coach_intent_target_v3']) {
      const tool = list.tools.find((v) => v.name === name),
        hosted = remoteTools.find((v) => v.name === name);
      assert.equal(tool.annotations.readOnlyHint, true);
      assert.equal(tool.annotations.destructiveHint, false);
      if (name.endsWith('target_v3')) {
        assert.match(tool.description, /fitness_execute_command/);
        assert.doesNotMatch(tool.description, /fitness_edit_planning/);
        assert.match(hosted.description, /fitness_edit_planning/);
      }
      assert.deepEqual(
        hosted.inputSchema,
        name.endsWith('target_v3') ? contract.ResolveRequest : contract.ReadRequest,
      );
    }
    const read = await client.callTool({ name: 'fitness_coach_intents_v3', arguments: wire.read });
    assert.notEqual(read.isError, true);
    assert.deepEqual(read.structuredContent.data, wire.mixed);
    const resolved = await client.callTool({
      name: 'fitness_coach_intent_target_v3',
      arguments: wire.regional.request,
    });
    assert.notEqual(resolved.isError, true);
    assert.deepEqual(resolved.structuredContent.data, wire.regional.resolved);
    const prepared = await client.callTool({
      name: 'fitness_prepare_command',
      arguments: draft(wire.regional.command),
    });
    assert.notEqual(prepared.isError, true);
    assert.equal(calls.length, 2);
    const exact = prepared.structuredContent.data.request;
    assert.deepEqual(exact.data, wire.regional.command.data);
    const committed = await client.callTool({ name: 'fitness_execute_command', arguments: exact });
    assert.notEqual(committed.isError, true);
    assert.deepEqual(calls[2].body, exact);
    assert.equal(committed.structuredContent.data.receipt.operationId, exact.operationId);
  } finally {
    await client.close();
    await server.close();
  }
});

test('quota refusal is returned without fallback reads, automatic retry or mutation', async (t) => {
  const sent = [];
  const f = await fixture(t, async (url) => {
    sent.push(url.pathname);
    return Response.json(
      {
        error: {
          code: 'rate_limited',
          message: 'Wait before retrying.',
          retryable: true,
          execution: 'not_started',
        },
      },
      { status: 429, headers: { 'Retry-After': '5' } },
    );
  });
  await assert.rejects(readTemporaryActionsV3(f.client, wire.read), { code: 'rate_limited' });
  assert.deepEqual(sent, ['/api/agents/v1/coach-intents/v3/read']);
});
