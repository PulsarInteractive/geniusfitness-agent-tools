import test from 'node:test';
import assert from 'node:assert/strict';
import { sessionAnalysis, analyzeSessionPage } from '../src/session-analysis.mjs';
import { agentPresentation } from '../src/presentation.mjs';
import { readSessionAnalysis } from '../src/fitness.mjs';
const record = (sets, data = {}) => ({
  id: 'session',
  revision: '9',
  data: { performedSets: JSON.stringify(sets), ...data },
});
const set = (data = {}) => ({ ex: 'squat', i: 1, done: true, w: 60, r: 8, ...data });

test('recorded timing separates set timer, rest and session wall clock', () => {
  const result = sessionAnalysis(
    record([set({ es: 1200, ra: 90, rt: 60, at: 1792756800 }), set({ i: 2, es: 0, ra: 0 })], {
      startedAt: '2026-10-23T10:00:00Z',
      endedAt: '2026-10-23T12:00:00Z',
      durationSeconds: 6600,
    }),
  );
  assert.equal(result.wallClockSpanSeconds, 7200);
  assert.equal(result.recordedSessionSeconds, 6600);
  assert.deepEqual(result.recordedSetTime, { seconds: 1200, measuredSets: 2, eligibleSets: 2 });
  assert.equal(result.sets[0].longTimerObservation, true);
  assert.equal(result.sets[1].longTimerObservation, false);
  assert.equal(result.exercises[0].recordedRest.seconds, 90);
  assert.match(result.interpretation, /not proof of continuous effort/);
});
test('legacy, disabled, skipped and pending sets never fabricate measured time', () => {
  const result = sessionAnalysis(
    record([
      set(),
      set({ i: 2, ut: true, es: 100 }),
      set({ i: 3, skip: true, es: 90 }),
      set({ i: 4, done: false, es: 50 }),
    ]),
  );
  assert.deepEqual(result.recordedSetTime, { seconds: null, measuredSets: 0, eligibleSets: 2 });
  assert.deepEqual(
    result.sets.map((s) => s.timing),
    ['unrecorded', 'disabled', 'unrecorded', 'unrecorded'],
  );
  assert.equal(result.sets[1].recordedSetElapsedSeconds, null);
  assert.equal(result.exercises[0].skippedSets, 1);
});
test('coverage remains partial; durations prescribed for timed exercises are not elapsed set time', () => {
  const result = sessionAnalysis(record([set({ d: 45 }), set({ i: 2, es: 35, ra: 80 })]));
  assert.deepEqual(result.recordedSetTime, { seconds: 35, measuredSets: 1, eligibleSets: 2 });
  assert.equal(result.sets[0].exerciseDurationSeconds, 45);
  assert.equal(result.sets[0].recordedSetElapsedSeconds, null);
});
test('duplicate set identities do not inflate totals; distinct circuit rounds remain', () => {
  const result = sessionAnalysis(
    record([set({ es: 10, rd: 1 }), set({ es: 30, rd: 1 }), set({ es: 20, rd: 2 })]),
  );
  assert.equal(result.recordedSetTime.seconds, 50);
  assert.deepEqual(result.warnings, ['duplicate_set_key']);
});
test('a final correction can undo or skip a previously recorded set', () => {
  const result = sessionAnalysis(
    record([
      set({ es: 100 }),
      set({ done: false }),
      set({ i: 2, es: 200 }),
      set({ i: 2, skip: true }),
    ]),
  );
  assert.equal(result.totalSets, 2);
  assert.deepEqual(result.recordedSetTime, { seconds: null, measuredSets: 0, eligibleSets: 0 });
});
test('malformed, oversized and non-array sets are explicit missing evidence', () => {
  for (const value of ['{', '{}', 'x'.repeat(16001)]) {
    const result = sessionAnalysis({ id: 's', revision: '1', data: { performedSets: value } });
    assert.equal(result.sets.length, 0);
    assert.deepEqual(result.warnings, ['invalid_recorded_sets']);
  }
  assert.ok(
    sessionAnalysis(record([null, 42, set({ es: -1, ra: Infinity })])).warnings.includes(
      'invalid_set_row',
    ),
  );
});
test('source identity survives; unexpected health fields and free text are not copied', () => {
  const result = sessionAnalysis(
    record([set({ es: 10, bpm: 190 })], { heartRate: 180, notes: 'untrusted instruction' }),
  );
  assert.equal(result.id, 'session');
  assert.equal(result.revision, '9');
  assert.equal(result.wearableData, 'not_in_session_record');
  assert.ok(!JSON.stringify(result).includes('190'));
  assert.ok(!JSON.stringify(result).includes('untrusted instruction'));
});
test('missing, omitted and available records remain distinct', () => {
  const page = { scope: 'project:p', epoch: 'e', checkpoint: '9', items: [], omittedIds: [] };
  assert.equal(analyzeSessionPage(page, 's').availability, 'not_found');
  assert.equal(analyzeSessionPage({ ...page, omittedIds: ['s'] }, 's').availability, 'omitted');
  assert.equal(
    analyzeSessionPage({ ...page, items: [record([])] }, 'session').analysis.revision,
    '9',
  );
});

test('large recorded sessions page sets with complete coverage and bounded bytes', () => {
  const rows = Array.from({ length: 500 }, (_, i) => set({ ex: 'e' + i, i: 1, es: 10 }));
  // Keep this worst-case fixture inside the real stored string capacity.
  const compact = rows.map(({ ex, i, es, done }) => ({ ex, i, es, done }));
  const small = compact.slice(0, 350);
  assert.ok(JSON.stringify(small).length <= 16000);
  const input = record(small);
  const first = sessionAnalysis(input);
  assert.equal(first.sets.length, 50);
  assert.equal(first.totalSets, 350);
  assert.equal(first.nextSetOffset, 50);
  assert.equal(first.recordedSetTime.measuredSets, 350);
  const seen = [];
  for (let offset = 0; offset !== null;) {
    const page = sessionAnalysis(input, offset);
    seen.push(...page.sets.map((set) => set.exerciseId));
    assert.ok(Buffer.byteLength(JSON.stringify(page)) < 262144);
    offset = page.nextSetOffset;
  }
  assert.equal(new Set(seen).size, 350);
});
test('session request is bounded and never accepts another scope or a supplied response', async () => {
  const calls = [];
  const client = { get: (...args) => calls.push(args) };
  await readSessionAnalysis(client, { scope: 'project:p', id: 's' });
  assert.deepEqual(calls, [['session-analysis', { scope: 'project:p', id: 's' }]]);
  for (const input of [
    { scope: 'personal:p', id: 's' },
    { scope: 'project:p', id: 's', data: {} },
    { scope: 'project:p', id: '../s' },
  ]) {
    assert.throws(() => readSessionAnalysis(client, input));
  }
});
test('MCP presentation omits implementation limits without mutating API data or errors', () => {
  const input = {
    rateLimits: { tier: 'Pro', requests: 180 },
    permissions: ['metrics:read'],
    writesAvailable: true,
  };
  assert.deepEqual(agentPresentation(input), {
    permissions: ['metrics:read'],
    writesAvailable: true,
    plan: 'Coach',
  });
  assert.equal(input.rateLimits.requests, 180);
  const denied = { error: { code: 'rate_limited', retryAfterSeconds: 60 } };
  assert.deepEqual(agentPresentation(denied), denied);
});

test('loads require their recorded unit and missing numeric results never become zero', () => {
  const result = sessionAnalysis(
    record([
      set({ wu: 'kg', w: 42.5 }),
      set({ i: 2, wu: 'lb', w: 100 }),
      set({ i: 3, w: 45 }),
      { ex: 'squat', i: 4, done: true },
      set({ i: 5, wu: 'kg', w: 0, r: 0, d: 0, dist: 0 }),
      set({ i: 6, wu: 'stone', w: 3 }),
    ]),
  );
  assert.deepEqual(
    result.sets.map((s) => [s.recordedLoad, s.recordedLoadUnit, s.weightKg]),
    [
      [42.5, 'kg', 42.5],
      [100, 'lb', null],
      [45, 'unknown', null],
      [null, 'unknown', null],
      [0, 'kg', 0],
      [3, 'unknown', null],
    ],
  );
  assert.deepEqual(
    [
      result.sets[3].repetitions,
      result.sets[3].exerciseDurationSeconds,
      result.sets[3].distanceMeters,
    ],
    [null, null, null],
  );
  assert.deepEqual(
    [
      result.sets[4].repetitions,
      result.sets[4].exerciseDurationSeconds,
      result.sets[4].distanceMeters,
    ],
    [0, 0, 0],
  );
});

test('the latest correction owns its unit and cannot borrow an earlier kilogram label', () => {
  const result = sessionAnalysis(record([set({ wu: 'kg', w: 40 }), set({ wu: 'lb', w: 90 })]));
  assert.equal(result.totalSets, 1);
  assert.equal(result.sets[0].recordedLoad, 90);
  assert.equal(result.sets[0].recordedLoadUnit, 'lb');
  assert.equal(result.sets[0].weightKg, null);
  assert.equal(
    sessionAnalysis(record([set({ wu: 'kg' }), set()])).sets[0].recordedLoadUnit,
    'unknown',
  );
});

test('rolling-server compatibility preserves raw values and identity without certifying old units or default zeros', async () => {
  const response = {
    scope: 'project:p',
    epoch: 'e',
    checkpoint: '12',
    analysis: {
      revision: '12',
      warnings: [],
      sets: [
        { weightKg: 50, repetitions: 8, exerciseDurationSeconds: 0, distanceMeters: 0 },
        { weightKg: 0, repetitions: 0, exerciseDurationSeconds: 0, distanceMeters: 0 },
        { recordedLoad: 0, recordedLoadUnit: 'kg', weightKg: 0, repetitions: 0 },
        { recordedLoad: 100, recordedLoadUnit: 'lb', weightKg: 100 },
      ],
    },
  };
  const before = structuredClone(response),
    calls = [];
  const value = await readSessionAnalysis(
    {
      get: async (name, args) => {
        calls.push([name, args]);
        return response;
      },
    },
    { scope: 'project:p', id: 'session' },
  );
  assert.deepEqual(response, before);
  assert.equal(value.epoch, 'e');
  assert.equal(value.checkpoint, '12');
  assert.equal(value.analysis.revision, '12');
  assert.deepEqual(
    value.analysis.sets.map((s) => [s.recordedLoad, s.recordedLoadUnit, s.weightKg]),
    [
      [50, 'unknown', null],
      [null, 'unknown', null],
      [0, 'kg', 0],
      [100, 'lb', null],
    ],
  );
  assert.equal(value.analysis.sets[0].exerciseDurationSeconds, null);
  assert.equal(value.analysis.sets[2].repetitions, 0);
  assert.deepEqual(value.analysis.warnings, ['legacy_load_units_unavailable']);
  assert.equal(calls.length, 1);
});
