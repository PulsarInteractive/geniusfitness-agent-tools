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
No tool currently returns historical Watch BPM correlated with a set. Do not claim
to have measured heart-rate recovery or draw medical conclusions from timing.

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
