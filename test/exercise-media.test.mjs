import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFile, readFile, symlink, truncate } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { maxExerciseUploadBytes, maxExerciseReadBytes } from '../src/exercise-media-limits.mjs';
import { validateExerciseMediaOpen } from '../src/exercise-media.mjs';
import { fixture } from './helpers.mjs';
import { CommandJournal } from '../src/commands.mjs';
import {
  prepareExerciseImage,
  uploadExerciseImage,
  readExerciseImageFile,
} from '../src/exercise-media-transfer.mjs';
import { validateExerciseMediaChange, readExerciseMedia } from '../src/exercise-media.mjs';
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP438DwHwAGgAJ/EEwb4QAAAABJRU5ErkJggg==',
  'base64',
);
function session(input, state = 'pending') {
  const { id, size, contentType, fileName, width, height } = input.request;
  const path = `/api/agents/v1/exercise-media/${id}/content`;
  return {
    assetId: id,
    exerciseId: input.exerciseId,
    state,
    uploadPath: path,
    readPath: path,
    media: {
      exerciseId: input.exerciseId,
      epoch: input.request.expectedEpoch,
      revision: state === 'ready' ? '2' : '1',
      sequence: false,
      images: [{ assetId: id, order: 0, state, size, contentType, fileName, width, height }],
    },
  };
}
test('one local file prepares offline, reserves once and uploads exact bytes through a journaled identity', async (t) => {
  let prepared,
    uploaded = false;
  const requests = [];
  const f = await fixture(t, async (url, options) => {
    requests.push({ url: url.pathname, method: options.method, body: options.body });
    if (url.pathname.endsWith('/uploads')) {
      assert.deepEqual(JSON.parse(options.body), prepared.request);
      return Response.json(session(prepared));
    }
    if (url.pathname.endsWith('/content')) {
      assert.equal(options.method, 'PUT');
      assert.deepEqual(options.body, png);
      uploaded = true;
      return Response.json(session(prepared, 'ready'));
    }
    return Response.json(session(prepared, uploaded ? 'ready' : 'pending').media);
  });
  const file = join(f.directory, 'movement.png');
  await writeFile(file, png);
  prepared = await prepareExerciseImage({ exerciseId: 'custom', expectedEpoch: 'epoch', file });
  assert.equal(requests.length, 0);
  assert.equal(prepared.request.width, 1);
  assert.equal(prepared.request.contentType, 'image/png');
  const journal = new CommandJournal(f.client),
    opened = await journal.openExerciseMedia(prepared);
  assert.equal(opened.receipt.state, 'pending');
  assert.equal(requests.length, 1);
  assert.equal((await journal.retry(prepared.request.id)).source, 'local_receipt');
  assert.equal(requests.length, 1);
  const result = await uploadExerciseImage(f.client, { operationId: prepared.request.id, file });
  assert.equal(result.state, 'ready');
  assert.equal(requests.length, 2);
  assert.equal(
    (await readExerciseMedia(f.client, { exerciseId: 'custom' })).images[0].state,
    'ready',
  );
  assert.equal(requests.length, 3);
  const saved = await readFile(journal.store(prepared.request.id).path, 'utf8');
  assert.equal(saved.includes(file), false);
  assert.equal(saved.includes(png.toString('base64')), false);
  assert.equal((await journal.inspect(prepared.request.id)).uploadState, 'confirmed');
  await writeFile(file, Buffer.concat([png, Buffer.from('changed')]));
  assert.deepEqual(
    await uploadExerciseImage(f.client, { operationId: prepared.request.id, file }),
    result,
  );
  assert.equal(requests.length, 3); // A confirmed receipt never reads or sends the source again.
});
test('lost reservation and binary replies recover exact requests without automatic requests', async (t) => {
  let prepared,
    opens = 0,
    transfers = 0;
  const f = await fixture(t, async (url) => {
    if (url.pathname.endsWith('/uploads')) {
      if (++opens === 1) {
        throw Error('lost after reserve');
      }
      return Response.json(session(prepared));
    }
    if (++transfers === 1) {
      throw Error('lost after upload');
    }
    return Response.json(session(prepared, 'ready'));
  });
  const file = join(f.directory, 'movement.png');
  await writeFile(file, png);
  prepared = await prepareExerciseImage({ exerciseId: 'custom', expectedEpoch: 'epoch', file });
  const journal = new CommandJournal(f.client);
  await assert.rejects(journal.openExerciseMedia(prepared), { code: 'network_unavailable' });
  assert.equal(opens, 1);
  await assert.rejects(uploadExerciseImage(f.client, { operationId: prepared.request.id, file }), {
    code: 'operation_not_found',
  });
  assert.equal(transfers, 0);
  await journal.retry(prepared.request.id);
  assert.equal(opens, 2);
  await assert.rejects(uploadExerciseImage(f.client, { operationId: prepared.request.id, file }), {
    code: 'network_unavailable',
  });
  assert.equal(transfers, 1);
  await writeFile(file, Buffer.concat([png, Buffer.from('changed')]));
  await assert.rejects(uploadExerciseImage(f.client, { operationId: prepared.request.id, file }), {
    code: 'idempotency_mismatch',
  });
  assert.equal(transfers, 1);
  await writeFile(file, png);
  await uploadExerciseImage(f.client, { operationId: prepared.request.id, file });
  assert.equal(transfers, 2);
  const old = await f.store.read();
  await f.store.locked(() => f.store.write({ ...old, session_id: 'replacement' }));
  await assert.rejects(uploadExerciseImage(f.client, { operationId: prepared.request.id, file }), {
    code: 'operation_identity_mismatch',
  });
  assert.equal(transfers, 2);
});
test('foreign upload paths, symlinks, unknown fields and incoherent sequence edits are refused', async (t) => {
  let prepared;
  const f = await fixture(t, async () =>
    Response.json({ ...session(prepared), uploadPath: 'https://evil.example/upload' }),
  );
  const file = join(f.directory, 'photo.png'),
    alias = join(f.directory, 'alias.png');
  await writeFile(file, png);
  await symlink(file, alias);
  await assert.rejects(readExerciseImageFile(alias), { code: 'invalid_arguments' });
  prepared = await prepareExerciseImage({ exerciseId: 'custom', expectedEpoch: 'epoch', file });
  await assert.rejects(new CommandJournal(f.client).openExerciseMedia(prepared), {
    code: 'invalid_response',
  });
  const base = {
    exerciseId: 'custom',
    request: {
      operationId: randomUUID(),
      issuedAt: Date.now(),
      expectedEpoch: 'epoch',
      expectedRevision: '1',
      action: 'reorder',
      assetIds: [randomUUID()],
      sequence: true,
    },
  };
  assert.deepEqual(validateExerciseMediaChange(base), base);
  for (const request of [
    { ...base.request, assetIds: [base.request.assetIds[0], base.request.assetIds[0]] },
    { ...base.request, action: 'attach' },
    { ...base.request, ownerId: 'other' },
  ]) {
    assert.throws(() => validateExerciseMediaChange({ ...base, request }), {
      code: 'invalid_arguments',
    });
  }
});

test('4,000,000 bytes prepares unchanged, while one byte more is rejected before allocation or reservation', async (t) => {
  let requests = 0;
  const f = await fixture(t, async () => {
    requests++;
    throw Error('no network allowed');
  });
  assert.equal(maxExerciseUploadBytes, 4_000_000);
  assert.equal(maxExerciseReadBytes, 15_000_000);
  const file = join(f.directory, 'boundary.png');
  await writeFile(file, png);
  await truncate(file, maxExerciseUploadBytes);
  const before = await readFile(file);
  const prepared = await prepareExerciseImage({
    exerciseId: 'custom',
    expectedEpoch: 'epoch',
    file,
  });
  assert.equal(prepared.request.size, maxExerciseUploadBytes);
  assert.equal(prepared.request.sha256, createHash('sha256').update(before).digest('hex'));
  assert.deepEqual(validateExerciseMediaOpen(prepared), prepared);
  assert.throws(
    () =>
      validateExerciseMediaOpen({
        ...prepared,
        request: { ...prepared.request, size: maxExerciseUploadBytes + 1 },
      }),
    { code: 'invalid_arguments' },
  );
  await truncate(file, maxExerciseUploadBytes + 1);
  // The file reader checks stat.size before allocating or reading image bytes.
  await assert.rejects(
    prepareExerciseImage({ exerciseId: 'custom', expectedEpoch: 'epoch', file }),
    {
      code: 'exercise_media_too_large',
      status: 413,
    },
  );
  assert.equal((await readFile(file)).length, maxExerciseUploadBytes + 1);
  assert.equal(requests, 0);
});

test('server-optimized metadata is authoritative while retries retain the immutable input hash', async (t) => {
  let prepared, optimized;
  const requests = [];
  const f = await fixture(t, async (url, options) => {
    requests.push({ path: url.pathname, body: options.body });
    if (url.pathname.endsWith('/uploads')) {
      return Response.json(session(prepared));
    }
    assert.deepEqual(options.body, png);
    return Response.json(optimized);
  });
  const file = join(f.directory, 'input.png');
  await writeFile(file, png);
  prepared = await prepareExerciseImage({ exerciseId: 'custom', expectedEpoch: 'epoch', file });
  const journal = new CommandJournal(f.client);
  await journal.openExerciseMedia(prepared);
  optimized = session(prepared, 'ready');
  Object.assign(optimized.media.images[0], {
    contentType: 'image/webp',
    size: 50,
    fileName: 'input.webp',
  });
  const result = await uploadExerciseImage(f.client, { operationId: prepared.request.id, file });
  assert.deepEqual(result, optimized);
  const saved = await journal.inspect(prepared.request.id);
  assert.deepEqual(saved.request, prepared);
  assert.equal(saved.request.request.contentType, 'image/png');
  assert.equal(saved.uploadReceipt.media.images[0].contentType, 'image/webp');
  assert.deepEqual(
    await uploadExerciseImage(f.client, {
      operationId: prepared.request.id,
      file: '/no/such/file',
    }),
    optimized,
  );
  assert.equal(requests.length, 2);
  // Response validation also accepts genuinely changed stored dimensions.
  const resized = structuredClone(optimized);
  resized.media.images[0].width = 1600;
  resized.media.images[0].height = 800;
  const { validExerciseMediaSession } = await import('../src/exercise-media.mjs');
  assert.equal(
    validExerciseMediaSession(resized, {
      ...prepared,
      request: { ...prepared.request, width: 3200, height: 1600 },
    }),
    true,
  );
});

async function historicOperation(f, { state = 'confirmed', uploadState = 'confirmed' } = {}) {
  const savedSession = await f.client.session();
  const input = {
    exerciseId: 'custom',
    request: {
      id: randomUUID(),
      issuedAt: Date.now() - 1000,
      expectedEpoch: 'epoch',
      size: 15_000_000,
      sha256: 'a'.repeat(64),
      contentType: 'image/png',
      fileName: 'old.png',
      width: 1,
      height: 1,
    },
  };
  const row = {
    formatVersion: 1,
    protocol: 'exercise_media_open',
    binding: {
      origin: savedSession.origin,
      connectionId: savedSession.connection_id,
      profileId: savedSession.profile_id,
      sessionId: savedSession.session_id,
    },
    input,
    state,
    receipt: session(input),
    uploadState,
    ...(uploadState === 'confirmed' ? { uploadReceipt: session(input, 'ready') } : {}),
  };
  const journal = new CommandJournal(f.client),
    store = journal.store(input.request.id);
  await store.locked(() => store.write(row));
  return { journal, input, row, store };
}

test('historical 15 MB confirmed receipts replay locally without reading a source or accepting a new transfer', async (t) => {
  let requests = 0;
  const f = await fixture(t, async () => {
    requests++;
    throw Error('no network allowed');
  });
  const { journal, input, row } = await historicOperation(f);
  assert.deepEqual(await journal.retry(input.request.id), {
    source: 'local_receipt',
    receipt: row.receipt,
  });
  assert.deepEqual(
    await uploadExerciseImage(f.client, { operationId: input.request.id, file: '/no/such/file' }),
    row.uploadReceipt,
  );
  await assert.rejects(journal.openExerciseMedia(input), { code: 'invalid_arguments' });
  const old = await f.store.read();
  await f.store.locked(() => f.store.write({ ...old, session_id: 'other-session' }));
  await assert.rejects(journal.retry(input.request.id), { code: 'operation_identity_mismatch' });
  await assert.rejects(
    uploadExerciseImage(f.client, { operationId: input.request.id, file: '/no/such/file' }),
    { code: 'operation_identity_mismatch' },
  );
  assert.equal(requests, 0);
});

test('historical oversized pending intentions cannot resume and their immutable journal is untouched', async (t) => {
  let requests = 0;
  const f = await fixture(t, async () => {
    requests++;
    throw Error('no network allowed');
  });
  for (const state of ['confirmed', 'uncertain']) {
    const { journal, input, store } = await historicOperation(f, {
      state,
      uploadState: 'uncertain',
    });
    const before = await readFile(store.path, 'utf8');
    if (state === 'confirmed') {
      await assert.rejects(
        uploadExerciseImage(f.client, { operationId: input.request.id, file: '/no/such/file' }),
        { code: 'exercise_media_too_large' },
      );
      await assert.rejects(
        journal.uploadExerciseMediaBytes(input.request.id, Buffer.from('x'), 'a'.repeat(64)),
        { code: 'exercise_media_too_large' },
      );
    } else {
      await assert.rejects(journal.retry(input.request.id), { code: 'exercise_media_too_large' });
    }
    assert.equal(await readFile(store.path, 'utf8'), before);
  }
  assert.equal(requests, 0);
});

test('transport accepts exactly 4 MB uploads, rejects larger ones, and still reads historical 15 MB assets', async (t) => {
  let requests = 0;
  const f = await fixture(t, async (_url, options) => {
    requests++;
    return options.method === 'PUT'
      ? Response.json({ ok: true })
      : new Response(Buffer.alloc(15_000_000));
  });
  const path = `/api/agents/v1/exercise-media/${randomUUID()}/content`;
  await f.transport.request(path, { method: 'PUT', bytes: Buffer.alloc(4_000_000) });
  assert.equal(requests, 1);
  await assert.rejects(
    f.transport.request(path, { method: 'PUT', bytes: Buffer.alloc(4_000_001) }),
    { code: 'exercise_media_too_large' },
  );
  assert.equal(requests, 1);
  assert.equal((await f.transport.request(path, { binary: true })).length, 15_000_000);
  assert.equal(requests, 2);
});
