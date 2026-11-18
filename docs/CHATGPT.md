# Connect GeniusFitness to ChatGPT

Use the hosted MCP connector to work with GeniusFitness from ChatGPT. Your computer does not need to run the CLI. Access still requires an admitted GeniusFitness account.

## Connect your account

1. In ChatGPT on the web, open **Plugins → Add → Add custom MCP server**.
2. Name it **GeniusFitness** and enter this server URL:

   ```text
   https://api-geniusfitness.pulsarinteractive.cloud/api/agents/mcp
   ```

3. Select **OAuth**. In **Advanced OAuth settings**, choose a registered/provided client and enter **`geniusfitness-chatgpt`**. The token endpoint authentication method is **none**: this is a public client protected by PKCE; there is no client secret to paste.
4. Review the warning, create the plugin, and sign in to GeniusFitness on its own consent page. Choose the permissions and resources you intend to share, then approve.
5. Install/select the resulting plugin in ChatGPT. Start a conversation and select it with **@GeniusFitness**.

The authorization server is discovered at `https://api-geniusfitness.pulsarinteractive.cloud/api/agents/chatgpt`. If your ChatGPT interface requests explicit endpoints, use `/api/agents/oauth/authorize` and `/api/agents/oauth/token` on that same API host. The registered callback is exactly `https://chatgpt.com/connector_platform_oauth_redirect`; issuer identification protects the return. Do not substitute another callback or disable authentication.

## Working with your data

Read current records before changing them. ChatGPT can discover allowed actions, prepare a change, and execute the approved command. Keep the exact command when retrying an uncertain response: a repeated operation ID recovers the original result instead of applying the same edit twice. After a revision conflict, reread the record and confirm the replacement intent.

Use **read-only permissions** if you only want summaries. Write access does not grant administration, billing, permission management or access to another person's private data. Existing account limits apply to ChatGPT and the CLI together; connecting another tool does not create a fresh quota.

Disconnecting the plugin in ChatGPT removes its use there. Also revoke its dedicated connection from GeniusFitness's agent settings to invalidate its delegated sessions. Reconnecting requires consent again. This connector never needs your OpenAI API key.

## Language and shared limits

Ask in your preferred language. The assistant should explain results and errors in that language while preserving existing record text, IDs and API field values. The consent screen supports French and English; ChatGPT’s supported locale hint selects the screen language, with the browser language as fallback. Confirm dates and timezones when they are ambiguous.

CLI, local MCP and hosted ChatGPT use the verified account’s current subscription and shared request/write counters. New connections, profiles or refreshed tokens do not grant a new budget. Protocol discovery and command preparation also count as requests; a tool operation can involve more than one request. Resource capacity and Coach access remain enforced by the same domain commands. A rate-limit response includes retry guidance: wait rather than switching tools or starting an automatic retry loop.

## Examples

- “Use GeniusFitness to show my training plan for this week.”
- “Propose moving Thursday’s session to Saturday, then apply it after my approval.”
- “Find a catalogue exercise to replace this movement while preserving my program.”

Editing another athlete’s program requires the Coach subscription, explicit coaching permission and current program access. Personal health measurements require their own permission and are not shared through program coaching access.

## Scope and troubleshooting

- If access is denied, check the account's admission, selected permissions, resource membership and subscription. The connector cannot bypass these checks.
- If a quota is reached, respect the returned retry time. Do not loop or create extra connections to evade limits.
- If a record changed, read the new revision instead of overwriting it blindly.
- Local filesystem access remains a CLI/local-MCP capability. A ChatGPT attachment can be imported only through an advertised, configured hosted-file tool; a visible attachment alone does not grant file access.
- The public tool catalogue is in [`remote/tool-catalog.json`](../remote/tool-catalog.json). Tools are described separately from private backend implementation.

A custom connection is separate from an OpenAI directory listing. See [official publication](OPENAI_PUBLICATION.md). The CLI and local MCP remain supported independently.

## Personal exercise photos

Use `fitness_exercise_media_import` only when the connector advertises it and
ChatGPT supplies an actual file parameter. It attaches one authorized image to
an existing personal exercise; access to a shared program does not grant editing
of another person’s private library. If the tool is missing or no usable file
reference is supplied, use the app or an authorized local file with the CLI.
Never invent a download link or report an attachment as imported without a
successful receipt.

The same server rules apply to every client: static PNG/JPEG/WebP, at most
4,000,000 source bytes and 4,096 px per source dimension, then compression to
WebP at most 1,080 px on the longest side and 1,000,000 stored bytes. The
account’s shared media allowance applies. Preserve the exact operation and
source identity on an uncertain response. The full
[photo workflow](CUSTOM_EXERCISES.md#photos-shared-with-chatgpt) describes allowed
hosts, file parameters, pending versus ready images and recovery.

## If the connection only allows reading

1. Open this app’s settings in ChatGPT and choose **Refresh tools** when available.
2. Choose **Reconnect** for the connected account. Check that the correct account
   appears on the product consent screen.
3. The requested permissions are selected by default. Keep the ones you want,
   including editing, then authorize. Explicitly restricted connections stay
   restricted; old grants are never silently expanded.
4. Ask the assistant to read its **identity** and **capabilities** again. Confirm
   that the required permissions and write commands appear before requesting an edit.

A new conversation may be needed after the tool catalogue changes. A CLI login
is a separate connection and does not update ChatGPT’s permissions.

## Guides available to the assistant

The connector includes a `fitness_workflow` tool. Ask it for the relevant guide
before an unfamiliar operation. These are reviewed instructions served directly
by the connector; custom ChatGPT connections do not automatically install the
skill files from this repository.

See [supported workflows](WORKFLOWS.md) for examples and boundaries, and
[CLI setup](CLI.md) for a terminal or local MCP connection. The local CLI can also
show a guide without downloading account data:

```sh
geniusfitness workflow show --topic mutations --json
```

## See changes in the application

An accepted connector command changes the same data used by the application.
The open application’s normal realtime subscription receives a version hint and
loads the canonical change. When reconnecting after a network interruption, the
application catches up through its existing sync system. A server receipt and a
screen update are different observations: the assistant should verify the changed
record, and should not claim to have seen your screen unless it actually did.

See [Coach Push proposals](COACH_PUSH.md) for exact-occurrence intent, athlete confirmation and safe command recovery.

## If ChatGPT cannot find bug reports or feature requests

Select **@GeniusFitness** and ask whether this connection can report a bug or suggest a
feature. The live check is `fitness_feedback_capabilities`. Product feedback
uses dedicated tools outside the list of project or training commands.

1. If that tool is missing, open **Plugins → GeniusFitness → Settings → Manage app → Refresh tools**, then select the plugin in a new chat.
2. If the tool returns `canReportBug: false`, review the selected account and its personal `feedback:write` grant. Reconnect in ChatGPT if you want to authorize that access.
3. If `canReportBug` is true and `canRequestFeature` is false, this account can report bugs. Feature requests require a paid plan.
4. Ask to prepare a report. Review its contents and selected attachments, then approve sending. The returned receipt identifies the submission.
