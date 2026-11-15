# Agent integrations

First authenticate with the CLI in a terminal:

```bash
geniusfitness auth login --context training
```

The MCP process uses that context and never starts an interactive login itself.
No token belongs in an MCP configuration, command line or shared project file.

## MCP clients

Install the CLI globally, then use:

```json
{
  "mcpServers": {
    "geniusfitness": {
      "command": "geniusfitness",
      "args": ["mcp", "--context", "training"]
    }
  }
}
```

Version-pinned `npx` examples are in `examples/`. Use the same context and
environment for login and MCP. Different accounts need different contexts.

## Skills

The `skills/` directory contains portable workflow instructions:

| Skill                        | Purpose                                                            |
| ---------------------------- | ------------------------------------------------------------------ |
| `geniusfitness`              | Connect and route the requested work to a focused guide            |
| `geniusfitness-catalogue`    | Find exact variants and inspect equipment and muscle evidence      |
| `geniusfitness-planning`     | Maintain dates, recurrence, session skips and goals                |
| `geniusfitness-training`     | Edit workout contents, sets, rest and authorized copies            |
| `geniusfitness-coaching`     | Work with a student's explicitly shared program                    |
| `geniusfitness-progress`     | Interpret recorded activity and consented measurements             |
| `geniusfitness-running`      | Maintain running stages, recordings and authorized GPS data        |
| `geniusfitness-exercises`    | Edit personal definitions, movement intention and declared targets |
| `geniusfitness-media`        | Manage private exercise photos and image sequences                 |
| `geniusfitness-localization` | Preserve meaning and known weight units across languages           |
| `geniusfitness-recovery`     | Recover the original operation after failure or uncertainty        |

Install them through your agent client’s supported skill mechanism. The plugin
manifest combines the skills with a local stdio MCP configuration. It does not
claim approval in a hosted integration directory or provide a remote MCP URL.

## Independent sessions

Profiles can narrow the access available to a connection. Selecting a narrower
profile rotates credentials and cannot regain broader access. Use separate named
contexts for independently authorized terminals. Saved operations belong to the
account, connection and profile that prepared them; another profile cannot adopt
their pending writes.

## CLI updates and pinned installations

The CLI can check the official package with `geniusfitness update check`.
`geniusfitness update install` updates only its verified global npm installation.
It leaves connection contexts and operation journals in place; restart MCP to
load the new version. For a project dependency or a pinned npx configuration,
update that version explicitly. Automatic notices do not run inside MCP.
See [the update behavior](CLI.md#keep-the-cli-current) for channels and opt-out.
