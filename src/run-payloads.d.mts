export function invalidRunPayload(
  module: string,
  data: Record<string, unknown>,
  options?: { create?: boolean },
): 'runPlan' | 'planProgress' | null;
export function runPayloadSpec(module: string): Record<string, unknown> | null;
