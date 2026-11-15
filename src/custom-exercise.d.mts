export const customExerciseGuidance: {
  taxonomyVersion: string;
  targets: Array<{
    id: string;
    parentId: string | null;
    labelFr: string;
    labelEn: string;
    kind: string;
  }>;
  qualification: string;
  meaning: string;
  allocation: string;
  editing: string;
  localization: string;
};
export function validateCustomExerciseMetadata(data: Record<string, unknown>): void;
