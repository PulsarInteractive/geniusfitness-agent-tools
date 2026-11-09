import test from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/client';
import { InMemoryTransport } from '@modelcontextprotocol/server';
import { readCatalogueSearch } from '../src/catalogue-search.mjs';
import { createMcpServer } from '../src/mcp.mjs';
import { main } from '../src/cli.mjs';
import { fixture, origin } from './helpers.mjs';
const hit = {
  catalogueKey: 'ex.0025',
  label: { en: 'Bench', fr: 'Développé' },
  equipment: 'barbell',
  equipmentGroup: 'barbell',
  muscleGroup: 'Chest',
  exerciseType: 'WeightReps',
  attribution: '',
  textScore: 8,
  reason: 'exact_name',
};
const page = () => ({
  formatVersion: 2,
  version: 'a'.repeat(64),
  policyVersion: 'catalogue-search-v2-1',
  source: 'legacy_metadata',
  equipmentCompatibility: 'not_assessed',
  muscleEvidence: 'not_reviewed',
  scoreScope: 'evaluated_page',
  continuationUnit: 'family_block',
  rowUnit: 'family',
  locale: 'en',
  evaluatedVariants: 8,
  evaluatedFamilies: 1,
  matchedVariants: 1,
  rows: [
    {
      familyId: 'bench',
      label: hit.label,
      selectedCatalogueKey: hit.catalogueKey,
      familyVariantCount: 8,
      variants: [hit],
    },
  ],
  facets: { scope: 'source_catalogue', equipment: ['barbell'], muscleGroups: ['Chest'] },
  nextCursor: null,
});
test('v2 performs exactly one normal authenticated read, including empty pages with a continuation', async (t) => {
  let calls = 0;
  const f = await fixture(t, async (url) => {
    calls++;
    assert.equal(new URL(url).pathname, '/api/agents/v2/catalog');
    return Response.json({ ...page(), rows: [], matchedVariants: 0, nextCursor: 'opaque' });
  });
  const result = await readCatalogueSearch(f.client, {});
  assert.equal(result.nextCursor, 'opaque');
  assert.equal(calls, 1);
  await readCatalogueSearch(f.client, { cursor: result.nextCursor });
  assert.equal(calls, 2);
});
test('v2 strict parser rejects inconsistent rows, duplicate variants, scope claims and oversized inputs', async () => {
  for (const patch of [
    { source: 'reviewed_publication' },
    { equipmentCompatibility: 'compatible' },
    { muscleEvidence: 'reviewed' },
    { evaluatedVariants: 0 },
    { matchedVariants: 2 },
    { rows: [page().rows[0], page().rows[0]] },
    { rowUnit: 'variant' },
    { extra: 'unexpected' },
    { rows: [{ ...page().rows[0], selectedCatalogueKey: 'ex.9999' }] },
  ]) {
    await assert.rejects(readCatalogueSearch({ get: async () => ({ ...page(), ...patch }) }, {}), {
      code: 'invalid_response',
    });
  }
  for (const input of [
    { query: 'x'.repeat(161) },
    { cursor: 'x'.repeat(2049) },
    { limit: 500 },
    { expandVariants: 'true' },
    { locale: 'de' },
  ]) {
    await assert.rejects(
      readCatalogueSearch(
        {
          get: async () => {
            throw Error('must not dispatch');
          },
        },
        input,
      ),
      { code: 'invalid_arguments' },
    );
  }
});
test('CLI explore reaches v2 without altering legacy search options', async (t) => {
  let calls = 0;
  const f = await fixture(t, async (url) => {
    calls++;
    const u = new URL(url);
    assert.equal(u.pathname, '/api/agents/v2/catalog');
    assert.equal(u.searchParams.get('locale'), 'fr');
    assert.equal(u.searchParams.get('expandVariants'), 'true');
    return Response.json({ ...page(), locale: 'fr', rowUnit: 'variant' });
  });
  const output = [];
  const code = await main(
    [
      'catalog',
      'explore',
      '--locale',
      'fr',
      '--expand-variants',
      'true',
      '--origin',
      origin,
      '--allow-local',
      '--json',
    ],
    {
      directory: f.directory,
      fetchImpl: f.transport.fetch,
      stdout: { write: (value) => output.push(value) },
      stderr: { write: () => {} },
    },
  );
  assert.equal(code, 0);
  assert.equal(calls, 1);
  assert.ok(output.length);
});
test('real local MCP advertises and executes the versioned tool once without traversing the result cursor', async () => {
  let calls = 0;
  const server = createMcpServer({
    get: async (name, input) => {
      calls++;
      assert.equal(name, 'catalog-v2');
      assert.equal(input.locale, 'fr');
      return { ...page(), locale: 'fr', nextCursor: 'opaque' };
    },
  });
  const client = new Client({ name: 'catalogue-v2-test', version: '1' }),
    [a, b] = InMemoryTransport.createLinkedPair();
  try {
    await server.connect(a);
    await client.connect(b);
    const tools = await client.listTools();
    assert.ok(tools.tools.some((t) => t.name === 'fitness_catalog_search'));
    assert.ok(tools.tools.some((t) => t.name === 'fitness_catalog'));
    const result = await client.callTool({
      name: 'fitness_catalog_search',
      arguments: { locale: 'fr' },
    });
    assert.equal(result.isError, undefined);
    assert.equal(result.structuredContent.data.nextCursor, 'opaque');
    assert.equal(calls, 1);
  } finally {
    await client.close();
    await server.close();
  }
});
