import catalog from './command-catalog.mjs';
import { fail } from './errors.mjs';

export const customExerciseGuidance = {
  ...catalog.customExercise,
  qualification: 'declared_estimate',
  meaning:
    'Personal muscle declarations are estimates, including AI-assisted suggestions. They are not measured activation, growth, recovery or reviewed catalogue evidence.',
  allocation:
    'Use canonical target IDs and primary, secondary or unspecified roles. Optional integer relativeShare is 1–100; known shares total at most 100, with any remainder unknown. Never combine a parent and its descendant, duplicate an ID, or distribute unknown shares automatically.',
  editing:
    'description is the full movement explanation; movementIntent is its short mental cue. Omit fields to preserve them; null clears them. catalogueOrigin is read-only historical import provenance and does not review personal edits. Photos use the separate exercise-media workflow, never image URLs in text fields.',
};

const nodes = new Map((catalog.customExercise?.targets ?? []).map((node) => [node.id, node]));
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
/** Cross-field rules complement generated public field schemas. No inference,
 * percentage normalization, catalogue lookup or write happens here. */
export function validateCustomExerciseMetadata(data) {
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
