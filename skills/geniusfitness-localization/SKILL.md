---
name: geniusfitness-localization
description: 'Present GeniusFitness records in the user’s language and preferred units, or handle an explicit request to translate exercise guidance. Preserve identifiers and use only localization fields supported by the active service.'
---

# Preserve meaning across languages and units

Read the `localization` workflow and current `exercise.create/update` command
help. Respond in the person's language while preserving existing source text
unless editing or translation was requested. IDs, enums, measurements, unit codes
and evidence references keep their identity.

The source has `contentLocale`, such as `en` or `fr-FR`; null means unknown.
Newly authored content from an agent defaults to English unless the person chose
another source language. Preserve the declared language of existing text. Do not
label unknown history as English or infer a profile setting from a chat message.

Save source edits first, then read the exercise's current revision and server
`contentSourceFingerprint`. A translation uses ordinary `exercise.update` with
`localizations`: the complete list of at most 16 unique locale entries. Each is
`{locale, sourceFingerprint, text}`, with the current fingerprint from that read
and partial text containing only `name`, `description` and `movementIntent`.
Keep other language entries; the list is replaced as a whole. Omission preserves
it, null/[] removes all translations, and removing one entry clears that language.
A partial translation falls back for absent fields.

Write intention as a short natural cue for the exact variant. Preserve grip,
stance, equipment and limits in the full description. Names allow 2–100
characters, descriptions up to 4000, intention up to 280. An uncertain muscle
claim cannot become measured evidence through translation.

A source change retains old translations as stale. New or changed translations
using an old fingerprint fail with `exercise_translation_source_changed`.
Reread and review the changed source before a new operation. Never calculate a
fingerprint, update an uncertain request's hash or present stale text as current.
Reads do not invoke translation. Use existing current translations for
presentation without editing the source. When provided, `textResolution` names
the locale actually served for each field and the stale locales. Do not label an
English or source fallback as French. For raw personal records, a saved entry
is current only when its `sourceFingerprint` matches the server
`contentSourceFingerprint`; unknown freshness or a missing field falls back to
available source text. A translated name does not establish exercise identity.

For display, accurately convert known kg/lb values and show at most two decimals.
Preserve recorded values and units for the active contract. Never relabel unknown
history, convert twice or write display rounding back as a training change.
