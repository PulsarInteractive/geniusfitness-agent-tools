import {
  validateRecurringSessionSkipConfirmation,
  validRecurringSessionSkipReceipt,
} from './recurring-session-skip.mjs';
import { validateSessionSkipConfirmation, validSessionSkipReceipt } from './session-skip.mjs';
import { validTemporaryCommand } from './temporary-actions.mjs';
import { validTemporaryCommandV3 } from './temporary-actions-v3.mjs';
import { invalidRunPayload } from './run-payloads.mjs';
import { coachPushProposalSchema, coachPushWithdrawalSchema } from './coach-push.mjs';
import { retryAt, requireRetryReady } from './recovery.mjs';
import { randomUUID, createHash } from 'node:crypto';
import {
  maxExerciseUploadBytes,
  oversizedExerciseUploadMessage,
} from './exercise-media-limits.mjs';
import { constants } from 'node:fs';
import { open } from 'node:fs/promises';
import { join } from 'node:path';
import * as z from 'zod/v4';
import catalog from './command-catalog.mjs';
import { CredentialStore } from './store.mjs';
import { AgentError, fail, safeError } from './errors.mjs';
import { invalidSetPayload } from './set-payloads.mjs';
import { validateCustomExerciseMetadata } from './custom-exercise.mjs';
import {
  validateExerciseMediaOpen,
  validateHistoricalExerciseMediaOpen,
  validateExerciseMediaChange,
  validExerciseMediaSession,
  validExerciseMediaChange,
} from './exercise-media.mjs';

export const operationIdSchema = z
  .string()
  .regex(/^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/);
const identifier = z
  .string()
  .min(1)
  .max(128)
  // eslint-disable-next-line no-control-regex -- Reject control characters in untrusted input.
  .regex(/^[^\u0000-\u001f]+$/u);
export const commandSchema = z
  .object({
    operationId: operationIdSchema,
    issuedAt: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
    scope: z
      .string()
      .max(256)
      // eslint-disable-next-line no-control-regex -- Reject control characters in untrusted input.
      .regex(/^(project|personal):[^\u0000-\u001f]+$/u),
    epoch: identifier,
    id: identifier,
    expectedRevision: z
      .string()
      .regex(/^[1-9][0-9]{0,15}$/)
      .nullable(),
    kind: z.enum(Object.keys(catalog.commands)),
    data: z.record(z.string(), z.json()),
  })
  .strict();
export const draftSchema = commandSchema.omit({ operationId: true, issuedAt: true });
const canonical = (value) =>
  JSON.stringify(value, (_, item) =>
    item && typeof item === 'object' && !Array.isArray(item)
      ? Object.fromEntries(
          Object.keys(item)
            .sort()
            .map((key) => [key, item[key]]),
        )
      : item,
  );
const checked = (schema, value) => {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    fail(
      'invalid_arguments',
      'The command does not match its schema. Use commands describe; do not supply credentials or server-owned fields.',
    );
  }
  return parsed.data;
};
/** Validate the public envelope, generated field allowlist and resource scope. */
export function validateCommand(value) {
  const command = checked(commandSchema, value),
    definition = catalog.commands[command.kind];
  if (['exercise.create', 'exercise.update'].includes(command.kind)) {
    validateCustomExerciseMetadata(command.data);
  }
  if (
    Buffer.byteLength(JSON.stringify(command)) > catalog.maxCommandBytes ||
    Object.keys(command.data).some((key) => !definition.fields.includes(key)) ||
    (definition.revisionMode !== 'occurrence' &&
      (definition.create ? command.expectedRevision !== null : command.expectedRevision === null))
  ) {
    fail(
      'invalid_arguments',
      'Use the declared command fields and size limit. Creation requires a null revision; other commands require the current record revision.',
    );
  }
  if (
    command.kind.startsWith('coach.intent.') &&
    !(command.data.representationVersion === 3
      ? validTemporaryCommandV3(command)
      : validTemporaryCommand(command))
  ) {
    fail(
      'invalid_arguments',
      'Resolve the exact temporary target and use the current athlete-intents revision. Cancel/apply require null proposal fields in the selected version; regional apply is not supported.',
    );
  }
  if (command.kind.startsWith('coach.push.')) {
    const schema =
      command.kind === 'coach.push.propose' ? coachPushProposalSchema : coachPushWithdrawalSchema;
    if (
      !z.string().uuid().safeParse(command.id).success ||
      !schema.safeParse(command.data).success
    ) {
      fail(
        'invalid_arguments',
        'Use an exact proposal UUID and declared occurrence fields. Only the athlete can confirm; numerical targets are never command fields.',
      );
    }
  }
  const invalidRun = invalidRunPayload(definition.module, command.data, {
    create: definition.create === true,
  });
  if (invalidRun) {
    fail(
      'invalid_arguments',
      `${invalidRun} must use command help encodedRun; preserve missing history and supplied stage order.`,
      { property: invalidRun },
    );
  }
  const prefix = definition.module.startsWith('LocalUser/') ? 'personal:' : 'project:';
  const invalidPayload = invalidSetPayload(definition.module, command.data);
  if (invalidPayload) {
    fail(
      'invalid_arguments',
      `${invalidPayload} must use the declared set encoding. Read command help; do not invent metrics or silently drop fields.`,
      { property: invalidPayload },
    );
  }
  if (
    !command.scope.startsWith(prefix) ||
    (definition.module.endsWith('/$') && command.id !== command.scope.slice(prefix.length))
  ) {
    fail('invalid_arguments', 'The command must target the matching program or personal scope.');
  }
  if (
    command.kind === 'program.create' &&
    (!/^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i.test(command.id) ||
      command.epoch !== command.id)
  ) {
    fail(
      'invalid_arguments',
      'Create a program with a UUID v4 as id, the same initial epoch, and scope project:<id>. Include title and icon.',
    );
  }
  return command;
}
export function describeCommands() {
  return {
    ...catalog,
    envelope: z.toJSONSchema(commandSchema),
    draft: z.toJSONSchema(draftSchema),
    recovery:
      'Retain operationId, issuedAt and the complete body. Retry an uncertain write unchanged; reread before creating a new edit after a conflict.',
  };
}
/** Read one bounded regular JSON file, rejecting symlinks and non-file inputs. */
export async function readCommandFile(path) {
  if (typeof path !== 'string') {
    fail('invalid_arguments', 'Supply --file with a JSON command or draft.');
  }
  let handle;
  try {
    handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
    const stat = await handle.stat();
    if (!stat.isFile() || stat.size > catalog.maxCommandBytes) {
      fail(
        'invalid_arguments',
        `Use a regular JSON file no larger than ${catalog.maxCommandBytes} bytes.`,
      );
    }
    const bytes = Buffer.alloc(catalog.maxCommandBytes + 1),
      result = await handle.read(bytes, 0, bytes.length, 0);
    if (result.bytesRead > catalog.maxCommandBytes) {
      fail('invalid_arguments', `Command file exceeds ${catalog.maxCommandBytes} bytes.`);
    }
    return JSON.parse(bytes.subarray(0, result.bytesRead).toString('utf8'));
  } catch (error) {
    if (error instanceof AgentError) {
      throw error;
    }
    fail('invalid_arguments', 'Could not read a regular, valid JSON command file.');
  } finally {
    await handle?.close();
  }
}
const binding = (session) => ({
  origin: session.origin,
  connectionId: session.connection_id,
  profileId: session.profile_id,
  sessionId: session.session_id,
});
const receiptSchema = z
  .object({
    operationId: operationIdSchema,
    scope: z.string(),
    kind: z.string(),
    epoch: z.string(),
    cursor: z.string(),
    items: z.array(
      z
        .object({
          id: z.string(),
          revision: z.string(),
          collection: z.string(),
          deleted: z.boolean(),
        })
        .strict(),
    ),
    affectedCollections: z.array(z.string()),
  })
  .strict();

// Typed confirmations share the original durable journal and identity lock.
// The discriminator prevents reusing a UUID through a different endpoint.
const confirmationProtocols = {
  exercise_media_open: {
    validate: validateExerciseMediaOpen,
    validReceipt: validExerciseMediaSession,
    operationId: (input) => input.request.id,
    path: (input) => `/api/agents/v1/exercises/${input.exerciseId}/media/uploads`,
    body: (input) => input.request,
  },
  exercise_media_change: {
    validate: validateExerciseMediaChange,
    validReceipt: validExerciseMediaChange,
    path: (input) => `/api/agents/v1/exercises/${input.exerciseId}/media/change`,
    body: (input) => input.request,
  },
  session_skip: {
    validate: validateSessionSkipConfirmation,
    validReceipt: validSessionSkipReceipt,
    path: '/api/agents/v1/session-skip/confirm',
  },
  recurring_session_skip: {
    validate: validateRecurringSessionSkipConfirmation,
    validReceipt: validRecurringSessionSkipReceipt,
    path: '/api/agents/v1/session-skip/recurring/confirm',
  },
};

/** A journal is bound to one authenticated terminal identity. Persist the full
 * request before the network call, never regenerate a UUID after a timeout.
 * It contains private project text but no access/refresh tokens. A process crash
 * leaves its operation lock for explicit recovery after all clients stop. */
export class CommandJournal {
  constructor(client) {
    this.client = client;
  }
  store(id) {
    checked(operationIdSchema, id);
    return new CredentialStore({
      directory: join(this.client.store.directory, 'operations', this.client.store.context),
      context: id,
      maxBytes: 524288,
    });
  }
  async prepare(draft) {
    const input = validateCommand({
      ...checked(draftSchema, draft),
      operationId: randomUUID(),
      issuedAt: Date.now(),
    });
    const identity = binding(await this.client.session()),
      store = this.store(input.operationId);
    await store.locked(
      () => store.write({ formatVersion: 1, binding: identity, input, state: 'prepared' }),
      this.client.transport.signal,
    );
    return { operationId: input.operationId, state: 'prepared', request: input };
  }
  async inspect(id) {
    const row = await this.store(id).read();
    if (
      !row ||
      row.formatVersion !== 1 ||
      (row.protocol !== undefined && !Object.hasOwn(confirmationProtocols, row.protocol)) ||
      (row.protocol
        ? (confirmationProtocols[row.protocol].operationId?.(row.input) ??
          row.input?.request?.operationId)
        : row.input?.operationId) !== id
    ) {
      fail('operation_not_found', 'This context has no valid local operation with that ID.');
    }
    return {
      operationId: id,
      source: 'local_journal',
      ...(row.protocol ? { protocol: row.protocol } : {}),
      state: row.state,
      request: row.input,
      ...(row.receipt ? { receipt: row.receipt } : {}),
      ...(row.error ? { error: row.error } : {}),
      ...(row.retryAt ? { retryAt: row.retryAt } : {}),
      ...(row.uploadState
        ? {
            uploadState: row.uploadState,
            uploadReceipt: row.uploadReceipt,
            uploadRetryAt: row.uploadRetryAt,
          }
        : {}),
    };
  }
  async execute(value) {
    return this.#execute(value);
  }
  /** Additive canonical protocol; the same lock, identity binding and durable
   * operation journal own both command kinds. No synthetic AgentCommand. */
  async confirmSessionSkip(value) {
    return this.#execute(value, 'session_skip');
  }
  async confirmRecurringSessionSkip(value) {
    return this.#execute(value, 'recurring_session_skip');
  }
  async openExerciseMedia(value) {
    return this.#execute(value, 'exercise_media_open');
  }
  async changeExerciseMedia(value) {
    return this.#execute(value, 'exercise_media_change');
  }
  async #exerciseMediaUploadRow(store) {
    const identity = binding(await this.client.session());
    const row = await store.read();
    if (
      !row ||
      row.formatVersion !== 1 ||
      row.input?.request?.id !== store.context ||
      row.protocol !== 'exercise_media_open' ||
      row.state !== 'confirmed' ||
      !validExerciseMediaSession(row.receipt, row.input)
    ) {
      fail(
        'operation_not_found',
        'Confirm the saved upload reservation first. Recover an uncertain reservation with commands retry.',
      );
    }
    if (canonical(row.binding) !== canonical(identity)) {
      fail(
        'operation_identity_mismatch',
        'The upload belongs to another connection, profile, session or environment.',
      );
    }
    return { identity, row };
  }
  #confirmedMediaReceipt(row) {
    if (row.uploadState !== 'confirmed') {
      return null;
    }
    if (
      !validExerciseMediaSession(row.uploadReceipt, row.input) ||
      row.uploadReceipt.state !== 'ready'
    ) {
      fail(
        'invalid_response',
        'The saved photo receipt is invalid. Inspect the operation before acting.',
      );
    }
    return row.uploadReceipt;
  }
  #requireCurrentMediaSize(row) {
    if (row.input.request.size > maxExerciseUploadBytes) {
      fail('exercise_media_too_large', oversizedExerciseUploadMessage, { status: 413 });
    }
  }
  /** A confirmed upload can be replayed without reopening the source file.
   * The same identity and receipt checks still apply; no HTTP request is made. */
  async confirmedExerciseMediaUpload(id) {
    const store = this.store(id);
    return store.locked(async () => {
      const { row } = await this.#exerciseMediaUploadRow(store);
      const receipt = this.#confirmedMediaReceipt(row);
      if (!receipt) {
        this.#requireCurrentMediaSize(row);
      }
      return receipt;
    }, this.client.transport.signal);
  }
  /** Binary transfer uses the already-confirmed immutable reservation. It
   * never renews an uncertain reservation or retries another request silently. */
  async uploadExerciseMediaBytes(id, bytes, sha256) {
    const store = this.store(id);
    return store.locked(async () => {
      const { identity, row } = await this.#exerciseMediaUploadRow(store);
      const confirmed = this.#confirmedMediaReceipt(row);
      if (confirmed) {
        return confirmed;
      }
      this.#requireCurrentMediaSize(row);
      if (
        !Buffer.isBuffer(bytes) ||
        bytes.length !== row.input.request.size ||
        sha256 !== row.input.request.sha256 ||
        createHash('sha256').update(bytes).digest('hex') !== row.input.request.sha256
      ) {
        fail(
          'idempotency_mismatch',
          'The image bytes changed after preparation. Do not reuse this reservation.',
        );
      }
      requireRetryReady(row.uploadRetryAt);
      const session = await this.client.authorizedSession();
      if (canonical(binding(session)) !== canonical(identity)) {
        fail('operation_identity_mismatch', 'The connection changed before upload.');
      }
      await store.write({ ...row, uploadState: 'uncertain' });
      this.client.invalidateReads?.();
      try {
        const result = await this.client.transport.request(row.receipt.uploadPath, {
          method: 'PUT',
          token: session.access_token,
          bytes,
        });
        if (!validExerciseMediaSession(result, row.input) || result.state !== 'ready') {
          fail(
            'invalid_response',
            'The photo upload receipt is invalid. Retry the same bytes and reservation.',
            { execution: 'unknown' },
          );
        }
        await store.write({ ...row, uploadState: 'confirmed', uploadReceipt: result });
        return result;
      } catch (error) {
        const safe = safeError(error);
        await store
          .write({
            ...row,
            uploadState: 'uncertain',
            uploadRetryAt: retryAt(error),
            uploadError: safe.toJSON(),
          })
          .catch(() => {});
        throw new AgentError(safe.code, safe.message, {
          status: safe.status,
          retryable: safe.retryable,
          ...safe.details,
          execution: 'unknown',
          operationId: id,
        });
      }
    }, this.client.transport.signal);
  }
  async #execute(value, protocol, historicalReceipt = false) {
    const typed = protocol ? confirmationProtocols[protocol] : null,
      input =
        historicalReceipt && protocol === 'exercise_media_open'
          ? validateHistoricalExerciseMediaOpen(value)
          : typed
            ? typed.validate(value)
            : validateCommand(value),
      operationId = typed
        ? (typed.operationId?.(input) ?? input.request.operationId)
        : input.operationId,
      store = this.store(operationId);
    return store.locked(async () => {
      // Capture token and identity together under the refresh lock. A later
      // logout/login cannot turn this pending operation into another profile.
      const localSession = await this.client.session(),
        identity = binding(localSession);
      let row = await store.read();
      if (row && (row.formatVersion !== 1 || canonical(row.binding) !== canonical(identity))) {
        fail(
          'operation_identity_mismatch',
          'This operation belongs to another connection, profile, session or environment.',
          {
            remediation:
              'Inspect it locally and reread current records. Do not replay it through a replacement login.',
          },
        );
      }
      if (row && (row.protocol !== protocol || canonical(row.input) !== canonical(input))) {
        fail(
          'idempotency_mismatch',
          'The operation ID already belongs to a different immutable request.',
          { status: 409, remediation: 'Use commands inspect, then retry the saved operation.' },
        );
      }
      if (row?.state === 'confirmed') {
        if (typed && !typed.validReceipt(row.receipt, input)) {
          fail(
            'invalid_response',
            'The saved session receipt is invalid; retain the operation and inspect it before acting.',
          );
        }
        return { source: 'local_receipt', receipt: row.receipt };
      }
      if (protocol === 'exercise_media_open') {
        this.#requireCurrentMediaSize({ input });
        validateExerciseMediaOpen(input);
      }
      requireRetryReady(row?.retryAt);
      const session = await this.client.authorizedSession();
      if (canonical(binding(session)) !== canonical(identity)) {
        fail('operation_identity_mismatch', 'The connection changed before transmission.');
      }
      row = {
        formatVersion: 1,
        ...(protocol ? { protocol } : {}),
        binding: identity,
        input,
        state: 'uncertain',
      };
      await store.write(row);
      try {
        if (protocol) {
          this.client.invalidateReads?.();
        }
        const receipt = await this.client.transport.request(
          typed
            ? typeof typed.path === 'function'
              ? typed.path(input)
              : typed.path
            : '/api/agents/v1/commands',
          {
            method: 'POST',
            json: typed?.body ? typed.body(input) : input,
            token: session.access_token,
          },
        );
        if (
          typed
            ? !typed.validReceipt(receipt, input)
            : !receiptSchema.safeParse(receipt).success ||
              ['operationId', 'scope', 'kind', 'epoch'].some((key) => receipt[key] !== input[key])
        ) {
          fail(
            'invalid_response',
            'The command receipt was invalid. The server may have committed.',
            { execution: 'unknown', remediation: 'Retry the identical saved operation.' },
          );
        }
        await store.write({ ...row, state: 'confirmed', receipt });
        return { source: 'server', receipt };
      } catch (error) {
        const safe = safeError(error);
        const result = new AgentError(safe.code, safe.message, {
          status: safe.status,
          retryable: safe.retryable,
          remediation: safe.remediation,
          execution: 'unknown',
          ...safe.details,
          operationId,
        });
        // The uncertainty marker is already durable. Preserve the useful original
        // error/operation ID even if disk pressure prevents saving diagnostics.
        await store
          .write({ ...row, retryAt: retryAt(result), error: result.toJSON() })
          .catch(() => {});
        throw result;
      } finally {
        if (protocol) {
          this.client.invalidateReads?.();
        }
      }
    }, this.client.transport.signal);
  }
  async retry(id) {
    const saved = await this.inspect(id);
    return this.#execute(saved.request, saved.protocol, true);
  }
}
