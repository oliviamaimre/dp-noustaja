export type SourceCard = {
  id: string;
  sourceFile: string;
  docTitle: string;
  procedureType: string;
  section: string;
  content: string;
  pdfUrl: string;
  terms: string[];
};

export type ChatMessage = {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  sources: SourceCard[] | null;
  createdAt: string;
};

export type ChatSummary = {
  id: string;
  title: string;
  procedureType: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SourceDoc = {
  sourceFile: string;
  docTitle: string;
  procedureType: string;
  pdfUrl: string;
};

export const MAX_MESSAGE_LENGTH = 1000;

export function pdfUrlFor(sourceFile: string) {
  return `/sources/${encodeURIComponent(sourceFile)}.pdf`;
}
