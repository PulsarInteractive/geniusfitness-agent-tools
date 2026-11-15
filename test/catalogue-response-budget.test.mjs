import test from 'node:test';
import assert from 'node:assert/strict';
import { Transport, ORIGINS } from '../src/transport.mjs';

const ordinaryLimit = 262144;
const reviewedLimit = 2 * 1024 * 1024;
const bodyOfSize = (size) => JSON.stringify({ note: 'x'.repeat(size - 11) });
const transport = (body, status = 200) =>
  new Transport(ORIGINS.development, {
    fetchImpl: async () => new Response(body, { status }),
  });

test('an explicit reviewed page can exceed the old 256 KiB cap, with a hard 2 MiB boundary', async () => {
  for (const size of [760985, reviewedLimit]) {
    const result = await transport(bodyOfSize(size)).request('/api/agents/catalogue/reviewed', {
      method: 'POST',
    });
    assert.equal(Buffer.byteLength(JSON.stringify(result)), size);
  }
  await assert.rejects(
    transport(bodyOfSize(reviewedLimit + 1)).request('/api/agents/catalogue/reviewed', {
      method: 'POST',
    }),
    { code: 'invalid_response' },
  );
});

test('all other JSON routes and unsuccessful reviewed reads retain the ordinary cap', async () => {
  for (const [path, method, status] of [
    ['/api/agents/catalogue/reviewed', 'GET', 200],
    ['/api/agents/catalogue/reviewed/ex.0294', 'GET', 200],
    ['/api/agents/catalogue/reviewed/ex.0294', 'POST', 200],
    ['/api/agents/catalogue/reviewed/extra', 'POST', 200],
    ['/api/agents/v1/resources', 'GET', 200],
    ['/api/agents/v1/commands', 'POST', 200],
    ['/api/agents/catalogue/reviewed', 'POST', 403],
    ['/api/agents/catalogue/reviewed', 'POST', 429],
    ['/api/agents/catalogue/reviewed', 'POST', 500],
  ]) {
    await assert.rejects(
      transport(bodyOfSize(ordinaryLimit + 1), status).request(path, { method }),
      { code: 'invalid_response' },
      `${method} ${path} / ${status}`,
    );
  }
  const value = await transport(bodyOfSize(ordinaryLimit)).request('/api/agents/v1/resources');
  assert.equal(Buffer.byteLength(JSON.stringify(value)), ordinaryLimit);
});

test('streamed reviewed reads enforce actual bytes and cancel before collecting an oversized body', async () => {
  let pulled = 0;
  let cancelled = false;
  const stream = new ReadableStream({
    pull(controller) {
      pulled++;
      controller.enqueue(new Uint8Array(65536));
    },
    cancel() {
      cancelled = true;
    },
  });
  const client = new Transport(ORIGINS.development, {
    fetchImpl: async () => new Response(stream, { headers: { 'Content-Length': '1' } }),
  });
  await assert.rejects(client.request('/api/agents/catalogue/reviewed', { method: 'POST' }), {
    code: 'invalid_response',
  });
  assert.equal(cancelled, true);
  assert.ok(pulled <= 35, 'The reader must stop at the byte boundary, allowing one queued chunk.');
});

test('UTF-8 bytes, rather than character counts, determine the reviewed response limit', async () => {
  const body = JSON.stringify({ note: 'é'.repeat(reviewedLimit / 2) });
  assert.ok(body.length < reviewedLimit);
  await assert.rejects(
    transport(body).request('/api/agents/catalogue/reviewed', { method: 'POST' }),
    { code: 'invalid_response' },
  );
});
