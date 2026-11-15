import type { ZodType } from 'zod/v4';

export interface PushResultsQuery {
  scope: string;
  sessionId: string;
  athleteId?: string;
  includeRewardDetails?: boolean;
}
/** Legacy quantities are exact thousandths of the enclosing kg/lb unit. */
export interface LegacyPushValues {
  repetitions: number;
  loadMilliunits: number | null;
  massFormat?: never;
  loadKilograms?: never;
}
/** Canonical quantities retain float64 kg. Omit load only for unit none. */
export interface CanonicalPushValues {
  repetitions: number;
  loadMilliunits: null;
  massFormat: 'kg-v1';
  loadKilograms?: number;
}
export type PushValues = LegacyPushValues | CanonicalPushValues;
export interface PushTarget {
  projectId: string;
  trainingId: string;
  occurrenceId: string | null;
  sessionId: string | null;
  exerciseId: string;
  setIndex: number;
  round: number | null;
  side: 'both' | 'left' | 'right' | 'alternating' | 'unknown';
}
export type PushUnit = 'kg' | 'lb' | 'none' | 'unknown';
export type PushConvention =
  'total_external' | 'per_implement' | 'per_side' | 'assistance' | 'none' | 'unknown';
export interface PushProposal {
  id: string;
  revision: number;
  target: PushTarget;
  base: PushValues;
  offeredTarget: PushValues;
  axis: 'repetitions' | 'load';
  unit: PushUnit;
  convention: PushConvention;
  state:
    | 'draft'
    | 'validated'
    | 'proposed'
    | 'scheduled'
    | 'accepted'
    | 'declined'
    | 'attempted'
    | 'recorded'
    | 'reconciled'
    | 'expired'
    | 'superseded'
    | 'cancelled'
    | 'blocked';
  createdAt: string;
  validFrom: string;
  expiresAt: string;
  executionAuthorization: 'not_granted';
}
export interface PushOutcome {
  id: string;
  proposalId: string;
  proposalRevision: number;
  target: PushTarget;
  actual: PushValues | null;
  resolution: 'achieved' | 'partial' | 'base' | 'not_attempted' | 'unconfirmed';
  unit: PushUnit;
  convention: PushConvention;
  completedAt: string | null;
  recordedAt: string;
  rewardState: 'pending' | 'awarded' | 'ineligible';
  /** Exact settled cosmetic bonus after caps; absent/null means unknown. */
  awardedXp?: number | null;
  supersedesOutcomeId: string | null;
}
export interface PushResults {
  scope: string;
  athleteId: string;
  sessionId: string;
  epoch: string;
  revision: string | null;
  readOnly: true;
  outcomesState: 'ready' | 'incomplete';
  proposals: PushProposal[];
  outcomes: PushOutcome[];
}
export const pushResultsSchema: ZodType<PushResultsQuery>;
export function readPushResults(
  client: {
    get(
      resource: 'push-results',
      query: PushResultsQuery & { valuesVersion: 2 },
    ): unknown | Promise<unknown>;
  },
  input: unknown,
): Promise<PushResults>;
