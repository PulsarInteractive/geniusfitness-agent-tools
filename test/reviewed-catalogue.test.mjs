import test from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/client';
import { InMemoryTransport } from '@modelcontextprotocol/server';
import { readReviewedCatalogue, readReviewedCatalogueDetail } from '../src/reviewed-catalogue.mjs';
import { createMcpServer } from '../src/mcp.mjs';
import { main } from '../src/cli.mjs';
import { fixture, origin } from './helpers.mjs';
const page = () => ({
  formatVersion: 1,
  scope: 'reviewed_subset_only',
  inventoryBasis: 'caller_supplied_or_unknown',
  continuationUnit: 'family_block',
  evaluatedVariants: 0,
  evaluatedUnits: 0,
  catalogue: {
    qualification: 'reviewed_subset',
    coverage: 'partial',
    sourceContentVersion: 'a'.repeat(64),
    subsetVersion: 'b'.repeat(64),
    page: {
      contentVersion: 'b'.repeat(64),
      registryVersion: 'c'.repeat(64),
      taxonomyVersion: 'synthetic-schema-test',
      candidates: [],
      equipment: [],
      families: [],
    },
  },
  matching: {
    scope: 'supplied_candidates_only',
    basis: 'structural_filter_relevance_not_physiology',
    policyVersion: 'synthetic-schema-test',
    taxonomyVersion: 'synthetic-schema-test',
    contentVersion: 'b'.repeat(64),
    registryVersion: 'c'.repeat(64),
    expanded: false,
    requestedTargets: [],
    effectiveTargets: [],
    evaluatedVariants: 0,
    matchedVariants: 0,
    unknownVariants: 0,
    variants: [],
    selections: [],
  },
  nextCursor: null,
});

test('reviewed reads perform exactly one authenticated POST without automatic traversal or private profile lookup', async (t) => {
  let calls = 0;
  const f = await fixture(t, async (url, options) => {
    calls++;
    assert.equal(new URL(url).pathname, '/api/agents/catalogue/reviewed');
    assert.equal(options.method, 'POST');
    assert.deepEqual(JSON.parse(options.body), { limit: 2 });
    return Response.json(page());
  });
  assert.equal((await readReviewedCatalogue(f.client, { limit: 2 })).catalogue.coverage, 'partial');
  assert.equal(calls, 1);
  await readReviewedCatalogue(f.client, { limit: 2 });
  assert.equal(calls, 2, 'A repeated call still crosses current authorization and quota');
});

test('new input remains strict, bounded and distinct from old search options', async () => {
  for (const input of [
    { limit: 49 },
    { query: 'press' },
    { publicationAllowed: true },
    { version: 'old' },
    {
      filters: {
        inventory: { coverage: 'complete', items: [{ equipmentId: 'rack', quantity: -1 }] },
        muscleTargets: [],
        muscleMode: 'any',
      },
    },
  ]) {
    await assert.rejects(
      readReviewedCatalogue(
        {
          reviewedCatalogue: async () => {
            throw Error('must not dispatch');
          },
        },
        input,
      ),
      { code: 'invalid_arguments' },
    );
  }
});

test('response validation rejects global claims, inconsistent counts, mismatched versions and undeclared properties', async () => {
  for (const edit of [
    (r) => (r.scope = 'entire_catalogue'),
    (r) => (r.catalogue.coverage = 'complete'),
    (r) => (r.extra = true),
    (r) => (r.matching.matchedVariants = 1),
    (r) => (r.matching.registryVersion = 'd'.repeat(64)),
    (r) => (r.nextCursor = 'cursor'),
    (r) => (r.catalogue.page.contentVersion = 'a'.repeat(64)),
  ]) {
    const result = page();
    edit(result);
    await assert.rejects(readReviewedCatalogue({ reviewedCatalogue: async () => result }, {}), {
      code: 'invalid_response',
    });
  }
  await assert.rejects(
    readReviewedCatalogue({ reviewedCatalogue: async () => page() }, { version: 'a'.repeat(64) }),
    { code: 'invalid_response' },
  );
});

test('exact detail uses its typed GET and preserves unknown identity errors without a legacy fallback', async (t) => {
  let calls = 0;
  const f = await fixture(t, async (url, options) => {
    calls++;
    assert.equal(new URL(url).pathname, '/api/agents/catalogue/reviewed/ex.0047');
    assert.equal(options.method, 'GET');
    assert.equal(new URL(url).search, '');
    return Response.json(
      {
        error: {
          code: 'catalogue_subset_variant_not_found',
          message: 'Not in this subset',
          retryable: false,
          execution: 'not_started',
        },
      },
      { status: 404 },
    );
  });
  await assert.rejects(readReviewedCatalogueDetail(f.client, { key: 'ex.0047' }));
  assert.equal(calls, 1);
  await assert.rejects(readReviewedCatalogueDetail(f.client, { key: '../ex.0047' }), {
    code: 'invalid_arguments',
  });
  assert.equal(calls, 1);
});

test('CLI exposes an explicit reviewed read without changing legacy commands', async (t) => {
  let calls = 0;
  const f = await fixture(t, async (url, options) => {
    calls++;
    assert.equal(new URL(url).pathname, '/api/agents/catalogue/reviewed');
    assert.equal(options.method, 'POST');
    return Response.json(page());
  });
  let text = '';
  const code = await main(['catalog', 'reviewed', '--origin', origin, '--allow-local', '--json'], {
    directory: f.directory,
    fetchImpl: f.transport.fetch,
    stdout: { write: (v) => (text += v) },
    stderr: { write: (v) => (text += v) },
  });
  assert.equal(code, 0, text);
  assert.equal(calls, 1);
  assert.match(text, /reviewed_subset_only/);
});

test('local MCP lists and invokes the two distinct readonly reviewed tools with generated strict schemas', async () => {
  let calls = 0;
  const server = createMcpServer({
      reviewedCatalogue: async () => {
        calls++;
        return page();
      },
    }),
    client = new Client({ name: 'reviewed-test', version: '1.0.0' }),
    [a, b] = InMemoryTransport.createLinkedPair();
  try {
    await Promise.all([server.connect(a), client.connect(b)]);
    const tools = await client.listTools(),
      names = tools.tools.map((t) => t.name);
    assert(names.includes('fitness_catalog_reviewed'));
    assert(names.includes('fitness_catalog_variant'));
    assert(names.includes('fitness_catalog_search'));
    assert(names.includes('fitness_catalog'));
    const tool = tools.tools.find((t) => t.name === 'fitness_catalog_reviewed');
    assert.equal(tool.annotations.readOnlyHint, true);
    assert.equal(tool.inputSchema.additionalProperties, false);
    const result = await client.callTool({ name: 'fitness_catalog_reviewed', arguments: {} });
    assert.equal(result.isError, undefined);
    assert.equal(calls, 1);
  } finally {
    await client.close();
    await server.close();
  }
});
