---
name: geniusfitness-training
description: 'Prepare or adjust the contents of a GeniusFitness workout: exercise slots, sets, rest, ordering, and an authorized coach workout copy. Use planning for dates and recurrence, and progress for recorded results.'
---

# Prepare the workout the person intends to do

Read the `training` workflow for the chosen CLI or MCP transport. Select the
existing program and workout before changing its contents. Planning dates belong
to the planning workflow; recorded sessions are evidence, not workout templates.

Use the catalogue workflow to select exact variants compatible with the declared
location and equipment. A home workout is not automatically equipment-free.
When no equipment is available, reject candidates needing a bench, pull-up bar,
band or machine unless the person confirms that item is available. Keep unknown
requirements unknown. Reuse the person's existing exercise when appropriate.

Read command help before encoding prescriptions. Exercise slots refer to personal
exercise IDs; an imported catalogue key or family ID is not a slot reference.
`targetSets` replaces the entire encoded field. Preserve untouched sets, explicit
units, rest and order. A movement change can make earlier weights incomparable;
show the before/after and obtain the person's decision about the new prescription.
Do not silently carry weights into a different exercise or convert a plan into
completed activity. Preserve the exercise’s explicit counting rule when preparing
sets; read [counting meanings](../../docs/CUSTOM_EXERCISES.md#what-one-repetition-or-duration-means)
before comparing an alternating, per-side or bilateral prescription.

For saved weights, `massFormat: "kg-v1"` takes precedence over a definition's
legacy `defaultUnit`. An absent marker needs an explicit legacy unit; an unknown
marker or source stays unknown. Read [prescription units](../../docs/TRAINING.md#read-the-unit-of-a-saved-prescription)
before interpreting or changing weights. For a new kilogram prescription,
require both the live command field `massFormat` and capability
`newPrescriptionMassProtocol: "canonical-kg-v1"`. Convert known lb values once
before preparing the whole `targetSets` field with `massFormat: "kg-v1"`.
Existing marked slots require the format echo for dose edits, including during
rollback when new kg prescriptions are disabled. Never infer activation from
the newer command schema or change a saved operation's values or marker on retry.

Apply the exact requested edit under current permissions and revisions. If the
service supplies a typed preview/confirmation flow, use that flow rather than
bypassing its checks with a generic command. A request to improve one exercise
does not authorize replacing the entire program. After confirmation, read the
canonical result; use [recovery](../geniusfitness-recovery/SKILL.md) after an
uncertain reply.

Copying or syncing a coach workout needs the reviewed comparison and current
Coach/student planning rights. Read [the copy workflow](../../docs/TRAINING.md#copy-and-update-a-prepared-coach-workout)
before applying it. Preserve student adaptations identified by the comparison.

For a movement or variant replacement in your own inactive Sets workout, follow
[the exact replacement protocol](../../docs/TRAINING.md#replace-one-exercise-with-an-explicit-prescription-reset).
Use its dedicated preview and confirmation, with two existing personal exercise
IDs. Disclose that every target set is cleared and needs configuration; obtain
explicit authorization for that reset. Never carry an old dose, bypass a blocked
preview through generic CRUD, or prescribe new sets automatically. The existing
immutable journal keys recovery by `request.requestId`.

For `ResistanceReps`, keep repetitions, counting and available timing without
inventing a mass prescription. Unit `none` does not remove the equipment
requirement. No kg/lb conversion, mass marker, tonnage, e1RM or mass-based Push
can be inferred from a resistance band label. See
[tracking rules](../../docs/EXERCISE_TRACKING.md).
