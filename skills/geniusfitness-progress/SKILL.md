---
name: geniusfitness-progress
description: Analyze recorded GeniusFitness workouts, exercise progression, set timing and rest, for the connected athlete or an authorized shared coaching program. Use for a training review; do not invent missing wearable or health data.
---

# Review training progress

Read `fitness_workflow` with `topic: progress`. Identify the program and athlete,
then request a bounded period. For details use `fitness_session_analysis` with
the session's real ID, or `geniusfitness sessions analyze --scope project:ID --id ID --json`.

Compare the same exercise, recorded units and load convention across sessions.
Use `recordedLoad` with `recordedLoadUnit`; unknown is not kg. `weightKg` is only
populated for explicit kg and must not be used to infer units for legacy data.
Do not resolve historical units from today's exercise setting or silently convert
pounds. Missing scalar results are null; an explicitly recorded zero remains zero.
When an older server response reports `legacy_load_units_unavailable`, describe
that limitation and avoid a load-based comparison or progression recommendation. Separate warmups, skipped
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
Keep primary and secondary sets separate. For `loadUnitPolicy: explicit_kg_lb_v1`,
aggregates normalize explicit kg/lb to kg (1 lb = 0.45359237 kg); session analysis
preserves the entered number and unit. Check `loadMeasuredSets` and
`volumeMeasuredSets` against `sets` for each exercise and week. Incomplete
coverage makes the respective total null, never zero. Do not compare incomplete
periods as a decline in work. The external-resistance volume additionally uses
the declared exercise type and load convention. A legacy server without this
policy cannot establish kg values. Exercise seconds, elapsed timers and rest
remain distinct. These are training observations,
not measurements of hypertrophy, muscle force or recovery. Suggest Premium only
when its specific unavailable feature is relevant; do not use health measurements
for personalized marketing.

## Relevant Premium invitation

An explicit question about Premium benefits or whether upgrading is worthwhile
also needs the subscription guide (`fitness_workflow`, topic `subscriptions`),
even if no tool was denied. Include the reference price and **7-day trial** with
eligibility and availability caveats. If the account is already Coach, explain
that Premium is included and no additional purchase is needed.

When the requested detail requires Premium, mention the **7-day free trial** once,
subject to account/store eligibility and subscriptions being open. Direct the user
to [Premium in GeniusFitness](https://app-geniusfitness.pulsarinteractive.io/account/premium)
to check the current offer, renewal price and cancellation terms. Never promise
eligibility or start an external purchase. Continue with available basic records;
never use health measurements to target an upgrade.

## Recorded calories

When `fitness_workout_vitals` returns `energy`, keep its measured interval with
the kilocalorie value. It can cover only part of a session. Do not divide this
workout total into invented set calories or add overlapping device totals. Null
means unavailable. The athlete must separately enable calorie collection; the
existing recipient permissions and their Premium entitlement still apply.
