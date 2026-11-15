// Synthetic wire fixtures only: no exercise advice, anatomical claim or
// documentary admission. These exercise client pagination and source binding.
const evidence = () => ({
  basis: 'unknown',
  limitations: ['Synthetic client fixture; no exercise evidence.'],
  method: 'No physiological inference.',
  preparedBy: 'synthetic-client-test',
  review: null,
  sourceIds: [],
  status: 'unknown',
});
export const sourceVersion = 'a'.repeat(64);
export const subsetVersion = 'b'.repeat(64);
const registryVersion = 'c'.repeat(64);
const taxonomyVersion = 'synthetic-schema-test';
const variant = (catalogueKey) => ({
  alternatives: [],
  axes: [
    'gripOrientation',
    'gripWidth',
    'bodyPosition',
    'benchAngle',
    'laterality',
    'stanceWidth',
    'movementOrientation',
  ].map((axis) => ({ axis, state: 'unknown', value: null, evidence: evidence() })),
  catalogueKey,
  cue: { state: 'unknown', text: null, evidence: evidence() },
  equipment: { state: 'unknown', required: [], optional: [], evidence: evidence() },
  explanation: {
    state: 'unknown',
    setup: [],
    execution: [],
    breathing: [],
    cautions: [],
    evidence: evidence(),
  },
  familyId: null,
  label: { en: 'Synthetic variant', fr: 'Variante synthétique' },
  loadConvention: 'unknown',
  loadEvidence: evidence(),
  media: { state: 'unavailable', assetKey: null, sha256: null, evidence: evidence() },
  muscles: { state: 'unknown', targets: [], evidence: evidence() },
  visibility: 'browse',
});
export function reviewedPage(keys, nextCursor = null) {
  const variants = keys.map((catalogueKey) => ({
    catalogueKey,
    familyId: null,
    status: 'unknown',
    visibilityAllowed: true,
    equipment: {
      clauses: [],
      optional: [],
      evidenceStatus: 'unknown',
      reason: 'requirements_unknown',
      status: 'unknown',
    },
    muscles: {
      declaredTargets: 0,
      qualifyingTargets: 0,
      evidenceStatus: 'unknown',
      matches: [],
      softwareScore: 0,
      status: 'unknown',
    },
  }));
  return {
    formatVersion: 1,
    scope: 'reviewed_subset_only',
    inventoryBasis: 'caller_supplied_or_unknown',
    continuationUnit: 'variant',
    evaluatedVariants: keys.length,
    evaluatedUnits: keys.length,
    catalogue: {
      qualification: 'reviewed_subset',
      coverage: 'partial',
      sourceContentVersion: sourceVersion,
      subsetVersion,
      page: {
        contentVersion: subsetVersion,
        registryVersion,
        taxonomyVersion,
        candidates: keys.map(variant),
        equipment: [],
        families: [],
      },
    },
    matching: {
      scope: 'supplied_candidates_only',
      basis: 'structural_filter_relevance_not_physiology',
      policyVersion: 'synthetic-schema-test',
      taxonomyVersion,
      contentVersion: subsetVersion,
      registryVersion,
      expanded: true,
      requestedTargets: [],
      effectiveTargets: [],
      evaluatedVariants: keys.length,
      matchedVariants: 0,
      unknownVariants: keys.length,
      variants,
      selections: [],
    },
    nextCursor,
  };
}
