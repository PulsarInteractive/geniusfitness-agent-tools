import catalog from './command-catalog.mjs';

export function setPayloadSpec(module) {
  if (module === 'Project/SportTrainingExercise') {
    return { property: 'targetSets', ...catalog.setPayloads.target };
  }
  if (module === 'Project/SportSessionLog') {
    return { property: 'performedSets', ...catalog.setPayloads.performed };
  }
  return null;
}

/** Check only explicitly supplied JSON payloads. Never normalize existing data,
 * infer completed activity or discard unknown fields to make a write succeed. */
export function invalidSetPayload(module, data) {
  const rules = setPayloadSpec(module);
  if (!rules || !Object.hasOwn(data, rules.property) || data[rules.property] === null) {
    return null;
  }
  const invalid = rules.property;
  const raw = data[rules.property];
  if (typeof raw !== 'string' || raw.length > rules.maxCharacters) {
    return invalid;
  }
  let rows;
  try {
    rows = JSON.parse(raw);
  } catch {
    return invalid;
  }
  if (!Array.isArray(rows) || rows.length > rules.maxRows) {
    return invalid;
  }
  const identities = new Set();
  for (const row of rows) {
    if (
      !row ||
      typeof row !== 'object' ||
      Array.isArray(row) ||
      rules.required.some((key) => !Object.hasOwn(row, key))
    ) {
      return invalid;
    }
    for (const [key, value] of Object.entries(row)) {
      if (!Object.hasOwn(rules.fields, key)) {
        return invalid;
      }
      const rule = rules.fields[key];
      if (rule.kind === 'boolean') {
        if (typeof value !== 'boolean') {
          return invalid;
        }
      } else if (rule.kind === 'enum') {
        if (typeof value !== 'string' || !rule.values.includes(value)) {
          return invalid;
        }
      } else if (rule.kind === 'identifier') {
        if (
          typeof value !== 'string' ||
          value.length < rule.min ||
          value.length > rule.max ||
          !/^[A-Za-z0-9_.:-]+$/.test(value)
        ) {
          return invalid;
        }
      } else if (
        typeof value !== 'number' ||
        !Number.isFinite(value) ||
        value < rule.min ||
        value > rule.max ||
        (rule.kind === 'integer' && !Number.isSafeInteger(value))
      ) {
        return invalid;
      }
    }
    if (rules.identity.length) {
      const key = JSON.stringify(rules.identity.map((field) => row[field] ?? null));
      if (identities.has(key)) {
        return invalid;
      }
      identities.add(key);
    }
  }
  return null;
}
