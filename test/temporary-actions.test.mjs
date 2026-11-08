import test from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/client';
import { InMemoryTransport } from '@modelcontextprotocol/server';
import { createMcpServer } from '../src/mcp.mjs';
import { readTemporaryActions, validTemporaryCommand } from '../src/temporary-actions.mjs';
const sessionId = '11111111-1111-4111-8111-111111111111',
  id = '22222222-2222-4222-8222-222222222222';
const query = { scope: 'project:program', athleteId: 'athlete', sessionId },
  target = {
    projectId: 'program',
    trainingId: 'upper',
    sessionId,
    occurrenceId: null,
    exerciseId: 'bench',
    setIndex: 2,
  };
const snapshot = {
  epoch: 'epoch',
  revision: null,
  entries: [],
  serverTime: '2026-11-08T12:00:00.000Z',
};
const resolved = {
  ...snapshot,
  target,
  exerciseName: 'Bench press',
  sourceVersion: 'b'.repeat(64),
  replaces: [],
};
test('one bounded read and exact resolution reject unrelated, oversized and malformed results', async () => {
  let calls = 0;
  const client = {
    get: async (name, input) => {
      calls++;
      assert.equal(name, 'coach-intents');
      assert.deepEqual(input, query);
      return snapshot;
    },
  };
  assert.deepEqual(await readTemporaryActions(client, query), snapshot);
  assert.equal(calls, 1);
  await assert.rejects(readTemporaryActions(client, { ...query, limit: 1000 }), {
    code: 'invalid_arguments',
  });
  assert.equal(calls, 1);
  const exact = {
    ...query,
    selection: 'exact',
    trainingId: 'upper',
    exerciseId: 'bench',
    setIndex: 2,
  };
  assert.deepEqual(
    await readTemporaryActions({ get: async () => resolved }, exact, true),
    resolved,
  );
  for (const value of [
    { ...resolved, target: { ...target, exerciseId: 'row' } },
    { ...resolved, target: { ...target, setIndex: 1 } },
    { ...resolved, entries: Array(65).fill({}) },
    { ...resolved, extra: 'private' },
  ]) {
    await assert.rejects(readTemporaryActions({ get: async () => value }, exact, true), {
      code: 'invalid_response',
    });
  }
});
test('commands keep exact target/window and separate cancellation from application', () => {
  const command = {
    kind: 'coach.intent.set',
    scope: query.scope,
    id,
    expectedRevision: null,
    data: {
      athleteId: 'athlete',
      sessionId,
      kind: 'focus',
      objective: 'comfort',
      target,
      sourceVersion: resolved.sourceVersion,
      startsAt: snapshot.serverTime,
      endsAt: '2026-11-09T12:00:00.000Z',
    },
  };
  assert.equal(validTemporaryCommand(command), true);
  for (const data of [
    { ...command.data, kind: 'skip' },
    { ...command.data, target: { ...target, projectId: 'other' } },
    { ...command.data, endsAt: '2026-11-20T12:00:00.000Z' },
    { ...command.data, target: { ...target, occurrenceId: 'future' } },
  ]) {
    assert.equal(validTemporaryCommand({ ...command, data }), false);
  }
  const cancel = {
    ...command,
    kind: 'coach.intent.cancel',
    expectedRevision: '1',
    data: {
      athleteId: 'athlete',
      sessionId,
      kind: null,
      objective: null,
      target: null,
      sourceVersion: null,
      startsAt: null,
      endsAt: null,
    },
  };
  assert.equal(validTemporaryCommand(cancel), true);
  assert.equal(validTemporaryCommand({ ...cancel, expectedRevision: null }), false);
  assert.equal(
    validTemporaryCommand({ ...cancel, data: { ...cancel.data, objective: 'comfort' } }),
    false,
  );
});
test('actual MCP SDK exposes read-only temporary views without writing or polling', async () => {
  let calls = 0;
  const server = createMcpServer({
      get: async () => {
        calls++;
        return snapshot;
      },
    }),
    client = new Client({ name: 'temporary-test', version: '1' }),
    [a, b] = InMemoryTransport.createLinkedPair();
  await server.connect(a);
  await client.connect(b);
  try {
    const tools = (await client.listTools()).tools;
    assert.equal(
      tools.find((t) => t.name === 'fitness_coach_intents').annotations.readOnlyHint,
      true,
    );
    assert.equal(
      tools.find((t) => t.name === 'fitness_coach_intent_target').annotations.readOnlyHint,
      true,
    );
    const response = await client.callTool({ name: 'fitness_coach_intents', arguments: query });
    assert.notEqual(response.isError, true);
    assert.deepEqual(response.structuredContent.data, snapshot);
    assert.equal(calls, 1);
  } finally {
    await client.close();
    await server.close();
  }
});
