import test from 'node:test';
import assert from 'node:assert/strict';
import { CommandJournal } from '../src/commands.mjs';
import { fixture } from './helpers.mjs';

const draft = (data) => ({
  scope: 'project:work',
  epoch: 'epoch',
  id: 'slot',
  expectedRevision: '4',
  kind: 'workout.exercise.update',
  data,
});
const receipt = (input) => ({
  operationId: input.operationId,
  scope: input.scope,
  epoch: input.epoch,
  kind: input.kind,
  cursor: '5',
  items: [{ id: input.id, revision: '5', collection: 'workoutExercises', deleted: false }],
  affectedCollections: ['workoutExercises'],
});

test('kg intent is frozen before journal and survives loss, restart and capability rollback byte for byte', async (t) => {
  const calls = [],
    bodies = [];
  let enabled = true;
  const f = await fixture(t, async (url, options) => {
    calls.push(url.pathname);
    if (url.pathname.endsWith('/capabilities')) {
      return Response.json(enabled ? { newPrescriptionMassProtocol: 'canonical-kg-v1' } : {});
    }
    assert.equal(url.pathname, '/api/agents/v1/commands');
    bodies.push(options.body);
    if (bodies.length === 1) {
      throw new Error('reply lost after commit');
    }
    return Response.json(receipt(JSON.parse(options.body)));
  });
  assert.equal((await f.client.get('capabilities')).newPrescriptionMassProtocol, 'canonical-kg-v1');
  const journal = new CommandJournal(f.client),
    data = { targetSets: '[{"w":12.473790175,"r":8},{"w":0,"r":10}]', massFormat: 'kg-v1' };
  const operation = await journal.prepare(draft(data));
  assert.deepEqual(operation.request.data, data);
  assert.equal(calls.length, 1, 'local preparation neither fetches capability nor posts data');
  await assert.rejects(journal.retry(operation.operationId), { code: 'network_unavailable' });
  enabled = false;
  assert.deepEqual(await f.client.get('capabilities'), {});
  const restarted = new CommandJournal(f.client);
  assert.equal((await restarted.retry(operation.operationId)).source, 'server');
  assert.equal(bodies[0], bodies[1]);
  assert.deepEqual((await restarted.inspect(operation.operationId)).request, operation.request);
  assert.equal((await restarted.retry(operation.operationId)).source, 'local_receipt');
  assert.equal(bodies.length, 2);
});

test('an older unmarked journal is neither converted nor upgraded when canonical admission starts rejecting it', async (t) => {
  const bodies = [];
  const f = await fixture(t, async (url, options) => {
    assert.equal(url.pathname, '/api/agents/v1/commands');
    bodies.push(options.body);
    return Response.json(
      {
        error: {
          code: 'mass_format_precondition_required',
          message: 'Explicit encoding required',
          retryable: false,
          execution: 'not_started',
          remediation: 'review_prescription',
        },
      },
      { status: 409 },
    );
  });
  const journal = new CommandJournal(f.client),
    data = { targetSets: '[{"w":27.5,"r":8}]' };
  const operation = await journal.prepare(draft(data));
  await assert.rejects(journal.retry(operation.operationId), {
    code: 'mass_format_precondition_required',
  });
  assert.equal(bodies.length, 1, 'no implicit retry or capability fetch');
  assert.deepEqual(JSON.parse(bodies[0]).data, data);
  assert.deepEqual((await journal.inspect(operation.operationId)).request, operation.request);
});
