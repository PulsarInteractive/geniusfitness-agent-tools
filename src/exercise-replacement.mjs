import * as z from 'zod/v4';
import contract from './exercise-replacement-contract.mjs';
import { fail } from './errors.mjs';

// TypeSpec owns wire fields; the delegated boundary additionally enforces UUID
// identity and exact numeric timestamps rather than trusting format metadata.
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export const exerciseReplacementRequestSchema = z.fromJSONSchema(contract.Request);
export const exerciseReplacementConfirmationSchema = z.fromJSONSchema(contract.Confirmation);
const previewSchema = z.fromJSONSchema(contract.Preview);
const resultSchema = z.fromJSONSchema(contract.Result);
const sameRequest = (a, b) =>
  ['requestId', 'scope', 'trainingId', 'slotId', 'oldExerciseId', 'newExerciseId', 'locale'].every(
    (key) => a[key] === b[key],
  );
const checked = (schema, value, code) => {
  const result = schema.safeParse(value);
  if (!result.success) {
    fail(
      code,
      'Use the complete exact replacement request or confirmation; do not add dose, owner, snapshot or authority fields.',
    );
  }
  return result.data;
};
const exactRequest = (value, code) => {
  const request = checked(exerciseReplacementRequestSchema, value, code);
  if (!uuid.test(request.requestId)) {
    fail(code, 'Choose and retain one UUID requestId for this exact replacement.');
  }
  return request;
};
/** Preserve expired confirmations for receipt-first recovery. Never create a
 * new request, refresh a preview or convert a dose during validation/retry. */
export function validateExerciseReplacementConfirmation(value) {
  const input = checked(exerciseReplacementConfirmationSchema, value, 'invalid_arguments');
  exactRequest(input.request, 'invalid_arguments');
  if (!Number.isSafeInteger(input.preparedAt)) {
    fail('invalid_arguments', 'preparedAt must be the exact integer timestamp from the preview.');
  }
  return input;
}
/** A receipt establishes one historical commit, not a configured prescription,
 * current access or what a phone has rendered. */
export function validExerciseReplacementReceipt(value, input) {
  const parsed = resultSchema.safeParse(value);
  if (!parsed.success) {
    return false;
  }
  const result = parsed.data;
  return (
    ['scope', 'trainingId', 'slotId'].every((key) => result[key] === input.request[key]) &&
    result.elementId === input.request.newExerciseId &&
    result.epoch === input.epoch &&
    result.mutationId === `replace-exercise:${input.request.requestId}`
  );
}
/** One explicitly requested read. No operation journal or write is created. */
export async function previewExerciseReplacement(client, value) {
  const request = exactRequest(value, 'invalid_arguments');
  const token = await client.accessToken();
  const result = checked(
    previewSchema,
    await client.transport.request('/api/agents/v1/exercise-replacement/preview', {
      method: 'POST',
      token,
      json: request,
    }),
    'invalid_response',
  );
  const review = result.state === 'review';
  const diff = result.diff;
  if (
    !sameRequest(result.request, request) ||
    !Number.isSafeInteger(result.preparedAt) ||
    !Number.isSafeInteger(result.expiresAt) ||
    result.expiresAt < result.preparedAt ||
    (review
      ? result.reason !== 'review' || result.key === null || diff === null
      : result.key !== null ||
        diff !== null ||
        (result.state === 'unchanged'
          ? result.reason !== 'unchanged'
          : ['review', 'unchanged'].includes(result.reason))) ||
    (diff &&
      (diff.before.elementId !== request.oldExerciseId ||
        diff.after.elementId !== request.newExerciseId ||
        diff.after.targetSets !== '[]' ||
        diff.after.order !== diff.before.order ||
        diff.after.restSeconds !== diff.before.restSeconds ||
        !diff.cleared.includes('targetSets')))
  ) {
    fail(
      'invalid_response',
      'The replacement preview does not match the requested slot or exact prescription reset.',
    );
  }
  return result;
}
