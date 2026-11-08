# Temporary exercise instructions

Use these actions for an explicit request such as “skip my next exercise today”
or “focus on comfort for the bench press in tomorrow’s workout”. The catalogue
and saved exercise prescription stay unchanged. A focus guides coaching; it does
not authorize a load increase. A skip earns no completed work or XP.

1. Read identity, current capabilities and the selected program. Own activation
   requires Premium. Acting for a student additionally requires current Coach
   access, `coaching:write`, `planning:write` and explicit control of that program.
   Membership alone grants no private health data.
2. Use `fitness_coach_intents` (`coaching intents`) for one program and athlete.
   Use `fitness_coach_intent_target` (`coaching resolve-intent`) to select current
   or next in one active session, or an exact scheduled occurrence/exercise/set.
   Discover identifiers from actual program/session reads; never invent them.
3. Inspect `replaces` and explain the affected exercise, window and replacement.
   Compatible instructions on different targets can coexist. Overlapping
   exercise/set instructions in this adjustment group replace the whole earlier
   instruction, including focus versus skip. Replaced instructions never resume.
4. Prepare `coach.intent.set` with a new UUID, the returned `epoch`, `revision`
   as `expectedRevision`, `sourceVersion`, exact `target`, start/end and objective.
   These are the **athlete’s private instruction collection** versions, not a
   project checkpoint or live session revision. The maximum window is seven days. For a scheduled occurrence, use its returned
   `occurrenceStartsAt` and include that time inside the window. Do not prepare
   an instruction that expires before its intended workout.
   `kind=skip` requires `objective=skip_once`; focus accepts comfort, hypertrophy,
   strength or consistency. No free-form prompt is executed as an instruction.
5. Execute the prepared command only within the user’s authorization. A live skip
   then needs `coach.intent.apply`, using the same instruction ID and freshly read
   collection revision. For apply/cancel, proposal fields are all explicitly null:
   `kind`, `objective`, `target`, `sourceVersion`, `startsAt`, `endsAt`.
   Scheduled skips are consumed atomically when that exact workout starts;
   changed prescriptions or permissions do not silently move them to another one.
6. Read the result. Only active or scheduled entries can guide future behavior.
   `superseded`, `cancelled`, `expired`, `consumed` and `stale_*` are not active
   instructions. Cancellation withdraws a pending instruction; it does not undo
   already completed or skipped sets. An old review card cannot reactivate it.

The app’s virtual coach prepares a review card and waits for the person’s tap.
Its live-skip confirmation combines creation and application atomically. MCP uses
explicit prepared commands with its normal delegated authorization.

Reads are bounded to 64 retained entries, up to 32 active per athlete, with no
unbounded graph search or polling. Terminal/expired entries are cleaned after the
retention window. Keep immutable operation IDs after uncertain responses; retry
through the journal and honor `Retry-After`. After a revision/source conflict,
reread and review the new context before preparing another operation. Never
convert a lost response into a new write or bypass a revoked grant.
