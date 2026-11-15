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

For exact exercise replacement, preserve `action`, the whole `request` including
`requestId`, `epoch`, `expectedRevision`, `preparedAt` and `previewKey`. The local
journal dispatches `exercise_replacement`; hosted MCP must resend the unchanged
body to `fitness_exercise_replacement_confirm`. An old receipt remains historical
and still reports `requires_configuration`; it is not permission to reset again
or transfer/recreate the old sets. Never fall back to generic slot CRUD.

On `fitness_reader_update_required`, stop without automatic retries or discarding
unsupported records. Run `geniusfitness update check` and install a compatible
published version when available; restart MCP or update its pinned package.
Preserve the original journal and request. Do not downgrade an exercise type,
clear saved operations or claim that an update enables server capabilities. See
[reader compatibility](../../docs/EXERCISE_TRACKING.md#reader-compatibility-and-recovery).
