# Changelog

## 0.1.0-beta.15 — 2026-11-16

Published under the beta tag. Requires matching feedback server support.

- Simplify feedback to request status and a final decision: resolved, retained
  for later or declined, with an optional custom final message. No user replies
  or independent support messages. Closure may send a push when permitted.
- Remove the reply command and MCP tool. Preserve old reply journals for
  inspection while refusing retries locally without network transmission.
- Keep Free bug submission and receipt recovery, Premium/Coach suggestions and
  decision reads, approved screenshots, and exact submission retries.
- Document read/write grants and the legacy zero-or-one final message projection;
  suppress stale conversation capabilities during rolling server upgrades.

## 0.1.0-beta.14 — 2026-11-16

Published under the beta tag. Requires matching feedback server support
and an explicitly consented feedback grant on the connected account.

- Prepare and submit approved private bug reports from CLI, local MCP and the
  hosted connector. Free accounts receive delivery receipts; Premium and Coach
  also support feature requests, history, status and public team replies.
- Reuse the existing durable operation journal for exact retries and account,
  session and connection identity checks. Keep preparation, received reports,
  image reservations and completed image transfers distinct.
- Attach up to three authorized screenshots through bounded local transfer or
  the supported ChatGPT file import. Every channel validates source images up
  to 4 MB and compresses them server-side to WebP, at most 1080 px and 1 MB.
- Add a dedicated feedback skill, hosted workflow and complete CLI guide.
  Agents may offer a useful report once, send only after user approval or an
  explicit reporting request, and never automatically include full chat,
  health, location or diagnostic logs.
- Discover feedback configuration without expanding access. Effective rights
  remain false without consent; receipt recovery requires `feedback:write`.
  Preserve optional nullable context values and the `received` status.

This candidate does not publish the package, activate a service or expand an
existing connection. Hosted integration acceptance remains a separate gate.

## 0.1.0-beta.13 — 2026-11-15

This version is unpublished. The current reader-compatibility iteration follows
an earlier replacement-only archive; its acceptance does not certify these
additional changes. A fresh archive and dated release receipt are required.

- Read versioned catalogue discovery groups while preserving historical family
  identities and exact variant scores. Reject inconsistent group membership or
  mixed grouping versions; keep explicit, bounded pagination.
- Preserve reviewed muscle evidence, source/subset versions and documented
  multiple primary or unspecified roles. Do not invent a single main muscle,
  workload allocation or measured activation from current catalogue labels.
- Preserve `ResistanceReps` with unmeasured resistance, unit `none`, explicit
  equipment and null mass volume. Reject fictitious mass in reviewed imports
  and load analytics; retain repetitions and timing.
- Announce exercise reader codec 2 on CLI/stdio MCP API requests. An incompatible
  reader receives actionable update guidance without automatic retries or
  rewriting its saved operation.

- Preview and explicitly confirm an exact personal exercise replacement through
  the CLI and MCP. Inspect the before/after review and retain its immutable UUID.
- Clear the old set prescription instead of transferring its load or repetitions
  to a different movement. Reconfigure the new exercise separately.
- Recover uncertain confirmations from the durable command journal; verify the
  account, profile, slot, exercise and receipt before reporting success.
- Explain owned-program and personal-library permissions, localized reviews,
  catalogue import before replacement, and safe recovery in the training guides.

Requires the matching server replacement endpoints. No automated exercise
selection, student-program editing or feature activation is added.

## 0.1.0-beta.12 — 2026-11-15

- Read canonical Push loads and adjustment history with their exact kilogram
  values. Keep legacy integer-thousandth values distinct, preserve zero and
  reject malformed or mixed representations instead of rounding them.
- Request Push read representation version 2 explicitly through the CLI and MCP.
  The supporting server returns an upgrade-required error to an older client
  when a result needs version 2. Reads add no automatic request or retry and
  leave saved commands unchanged.
- Explain canonical and legacy Push units in progress guidance. Client support
  does not activate canonical prescriptions or change a recorded load.

This release requires the matching server read contract. Feature activation and
subscription access remain server-controlled.

## 0.1.0-beta.11 — 2026-11-15

The published beta.11 archive includes the following changes, including the
prescription and guidance updates previously listed as unreleased.

- Support the explicit `alternating_side_repetitions` convention in exercise
  edits and reviewed imports. Each completed movement of one side counts once,
  then the other side follows. Opposite arm/leg pairs remain a separate rule.
- Preserve source counting through CLI and MCP without changing recorded
  quantities, inferring a performed side or filling unknown historical values.
  Updated workflow guidance explains all five conventions.

- Expose the saved prescription `massFormat` in workout-exercise reads and explain
  how canonical kg values differ from legacy definition units.
- Support explicit `massFormat` in workout-exercise commands. Discover new kg
  prescription activation through live capabilities, separately from supported
  command fields. Freeze converted values before journaling; retries preserve
  the original request, including during rollback.

- Clarify current exercise translations, per-field language fallback and unchanged
  source text in agent guidance. Reading never generates a translation.
- Distinguish legacy and reviewed catalogue pagination, precise-location consent,
  and conditional ChatGPT file imports. Document shared media capacity and both
  source-image limits and server compression.

The prescription fields require matching server admission and live activation
capabilities. Reading translations does not generate text, and the client does
not enable hosted file import.

## 0.1.0-beta.10 — 2026-11-15

- Add explicit reviewed catalogue import preview and confirmation to CLI and
  MCP, with generated DTOs and the existing immutable operation journal.
  Source pins, requested FR/EN cue and instructions, counting and import
  provenance stay distinct from personal edits, doses and workout slots.
- Preserve explicit exercise counting conventions across personal exercise
  reads and edits. Existing records keep an unknown convention; the client
  never doubles repetitions, splits time or invents the performed side.
- Keep reviewed catalogue pagination compatible with both the existing
  corpus and its extension. Each requested page remains a separate read.

This candidate requires matching server validation and hosted acceptance before
publication. Beta.9 was committed but was not published to npm.

## 0.1.0-beta.9 — 2026-11-15

This package adds the client support below. Server rollout, subscription access
and feature activation remain separate. A disabled server feature stays
unavailable; the client does not bypass it.

- Add explicit CLI update checks and verified global npm updates. Optional daily
  notices run only in interactive human-readable sessions. JSON and MCP remain
  silent, with no automatic registry request. Updates preserve credentials and
  saved operations.
- Expand the eleven focused skills and workflow guides for training, running,
  catalogue selection, coaching, progress, personal exercises, media, language,
  units and recovery.
- Support personal exercise descriptions, movement intention cues and declared
  muscle contributions. Source locales and explicit translations preserve the
  original text and identify translations by the server's source fingerprint. Changed source text
  makes older translations stale; edits require current optimistic revisions.
- Add private exercise photos, durable upload reservations and image sequences.
  Sources are limited to 4 MB. The supporting server normalizes images to WebP,
  at most 1080 px on the longest side and 1 MB stored, without enlarging them.
  Hosted attachment imports require an exact HTTPS host allowlist; the tool
  remains hidden when it is unconfigured.
- Add bounded reviewed-catalogue pages and exact variant reads with source
  evidence, equipment, muscle roles and explicit unknowns. Each page examines at
  most 48 variants. Continuation is explicit and uses normal authorization and
  quotas. Reviewed coverage stays separate from the legacy catalogue.
- Start reviewed-catalogue reads with 12 variants. An explicit larger page can
  use up to 2 MiB of response data; errors and other JSON routes keep their
  256 KiB limit. No additional page is fetched automatically.
- Add catalogue v2 text search in French and English, synonyms, variant relevance,
  grouped families and explicit variant expansion. Preserve strict v1 behavior.
- Add exact planned-session skip/restore and next-recurring-session previews and
  confirmations. Preserve immutable retry requests and materialized-session
  handoff. Receipts describe past results, not current planning state.
- Add explicit V2/V3 temporary-focus reads and supported commands, including
  selected interests and qualitative regional preferences. Preserve V1/V2
  receipts without silent downgrade. Regional apply remains unsupported.
- Add selected personal progress for 7 or 28 local dates, or the latest retained
  session, with bounded factual reads and the server's Premium/Coach checks.
- Extend Push result and adjustment-history reads with optional settled XP and
  opaque profile provenance. Reading a result does not award XP or prove that a
  suggested prescription was applied.
- Preserve raw load units, unknown measurements and nullable aggregates. Explicit
  kg/lb aggregates can report kg equivalents; old responses keep their counts
  and timing without inventing kilogram values. Validate muscle evidence,
  parent/region overlap and measured running elevation coverage.
- Preserve measured exercise/set heart-rate and energy intervals, timing,
  consent boundaries and partial coverage. Keep unknown session identities and
  duplicate corrections explicit. Basic metric history supports the server's
  bounded 24-month range and current athlete entitlements.
- Add typed running plans/results, encoded-set validation and targeted command
  help. Sparse edits retain omitted fields and uncertain writes retain their
  original operations.
- Add field-level workout-copy comparisons, preserving student adaptations and
  conservative legacy-copy behavior. Publish command permission, revision and
  subscription requirements consistently across CLI and MCP.

## 0.1.0-beta.8 — 2026-10-26

- Update the transitive URI parser to its patched 3.1.9 release.

- Preserve sessions and immutable command journals on temporary edge refusals. Respect numeric and HTTP-date Retry-After deadlines across CLI restarts, with positive jitter and no automatic replay. Recognized API permission refusals keep their existing behavior.

## 0.1.0-beta.7 — 2026-10-24

- Explain the eligible seven-day trial when a requested Premium detail is unavailable.
- Link to the application offering without promising availability or starting a purchase.

## 0.1.0-beta.6 — 2026-10-24

- Add Premium muscle insights with paginated exercise evidence and explicit measurement limits.
- Add consented workout heart-rate summaries for Premium/Coach and authorized athlete access.
- Expand progress and coaching workflows, preserving privacy refusals and unknown measurements.
- Reconcile duplicate set corrections and undone sets consistently in session analysis.
- Clarify the official login’s requested-permission defaults.

## 0.1.0-beta.5 — 2026-10-24

- Add session analysis with measured time per set and exercise, real rest and missing-data coverage.
- Page large session details with revision-checked continuation.
- Improve progress-review guidance and distinguish timer intervals from physical effort.
- Keep operational quota tables out of routine MCP introductions while preserving server controls.

## 0.1.0-beta.4 — 2026-10-23

- Add on-demand workflow guides to hosted and local MCP and `workflow show` to the CLI.
- Correct hosted archive filters to the API values `active`, `archived` and `all`.
- Explain remote immutable-command recovery separately from the local operation journal.
- Expand connection, permissions, product workflows and live application update documentation.

## 0.1.0-beta.3

- Explain shared account quotas across CLI, local MCP and ChatGPT.
- Guide assistants to use the user’s language and preserve existing record text.
- Clarify ambiguous planning dates and consent-language behavior.

## 0.1.0-beta.2

- Add the remote ChatGPT tool catalogue and OAuth connection guide.
- Document the separate official directory submission process.
- Upgrade the MCP server SDK to 2.3.1 with published security fixes.

## Initial beta

- Browser PKCE and device login using the GeniusFitness account and explicit consent.
- Bounded programs, exercise catalogue, planning, results and private health reads.
- Journaled program, workout, exercise, schedule, goal and activity commands.
- Current Coach subscription and athlete-access boundaries.
- Conditional read cache, incremental changes, narrowed profiles and workflow skills.
