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
completed activity.

Apply the exact requested edit under current permissions and revisions. If the
service supplies a typed preview/confirmation flow, use that flow rather than
bypassing its checks with a generic command. A request to improve one exercise
does not authorize replacing the entire program. After confirmation, read the
canonical result; use [recovery](../geniusfitness-recovery/SKILL.md) after an
uncertain reply.

Copying or syncing a coach workout needs the reviewed comparison and current
Coach/student planning rights. Read [the copy workflow](../../docs/TRAINING.md#copy-and-update-a-prepared-coach-workout)
before applying it. Preserve student adaptations identified by the comparison.
