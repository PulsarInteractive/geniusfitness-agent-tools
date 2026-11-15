import * as z from 'zod/v4';
import contract from './catalogue-import-contract.mjs';
import { validateExerciseCountingMetadata } from './custom-exercise.mjs';
import { fail } from './errors.mjs';

export const catalogueImportQuerySchema = z.fromJSONSchema(contract.Query);
export const catalogueImportRequestSchema = z.fromJSONSchema(contract.Request);
const previewSchema = z.fromJSONSchema(contract.Preview),
  resultSchema = z.fromJSONSchema(contract.Result);
const pins = ['sourceContentVersion', 'subsetVersion', 'mappingVersion'];
const checked = (schema, value, code) => {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    fail(
      code,
      'Use the exact reviewed catalogue import fields; personal origin, dose and authority are server-owned.',
    );
  }
  return parsed.data;
};
/** Retain the original request, including old pins, for receipt-first replay.
 * A fresh first attempt may be refused by the server after a catalogue update. */
export function validateCatalogueImportRequest(value) {
  const input = checked(catalogueImportRequestSchema, value, 'invalid_arguments');
  if (!Number.isSafeInteger(input.issuedAt)) {
    fail('invalid_arguments', 'issuedAt must be an exact integer timestamp.');
  }
  return input;
}
export function validCatalogueImportReceipt(value, input) {
  const parsed = resultSchema.safeParse(value);
  if (!parsed.success) {
    return false;
  }
  const result = parsed.data;
  return (
    result.scope.startsWith('personal:') &&
    result.scope.length > 'personal:'.length &&
    result.elementId === input.elementId &&
    result.epoch === input.epoch &&
    result.mutationId === `reviewed-import:${input.operationId}` &&
    result.origin.catalogueKey === input.catalogueKey &&
    result.origin.loadConvention !== 'unknown' &&
    pins.every((key) => result.origin[key] === input[key])
  );
}
/** One current authorized read. No ID, journal, definition or confirmation is
 * created on the caller's behalf. A blocked projection remains visible. */
export async function previewCatalogueImport(client, value) {
  const query = checked(catalogueImportQuerySchema, value, 'invalid_arguments');
  const token = await client.accessToken();
  const result = checked(
    previewSchema,
    await client.transport.request('/api/agents/v1/catalogue/import/preview', {
      method: 'POST',
      token,
      json: query,
    }),
    'invalid_response',
  );
  const projected = result.state === 'projected';
  if (
    result.catalogueKey !== query.catalogueKey ||
    (projected
      ? result.reason !== 'explicit_reviewed_tracking' ||
        result.definition === null ||
        result.origin === null
      : result.reason === 'explicit_reviewed_tracking' ||
        result.definition !== null ||
        result.origin !== null)
  ) {
    fail(
      'invalid_response',
      'The import preview does not match the requested variant or projection state.',
    );
  }
  if (projected) {
    const definition = result.definition,
      origin = result.origin;
    if (
      definition.catalogKey !== query.catalogueKey ||
      origin.catalogueKey !== query.catalogueKey ||
      !pins.every((key) => origin[key] === result[key]) ||
      origin.loadConvention === 'unknown' ||
      (definition.exerciseType === 'ResistanceReps' &&
        (definition.defaultUnit !== 'none' || origin.loadConvention !== 'nonMass')) ||
      definition.countingConvention !== origin.countingConvention
    ) {
      fail(
        'invalid_response',
        'The reviewed definition and origin do not agree with the returned source pins.',
      );
    }
    try {
      validateExerciseCountingMetadata(definition);
    } catch {
      fail(
        'invalid_response',
        'The reviewed counting convention does not match its tracking type.',
      );
    }
  }
  return result;
}
