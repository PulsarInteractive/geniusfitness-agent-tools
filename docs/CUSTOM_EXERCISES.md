# Personal exercises and photos

Search the catalogue and personal library before creating a duplicate. A bounded search cannot prove the entire catalogue has no equivalent. Use `exercise.create` for a personal movement when no suitable definition has been found. Read command help, prepare the exact operation, then execute it within the user's request.

| Field                         | Meaning                                                                             |
| ----------------------------- | ----------------------------------------------------------------------------------- |
| `description`                 | Full movement explanation, up to 4,000 characters.                                  |
| `movementIntent`              | A short mental cue, up to 280 characters: what the person should try to do or feel. |
| `declaredMuscleContributions` | Up to 17 canonical targets with roles and optional relative shares.                 |

```json
{
  "description": "Keep the movement controlled while pulling against the available resistance.",
  "movementIntent": "Bring your elbows toward your hips.",
  "declaredMuscleContributions": {
    "qualification": "declared_estimate",
    "targets": [
      { "targetId": "lats", "role": "primary" },
      { "targetId": "biceps", "role": "secondary" }
    ]
  }
}
```

This example illustrates the schema, not an anatomical review. Use the canonical vocabulary in command help. Roles are `primary`, `secondary` or `unspecified`. Optional integer `relativeShare` is 1–100; supplied shares total at most 100, with any remainder unknown. Do not normalize incomplete allocations, invent shares, duplicate IDs or combine a target with an ancestor. Roles without numbers are valid. These estimates never measure activation, growth or recovery.

Omit fields to preserve them on update; `null` clears them. An empty target list means none have been entered, not that no muscles are used. Personal declarations, including AI suggestions, stay separate from reviewed catalogue evidence. `catalogueOrigin` is read-only import history and does not validate later edits. A `catalogKey` alone does not establish current qualification. Photos do not establish anatomical accuracy or safety.

## Local files: CLI and stdio MCP

Photos are optional; text-only exercises work independently. An exercise can have up to eight ordered images, optionally displayed as a sequence. New uploads accept static PNG, JPEG or WebP source files up to **4,000,000 bytes** and 4,096 pixels per dimension. The CLI rejects an oversized file before reading its contents or reserving storage. It never changes the original file or compresses it locally.

The server validates the original bytes, digest, container and dimensions, then normalizes each new image to WebP at quality 82, with a maximum dimension of 1,600 pixels and no enlargement. The stored image is capped at 1,000,000 bytes; if needed, one second pass uses quality 68 and at most 1,280 pixels. A failed transformation never stores the original. This processing applies to every upload client. The ready response describes the stored image, so its size, dimensions, filename and content type can differ from the source. Existing storage accounting charges the bytes actually stored, within the account's media allowance. Upload admission temporarily reserves the larger of the source size and 1,000,000 bytes; successful storage releases the unused amount. An expired or cancelled unprepared upload releases its hold.

1. Read the exact exercise's photos with `exercise-media list --exerciseId <id>` or `fitness_exercise_media`. Retain the epoch and sequence revision.
2. Run `exercise-media prepare --exerciseId <id> --expectedEpoch <epoch> --file <image>` or local `fitness_exercise_media_prepare`. This inspects one authorized local file without a request. Save the returned `data` object as reservation JSON.
3. Run `exercise-media open --file <reservation.json>` or `fitness_exercise_media_open`. It journals and reserves a pending photo; retain `request.id`. No image is ready yet.
4. Run `exercise-media upload --operation <request.id> --file <same-image>` or local `fitness_exercise_media_upload`. It verifies the original bytes against the saved reservation and makes one upload request. Retry a lost reply with the same reservation and source bytes, even when the server stores a compressed version. Do not substitute the stored image or generate a new ID to recover uncertainty. An already-confirmed upload returns its saved receipt without reopening the file or making another request.
5. Read the current list before editing. `exercise-media change --file <change.json>` or `fitness_exercise_media_change` attaches an existing owned ready asset, detaches one reference, or reorders the complete list. Supply an operation UUID, its original `issuedAt` timestamp, `expectedEpoch` and current sequence `expectedRevision`. Attach/detach uses `assetId`; reorder uses all `assetIds` and optional `sequence: true`.

Every explicit network operation uses its ordinary request allowance; bytes use existing storage accounting. Calls do not hide bulk traversal or retries. A photo failure does not undo a text exercise. Pending photos are not ready photos; report partial results honestly.

Open/change share the existing command journal: inspect uncertain operations with `commands inspect`, retry them with `commands retry`. Binary transfer retries use the explicit upload command. The journal retains the source hash, size and dimensions unchanged; the ready receipt separately describes the optimized image. Journals remain bound to connection, profile, session and origin. Never put credentials, signed URLs or image bytes in command JSON. Detaching the last reference closes access before asynchronous cleanup. Training history does not retain photo access.

### Earlier uploads

Previously stored images up to 15,000,000 bytes remain readable, attachable and reorderable. Confirmed local receipts remain available to their original connection and profile. A new transfer, including a retry of an older pending upload, cannot exceed 4,000,000 bytes. Inspect the journal and current photo list before preparing a smaller file as a new operation; never send different bytes under an existing ID or hash. An unfinished oversized reservation expires through the existing cleanup process. Pending reservations created before server normalization require a fresh operation after inspecting/removing the old pending reference. Confirmed images are not rewritten. The CLI leaves the original file and saved operation unchanged.

## Photos shared with ChatGPT

`fitness_exercise_media_import` is advertised only when the service has an approved file-host configuration. Its top-level `file` has required `download_url` and `file_id`, with optional `mime_type` and `file_name`. The tool imports one source file up to 4,000,000 bytes into the exact personal exercise, with the same server normalization as other uploads. Retain operation `id`, `issuedAt` and `expectedEpoch`; renewed URLs must still identify identical bytes on retry. Only explicitly allowed HTTPS origins are fetched, without redirects or forwarded credentials. URLs are transient and never become exercise data.

This follows the [OpenAI file API reference](https://developers.openai.com/plugins/reference#file-apis), checked on 15 November 2026. Its `openai/fileParams` metadata differs from GPT Actions `openaiFileIdRefs`. Seeing an image in a conversation does not prove the tool can receive it. Until an approved host and an actual ChatGPT attachment transfer are verified, use the app or local CLI for photos. Do not invent download links or claim an unseen attachment was imported.
