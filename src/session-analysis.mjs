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
const total = (sets, key) => {
  const values = sets.filter((set) => set.completed && !set.skipped).map((set) => set[key]);
  const measured = values.filter((value) => value !== null);
  return {
    seconds: measured.length ? measured.reduce((sum, value) => sum + value, 0) : null,
    measuredSets: measured.length,
    eligibleSets: values.length,
  };
};

export function sessionAnalysis(record, offset = 0) {
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > 1000) {
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
      if (!Array.isArray(rows) || rows.length > 1000) {
        throw Error();
      }
    }
  } catch {
    rows = [];
    warnings.push('invalid_recorded_sets');
  }
  const seen = new Set();
  const sets = [];
  for (const row of rows) {
    if (
      !row ||
      typeof row !== 'object' ||
      Array.isArray(row) ||
      typeof row.ex !== 'string' ||
      !row.ex ||
      row.ex.length > 128 ||
      !Number.isSafeInteger(row.i) ||
      row.i < 1 ||
      row.i > 1000
    ) {
      warnings.push('invalid_set_row');
      continue;
    }
    const key = JSON.stringify([row.ex, row.i, row.rd ?? null]);
    if (seen.has(key)) {
      warnings.push('duplicate_set_key');
      continue;
    }
    seen.add(key);
    const completed = row.done === true,
      skipped = row.skip === true,
      untimed = row.ut === true;
    const eligible = completed && !skipped && !untimed;
    const elapsed = eligible ? number(row.es) : null;
    const rest = eligible ? number(row.ra) : null;
    sets.push({
      exerciseId: row.ex,
      setIndex: row.i,
      round: Number.isSafeInteger(row.rd) && row.rd > 0 ? row.rd : null,
      type: { n: 'normal', w: 'warmup', f: 'failure', d: 'drop_set' }[row.t ?? 'n'] ?? 'unknown',
      weightKg: number(row.w ?? 0, 100000),
      repetitions: number(row.r ?? 0, 100000),
      exerciseDurationSeconds: number(row.d ?? 0),
      distanceMeters: number(row.dist ?? 0, 1000000),
      rpe: number(row.rpe, 10),
      completed,
      skipped,
      corrected: row.ed === true,
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
      completedSets: group.filter((set) => set.completed && !set.skipped).length,
      skippedSets: group.filter((set) => set.skipped).length,
      recordedSetTime: total(group, 'recordedSetElapsedSeconds'),
      recordedRest: total(group, 'recordedRestSeconds'),
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
    recordedSetTime: total(sets, 'recordedSetElapsedSeconds'),
    recordedRest: total(sets, 'recordedRestSeconds'),
    sets: sets.slice(offset, offset + 50),
    totalSets: sets.length,
    setsOffset: offset,
    nextSetOffset: offset + 50 < sets.length ? offset + 50 : null,
    exercises,
    warnings: [...new Set(warnings)],
    interpretation:
      'Recorded set time is a timer interval, not proof of continuous effort. Ten-minute or longer timers are observations to clarify, not confirmed absences. Missing timing is unknown, never zero. Rest follows the completed set. Do not reconstruct unrecorded pauses or heart rate.',
    wearableData: 'not_in_session_record',
  };
}

export function analyzeSessionPage(page, id, offset = 0) {
  const record = page.items?.find((item) => item.id === id);
  return {
    scope: page.scope,
    epoch: page.epoch,
    checkpoint: page.checkpoint,
    availability: record ? 'available' : page.omittedIds?.includes(id) ? 'omitted' : 'not_found',
    analysis: record ? sessionAnalysis(record, offset) : null,
  };
}
