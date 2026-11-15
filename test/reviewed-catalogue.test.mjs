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

// Synthetic shape fixtures: no exercise advice or catalogue corpus is embedded.
function groupedPage(expanded = false) {
  const result = page(),
    evidence = {
      status: 'synthetic',
      basis: 'synthetic_fixture',
      sourceIds: [],
      method: 'Schema test',
      preparedBy: 'test',
      review: null,
      limitations: ['Synthetic; no exercise advice.'],
    };
  const variant = (key, familyId) => ({
    catalogueKey: key,
    familyId,
    label: { en: 'Synthetic', fr: 'Synthétique' },
    axes: [
      'gripOrientation',
      'gripWidth',
      'bodyPosition',
      'benchAngle',
      'laterality',
      'stanceWidth',
      'movementOrientation',
    ].map((axis) => ({ axis, state: 'unknown', value: null, evidence })),
    alternatives: [],
    visibility: 'browse',
    loadConvention: 'unknown',
    loadEvidence: evidence,
    equipment: { state: 'unknown', required: [], optional: [], evidence },
    muscles: { state: 'unknown', targets: [], evidence },
    cue: { state: 'unknown', text: null, evidence },
    explanation: {
      state: 'unknown',
      setup: [],
      execution: [],
      breathing: [],
      cautions: [],
      evidence,
    },
    media: { state: 'unavailable', assetKey: null, sha256: null, evidence },
  });
  result.catalogue.page.candidates = [variant('ex.1', 'old-a'), variant('ex.2', 'old-b')];
  result.catalogue.page.discoveryGroupingVersion = 'e'.repeat(64);
  result.catalogue.page.discoveryGroups = [{ id: 'display-pair', catalogueKeys: ['ex.1', 'ex.2'] }];
  result.matching.discoveryGroupingVersion = 'e'.repeat(64);
  result.evaluatedVariants =
    result.matching.evaluatedVariants =
    result.matching.matchedVariants =
      2;
  result.evaluatedUnits = expanded ? 2 : 1;
  result.continuationUnit = expanded ? 'variant' : 'discovery_block';
  result.matching.expanded = expanded;
  result.matching.variants = result.catalogue.page.candidates.map((v) => ({
    catalogueKey: v.catalogueKey,
    familyId: v.familyId,
    discoveryGroupId: 'display-pair',
    visibilityAllowed: true,
    status: 'matched',
    equipment: {
      status: 'unknown',
      reason: 'requirements_unknown',
      clauses: [],
      optional: [],
      evidenceStatus: 'synthetic',
    },
    muscles: {
      status: 'matched',
      declaredTargets: 0,
      qualifyingTargets: 0,
      softwareScore: 0,
      evidenceStatus: 'synthetic',
      matches: [],
    },
  }));
  result.matching.selections = (expanded ? [['ex.1'], ['ex.2']] : [['ex.1', 'ex.2']]).map(
    (keys) => ({
      familyId: null,
      discoveryGroupId: 'display-pair',
      selectedCatalogueKey: keys[0],
      matchedVariantKeys: keys,
      softwareScore: 0,
    }),
  );
  return result;
}

test('versioned discovery groups preserve historical family IDs and exact variant selection without extra calls', async () => {
  for (const expanded of [false, true]) {
    const value = groupedPage(expanded);
    let calls = 0;
    const filters = {
      inventory: { coverage: 'unknown', items: [] },
      muscleTargets: [],
      muscleMode: 'any',
      expandVariants: expanded,
    };
    const result = await readReviewedCatalogue(
      {
        reviewedCatalogue: async () => {
          calls++;
          return value;
        },
      },
      { filters },
    );
    assert.equal(calls, 1);
    assert.deepEqual(
      result.catalogue.page.candidates.map((v) => v.familyId),
      ['old-a', 'old-b'],
    );
    assert.equal(result.matching.selections.length, expanded ? 2 : 1);
    assert.equal(result.catalogue.page.discoveryGroups[0].id, 'display-pair');
  }
});

test('an empty versioned discovery page keeps its declared unit and never invents a group', async () => {
  const value = page();
  value.continuationUnit = 'discovery_block';
  value.catalogue.page.discoveryGroupingVersion = value.matching.discoveryGroupingVersion =
    'e'.repeat(64);
  value.catalogue.page.discoveryGroups = [];
  assert.deepEqual(
    (await readReviewedCatalogue({ reviewedCatalogue: async () => value }, {})).catalogue.page
      .discoveryGroups,
    [],
  );
});

test('discovery mismatches, out-of-page members, invented families and mixed selections are rejected', async () => {
  for (const change of [
    (p) => delete p.catalogue.page.discoveryGroups,
    (p) => delete p.catalogue.page.discoveryGroupingVersion,
    (p) => (p.matching.discoveryGroupingVersion = 'f'.repeat(64)),
    (p) => p.catalogue.page.discoveryGroups[0].catalogueKeys.push('ex.999'),
    (p) => p.catalogue.page.discoveryGroups[0].catalogueKeys.push('ex.1'),
    (p) => p.catalogue.page.discoveryGroups.push({ id: 'another', catalogueKeys: ['ex.1'] }),
    (p) => p.catalogue.page.discoveryGroups.push({ id: 'display-pair', catalogueKeys: ['ex.2'] }),
    (p) => (p.matching.variants[0].discoveryGroupId = 'invented'),
    (p) => (p.matching.variants[0].familyId = 'display-pair'),
    (p) => (p.matching.selections[0].discoveryGroupId = 'invented'),
    (p) => p.matching.selections.push(structuredClone(p.matching.selections[0])),
    (p) => (p.continuationUnit = 'family_block'),
    (p) => (p.catalogue.page.discoveryGroups[0].catalogueKeys = ['ex.1']),
  ]) {
    const value = groupedPage();
    change(value);
    await assert.rejects(readReviewedCatalogue({ reviewedCatalogue: async () => value }, {}), {
      code: 'invalid_response',
    });
  }
  const value = groupedPage(true);
  value.matching.selections[0].matchedVariantKeys.push('ex.2');
  await assert.rejects(
    readReviewedCatalogue(
      { reviewedCatalogue: async () => value },
      {
        filters: {
          inventory: { coverage: 'unknown', items: [] },
          muscleTargets: [],
          muscleMode: 'any',
          expandVariants: true,
        },
      },
    ),
    { code: 'invalid_response' },
  );
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

test('an omitted reviewed page size means twelve variants with no implicit continuation', async () => {
  const requests = [];
  const client = {
    reviewedCatalogue: async (query) => {
      requests.push(query);
      return page();
    },
  };
  await readReviewedCatalogue(client, {});
  assert.deepEqual(requests, [{ limit: 12 }]);
  await readReviewedCatalogue(client, { limit: 48 });
  assert.deepEqual(requests, [{ limit: 12 }, { limit: 48 }]);
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
      reviewedCatalogue: async (input) => {
        calls++;
        const result = page();
        if (input.filters?.muscleRole) {
          result.matching.requestedRole = input.filters.muscleRole;
        }
        return result;
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
    const roleResult = await client.callTool({
      name: 'fitness_catalog_reviewed',
      arguments: {
        filters: {
          inventory: { coverage: 'unknown', items: [] },
          muscleTargets: ['quads'],
          muscleMode: 'all',
          muscleRole: 'secondary',
        },
      },
    });
    assert.equal(roleResult.isError, undefined);
    assert.equal(calls, 2);
    assert.match(JSON.stringify(roleResult), /secondary/);
  } finally {
    await client.close();
    await server.close();
  }
});

test('precise role filters survive one client request and reject mismatched responses', async (t) => {
  let calls = 0;
  const query = {
    filters: {
      inventory: { coverage: 'unknown', items: [] },
      muscleTargets: ['quads'],
      muscleMode: 'any',
      muscleRole: 'secondary',
    },
  };
  const f = await fixture(t, async (_url, options) => {
    calls++;
    assert.deepEqual(JSON.parse(options.body), { ...query, limit: 12 });
    const response = page();
    response.matching.requestedRole = 'secondary';
    return Response.json(response);
  });
  assert.equal((await readReviewedCatalogue(f.client, query)).matching.requestedRole, 'secondary');
  assert.equal(calls, 1);
  await assert.rejects(readReviewedCatalogue({ reviewedCatalogue: async () => page() }, query), {
    code: 'invalid_response',
  });
  await assert.rejects(
    readReviewedCatalogue(f.client, { filters: { ...query.filters, muscleRole: 'strongest' } }),
    { code: 'invalid_arguments' },
  );
  assert.equal(calls, 1);
});
