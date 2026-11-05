import type { ZodType } from 'zod/v4';
import type { PushValues, PushTarget, PushUnit, PushConvention } from './push-results.mjs';

export interface PushAdjustmentsQuery {
  scope: string;
  athleteId: string;
  sessionId: string;
  outcomeId: string;
  cursor?: string;
}
export interface PushAdjustment {
  id: string;
  target: PushTarget;
  before: PushValues;
  after: PushValues;
  unit: PushUnit;
  convention: PushConvention;
  state: 'saved' | 'withdrawn';
  savedAt: string;
  withdrawnAt: string | null;
  automatic: boolean;
  goal: 'muscle' | 'strength' | 'fat_loss' | 'endurance' | 'consistency' | 'general' | null;
  sourceResults: { id: string; sessionId: string | null }[];
}
export interface PushAdjustmentsPage {
  scope: string;
  athleteId: string;
  sessionId: string;
  outcomeId: string;
  projectId: string;
  trainingId: string;
  epoch: string;
  checkpoint: string;
  sourceRevision: string | null;
  occurrence: {
    athleteId: string;
    projectId: string;
    trainingId: string;
    occurrenceId: string;
  } | null;
  entries: PushAdjustment[];
  nextCursor: string | null;
  serverTime: number;
  planApplication: 'not_verified';
  coverage: 'retained_records';
  readOnly: true;
}
export const pushAdjustmentsSchema: ZodType<PushAdjustmentsQuery>;
export function readPushAdjustments(
  client: {
    get(resource: 'push-adjustments', query: PushAdjustmentsQuery): unknown | Promise<unknown>;
  },
  input: unknown,
): Promise<PushAdjustmentsPage>;
