import { prisma } from "./db";
import { pdfUrlFor, type SourceCard } from "./types";

const STOPWORDS = new Set([
  "millal", "kuidas", "kaua", "kellel", "kelle", "kust", "miks", "mida", "millise", "millised",
  "mille", "kas", "või", "ning", "aga", "see", "seda", "need", "oma", "ära", "olla", "saab",
  "peab", "vaja", "kui", "mis", "mul", "meil", "sind", "teda", "koos", "ilma", "kohta", "puhul",
]);

/** Lower-cased words of the question with stop words removed. */
export function tokenize(question: string): string[] {
  const words = question.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  return [...new Set(words.filter((w) => w.length >= 3 && !STOPWORDS.has(w)))];
}

/** Estonian words inflect at the end, so match on a shortened stem. */
export function stem(word: string): string {
  return word.length >= 6 ? word.slice(0, word.length - 2) : word;
}

type Row = Omit<SourceCard, "pdfUrl" | "terms"> & { score: number };

export async function searchChunks(
  question: string,
  procedureType: string | null,
  limit: number,
): Promise<SourceCard[]> {
  const terms = tokenize(question);
  if (terms.length === 0) return [];
  const stems = terms.map(stem);
  const tsQuery = stems.map((s) => `${s}:*`).join(" | ");
  const trgmText = stems.join(" ");

  const rows = await prisma.$queryRaw<Row[]>`
    SELECT id, "sourceFile", "docTitle", "procedureType", section, content,
      (
        ts_rank_cd(
          to_tsvector('simple', "docTitle" || ' ' || section || ' ' || content),
          to_tsquery('simple', ${tsQuery})
        ) * 2
        + word_similarity(${trgmText}, section || ' ' || content)
      )::float AS score
    FROM "DocumentChunk"
    WHERE (${procedureType}::text IS NULL OR "procedureType" = ${procedureType})
      AND (
        to_tsvector('simple', "docTitle" || ' ' || section || ' ' || content)
          @@ to_tsquery('simple', ${tsQuery})
        OR word_similarity(${trgmText}, section || ' ' || content) > 0.35
      )
    ORDER BY score DESC
    LIMIT ${limit}
  `;

  return rows.map(({ score: _score, ...row }) => ({
    ...row,
    pdfUrl: pdfUrlFor(row.sourceFile),
    terms: stems,
  }));
}
