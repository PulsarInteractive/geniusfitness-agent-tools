# Running plans and context

Start with `geniusfitness workflow show --topic running --json` or MCP
`fitness_workflow` with `topic: "running"`. The guide is local/static; reading
records and applying commands still uses the account's normal permissions and quota.
Use bounded pages and exact records rather than a broad multi-program search.

A workout may carry a versioned `runPlan`. A completed recording retains its plan
and reported `planProgress`: reached, skipped and unreported stages differ. A
later workout edit does not rewrite that recording. Read command help for the
current encoding before preparing an authorized change.

## Optional athlete observations

| Field             | Values                                                 | Meaning                                                                 |
| ----------------- | ------------------------------------------------------ | ----------------------------------------------------------------------- |
| `perceivedEffort` | Integer 0–10 or null                                   | Athlete-reported effort; zero is an explicit answer, null is unanswered |
| `terrain`         | `Road`, `Trail`, `Track`, `Treadmill`, `Mixed` or null | Reported surface, not a GPS inference                                   |
| `notes`           | Up to 400 characters                                   | Supplied context such as weather or hills                               |

Only the recording owner or their authorized connector may change effort and
surface. Coach access does not let an agent answer for a student. Read the exact
run and current revision; omitted fields remain unchanged, explicit null clears
an optional observation. The server enforces ownership and validates values.
These additive fields require a server version that supports them; if unavailable,
explain that limitation instead of repeatedly retrying or dropping the answer.

Keep one recording identity and one immutable command after an uncertain reply.
Once the initial save has started, a correction is a later `run.update` against
the saved record, never another `run.create`.

## Explain comparisons honestly

Use measured distance, active duration, source and coverage. Missing effort is
not zero and pace does not reveal effort. Even matching reported effort and
surface leaves route, weather and pauses uncertain. A faster run is an observation,
not a fitness score or a safe prescription. Ask for missing context when it would
change the interpretation; never invent it.

Run metrics use `metrics:read` and their ordinary write permissions. GPS routes
need separate explicit `location:read` / `location:write` grants and are owner-only.
Personal health and athlete-to-coach wearable sharing remain separate. Ordinary
`run.create` / `run.update` reject route fields; use `run.route.update` for an
authorized route change and preserve segment breaks.

## Reviewing the next session

Read the exact workout and current revision before proposing a change. Show its
saved stages, the requested change and the relevant observed runs. A single long
session and a gap in running matter independently of weekly totals. A percentage
difference describes the chosen records; it is not a safe allowance. Timed stages
have no inferred distance, and a mixed duration/distance plan has no invented
whole-run distance or pace.

Use the athlete's explicitly stated goal and current context. If those answers
are not available through the granted records, ask instead of treating a program
name as the athlete's personal goal. Endurance emphasizes recorded distance and
duration; consistency and general activity emphasize regular participation.
Weight management never turns run calories into a promised weight-loss result.
Resistance goals do not automatically require a harder run.

No automatic running escalation is currently approved. For an explicitly requested
manual edit, use `geniusfitness commands describe workout.update --json`, then the
ordinary prepare/review/execute flow. Retain the current revision and unchanged
retry body. A changed workout applies to future starts; it cannot alter a plan
already copied into an active recording. Do not add frequency changes or XP as
unrequested side effects. A revision conflict requires a fresh read and review.
