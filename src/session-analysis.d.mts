export interface SessionRecord {
  id: string;
  revision: string;
  data?: Record<string, unknown>;
}
export interface SessionPage {
  scope: string;
  epoch: string;
  checkpoint: string;
  items?: SessionRecord[];
  omittedIds?: string[];
}
export function sessionAnalysis(record: SessionRecord, offset?: number): Record<string, unknown>;
export function analyzeSessionPage(
  page: SessionPage,
  id: string,
  offset?: number,
): {
  scope: string;
  epoch: string;
  checkpoint: string;
  availability: 'available' | 'omitted' | 'not_found';
  analysis: Record<string, unknown> | null;
};
