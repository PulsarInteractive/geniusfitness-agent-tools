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

## What one repetition or duration means

On supporting services, `countingConvention` records an explicit counting rule.
Use the exercise's known convention or the user's requested choice. An absent
value stays unknown; do not infer it from a name, picture or muscle target.

| Value                                   | Meaning                                                                                 |
| --------------------------------------- | --------------------------------------------------------------------------------------- |
| `alternating_opposite_pair_repetitions` | One extension and return of one opposite arm/leg pair counts as one repetition.         |
| `alternating_side_repetitions`          | One complete movement of one side counts once; the next repetition uses the other side. |
| `per_side_repetitions`                  | The repetition count covers one side.                                                   |
| `per_side_duration`                     | The duration covers one side.                                                           |
| `bilateral_repetitions`                 | One movement performed on both sides together counts as one repetition.                 |

The two alternating rules have different units of work. An opposite arm/leg
pair moves together in `alternating_opposite_pair_repetitions`. In
`alternating_side_repetitions`, each complete left or right movement counts
separately; a left/right cycle is not one repetition. Neither rule assigns
the total to each side. Preserve the returned rule and source instructions;
never replace one with the other to satisfy an older client or service.

Repetition conventions require a repetition tracking type: `WeightReps`,
`BodyweightReps`, `WeightedBodyweight`, `AssistedBodyweight` or `ResistanceReps`. Per-side duration
requires `Duration` or `DurationWeight`. The service checks the resulting saved
exercise, including a partial edit against its existing tracking type.

This field sets neither the number of repetitions nor the time target. It does
not record which physical side was performed. Preserve the actual observations:
never double repetitions, divide seconds, create a missing side or recalculate
history from this field. Weight convention is separate: a per-hand load does
not mean the repetition count should be multiplied. Counting never changes a
recorded load or its unit. For a reviewed import, keep the returned `defaultUnit`
(`kg` or `none`); preserve existing quantities and units when reading or replaying
records. Omission preserves the convention on update; `null` clears it.

For unmeasured external resistance, `ResistanceReps` uses `defaultUnit: "none"`.
Keep the required equipment and counting rule explicit. No mass, tonnage or
mass-based Push can be inferred from a band label; see
[tracking and reader compatibility](EXERCISE_TRACKING.md).

## Source language and saved translations

On supporting services, `contentLocale` identifies the known language of the
source name, description and movement intention. Use canonical tags such as `en`
or `fr-FR`. A missing/null language stays unknown. Newly authored content from
an agent defaults to English unless the person chose another source language;
existing content keeps its declared language.

For a requested translation, save any source edit first and read the exercise
again. Copy its server-owned `contentSourceFingerprint` and use its current
record revision with ordinary `exercise.update`. `localizations` is a complete
list of at most 16 unique languages; preserve the other entries when changing
one. Each entry has `locale`, `sourceFingerprint` and a partial `text` object
containing only `name`, `description` and `movementIntent`.

```js
const localizations = [
  ...(exercise.localizations ?? []).filter((entry) => entry.locale !== 'fr'),
  {
    locale: 'fr',
    sourceFingerprint: exercise.contentSourceFingerprint,
    text: {
      name: 'Rowing avec appui',
      movementIntent: 'Ramène le coude vers ta hanche.',
    },
  },
];
```

Here `exercise` is the current server read, not a fabricated record; use an
empty list when it has no saved translations. The name allows 2–100 characters,
description up to 4000 and movement intention up to 280. Absent translated fields
fall back individually. Omission preserves the list; null or `[]` removes all
translations. Remove a locale entry to clear its final translated field.

Changing the source leaves older translations stored but stale. New or edited
entries with an old fingerprint receive `exercise_translation_source_changed`;
reread and review the source before preparing a new operation. Do not calculate
the fingerprint, relabel source language or alter an uncertain saved request to
force acceptance. The same permissions, revisions and receipts apply. Reading
never invokes a translation provider, and stale text is never presented as
current. Package installation alone does not activate the matching service.

For presentation, reuse a saved current translation without editing the source.
When a response includes `textResolution`, it reports the locale served for each
field and the stale locales. Keep that distinction when a partial translation
falls back to English or original text. For a raw exercise record, compare each
entry’s `sourceFingerprint` with the server’s `contentSourceFingerprint`; an old
or unknown fingerprint cannot establish a current translation. A read does not
authorize generating or saving missing text.

## Local files: CLI and stdio MCP

Photos are optional; text-only exercises work independently. An exercise can have up to eight ordered images, optionally displayed as a sequence. New uploads accept static PNG, JPEG or WebP source files up to **4,000,000 bytes** and 4,096 pixels per dimension. The CLI rejects an oversized file before reading its contents or reserving storage. It never changes the original file or compresses it locally.

The server validates the original bytes, digest, container and dimensions, then normalizes each new image to WebP at quality 82, with a maximum dimension of 1,080 pixels and no enlargement. The stored image is capped at 1,000,000 bytes; if needed, one second pass uses quality 68 and at most 1,080 pixels. A failed transformation never stores the original. This processing applies to every upload client. The ready response describes the stored image, so its size, dimensions, filename and content type can differ from the source. Existing storage accounting charges the bytes actually stored, within the account's media allowance. Upload admission temporarily reserves the larger of the source size and 1,000,000 bytes; successful storage releases the unused amount. An expired or cancelled unprepared upload releases its hold.

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
