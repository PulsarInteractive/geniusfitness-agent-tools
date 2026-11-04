import type { ZodType } from 'zod/v4';

export interface PushResultsQuery {
  scope: string;
  sessionId: string;
  athleteId?: string;
}
export interface PushValues {
  repetitions: number;
  loadMilliunits: number | null;
}
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
  client: { get(resource: 'push-results', query: PushResultsQuery): unknown | Promise<unknown> },
  input: unknown,
): Promise<PushResults>;
