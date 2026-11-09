import * as z from 'zod/v4';
import { fail } from './errors.mjs';

export const catalogueSearchSchema = z
  .object({
    query: z.string().max(160).optional(),
    equipment: z.string().max(80).optional(),
    muscle: z.string().max(80).optional(),
    locale: z.enum(['en', 'fr']).optional(),
    expandVariants: z.boolean().optional(),
    cursor: z.string().max(2048).optional(),
  })
  .strict();
const label = z
  .object({ en: z.string().min(1).max(240), fr: z.string().min(1).max(240).nullable() })
  .strict();
const hit = z
  .object({
    catalogueKey: z
      .string()
      .regex(/^ex\.[0-9]+$/)
      .max(100),
    label,
    equipment: z.string().max(100),
    equipmentGroup: z.string().max(100),
    muscleGroup: z.string().max(100),
    exerciseType: z.string().max(100),
    attribution: z.string().max(400),
    textScore: z.number().int().min(0).max(100),
    reason: z.enum(['browse', 'exact_name', 'name_prefix', 'family_synonym']),
  })
  .strict();
const row = z
  .object({
    familyId: z.string().max(100).nullable(),
    label,
    selectedCatalogueKey: z.string().max(100),
    familyVariantCount: z.number().int().min(1).max(48),
    variants: z.array(hit).min(1).max(48),
  })
  .strict();
const page = z
  .object({
    formatVersion: z.literal(2),
    version: z.string().regex(/^[a-f0-9]{64}$/),
    policyVersion: z.string().max(80),
    source: z.literal('legacy_metadata'),
    equipmentCompatibility: z.literal('not_assessed'),
    muscleEvidence: z.literal('not_reviewed'),
    scoreScope: z.literal('evaluated_page'),
    continuationUnit: z.literal('family_block'),
    rowUnit: z.enum(['family', 'variant']),
    locale: z.enum(['en', 'fr']),
    evaluatedVariants: z.number().int().min(0).max(48),
    evaluatedFamilies: z.number().int().min(0).max(48),
    matchedVariants: z.number().int().min(0).max(48),
    rows: z.array(row).max(48),
    facets: z
      .object({
        scope: z.literal('source_catalogue'),
        equipment: z.array(z.string().min(1).max(100)).max(64),
        muscleGroups: z.array(z.string().min(1).max(100)).max(32),
      })
      .strict(),
    nextCursor: z.string().max(2048).nullable(),
  })
  .strict();
const compare = (a, b) =>
  b.textScore - a.textScore ||
  (a.catalogueKey < b.catalogueKey ? -1 : a.catalogueKey > b.catalogueKey ? 1 : 0);

/** One call, no automatic continuation or cache bypass. A cursor can accompany
 * an empty page; it is not evidence that the whole catalogue has no matches. */
export async function readCatalogueSearch(client, input) {
  const parsed = catalogueSearchSchema.safeParse(input);
  if (!parsed.success) {
    fail('invalid_arguments', 'Use the bounded v2 catalogue filters.');
  }
  const query = parsed.data,
    value = await client.get('catalog-v2', query);
  const checked = page.safeParse(value);
  if (!checked.success) {
    fail('invalid_response', 'The v2 catalogue page was invalid; keep the previous cursor.');
  }
  const result = checked.data,
    hits = result.rows.flatMap((item) => item.variants);
  const families = result.rows.map((item) => item.familyId).filter((id) => id !== null);
  if (
    result.rowUnit !== (query.expandVariants ? 'variant' : 'family') ||
    result.locale !== (query.locale ?? 'en') ||
    hits.length > 48 ||
    hits.length !== result.matchedVariants ||
    hits.length > result.evaluatedVariants ||
    new Set(hits.map((item) => item.catalogueKey)).size !== hits.length ||
    result.evaluatedFamilies > result.evaluatedVariants ||
    (result.nextCursor !== null && !result.evaluatedFamilies) ||
    (!query.expandVariants && new Set(families).size !== families.length) ||
    result.rows.some(
      (item) =>
        item.selectedCatalogueKey !== item.variants[0].catalogueKey ||
        item.familyVariantCount < item.variants.length ||
        (query.expandVariants && item.variants.length !== 1) ||
        item.variants.some(
          (variant, index) => index > 0 && compare(item.variants[index - 1], variant) > 0,
        ),
    ) ||
    result.rows.some(
      (item, index) =>
        index > 0 && compare(result.rows[index - 1].variants[0], item.variants[0]) > 0,
    )
  ) {
    fail(
      'invalid_response',
      'The v2 catalogue counters or ordering were inconsistent; keep the previous cursor.',
    );
  }
  return result;
}
