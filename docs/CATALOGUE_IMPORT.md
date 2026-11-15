# Import a reviewed catalogue exercise

Use this flow when the exact variant is in the reviewed subset. Reuse a suitable
exercise already in the connected account's library before creating another.
The import creates one personal definition. It does not add a workout slot,
choose repetitions or rest, schedule a session, or award XP.

1. Read the exact variant with `fitness_catalog_variant` or
   `catalog reviewed-detail --key ex.NNNN`. Check the equipment, source limits,
   load convention and movement intention for this variant.
2. Call `fitness_catalogue_import_preview` with `catalogueKey` and `locale`
   (`fr` or `en`). CLI: `catalog import-preview --file query.json`.
   Both preview and confirmation require `exercises:write` for the connected
   account. The preview is a read, not a reservation or permission to edit.
3. Proceed only when `state` is `projected`. Inspect `definition` and `origin`.
   Preserve the exact source cue in `movementIntent` and the ordered technical
   paragraphs in `description` when present. These fields are copied only for
   source mappings that support them; older definitions may omit them.
4. Read the personal `exercises` collection for its current `epoch`. Construct
   the request once from the preview and the user's chosen language:

```js
const request = {
  catalogueKey: preview.catalogueKey,
  locale: 'fr',
  sourceContentVersion: preview.sourceContentVersion,
  subsetVersion: preview.subsetVersion,
  mappingVersion: preview.mappingVersion,
  epoch: library.epoch,
  elementId: crypto.randomUUID(),
  operationId: crypto.randomUUID(),
  issuedAt: Date.now(),
};
```

5. Call `fitness_catalogue_import_confirm` with this request, or
   `catalog import-confirm --file request.json`. Do not wrap it in an
   `AgentCommand` or send a fabricated `catalogueOrigin`.
6. Read the imported personal exercise by `elementId`. Its `contentLocale`
   describes the copied language; the server supplies its source fingerprint.
   A later personal edit does not make that edit reviewed catalogue content.

`readyToStart` stays false even after a successful import. Place the new
definition into a workout separately if that is part of the user's request.
Preserve its explicit counting rule and keep it separate from load convention;
see [counting meanings](CUSTOM_EXERCISES.md#what-one-repetition-or-duration-means).
Neither muscle roles nor software relevance scores are physiological percentages.

A `requires_configuration` preview, including
`source_guidance_not_representable`, must stay unresolved. Do not truncate the
source text or silently switch to `exercise.import` to obtain an apparently
equivalent result. The legacy command copies legacy metadata and does not create
this reviewed origin.

The local CLI/MCP stores the complete confirmation before transmission. After an
uncertain response, use `commands retry --operation <operationId>` or
`fitness_retry_command` for that same operation. Hosted MCP has no local journal;
retain and resend the exact request. Do not refresh pins, timestamps or IDs
inside an uncertain operation. A confirmed receipt describes the original
import; it never proves the current exercise is unchanged. A definitive source
conflict needs a new preview and a newly reviewed operation. Revocation, account
access and normal per-call limits remain enforced by the server.

These commands require the matching deployed service. Client installation alone
does not enable a backend route or expand the reviewed catalogue.

A reviewed `ResistanceReps` preview must retain `defaultUnit: "none"` and an
origin `loadConvention: "nonMass"`. Repetitions remain usable; kilograms and
external resistance volume are unmeasured. Preserve equipment requirements:
"none" is a tracking unit, not a no-equipment filter. Never reinterpret a band
as bodyweight or turn its manufacturer label into a measured mass. See
[tracking and reader compatibility](EXERCISE_TRACKING.md).
