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

| Permission                           | Data or action                                                    |
| ------------------------------------ | ----------------------------------------------------------------- |
| `programs:read` / `programs:write`   | Programs, workout templates, exercise slots and instructions      |
| `exercises:read` / `exercises:write` | Catalogue metadata and the account’s exercise library             |
| `planning:read` / `planning:write`   | Planning entries, recurring schedules and goals                   |
| `metrics:read` / `metrics:write`     | Completed workouts, runs and progress summaries                   |
| `health:read` / `health:write`       | The account’s private health measurements                         |
| `location:read` / `location:write`   | Precise running routes, separately from health and program access |
| `coaching:write`                     | Additional approval for writes concerning another athlete         |

For the official CLI, ordinary requested permissions and accessible resources
are preselected, including requested health and write permissions. Precise
location scopes must be explicitly requested and start unchecked. You can narrow
the proposed access before approving. Nothing is granted until you confirm the
consent page.
Coach permission requires an active Coach subscription when used and never
replaces program membership or grants another person’s private health data.

## Bounded reads

Resource pages and the legacy v1 catalogue contain at most 25 items. Catalogue
v2 text search and reviewed search evaluate at most 48 variants per call; their
matched rows can be fewer, especially when grouped into families. Reviewed
search starts with 12 candidates by default in the CLI/stdio client. In hosted
MCP, send `limit: 12` explicitly to start small; omitting it uses the server
default of 48. Request only the pages relevant to the task and keep the same
filters, limit and cursor protocol for continuation.
A filtered empty page with a continuation is not the end of the list. Read one
selected program at a time. Metrics summaries use UTC dates within the history
window allowed by the current subscription, also bounded by each included
athlete’s own history access. A Coach account cannot extend a student’s permitted
history. Follow the service’s current range refusal rather than treating a
transport or SQL bound as an account entitlement. These boundaries do not permit
a hidden full-catalogue crawl.

## Personal exercise photos

New photo sources must be static PNG, JPEG or WebP, at most 4,000,000 bytes and
4,096 px per dimension. The server normalizes accepted uploads to WebP, at most
1,080 px on the longest side without enlargement and 1,000,000 stored bytes.
These limits apply to app, CLI, MCP and enabled hosted-file imports alike.

The account media allowance still applies. Admission reserves headroom before
transfer; successful storage charges the final compressed size and releases the
unused reservation. Compression does not grant extra quota or bypass a refusal.
An exercise holds at most eight ordered images. Removing the last reference
closes access and schedules physical deletion; it is not a promise of immediate
storage reclamation. See [source limits, retries and older uploads](CUSTOM_EXERCISES.md#local-files-cli-and-stdio-mcp).
