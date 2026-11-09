import test from 'node:test';
import Ajv from 'ajv';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/client';
import { InMemoryTransport } from '@modelcontextprotocol/server';
import { createMcpServer } from '../src/mcp.mjs';
import { readTemporaryActions, validTemporaryCommand } from '../src/temporary-actions.mjs';
import { CommandJournal, validateCommand } from '../src/commands.mjs';
import { commandHelp } from '../src/fitness.mjs';
import { main } from '../src/cli.mjs';
import { fixture, origin } from './helpers.mjs';
import wire from './fixtures/temporary-focus-wire.mjs';
const entry = wire.snapshot.entries[0];
const query = {
  scope: 'project:' + entry.target.projectId,
  athleteId: entry.actorId,
  sessionId: entry.target.sessionId,
  representationVersion: 2,
};
const draft = () => ({
  scope: query.scope,
  id: entry.id,
  epoch: wire.snapshot.epoch,
  expectedRevision: wire.snapshot.revision,
  kind: 'coach.intent.set',
  data: {
    athleteId: query.athleteId,
    sessionId: query.sessionId,
    representationVersion: 2,
    kind: 'focus',
    objective: 'multiple_axes',
    focusSelection: structuredClone(entry.focusSelection),
    target: structuredClone(entry.target),
    sourceVersion: wire.proposal.sourceVersion,
    startsAt: entry.startsAt,
    endsAt: entry.endsAt,
  },
});
const command = () => ({ ...draft(), operationId: crypto.randomUUID(), issuedAt: Date.now() });

test('explicit v2 preserves a real complete Worker snapshot and unknown priority, with one call', async () => {
  let calls = 0;
  const value = await readTemporaryActions(
    {
      get: async (route, input) => {
        calls++;
        assert.equal(route, 'coach-intents');
        assert.deepEqual(input, query);
        return wire.snapshot;
      },
    },
    query,
  );
  assert.deepEqual(value, wire.snapshot);
  assert.equal(value.entries[0].focusSelection.priority, null);
  assert.equal(calls, 1);
  const { representationVersion, ...v1 } = query;
  assert.equal(representationVersion, 2);
  await assert.rejects(readTemporaryActions({ get: async () => wire.snapshot }, v1), {
    code: 'invalid_response',
  });
  for (const version of [null, 1, '2', 3]) {
    await assert.rejects(
      readTemporaryActions(
        { get: () => assert.fail('no call') },
        { ...query, representationVersion: version },
      ),
      { code: 'invalid_arguments' },
    );
  }
});

test('v2 refuses incomplete, mixed, unsafe and downgraded representations instead of dropping axes', async () => {
  const altered = (patch) => ({ ...wire.snapshot, entries: [{ ...entry, ...patch }] });
  const focus = entry.focusSelection;
  for (const response of [
    { ...wire.snapshot, representationVersion: undefined },
    { ...wire.snapshot, entries: Array(65).fill(entry) },
    altered({ focusSelection: undefined }),
    altered({ focusSelection: null }),
    altered({ objective: 'strength' }),
    altered({ kind: 'skip' }),
    altered({ focusSelection: { ...focus, selected: ['strength', 'strength'] } }),
    altered({ focusSelection: { ...focus, priority: 'comfort' } }),
    altered({ focusSelection: { ...focus, selected: ['unknown'] } }),
    altered({ focusSelection: { ...focus, policyVersion: 'future' } }),
    altered({
      focusSelection: { ...focus, selected: ['strength', 'comfort', 'endurance', 'power'] },
    }),
    altered({ target: { ...entry.target, projectId: 'another' } }),
  ]) {
    await assert.rejects(readTemporaryActions({ get: async () => response }, query), {
      code: 'invalid_response',
    });
  }
  const historical = altered({
    state: 'stale_policy',
    focusSelection: { policyVersion: 'future', selected: ['new_axis'], priority: null },
  });
  assert.deepEqual(await readTemporaryActions({ get: async () => historical }, query), historical);
});

test('generated command metadata and client validation keep v1 and v2 command data disjoint', () => {
  const c = command();
  assert.equal(validTemporaryCommand(c), true);
  assert.deepEqual(validateCommand(c), c);
  const help = commandHelp(c.kind);
  assert.equal(help.temporaryFocus.policyVersion, entry.focusSelection.policyVersion);
  const validatesFocus = new Ajv({ strict: false }).compile(
    help.dataSchema.properties.focusSelection,
  );
  assert.equal(validatesFocus(entry.focusSelection), true, JSON.stringify(validatesFocus.errors));
  assert.ok(help.temporaryFocus.selection.choices.includes('strength'));
  assert.equal(help.temporaryFocus.selection.priority, 'optional');
  assert.match(help.dataSchema.properties.representationVersion.description, /strict legacy v1/);
  assert.ok(!JSON.stringify(help).includes('COACH_MULTI_FOCUS_ENABLED'));
  for (const patch of [
    { representationVersion: undefined },
    { representationVersion: null },
    { representationVersion: 1 },
    { focusSelection: undefined },
    { focusSelection: null },
    { focusSelection: { ...c.data.focusSelection, priority: 'comfort' } },
    { focusSelection: { ...c.data.focusSelection, policyVersion: 'future' } },
    { focusSelection: { ...c.data.focusSelection, selected: ['unknown'] } },
    { objective: 'comfort' },
  ]) {
    assert.throws(() => validateCommand({ ...c, data: { ...c.data, ...patch } }), {
      code: 'invalid_arguments',
    });
  }
  const { representationVersion, focusSelection, ...legacy } = c.data;
  assert.equal(representationVersion, 2);
  assert.ok(focusSelection);
  assert.ok(validTemporaryCommand({ ...c, data: { ...legacy, objective: 'comfort' } }));
  assert.ok(
    validTemporaryCommand({
      ...c,
      data: { ...c.data, objective: 'comfort', focusSelection: null },
    }),
  );
  const cancelled = {
    ...c,
    kind: 'coach.intent.cancel',
    data: {
      ...c.data,
      kind: null,
      objective: null,
      target: null,
      sourceVersion: null,
      startsAt: null,
      endsAt: null,
      focusSelection: null,
    },
  };
  assert.ok(validTemporaryCommand(cancelled));
  assert.ok(!validTemporaryCommand({ ...cancelled, data: { ...cancelled.data, focusSelection } }));
});

test('immutable command journal replays every selected interest and null priority after an uncertain reply', async (t) => {
  const sent = [];
  const f = await fixture(t, async (url, options) => {
    assert.equal(url.pathname, '/api/agents/v1/commands');
    const c = JSON.parse(options.body);
    sent.push(c);
    if (sent.length === 1) {
      throw new Error('Synthetic lost response after commit');
    }
    return Response.json({
      operationId: c.operationId,
      scope: c.scope,
      kind: c.kind,
      epoch: c.epoch,
      cursor: '3',
      items: [{ id: c.id, revision: '3', collection: 'coachIntents', deleted: false }],
      affectedCollections: ['coachIntents'],
    });
  });
  const journal = new CommandJournal(f.client),
    prepared = await journal.prepare(draft());
  assert.equal(sent.length, 0);
  await assert.rejects(journal.retry(prepared.operationId), { code: 'network_unavailable' });
  assert.equal((await journal.retry(prepared.operationId)).source, 'server');
  assert.deepEqual(sent[0], sent[1]);
  assert.deepEqual(sent[0].data.focusSelection, entry.focusSelection);
  assert.equal(sent[0].data.representationVersion, 2);
  await assert.rejects(
    journal.execute({
      ...prepared.request,
      data: {
        ...prepared.request.data,
        focusSelection: { ...entry.focusSelection, priority: 'strength' },
      },
    }),
    { code: 'idempotency_mismatch' },
  );
  assert.equal(sent.length, 2);
  assert.equal((await journal.retry(prepared.operationId)).source, 'local_receipt');
});

test('CLI explicitly converts representation version and preserves the complete output', async (t) => {
  let calls = 0;
  const f = await fixture(t, async (url) => {
    calls++;
    assert.equal(url.pathname, '/api/agents/v1/coach-intents');
    assert.equal(url.searchParams.get('representationVersion'), '2');
    return Response.json(wire.snapshot);
  });
  let stdout = '',
    stderr = '';
  const exit = await main(
    [
      'coaching',
      'intents',
      '--scope',
      query.scope,
      '--athleteId',
      query.athleteId,
      '--sessionId',
      query.sessionId,
      '--representationVersion',
      '2',
      '--origin',
      origin,
      '--allow-local',
      '--json',
    ],
    {
      directory: f.directory,
      fetchImpl: f.transport.fetch,
      stdout: { write: (s) => (stdout += s) },
      stderr: { write: (s) => (stderr += s) },
    },
  );
  assert.equal(exit, 0, stderr);
  assert.equal(calls, 1);
  assert.deepEqual(JSON.parse(stdout).data, wire.snapshot);
});

test('actual MCP SDK preserves v2 selections and explicit error guidance without automatic downgrade', async (t) => {
  let calls = 0,
    deny = false;
  const f = await fixture(t, async (url) => {
    calls++;
    assert.equal(url.searchParams.get('representationVersion'), '2');
    return deny
      ? Response.json(
          {
            error: {
              code: 'temporary_action_client_update_required',
              message: 'Complete representation unavailable. Update the client.',
              remediation: 'update_client',
              retryable: false,
              execution: 'not_started',
            },
          },
          { status: 409 },
        )
      : Response.json(wire.snapshot);
  });
  const server = createMcpServer(f.client),
    client = new Client({ name: 'temporary-focus-test', version: '1' }),
    [a, b] = InMemoryTransport.createLinkedPair();
  await server.connect(a);
  await client.connect(b);
  try {
    const result = await client.callTool({ name: 'fitness_coach_intents', arguments: query });
    assert.notEqual(result.isError, true);
    assert.deepEqual(result.structuredContent.data, wire.snapshot);
    deny = true;
    const refused = await client.callTool({ name: 'fitness_coach_intents', arguments: query });
    assert.equal(refused.isError, true);
    assert.match(JSON.stringify(refused), /temporary_action_client_update_required/);
    assert.match(JSON.stringify(refused), /update_client/);
    assert.equal(calls, 2);
  } finally {
    await client.close();
    await server.close();
  }
});
