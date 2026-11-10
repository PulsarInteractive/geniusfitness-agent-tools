# CLI reference

`geniusfitness help --json` lists commands and options. `--json` emits one
versioned result on stdout; progress and errors use stderr. MCP reserves stdout
for protocol messages.

| Command                                | Purpose                                                                                  |
| -------------------------------------- | ---------------------------------------------------------------------------------------- |
| `auth login`                           | Browser consent with PKCE; `--flow device` for a remote terminal                         |
| `auth status`, `whoami`                | Current identity, profile and permission ceiling                                         |
| `auth logout`                          | Revoke the terminal session, then erase local credentials                                |
| `capabilities`                         | Server collections, commands and current limits                                          |
| `programs list`                        | Bounded list of accessible programs                                                      |
| `catalog search`                       | Find catalogue exercises by query, key, equipment or muscle                              |
| `catalog explore`                      | Read one v2 page with FR/EN text, grouped variants and explicit legacy metadata coverage |
| `resources list`                       | One collection or exact record                                                           |
| `metrics summary`                      | Daily program totals within a date range                                                 |
| `muscles insights`                     | Premium/Coach bounded per-exercise muscle evidence                                       |
| `workouts vitals`                      | Consented Premium/Coach minute heart-rate observations                                   |
| `changes list`, `changes watch`        | Bounded incremental follow-up                                                            |
| `commands describe [--kind KIND]`      | Targeted command schema, or full catalogue when omitted                                  |
| `commands prepare`                     | Persist a draft with one immutable operation ID                                          |
| `commands execute`                     | Send a complete journaled operation once                                                 |
| `commands retry`                       | Replay the exact saved operation                                                         |
| `commands inspect`                     | Inspect local operation evidence without a server call                                   |
| `profiles list/create/restrict/select` | Manage narrower profiles                                                                 |
| `doctor`                               | Inspect local setup without revealing credentials                                        |
| `mcp`                                  | Run the local MCP server                                                                 |

```bash
geniusfitness resources list --scope project:PROGRAM_ID --collection workouts --json
geniusfitness catalog search --query squat --json
geniusfitness metrics summary --scope project:PROGRAM_ID --from 2026-09-01 --until 2026-09-30 --json
geniusfitness commands prepare --file workout-draft.json --json
geniusfitness commands retry --operation OPERATION_ID --json
```

`--context` separates accounts or sessions. The initial beta defaults to the
development environment; access requires an admitted GeniusFitness account.
Choose `--environment production` explicitly for that environment. Environments
never share credentials. Arbitrary public API origins are refused; loopback
origins are available only with an explicit local-testing option.

| Exit code | Meaning                           |
| --------- | --------------------------------- |
| 0         | Success                           |
| 1         | Other failure                     |
| 2         | Invalid command or input          |
| 3         | Authentication required           |
| 4         | Permission denied                 |
| 5         | Conflict requiring reconciliation |
| 6         | Rate or usage limit               |
| 7         | Transient failure                 |

See [Insights](INSIGHTS.md) for the exact commands, consent requirements and
interpretation of missing measurements.

See [Coach Push proposals](COACH_PUSH.md) for exact-occurrence intent, athlete confirmation and safe command recovery.

Temporary exercise focus and skip instructions use `coaching intents` and
`coaching resolve-intent`. Add `--representationVersion 2` explicitly to preserve
all interests and a nullable priority in structured focus; omission keeps the
legacy representation. Commands are still prepared and retried through the
normal immutable command journal. See [Temporary exercise instructions](TEMPORARY_ACTIONS.md)
for the complete v1/v2 fields and replacement rules.

Whole-session planning decisions use `sessions skip-preview --file request.json`
and `sessions skip-confirm --file confirmation.json` for both `skip` and
`restore`. Preview is a separate authorized read; confirmation uses the existing
immutable journal. `commands inspect` and `commands retry` dispatch the saved
protocol without changing its UUID or fields. See [Session skip and restoration](SESSION_SKIP.md)
for exact targets, permissions, unknown outcomes and historical receipts.

Recurring next-session decisions use `sessions recurring-skip-preview --file
request.json` and `sessions recurring-skip-confirm --file confirmation.json`.
The preview takes exact schedule, athlete and workout IDs with one UUID; only
the service resolves the occurrence. Pass the complete returned confirmation
unchanged. `materialized` means review the existing exact-task workflow, with no
automatic confirmation. Both typed confirmations use `commands inspect/retry`
and the same durable journal. See [Session decisions](SESSION_SKIP.md).

Mixed temporary exercise and regional workout instructions use
`coaching intents-v3 --file read.json` and
`coaching resolve-intent-v3 --file resolve.json`. Both files contain complete
representation-3 requests, including explicit nullable sessionId and, for resolve,
exactly one exercise/regional branch. These commands only read. Use the same
commands prepare/execute/retry journal for user-authorized set/cancel or live
exercise-skip apply. Regional apply is unsupported. Never rewrite a saved V1/V2
operation or downgrade a mixed collection. See the complete V3 schema, examples
and recovery rules in [Temporary instructions](TEMPORARY_ACTIONS.md).
