import * as z from 'zod/v4';
import contract from './temporary-actions-v3-contract.mjs';
import catalog from './command-catalog.mjs';
import { fail } from './errors.mjs';

// Wire shapes come only from the public TypeSpec snapshot. Relationships between
// branches, targets and policy are checked here, outside the schema generator.
export const temporaryReadV3Schema = z.fromJSONSchema(contract.ReadRequest);
export const temporaryResolveV3Schema = z.fromJSONSchema(contract.ResolveRequest);
const dataSchema = z.fromJSONSchema(contract.AgentData);
const snapshotSchema = z.fromJSONSchema(contract.Snapshot);
const resolvedSchema = z.fromJSONSchema(contract.Resolved);
const regionalPolicy = contract.RegionalPolicy;
const focusPolicy = catalog.temporaryFocus;
const uuid = z.string().uuid();
const liveStates = new Set(['active', 'scheduled']);
const sameTarget = (a, b) =>
  Object.keys(a).length === Object.keys(b).length &&
  Object.keys(a).every((key) => a[key] === b[key]);
const branch = (value) =>
  ['exercise', 'regional'].includes(value.targetKind) &&
  value[value.targetKind] !== null &&
  value[value.targetKind === 'exercise' ? 'regional' : 'exercise'] === null;
const targetMatches = (target, scope, sessionId) =>
  target !== null &&
  target.projectId === scope.slice(8) &&
  target.sessionId === sessionId &&
  (target.sessionId === null) !== (target.occurrenceId === null) &&
  (target.occurrenceId === null || target.occurrenceId.length > 0);
const windowValid = (start, end, maximum = 7 * 86400000) =>
  typeof start === 'string' &&
  typeof end === 'string' &&
  Date.parse(end) > Date.parse(start) &&
  Date.parse(end) - Date.parse(start) <= maximum;
function focusValid(focus, current) {
  if (
    focus === null ||
    focus === undefined ||
    focus.selected.length < focusPolicy.selection.minimum ||
    focus.selected.length > focusPolicy.selection.maximum ||
    new Set(focus.selected).size !== focus.selected.length ||
    (focus.priority !== null && !focus.selected.includes(focus.priority))
  ) {
    return false;
  }
  return (
    (!current || focus.policyVersion === focusPolicy.policyVersion) &&
    (focus.policyVersion !== focusPolicy.policyVersion ||
      focus.selected.every((axis) => focusPolicy.selection.choices.includes(axis)))
  );
}
function exerciseValuesValid(value, current) {
  return (
    (value.kind === 'skip') === (value.objective === 'skip_once') &&
    (value.objective === 'multiple_axes'
      ? value.kind === 'focus' && focusValid(value.focusSelection, current)
      : value.focusSelection === null)
  );
}
function regionalValid(value, current) {
  return (
    value !== null &&
    (value.upper !== null || value.lower !== null) &&
    (!current || value.policyVersion === regionalPolicy.policyVersion)
  );
}
function requestMatches(request) {
  if (!branch(request)) {
    return false;
  }
  if (request.targetKind === 'regional') {
    const r = request.regional;
    return (
      targetMatches(r.target, request.scope, request.sessionId) &&
      regionalValid(r.regionalEmphasis, true) &&
      windowValid(r.startsAt, r.endsAt, regionalPolicy.kind.maxDurationMs)
    );
  }
  const e = request.exercise;
  return e.selection === 'exact'
    ? targetMatches(e.target, request.scope, request.sessionId)
    : request.sessionId !== null && e.target === null;
}
/** Validation never converts a V3 body to v2. The complete caller body remains
 * the journal fingerprint; schema/help metadata is not an authority grant. */
export function validTemporaryCommandV3(command) {
  const parsed = dataSchema.safeParse(command.data);
  if (
    !parsed.success ||
    !uuid.safeParse(command.id).success ||
    !/^project:[A-Za-z0-9_-]{1,128}$/.test(command.scope) ||
    !['coach.intent.set', 'coach.intent.cancel', 'coach.intent.apply'].includes(command.kind)
  ) {
    return false;
  }
  const data = parsed.data;
  if (!branch(data)) {
    return false;
  }
  const selected = data[data.targetKind];
  if (command.kind !== 'coach.intent.set') {
    return (
      !(data.targetKind === 'regional' && command.kind === 'coach.intent.apply') &&
      command.expectedRevision !== null &&
      Object.values(selected).every((value) => value === null)
    );
  }
  if (
    !['kind', 'objective', 'target', 'sourceVersion', 'startsAt', 'endsAt'].every(
      (key) => selected[key] !== null,
    ) ||
    !targetMatches(selected.target, command.scope, data.sessionId)
  ) {
    return false;
  }
  return data.targetKind === 'regional'
    ? regionalValid(selected.regionalEmphasis, true) &&
        windowValid(selected.startsAt, selected.endsAt, regionalPolicy.kind.maxDurationMs)
    : exerciseValuesValid(selected, true) && windowValid(selected.startsAt, selected.endsAt);
}
function snapshotMatches(view, request) {
  if (!view.epoch || (view.revision !== null && !/^[1-9][0-9]{0,15}$/.test(view.revision))) {
    return false;
  }
  const ids = new Set();
  return view.entries.every((item) => {
    const regional = item.kind === 'regional_emphasis';
    if (
      (item.exercise === null) === (item.regional === null) ||
      regional !== (item.regional !== null)
    ) {
      return false;
    }
    const e = regional ? item.regional : item.exercise;
    if (
      item.kind !== e.kind ||
      ids.has(e.id) ||
      e.target.projectId !== request.scope.slice(8) ||
      (request.sessionId !== null && e.target.sessionId !== request.sessionId) ||
      (e.target.sessionId === null) === (e.target.occurrenceId === null) ||
      (e.target.occurrenceId !== null && e.target.occurrenceId.length === 0) ||
      !windowValid(e.startsAt, e.endsAt, regional ? regionalPolicy.kind.maxDurationMs : undefined)
    ) {
      return false;
    }
    ids.add(e.id);
    return regional
      ? regionalValid(e.regionalEmphasis, liveStates.has(e.state))
      : exerciseValuesValid(e, liveStates.has(e.state));
  });
}
function resolvedMatches(view, request) {
  if (!branch(view) || view.targetKind !== request.targetKind) {
    return false;
  }
  const result = view[view.targetKind];
  if (
    !targetMatches(result.target, request.scope, request.sessionId) ||
    new Set(result.replaces).size !== result.replaces.length ||
    result.replaces.some((id) => !uuid.safeParse(id).success)
  ) {
    return false;
  }
  const requested = request[request.targetKind];
  return requested.selection !== 'exact' || sameTarget(result.target, requested.target);
}
/** One authorized bounded POST read, with no cached response, journal entry,
 * fallback version, automatic continuation or mutation. */
export async function readTemporaryActionsV3(client, input, resolve = false) {
  const parsed = (resolve ? temporaryResolveV3Schema : temporaryReadV3Schema).safeParse(input);
  if (!parsed.success || (resolve && !requestMatches(parsed.data))) {
    fail(
      'invalid_arguments',
      'Use one explicit V3 athlete program with sessionId (null for scheduled targets), and exactly one matching exercise or regional branch.',
    );
  }
  const request = parsed.data;
  const token = await client.accessToken();
  const response = await client.transport.request(
    `/api/agents/v1/coach-intents/v3/${resolve ? 'resolve' : 'read'}`,
    {
      method: 'POST',
      token,
      json: request,
    },
  );
  const result = (resolve ? resolvedSchema : snapshotSchema).safeParse(response);
  if (
    !result.success ||
    !snapshotMatches(result.data, request) ||
    (resolve && !resolvedMatches(result.data, request))
  ) {
    fail(
      'invalid_response',
      'The complete V3 response must match the selected athlete program, branch and exact target. Stop rather than downgrade or infer missing instructions.',
    );
  }
  return result.data;
}
