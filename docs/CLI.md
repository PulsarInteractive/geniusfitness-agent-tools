# CLI reference

`geniusfitness help --json` lists commands and options. `--json` emits one
versioned result on stdout; progress and errors use stderr. MCP reserves stdout
for protocol messages.

For private bug reports, feature suggestions and replies, see [Feedback](FEEDBACK.md).
Use `feedback capabilities`, `prepare`, `submit`, `receipt`, `list`, `show` and
`reply`; image steps are `media-prepare`, `media-open` and `media-upload`.

For personal exercise photos, see [Personal exercises and photos](CUSTOM_EXERCISES.md).
The explicit commands are `exercise-media list`, `prepare`, `open`, `upload`
and `change`. Preparation is local; each network step is separate and resumable.

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

## Keep the CLI current

`geniusfitness update check --json` reads the official npm release without
changing the installation or accessing your GeniusFitness account. The default
channel follows the installed version: beta builds check `beta`, stable builds
check `stable`. Choose either explicitly with `--channel beta|stable`. A stable
check does not install a prerelease or downgrade a newer installed version.

`geniusfitness update install` updates the active global npm installation to the
exact checked version. It verifies the installation location, disables package
scripts and asks npm to enforce the required Node version. A source checkout,
project dependency or pinned npx invocation receives manual upgrade guidance
instead of changing a different installation. Connection credentials and saved
operations stay in place. Restart a running MCP client after installing an update.

Successful interactive commands can show a brief update notice on stderr, at
most once per UTC day for the installed version. The anonymous check uses the official npm registry, a small
separate cache and a fixed deadline; its failure does not change the command's
result. There is no automatic installation. MCP, `--json`, CI, redirected output
and local-only help, workflow, preparation and inspection commands make no
automatic update requests. Set `GENIUSFITNESS_NO_UPDATE_CHECK=1` to disable
notices; an explicit `update check` remains available. Tiny attempt markers expire
after the current and preceding UTC days. An interrupted check cannot block the
next day’s discovery.

### Replace an exercise in your workout

Prepare the exact JSON request described in
[exercise replacement](TRAINING.md#replace-one-exercise-with-an-explicit-prescription-reset):

```sh
geniusfitness workouts replace-exercise-preview --file replacement-request.json --json
# Review the returned diff and explicitly authorize clearing the old target sets.
geniusfitness workouts replace-exercise-confirm --file replacement-confirmation.json --json
geniusfitness commands inspect --operation REQUEST_UUID --json
# Only if an attempted confirmation has an uncertain outcome:
geniusfitness commands retry --operation REQUEST_UUID --json
```

Confirmation takes `action: "confirm"`, the original `request`, `epoch`,
`expectedRevision`, `preparedAt` and `previewKey` from the preview. It is a typed
protocol, not a generic command file. The changed slot requires a newly configured
prescription; no dose is transferred. A preview never confirms itself and a retry
never generates a new UUID or refreshes an expired preview.
