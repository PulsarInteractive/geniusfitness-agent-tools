import test from 'node:test';
import assert from 'node:assert/strict';
import { readCatalog, readMetrics, readResources, commandHelp } from '../src/fitness.mjs';
import { main } from '../src/cli.mjs';
import { fixture, origin } from './helpers.mjs';

const version = 'a'.repeat(64);
const exercise = (key) => ({
  key,
  name: 'Squat',
  bodyPart: 'upper legs',
  target: 'quads',
  secondary: [],
  equipment: 'body weight',
  equipmentGroup: 'Bodyweight',
  muscleGroup: 'Legs',
  exerciseType: 'BodyweightReps',
  attribution: '',
});
const resource = () => ({
  scope: 'project:training',
  collection: 'workouts',
  epoch: 'epoch',
  checkpoint: '4',
  items: [{ id: 'day.one', revision: '4', data: { name: 'Monday' } }],
  omittedIds: [],
  nextAfter: null,
  changeCursor: 'opaque',
  etag: 'validator',
});

test('catalogue pagination retains version, rejects malformed ordering, and never imports guessed IDs', async () => {
  let calls = 0;
  const client = {
    get: async (name, query) => {
      calls++;
      assert.equal(name, 'catalog');
      assert.equal(query.version, version);
      return { version, items: [exercise('ex.0002'), exercise('ex.0003')], nextAfter: 'ex.0003' };
    },
  };
  assert.equal((await readCatalog(client, { after: 'ex.0001', version })).items.length, 2);
  for (const query of [
    { after: 'ex.0001' },
    { key: 'not-a-catalog-id' },
    { limit: 10000 },
    { key: 'ex.0001', after: 'ex.0002', version },
  ]) {
    await assert.rejects(readCatalog(client, query), { code: 'invalid_arguments' });
  }
  assert.equal(calls, 1);
  for (const page of [
    { version, items: [exercise('ex.0002'), exercise('ex.0002')], nextAfter: null },
    { version, items: [exercise('ex.0002')], nextAfter: 'ex.0004' },
    { version: 'b'.repeat(64), items: [], nextAfter: null },
    { version, items: Array.from({ length: 26 }, (_, i) => exercise(`ex.${i}`)), nextAfter: null },
  ]) {
    await assert.rejects(readCatalog({ get: async () => page }, { version }), {
      code: 'invalid_response',
    });
  }
});

test('metric dates are bounded and wrong-scope, duplicate or out-of-range days never become zero progress', async () => {
  const query = { scope: 'project:training', from: '2026-09-01', until: '2026-09-30' };
  const page = {
    ...query,
    epoch: 'epoch',
    checkpoint: '8',
    days: [{ day: '2026-09-02', sessions: 1, runs: 0, durationSeconds: 3600, distanceMeters: 0 }],
  };
  assert.equal((await readMetrics({ get: async () => page }, query)).days[0].sessions, 1);
  for (const patch of [
    { from: '2026-02-30' },
    { from: '2024-01-01' },
    { until: '2026-08-31' },
    { scope: 'personal:owner' },
  ]) {
    await assert.rejects(
      readMetrics({ get: () => assert.fail('No request') }, { ...query, ...patch }),
      { code: 'invalid_arguments' },
    );
  }
  for (const patch of [
    { scope: 'project:other' },
    { days: [...page.days, ...page.days] },
    { days: [{ ...page.days[0], day: '2026-10-01' }] },
    { days: [{ ...page.days[0], durationSeconds: -1 }] },
  ]) {
    await assert.rejects(readMetrics({ get: async () => ({ ...page, ...patch }) }, query), {
      code: 'invalid_response',
    });
  }
});

test('resource pages preserve exact record IDs, scope separation and revision context', async () => {
  const query = { scope: 'project:training', collection: 'workouts', id: 'day.one' };
  assert.equal(
    (await readResources({ get: async () => resource() }, query)).items[0].id,
    'day.one',
  );
  for (const patch of [
    { collection: 'health' },
    { collection: 'unknown' },
    { after: 'day.one' },
    { archive: 'active' },
  ]) {
    await assert.rejects(
      readResources({ get: () => assert.fail('No request') }, { ...query, ...patch }),
      { code: 'invalid_arguments' },
    );
  }
  for (const patch of [
    { scope: 'project:other' },
    { collection: 'sessions' },
    { items: [{ id: 'other', revision: '4', data: {} }] },
    { items: Array(26).fill(resource().items[0]) },
  ]) {
    await assert.rejects(readResources({ get: async () => ({ ...resource(), ...patch }) }, query), {
      code: 'invalid_response',
    });
  }
  await assert.rejects(
    readResources(
      { get: async () => resource() },
      {
        scope: query.scope,
        collection: 'workouts',
        after: 'day.zero',
        epoch: 'epoch',
        checkpoint: '3',
      },
    ),
    { code: 'invalid_response' },
  );
});

test('command help publishes domain constraints without leaking internal model decorators', () => {
  const program = commandHelp('program.create');
  assert.deepEqual(program.dataSchema.required, ['title', 'icon']);
  assert.equal(program.dataSchema.properties.title.minLength, 3);
  assert.deepEqual(commandHelp('exercise.import').dataSchema.required, ['catalogKey']);
  assert.ok(
    commandHelp('exercise.create').dataSchema.properties.exerciseType.anyOf[0].enum.includes(
      'WeightReps',
    ),
  );
  assert.ok(!JSON.stringify(program).includes('x-web-core'));
  assert.throws(() => commandHelp('admin.promote'), { code: 'invalid_arguments' });
});

test('CLI catalogue and metrics reads use the configured authenticated API and stable JSON envelope', async (t) => {
  const f = await fixture(t, async (url) => {
    assert.equal(url.pathname, '/api/agents/v1/catalog');
    assert.equal(url.searchParams.get('query'), 'squat');
    return Response.json({ version, items: [exercise('ex.0001')], nextAfter: null });
  });
  let stdout = '',
    stderr = '';
  const code = await main(
    ['catalog', 'search', '--query', 'squat', '--origin', origin, '--allow-local', '--json'],
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
  assert.equal(code, 0, stderr);
  assert.equal(JSON.parse(stdout).data.items[0].key, 'ex.0001');
  assert.ok(!stdout.includes('gfa1.'));
});
