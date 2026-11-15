import test from 'node:test';
import assert from 'node:assert/strict';
import { readReviewedCatalogue } from '../src/reviewed-catalogue.mjs';
import { fixture } from './helpers.mjs';
import { reviewedPage, subsetVersion } from './fixtures/reviewed-catalogue-wire.mjs';
const filters = {
  inventory: { coverage: 'unknown', items: [] },
  muscleTargets: [],
  muscleMode: 'any',
  mode: 'browse',
  expandVariants: true,
};

for (const total of [60, 65]) {
  test(`the ${total}-variant corpus stays an explicit 48 + ${total - 48} traversal`, async (t) => {
    const keys = Array.from({ length: total }, (_, i) => `ex.${1000000 + i}`),
      requests = [];
    const f = await fixture(t, async (url, options) => {
      assert.equal(url.pathname, '/api/agents/catalogue/reviewed');
      const query = JSON.parse(options.body);
      requests.push(query);
      return Response.json(
        query.cursor
          ? reviewedPage(keys.slice(48))
          : reviewedPage(keys.slice(0, 48), 'second-page'),
      );
    });
    const query = { limit: 48, version: subsetVersion, filters };
    const first = await readReviewedCatalogue(f.client, query);
    assert.equal(requests.length, 1, 'A returned cursor never causes an automatic request.');
    const second = await readReviewedCatalogue(f.client, { ...query, cursor: first.nextCursor });
    assert.equal(requests.length, 2);
    assert.equal(second.nextCursor, null);
    assert.deepEqual(requests, [query, { ...query, cursor: 'second-page' }]);
    assert.deepEqual(
      [...first.catalogue.page.candidates, ...second.catalogue.page.candidates].map(
        (v) => v.catalogueKey,
      ),
      keys,
    );
    assert.ok(
      second.matching.variants.every(
        (v) => v.muscles.evidenceStatus === 'unknown' && v.muscles.softwareScore === 0,
      ),
    );
  });
}

test('corpus expansion cannot accept a stale subset or broken variant correspondence', async () => {
  const page = reviewedPage(['ex.1000001']);
  for (const mutate of [
    (value) => {
      value.catalogue.subsetVersion = 'd'.repeat(64);
    },
    (value) => {
      value.matching.variants[0].catalogueKey = 'ex.1000002';
    },
    (value) => {
      value.catalogue.page.candidates.push(structuredClone(value.catalogue.page.candidates[0]));
    },
  ]) {
    const value = structuredClone(page);
    mutate(value);
    await assert.rejects(
      readReviewedCatalogue(
        { reviewedCatalogue: async () => value },
        { limit: 48, version: subsetVersion, filters },
      ),
      { code: 'invalid_response' },
    );
  }
});
