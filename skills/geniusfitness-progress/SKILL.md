---
name: geniusfitness-progress
description: Analyze recorded GeniusFitness workouts, exercise progression, set timing and rest, for the connected athlete or an authorized shared coaching program. Use for a training review; do not invent missing wearable or health data.
---

# Review training progress

Read `fitness_workflow` with `topic: progress`. Identify the program and athlete,
then request a bounded period. For details use `fitness_session_analysis` with
the session's real ID, or `geniusfitness sessions analyze --scope project:ID --id ID --json`.

Compare the same exercise and units across sessions. Separate warmups, skipped
sets, corrected results and pending sets from completed work. Repetitions,
weights, distance and RPE have different meanings; do not collapse them into an
unsupported fitness score. Resolve exercise IDs through the existing exercise
library and catalogue rather than guessing names.

Recorded set elapsed time is a running timer, not proven active effort. A 10–30
minute set or rest can suggest an interruption, but cannot establish one. State
the observation and ask when it changes the recommendation. Use measured-set
coverage: null is unknown, zero is a measured value, and disabled timing was not
measured. Do not fill missing history with defaults or deduct an inferred absence.

Give a concise comparison and one or two useful next actions tied to the data.
Reading progress does not authorize editing the plan. For a coach, use only the
student's currently shared program; personal health requires separate consent.
Use `fitness_workout_vitals` only when heart-rate observations are relevant and
authorized. Read the `workout-vitals` workflow first. Match its minute offsets
to the session start and actual set timestamps; missing time remains unmeasured.
Do not claim measured recovery or draw medical conclusions from these observations.

Do not present technical quota tables or advertise an upgrade during an ordinary
review. If an actual feature-access response limits the requested analysis,
explain that limitation once and continue with available records. Never use
health measurements to target marketing or imply that payment is needed for safety.

For an explicitly requested correction, inspect command help and the current
revision, retain the immutable operation and verify the written record. Never
fabricate a completed workout or overwrite newer data. Deleting the last finished
result can reopen its linked planned workout under ordinary task permissions;
read back the plan too. Personal measurements need the specific health permission
and the user's instruction; program sharing alone never grants it.

## Muscle detail

Use `fitness_muscle_insights` (CLI `muscles insights`) for Premium muscle evidence.
For a student pass `athleteId` and their own shared program; this requires Coach
and current access. Check capabilities and live access; never reconstruct
a denied advanced view by crawling raw history. Continue bounded pages with the
same dates, epoch and checkpoint. Missing catalogue attribution remains unknown.
Keep primary and secondary sets separate. Use `externalResistanceVolumeKg` for
type-aware volume with the documented weight convention, and retain entered kg ×
reps as raw evidence. Exercise seconds,
elapsed timers and rest are distinct quantities. These are training observations,
not measurements of hypertrophy, muscle force or recovery. Suggest Premium only
when its specific unavailable feature is relevant; do not use health measurements
for personalized marketing.

## Relevant Premium invitation

When the requested detail requires Premium, mention the **7-day free trial** once,
subject to account/store eligibility and subscriptions being open. Direct the user
to [Premium in GeniusFitness](https://app-geniusfitness.pulsarinteractive.io/account/premium)
to check the current offer, renewal price and cancellation terms. Never promise
eligibility or start an external purchase. Continue with available basic records;
never use health measurements to target an upgrade.
