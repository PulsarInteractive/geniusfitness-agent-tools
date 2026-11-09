import type { ZodType } from 'zod/v4';

export interface CatalogueSearchQuery {
  query?: string;
  equipment?: string;
  muscle?: string;
  locale?: 'en' | 'fr';
  expandVariants?: boolean;
  cursor?: string;
}
export interface CatalogueLabel {
  en: string;
  fr: string | null;
}
export interface CatalogueSearchHit {
  catalogueKey: string;
  label: CatalogueLabel;
  equipment: string;
  equipmentGroup: string;
  muscleGroup: string;
  exerciseType: string;
  attribution: string;
  textScore: number;
  reason: 'browse' | 'exact_name' | 'name_prefix' | 'family_synonym';
}
export interface CatalogueSearchRow {
  familyId: string | null;
  label: CatalogueLabel;
  selectedCatalogueKey: string;
  familyVariantCount: number;
  variants: CatalogueSearchHit[];
}
export interface CatalogueSearchPage {
  formatVersion: 2;
  version: string;
  policyVersion: string;
  source: 'legacy_metadata';
  equipmentCompatibility: 'not_assessed';
  muscleEvidence: 'not_reviewed';
  scoreScope: 'evaluated_page';
  continuationUnit: 'family_block';
  rowUnit: 'family' | 'variant';
  locale: 'en' | 'fr';
  evaluatedVariants: number;
  evaluatedFamilies: number;
  matchedVariants: number;
  rows: CatalogueSearchRow[];
  facets: {
    scope: 'source_catalogue';
    equipment: string[];
    muscleGroups: string[];
  };
  nextCursor: string | null;
}
export const catalogueSearchSchema: ZodType<CatalogueSearchQuery>;
export function readCatalogueSearch(
  client: {
    get(resource: 'catalog-v2', query: CatalogueSearchQuery): unknown | Promise<unknown>;
  },
  input: unknown,
): Promise<CatalogueSearchPage>;
