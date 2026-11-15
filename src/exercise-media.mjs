import * as z from 'zod/v4';
import contract from './exercise-media-contract.mjs';
import { fail } from './errors.mjs';
import { maxExerciseReadBytes } from './exercise-media-limits.mjs';
const schema = (name) =>
  z.fromJSONSchema({
    $ref: '#/$defs/GeniusFitness.ExerciseMedia.' + name,
    $defs: contract.definitions,
  });
export const exerciseMediaReadSchema = z
  .object({ exerciseId: z.string().regex(/^[A-Za-z0-9_-]{1,128}$/) })
  .strict();
export const exerciseMediaOpenSchema = exerciseMediaReadSchema
  .extend({ request: schema('Upload') })
  .strict();
// Compatibility is limited to reading an already-confirmed local receipt.
// CommandJournal revalidates the current Upload schema before any network call.
const historicalDefinitions = structuredClone(contract.definitions);
historicalDefinitions['GeniusFitness.ExerciseMedia.Upload'].properties.size.maximum =
  maxExerciseReadBytes;
const historicalOpenSchema = exerciseMediaReadSchema
  .extend({
    request: z.fromJSONSchema({
      $ref: '#/$defs/GeniusFitness.ExerciseMedia.Upload',
      $defs: historicalDefinitions,
    }),
  })
  .strict();
export function validateHistoricalExerciseMediaOpen(input) {
  return check(historicalOpenSchema, input);
}
export const exerciseMediaChangeSchema = exerciseMediaReadSchema
  .extend({ request: schema('Change') })
  .strict();
const listSchema = schema('MediaCollection'),
  sessionSchema = schema('Session');
const check = (schema, input) => {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    fail('invalid_arguments', 'Use the exact exercise media schema and current epoch/revision.');
  }
  return parsed.data;
};
export function validateExerciseMediaOpen(input) {
  return check(exerciseMediaOpenSchema, input);
}
export function validateExerciseMediaChange(input) {
  const value = check(exerciseMediaChangeSchema, input),
    change = value.request;
  if (
    change.action === 'reorder'
      ? (change.assetId !== undefined && change.assetId !== null) ||
        !Array.isArray(change.assetIds) ||
        new Set(change.assetIds).size !== change.assetIds.length
      : !change.assetId ||
        (change.assetIds !== undefined && change.assetIds !== null) ||
        (change.sequence !== undefined && change.sequence !== null)
  ) {
    fail(
      'invalid_arguments',
      'Attach/detach use one assetId; reorder supplies the complete unique assetIds and optional sequence mode.',
    );
  }
  return value;
}
export function validExerciseMediaList(result, input) {
  return (
    listSchema.safeParse(result).success &&
    result.exerciseId === input.exerciseId &&
    new Set(result.images.map((image) => image.assetId)).size === result.images.length &&
    result.images.every((image, index) => image.order === index)
  );
}
export function validExerciseMediaSession(result, input) {
  return (
    sessionSchema.safeParse(result).success &&
    result.exerciseId === input.exerciseId &&
    result.assetId === input.request.id &&
    validExerciseMediaList(result.media, input) &&
    result.media.epoch === input.request.expectedEpoch &&
    result.uploadPath === `/api/agents/v1/exercise-media/${result.assetId}/content` &&
    result.readPath === result.uploadPath
  );
}
export function validExerciseMediaChange(result, input) {
  return validExerciseMediaList(result, input) && result.epoch === input.request.expectedEpoch;
}
export async function readExerciseMedia(client, input) {
  const value = check(exerciseMediaReadSchema, input);
  const result = await client.exerciseMedia(value.exerciseId);
  if (!validExerciseMediaList(result, value)) {
    fail('invalid_response', 'The exercise photo list is invalid.');
  }
  return result;
}
