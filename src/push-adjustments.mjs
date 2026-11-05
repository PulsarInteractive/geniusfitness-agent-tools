import * as z from 'zod/v4';
import { fail } from './errors.mjs';

const id = z.string().min(1).max(128);
const athlete = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/);
const scope = z.string().regex(/^project:[A-Za-z0-9_-]{1,128}$/);
const session = z.string().uuid();
const cursor = z.string().min(1).max(4096);
export const pushAdjustmentsSchema = z
  .object({
    scope,
    athleteId: athlete,
    sessionId: session,
    outcomeId: id,
    cursor: cursor.optional(),
  })
  .strict();
const values = z
  .object({
    repetitions: z.number().int().min(0).max(10000),
    loadMilliunits: z.number().int().min(0).max(2000000).nullable(),
  })
  .strict();
const occurrence = z
  .object({
    athleteId: athlete,
    projectId: id,
    trainingId: id,
    occurrenceId: id,
  })
  .strict();
const target = z
  .object({
    projectId: id,
    trainingId: id,
    occurrenceId: id.nullable(),
    sessionId: id.nullable(),
    exerciseId: id,
    setIndex: z.number().int().min(1).max(1000),
    round: z.number().int().min(1).max(1000).nullable(),
    side: z.enum(['both', 'left', 'right', 'alternating', 'unknown']),
  })
  .strict();
const time = z.string().max(40).datetime();
const entry = z
  .object({
    id,
    target,
    before: values,
    after: values,
    unit: z.enum(['kg', 'lb', 'none', 'unknown']),
    convention: z.enum([
      'total_external',
      'per_implement',
      'per_side',
      'assistance',
      'none',
      'unknown',
    ]),
    state: z.enum(['saved', 'withdrawn']),
    savedAt: time,
    withdrawnAt: time.nullable(),
    automatic: z.boolean(),
    goal: z
      .enum(['muscle', 'strength', 'fat_loss', 'endurance', 'consistency', 'general'])
      .nullable(),
    sourceResults: z.array(z.object({ id, sessionId: session.nullable() }).strict()).max(16),
  })
  .strict();
const response = z
  .object({
    scope,
    athleteId: athlete,
    sessionId: session,
    outcomeId: id,
    projectId: id,
    trainingId: id,
    epoch: z.string().min(1).max(64),
    checkpoint: z.string().min(1).max(64),
    sourceRevision: z.string().max(64).nullable(),
    occurrence: occurrence.nullable(),
    entries: z.array(entry).max(16),
    nextCursor: cursor.nullable(),
    serverTime: z.number().min(0).max(4102444800000),
    planApplication: z.literal('not_verified'),
    coverage: z.literal('retained_records'),
    readOnly: z.literal(true),
  })
  .strict();

/** Exactly one charged page. The caller decides whether another occurrence is
 * useful; empty continuation is not absence, and a saved adjustment is not an
 * effective prescription. No polling, cache, writes or scan-until-match. */
export async function readPushAdjustments(client, input) {
  const parsed = pushAdjustmentsSchema.safeParse(input);
  if (!parsed.success) {
    fail('invalid_arguments', 'Select the program, athlete and exact recorded outcome/session.');
  }
  const q = parsed.data;
  const decoded = response.safeParse(await client.get('push-adjustments', q));
  if (!decoded.success) {
    fail('invalid_response', 'Adjustment history is incomplete or invalid.');
  }
  const p = decoded.data,
    o = p.occurrence;
  if (
    p.scope !== q.scope ||
    p.athleteId !== q.athleteId ||
    p.sessionId !== q.sessionId ||
    p.outcomeId !== q.outcomeId ||
    `project:${p.projectId}` !== q.scope ||
    (q.cursor !== undefined && p.nextCursor === q.cursor) ||
    (o === null && (p.entries.length !== 0 || p.nextCursor !== null)) ||
    (o !== null &&
      (o.athleteId !== q.athleteId ||
        o.projectId !== p.projectId ||
        o.trainingId !== p.trainingId)) ||
    new Set(p.entries.map((e) => e.id)).size !== p.entries.length ||
    p.entries.some(
      (e) =>
        e.target.projectId !== p.projectId ||
        e.target.trainingId !== p.trainingId ||
        e.target.occurrenceId !== o?.occurrenceId ||
        e.target.sessionId !== null ||
        (e.state === 'saved') !== (e.withdrawnAt === null) ||
        (e.withdrawnAt !== null && Date.parse(e.withdrawnAt) < Date.parse(e.savedAt)) ||
        (e.unit === 'none' &&
          (e.before.loadMilliunits !== null || e.after.loadMilliunits !== null)) ||
        new Set(e.sourceResults.map((r) => `${r.sessionId}:${r.id}`)).size !==
          e.sourceResults.length ||
        !e.sourceResults.some((r) => r.id === q.outcomeId && r.sessionId === q.sessionId),
    )
  ) {
    fail('invalid_response', 'Adjustment history does not match the requested result.');
  }
  return p;
}
