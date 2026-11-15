---
name: geniusfitness-recovery
description: 'Recover a failed or uncertain GeniusFitness CLI/MCP operation, expired connection, conflict, revoked access or temporary service refusal. Use when work was interrupted, not to run routine polling or retries.'
---

# Recover the operation that was actually attempted

Read the `recovery` workflow. First distinguish a request never sent, a terminal
refusal, and an unknown outcome after sending. A timeout or lost connection does
not prove that a write failed. Preserve its exact protocol, identity and body.

For local CLI/stdio MCP, inspect the operation with `commands inspect` or
`fitness_inspect_operation`. Retry the saved operation through `commands retry`
or `fitness_retry_command` only when appropriate, respecting Retry-After. The
journal dispatches generic commands and supported typed confirmations; do not
rebuild them as another protocol. Binary photo transfer has its own upload retry.

Hosted ChatGPT has no local disk journal. Retain the complete prepared command
or typed confirmation and resend it unchanged through the same tool. A changed
UUID, regenerated date or refreshed preview is a new operation, not a retry.
An old receipt is historical evidence, not current state or an authorization.

A definite conflict requires fresh reads and a deliberate revised action.
Revoked permissions, a disabled feature or insufficient subscription cannot be
bypassed with another tool, profile or transport. An uncertain rotating refresh
requires reconnecting rather than replaying its old token. CLI login and a
ChatGPT reconnection repair different connections.

After recovery, read the canonical target and report what is established. A
server receipt does not prove that a phone has rendered the result. The existing
application sync handles catch-up; do not create a polling loop or repeatedly
send the write to force a screen update.
