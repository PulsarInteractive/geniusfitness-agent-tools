import * as z from 'zod/v4';
import definitions from './reviewed-catalogue-schemas.mjs';
import { fail } from './errors.mjs';
const schema = (name) =>
  z.fromJSONSchema({ $ref: '#/$defs/' + definitions.roots[name], $defs: definitions.definitions });
export const reviewedCatalogueSchema = schema('query');
export const reviewedCatalogueDetailSchema = z
  .object({
    key: z
      .string()
      .regex(/^ex\.[0-9]+$/)
      .max(128),
  })
  .strict();
const pageSchema = schema('page'),
  detailSchema = schema('detail');
const check = (s, value, code) => {
  const parsed = s.safeParse(value);
  if (!parsed.success) {
    fail(code, 'Use the bounded reviewed catalogue contract; unknown data must remain unknown.');
  }
  return parsed.data;
};
/** One normal read per invocation, including continuation and exact detail.
 * Caller inventory is a declaration, never an implicit personal-profile read. */
export async function readReviewedCatalogue(client, input) {
  const query = check(reviewedCatalogueSchema, input, 'invalid_arguments');
  const result = check(pageSchema, await client.reviewedCatalogue(query), 'invalid_response');
  const candidates = result.catalogue.page.candidates,
    keys = candidates.map((v) => v.catalogueKey);
  const matches = result.matching.variants;
  if (
    keys.length !== result.evaluatedVariants ||
    new Set(keys).size !== keys.length ||
    result.evaluatedVariants > (query.limit ?? 48) ||
    result.evaluatedUnits > result.evaluatedVariants ||
    (result.nextCursor !== null && result.evaluatedUnits === 0) ||
    result.continuationUnit !== (query.filters?.expandVariants ? 'variant' : 'family_block') ||
    result.matching.expanded !== (query.filters?.expandVariants ?? false) ||
    result.catalogue.page.contentVersion !== result.catalogue.subsetVersion ||
    result.matching.contentVersion !== result.catalogue.subsetVersion ||
    (query.version !== undefined && query.version !== result.catalogue.subsetVersion) ||
    result.matching.evaluatedVariants !== keys.length ||
    result.matching.matchedVariants !== matches.filter((v) => v.status === 'matched').length ||
    result.matching.unknownVariants !== matches.filter((v) => v.status === 'unknown').length ||
    result.matching.registryVersion !== result.catalogue.page.registryVersion ||
    result.matching.taxonomyVersion !== result.catalogue.page.taxonomyVersion ||
    matches.length !== keys.length ||
    new Set(matches.map((v) => v.catalogueKey)).size !== keys.length ||
    matches.some((v) => !keys.includes(v.catalogueKey)) ||
    result.matching.selections.some(
      (s) =>
        !matches.some((v) => v.catalogueKey === s.selectedCatalogueKey && v.status === 'matched') ||
        s.matchedVariantKeys.some(
          (k) => !matches.some((v) => v.catalogueKey === k && v.status === 'matched'),
        ),
    )
  ) {
    fail(
      'invalid_response',
      'The partial catalogue page or matching result is inconsistent; keep the previous cursor.',
    );
  }
  return result;
}
export async function readReviewedCatalogueDetail(client, input) {
  const query = check(reviewedCatalogueDetailSchema, input, 'invalid_arguments');
  const result = check(
    detailSchema,
    await client.get('catalog-reviewed-detail', query),
    'invalid_response',
  );
  if (
    result.variant.catalogueKey !== query.key ||
    result.variant.familyId !== (result.family?.id ?? null) ||
    new Set(result.equipment.map((e) => e.id)).size !== result.equipment.length ||
    new Set(result.sources.map((s) => s.id)).size !== result.sources.length
  ) {
    fail('invalid_response', 'The exact reviewed variant did not match the request.');
  }
  return result;
}
