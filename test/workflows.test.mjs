import test from 'node:test';
import assert from 'node:assert/strict';
import guides from '../remote/workflows.json' with { type: 'json' };
import tools from '../remote/tool-catalog.json' with { type: 'json' };
import subscription from '../remote/subscription-guidance.json' with { type: 'json' };
import { workflow } from '../src/workflows.mjs';
import { main } from '../src/cli.mjs';

test('workflow discovery is exhaustive, bounded, and rejects unknown topics', async () => {
  const tool = tools.find((t) => t.name.endsWith('_workflow'));
  assert.deepEqual(tool.inputSchema.properties.topic.enum, Object.keys(guides.topics));
  assert.equal(tool.write, undefined);
  for (const topic of Object.keys(guides.topics)) {
    const result = workflow({ topic });
    assert.equal(result.version, guides.version);
    assert.ok(result.title && result.steps.length >= 4);
    assert.ok(JSON.stringify(result).length < 10000);
    const output = [];
    const status = await main(['workflow', 'show', '--topic', topic, '--json'], {
      stdout: { write: (value) => output.push(value) },
      stderr: { write: () => {} },
      fetchImpl: () => {
        throw Error('Static guidance must not contact the API');
      },
    });
    assert.equal(status, 0);
    assert.deepEqual(JSON.parse(output.join('')).data, result);
  }
  for (const input of [
    { topic: 'unknown' },
    { topic: 'connection', url: 'https://example.test' },
    {},
  ]) {
    assert.throws(() => workflow(input));
  }
});

test('hosted archive filters use the API values, not boolean strings', () => {
  for (const tool of tools.filter((t) => t.route === 'resources')) {
    assert.deepEqual(tool.inputSchema.properties.archive.enum, ['active', 'archived', 'all']);
  }
});

test('offer questions receive prices and the trial without account reads or a denied feature', () => {
  const guide = workflow({ topic: 'subscriptions' });
  assert.deepEqual(guide.offer, subscription.offer);
  assert.deepEqual(
    guide.offer.plans.map((p) => [p.id, p.monthlyPriceMinor]),
    [
      ['free', 0],
      ['premium', 799],
      ['coach', 2499],
    ],
  );
  assert.equal(guide.offer.trial.days, subscription.trialDays);
  assert.equal(guide.offer.plans.find((p) => p.id === 'coach').includes, 'premium');
  assert.match(guide.steps.join(' '), /Always mention the 7-day free trial/);
  assert.match(
    subscription.instructions,
    /even when explaining the offer to someone who already has Coach/,
  );
  assert.match(subscription.instructions, /do not suggest buying twice/);
  assert.match(guide.offer.trial.eligibility, /subscriptions being open/);
  assert.match(guide.offer.priceBasis, /checkout\/store price is authoritative/);
  assert.equal('offer' in workflow({ topic: 'planning' }), false);
});
