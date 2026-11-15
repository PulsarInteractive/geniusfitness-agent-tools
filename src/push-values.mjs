import * as z from 'zod/v4';

const repetitions = z.number().int().min(0).max(10000);
const legacy = z
  .object({
    repetitions,
    loadMilliunits: z.number().int().min(0).max(2000000).nullable(),
  })
  .strict();
const canonical = z
  .object({
    repetitions,
    loadMilliunits: z.null(),
    massFormat: z.literal('kg-v1'),
    loadKilograms: z.number().min(0).max(2000).optional(),
  })
  .strict()
  .refine((value) => !Object.hasOwn(value, 'loadKilograms') || value.loadKilograms !== undefined);

/** Exact transport representations. No rounding, unit inference or conversion. */
export const pushValuesSchema = z.union([legacy, canonical]);

export function pushValuesMatchUnit(value, unit) {
  if (value.massFormat === 'kg-v1') {
    return unit === 'kg'
      ? value.loadKilograms !== undefined
      : unit === 'none' && !Object.hasOwn(value, 'loadKilograms');
  }
  return unit !== 'none' || value.loadMilliunits === null;
}

export function samePushValuesVersion(a, b) {
  return a.massFormat === b.massFormat;
}
