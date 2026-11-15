---
name: geniusfitness-exercises
description: 'Create or edit a personal GeniusFitness exercise with a separate description, movement intention and declared muscle contributions. Use catalogue for existing reviewed variants and media for photos.'
---

# Maintain a personal exercise

Read the `custom-exercises` workflow, then command help for `exercise.create` or
`exercise.update`. Search and reuse a suitable catalogue variant first. Use a
personal definition for a movement genuinely absent from the catalogue or a
requested personal adaptation, not to create a duplicate for each workout.

Keep the fields distinct: `name` identifies the movement; `description` explains
how to perform it; `movementIntent` is the short image or action cue the person
should hold in mind. The cue must fit this exact variant. Grip, support, incline
or stance can change both the cue and the documented muscular emphasis.
Read the returned limits and permitted tracking/equipment values rather than
inventing schema fields.

Use canonical muscle target IDs. Personal contributions, including suggestions
from an agent, retain `qualification: declared_estimate`. Qualitative roles are
valid without numbers. Omit unknown shares instead of forcing a total to 100;
do not combine a parent target with its child or claim an estimate is measured
activation, recovery or growth. Catalogue provenance remains read-only.

Update only requested fields: omission preserves a value, explicit null clears
a nullable field. The exercise belongs to the connected account's personal
scope. Access to a student's shared program does not grant editing of their
private library. Review references before deleting an exercise; deletion is not
permission to rewrite historical training.

Apply the immutable authorized command with current epoch/revision, then read
back the definition. Use [media](../geniusfitness-media/SKILL.md) for optional
photos; a photo failure does not undo a successfully created text exercise.

For saved translations, use [localization](../geniusfitness-localization/SKILL.md)
after saving and reading the source. The service supplies the fingerprint;
translation entries retain their language and source version without changing
exercise identity, tracking units or muscle declarations.
