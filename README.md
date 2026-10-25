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

| Feature                            | CLI                                   | MCP                                 |
| ---------------------------------- | ------------------------------------- | ----------------------------------- |
| Find your programs                 | `programs list`                       | `fitness_programs`                  |
| Search exercises                   | `catalog search --query squat`        | `fitness_catalog`                   |
| Read workouts, planning or results | `resources list`                      | `fitness_resources`                 |
| Summarize activity                 | `metrics summary`                     | `fitness_metrics`                   |
| Create or edit a plan              | `commands prepare` / `commands retry` | Journaled command tools             |
| Follow changes                     | `changes list` / `changes watch`      | `fitness_changes` / `fitness_watch` |

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
