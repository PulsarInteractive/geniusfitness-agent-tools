import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Client } from '@modelcontextprotocol/client';
import { InMemoryTransport } from '@modelcontextprotocol/server';
import catalog from '../src/command-catalog.mjs';
import { readResources, commandHelp } from '../src/fitness.mjs';
import { validateCommand } from '../src/commands.mjs';
import { createMcpServer } from '../src/mcp.mjs';
import { main } from '../src/cli.mjs';
import { fixture, origin } from './helpers.mjs';

const query = { scope: 'project:training', collection: 'workoutExercises', id: 'slot' };
const page = (data) => ({
  scope: query.scope,
  collection: query.collection,
  epoch: 'epoch',
  checkpoint: '4',
  items: [{ id: query.id, revision: '4', data }],
  omittedIds: [],
  nextAfter: null,
  changeCursor: 'opaque',
  etag: 'validator',
});
const canonical = () => ({
  training: 'day-one',
  element: 'exercise',
  targetSets: '[{"w":27.5,"r":8},{"w":0,"r":0}]',
  massFormat: 'kg-v1',
  exerciseSnapshot: '{"name":"Bench press","defaultUnit":"lb","exerciseType":"WeightReps"}',
});

test('prescription representation is discoverable without proving runtime activation', () => {
  assert.ok(catalog.collections.workoutExercises.fields.includes('massFormat'));
  for (const kind of ['workout.exercise.create', 'workout.exercise.update']) {
    assert.equal(commandHelp(kind).fields.includes('massFormat'), true);
    const input = {
      operationId: randomUUID(),
      issuedAt: Date.now(),
      kind,
      scope: query.scope,
      epoch: 'epoch',
      id: query.id,
      expectedRevision: kind.endsWith('create') ? null : '4',
      data: { training: 'day-one', element: 'exercise', targetSets: '[{"w":20,"r":8}]' },
    };
    assert.deepEqual(validateCommand(input).data, input.data);
    assert.deepEqual(
      validateCommand({ ...input, data: { ...input.data, massFormat: 'kg-v1' } }).data,
      { ...input.data, massFormat: 'kg-v1' },
    );
    for (const massFormat of ['future-v2', null, true, 1]) {
      assert.throws(() => validateCommand({ ...input, data: { ...input.data, massFormat } }), {
        code: 'invalid_arguments',
      });
    }
  }
});

test('resource reads preserve canonical, legacy and unknown representations without guessing or converting', async () => {
  const legacy = canonical();
  delete legacy.massFormat;
  for (const data of [
    canonical(),
    legacy,
    { ...legacy, massFormat: null },
    { ...legacy, massFormat: 'future-v2' },
  ]) {
    const expected = structuredClone(page(data));
    let calls = 0;
    const actual = await readResources(
      {
        get: async (route, sent) => {
          calls++;
          assert.equal(route, 'resources');
          assert.deepEqual(sent, query);
          return structuredClone(expected);
        },
      },
      query,
    );
    assert.equal(calls, 1);
    assert.deepEqual(actual, expected);
    assert.equal(
      Object.hasOwn(actual.items[0].data, 'massFormat'),
      Object.hasOwn(data, 'massFormat'),
    );
  }
});

test('CLI resource JSON carries kg representation beside an unchanged legacy lb snapshot', async (t) => {
  const expected = page(canonical());
  const f = await fixture(t, async (url) => {
    assert.equal(url.pathname, '/api/agents/v1/resources');
    assert.equal(url.searchParams.get('collection'), query.collection);
    assert.equal(url.searchParams.get('id'), query.id);
    return Response.json(expected);
  });
  let stdout = '',
    stderr = '';
  const status = await main(
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
    },
  );
  assert.equal(status, 0, stderr);
  assert.deepEqual(JSON.parse(stdout).data, expected);
});

test('MCP resource dispatch preserves the complete prescription representation in one read', async () => {
  const expected = page(canonical()),
    calls = [];
  const server = createMcpServer({
    get: async (route, sent) => {
      calls.push({ route, sent });
      return structuredClone(expected);
    },
  });
  const client = new Client({ name: 'prescription-unit-review', version: '1' });
  const [a, b] = InMemoryTransport.createLinkedPair();
  try {
    await server.connect(a);
    await client.connect(b);
    const result = await client.callTool({ name: 'fitness_resources', arguments: query });
    assert.equal(result.isError, undefined);
    assert.deepEqual(JSON.parse(result.content[0].text), expected);
    assert.deepEqual(calls, [{ route: 'resources', sent: query }]);
  } finally {
    await client.close();
    await server.close();
  }
});
