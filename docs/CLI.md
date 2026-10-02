# CLI reference

`geniusfitness help --json` lists commands and options. `--json` emits one
versioned result on stdout; progress and errors use stderr. MCP reserves stdout
for protocol messages.

| Command                                | Purpose                                                          |
| -------------------------------------- | ---------------------------------------------------------------- |
| `auth login`                           | Browser consent with PKCE; `--flow device` for a remote terminal |
| `auth status`, `whoami`                | Current identity, profile and permission ceiling                 |
| `auth logout`                          | Revoke the terminal session, then erase local credentials        |
| `capabilities`                         | Server collections, commands and current limits                  |
| `programs list`                        | Bounded list of accessible programs                              |
| `catalog search`                       | Find catalogue exercises by query, key, equipment or muscle      |
| `resources list`                       | One collection or exact record                                   |
| `metrics summary`                      | Daily program totals within a date range                         |
| `changes list`, `changes watch`        | Bounded incremental follow-up                                    |
| `commands describe`                    | Local command catalogue and envelope schemas                     |
| `commands prepare`                     | Persist a draft with one immutable operation ID                  |
| `commands execute`                     | Send a complete journaled operation once                         |
| `commands retry`                       | Replay the exact saved operation                                 |
| `commands inspect`                     | Inspect local operation evidence without a server call           |
| `profiles list/create/restrict/select` | Manage narrower profiles                                         |
| `doctor`                               | Inspect local setup without revealing credentials                |
| `mcp`                                  | Run the local MCP server                                         |

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
