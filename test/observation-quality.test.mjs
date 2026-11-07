import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { sessionAnalysis, normalizeSessionAnalysisResponse } from '../src/session-analysis.mjs';
import { readMetrics } from '../src/fitness.mjs';
import { createMcpServer } from '../src/mcp.mjs';
import { Client } from '@modelcontextprotocol/client';
import { InMemoryTransport } from '@modelcontextprotocol/server';

const record = (rows, attested = true) => {
  const performedSets = JSON.stringify(rows);
  return {
    id: 's',
    revision: '1',
    data: {
      performedSets,
      ...(attested
        ? { setIdentity: 'v1:' + createHash('sha256').update(performedSets).digest('hex') }
        : {}),
    },
  };
};
const row = (extra = {}) => ({ ex: 'a', i: 1, done: true, r: 5, es: 10, ...extra });

test('legacy unindexed histories can explicitly page beyond a thousand rows', async () => {
  const source = record(Array.from({ length: 1100 }, () => ({ ex: 'a' })));
  assert.ok(source.data.performedSets.length <= 16000);
  const result = await sessionAnalysis(source, 1050);
  assert.equal(result.totalRecordedRows, 1100);
  assert.equal(result.sets.length, 50);
  assert.equal(result.nextSetOffset, null);
});

test('unknown or stale identity preserves rows without asserting aggregate set counts', async () => {
  for (const input of [
    record([row(), row({ ex: 'legacy-a' })], false),
    {
      ...record([row()]),
      data: { ...record([row()]).data, performedSets: JSON.stringify([row({ r: 6 })]) },
    },
  ]) {
    const result = await sessionAnalysis(input);
    assert.equal(result.totalSets, null);
    assert.equal(result.identity, 'unresolved');
    assert.equal(result.totalRecordedRows, result.sets.length);
    assert.deepEqual(result.recordedSetTime, {
      seconds: null,
      measuredSets: 0,
      eligibleSets: null,
    });
    assert.equal(result.exercises[0].completedSets, null);
    assert.equal(result.sets[0].recordedSetElapsedSeconds, 10);
    assert.ok(result.warnings.includes('set_identity_unresolved'));
  }
});
test('valid identity, duplicate corrections and explicit zero remain distinct', async () => {
  const result = await sessionAnalysis(
    record([row({ es: 20 }), row({ es: 0 }), row({ ex: 'b', es: 0 })]),
  );
  assert.equal(result.sets[0].corrected, true);
  assert.equal(result.identity, 'resolved');
  assert.equal(result.totalSets, 2);
  assert.equal(result.sets[1].corrected, false);
  assert.deepEqual(result.recordedSetTime, { seconds: 0, measuredSets: 2, eligibleSets: 2 });
});
test('legacy unindexed rows remain separate and unicode exercise IDs survive the read boundary', async () => {
  const result = await sessionAnalysis(
    record([
      row({ i: undefined, ex: '界'.repeat(160), d: 90000 }),
      row({ i: undefined, ex: '界'.repeat(160) }),
    ]),
  );
  assert.equal(result.identity, 'resolved');
  assert.equal(result.totalSets, 2);
  assert.equal(result.sets[0].setIndex, null);
  assert.equal(result.sets[0].exerciseDurationSeconds, 90000);
  assert.equal(result.sets[0].corrected, false);
});
test('older analysis responses cannot establish aggregate identity', () => {
  const source = {
    analysis: {
      totalSets: 2,
      sessionXp: 42,
      sets: [{ recordedLoad: 10, recordedLoadUnit: 'kg' }],
      recordedSetTime: { seconds: 20, measuredSets: 2, eligibleSets: 2 },
      recordedRest: { seconds: 0, measuredSets: 2, eligibleSets: 2 },
      exercises: [{ exerciseId: 'a', completedSets: 2, skippedSets: 0 }],
      warnings: [],
    },
  };
  const original = structuredClone(source);
  const result = normalizeSessionAnalysisResponse(source);
  assert.equal(result.analysis.identity, 'unresolved');
  assert.equal(result.analysis.totalSets, null);
  assert.equal(result.analysis.sessionXp, null);
  assert.equal(result.analysis.recordedSetTime.seconds, null);
  assert.equal(result.analysis.exercises[0].completedSets, null);
  assert.deepEqual(source, original);
});

const query = { scope: 'project:p', from: '2026-11-01', until: '2026-11-07' };
const day = {
  day: '2026-11-02',
  sessions: 1,
  runs: 1,
  durationSeconds: null,
  distanceMeters: 0,
  durationMeasuredActivities: 1,
  distanceMeasuredRuns: 1,
};
const page = {
  ...query,
  epoch: 'e',
  checkpoint: '1',
  measurementCoverage: 'recorded',
  days: [day],
};
test('metrics preserve incomplete duration separately from explicitly recorded zero distance', async () => {
  assert.deepEqual(await readMetrics({ get: async () => page }, query), page);
});
test('metrics reject totals claiming complete coverage over missing or impossible measurements', async () => {
  for (const patch of [
    { durationSeconds: 60 },
    { durationMeasuredActivities: 3 },
    { distanceMeasuredRuns: 0 },
    { distanceMeters: Infinity },
    { durationMeasuredActivities: null },
  ]) {
    await assert.rejects(
      readMetrics({ get: async () => ({ ...page, days: [{ ...day, ...patch }] }) }, query),
      { code: 'invalid_response' },
    );
  }
});
test('older metrics retain activity counts but never certify their unqualified totals', async () => {
  const legacy = {
    ...query,
    epoch: 'e',
    checkpoint: '1',
    days: [{ day: day.day, sessions: 1, runs: 1, durationSeconds: 60, distanceMeters: 0 }],
  };
  const result = await readMetrics({ get: async () => legacy }, query);
  assert.equal(result.days[0].durationSeconds, null);
  assert.equal(result.measurementCoverage, 'unknown');
  assert.equal(result.days[0].distanceMeters, null);
  assert.equal(result.days[0].durationMeasuredActivities, null);
  assert.equal(result.days[0].sessions, 1);
  assert.equal(legacy.days[0].durationSeconds, 60);
});

test('MCP output keeps uncertain session XP and incomplete daily totals explicit', async () => {
  const analysis = await sessionAnalysis(record([row()], false));
  const server = createMcpServer({
    get: async (path) =>
      path === 'metrics'
        ? page
        : {
            scope: 'project:p',
            epoch: 'e',
            checkpoint: '1',
            availability: 'available',
            analysis: { ...analysis, sessionXp: 42 },
          },
  });
  const client = new Client({ name: 'observation-fixture', version: '1' });
  const [a, b] = InMemoryTransport.createLinkedPair();
  await server.connect(a);
  await client.connect(b);
  try {
    const call = async (name, arguments_) => {
      const result = await client.callTool({ name, arguments: arguments_ });
      assert.notEqual(result.isError, true, JSON.stringify(result.content));
      return JSON.parse(result.content.find((item) => item.type === 'text').text);
    };
    const session = await call('fitness_session_analysis', { scope: 'project:p', id: 's' });
    assert.equal(session.analysis.identity, 'unresolved');
    assert.equal(session.analysis.sessionXp, null);
    assert.equal(session.analysis.totalSets, null);
    assert.equal(session.analysis.sets[0].repetitions, 5);
    const daily = await call('fitness_metrics', query);
    assert.equal(daily.days[0].durationSeconds, null);
    assert.equal(daily.days[0].distanceMeters, 0);
    assert.equal(daily.days[0].durationMeasuredActivities, 1);
  } finally {
    await client.close();
    await server.close();
  }
});
