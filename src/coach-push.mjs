import * as z from 'zod/v4';
import { fail } from './errors.mjs';

const id = z.string().min(1).max(128);
const athlete = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/);
export const coachPushWithdrawalSchema = z
  .object({ athleteId: athlete, trainingId: id, occurrenceId: id })
  .strict();
export const coachPushProposalSchema = coachPushWithdrawalSchema
  .extend({
    exerciseId: id.nullable(),
    setIndex: z.number().int().min(1).max(1000).nullable(),
    rationale: z
      .string()
      .min(1)
      .max(1000)
      .refine((v) => v.trim().length > 0),
  })
  .refine((v) => v.exerciseId !== null || v.setIndex === null);
export const coachPushReadSchema = coachPushWithdrawalSchema
  .extend({
    scope: z.string().regex(/^project:[A-Za-z0-9_-]{1,128}$/),
  })
  .strict();
const date = z.string().max(40).datetime();
const proposal = z
  .object({
    id: z.string().uuid(),
    coachId: id,
    exerciseId: id.nullable(),
    setIndex: z.number().int().min(1).max(1000).nullable(),
    rationale: z.string().min(1).max(1000),
    proposedAt: date,
    state: z.enum(['pending', 'confirmed', 'declined', 'withdrawn']),
    confirmedAt: date.nullable(),
    closedAt: date.nullable(),
  })
  .strict();
const response = coachPushReadSchema
  .extend({
    coachId: id,
    epoch: z.string().min(1).max(64),
    revision: z
      .string()
      .regex(/^[1-9][0-9]{0,15}$/)
      .nullable(),
    proposals: z.array(proposal).max(8),
    serverTime: z.number().min(0).max(4102444800000),
    applicationAuthorization: z.literal('not_granted'),
  })
  .strict();

/** One exact occurrence read, no polling or cache. Returned revisions belong
 * to this athlete occurrence and cannot continue a program inventory. */
export async function readCoachPush(client, input) {
  const request = coachPushReadSchema.safeParse(input);
  if (!request.success) {
    fail('invalid_arguments', 'Select the exact program, athlete, workout and occurrence.');
  }
  const parsed = response.safeParse(await client.get('coach-push', request.data));
  if (!parsed.success) {
    fail('invalid_response', 'Coach proposals are incomplete or invalid.');
  }
  const value = parsed.data;
  if (
    Object.keys(request.data).some((k) => value[k] !== request.data[k]) ||
    value.coachId === value.athleteId ||
    new Set(value.proposals.map((p) => p.id)).size !== value.proposals.length ||
    (value.revision === null && value.proposals.length > 0) ||
    value.proposals.some(
      (p) =>
        p.coachId !== value.coachId ||
        (p.exerciseId === null && p.setIndex !== null) ||
        ['pending', 'confirmed'].includes(p.state) !== (p.closedAt === null) ||
        (p.state === 'confirmed' && p.confirmedAt === null) ||
        (['pending', 'declined'].includes(p.state) && p.confirmedAt !== null) ||
        (p.confirmedAt !== null && Date.parse(p.confirmedAt) < Date.parse(p.proposedAt)) ||
        (p.closedAt !== null && Date.parse(p.closedAt) < Date.parse(p.confirmedAt ?? p.proposedAt)),
    )
  ) {
    fail('invalid_response', 'Coach proposals do not match the selected occurrence or author.');
  }
  return value;
}
