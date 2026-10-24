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

test('Premium metric histories can span two years without truncating the daily evidence', async () => {
  const query = {
    scope: 'project:training',
    athleteId: 'student',
    from: '2024-10-24',
    until: '2026-10-24',
  };
  const days = Array.from({ length: 500 }, (_, i) => ({
    day: new Date(Date.parse(query.from) + i * 86400000).toISOString().slice(0, 10),
    sessions: 1,
    runs: 0,
    durationSeconds: 1200,
    distanceMeters: 0,
  }));
  const result = await readMetrics(
    {
      get: async (path, sent) => {
        assert.equal(path, 'metrics');
        assert.deepEqual(sent, query);
        return { ...query, epoch: 'epoch', checkpoint: '8', days };
      },
    },
    query,
  );
  assert.equal(result.days.length, 500);
});

test('a server history refusal cannot be reported as empty or reused Premium progress', async () => {
  const refusal = Object.assign(new Error('Recent dates required'), {
    code: 'history_outside_plan',
  });
  await assert.rejects(
    readMetrics(
      {
        get: async () => {
          throw refusal;
        },
      },
      { scope: 'project:training', athleteId: 'student', from: '2024-10-24', until: '2026-10-24' },
    ),
    (error) => error === refusal,
  );
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

test('muscle insights preserve athlete/period/checkpoint and never turn denied or malformed data into an empty review', async () => {
  const { readMuscleInsights } = await import('../src/fitness.mjs');
  const query = {
    scope: 'project:training',
    athleteId: 'student',
    from: '2026-10-01',
    until: '2026-10-24',
  };
  const page = {
    ...query,
    epoch: 'epoch',
    checkpoint: '4',
    availableFrom: '2024-10-24',
    timezone: 'UTC',
    premiumOnly: true,
    methodology: 'Measured observations',
    exercises: [],
    nextAfter: null,
  };
  const client = {
    get: async (name, input) => {
      assert.equal(name, 'muscle-insights');
      assert.deepEqual(input, query);
      return page;
    },
  };
  assert.deepEqual(await readMuscleInsights(client, query), page);
  // The service resolves an omitted athlete to the authenticated user. It
  // still returns that user's ID; omission must not be treated as a mismatch.
  const ownQuery = { ...query };
  delete ownQuery.athleteId;
  const ownPage = { ...page, athleteId: 'connected-owner' };
  assert.deepEqual(await readMuscleInsights({ get: async () => ownPage }, ownQuery), ownPage);
  for (const patch of [
    { from: '2026-02-30' },
    { until: '2026-09-01' },
    { athleteId: '../owner' },
    { after: 'x' },
    { scope: 'personal:owner' },
  ]) {
    await assert.rejects(
      readMuscleInsights(
        { get: () => assert.fail('Invalid input must not call server') },
        { ...query, ...patch },
      ),
      { code: 'invalid_arguments' },
    );
  }
  for (const patch of [
    { athleteId: 'other' },
    { scope: 'project:other' },
    { from: '2026-10-02' },
    { availableFrom: '2026-10-20' },
    { nextAfter: 'missing' },
    { premiumOnly: false },
  ]) {
    await assert.rejects(readMuscleInsights({ get: async () => ({ ...page, ...patch }) }, query), {
      code: 'invalid_response',
    });
  }
  const denied = Object.assign(new Error('Premium required'), {
    code: 'premium_muscle_insights_required',
  });
  await assert.rejects(
    readMuscleInsights(
      {
        get: async () => {
          throw denied;
        },
      },
      query,
    ),
    (error) => error === denied,
  );
});

test('athlete metrics preserve the requested identity and reject whole-program or other-student replies', async () => {
  const query = {
    scope: 'project:training',
    from: '2026-10-11',
    until: '2026-10-24',
    athleteId: 'student',
  };
  const page = { ...query, epoch: 'epoch', checkpoint: '8', days: [] };
  const client = {
    get: async (name, input) => {
      assert.equal(name, 'metrics');
      assert.equal(input.athleteId, 'student');
      return page;
    },
  };
  assert.equal((await readMetrics(client, query)).athleteId, 'student');
  for (const athleteId of [undefined, 'other']) {
    await assert.rejects(readMetrics({ get: async () => ({ ...page, athleteId }) }, query), {
      code: 'invalid_response',
    });
  }
});
