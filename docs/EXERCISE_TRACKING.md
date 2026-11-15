# Repetitions with unmeasured resistance

`ResistanceReps` records repetitions against external resistance whose mass is
not measured, for example a resistance band. Use `defaultUnit: "none"`.
Reviewed import origins use `loadConvention: "nonMass"`; retain the exact
preview and its source qualification. A resistance band is equipment, even
though its tracking unit is `none`. This type is neither bodyweight tracking
nor evidence that an exercise needs no equipment.

Keep the observed repetitions, explicit counting convention, completed-set
count and available timing. Do not invent kilograms from a band color,
manufacturer label or nominal tension. Do not convert such a label to pounds,
add `massFormat` or `sourceMass`, calculate tonnage/e1RM, or propose mass-based
Push. Returned `externalResistanceVolumeKg` is `null`, not zero; missing mass
measurement is not a measured zero load. Equipment and movement compatibility
still come from the exact exercise definition.

For an explicitly requested personal exercise, read command help and use the
ordinary `exercise.create` or `exercise.update` protocol. Repetition counting
conventions apply; `per_side_duration` does not. A partial edit is validated
against the resulting saved definition by the server. Do not change an existing
exercise's tracking type merely to make a refused request pass. A different
movement or tracking mode does not establish dose equivalence.

## Reader compatibility and recovery

The local CLI and stdio MCP send `X-Fitness-Exercise-Codec: 2` on their API
requests. It declares decoding support; it grants no permission, subscription,
feature activation or canonical mass-write capability. The hosted MCP service
must support the representation separately. Installing this package does not
update a remote service or enable a new catalogue entry.

On `fitness_reader_update_required`, stop that operation and keep the saved
request. Run `geniusfitness update check`, then `geniusfitness update install`
when a compatible published release is available. Restart the MCP server, or
update its pinned package version. Do not retry automatically, downgrade the
exercise type, omit unsupported records or clear the journal. A software update
preserves connection and operation files. After updating, use the original
immutable operation and the [recovery workflow](../skills/geniusfitness-recovery/SKILL.md)
when appropriate; a new UUID is not recovery. If no compatible release is
available, report the temporary compatibility limit without fabricating success.

Existing tracking types and historical values keep their original meanings.
Reader support alone never rewrites a prescription or recorded workout.
