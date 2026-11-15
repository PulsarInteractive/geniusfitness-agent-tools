---
name: geniusfitness-media
description: 'Add, remove or reorder private photos on a GeniusFitness personal exercise, including an optional sequence. Use for exercise media through CLI, local MCP or an available ChatGPT file import.'
---

# Attach useful photos to a personal exercise

Read the `media` workflow and [the exact transfer procedure](../../docs/CUSTOM_EXERCISES.md).
Identify the saved personal exercise and its current photo epoch/revision first.
Up to eight ordered images may illustrate its movement; sequence playback is
optional. A photo does not certify muscle targeting or exercise suitability.

Local CLI/stdio MCP prepares the source file without a request, reserves one
upload, then transfers the same original bytes. New static PNG/JPEG/WebP files
are limited to 4,000,000 bytes. The server decodes and compresses every new upload
to WebP, at most 1,080 px on the longest side without enlargement and at most
1,000,000 stored bytes. The ready response describes the stored representation;
its dimensions, type, hash and size can differ from the source. Existing account
storage is charged for the stored bytes after temporary admission headroom.

Keep the original source and immutable operation identity for an uncertain
transfer. Never substitute compressed output under the original source hash.
A confirmed local receipt can replay without reading or sending the source.
Read the current list before attach, detach or reorder; reorder carries every
retained image ID and the current sequence revision.

In ChatGPT, use `fitness_exercise_media_import` only when the hosted connector
advertises it and supplies a real file parameter. A visible chat attachment is
not proof that an importable download URL exists. Never invent a URL, fetch an
unapproved host or use credentials from another service. If the tool is absent,
explain the available app/local-file route without claiming an upload happened.

Deleting the last reference closes access and schedules physical removal. Report
pending versus ready honestly. Read [recovery](../geniusfitness-recovery/SKILL.md)
for uncertainty; changing account does not transfer the pending upload's authority.
