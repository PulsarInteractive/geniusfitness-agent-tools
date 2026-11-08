import * as z from 'zod/v4';
import { fail } from './errors.mjs';
const id = z.string().min(1).max(128),
  identifier = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/);
export const temporaryTargetSchema = z
  .object({
    projectId: identifier,
    trainingId: id,
    sessionId: z.string().uuid().nullable(),
    occurrenceId: id.nullable(),
    exerciseId: id,
    setIndex: z.number().int().min(1).max(1000).nullable(),
  })
  .strict()
  .refine((v) => (v.sessionId === null) !== (v.occurrenceId === null));
export const temporaryDataSchema = z
  .object({
    athleteId: identifier,
    sessionId: z.string().uuid().nullable(),
    kind: z.enum(['focus', 'skip']).nullable(),
    objective: z
      .enum(['comfort', 'hypertrophy', 'strength', 'consistency', 'skip_once'])
      .nullable(),
    target: temporaryTargetSchema.nullable(),
    sourceVersion: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .nullable(),
    startsAt: z.string().datetime().nullable(),
    endsAt: z.string().datetime().nullable(),
  })
  .strict();
export const temporaryReadSchema = z
  .object({
    scope: z.string().regex(/^project:[A-Za-z0-9_-]{1,128}$/),
    athleteId: identifier,
    sessionId: z.string().uuid().optional(),
  })
  .strict();
export const temporaryResolveSchema = temporaryReadSchema
  .extend({
    selection: z.enum(['current', 'next', 'exact']),
    trainingId: id.optional(),
    occurrenceId: id.optional(),
    exerciseId: id.optional(),
    setIndex: z.number().int().min(1).max(1000).optional(),
  })
  .strict()
  .refine((v) =>
    v.selection === 'exact'
      ? !!v.trainingId &&
        !!v.exerciseId &&
        (v.sessionId === undefined) !== (v.occurrenceId === undefined)
      : !!v.sessionId &&
        [v.trainingId, v.occurrenceId, v.exerciseId, v.setIndex].every((x) => x === undefined),
  );
const entry = z
  .object({
    id: z.string().uuid(),
    kind: z.enum(['focus', 'skip']),
    objective: z.enum(['comfort', 'hypertrophy', 'strength', 'consistency', 'skip_once']),
    target: temporaryTargetSchema,
    exerciseName: z.string().max(200),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    state: z.enum([
      'active',
      'scheduled',
      'expired',
      'cancelled',
      'consumed',
      'superseded',
      'stale_target',
      'stale_access',
      'stale_policy',
    ]),
    origin: z.enum(['user', 'coach', 'agent', 'mcp']),
    actorId: id,
    supersededBy: z.string().uuid().nullable(),
    revision: z.number().int().positive(),
  })
  .strict();
const snapshot = z
  .object({
    epoch: z.string().min(1).max(64),
    revision: z
      .string()
      .regex(/^[1-9][0-9]{0,15}$/)
      .nullable(),
    serverTime: z.string().datetime(),
    entries: z.array(entry).max(64),
  })
  .strict();
const resolved = snapshot
  .extend({
    occurrenceStartsAt: z.string().datetime().nullable().optional(),
    target: temporaryTargetSchema,
    exerciseName: z.string().max(200),
    sourceVersion: z.string().regex(/^[a-f0-9]{64}$/),
    replaces: z.array(z.string().uuid()).max(32),
  })
  .strict();
export function validTemporaryCommand(c) {
  const parsed = temporaryDataSchema.safeParse(c.data);
  if (!parsed.success || !z.string().uuid().safeParse(c.id).success) {
    return false;
  }
  const d = parsed.data;
  if (c.kind !== 'coach.intent.set') {
    return (
      ['kind', 'objective', 'target', 'sourceVersion', 'startsAt', 'endsAt'].every(
        (k) => d[k] === null,
      ) && c.expectedRevision !== null
    );
  }
  return (
    d.target !== null &&
    d.target.projectId === c.scope.slice(8) &&
    d.target.sessionId === d.sessionId &&
    d.kind !== null &&
    d.objective !== null &&
    (d.kind === 'skip') === (d.objective === 'skip_once') &&
    d.sourceVersion !== null &&
    d.startsAt !== null &&
    d.endsAt !== null &&
    Date.parse(d.startsAt) < Date.parse(d.endsAt) &&
    Date.parse(d.endsAt) - Date.parse(d.startsAt) <= 7 * 86400000
  );
}
export async function readTemporaryActions(client, input, resolve = false) {
  const parsed = (resolve ? temporaryResolveSchema : temporaryReadSchema).safeParse(input);
  if (!parsed.success) {
    fail(
      'invalid_arguments',
      'Select one athlete program and an exact session or scheduled occurrence.',
    );
  }
  const value = (resolve ? resolved : snapshot).safeParse(
    await client.get(resolve ? 'coach-intent-target' : 'coach-intents', parsed.data),
  );
  if (!value.success) {
    fail('invalid_response', 'Temporary instructions are incomplete; reread before acting.');
  }
  const v = value.data,
    q = parsed.data;
  if (
    new Set(v.entries.map((e) => e.id)).size !== v.entries.length ||
    v.entries.some(
      (e) =>
        e.target.projectId !== q.scope.slice(8) ||
        (q.sessionId !== undefined && e.target.sessionId !== q.sessionId),
    ) ||
    (resolve &&
      (v.target.projectId !== q.scope.slice(8) || v.target.sessionId !== (q.sessionId ?? null)))
  ) {
    fail('invalid_response', 'The response does not match the requested athlete program.');
  }
  if (
    resolve &&
    q.selection === 'exact' &&
    ['trainingId', 'exerciseId', 'occurrenceId', 'setIndex'].some(
      (k) => v.target[k] !== (q[k] ?? null),
    )
  ) {
    fail('invalid_response', 'The resolved target differs from the requested exercise or set.');
  }
  return v;
}
