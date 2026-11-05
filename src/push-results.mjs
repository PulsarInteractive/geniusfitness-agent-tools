import * as z from 'zod/v4';
import { fail } from './errors.mjs';

const id = z.string().min(1).max(128);
const scope = z.string().regex(/^project:[A-Za-z0-9_-]{1,128}$/);
const sessionId = z.string().uuid();
export const pushResultsSchema = z
  .object({
    scope,
    sessionId,
    includeRewardDetails: z.boolean().optional(),
    athleteId: z
      .string()
      .regex(/^[A-Za-z0-9_-]{1,128}$/)
      .optional(),
  })
  .strict();
const time = z.string().max(40).datetime();
const values = z
  .object({
    repetitions: z.number().int().min(0).max(10000),
    loadMilliunits: z.number().int().min(0).max(2000000).nullable(),
  })
  .strict();
const target = z
  .object({
    projectId: id,
    trainingId: id,
    occurrenceId: id.nullable(),
    sessionId: id.nullable(),
    exerciseId: id,
    setIndex: z.number().int().min(1).max(1000),
    round: z.number().int().min(1).max(1000).nullable(),
    side: z.enum(['both', 'left', 'right', 'alternating', 'unknown']),
  })
  .strict();
const unit = z.enum(['kg', 'lb', 'none', 'unknown']);
const convention = z.enum([
  'total_external',
  'per_implement',
  'per_side',
  'assistance',
  'none',
  'unknown',
]);
const proposal = z
  .object({
    id,
    revision: z.number().int().min(1),
    target,
    base: values,
    offeredTarget: values,
    axis: z.enum(['repetitions', 'load']),
    unit,
    convention,
    state: z.enum([
      'draft',
      'validated',
      'proposed',
      'scheduled',
      'accepted',
      'declined',
      'attempted',
      'recorded',
      'reconciled',
      'expired',
      'superseded',
      'cancelled',
      'blocked',
    ]),
    createdAt: time,
    validFrom: time,
    expiresAt: time,
    executionAuthorization: z.literal('not_granted'),
  })
  .strict();
const outcome = z
  .object({
    id,
    proposalId: id,
    proposalRevision: z.number().int().min(1),
    target,
    actual: values.nullable(),
    resolution: z.enum(['achieved', 'partial', 'base', 'not_attempted', 'unconfirmed']),
    unit,
    convention,
    completedAt: time.nullable(),
    recordedAt: time,
    rewardState: z.enum(['pending', 'awarded', 'ineligible']),
    awardedXp: z.number().int().min(1).max(2147483647).nullable().optional(),
    supersedesOutcomeId: id.nullable(),
  })
  .strict();
const response = z
  .object({
    scope,
    athleteId: id,
    sessionId,
    epoch: z.string().min(1).max(64),
    revision: z.string().max(64).nullable(),
    readOnly: z.literal(true),
    outcomesState: z.enum(['ready', 'incomplete']),
    proposals: z.array(proposal).max(32),
    outcomes: z.array(outcome).max(32),
  })
  .strict();

/** One explicit bounded call. No history search, polling, persistent cache or
 * interpretation of a proposal/accepted attempt as completed work. */
export async function readPushResults(client, input) {
  const parsed = pushResultsSchema.safeParse(input);
  if (!parsed.success) {
    fail('invalid_arguments', 'Select one program and the exact live session UUID.');
  }
  const raw = await client.get('push-results', parsed.data);
  const decoded = response.safeParse(raw);
  if (!decoded.success) {
    fail('invalid_response', 'Push results are incomplete or invalid.');
  }
  const result = decoded.data;
  const sameTarget = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const bound = (t) => `project:${t.projectId}` === input.scope && t.sessionId === input.sessionId;
  if (
    result.scope !== input.scope ||
    result.sessionId !== input.sessionId ||
    (input.athleteId !== undefined && result.athleteId !== input.athleteId) ||
    new Set(result.proposals.map((p) => p.id)).size !== result.proposals.length ||
    new Set(result.outcomes.map((o) => o.id)).size !== result.outcomes.length ||
    new Set(result.outcomes.map((o) => o.proposalId)).size !== result.outcomes.length ||
    result.proposals.some((p) => !bound(p.target)) ||
    (result.outcomesState === 'incomplete' && result.outcomes.length) ||
    result.outcomes.some((o) => {
      const p = result.proposals.find((p) => p.id === o.proposalId);
      return (
        !p ||
        !bound(o.target) ||
        !sameTarget(o.target, p.target) ||
        o.proposalRevision > p.revision ||
        o.unit !== p.unit ||
        o.convention !== p.convention ||
        (o.awardedXp !== undefined &&
          o.awardedXp !== null &&
          (o.rewardState !== 'awarded' || o.resolution !== 'achieved')) ||
        (['achieved', 'partial', 'base'].includes(o.resolution) &&
          (o.actual === null || o.completedAt === null)) ||
        (['not_attempted', 'unconfirmed'].includes(o.resolution) && o.actual !== null) ||
        (o.actual !== null &&
          (o.unit === 'none' ? o.actual.loadMilliunits !== null : o.actual.loadMilliunits === null))
      );
    })
  ) {
    fail('invalid_response', 'Push results do not match the requested session and proposal.');
  }
  return result;
}
