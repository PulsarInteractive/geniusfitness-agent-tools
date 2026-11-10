# GeniusFitness CLI & MCP

Manage your training plans, exercises and progress with your own AI tools.
GeniusFitness keeps your programs and permissions in one place; your agent uses
its own model and credentials.

## Install and connect

Requires Node.js 22.13 or newer.

```bash
npm install --global @pulsarinteractive/geniusfitness@beta
geniusfitness auth login
geniusfitness whoami --json
geniusfitness programs list --json
```

Login opens your browser. Sign in to GeniusFitness, select programs and
permissions, then approve. There is no token to copy into your terminal.

## What you can do

| Feature                            | CLI                                              | MCP                                 |
| ---------------------------------- | ------------------------------------------------ | ----------------------------------- |
| Find your programs                 | `programs list`                                  | `fitness_programs`                  |
| Search exercises                   | `catalog search --query squat`                   | `fitness_catalog`                   |
| Explore grouped variants (v2)      | `catalog explore --query traction --locale fr`   | `fitness_catalog_search`            |
| Read workouts, planning or results | `resources list`                                 | `fitness_resources`                 |
| Summarize activity                 | `metrics summary`                                | `fitness_metrics`                   |
| Create or edit a plan              | `commands prepare` / `commands retry`            | Journaled command tools             |
| Read mixed temporary preferences   | `coaching intents-v3 --file read.json`           | `fitness_coach_intents_v3`          |
| Resolve one temporary target       | `coaching resolve-intent-v3 --file resolve.json` | `fitness_coach_intent_target_v3`    |
| Follow changes                     | `changes list` / `changes watch`                 | `fitness_changes` / `fitness_watch` |

For these source-only V3 temporary workflows, read [Temporary instructions](docs/TEMPORARY_ACTIONS.md): matching server support and activation are separate from installing the client.

Choose from the exercise catalogue before creating a custom exercise. Private
health measurements require separate permission. Managing another athlete’s
shared program also requires a Coach subscription and that athlete’s access grant.

## Connect your agent

Authenticate once with the CLI, then configure your MCP client to run:

```bash
geniusfitness mcp --context default
```

[Setup examples](https://github.com/PulsarInteractive/geniusfitness-agent-tools/blob/main/docs/INTEGRATIONS.md)
· [Training workflow](https://github.com/PulsarInteractive/geniusfitness-agent-tools/blob/main/docs/TRAINING.md)
· [Permissions and limits](https://github.com/PulsarInteractive/geniusfitness-agent-tools/blob/main/docs/LIMITS.md)
· [Agent skills](https://github.com/PulsarInteractive/geniusfitness-agent-tools/tree/main/skills)

## Documentation

- [CLI reference](https://github.com/PulsarInteractive/geniusfitness-agent-tools/blob/main/docs/CLI.md)
- [Authentication and account safety](https://github.com/PulsarInteractive/geniusfitness-agent-tools/blob/main/docs/AUTHENTICATION.md)
- [Contributing](https://github.com/PulsarInteractive/geniusfitness-agent-tools/blob/main/CONTRIBUTING.md)
- [Security reports](https://github.com/PulsarInteractive/geniusfitness-agent-tools/blob/main/SECURITY.md)

MIT © Pulsar Interactive. This repository contains the public agent client and
skills; the GeniusFitness application and service implementation are separate.

## ChatGPT

Connect the hosted service with OAuth: [setup and examples](docs/CHATGPT.md). Your computer does not need to run the CLI. Account permissions and quotas still apply. [Official directory publication](docs/OPENAI_PUBLICATION.md) is a separate review.

### Reuse a coach catalogue workout

Use `fitness_workout_copy_preview` (CLI: `workouts copy-preview`) with the
coach-owned source program/workout and the student's destination program.
Prepare `workout.copy` with the returned source fingerprint and target epoch.
The student owns an independent copy, including exercise definitions.

For a later update, preview the saved `copyOrigin` with `targetTraining`, then
confirm `workout.sync` using both fingerprints and the target revision. The
student's prescription customizations are replaced; schedules, completed
results, progress and health measurements are preserved. No automatic sync.
Current Coach entitlement, the student's planning grant, source reads and
destination writes are rechecked by the server.

### Recorded Push bonus results

`geniusfitness sessions push-results --scope project:ID --sessionId UUID --json`
reads one selected training session. MCP provides `fitness_push_results`; pass
`athleteId` for an authorized student. Results distinguish performed values, usual
values and the offered bonus, including units, missing observations and corrections.
On supporting servers, add `--includeRewardDetails true` (MCP
`includeRewardDetails: true`) for the exact settled `awardedXp` after caps.
Missing/null amounts stay unknown, including older awarded outcomes. This is
bonus XP for the outcome, not total session XP or physical progression.
This read requires `metrics:read` and current program access. It cannot execute a
bonus, award XP or update a prescription. It is available only on servers that
implement the Push result endpoint; an unavailable route is not an empty result.

### Later workout adjustments

Use `fitness_push_adjustments` or
`geniusfitness sessions push-adjustments --scope project:ID --athleteId USER --sessionId UUID --outcomeId ID --json`
with a current outcome from `fitness_push_results`. Each explicit call reads one
retained occurrence and up to 16 decisions. Empty pages may have a `nextCursor`;
continue with `--cursor` when needed. Saved/withdrawn values and dates explain a
historical decision, not whether it is currently applied. Current program grants
and named-coach rights are enforced on every page. This read grants no write or
private health access. Server rollout and package publication are separate.

The optional `goalProfileKey` on adjustment-history entries is an opaque, athlete-bound reference to the profile version used for that decision. It is not the current goal, a progress score, or permission to read private profile answers. A missing key or unavailable version must stay unknown; never join by goal label or date.

### Reviewed partial catalogue (unreleased source)

`geniusfitness catalog reviewed` reads one explicitly partial, version-pinned
corpus. For structured muscle and equipment filters, use `--file query.json`.
`geniusfitness catalog reviewed-detail --key ex.0662` reads one exact admitted
variant with its cited evidence and limits. The MCP equivalents are
`fitness_catalog_reviewed` and `fitness_catalog_variant`.

Each call is an ordinary authorized read. A page examines at most 48 candidates
before matching and can be empty while returning `nextCursor`. Continue only
explicitly, with the same query and limit. Families stay complete; request
`filters.expandVariants: true` to page individual variants. A grouped limit too
small for the next family is refused rather than cutting it.

Inventory is supplied by the caller or stays unknown; this read does not inspect
a private profile. Unknown muscles or equipment do not establish a match.
Relevance points describe the supplied page, not physiological percentages or
safety. Read the exact variant's source limitations and unavailable-media state.
The existing `catalog search`, `catalog explore`, and their MCP tools keep their
legacy metadata contracts. This source feature is not an npm release or a claim
that the complete catalogue is reviewed.

### Skip or restore a planned session (unreleased source)

Use `sessions skip-preview` / `fitness_session_skip_preview`, then confirm the
reviewed request with `sessions skip-confirm` / `fitness_session_skip_confirm`.
This changes one existing planned occurrence, not its recurring rule, completed
activity, XP or exercise prescription. Own manual planning is Free with current
`planning:write` access; another athlete also requires Coach and coaching rights.
The local client retains an immutable confirmation in its existing journal.
An old receipt is historical, not current state. See [the workflow and recovery
rules](docs/SESSION_SKIP.md). Supporting server activation and npm publication
remain separate.

For a next cycle that has no task yet, the additive
`sessions recurring-skip-preview` / `fitness_recurring_session_skip_preview`
returns the server's exact occurrence. Explicit confirmation uses
`sessions recurring-skip-confirm` / `fitness_recurring_session_skip_confirm`
and the same durable journal. A `materialized` result requires review through
the existing exact-task path; no task ID or confirmation is invented.
See [the bounded recurring workflow](docs/SESSION_SKIP.md#one-next-recurring-session).
Source availability does not activate the backend or publish an npm release.
