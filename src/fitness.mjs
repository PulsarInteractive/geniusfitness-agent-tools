import * as z from 'zod/v4';
import catalog from './command-catalog.mjs';
import { fail } from './errors.mjs';

const id = z
  .string()
  .min(1)
  .max(256)
  // eslint-disable-next-line no-control-regex -- Match the server identifier boundary.
  .regex(/^[^\u0000-\u001f]+$/u);
const scope = z
  .string()
  .max(256)
  // eslint-disable-next-line no-control-regex -- Scope prefixes bind records to the right owner.
  .regex(/^(project|personal):[^\u0000-\u001f]+$/u);
const revision = z
  .string()
  .regex(/^(0|[1-9][0-9]{0,15})$/)
  .refine((value) => BigInt(value) <= 9007199254740991n);
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (value) =>
      Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value,
  );

export const catalogSchema = z
  .object({
    query: z.string().max(160).optional(),
    key: z
      .string()
      .regex(/^ex\.[0-9]+$/)
      .optional(),
    equipment: z.string().max(80).optional(),
    muscle: z.string().max(80).optional(),
    after: z
      .string()
      .regex(/^ex\.[0-9]+$/)
      .optional(),
    version: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .optional(),
  })
  .strict()
  .refine((input) => !input.after || (!!input.version && !input.key));
export const metricsSchema = z
  .object({
    scope: z.string().regex(/^project:[A-Za-z0-9_-]{1,128}$/),
    from: date,
    until: date,
  })
  .strict()
  .refine((input) => {
    const days = (Date.parse(input.until) - Date.parse(input.from)) / 86400000;
    return days >= 0 && days < 366;
  });
export const resourcesSchema = z
  .object({
    scope,
    collection: z.enum(Object.keys(catalog.collections)),
    id: id.optional(),
    after: id.optional(),
    epoch: id.optional(),
    checkpoint: revision.optional(),
    archive: z.enum(['active', 'archived', 'all']).optional(),
  })
  .strict()
  .refine(
    (input) =>
      (!input.after || (!!input.epoch && input.checkpoint !== undefined && !input.id)) &&
      (input.archive === undefined || input.collection === 'planning' || input.archive === 'all') &&
      input.scope.startsWith(
        catalog.collections[input.collection].module.startsWith('LocalUser/')
          ? 'personal:'
          : 'project:',
      ),
  );

const checked = (schema, input) => {
  const result = schema.safeParse(input);
  if (!result.success) {
    fail(
      'invalid_arguments',
      'Use the declared parameters, matching scope and bounded dates. Continue pages with the returned version or epoch/checkpoint.',
    );
  }
  return result.data;
};
const exerciseSchema = z
  .object({
    key: z.string().regex(/^ex\.[0-9]+$/),
    name: z.string().min(1),
    bodyPart: z.string(),
    target: z.string(),
    secondary: z.array(z.string()).max(30),
    equipment: z.string(),
    equipmentGroup: z.string(),
    muscleGroup: z.string(),
    exerciseType: z.string(),
    attribution: z.string(),
  })
  .strict();
const catalogPage = z
  .object({
    version: z.string().regex(/^[a-f0-9]{64}$/),
    items: z.array(exerciseSchema).max(25),
    nextAfter: z.string().nullable(),
  })
  .strict();

/** Catalogue IDs, not copied image files, connect imported exercises to the
 * app's maintained library. Every request still uses the current delegation. */
export async function readCatalog(client, input) {
  const query = checked(catalogSchema, input),
    result = await client.get('catalog', query);
  if (
    !catalogPage.safeParse(result).success ||
    (query.version && result.version !== query.version) ||
    (query.key && (result.items.length !== 1 || result.items[0].key !== query.key)) ||
    new Set(result.items.map((item) => item.key)).size !== result.items.length ||
    (result.nextAfter !== null &&
      (!result.items.length || result.nextAfter !== result.items.at(-1).key)) ||
    result.items.some(
      (item, index) =>
        (query.after && item.key <= query.after) ||
        (index > 0 && item.key <= result.items[index - 1].key),
    )
  ) {
    fail(
      'invalid_response',
      'The catalogue page was invalid. Keep the previous cursor and do not import unknown IDs.',
    );
  }
  return result;
}

const metricsPage = z
  .object({
    scope,
    epoch: id,
    checkpoint: revision,
    from: date,
    until: date,
    days: z
      .array(
        z
          .object({
            day: date,
            sessions: z.number().int().nonnegative().safe(),
            runs: z.number().int().nonnegative().safe(),
            durationSeconds: z.number().nonnegative(),
            distanceMeters: z.number().nonnegative(),
          })
          .strict(),
      )
      .max(366),
  })
  .strict();

/** Daily aggregates keep long activity histories out of agent context. A failed
 * or partial response is never summarized as zero activity. */
export async function readMetrics(client, input) {
  const query = checked(metricsSchema, input),
    result = await client.get('metrics', query);
  if (
    !metricsPage.safeParse(result).success ||
    ['scope', 'from', 'until'].some((key) => result[key] !== query[key]) ||
    result.days.some(
      (day, index) =>
        day.day < query.from ||
        day.day > query.until ||
        (index > 0 && day.day <= result.days[index - 1].day),
    )
  ) {
    fail(
      'invalid_response',
      'The metrics response was invalid. Do not infer empty activity from it.',
    );
  }
  return result;
}

const resourcePage = z
  .object({
    scope,
    collection: z.string(),
    epoch: id,
    checkpoint: revision,
    items: z
      .array(z.object({ id, revision, data: z.record(z.string(), z.unknown()) }).strict())
      .max(25),
    omittedIds: z.array(id).max(25),
    nextAfter: id.nullable(),
    changeCursor: z.string().max(4096).nullable(),
    etag: z.string().max(8192),
    notModified: z.boolean().optional(),
  })
  .strict();
export async function readResources(client, input) {
  const query = checked(resourcesSchema, input),
    result = await client.get('resources', query);
  if (
    !resourcePage.safeParse(result).success ||
    result.scope !== query.scope ||
    result.collection !== query.collection ||
    (query.epoch && result.epoch !== query.epoch) ||
    (query.checkpoint && result.checkpoint !== query.checkpoint) ||
    (query.id && result.items.some((item) => item.id !== query.id)) ||
    new Set(result.items.map((item) => item.id)).size !== result.items.length ||
    (query.after &&
      ((result.nextAfter !== null && result.nextAfter <= query.after) ||
        result.items.some((item) => item.id <= query.after)))
  ) {
    fail(
      'invalid_response',
      'The resource page was invalid. Preserve the previous inventory and cursor.',
    );
  }
  return result;
}

/** Local, reviewed contract subset. Only this command's editable fields are
 * returned; private server models never enter the distributed client. */
export function commandHelp(kind) {
  if (typeof kind !== 'string' || !Object.hasOwn(catalog.commands, kind)) {
    fail('invalid_arguments', 'Choose a command from capabilities or commands describe.');
  }
  const definition = catalog.commands[kind],
    properties = {};
  for (const field of definition.fields) {
    properties[field] = catalog.fieldSchemas[definition.module][field];
  }
  const required = definition.create
    ? definition.fields.filter((field) => {
        const schema = properties[field];
        return (
          !Object.hasOwn(schema, 'default') &&
          !(
            schema.type === 'null' ||
            (Array.isArray(schema.type) && schema.type.includes('null')) ||
            schema.anyOf?.some((part) => part.type === 'null')
          )
        );
      })
    : [];
  for (const field of definition.requiredFields ?? []) {
    if (!required.includes(field)) {
      required.push(field);
    }
    const schema = properties[field];
    if (schema.anyOf?.some((part) => part.type === 'null')) {
      properties[field] = { ...schema, anyOf: schema.anyOf.filter((part) => part.type !== 'null') };
    }
  }
  return {
    kind,
    ...definition,
    dataSchema: { type: 'object', properties, required, additionalProperties: false },
    workflow: definition.create
      ? 'Use a new stable ID and null expectedRevision; read the scope epoch first. program.create uses its UUID as initial epoch and needs all-resources consent.'
      : 'Read the current record and use its revision. Preserve the prepared operation after an uncertain response.',
    coach:
      'Other athletes’ programs need current Coach subscription, coaching:write and ordinary program access.',
  };
}
