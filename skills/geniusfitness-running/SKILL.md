---
name: geniusfitness-running
description: 'Read or maintain GeniusFitness running plans, intervals and recorded runs, including route access when explicitly granted. Use for running workflows, not strength exercise prescriptions.'
---

# Work with running plans and recorded runs

Read `fitness_workflow` with `topic: running`. Identify whether the request is
about a future workout, its scheduled date, or a completed recording. A run plan
is edited on its workout; `run.create/update` records facts, not intentions.

Read only the selected workout and relevant retained runs. Preserve each stage's
kind, repetitions, duration/distance targets and any supplied effort. Do not
predict distance for a timed stage or infer a completed interval from a planned
one. Follow the exact `encodedRun` rules from command help before replacing an
encoded field; omitted fields remain unchanged.

Compare measured moving time, elapsed time, distance and observation coverage.
Keep unknown elevation, missing intervals and unavailable samples distinct from
zero. Recorded effort, surface and conditions are context; a faster pace alone
does not prove improved fitness or justify an automatic increase.

For a future change, use the person's goals and current comfort, review the
specific stage and total difference, then apply the authorized edit. Do not
change frequency, enable progression or promise XP as a side effect. Existing
recordings and active sessions retain their own facts.

Precise GPS requires separately granted `location:read`/`location:write`; normal
run or program access is insufficient. Request only the route needed. A Coach
grant does not replace the athlete's location consent. The integration's default
consent does not include these permissions. Use [recovery](../geniusfitness-recovery/SKILL.md)
for a lost reply and [progress](../geniusfitness-progress/SKILL.md) for a broader
review across sessions.
