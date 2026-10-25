# Changelog

## Unreleased

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
