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
