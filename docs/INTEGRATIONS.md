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

| Skill                    | Purpose                                                                 |
| ------------------------ | ----------------------------------------------------------------------- |
| `geniusfitness`          | Find programs, reuse catalogue exercises and maintain training plans    |
| `geniusfitness-coaching` | Work on an athlete’s shared program with current Coach rights           |
| `geniusfitness-progress` | Read reliable progress and manage authorized activity or health records |

Install them through your agent client’s supported skill mechanism. The plugin
manifest combines the skills with a local stdio MCP configuration. It does not
claim approval in a hosted integration directory or provide a remote MCP URL.

## Independent sessions

Profiles can narrow the access available to a connection. Selecting a narrower
profile rotates credentials and cannot regain broader access. Use separate named
contexts for independently authorized terminals. Saved operations belong to the
account, connection and profile that prepared them; another profile cannot adopt
their pending writes.
