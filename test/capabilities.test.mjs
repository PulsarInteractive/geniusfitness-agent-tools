import test from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/client';
import { InMemoryTransport } from '@modelcontextprotocol/server';
import { createMcpServer } from '../src/mcp.mjs';
import { main } from '../src/cli.mjs';
import { commandHelp } from '../src/fitness.mjs';
import { fixture, origin } from './helpers.mjs';

// The service is authoritative. A client must not expand current capabilities
// from its newer static catalogue or keep eligibility after live revocation.
test('CLI and MCP preserve changing server capabilities, including older services', async (t) => {
  let calls = 0;
  let current;
  const f = await fixture(t, async (url) => {
    assert.equal(url.pathname, '/api/agents/v1/capabilities');
    calls++;
    return Response.json(current);
  });
  const server = createMcpServer(f.client);
  const client = new Client({ name: 'capabilities-test', version: '1' });
  const [a, b] = InMemoryTransport.createLinkedPair();
  await server.connect(a);
  await client.connect(b);
  try {
    for (const value of [
      {
        resourceChecksRequired: true,
        coachingWriteAvailable: true,
        writesAvailable: true,
        commands: [
          {
            kind: 'coach.push.propose',
            requiredPermissions: ['planning:write', 'coaching:write'],
            requiredTier: 'Pro',
            revisionScope: 'occurrence',
          },
        ],
      },
      {
        resourceChecksRequired: true,
        coachingWriteAvailable: false,
        writesAvailable: false,
        commands: [],
      },
      { writesAvailable: false, commands: [] },
    ]) {
      current = value;
      let out = '',
        err = '';
      const before = calls;
      const code = await main(['capabilities', '--origin', origin, '--allow-local', '--json'], {
        directory: f.directory,
        fetchImpl: f.transport.fetch,
        stdout: { write: (s) => (out += s) },
        stderr: { write: (s) => (err += s) },
      });
      assert.equal(code, 0, err);
      assert.deepEqual(JSON.parse(out).data, value);
      const result = await client.callTool({ name: 'fitness_capabilities', arguments: {} });
      assert.notEqual(result.isError, true);
      assert.deepEqual(result.structuredContent.data, value);
      assert.equal(calls - before, 2, 'one bounded authenticated read per surface');
    }
  } finally {
    await client.close();
    await server.close();
  }
});

test('static help explains both Push gates and occurrence revisions without granting access', () => {
  for (const kind of ['coach.push.propose', 'coach.push.withdraw']) {
    const help = commandHelp(kind);
    assert.deepEqual(help.requiredPermissions, ['planning:write', 'coaching:write']);
    assert.equal(help.requiredTier, 'Pro');
    assert.equal(help.revisionScope, 'occurrence');
    assert.equal(help.resourceChecksRequired, true);
  }
  const ordinary = commandHelp('planning.update');
  assert.deepEqual(ordinary.requiredPermissions, ['planning:write']);
  assert.equal(ordinary.requiredTier, null);
  assert.equal(ordinary.revisionScope, 'resource');
  assert.equal(ordinary.resourceChecksRequired, true);
});
