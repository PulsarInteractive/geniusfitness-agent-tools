# Muscle insights and wearable observations

These tools require a service version that advertises them. Check capabilities
before offering an analysis. A subscription never grants permission to health
measurements or to another athlete’s program.

## Muscle progress

Ask: “Compare the last four weeks of my chest training with the four weeks before.
Which recorded exercises contributed, and what information is missing?”

Use `fitness_muscle_insights`, or:

```sh
geniusfitness muscles insights --scope project:PROGRAM_ID --from YYYY-MM-DD --until YYYY-MM-DD --json
```

Premium and Coach include detailed muscle evidence within the paid 24-calendar-
month access window, subject to account capacity. The free dashboard preview
remains available. A response contains bounded exercise pages, weekly completed
work sets, entered weights × repetitions, time coverage and exact catalogue
attribution. Continue with `after`, `epoch` and `checkpoint` from the response,
keeping the same scope, athlete and dates. Restart if the source changes.

Use `externalResistanceVolumeKg` only with its weight convention. Bodyweight,
assistance and timed exercises do not become fictitious kilograms. Direct and
assisting muscle attribution is catalogue metadata, not a measurement of force,
recovery or muscle growth. Compare like movements and mention unmapped exercises.

For a student, add `--athleteId ATHLETE_ID`. The coach needs Coach and access to
the athlete-owned program. Shared template access does not grant access to an
arbitrary athlete’s private records.

## Heart-rate observations

The athlete enables workout collection in Fitness → Health on their iPhone and
accepts Apple Health read access. This device must have actual measurements for
the recorded workout interval. Collection is off by default, does not start a
watch sensor, and does not reconstruct missing historical measurements.

Sharing has two additional choices, also off by default:

- Allow agents/connectors to read stored workout observations.
- Allow a named coach, from that coach’s person page. The shared program and
  current subscription/access must also allow the requested read.

A coach using a connector needs **both** recipient choices. The connector needs
`metrics:read` and `health:read`. Payment does not activate either choice. The
native owner can access their own observations without enabling third-party
sharing. Changes to consent take effect after server confirmation; revocation
prevents future reads but cannot recall copies already disclosed to a recipient.

Read `fitness_workflow` topic `workout-vitals`, then use
`fitness_workout_vitals`, or:

```sh
geniusfitness workouts vitals --scope project:PROGRAM_ID --sessionId SESSION_ID --json
```

The result contains real minute offsets, sample counts and observed minimum,
maximum and mean BPM. Missing minutes stay absent; `unrecorded` is not zero.
Use the session’s start and recorded set completion/timer information to compare
intervals. One minute can span effort, rest and an interruption. Long timers do
not prove continuous exercise. These are observations, not medical advice or a
measurement of recovery. Read again after consent changes; do not persist a
separate agent cache of wearable data.

This first collection path is iPhone/Apple Health. Health Connect collection is
not advertised as delivered. An already-recorded watch screen does not guarantee
that matching measurements are available in the phone’s health store.

## Useful refusals

Explain a relevant Premium-only limitation once, then continue with available
recent basic training. Do not turn ordinary analysis into a quota report or a
sales pitch. Never use health measurements for targeted marketing. A permission
refusal is not a reason to crawl another endpoint or use another identity.

A **7-day free trial** may be offered to eligible accounts when subscriptions are
open. Check [Premium in the application](https://app-geniusfitness.pulsarinteractive.io/account/premium)
for the current offer, eligibility, renewal price and cancellation terms. The
connector cannot activate a trial and does not guarantee eligibility.
