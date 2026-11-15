import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { writeFile, lstat } from 'node:fs/promises';
import { join } from 'node:path';
import { Client } from '@modelcontextprotocol/client';
import { InMemoryTransport } from '@modelcontextprotocol/server';
import {
  previewCatalogueImport,
  validateCatalogueImportRequest,
  validCatalogueImportReceipt,
} from '../src/catalogue-import.mjs';
import { CommandJournal, validateCommand } from '../src/commands.mjs';
import { commandHelp } from '../src/fitness.mjs';
import { createMcpServer } from '../src/mcp.mjs';
import { main } from '../src/cli.mjs';
import { credentials } from '../src/client.mjs';
import { fixture, tokens, origin } from './helpers.mjs';

const pins = {
  sourceContentVersion: 'a'.repeat(64),
  subsetVersion: 'b'.repeat(64),
  mappingVersion: 'c'.repeat(64),
};
const query = { catalogueKey: 'ex.1000001', locale: 'fr' };
const request = () => ({
  ...query,
  ...pins,
  operationId: randomUUID(),
  issuedAt: 100,
  epoch: 'personal-epoch',
  elementId: 'synthetic-new',
});
const originValue = () => ({
  ...pins,
  catalogueKey: query.catalogueKey,
  qualification: 'reviewed_subset',
  coverage: 'partial',
  trackingClaimDigest: 'd'.repeat(64),
  loadConvention: 'bodyweight',
  countingConvention: 'alternating_opposite_pair_repetitions',
});
const preview = () => ({
  ...pins,
  ...{ catalogueKey: query.catalogueKey },
  state: 'projected',
  reason: 'explicit_reviewed_tracking',
  readyToStart: false,
  origin: originValue(),
  definition: {
    kind: 'Exercise',
    name: 'Mouvement synthétique',
    exerciseType: 'BodyweightReps',
    defaultUnit: 'none',
    catalogKey: query.catalogueKey,
    countingConvention: 'alternating_opposite_pair_repetitions',
    movementIntent: 'Une intention synthétique.',
    description: 'Une instruction synthétique. Aucun conseil réel.',
  },
});
const receipt = (input) => ({
  state: 'imported',
  scope: 'personal:owner',
  elementId: input.elementId,
  mutationId: `reviewed-import:${input.operationId}`,
  epoch: input.epoch,
  cursor: '10',
  revision: '10',
  origin: originValue(),
  readyToStart: false,
});

test('import preview is one read-only POST and preserves exact source text and counting', async (t) => {
  const sent = [];
  let value = preview();
  const f = await fixture(t, async (url, options) => {
    sent.push(JSON.parse(options.body));
    assert.equal(url.pathname, '/api/agents/v1/catalogue/import/preview');
    assert.equal(options.method, 'POST');
    return Response.json(value);
  });
  assert.deepEqual(await previewCatalogueImport(f.client, query), value);
  assert.deepEqual(sent, [query]);
  value = {
    ...value,
    state: 'requires_configuration',
    reason: 'source_guidance_not_representable',
    definition: null,
    origin: null,
  };
  assert.deepEqual(await previewCatalogueImport(f.client, query), value);
  assert.equal(sent.length, 2);
});

test('preview refuses foreign pins, forged fields and inconsistent projection without follow-up', async (t) => {
  let value;
  let calls = 0;
  const f = await fixture(t, async () => {
    calls++;
    return Response.json(value);
  });
  for (const change of [
    (v) => {
      v.catalogueKey = 'ex.1000002';
    },
    (v) => {
      v.origin.mappingVersion = 'e'.repeat(64);
    },
    (v) => {
      v.definition.catalogKey = 'ex.1000002';
    },
    (v) => {
      v.state = 'requires_configuration';
    },
    (v) => {
      v.definition = null;
    },
    (v) => {
      v.origin.countingConvention = 'per_side_duration';
    },
    (v) => {
      v.definition.exerciseType = 'Duration';
    },
    (v) => {
      v.readyToStart = true;
    },
    (v) => {
      v.privateLedger = {};
    },
  ]) {
    value = preview();
    change(value);
    await assert.rejects(previewCatalogueImport(f.client, query), { code: 'invalid_response' });
  }
  assert.equal(calls, 9);
  await assert.rejects(previewCatalogueImport(f.client, { ...query, ownerId: 'foreign' }), {
    code: 'invalid_arguments',
  });
  assert.equal(calls, 9);
});

test('lost import reply replays identical bytes, pins and identity through the existing journal', async (t) => {
  const input = request(),
    sent = [];
  const f = await fixture(t, async (url, options) => {
    assert.equal(url.pathname, '/api/agents/v1/catalogue/import/confirm');
    sent.push(JSON.parse(options.body));
    if (sent.length === 1) {
      throw Error('lost reply');
    }
    return Response.json(receipt(input));
  });
  const first = new CommandJournal(f.client);
  await assert.rejects(first.confirmCatalogueImport(input), { code: 'network_unavailable' });
  const saved = await first.inspect(input.operationId);
  assert.equal(saved.protocol, 'catalogue_import');
  assert.equal(saved.state, 'uncertain');
  assert.deepEqual(saved.request, input);
  assert.equal((await lstat(first.store(input.operationId).path)).mode & 0o777, 0o600);
  const restarted = new CommandJournal(f.client);
  assert.equal((await restarted.retry(input.operationId)).source, 'server');
  assert.equal((await restarted.retry(input.operationId)).source, 'local_receipt');
  assert.deepEqual(sent, [input, input]);
  await assert.rejects(restarted.confirmCatalogueImport({ ...input, locale: 'en' }), {
    code: 'idempotency_mismatch',
  });
  await f.store.locked(() =>
    f.store.write(credentials({ ...tokens(), profile_id: 'foreign' }, origin)),
  );
  await assert.rejects(restarted.retry(input.operationId), { code: 'operation_identity_mismatch' });
  assert.equal(sent.length, 2);
});

test('a malformed or foreign import receipt never becomes a confirmed local operation', async (t) => {
  const input = request();
  let value;
  const f = await fixture(t, async () => Response.json(value)),
    journal = new CommandJournal(f.client);
  for (const change of [
    (v) => {
      v.elementId = 'foreign';
    },
    (v) => {
      v.epoch = 'foreign';
    },
    (v) => {
      v.mutationId = 'another-protocol';
    },
    (v) => {
      v.scope = 'project:foreign';
    },
    (v) => {
      v.origin.subsetVersion = 'e'.repeat(64);
    },
    (v) => {
      v.origin.catalogueKey = 'ex.1000002';
    },
    (v) => {
      v.origin.loadConvention = 'unknown';
    },
    (v) => {
      v.readyToStart = true;
    },
  ]) {
    value = receipt(input);
    change(value);
    assert.equal(validCatalogueImportReceipt(value, input), false);
    await assert.rejects(journal.confirmCatalogueImport(input), { code: 'invalid_response' });
    assert.equal((await journal.inspect(input.operationId)).state, 'uncertain');
  }
});

test('import requests are closed, preserve old pins for replay and cannot author doses or provenance', () => {
  const input = request();
  assert.deepEqual(validateCatalogueImportRequest(input), input);
  for (const patch of [
    { issuedAt: Number.MAX_SAFE_INTEGER + 1 },
    { scope: 'personal:foreign' },
    { catalogueOrigin: originValue() },
    { countingConvention: 'per_side_repetitions' },
    { targetSets: [] },
    { locale: 'de' },
    { elementId: 'unsafe/id' },
  ]) {
    assert.throws(() => validateCatalogueImportRequest({ ...input, ...patch }), {
      code: 'invalid_arguments',
    });
  }
});

test('generated counting rules validate explicit combinations without filling sparse edits', () => {
  const command = (data) => ({
    operationId: randomUUID(),
    issuedAt: 0,
    scope: 'personal:owner',
    epoch: 'epoch',
    id: 'custom',
    expectedRevision: '1',
    kind: 'exercise.update',
    data,
  });
  const help = commandHelp('exercise.update').customExercise.counting;
  assert.equal(help.conventions.length, 4);
  for (const convention of help.conventions) {
    const types = convention === 'per_side_duration' ? help.durationTypes : help.repetitionTypes;
    for (const exerciseType of types) {
      const input = command({ exerciseType, countingConvention: convention });
      assert.deepEqual(validateCommand(input), input);
    }
    const sparse = command({ countingConvention: convention });
    assert.deepEqual(validateCommand(sparse), sparse);
  }
  for (const data of [
    { countingConvention: 'both' },
    { countingConvention: 8 },
    { exerciseType: 'Duration', countingConvention: 'bilateral_repetitions' },
    { exerciseType: 'WeightReps', countingConvention: 'per_side_duration' },
  ]) {
    assert.throws(() => validateCommand(command(data)), { code: 'invalid_arguments' });
  }
  for (const data of [{ name: 'Unchanged counting' }, { countingConvention: null }]) {
    assert.deepEqual(validateCommand(command(data)).data, data);
  }
});

test('actual CLI and MCP expose explicit preview and journaled confirmation without changing legacy commands', async (t) => {
  const input = request(),
    sent = [];
  const f = await fixture(t, async (url, options) => {
    sent.push(JSON.parse(options.body));
    return Response.json(url.pathname.endsWith('/preview') ? preview() : receipt(input));
  });
  const file = join(f.directory, 'query.json');
  await writeFile(file, JSON.stringify(query));
  const output = [];
  assert.equal(
    await main(
      ['catalog', 'import-preview', '--file', file, '--origin', origin, '--allow-local', '--json'],
      {
        directory: f.directory,
        fetchImpl: f.transport.fetch,
        stdout: { write: (s) => output.push(s) },
        stderr: { write: () => {} },
      },
    ),
    0,
  );
  assert.deepEqual(JSON.parse(output.join('')).data, preview());
  const server = createMcpServer(f.client),
    client = new Client({ name: 'import-test', version: '1' }),
    [a, b] = InMemoryTransport.createLinkedPair();
  try {
    await Promise.all([server.connect(a), client.connect(b)]);
    const { tools } = await client.listTools();
    assert.equal(
      tools.find((t) => t.name === 'fitness_catalogue_import_preview').annotations.readOnlyHint,
      true,
    );
    assert.equal(
      tools.find((t) => t.name === 'fitness_catalogue_import_confirm').annotations.destructiveHint,
      false,
    );
    assert.ok(tools.some((t) => t.name === 'fitness_execute_command'));
    const result = await client.callTool({
      name: 'fitness_catalogue_import_confirm',
      arguments: input,
    });
    assert.equal(result.isError, undefined);
    assert.equal(sent.length, 2);
    assert.deepEqual(sent[1], input);
    assert.equal(
      (await new CommandJournal(f.client).inspect(input.operationId)).protocol,
      'catalogue_import',
    );
  } finally {
    await client.close();
    await server.close();
  }
});
