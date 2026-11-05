# Coach Push proposals

The CLI and MCP can propose a future Push for an athlete whose program the
connected coach currently controls. Confirmation is reserved for the athlete in
the application; a proposal stays pending until their application exposes and
they use those review controls. Neither connector can confirm, supply arbitrary weight/repetition
increases, change completed work, grant an attempt or award XP.

1. Read identity, capabilities and bounded planning to resolve the actual athlete,
   workout and occurrence. Do not guess IDs from names or dates.
2. Read `fitness_coach_push` (CLI example below). Keep its epoch and revision;
   these belong to the **athlete occurrence**, not the program inventory.
3. Read command help for `coach.push.propose`. Prepare the scope, a stable new
   proposal UUID, epoch/revision, and all six data fields. For the whole workout,
   exerciseId and setIndex are null; for an exercise, setIndex is null; otherwise
   use the exact exercise ID and 1-based set index. Rationale explains the intent.
4. Execute the immutable prepared command. CLI/local MCP use their existing
   persistent journal; remote MCP uses `fitness_prepare_command` followed by
   `fitness_coach_planning` with the exact returned command.
5. Confirmed intent requests a future evaluation; unavailable rules or incomplete
   context can produce no bonus. It never authorizes an attempt by itself.
6. When needed, read that exact occurrence again to distinguish pending,
   confirmed, declined and withdrawn. No polling loop is required.

```sh
geniusfitness coaching push-proposals --scope project:PROGRAM_ID \
  --athleteId ATHLETE_ID --trainingId WORKOUT_ID --occurrenceId OCCURRENCE_ID --json
geniusfitness commands describe --json
```

New intent uses a new proposal UUID. Editing uses the same UUID only while
pending, with the latest occurrence revision. `coach.push.withdraw` uses that
UUID and revision, but its data contains only athleteId, trainingId and
occurrenceId. Confirmed proposals must be withdrawn before replacement; the
athlete must review the replacement separately.

Reading needs planning:read, a current Coach subscription and control of the
named athlete's program. Writing also needs planning:write and coaching:write.
A coach cannot see or withdraw another coach's proposals. A student requires
Premium for a new proposed progression; withdrawal remains available after a
student downgrade while the coach's actual authority remains valid. Health
permissions and explicit health-sharing consent are separate.

After an uncertain response, retry the saved command unchanged. A receipt replay
recovers the original commit even if the proposal was later withdrawn; it is not
current state. A different login session/profile/connection cannot claim that
receipt. On conflict, reread and reconcile before preparing a new operation.
On access denial, stop; on rate limiting, respect Retry-After. No automatic retry
loop, bulk enumeration, secondary sync database or additional metrics collection
is introduced. The bounded read exposes at most eight retained proposals and no
private profile/plan fingerprints or athlete confirmation operation ID.

Server-side rights and subscriptions remain authoritative. Local client source
availability does not establish hosted deployment or npm publication; verify
capabilities on the connected environment.
