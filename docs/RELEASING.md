# Releasing the agent tools

Releases contain the standalone client, public command metadata, skills and
user guides. Server and application implementations are not part of this package.

1. Update the version in `package.json`, its lockfile, MCP server identification,
   plugin manifests and pinned installation examples. Record user-facing changes
   in `CHANGELOG.md`.
2. Run `npm ci` and `npm run verify`. CI repeats the verification on Linux and
   macOS. Review the package file list, license, public links and dependency audit.
3. Test browser login, one authorized read and one reversible command against
   the intended environment using a dedicated test account. Check revocation and
   confirm the deployed service supports the published command metadata.
4. Create a matching Git tag only for the reviewed commit. Publish the inspected
   package with `npm publish --access public --tag beta` while it is a prerelease.
   Publication may require the maintainer's npm authentication.
5. Check the registry version, MIT license, repository URL and distribution tags.
   Install the registry artifact in a fresh directory and verify `--help`, MCP
   startup and the included skills. Do not assume an upload updated every tag.

Keep experimental client changes unpublished until their server capabilities are
available. A public source commit, an npm release and a service rollout are
separate events and should be reported separately.
