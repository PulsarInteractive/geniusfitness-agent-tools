/** Decode recorded session facts without turning a running timer into a claim
 * of continuous physical effort. No network, imputation or health inference. */
const number = (value, max = 86400) =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max ? value : null;
const stamp = (value) => {
  const seconds = number(value, 4102444800);
  return seconds === null ? null : new Date(seconds * 1000).toISOString();
};
const date = (value) =>
  typeof value === 'string' && value.length <= 64 && Number.isFinite(Date.parse(value))
    ? new Date(value).toISOString()
    : null;
const unknownTiming = () => ({ seconds: null, measuredSets: 0, eligibleSets: null });
const total = (sets, key) => {
  const values = sets.filter((set) => set.completed && !set.skipped).map((set) => set[key]);
  const measured = values.filter((value) => value !== null);
  return {
    seconds: measured.length ? measured.reduce((sum, value) => sum + value, 0) : null,
    measuredSets: measured.length,
    eligibleSets: values.length,
  };
};

export async function sessionAnalysis(record, offset = 0) {
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > 2560) {
    throw new RangeError('Invalid set offset');
  }
  const data = record.data ?? {};
  const warnings = [];
  let rows = [];
  try {
    if (
      data.performedSets === null ||
      data.performedSets === undefined ||
      data.performedSets === ''
    ) {
      warnings.push('sets_not_recorded');
    } else {
      if (typeof data.performedSets !== 'string' || data.performedSets.length > 16000) {
        throw Error();
      }
      rows = JSON.parse(data.performedSets);
      if (!Array.isArray(rows) || rows.length > 2560) {
        throw Error();
      }
    }
  } catch {
    rows = [];
    warnings.push('invalid_recorded_sets');
  }
  const validReference = (row) =>
    row &&
    typeof row === 'object' &&
    !Array.isArray(row) &&
    typeof row.ex === 'string' &&
    row.ex.length > 0 &&
    !row.ex.includes('\0') &&
    [...row.ex].length <= 160;
  let resolved =
    typeof data.performedSets === 'string' &&
    !warnings.length &&
    typeof data.setIdentity === 'string' &&
    /^v1:[a-f0-9]{64}$/.test(data.setIdentity) &&
    rows.every(validReference);
  if (resolved) {
    const digest = new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data.performedSets)),
    );
    resolved =
      data.setIdentity ===
      'v1:' + Array.from(digest, (value) => value.toString(16).padStart(2, '0')).join('');
  }
  if (!resolved) {
    warnings.push('set_identity_unresolved');
  }
  const latest = new Map(),
    corrected = new Set();
  for (const [position, row] of rows.entries()) {
    if (!validReference(row)) {
      warnings.push('invalid_set_row');
      continue;
    }
    // Same read-only identity convention as the phone/Watch: unindexed rows
    // remain distinct; only exact indexed snapshots can correct each other.
    const partition =
      typeof row.rd === 'number' &&
      Number.isFinite(row.rd) &&
      Math.abs(row.rd) <= Number.MAX_SAFE_INTEGER
        ? Math.trunc(row.rd)
        : -1;
    const key = JSON.stringify([
      row.ex,
      Number.isSafeInteger(row.i) ? ['index', row.i] : ['position', position],
      partition,
    ]);
    if (latest.has(key)) {
      warnings.push('duplicate_set_key');
      corrected.add(key);
    }
    // Corrections use the last occurrence, including an undone or skipped set.
    // Keep insertion order stable for paging and match muscle analytics.
    latest.set(key, row);
  }
  const sets = [];
  for (const [key, row] of latest.entries()) {
    const completed = row.done === true,
      skipped = row.skip === true,
      untimed = row.ut === true;
    const eligible = completed && !skipped && !untimed;
    const elapsed = eligible ? number(row.es) : null;
    const rest = eligible ? number(row.ra) : null;
    sets.push({
      exerciseId: row.ex,
      setIndex: Number.isSafeInteger(row.i) ? row.i : null,
      round: Number.isSafeInteger(row.rd) && row.rd > 0 ? row.rd : null,
      type: { n: 'normal', w: 'warmup', f: 'failure', d: 'drop_set' }[row.t ?? 'n'] ?? 'unknown',
      recordedLoad: number(row.w, 100000),
      recordedLoadUnit: row.wu === 'kg' || row.wu === 'lb' ? row.wu : 'unknown',
      weightKg: row.wu === 'kg' ? number(row.w, 100000) : null,
      repetitions: number(row.r, 100000),
      exerciseDurationSeconds: number(row.d, 604800),
      distanceMeters: number(row.dist, 1000000),
      rpe: number(row.rpe, 10),
      completed,
      skipped,
      corrected: row.ed === true || corrected.has(key),
      isPersonalRecord: row.pr === true,
      completedAt: completed && !skipped ? stamp(row.at) : null,
      timing: untimed ? 'disabled' : elapsed === null && rest === null ? 'unrecorded' : 'recorded',
      recordedSetElapsedSeconds: elapsed,
      recordedRestSeconds: rest,
      targetRestSeconds: number(row.rt),
      longTimerObservation: (elapsed !== null && elapsed >= 600) || (rest !== null && rest >= 600),
    });
  }
  const groups = new Map();
  for (const set of sets) {
    if (!groups.has(set.exerciseId)) {
      groups.set(set.exerciseId, []);
    }
    groups.get(set.exerciseId).push(set);
  }
  const exercises = [...groups.entries()].map(([exerciseId, group]) => {
    return {
      exerciseId,
      completedSets: resolved ? group.filter((set) => set.completed && !set.skipped).length : null,
      skippedSets: resolved ? group.filter((set) => set.skipped).length : null,
      recordedSetTime: resolved ? total(group, 'recordedSetElapsedSeconds') : unknownTiming(),
      recordedRest: resolved ? total(group, 'recordedRestSeconds') : unknownTiming(),
    };
  });
  const startedAt = date(data.startedAt),
    endedAt = date(data.endedAt);
  const wall = startedAt && endedAt ? (Date.parse(endedAt) - Date.parse(startedAt)) / 1000 : null;
  if (wall !== null && wall < 0) {
    warnings.push('invalid_session_dates');
  }
  return {
    id: record.id,
    revision: record.revision,
    startedAt,
    endedAt,
    recordedSessionSeconds: number(data.durationSeconds),
    wallClockSpanSeconds: wall !== null && wall >= 0 ? wall : null,
    recordedSetTime: resolved ? total(sets, 'recordedSetElapsedSeconds') : unknownTiming(),
    recordedRest: resolved ? total(sets, 'recordedRestSeconds') : unknownTiming(),
    sets: sets.slice(offset, offset + 50),
    identity: resolved ? 'resolved' : 'unresolved',
    totalRecordedRows: sets.length,
    totalSets: resolved ? sets.length : null,
    setsOffset: offset,
    nextSetOffset: offset + 50 < sets.length ? offset + 50 : null,
    exercises,
    warnings: [...new Set(warnings)],
    interpretation:
      'When identity is unresolved, rows are observations whose exercise references may overlap; totalRecordedRows is a paging count, not a physical set count. Do not sum those rows. Recorded set time is a timer interval, not proof of continuous effort. Ten-minute or longer timers are observations to clarify, not confirmed absences. Missing timing and result values are unknown, never zero. recordedLoad keeps the entered number; only explicit kg/lb labels establish recordedLoadUnit. weightKg is populated only for recorded kg; do not infer units or convert unknown values. Rest follows the completed set. Do not reconstruct unrecorded pauses or heart rate.',
    wearableData: 'not_in_session_record',
  };
}

export async function analyzeSessionPage(page, id, offset = 0) {
  const record = page.items?.find((item) => item.id === id);
  return {
    scope: page.scope,
    epoch: page.epoch,
    checkpoint: page.checkpoint,
    availability: record ? 'available' : page.omittedIds?.includes(id) ? 'omitted' : 'not_found',
    analysis: record ? await sessionAnalysis(record, offset) : null,
  };
}

/** Rolling-server compatibility: older analysis responses named every entered
 * load weightKg without preserving its unit, and filled absent scalars with 0.
 * Retain useful nonzero observations, never certify that older label as kg.
 * Do not mutate the transport cache or its revision/checkpoint identity. */
export function normalizeSessionAnalysisResponse(value) {
  if (!value || typeof value !== 'object' || !Array.isArray(value.analysis?.sets)) {
    return value;
  }
  let legacy = false;
  const resolved = value.analysis.identity === 'resolved';
  const sets = value.analysis.sets.map((set) => {
    if (!set || typeof set !== 'object') {
      return set;
    }
    if (
      Object.hasOwn(set, 'recordedLoad') &&
      ['kg', 'lb', 'unknown'].includes(set.recordedLoadUnit)
    ) {
      return {
        ...set,
        weightKg: set.recordedLoadUnit === 'kg' ? number(set.recordedLoad, 100000) : null,
      };
    }
    legacy = true;
    const known = (v, max) => (v === 0 ? null : number(v, max));
    return {
      ...set,
      recordedLoad: known(set.weightKg, 100000),
      recordedLoadUnit: 'unknown',
      weightKg: null,
      repetitions: known(set.repetitions, 100000),
      exerciseDurationSeconds: known(set.exerciseDurationSeconds, 86400),
      distanceMeters: known(set.distanceMeters, 1000000),
    };
  });
  return {
    ...value,
    analysis: {
      ...value.analysis,
      sets,
      identity: resolved ? 'resolved' : 'unresolved',
      totalRecordedRows:
        value.analysis.totalRecordedRows ?? value.analysis.totalSets ?? sets.length,
      ...(!resolved
        ? {
            totalSets: null,
            sessionXp: null,
            recordedSetTime: unknownTiming(),
            recordedRest: unknownTiming(),
            exercises: (value.analysis.exercises ?? []).map((exercise) => ({
              ...exercise,
              completedSets: null,
              skippedSets: null,
              recordedSetTime: unknownTiming(),
              recordedRest: unknownTiming(),
            })),
          }
        : {}),
      warnings: [
        ...new Set([
          ...(value.analysis.warnings ?? []),
          ...(legacy ? ['legacy_load_units_unavailable'] : []),
          ...(!resolved ? ['set_identity_unresolved'] : []),
        ]),
      ],
    },
  };
}
