import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFile, readFile, symlink } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
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
  await assert.rejects(uploadExerciseImage(f.client, { operationId: prepared.request.id, file }), {
    code: 'idempotency_mismatch',
  });
  assert.equal(requests.length, 3);
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
