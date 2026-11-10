## Unreleased

- Add whole-session skip/restore preview and confirmation to CLI/local MCP.
  Preserve complete canonical targets and opaque revisions in the existing
  immutable journal using a distinct protocol; generic commands stay unchanged.
  Unknown outcomes replay the same confirmation, and old receipts remain
  explicitly historical. Requires the supporting server and its activation;
  no npm publication or deployment is implied.

- Add explicit partial reviewed catalogue page and exact-variant reads in CLI/MCP, with generated public schemas, bounded matching and normal per-call authorization. Preserve legacy catalogue contracts.

- Add `catalog explore` / `fitness_catalog_search` with a distinct v2 endpoint, French/English text and synonyms, per-variant text relevance before grouping, complete bounded family pages and explicit legacy evidence coverage. Every continuation remains a separate normal request; v1 stays strict and unchanged. Requires the matching backend; no npm publication, reviewed-content publication or production activation is implied.

- Add explicit representation 2 for temporary focus reads and commands, preserving the complete selected interests and nullable priority. Legacy v1 stays strict; mismatched versions never trigger silent downgrade. Includes command-help policy, immutable retry and safe unavailable-feature guidance. Requires the matching backend and supported app readers; no producer activation or npm release is implied.

- Validate optional precise muscle evidence and explain current catalogue attribution, unknown labels and parent/region overlap. Legacy responses remain supported; matching backend rollout is required.

- Keep unknown session identities and incomplete daily measurements explicit.
  Preserve raw observations and explicit zero, mark duplicate corrections, and
  withhold ambiguous totals/XP. Pagination supports legacy unindexed rows.
  Matching backend rollout supplies identity/coverage; older responses retain
  observations and activity counts without certifying totals.
  Wire change: aggregate counts/measurements can now be null. Update clients
  requiring numeric totals before rolling out the matching backend; this is
  unreleased and does not imply an npm publication or a service deployment.

- Explain exact recorded exercise references in generated CLI/MCP command help
  and training guidance. Identity metadata remains service-owned; unresolved
  references preserve results without inventing measured totals. Requires the
  matching backend rollout.

- Add targeted `commands describe --kind KIND` help and exact encoded running-plan/result schemas to CLI and MCP. Validate supplied stage targets and observations before preparation while preserving partial edits and immutable retries. Server validation remains authoritative.

- Publish command permission, subscription and revision requirements consistently in CLI and MCP help. Explain current capabilities separately from per-athlete authorization; older servers never imply Coach access. Requires the matching server capability fields for dynamic filtering.

- Request a bounded, field-level workout sync comparison. Explain retained student adaptations and conservative legacy-copy handling; refuse unavailable or inconsistent reviews. Requires comparison version 1 on the service before client rollout.

## Unreleased goal provenance

- Preserve the optional opaque profile-version reference in adjustment history; keep private answers and current-goal claims separate.

- Add `sessions push-adjustments` / `fitness_push_adjustments` for explicit,
  bounded reads of retained adjustments linked to a current recorded outcome.
  Saved decisions are not proof of current prescription application.

- Add optional settled bonus XP details to Push results with
  `includeRewardDetails: true`. Preserve legacy response compatibility and
  unknown historical amounts; this does not award or recalculate XP.
- Add bounded, read-only Push result consultation through `sessions push-results`
  and `fitness_push_results`, with strict response binding, explicit missing values
  and corrected-outcome guidance. Requires a server with the Push result endpoint.

# Changelog

## Unreleased

- Muscle analysis now validates load coverage and nullable totals. Explicit kg/lb
  aggregates report kg equivalents while raw session values remain unchanged.
  Legacy server responses retain counts and timing but no unverified kg claims.
  · recorded load units

- Session analysis preserves raw load and explicit kg/lb units; legacy values
  remain unknown instead of being labelled kilograms. Missing result values are
  no longer filled with zero.
- CLI/MCP handle older server responses conservatively and retain source identity.
- Progress guidance documents mixed/unknown units and historical limitations.

## Unreleased

- Preserve optional run elevation coverage alongside measured gain. Missing altitude remains distinct from zero; imports and summaries retain partial or unknown coverage. Requires the matching application/backend rollout.

- Copy a coach-owned prepared workout into an independent student prescription, then preview and explicitly confirm later synchronization using source and destination fingerprints. Includes CLI, local MCP, hosted MCP tool catalogue and permission-aware coaching guidance. Requires the matching backend and application rollout.

- Keep recorded personal-record flags in session analysis and accept optional canonical session XP from the service; session points are distinct from capped account rewards. Optional exercise observation arrays remain compatible with older servers.

- Preserve exercise heart-rate averages with exact observed intervals and native provenance, independently of calorie collection. Validate bounds and non-overlap; missing values remain absent. Requires the corresponding application and backend rollout.

- Preserve optional measured exercise/set activity intervals in workout calories, including effort/rest, durations and native provenance. Reject overlapping or inconsistent measurements. Requires the corresponding application and backend rollout.

- Accept up to 24 calendar months of basic metric history and preserve more than a year of daily evidence. The server checks current requester and athlete subscriptions; mixed program totals cannot extend a Free student history. Requires the corresponding backend rollout.

- Reject malformed encoded exercise/set lists before recording or sending a command, using the same generated validation rules as the service.
- Expose encoded-set rules in command help and clarify sparse updates: renaming a workout or moving a schedule preserves every field the caller omits.
- Add direct subscription guidance with reference prices, the eligible seven-day trial and student-specific coaching entitlements.
- Scope basic coaching metrics to the requested student, with repeated Wednesday planning and two-week review examples.
- Preserve default personal muscle queries when the service resolves the authenticated athlete.
- Validate optional workout active-calorie observations with their exact recorded interval, retain compatibility with older heart-rate-only responses, and explain explicit calorie consent. Backend and application rollout is required before these observations are available.

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
