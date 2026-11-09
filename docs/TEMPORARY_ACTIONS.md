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

## Explicit representation 2: several interests in one focus

This unreleased client extension needs the matching service and supported app
readers. Installing the client does not enable the producer. When unavailable,
keep the full request; do not turn it into several single-interest instructions.

Use `representationVersion: 2` in `fitness_coach_intents` and
`fitness_coach_intent_target`, or CLI `--representationVersion 2`. Omitting the
parameter preserves v1. V2 must return `representationVersion: 2`; the client
refuses a mismatched response instead of dropping data or retrying another
version. A v1 read of a saved structured focus returns
`temporary_action_client_update_required`. Stop and update the client.

Read `command_help` for `coach.intent.set` (CLI `commands describe --kind
coach.intent.set`). Its `temporaryFocus` describes the current policy version,
allowed interests and selection bounds. The current policy accepts one to three
of `hypertrophy`, `strength`, `power`, `fat_loss`, `endurance`, `consistency`,
`comfort`. These are interests in coaching advice, not percentages, physical
capacity or permission to increase weight.

For an explicitly requested combination, the command data includes:

```json
{
  "representationVersion": 2,
  "kind": "focus",
  "objective": "multiple_axes",
  "focusSelection": {
    "policyVersion": "1",
    "selected": ["hypertrophy", "strength"],
    "priority": null
  }
}
```

This is only the focus part of a command. Keep all required athlete, exact
target, source version, start/end and command-envelope fields from the read and
prepared journal. Use the policy version actually returned by command help.
The target and window apply to the complete selection. `priority: null` means
none was declared: array order is not a ranking. Set priority only to a selected
interest when the user actually prioritizes it. Do not invent weights,
incompatibilities or training-load changes from these choices.

V2 always requires `focusSelection`. For a legacy mono objective or a skip,
it is null; for apply/cancel it is also null alongside the other null proposal
fields. V1 accepts neither the new selection nor a representation marker in
command data. Read the exact current target in v2 before changing a saved v2
focus, even when the requested replacement is mono or a skip.

A replacement replaces the whole overlapping instruction. If the person asks
to add an interest, first read the current selection and explain the complete
replacement. If that would exceed the selection limit, ask which interests to
keep; never silently remove one. Use a new instruction UUID for a newly
requested replacement. An uncertain write retries the original operation and
full data unchanged, including selected interests, priority and version.

Only active/scheduled entries from the supported policy guide advice. Unknown
policy versions may be preserved as stale or terminal history; they are not
permission to invent current semantics. A policy conflict requires fresh help,
fresh target data and a newly reviewed operation. A disabled producer returns
`temporary_focus_not_activated` with `wait_for_feature`; do not poll or silently
fall back. Payment, grants and named athlete control are checked separately.
