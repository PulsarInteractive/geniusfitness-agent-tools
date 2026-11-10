# GeniusFitness workflows

| What you want                          | Guide topic  | Operations                                                                                                                      |
| -------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Find a movement or create a custom one | `catalogue`  | Search catalogue; reuse/import an exercise; create, update or delete a custom exercise; maintain workout slots and instructions |
| Plan training                          | `planning`   | Create/update/delete programs, workout templates, individual planning entries, recurring schedules and goals                    |
| Plan or review a run                   | `running`    | Plans, interval outcomes, optional athlete-reported effort, comparisons and separate GPS permissions                            |
| Review recent performances             | `progress`   | Daily totals and targeted session analysis with per-set timing, rest and measurement coverage                                   |
| Read or record measurements            | `progress`   | Your stored personal health records, with separate consent                                                                      |
| Work with a student                    | `coaching`   | Shared program workouts, planning and results, with Coach, coaching permission and current membership                           |
| Recover an interrupted edit            | `mutations`  | Preserve the exact request; read back; reconcile a revision conflict                                                            |
| Connect or fix missing permissions     | `connection` | Correct account, consent and reconnect                                                                                          |

Use `fitness_workflow` in MCP or `geniusfitness workflow show --topic TOPIC`.
Use command help for current field types rather than copying guessed payloads.
For runs, see [Running plans and context](RUNNING.md).
For timing and measurement coverage, see [Understand a training session](PROGRESS.md).

For a whole planned session, use the typed `fitness_session_skip_preview` and
`fitness_session_skip_confirm` workflow in [Session skip and restoration](SESSION_SKIP.md).
It reuses a complete canonical confirmation, not `fitness_prepare_command` or a
generic planning update. The existing local journal retains uncertainty; hosted
MCP must retain and resend the full confirmation itself. A skip is neither Done
nor deletion, and a restored skip does not fabricate completed activity.

## Example requests

- “Find a catalogue squat variation using dumbbells and add it to my Tuesday workout.”
- “Create a custom exercise for this movement, with three sets of eight and 90 seconds rest.”
- “Move my recurring training from Thursday to Saturday, keeping my timezone.”
- “Compare my recorded sessions over the last four weeks.”
- “Show my recent stored weight measurements.”
- “As coach, update the workout in the program my student shared with me.”

## Boundaries that remain important

The athlete must share the program through the application. Coach access alone never
exposes another account’s private health. Wearable observations require the
athlete’s separate named-coach consent and, for an agent, connector consent. The
connector reads stored health measurements; it does not connect directly to
Apple Health on a phone. A completed session is a fact, not a planning template.
Deleting the final finished result can reopen its linked plan under ordinary task
permissions. Read back affected planning after that operation.

Writes do not manage subscriptions, billing or permission grants. The account’s
[limits](LIMITS.md) apply across ChatGPT, CLI and local MCP together.

See [Muscle insights and wearable observations](INSIGHTS.md) for Premium evidence,
measurement limits and the athlete-controlled sharing workflow.
