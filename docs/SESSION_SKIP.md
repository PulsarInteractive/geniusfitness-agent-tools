# Skip or restore one planned session

This additive source feature requires a server that supports the session-skip
endpoints and has enabled them. Client installation does not enable the service;
no npm release or deployment is implied. `capabilities.commands` describes only
generic AgentCommand operations, not the full set of typed endpoints. Neither
MCP tool discovery nor the permission ceiling proves that this producer is
enabled. An unavailable preview (503) is not an empty or successful decision:
stop without switching tools, creating another UUID or claiming activation.

A whole-session skip marks one **already materialized planned occurrence** as
skipped. It does not delete its task, mark it Done, create a completed workout,
grant XP, alter exercise prescriptions or rewrite the recurring rule. Restore
withdraws that skip; it does not record activity or undo a workout. Temporary
exercise/set instructions use [their separate workflow](TEMPORARY_ACTIONS.md).
Do not expand a recurrence into invented task IDs or treat an exercise slot as a
whole session.

## Preview and confirm

1. Read identity, the selected program and the exact planned task. Discover the
   real `scope`, `athleteId`, `trainingId` and `taskId`. Resolve ambiguous dates
   with the person. Both preview and confirmation require `planning:write` and
   current program rights. Own manual planning is available on Free; another
   athlete additionally requires `coaching:write`, current Coach entitlement
   and the server's exact athlete/program authorization.
2. Choose **one UUID** as `operationId` and retain it. Call
   `fitness_session_skip_preview` with the complete Request:
   `representationVersion: 1`, that `operationId`, `action: "skip"` or
   `"restore"`, and `target: {scope, athleteId, trainingId, taskId}`. CLI:
   `geniusfitness sessions skip-preview --file request.json --json`.
   No fields are defaulted and no confirmation is sent by this read.
3. Explain the returned target, date and decision. Confirm only a `state:
"review"` preview within the user's explicit request. `blocked`, unknown
   activity, a pending Start, changed sources and unavailable access are refusals
   to proceed. Do not reinterpret them as a completed session or a successful
   skip. `expiresAt` limits this proposal; it is not an expiry for a saved skip.
4. Construct the canonical Confirmation using **only** the returned `request`,
   `epoch`, `decisionRevision`, `expectedRevision` (including explicit null),
   `preparedAt`, and `key` renamed to `previewKey`. Do not add an actor, authority,
   amount, exercise action or new operation ID. Call
   `fitness_session_skip_confirm` or
   `geniusfitness sessions skip-confirm --file confirmation.json --json`.
5. Report success only from a valid Result bound to the exact target, action,
   operation and epoch. Preserve the result and request. A definitive
   revision/source refusal requires a new read and deliberate review before a
   new operation; a timeout is not proof that nothing was committed.

IDs may contain template separators and revisions are opaque. Copy returned
values rather than parsing, truncating or rebuilding them. A moved task may have
a historical decision for its previous workout; that history is descriptive,
not authority to change the previous target.

A `start_pending` result can reflect an older Start whose outcome is still
unknown. The agent preview does not acquire native Start/settlement privileges
to reconcile it. Resume the original Start or open the application for its
existing recovery path; do not create another operation ID to bypass the pending
claim. This also applies to a Start that has aged beyond its proposal window.

## Lost replies and historical receipts

Local CLI/MCP uses the existing private `CommandJournal`, with an explicit
`session_skip` protocol variant. It writes the complete confirmation before the
HTTP request, bound to the current environment, connection, profile and terminal
session. There is no second store or synthetic generic command.

After uncertainty, use `commands inspect --operation UUID` or
`fitness_inspect_operation`, then explicitly retry the **same saved operation**
with `commands retry --operation UUID` or `fitness_retry_command`. Honor any
retry deadline. The journal never regenerates an ID, refreshes a preview, changes
the action or automatically retries. Expiry does not justify rewriting an
uncertain confirmation: only the server can distinguish a late first attempt
from an already committed operation. Lost replies, conflicts and unavailable
features are not success.

Local confirmation results are `{source: "server" | "local_receipt", receipt:
Result}`. A confirmed local receipt is retained evidence, not a current server
read. If a skip was later restored, replaying the earlier skip returns its
historical receipt and **does not reapply it**. Use a fresh preview with a new
review operation ID to inspect the current disposition; do not confirm merely
to check state.

Hosted MCP does not use your computer's journal. Retain the complete canonical
Confirmation and resend it unchanged to `fitness_session_skip_confirm` after
uncertainty. The hosted tool returns the canonical Result in its usual MCP data
envelope. It must not be sent through the generic command tool, whose fields and
revision limits are different. Current permissions are rechecked by the service;
a receipt is never a grant to access the task now.
