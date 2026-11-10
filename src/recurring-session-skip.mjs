import * as z from 'zod/v4';
import contract from './recurring-session-skip-contract.mjs';
import { fail } from './errors.mjs';

// Generated TypeSpec wire shapes are the only DTO definitions for this protocol.
export const recurringSessionSkipRequestSchema = z.fromJSONSchema(contract.Request);
export const recurringSessionSkipConfirmationSchema = z.fromJSONSchema(contract.Confirmation);
const previewSchema = z.fromJSONSchema(contract.Preview);
const resultSchema = z.fromJSONSchema(contract.Result);
const canonical = (value) =>
  JSON.stringify(value, (_, item) =>
    item && typeof item === 'object' && !Array.isArray(item)
      ? Object.fromEntries(
          Object.keys(item)
            .sort()
            .map((key) => [key, item[key]]),
        )
      : item,
  );
const same = (a, b) => canonical(a) === canonical(b);
const sameBaseTarget = (a, b) =>
  ['scope', 'athleteId', 'trainingId'].every((key) => a[key] === b[key]);
const sameTask = (a, b) => sameBaseTarget(a, b) && a.taskId === b.taskId;
const boundSessionRequest = (outer, nested) =>
  nested.action === 'skip' &&
  nested.operationId === outer.operationId &&
  sameBaseTarget(outer.target, nested.target);
const checked = (schema, value, code) => {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    fail(
      code,
      'Use the complete canonical recurring-session request or confirmation, including explicit nulls; do not add task, actor or authority fields.',
    );
  }
  return parsed.data;
};
function confirmationMatches(c) {
  return boundSessionRequest(c.request, c.session.request);
}
/** A late retry keeps the original confirmation. Only the service can determine
 * whether it is an expired first attempt or a retained committed receipt. */
export function validateRecurringSessionSkipConfirmation(value) {
  const input = checked(recurringSessionSkipConfirmationSchema, value, 'invalid_arguments');
  if (!confirmationMatches(input)) {
    fail(
      'invalid_arguments',
      'The nested session must name the same operation, scope, athlete and training, with action skip.',
    );
  }
  return input;
}
/** Bind both levels of the canonical receipt to the saved immutable operation.
 * This establishes a historical receipt, never current planning or permission. */
export function validRecurringSessionSkipReceipt(value, input) {
  const parsed = resultSchema.safeParse(value);
  if (!parsed.success) {
    return false;
  }
  const result = parsed.data,
    session = result.session,
    expected = input.session;
  return (
    same(result.request, input.request) &&
    result.occurrenceKey === input.occurrenceKey &&
    sameTask(session.target, expected.request.target) &&
    sameTask(session.decision.target, expected.request.target) &&
    session.epoch === expected.epoch &&
    session.decision.operationId === input.request.operationId &&
    session.decision.disposition === 'skipped' &&
    session.mutationId === `session-recurrence-skip:${input.request.operationId}`
  );
}
function consistentPreview(view, request) {
  if (!same(view.request, request)) {
    return false;
  }
  const session = view.session;
  if (
    session &&
    (!boundSessionRequest(request, session.request) ||
      session.expiresAt < session.preparedAt ||
      (session.state === 'review'
        ? session.reason !== 'review' || session.key === null || session.startsAt === null
        : session.reason === 'review' || session.key !== null) ||
      (session.decision &&
        ['scope', 'athleteId', 'taskId'].some(
          (key) => session.decision.target[key] !== session.request.target[key],
        )))
  ) {
    return false;
  }
  if (view.state === 'blocked') {
    return (
      view.confirmation === null &&
      !['review', 'already_materialized'].includes(view.reason) &&
      (!session || (session.state === 'blocked' && view.reason === session.reason))
    );
  }
  if (!session || view.occurrenceKey === null) {
    return false;
  }
  if (view.state === 'materialized') {
    return view.reason === 'already_materialized' && view.confirmation === null;
  }
  const c = view.confirmation;
  return (
    view.reason === 'review' &&
    session.state === 'review' &&
    c !== null &&
    confirmationMatches(c) &&
    same(c.request, request) &&
    c.occurrenceKey === view.occurrenceKey &&
    same(c.session, {
      request: session.request,
      epoch: session.epoch,
      decisionRevision: session.decisionRevision,
      expectedRevision: session.expectedRevision,
      preparedAt: session.preparedAt,
      previewKey: session.key,
    })
  );
}
/** Exactly one authorized read. A materialized response is returned unchanged;
 * the caller must explicitly review the existing exact-session workflow. */
export async function previewRecurringSessionSkip(client, value) {
  const request = checked(recurringSessionSkipRequestSchema, value, 'invalid_arguments');
  const token = await client.accessToken();
  const view = checked(
    previewSchema,
    await client.transport.request('/api/agents/v1/session-skip/recurring/preview', {
      method: 'POST',
      token,
      json: request,
    }),
    'invalid_response',
  );
  if (!consistentPreview(view, request)) {
    fail(
      'invalid_response',
      'The recurring preview does not bind the requested schedule and exact session or has inconsistent review fields.',
    );
  }
  return view;
}
