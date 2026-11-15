import catalog from './command-catalog.mjs';
import { fail } from './errors.mjs';

export const customExerciseGuidance = {
  ...catalog.customExercise,
  qualification: 'declared_estimate',
  tracking:
    'ResistanceReps records repetitions against unmeasured external resistance with defaultUnit none. Keep actual repetitions and timing; do not invent kilograms, massFormat, sourceMass, tonnage, e1RM or mass-based Push. Bands are equipment, not bodyweight or no-equipment. Manufacturer labels and band colors do not establish a measured load. External resistance volume remains null, not zero.',
  meaning:
    'Personal muscle declarations are estimates, including AI-assisted suggestions. They are not measured activation, growth, recovery or reviewed catalogue evidence.',
  allocation:
    'Use canonical target IDs and primary, secondary or unspecified roles. Optional integer relativeShare is 1–100; known shares total at most 100, with any remainder unknown. Never combine a parent and its descendant, duplicate an ID, or distribute unknown shares automatically.',
  localization:
    'contentLocale identifies the known source language; null stays unknown. localizations is the complete list of at most 16 language entries with locale, current server contentSourceFingerprint copied into sourceFingerprint, and partial text (name, description, movementIntent). Read the current exercise before translating. Omission preserves the list; null or [] removes it. Source edits leave older translations stale; never calculate a replacement fingerprint or present stale text as current. New AI-authored source text defaults to English; preserve an existing source language or the user’s explicit choice.',
  editing:
    'description is the full movement explanation; movementIntent is its short mental cue. Omit fields to preserve them; null clears them. catalogueOrigin is read-only historical import provenance and does not review personal edits. Photos use the separate exercise-media workflow, never image URLs in text fields.',
};

const nodes = new Map((catalog.customExercise?.targets ?? []).map((node) => [node.id, node]));
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
/** Validate only supplied metadata. Sparse edits keep the saved tracking type
 * for the server to check; no type, counting rule or performed side is inferred. */
export function validateExerciseCountingMetadata(data) {
  const convention = data.countingConvention;
  if (convention === undefined || convention === null) {
    return;
  }
  const policy = catalog.customExercise.counting;
  if (!policy.conventions.includes(convention)) {
    fail('invalid_arguments', 'Use an explicit countingConvention from exercise command help.');
  }
  if (Object.hasOwn(data, 'exerciseType')) {
    const types =
      convention === 'per_side_duration' ? policy.durationTypes : policy.repetitionTypes;
    if (!types.includes(data.exerciseType)) {
      fail(
        'invalid_arguments',
        'The supplied counting convention does not match this tracking type.',
      );
    }
  }
}
/** Cross-field rules complement generated public field schemas. No inference,
 * percentage normalization, catalogue lookup or write happens here. */
export function validateCustomExerciseMetadata(data) {
  if (
    data.exerciseType === 'ResistanceReps' &&
    data.defaultUnit !== undefined &&
    data.defaultUnit !== 'none'
  ) {
    fail('invalid_arguments', 'ResistanceReps uses unit none for unmeasured external resistance.');
  }
  validateExerciseCountingMetadata(data);
  validateLocalization(data);
  const invalid = () =>
    fail(
      'invalid_arguments',
      'Use command help customExercise for personal text and declared muscle estimates.',
    );
  for (const [name, maximum] of [
    ['description', 4000],
    ['movementIntent', 280],
  ]) {
    if (!Object.hasOwn(data, name) || data[name] === null) {
      continue;
    }
    if (typeof data[name] !== 'string' || data[name].trim().length > maximum) {
      invalid();
    }
  }
  if (
    !Object.hasOwn(data, 'declaredMuscleContributions') ||
    data.declaredMuscleContributions === null
  ) {
    return;
  }
  const declaration = data.declaredMuscleContributions;
  if (
    !object(declaration) ||
    Object.keys(declaration).some((key) => !['qualification', 'targets'].includes(key)) ||
    declaration.qualification !== 'declared_estimate' ||
    !Array.isArray(declaration.targets) ||
    declaration.targets.length > 17
  ) {
    invalid();
  }
  const ids = new Set();
  let total = 0;
  for (const target of declaration.targets) {
    if (
      !object(target) ||
      Object.keys(target).some((key) => !['targetId', 'role', 'relativeShare'].includes(key)) ||
      typeof target.targetId !== 'string' ||
      !nodes.has(target.targetId) ||
      ids.has(target.targetId) ||
      !['primary', 'secondary', 'unspecified'].includes(target.role)
    ) {
      invalid();
    }
    if (target.relativeShare !== undefined && target.relativeShare !== null) {
      if (
        !Number.isInteger(target.relativeShare) ||
        target.relativeShare < 1 ||
        target.relativeShare > 100
      ) {
        invalid();
      }
      total += target.relativeShare;
    }
    ids.add(target.targetId);
  }
  if (total > 100) {
    invalid();
  }
  for (const id of ids) {
    let parent = nodes.get(id).parentId;
    while (parent !== null) {
      if (ids.has(parent)) {
        invalid();
      }
      parent = nodes.get(parent).parentId;
    }
  }
}

function validateLocalization(data) {
  const invalid = () =>
    fail(
      'invalid_arguments',
      'Use the current exercise source fingerprint and supported language/text fields from command help.',
    );
  const locale = (value) => {
    if (
      typeof value !== 'string' ||
      value.length > 64 ||
      !/^[a-z]{2,8}(?:-[a-z0-9]{2,8})*$/i.test(value)
    ) {
      invalid();
    }
    try {
      return Intl.getCanonicalLocales(value)[0];
    } catch {
      return invalid();
    }
  };
  if (data.contentLocale !== undefined && data.contentLocale !== null) {
    locale(data.contentLocale);
  }
  if (data.localizations === undefined || data.localizations === null) {
    return;
  }
  if (!Array.isArray(data.localizations) || data.localizations.length > 16) {
    invalid();
  }
  const seen = new Set();
  for (const entry of data.localizations) {
    if (
      !object(entry) ||
      Object.keys(entry).some((key) => !['locale', 'sourceFingerprint', 'text'].includes(key))
    ) {
      invalid();
    }
    const key = locale(entry.locale);
    if (
      seen.has(key) ||
      typeof entry.sourceFingerprint !== 'string' ||
      !/^[a-f0-9]{64}$/.test(entry.sourceFingerprint) ||
      !object(entry.text) ||
      Object.keys(entry.text).some(
        (field) => !['name', 'description', 'movementIntent'].includes(field),
      )
    ) {
      invalid();
    }
    seen.add(key);
    let populated = false;
    for (const [field, minimum, maximum] of [
      ['name', 2, 100],
      ['description', 1, 4000],
      ['movementIntent', 1, 280],
    ]) {
      const value = entry.text[field];
      if (value === undefined || (field !== 'name' && value === null)) {
        continue;
      }
      if (
        typeof value !== 'string' ||
        [...value].some((char) => {
          const code = char.charCodeAt(0);
          return code === 127 || (code < 32 && ![9, 10, 13].includes(code));
        })
      ) {
        invalid();
      }
      const text = value.trim();
      if (!text && field !== 'name') {
        continue;
      }
      if (text.length < minimum || text.length > maximum) {
        invalid();
      }
      populated = true;
    }
    if (!populated) {
      invalid();
    }
  }
}
