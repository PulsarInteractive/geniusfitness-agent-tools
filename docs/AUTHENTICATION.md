# Authentication

`geniusfitness auth login` opens the GeniusFitness consent page in your browser.
Sign in using the same Firebase-backed account as the app, select accessible
programs and permissions, then approve. The browser returns a single-use code to
a loopback listener; PKCE binds it to the terminal that started the request.

For the official CLI, all current and future resources and every requested
permission are preselected. You can uncheck “All” to choose individual programs
or personal data, and remove permissions before approving. Opening the page
grants nothing. Existing connections keep the permissions you already approved.
Use `--scope 'programs:read exercises:read planning:read metrics:read'` to offer
only those read permissions, for example.

The terminal stores the resulting delegated session in a private context. It
never receives your password. Your account and program permissions remain the
ceiling on all agent activity.

Use `--browser chrome` to select Chrome, or `--no-browser` to print the consent
link. For a remote shell without a loopback callback, use `--flow device` and
approve its short-lived request in your browser. Neither flow grants access
merely by opening the page.

## Health and Coach permissions

The official CLI requests health permissions by default, and the consent page
preselects them when requested. Remove `health:read` and `health:write` if you do
not want to share your measurements. Read access to programs alone does not
include personal health data. Coach writes need `coaching:write` consent,
a current Coach subscription and the normal permissions on the shared program.
A downgrade or revoked membership is checked on later operations, including a
prepared write that has not committed yet.

## Renewal and revocation

Refresh tokens rotate. An uncertain refresh response requires reconnecting;
replaying an old refresh token can revoke its session family. Logging out
revokes the presented terminal session before erasing the local credential.
Revoking a connection invalidates its profiles and sessions.

Use a different `--context` for another account. Never copy credential files into
a repository or share them with a collaborator. An agent’s command journal may
contain personal training details; treat it as private local data as well.

## Errors

Expired or already-consumed consent links require a new `auth login`. Broader
permissions require a new human decision; a tool cannot grant them to itself.
After a network error, inspect the operation before trying a write with a new ID.
