import contract from './exercise-media-contract.mjs';

// New byte transfers and historical reads have intentionally different bounds.
export const maxExerciseUploadBytes =
  contract.definitions['GeniusFitness.ExerciseMedia.Upload'].properties.size.maximum;
export const maxExerciseReadBytes =
  contract.definitions['GeniusFitness.ExerciseMedia.Image'].properties.size.maximum;
export const oversizedExerciseUploadMessage =
  'New photo transfers are limited to 4,000,000 bytes. Prepare a smaller source file as a new operation; never replace the bytes of an existing reservation.';
