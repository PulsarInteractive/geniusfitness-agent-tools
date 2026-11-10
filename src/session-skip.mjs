import * as z from 'zod/v4';
import { fail } from './errors.mjs';

const identifier = (max) =>
  z
    .string()
    .min(1)
    .max(max)
    // eslint-disable-next-line no-control-regex -- Match canonical resource identifiers, including template colons.
    .regex(/^[^\u0000-\u001f]+$/u);
const uuid = z.string().regex(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i);
const digest = z.string().regex(/^[a-f0-9]{64}$/);
const instant = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const targetSchema = z
  .object({
    scope: identifier(256).regex(/^project:.+$/u),
    athleteId: z.string().regex(/^[A-Za-z0-9_-]{1,128}$/),
    trainingId: identifier(256),
    taskId: identifier(256),
  })
  .strict();
export const sessionSkipRequestSchema = z
  .object({
    representationVersion: z.literal(1),
    operationId: uuid,
    action: z.enum(['skip', 'restore']),
    target: targetSchema,
  })
  .strict();
const revision = identifier(128).nullable();
const decisionRevision = z.number().int().min(0).max(2147483647);
export const sessionSkipConfirmationSchema = z
  .object({
    request: sessionSkipRequestSchema,
    epoch: identifier(128),
    decisionRevision,
    expectedRevision: revision,
    preparedAt: instant,
    previewKey: digest,
  })
  .strict();
const decisionSchema = z
  .object({
    disposition: z.enum(['skipped', 'restored']),
    target: targetSchema,
    startsAt: z.string().datetime({ offset: true }).max(40),
    operationId: uuid,
    actorId: identifier(128),
    decidedAt: instant,
    sourceVersion: digest,
  })
  .strict();
const previewSchema = z
  .object({
    representationVersion: z.literal(1),
    state: z.enum(['review', 'blocked']),
    reason: z.enum([
      'review',
      'already_skipped',
      'not_skipped',
      'active_session',
      'completed_session',
      'activity_unknown',
      'start_pending',
      'occurrence_not_dated',
      'occurrence_not_future',
      'source_changed',
    ]),
    request: sessionSkipRequestSchema,
    epoch: identifier(128),
    decisionRevision,
    expectedRevision: revision,
    preparedAt: instant,
    expiresAt: instant,
    startsAt: z.string().datetime({ offset: true }).max(40).nullable(),
    sourceVersion: digest,
    key: digest.nullable(),
    decision: decisionSchema.nullable(),
  })
  .strict();
const resultSchema = z
  .object({
    representationVersion: z.literal(1),
    target: targetSchema,
    decision: decisionSchema,
    epoch: identifier(128),
    cursor: identifier(128),
    revision: identifier(128),
    mutationId: identifier(128),
  })
  .strict();
const sameTarget = (a, b) =>
  ['scope', 'athleteId', 'trainingId', 'taskId'].every((k) => a[k] === b[k]);
const check = (schema, input, code) => {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    fail(
      code,
      'Use the exact materialized session request and canonical preview fields; no exercise, completion or authority fields.',
    );
  }
  return parsed.data;
};
/** Canonical confirmation remains complete and immutable, even after expiry:
 * only the server can distinguish a late first attempt from a receipt replay. */
export function validateSessionSkipConfirmation(value) {
  return check(sessionSkipConfirmationSchema, value, 'invalid_arguments');
}
export function validSessionSkipReceipt(value, input) {
  const parsed = resultSchema.safeParse(value);
  if (!parsed.success) {
    return false;
  }
  const r = parsed.data,
    request = input.request;
  return (
    sameTarget(r.target, request.target) &&
    sameTarget(r.decision.target, request.target) &&
    r.decision.operationId === request.operationId &&
    r.epoch === input.epoch &&
    r.mutationId === `session-skip:${request.operationId}` &&
    r.decision.disposition === (request.action === 'skip' ? 'skipped' : 'restored')
  );
}
/** One authorized preview. No command, local journal, automatic confirmation,
 * fresh operation ID, recurring expansion or background retry is created. */
export async function previewSessionSkip(client, value) {
  const request = check(sessionSkipRequestSchema, value, 'invalid_arguments');
  const token = await client.accessToken();
  const preview = check(
    previewSchema,
    await client.transport.request('/api/agents/v1/session-skip/preview', {
      method: 'POST',
      token,
      json: request,
    }),
    'invalid_response',
  );
  if (
    !sameTarget(preview.request.target, request.target) ||
    preview.request.operationId !== request.operationId ||
    preview.request.action !== request.action ||
    preview.expiresAt < preview.preparedAt ||
    (preview.state === 'review'
      ? preview.key === null || preview.reason !== 'review'
      : preview.key !== null || preview.reason === 'review') ||
    (preview.decision &&
      ['scope', 'athleteId', 'taskId'].some(
        (key) => preview.decision.target[key] !== request.target[key],
      ))
  ) {
    fail(
      'invalid_response',
      'The session preview does not match this exact occurrence or has inconsistent review fields.',
    );
  }
  return preview;
}
