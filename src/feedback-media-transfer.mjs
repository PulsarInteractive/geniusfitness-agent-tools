import { basename } from 'node:path';
import { randomUUID } from 'node:crypto';
import { readExerciseImageFile } from './exercise-media-transfer.mjs';
import { validateFeedbackUpload } from './feedback.mjs';
import { CommandJournal } from './commands.mjs';

/** Reuse the bounded static-image reader; the server independently validates
 * and compresses every upload, including hosted attachment imports. */
export async function prepareFeedbackImage({ draftId, expectedEpoch, file }) {
  const image = { ...(await readExerciseImageFile(file)) };
  delete image.bytes;
  return validateFeedbackUpload({
    id: randomUUID(),
    draftId,
    expectedEpoch,
    issuedAt: Date.now(),
    fileName: basename(file),
    ...image,
  });
}
export async function uploadFeedbackImage(client, { operationId, file }) {
  const journal = new CommandJournal(client);
  const confirmed = await journal.confirmedFeedbackMediaUpload(operationId);
  if (confirmed) {
    return confirmed;
  }
  const image = await readExerciseImageFile(file);
  return journal.uploadFeedbackMediaBytes(operationId, image.bytes, image.sha256);
}
