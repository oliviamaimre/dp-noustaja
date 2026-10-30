export type ChunkInput = {
  sourceFile: string;
  docTitle: string;
  procedureType: string;
  section: string;
  content: string;
};

const HEADING =
  /^(ÜLDINE|LÜHENDID|TÄHELEPANU|PANE TÄHELE|PEAMISED TÄHTAJAD|MENETLUSE ETAPID|ETAPP\s+\d+\.)/;

/** Derives the procedure type from a knowledge file name (extension optional). */
export function procedureTypeFromFile(fileName: string): string {
  const base = fileName
    .replace(/\.[^.]+$/, "")
    .replace(/^\d{4}_/, "")
    .toLowerCase()
    .replace(/[-\s]+/g, "_");

  if (base.startsWith("dpd_muutev_dp")) return "DP-d muutev DP";
  const ksh = base.endsWith("kshga") ? "KSH-ga" : base.endsWith("kshta") ? "KSH-ta" : null;
  if (ksh && base.includes("dp_kohane")) return `ÜP kohane, ${ksh}`;
  if (ksh && base.includes("dp_muutev")) return `ÜP-d muutev, ${ksh}`;
  return "Üldine";
}

/** Splits one knowledge text file into chunks by section heading. */
export function chunkDocument(fileName: string, text: string): ChunkInput[] {
  const sourceFile = fileName.replace(/\.[^.]+$/, "");
  const procedureType = procedureTypeFromFile(fileName);
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const docTitle = (lines.find((l) => l.trim()) ?? sourceFile).trim();

  const chunks: ChunkInput[] = [];
  let section = "Allikas ja märkused";
  let buffer: string[] = [];
  let titleSkipped = false;

  const flush = () => {
    const content = buffer.join("\n").trim();
    if (content) chunks.push({ sourceFile, docTitle, procedureType, section, content });
    buffer = [];
  };

  for (const line of lines) {
    if (!titleSkipped) {
      if (line.trim()) titleSkipped = true;
      continue;
    }
    if (HEADING.test(line.trim())) {
      flush();
      section = line.trim();
    } else {
      buffer.push(line);
    }
  }
  flush();
  return chunks;
}
