# Authentication

`geniusfitness auth login` opens the GeniusFitness consent page in your browser.
Sign in using the same Firebase-backed account as the app, select accessible
programs and permissions, then approve. The browser returns a single-use code to
a loopback listener; PKCE binds it to the terminal that started the request.

The terminal stores the resulting delegated session in a private context. It
never receives your password. Your account and program permissions remain the
ceiling on all agent activity.

Use `--browser chrome` to select Chrome, or `--no-browser` to print the consent
link. For a remote shell without a loopback callback, use `--flow device` and
approve its short-lived request in your browser. Neither flow grants access
merely by opening the page.

## Health and Coach permissions

Health measurements are never preselected. Read access to programs does not
include personal health data. Coach writes need separate `coaching:write` consent,
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
