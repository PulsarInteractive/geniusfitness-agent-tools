import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Client } from '@modelcontextprotocol/client';
import { InMemoryTransport } from '@modelcontextprotocol/server';
import { createMcpServer } from '../src/mcp.mjs';
import { readCoachPush } from '../src/coach-push.mjs';
import { CommandJournal, validateCommand } from '../src/commands.mjs';
import { commandHelp } from '../src/fitness.mjs';
import { main } from '../src/cli.mjs';
import { fixture, origin } from './helpers.mjs';
import remoteTools from '../remote/tool-catalog.json' with { type: 'json' };

const query = {
  scope: 'project:program',
  athleteId: 'athlete',
  trainingId: 'training',
  occurrenceId: 'next',
};
const result = () => ({
  ...query,
  coachId: 'coach',
  epoch: 'athlete-epoch',
  revision: '1',
  serverTime: Date.parse('2026-11-05T10:00:00.000Z'),
  applicationAuthorization: 'not_granted',
  proposals: [
    {
      id: '11111111-1111-4111-8111-111111111111',
      coachId: 'coach',
      exerciseId: 'bench',
      setIndex: 2,
      rationale: 'Review if ready.',
      proposedAt: '2026-11-05T10:00:00.000Z',
      state: 'pending',
      confirmedAt: null,
      closedAt: null,
    },
  ],
});
const draft = () => ({
  kind: 'coach.push.propose',
  scope: query.scope,
  id: randomUUID(),
  epoch: 'athlete-epoch',
  expectedRevision: null,
  data: {
    athleteId: query.athleteId,
    trainingId: query.trainingId,
    occurrenceId: query.occurrenceId,
    exerciseId: null,
    setIndex: null,
    rationale: 'Review the workout.',
  },
});

test('one exact occurrence read preserves empty, pending, confirmed and closed states', async () => {
  let calls = 0;
  const client = {
    get: async (route, input) => {
      calls++;
      assert.equal(route, 'coach-push');
      assert.deepEqual(input, query);
      return result();
    },
  };
  assert.deepEqual(await readCoachPush(client, query), result());
  assert.equal(calls, 1);
  for (const state of ['pending', 'confirmed', 'declined', 'withdrawn']) {
    const value = result(),
      p = value.proposals[0];
    p.state = state;
    if (state === 'confirmed' || state === 'withdrawn') {
      p.confirmedAt = p.proposedAt;
    }
    if (state === 'declined' || state === 'withdrawn') {
      p.closedAt = p.proposedAt;
    }
    assert.deepEqual(await readCoachPush({ get: async () => value }, query), value);
  }
  const empty = { ...result(), revision: null, proposals: [] };
  assert.deepEqual(await readCoachPush({ get: async () => empty }, query), empty);
});
test('reader refuses private, foreign and incoherent data instead of silently hiding it', async () => {
  for (const edit of [
    (v) => {
      v.athleteId = 'other';
    },
    (v) => {
      v.proposals[0].coachId = 'other';
    },
    (v) => {
      v.proposals[0].goalRevision = 'private';
    },
    (v) => {
      v.proposals[0].confirmationOperationId = randomUUID();
    },
    (v) => {
      v.proposals[0].state = 'confirmed';
    },
    (v) => {
      v.proposals[0].exerciseId = null;
    },
    (v) => {
      v.proposals.push({ ...v.proposals[0] });
    },
    (v) => {
      v.revision = null;
    },
    (v) => {
      v.applicationAuthorization = 'granted';
    },
    (v) => {
      v.proposals = Array(9).fill(v.proposals[0]);
    },
  ]) {
    const value = result();
    edit(value);
    await assert.rejects(readCoachPush({ get: async () => value }, query), {
      code: 'invalid_response',
    });
  }
  let calls = 0;
  const client = {
    get: async () => {
      calls++;
      throw Object.assign(new Error('revoked'), { code: 'session_revoked' });
    },
  };
  await assert.rejects(readCoachPush(client, { ...query, extra: 'forbidden' }), {
    code: 'invalid_arguments',
  });
  assert.equal(calls, 0);
  await assert.rejects(readCoachPush(client, query), { code: 'session_revoked' });
  assert.equal(calls, 1);
});
test('proposal command can use null or current occurrence revision; consent and numerical fields stay unavailable', () => {
  const command = { ...draft(), operationId: randomUUID(), issuedAt: Date.now() };
  for (const expectedRevision of [null, '1']) {
    assert.equal(
      validateCommand({ ...command, expectedRevision }).expectedRevision,
      expectedRevision,
    );
  }
  for (const patch of [
    { id: 'not-a-uuid' },
    { kind: 'coach.push.confirm' },
    { data: { ...command.data, loadMilliunits: 50000 } },
    { data: { ...command.data, setIndex: 1 } },
    { data: { ...command.data, rationale: ' ' } },
    { data: { athleteId: 'athlete' } },
  ]) {
    assert.throws(() => validateCommand({ ...command, ...patch }), { code: 'invalid_arguments' });
  }
  const withdraw = Object.fromEntries(
    ['athleteId', 'trainingId', 'occurrenceId'].map((key) => [key, command.data[key]]),
  );
  assert.throws(
    () => validateCommand({ ...command, kind: 'coach.push.withdraw', data: withdraw }),
    { code: 'invalid_arguments' },
  );
  assert.equal(
    validateCommand({
      ...command,
      kind: 'coach.push.withdraw',
      data: withdraw,
      expectedRevision: '2',
    }).expectedRevision,
    '2',
  );
  const help = commandHelp('coach.push.propose');
  assert.ok(help.dataSchema.required.includes('exerciseId'));
  assert.ok(help.dataSchema.properties.exerciseId.anyOf.some((p) => p.type === 'null'));
});
test('existing durable journal preserves a proposal across lost response and restart', async (t) => {
  const requests = [],
    f = await fixture(t, async (url, options) => {
      assert.equal(url.pathname, '/api/agents/v1/commands');
      const c = JSON.parse(options.body);
      requests.push(c);
      if (requests.length === 1) {
        throw new Error('reply lost after commit');
      }
      return Response.json({
        operationId: c.operationId,
        scope: c.scope,
        kind: c.kind,
        epoch: c.epoch,
        cursor: '42',
        items: [{ id: c.id, revision: '2', collection: 'coachPushProposals', deleted: false }],
        affectedCollections: ['coachPushProposals'],
      });
    });
  const first = new CommandJournal(f.client),
    prepared = await first.prepare(draft());
  assert.equal(requests.length, 0);
  await assert.rejects(first.retry(prepared.operationId), { code: 'network_unavailable' });
  const reopened = new CommandJournal(f.client);
  assert.equal((await reopened.inspect(prepared.operationId)).state, 'uncertain');
  assert.equal((await reopened.retry(prepared.operationId)).source, 'server');
  assert.deepEqual(requests[0], requests[1]);
  assert.equal((await reopened.retry(prepared.operationId)).source, 'local_receipt');
  assert.equal(requests.length, 2);
  await assert.rejects(
    reopened.execute({
      ...prepared.request,
      data: { ...prepared.request.data, rationale: 'changed' },
    }),
    { code: 'idempotency_mismatch' },
  );
});
test('CLI performs one authenticated read and local MCP exposes the same bounded operation', async (t) => {
  let calls = 0;
  const f = await fixture(t, async (url, options) => {
    calls++;
    assert.equal(url.pathname, '/api/agents/v1/coach-push');
    assert.deepEqual(Object.fromEntries(url.searchParams), query);
    assert.match(options.headers.Authorization, /^Bearer /);
    return Response.json(result());
  });
  let out = '',
    err = '';
  const code = await main(
    [
      'coaching',
      'push-proposals',
      ...Object.entries(query).flatMap(([k, v]) => ['--' + k, v]),
      '--origin',
      origin,
      '--allow-local',
      '--json',
    ],
    {
      directory: f.directory,
      fetchImpl: f.transport.fetch,
      stdout: { write: (s) => (out += s) },
      stderr: { write: (s) => (err += s) },
    },
  );
  assert.equal(code, 0, err);
  assert.equal(calls, 1);
  assert.deepEqual(JSON.parse(out).data, result());
  const server = createMcpServer({ get: async () => result() }),
    client = new Client({ name: 'coach-test', version: '1' }),
    [a, b] = InMemoryTransport.createLinkedPair();
  await server.connect(a);
  await client.connect(b);
  try {
    const tool = (await client.listTools()).tools.find((x) => x.name === 'fitness_coach_push');
    assert.equal(tool.annotations.readOnlyHint, true);
    assert.deepEqual(remoteTools.find((x) => x.name === tool.name).scopes, ['planning:read']);
    const value = await client.callTool({ name: tool.name, arguments: query });
    assert.notEqual(value.isError, true);
    assert.deepEqual(value.structuredContent.data, result());
  } finally {
    await client.close();
    await server.close();
  }
});
