export interface SetPayloadField {
  kind: string;
  min?: number;
  max?: number;
  values?: readonly string[];
}
export interface SetPayloadSpec {
  property: 'targetSets' | 'performedSets';
  maxRows: number;
  maxCharacters: number;
  required: readonly string[];
  identity: readonly string[];
  fields: Record<string, SetPayloadField>;
}
export function setPayloadSpec(module: string): SetPayloadSpec | null;
export function invalidSetPayload(module: string, data: Record<string, unknown>): string | null;
