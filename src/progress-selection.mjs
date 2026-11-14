import * as z from 'zod/v4';
import contract from './progress-selection-contract.mjs';
import { fail } from './errors.mjs';

const schema = (name) =>
  z.fromJSONSchema({ $ref: '#/$defs/' + contract.roots[name], $defs: contract.definitions });
export const progressSelectionSchema = schema('request');
const responseSchema = schema('result');
const dayNumber = (day) => Date.parse(day) / 86400000;
const unique = (values) => new Set(values).size === values.length;

function localDateReader(timeZone) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return (stamp) => {
    const parts = Object.fromEntries(
      formatter.formatToParts(new Date(stamp)).map(({ type, value }) => [type, value]),
    );
    return `${parts.year}-${parts.month}-${parts.day}`;
  };
}

function validSession(session, asOf, availableFrom) {
  const start = Date.parse(session.startedAt),
    end = Date.parse(session.endedAt);
  return (
    start >= availableFrom &&
    end >= start &&
    end <= asOf &&
    session.elapsedSeconds === (end - start) / 1000 &&
    session.totalSets === session.completedSets + session.skippedSets + session.unfinishedSets &&
    session.workingSets <= session.completedSets &&
    session.correctedSets <= session.totalSets &&
    session.observedExerciseCount <= session.totalSets
  );
}

function validPeriod(period, asOf, availableFrom, localDate) {
  const from = Date.parse(period.from),
    until = Date.parse(period.until),
    through = Date.parse(period.observedThrough);
  const dates = period.observedTrainingDays;
  const counts = [period.sessionsWithWork, period.activeDays, period.workingSets];
  if (
    until <= from ||
    through !== Math.min(asOf, until) ||
    period.closed !== asOf >= until ||
    period.omittedRecords + period.observedSessionsWithWork > period.examinedRecords ||
    period.observedWorkingSets < period.observedSessionsWithWork ||
    dates.length > period.observedSessionsWithWork ||
    period.exampleSessionIds.length > period.observedSessionsWithWork ||
    !unique(dates) ||
    !unique(period.exampleSessionIds) ||
    dates.some(
      (date, index) =>
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        !Number.isFinite(Date.parse(date)) ||
        new Date(date).toISOString().slice(0, 10) !== date ||
        date < localDate(from) ||
        date >= localDate(until) ||
        date > localDate(asOf) ||
        (index > 0 && date <= dates[index - 1]),
    )
  ) {
    return false;
  }
  if (period.coverage === 'complete') {
    return (
      !period.capped &&
      period.omittedRecords === 0 &&
      availableFrom <= from &&
      period.sessionsWithWork === period.observedSessionsWithWork &&
      period.activeDays === dates.length &&
      period.workingSets === period.observedWorkingSets
    );
  }
  return (
    counts.every((count) => count === null) &&
    (period.coverage !== 'unavailable' ||
      (!period.capped &&
        period.examinedRecords === 0 &&
        period.omittedRecords === 0 &&
        period.observedSessionsWithWork === 0 &&
        period.observedWorkingSets === 0))
  );
}

function validResult(result, query) {
  if (result.scope !== query.scope || result.selection !== query.selection) {
    return false;
  }
  const asOf = Date.parse(result.asOf),
    availableFrom = Date.parse(result.availableFrom);
  const localDate = localDateReader(result.timeZone);
  if (!Number.isFinite(asOf) || availableFrom > asOf) {
    return false;
  }
  if (query.selection === 'latest_training_session') {
    return (
      result.periods.length === 0 &&
      result.running === null &&
      result.windowFrom === null &&
      result.windowUntil === null &&
      (result.latestSession === null
        ? result.state === 'insufficient_data' && result.latestSessionUnavailableReason !== null
        : result.state === 'ready' &&
          result.latestSessionUnavailableReason === null &&
          validSession(result.latestSession, asOf, availableFrom))
    );
  }
  const days = query.selection === 'last_7_days' ? 7 : 28;
  const periods = result.periods,
    runs = result.running;
  if (
    result.latestSession !== null ||
    result.latestSessionUnavailableReason !== null ||
    periods.length !== days / 7 ||
    result.windowFrom !== periods[0].from ||
    Date.parse(result.windowUntil) !== asOf ||
    dayNumber(localDate(asOf)) - dayNumber(localDate(result.windowFrom)) !== days - 1 ||
    periods.some(
      (period, index) =>
        !validPeriod(period, asOf, availableFrom, localDate) ||
        dayNumber(localDate(period.until)) - dayNumber(localDate(period.from)) !== 7 ||
        (index > 0 && period.from !== periods[index - 1].until),
    ) ||
    runs === null ||
    (runs.windowComplete && !runs.candidatePageComplete) ||
    runs.observationsComplete !== (runs.windowComplete && runs.omittedObservations === 0) ||
    runs.observations.length + runs.omittedObservations > runs.examinedRecords ||
    !unique(runs.observations.map((run) => run.runId)) ||
    runs.observations.some(
      (run) =>
        Date.parse(run.startedAt) < Math.max(availableFrom, Date.parse(result.windowFrom)) ||
        Date.parse(run.endedAt) < Date.parse(run.startedAt) ||
        Date.parse(run.endedAt) < Date.parse(result.windowFrom) ||
        Date.parse(run.endedAt) > asOf,
    )
  ) {
    return false;
  }
  const usable =
    periods.some((period) => period.observedSessionsWithWork > 0) || runs.observations.length > 0;
  return result.state === (usable ? 'ready' : 'insufficient_data');
}

/** Exactly one ordinary data request. The service owns identity, current rights,
 * retention and source selection. No extra identity read, generation, fallback,
 * cache, polling or automatic traversal is introduced by this projection. */
export async function readProgressSelection(client, input) {
  const parsed = progressSelectionSchema.safeParse(input);
  if (!parsed.success) {
    fail('invalid_arguments', 'Choose your programme and one supported progress selection.');
  }
  const query = parsed.data;
  const decoded = responseSchema.safeParse(await client.get('progress-selection', query));
  let valid = false;
  if (decoded.success) {
    try {
      valid = validResult(decoded.data, query);
    } catch {
      // Invalid dates/time zones are an invalid response, never empty progress.
    }
  }
  if (!valid) {
    fail('invalid_response', 'The selected progress response is inconsistent or unavailable.');
  }
  return decoded.data;
}
