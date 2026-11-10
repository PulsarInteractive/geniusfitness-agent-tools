// Generated public contract declaration. Do not edit by hand.
type PublicSchema = Record<string, unknown>;
declare const contract: {
  ReadRequest: PublicSchema;
  ResolveRequest: PublicSchema;
  AgentData: PublicSchema;
  Snapshot: PublicSchema;
  Resolved: PublicSchema;
  RegionalPolicy: {
    policyVersion: string;
    representationVersion: 3;
    levels: string[];
    kind: {
      key: string;
      effect: string;
      objectives: string[];
      targetTypes: string[];
      maxDurationMs: number;
      singleUse: boolean;
    };
    guidance: string;
  };
};
export default contract;
