import catalog from './command-catalog.mjs';

const rules = catalog.runPayloads;
const training = 'Project/SportTraining',
  run = 'Project/SportRunLog';
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const exact = (value, fields) =>
  object(value) &&
  fields.every((key) => Object.hasOwn(value, key)) &&
  Object.keys(value).every((key) => fields.includes(key));
const empty = (value) => value === null || value === '';
const finite = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0;
function parse(value) {
  if (typeof value !== 'string' || value.length > rules.maxCharacters) {
    return undefined;
  }
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}
function validPlan(value) {
  if (
    !exact(value, ['v', 'goal', 'stages']) ||
    value.v !== rules.version ||
    !rules.plan.goals.includes(value.goal) ||
    !Array.isArray(value.stages) ||
    value.stages.length < 1 ||
    value.stages.length > rules.maxStages
  ) {
    return false;
  }
  let seconds = 0,
    meters = 0;
  for (const stage of value.stages) {
    if (
      !exact(stage, ['kind', 'unit', 'target']) ||
      !rules.plan.kinds.includes(stage.kind) ||
      !rules.plan.units.includes(stage.unit) ||
      !Number.isSafeInteger(stage.target) ||
      stage.target <= 0
    ) {
      return false;
    }
    if (stage.unit === 'seconds') {
      seconds += stage.target;
    } else {
      meters += stage.target;
    }
  }
  return seconds <= rules.plan.maxSeconds && meters <= rules.plan.maxMeters;
}
function validProgress(value) {
  if (
    !exact(value, ['v', 'stages']) ||
    value.v !== rules.version ||
    !Array.isArray(value.stages) ||
    value.stages.length > rules.maxStages
  ) {
    return false;
  }
  let meters = 0,
    seconds = 0;
  for (const stage of value.stages) {
    if (
      !exact(stage, ['outcome', 'distanceMeters', 'movingSeconds']) ||
      !rules.progress.outcomes.includes(stage.outcome) ||
      !finite(stage.distanceMeters) ||
      !finite(stage.movingSeconds) ||
      stage.distanceMeters < meters ||
      stage.movingSeconds < seconds
    ) {
      return false;
    }
    meters = stage.distanceMeters;
    seconds = stage.movingSeconds;
  }
  return true;
}

/** Validate only supplied fields. On partial updates, the authoritative server
 * validates the merged record. Never fetch, fill or normalize missing history. */
export function invalidRunPayload(module, data, { create = false } = {}) {
  if (module !== training && module !== run) {
    return null;
  }
  const hasPlan = Object.hasOwn(data, 'runPlan');
  const hasProgress = module === run && Object.hasOwn(data, 'planProgress');
  const plan = hasPlan && !empty(data.runPlan) ? parse(data.runPlan) : null;
  if (hasPlan && !empty(data.runPlan) && !validPlan(plan)) {
    return 'runPlan';
  }
  if (
    plan &&
    module === training &&
    (create || Object.hasOwn(data, 'icon')) &&
    data.icon !== rules.trainingIcon
  ) {
    return 'runPlan';
  }
  if (!hasProgress || empty(data.planProgress)) {
    return null;
  }
  const progress = parse(data.planProgress);
  if (
    !validProgress(progress) ||
    ((hasPlan || create) && !plan) ||
    (plan && progress.stages.length > plan.stages.length)
  ) {
    return 'planProgress';
  }
  let meters = 0,
    seconds = 0;
  for (const [index, stage] of progress.stages.entries()) {
    for (const [key, observed] of [
      ['distanceMeters', stage.distanceMeters],
      ['durationSeconds', stage.movingSeconds],
    ]) {
      if (Object.hasOwn(data, key) || create) {
        const total = Object.hasOwn(data, key) ? data[key] : 0;
        if (!finite(total) || observed > total + rules.progress.totalTolerance) {
          return 'planProgress';
        }
      }
    }
    const target = plan?.stages[index];
    const measured =
      target?.unit === 'seconds' ? stage.movingSeconds - seconds : stage.distanceMeters - meters;
    if (
      target &&
      stage.outcome === 'reached' &&
      measured + rules.progress.stageTolerance < target.target
    ) {
      return 'planProgress';
    }
    meters = stage.distanceMeters;
    seconds = stage.movingSeconds;
  }
  return null;
}

const shape = (properties) => ({
  type: 'object',
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});
const planSchema = () =>
  shape({
    v: { const: rules.version },
    goal: { enum: rules.plan.goals },
    stages: {
      type: 'array',
      minItems: 1,
      maxItems: rules.maxStages,
      items: shape({
        kind: { enum: rules.plan.kinds },
        unit: { enum: rules.plan.units },
        target: { type: 'integer', minimum: 1, maximum: rules.plan.maxMeters },
      }),
    },
  });
const progressSchema = () =>
  shape({
    v: { const: rules.version },
    stages: {
      type: 'array',
      maxItems: rules.maxStages,
      items: shape({
        outcome: { enum: rules.progress.outcomes },
        distanceMeters: { type: 'number', minimum: 0 },
        movingSeconds: { type: 'number', minimum: 0 },
      }),
    },
  });
export function runPayloadSpec(module) {
  if (module !== training && module !== run) {
    return null;
  }
  return {
    encoding:
      'JSON string; omit to preserve, null or empty string to clear. Replace a whole supplied payload; never silently drop fields.',
    maxCharacters: rules.maxCharacters,
    fields: {
      runPlan: {
        schema: planSchema(),
        aggregateLimits: { seconds: rules.plan.maxSeconds, meters: rules.plan.maxMeters },
      },
      ...(module === run
        ? {
            planProgress: {
              schema: progressSchema(),
              totalsTolerance: rules.progress.totalTolerance,
              targetTolerance: rules.progress.stageTolerance,
            },
          }
        : {}),
    },
    requirements:
      module === training
        ? [
            `A nonempty plan requires icon ${rules.trainingIcon}. Stage order defines identity; there is no stage ID field.`,
            'A workout edit affects future starts; active recordings retain their frozen plan.',
          ]
        : [
            'runPlan is the frozen prescription at recording start. planProgress is an ordered prefix aligned by index, with cumulative distanceMeters and movingSeconds at each transition.',
            'Observations must be finite, nonnegative, nondecreasing and within the recorded distanceMeters/durationSeconds plus totalsTolerance. A reached stage must meet its target delta within targetTolerance. Skipped and unreported stages are not completed stages.',
            'On partial updates, omitted plan/totals are validated against the stored record by the server. Read existing data and its revision before correcting results; never manufacture missing observations.',
          ],
    example:
      module === training
        ? {
            icon: rules.trainingIcon,
            runPlan: JSON.stringify({
              v: 1,
              goal: 'easy',
              stages: [{ kind: 'easy', unit: 'seconds', target: 600 }],
            }),
          }
        : {
            runPlan: JSON.stringify({
              v: 1,
              goal: 'intervals',
              stages: [
                { kind: 'work', unit: 'meters', target: 400 },
                { kind: 'recovery', unit: 'seconds', target: 60 },
              ],
            }),
            planProgress: JSON.stringify({
              v: 1,
              stages: [
                { outcome: 'reached', distanceMeters: 400, movingSeconds: 120 },
                { outcome: 'skipped', distanceMeters: 450, movingSeconds: 150 },
              ],
            }),
            distanceMeters: 450,
            durationSeconds: 150,
          },
    exampleIsSynthetic: true,
  };
}
