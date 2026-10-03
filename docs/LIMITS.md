# Permissions and limits

The connection grant, selected profile, current subscription and ordinary
program permissions all apply. Narrowing a grant takes effect on subsequent
requests; retaining a cached record does not preserve revoked rights.

## API limits

These are the initial configurable limits. Read `whoami` or `capabilities` for
the active server values. Every terminal and profile on one account shares them.

| Limit                     |  Free |           Premium |             Coach |
| ------------------------- | ----: | ----------------: | ----------------: |
| Requests per minute       |    30 |                60 |               180 |
| Write requests per minute |     5 |                10 |                30 |
| Monthly request credits   | 5,000 | No monthly cutoff | No monthly cutoff |
| Monthly write requests    |   500 | No monthly cutoff | No monthly cutoff |

A read uses one Free credit; a write uses five and also counts toward the write
limit. Paid accounts remain bounded by their minute limits. Respect `Retry-After`
and retain the same operation when a write’s outcome is uncertain. Do not open
extra contexts to work around a limit.

Free monthly counters reset at the start of the next calendar month in UTC.
Both monthly credits and monthly write capacity must be available. Minute limits
are approximate traffic protection per service location, not exact global billing
meters. Program, storage and attachment capacity are separate limits.

## MCP and the built-in coach are separate

MCP uses your chosen external AI tool. Its model subscription and token charges
remain with that tool; request credits are not model tokens. The built-in Fitness
coach has a separate account allowance. Exhausting either allowance does not
remove saved training data or block ordinary app use under its own API limits.

Each server request counts, including discovery, polling and a retry that reaches
admission. A write can consume allowance before a later domain rule refuses it.
Keep the same operation ID when retrying: this protects against duplicate changes,
but does not make repeated network requests free.

## Data capacity

| Personal data                     |   Free | Premium |   Coach |
| --------------------------------- | -----: | ------: | ------: |
| Custom or imported exercises      |    200 |   5,000 |  20,000 |
| Health measurements               |  2,000 |  20,000 | 100,000 |
| Combined live personal-data bytes | 10 MiB |  50 MiB | 100 MiB |

These limits apply to both app and agent writes. They are separate from shared
program and media allowances. After a downgrade, existing data remains readable;
you can delete data or reduce its size. Growth beyond the current capacity is
refused. Business-plan values can change before launch.

## Permission groups

| Permission                           | Data or action                                               |
| ------------------------------------ | ------------------------------------------------------------ |
| `programs:read` / `programs:write`   | Programs, workout templates, exercise slots and instructions |
| `exercises:read` / `exercises:write` | Catalogue metadata and the account’s exercise library        |
| `planning:read` / `planning:write`   | Planning entries, recurring schedules and goals              |
| `metrics:read` / `metrics:write`     | Completed workouts, runs and progress summaries              |
| `health:read` / `health:write`       | The account’s private health measurements                    |
| `coaching:write`                     | Additional approval for writes concerning another athlete    |

Health permissions and all writes require deliberate selection on the consent
page. Coach permission requires an active Coach subscription when used and never
replaces program membership or grants another person’s private health data.

## Bounded reads

Resource and catalogue pages contain at most 25 items. Read one selected program
at a time. Metrics summaries cover at most 366 inclusive UTC days. A filtered
empty page with a continuation is not the end of the list.
