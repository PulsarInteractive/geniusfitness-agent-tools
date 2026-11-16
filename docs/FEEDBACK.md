# Private feedback and support

GeniusFitness reports are private to the connected account and the support team.
Free accounts can report bugs and recover delivery receipts. Premium and Coach
also support feature requests, history, current status and replies. This does
not provide student access. The server checks current subscription and grants
on every call; `feedback:write` and `feedback:read` are separate narrow grants.
An existing connection is never expanded without consent. Capabilities are
discoverable without a feedback grant and report effective rights as false when
consent is missing. Receipt recovery requires `feedback:write`. Optional technical
context fields may be omitted or set to null; do not invent unknown values.

Read `fitness_workflow` with `topic: feedback`, or:

```sh
geniusfitness workflow show --topic feedback --json
geniusfitness feedback capabilities --json
```

An agent may offer one useful report after observing a real issue or identifying
a missing capability. It must wait for agreement before sending; an explicit
“report this bug” already authorizes that send. It must not automatically attach
chat history, health measurements, precise location, credentials, complete
training programs or raw logs. Include observed facts, expected behavior and
useful known context, and label any unverified explanation. Feedback earns no XP.

## Text-only report

Save a draft JSON file:

```json
{
  "type": "BugReport",
  "category": "sync",
  "title": "Watch program stayed old",
  "description": "After changing a planned weight through the connector, I saw the new weight on the phone. The open Watch still showed the old value.",
  "attachments": [],
  "context": { "platform": "watchOS", "screen": "training program" }
}
```

`BugReport` and `FeatureRequest` are wire enum values, not translated display
labels. Keep title and description in the user's language. Categories are
`training`, `running`, `catalogue`, `coach`, `sync`, `watch`, `account`, `billing`,
`integrations` and `other`. Context is optional and limited to known `platform`,
`appVersion`, `buildNumber`, `locale`, `screen`, `errorCode` and `requestId`.

```sh
geniusfitness feedback prepare --file draft.json --json
# Save the returned data.command object, not the outer CLI envelope, as command.json.
# The report is still local. Review its content and follow the user's authorization.
geniusfitness feedback submit --file command.json --json
geniusfitness commands inspect --operation COMMAND_ID --json
```

Preparation chooses `commandId`, `draftId` and `issuedAt` once. If the draft
omits `expectedEpoch`, it reads current feedback capabilities once. Supplying a
previously read current epoch makes preparation local. Never guess an epoch.
Only submission sends the report. Save the complete returned command unchanged.

After a lost response, use `commands retry --operation COMMAND_ID`; it dispatches
the original protocol and body from the normal operation journal. A hosted
connector instead retains and resends the complete command. Do not prepare again
or change content while an earlier outcome is unknown. A duplicate receipt can
refer to an already-open request with matching content; it is not a new ticket.

```sh
geniusfitness feedback receipt --id COMMAND_ID --json
```

This delivery lookup works for Free bug reports and returns no Premium thread
status. A saved receipt proves an earlier send, not ongoing authorization or a
live status. Current account resets, subscription changes and consent remain
server-authoritative.

## Authorized screenshots

The request has at most **three images in total**, including replies. Sources
must be static PNG, JPEG or WebP, at most **4,000,000 bytes**, with dimensions no
larger than 4096 px. All channels pass through server validation and compression:
WebP, at most **1080 px on the longest side** and **1,000,000 stored bytes**, with
metadata removed. Personal account storage and support limits both apply.
A storage refusal must leave a text-only report available.

For local CLI/stdio, choose a UUID `draftId` first and read the current epoch.
Prepare, reserve and upload each image before preparing the final report:

```sh
geniusfitness feedback media-prepare --draftId DRAFT_UUID --expectedEpoch CURRENT_EPOCH --file screenshot.png --json
# Save the returned data object as upload.json.
geniusfitness feedback media-open --file upload.json --json
geniusfitness feedback media-upload --operation UPLOAD_UUID --file screenshot.png --json
```

The returned ready asset ID belongs in final draft `attachments`, alongside the
same `draftId`. Then prepare and submit the final report. Never mutate a prepared
submission to add images: prepare only after image transfers are complete. The
source path and image bytes are not stored in the operation journal. After an
uncertain transfer, keep the upload ID and exact original bytes. A confirmed
transfer can replay its receipt even after the source file is removed.

For a Premium reply, use its existing request ID as `draftId`. The three-image
limit still covers the entire discussion. Hosted ChatGPT uses
`fitness_feedback_media_import` with a real supported `file` object containing
`download_url` and `file_id`, plus optional `mime_type` and `file_name`. The tool
is advertised only when that host transfer is supported. It is not an arbitrary
URL downloader, and a visible attachment is not proof of a completed import.
Retain the exact import `id`, `draftId`, `expectedEpoch`, `issuedAt` and file
reference on retry. Never pass a host attachment ID as a local filesystem path.

## Premium follow-up

```sh
geniusfitness feedback list --status waiting_user --type BugReport --json
geniusfitness feedback show --id REQUEST_UUID --json
```

Read one bounded page at a time and preserve `next` as the `--after` cursor when
more results are needed. Do not poll in the background. Status values are `received`,
`under_review`, `waiting_user`, `planned`, `in_progress` and `closed`. Closed
resolution `remembered` means “Retained for later”, without promising a date or
claiming delivery. Only public team replies are exposed; internal notes,
priorities, assignees and another author's duplicate request remain private.

To reply, use the latest detail epoch and exact summary revision:

```json
{
  "id": "REQUEST_UUID",
  "request": {
    "commandId": "NEW_REPLY_UUID",
    "issuedAt": 1794823200000,
    "expectedEpoch": "CURRENT_EPOCH",
    "expectedRevision": "2",
    "text": "The issue also occurred after reopening the Watch app.",
    "attachments": []
  }
}
```

The identifiers and timestamp above are illustrative: use actual UUIDs, the
current time in milliseconds and current server values. Send approved reply
JSON with `feedback reply --file reply.json --json`. Retain the command ID and
request for recovery through the same `commands inspect` / `commands retry`.
On a revision conflict read current detail and reconcile before preparing a new
reply; never silently overwrite a team update. Respect retry timing for limits.

In MCP, the same operations are `fitness_feedback_capabilities`, `_prepare`,
`_submit`, `_list`, `_detail`, `_receipt`, `_reply` and `_media_open`. Local stdio
adds `_media_prepare` and `_media_upload`; hosted ChatGPT adds `_media_import`.
Existing `fitness_retry_command` and `fitness_inspect_operation` recover local
writes. The dedicated feedback workflow does not use generic `AgentCommand`.

Sending a support reply requires both `feedback:read` and `feedback:write`,
because its receipt includes the current public conversation. Sending a new
report and recovering its delivery receipt require only `feedback:write`.
