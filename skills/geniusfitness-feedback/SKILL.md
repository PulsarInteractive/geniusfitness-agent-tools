---
name: geniusfitness-feedback
description: 'Prepare and send a GeniusFitness bug report or Premium feature suggestion with the user’s approval, attach authorized screenshots, and follow the connected owner’s Premium feedback status.'
---

# Useful, private GeniusFitness feedback

Read `fitness_workflow` with `topic: feedback` before using the feedback tools.
Check current capabilities and the feedback grant. Feedback belongs only to the
connected account: never report as a student, change a workout to reproduce a
problem, or read unrelated health/program data to enrich a report.

Free accounts can report bugs and receive a submission receipt. Premium and
Coach accounts can also suggest features, read their retained feedback and its
status, and respond to the support team. These are current server checks, not
permissions inferred from an old receipt. Coach includes Premium. Existing
connections may require reconnection for `feedback:read` or `feedback:write`;
never suggest that a CLI login repairs a ChatGPT connection.

## Propose when useful, then respect the decision

- A real repeated failure or a clear missing capability can justify one concise
  offer to prepare a report. Do not propose a report for every validation error,
  expected permission/quota refusal, temporary network failure or unfamiliar
  tool. Consult the relevant workflow first.
- Show the proposed title, summary and attached images before sending. Wait for
  the user’s agreement. An explicit request such as “report this bug” already
  authorizes that report; do not force another approval or open the app merely
  to confirm. A suggestion to improve the app is not automatically permission
  to send a report.
- Do not repeatedly offer the same report after a refusal, silently submit
  feedback, poll its status, or retry through a different connection to evade
  a service limit. Respect the server’s retry guidance.

## Keep the report truthful and small

Separate observed behavior, expected behavior and unverified hypotheses. State
whether the failure was actually reproduced. Keep the user’s language. Include
only useful, known technical context: app/tool version, platform, affected
screen or operation, and a safe error code. Never invent a request ID or claim
that another device displayed a change because a server write succeeded.

Never automatically attach a conversation, bearer token, credentials, raw logs,
health measurements, precise location or a complete training program. The user
chooses the screenshots to transmit. Inspect the visible proposed content for
unnecessary private data before requesting consent.

Up to three static PNG/JPEG/WebP screenshots may accompany a request. Each input
is at most 4,000,000 bytes; the server re-encodes it to WebP, at most 1,080 px on
the longest side and 1,000,000 stored bytes. Local tools take regular files, not
URLs or ChatGPT attachment IDs. Hosted import requires a real supported file
parameter; do not invent a download URL. A visible chat attachment is not proof
of a completed import. Storage refusal must leave text-only bug submission
available.

Choose one draft UUID and current epoch, then upload authorized screenshots
before preparing the final submission. Put ready asset IDs into `attachments`
and the same `draftId` into the final draft. Never add attachments by changing a
saved submission after an uncertain send. For Premium replies, the existing
request ID is the upload draft ID and the three-image limit covers the thread.
See [the exact workflow](../../docs/FEEDBACK.md).

## Send once and report precisely

Prepare one immutable command and retain its ID and full body. Submit only the
approved command. After an uncertain response, recover that same command;
never generate another ID or change its bytes to retry. Local CLI/stdio use the
existing operation journal. Hosted ChatGPT retains the returned prepared object
and has no local journal. An already-confirmed local receipt is historical
evidence of sending, not a fresh status read or ongoing authorization.

Only a server receipt confirms submission. Distinguish prepared, received and
attachment-ready states. Follow Premium status on request with bounded pages.
“Retained for later” closes the current support discussion without promising a
delivery date or calling the feature implemented. Do not expose or attempt to
follow internal notes, priorities, assignees or another user’s duplicate report.

Sending a support reply requires both `feedback:read` and `feedback:write`,
because its receipt includes the current public conversation. Sending a new
report and recovering its delivery receipt require only `feedback:write`.
