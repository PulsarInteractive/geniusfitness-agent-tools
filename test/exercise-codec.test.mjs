import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Client } from '@modelcontextprotocol/client';
import { InMemoryTransport } from '@modelcontextprotocol/server';
import { Transport } from '../src/transport.mjs';
import { CommandJournal, validateCommand } from '../src/commands.mjs';
import { commandHelp, readResources } from '../src/fitness.mjs';
import { createMcpServer } from '../src/mcp.mjs';
import { main } from '../src/cli.mjs';
import { retryAt } from '../src/recovery.mjs';
import { fixture, origin } from './helpers.mjs';

const query = { scope: 'project:training', collection: 'workoutExercises', id: 'slot' };
const upgrade = () => ({
  error: {
    code: 'fitness_reader_update_required',
    requiredExerciseCodec: 2,
    retryable: true,
    remediation: 'untrusted advice',
  },
});

test('all delegated transports advertise codec2 without changing bodies or adding requests', async () => {
  const sent = [];
  const transport = new Transport(origin, {
    fetchImpl: async (url, options) => {
      sent.push({ url, options });
      assert.equal(options.headers['X-Fitness-Exercise-Codec'], '2');
      return Response.json({ accepted: true });
    },
  });
  const request = { operationId: randomUUID(), issuedAt: 20 };
  await transport.request('/api/agents/v1/resources', { query, token: 'synthetic' });
  await transport.request('/api/agents/v1/commands', { method: 'POST', json: request });
  await transport.oauth('token', { grant_type: 'refresh_token', refresh_token: 'synthetic' });
  await transport.request('/.well-known/oauth-authorization-server');
  const bytes = Buffer.from('synthetic-image');
  await transport.request(
    '/api/agents/v1/exercise-media/11111111-1111-4111-8111-111111111111/content',
    {
      method: 'PUT',
      bytes,
    },
  );
  assert.equal(sent.length, 5);
  assert.equal(sent[1].options.body, JSON.stringify(request));
  assert.equal(sent[4].options.body, bytes);
});

test('reader upgrade is terminal regardless of status, Retry-After or unsafe server advice', async () => {
  for (const status of [403, 409, 503]) {
    let calls = 0;
    const transport = new Transport(origin, {
      fetchImpl: async () => {
        calls++;
        return Response.json(upgrade(), { status, headers: { 'Retry-After': '1' } });
      },
    });
    await assert.rejects(transport.request('/api/agents/v1/resources'), (error) => {
      assert.equal(error.code, 'fitness_reader_update_required');
      assert.equal(error.retryable, false);
      assert.equal(error.details.requiredExerciseCodec, 2);
      assert.equal(retryAt(error), undefined);
      assert.match(error.remediation, /update check.*update install/);
      assert(!JSON.stringify(error).includes('untrusted advice'));
      return true;
    });
    assert.equal(calls, 1);
  }
  const flat = new Transport(origin, {
    fetchImpl: async () =>
      Response.json(
        {
          error: 'fitness_reader_update_required',
          requiredExerciseCodec: 2,
        },
        { status: 409 },
      ),
  });
  await assert.rejects(flat.request('/api/agents/v1/me'), (error) => {
    assert.equal(error.details.requiredExerciseCodec, 2);
    assert.equal(error.retryable, false);
    return true;
  });
  for (const requiredExerciseCodec of ['2', 0, -1, 2.5, 'private-value', null]) {
    const transport = new Transport(origin, {
      fetchImpl: async () =>
        Response.json(
          {
            error: 'fitness_reader_update_required',
            requiredExerciseCodec,
          },
          { status: 409 },
        ),
    });
    await assert.rejects(transport.request('/api/agents/v1/me'), (error) => {
      assert.equal(error.retryable, false);
      assert.equal(error.details.requiredExerciseCodec, undefined);
      return true;
    });
  }
});

test('actual CLI and MCP resource reads expose one actionable upgrade without retry', async (t) => {
  let calls = 0;
  const f = await fixture(t, async (_url, options) => {
    calls++;
    assert.equal(options.headers['X-Fitness-Exercise-Codec'], '2');
    return Response.json(upgrade(), { status: 409 });
  });
  const out = [],
    err = [];
  assert.equal(
    await main(
      [
        'resources',
        'list',
        '--scope',
        query.scope,
        '--collection',
        query.collection,
        '--id',
        query.id,
        '--origin',
        origin,
        '--allow-local',
        '--json',
      ],
      {
        directory: f.directory,
        fetchImpl: f.transport.fetch,
        stdout: { write: (s) => out.push(s) },
        stderr: { write: (s) => err.push(s) },
      },
    ),
    5,
  );
  assert.equal(out.length, 0);
  const cli = JSON.parse(err.join('')).error;
  assert.equal(cli.code, 'fitness_reader_update_required');
  assert.equal(cli.requiredExerciseCodec, 2);
  assert.equal(cli.retryable, false);
  const server = createMcpServer(f.client),
    client = new Client({ name: 'codec-review', version: '1' });
  const [a, b] = InMemoryTransport.createLinkedPair();
  try {
    await Promise.all([server.connect(a), client.connect(b)]);
    const response = await client.callTool({ name: 'fitness_resources', arguments: query });
    assert.equal(response.isError, true);
    const error = JSON.parse(response.content[0].text).error;
    assert.equal(error.code, 'fitness_reader_update_required');
    assert.equal(error.requiredExerciseCodec, 2);
    assert.equal(error.retryable, false);
    assert.equal(calls, 2);
  } finally {
    await client.close();
    await server.close();
  }
});

test('upgrade refusal retains immutable journal and credentials without retry deadline', async (t) => {
  let calls = 0;
  const f = await fixture(t, async () => {
    calls++;
    return Response.json(upgrade(), { status: 409 });
  });
  const before = await f.store.read(),
    journal = new CommandJournal(f.client);
  const saved = await journal.prepare({
    scope: 'project:work',
    epoch: 'epoch',
    id: randomUUID(),
    expectedRevision: null,
    kind: 'planning.create',
    data: { title: 'Synthetic', owner: 'owner' },
  });
  await assert.rejects(journal.retry(saved.operationId), {
    code: 'fitness_reader_update_required',
    retryable: false,
  });
  const retained = await journal.inspect(saved.operationId);
  assert.deepEqual(retained.request, saved.request);
  assert.equal(retained.retryAt, undefined);
  assert.equal(retained.error.requiredExerciseCodec, 2);
  assert.deepEqual(await f.store.read(), before);
  assert.equal(calls, 1);
});

test('ResistanceReps is explicit in command help and rejects mass units without inferring missing data', () => {
  const command = (data) => ({
    operationId: randomUUID(),
    issuedAt: 0,
    scope: 'personal:owner',
    epoch: 'epoch',
    id: 'exercise',
    expectedRevision: '1',
    kind: 'exercise.update',
    data,
  });
  assert(
    commandHelp('exercise.create').dataSchema.properties.exerciseType.anyOf[0].enum.includes(
      'ResistanceReps',
    ),
  );
  const data = {
    exerciseType: 'ResistanceReps',
    defaultUnit: 'none',
    countingConvention: 'per_side_repetitions',
  };
  assert.deepEqual(validateCommand(command(data)).data, data);
  for (const defaultUnit of ['kg', 'lb', 'lbs', null]) {
    assert.throws(() => validateCommand(command({ ...data, defaultUnit })), {
      code: 'invalid_arguments',
    });
  }
  assert.throws(
    () => validateCommand(command({ ...data, countingConvention: 'per_side_duration' })),
    { code: 'invalid_arguments' },
  );
  const sparse = { exerciseType: 'ResistanceReps' };
  assert.deepEqual(validateCommand(command(sparse)).data, sparse);
});

test('resource reader preserves non-mass repetitions and embedded type without synthesizing weight', async () => {
  const expected = {
    scope: query.scope,
    collection: query.collection,
    epoch: 'epoch',
    checkpoint: '4',
    items: [
      {
        id: 'slot',
        revision: '4',
        data: {
          exerciseSnapshot: JSON.stringify({
            name: 'Synthetic band',
            exerciseType: 'ResistanceReps',
            defaultUnit: 'none',
          }),
          targetSets: '[{"r":10}]',
        },
      },
    ],
    omittedIds: [],
    nextAfter: null,
    changeCursor: 'cursor',
    etag: 'etag',
  };
  const result = await readResources({ get: async () => expected }, query);
  assert.deepEqual(result, expected);
  assert.equal(result.items[0].data.massFormat, undefined);
  assert.equal(result.items[0].data.sourceMass, undefined);
});
