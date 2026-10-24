# Understand a training session

Ask ChatGPT: “Compare my recent squat sessions. Check the time spent on each set
and my rests before interpreting the total duration.”

The connector can read a specific recorded session through
`fitness_session_analysis`. The CLI equivalent is:

```sh
geniusfitness sessions analyze --scope project:PROGRAM_ID --id SESSION_ID --json
```

Find real session IDs in the program's `sessions` collection. Exercise IDs refer
to your exercise library; reuse the catalogue identity when comparing movements.

| Information               | Meaning                                                                                       |
| ------------------------- | --------------------------------------------------------------------------------------------- |
| Recorded session duration | Duration saved by the application; separate from the wall-clock span                          |
| Set elapsed time          | Time recorded by the set timer; it may include interruptions                                  |
| Actual rest               | Measured rest following that set, when recorded                                               |
| Target rest               | The planned rest, which is not a measurement                                                  |
| Completion time           | When the set was marked complete                                                              |
| Timing coverage           | Number of completed sets with a measurement versus eligible completed sets                    |
| Long timer observation    | A set or rest timer reached ten minutes; a reason to ask for context, not proof of an absence |

Missing time is reported as `null`; a measured zero stays zero. Disabled timing,
skipped sets and corrections remain distinct. Old sessions are not filled with
invented measurements. An exercise's duration value is not substituted for a
missing elapsed timer.

Set details page at 50 entries. Continue with `nextSetOffset` as `offset` and the
same `revision`. If the session changes, restart the read. Exercise totals and
coverage describe the recorded session; one page is not the whole set inventory.

```sh
geniusfitness sessions analyze --scope project:PROGRAM_ID --id SESSION_ID \
  --offset 50 --revision REVISION --json
```

This requires `metrics:read` and current access to the program. Coach access is
limited to shared programs and does not include an athlete's private health.
Watch BPM is not embedded in this session analysis; authorized observations
have a separate [wearable read](INSIGHTS.md). A live watch display
does not mean that a heart-rate time series was saved or shared with the agent.

Operational limits are enforced by the service. Ordinary training reviews focus
on your question; a service refusal remains explicit when it prevents an action.
