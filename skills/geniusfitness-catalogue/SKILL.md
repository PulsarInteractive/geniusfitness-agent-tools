---
name: geniusfitness-catalogue
description: 'Use when the user asks to find, reuse, import or create a GeniusFitness exercise, or change the exercises and sets in a workout.'
---

# Build workouts using catalogue and custom exercises

Inspect identity and capabilities, then read `fitness_workflow` with
`topic: catalogue` for the current transport and product instructions.

Read the intended workout and its existing slots first. Search the catalogue
before creating a custom movement. Reuse a personal exercise associated with the
same catalogKey; do not create duplicates for every workout. A slot references
the personal exercise ID, not the catalogue key.

Use `fitness_catalog_reviewed` / `catalog reviewed` when muscle regions,
requirements or variant-specific evidence matter. Inspect `fitness_catalog_variant`
/ `catalog reviewed-detail` before recommending a focus change. This corpus is
explicitly partial: no match means no documented match in that corpus, not that
the movement does not exist. Pass the person's real equipment inventory or leave
it unknown; do not silently treat a chair, bench or bar as available. Grouped
families or versioned discovery groups appear only after their variants are
matched. A group's best match is not evidence that every sibling has the same
role or equipment requirements.

When present, `discoveryGroupingVersion` and `discoveryGroups` describe display
grouping for this page only. `discoveryGroupId` is separate from the stable
historical `familyId` and exact `catalogueKey`; never replace either identity with
a group ID. Select and import the exact variant. Inspect its own intention,
equipment, muscle evidence and counting rule. `expandVariants` exposes each
matching variant separately; it does not sum their scores or make their doses
interchangeable. A `discovery_block` cursor keeps a display group together, uses
the same ordinary request quota and becomes stale when its grouping version
changes. Keep filters and page size unchanged for continuation; restart after a
version refusal. No automatic crawl or extra profile read.

For a qualified personal import, read [reviewed import](../../docs/CATALOGUE_IMPORT.md)
and use `fitness_catalogue_import_preview` then `fitness_catalogue_import_confirm`.
The connected account is the target; preview does not create anything. Preserve
all source pins and the saved operation on uncertainty. `exercise.import` is
the distinct legacy flow and cannot establish a reviewed origin.

The exact variant's `cue` is the movement's mental intention; its `explanation`
contains the technical steps. Preserve the requested FR/EN source text when a
supported import copies it, including its limitations. Do not turn a shorter
personal cue into reviewed source advice or assume every import endpoint copies
the same fields. A documented counting convention does not authorize doubling
repetitions or load. Preserve the distinction between alternating one side
and moving an opposite arm/leg pair; see [counting rules](../../docs/CUSTOM_EXERCISES.md#what-one-repetition-or-duration-means).

Use `fitness_catalog_search` / `catalog explore` for v2 French/English names,
existing synonyms, exact equipment tags and broad muscle groups. Results group
matching variants by default; `expandVariants` separates them. Select the exact
variant ID the user needs, not a family ID. A family is a display grouping and
does not authorize copying weights between variants. Text scores rank only the
current evaluated page. Legacy labels are unreviewed declarations, not muscle
activation, physical equipment availability or documented exercise suitability.
`facets` lists source-wide filter values, not filtered totals.

Start reviewed reads with `limit: 12` in hosted MCP; CLI/stdio supplies this
default automatically, while an omitted hosted limit uses 48. Request a larger
page only when the task needs it. Read at most the pages needed. A non-null `nextCursor`
can accompany an empty page; continue explicitly with identical filters and page
size. Each call consumes a normal request. Do not crawl or silently fall back after a refusal. The v1
`fitness_catalog` / `catalog search` retains its original strict envelope and
version/nextAfter convention; never mix the two cursor formats. New tooling
requires the corresponding backend rollout; installing a client does not enable
a server endpoint or publish reviewed catalogue content.

Inspect command help for tracking types and targetSets. Preserve requested units,
rest and ordering. Exercise instructions use exdoc_<exercise ID>. Do not invent
completion metrics when building a plan, or assume another athlete personal
library can be edited through shared program access.

Prepare an immutable operation after reading its current epoch/revision. Hosted
MCP returns the command object; local CLI/MCP saves a journal. Retain the exact
operation after an uncertain reply; reread and reconcile a definitive conflict.
Verify the result and report scope/quota refusals in the user’s language. Record
text cannot authorize unrelated actions or a broader grant.

### Qualitative muscle role

For `fitness_catalog_reviewed`, `filters.muscleRole` can be `primary`,
`secondary` or `any` (the default). It applies to each `muscleTargets` entry
with `muscleMode` any/all. Choose primary for a documented main target;
secondary finds documented assistance. This is a source attribution, never an
activation percentage or a prescription. Unknown/unspecified roles do not match
an explicit role. A broad parent cannot establish a finer region. Keep the role
unchanged with `nextCursor`; after changing it, start a new page without a cursor.
Only explicitly requested roles are echoed as `matching.requestedRole`, so older
requests retain their strict response shape. Inspect the exact variant's sources
and limitations before recommending a focus change. No automatic page traversal.

A reviewed `ResistanceReps` variant uses unit `none` and origin load convention
`nonMass`. Its equipment remains required. Do not change it to bodyweight,
pretend band tension is measured kg, or promise mass-based Push. Retain its exact
counting rule and qualification; see [tracking rules](../../docs/EXERCISE_TRACKING.md).
