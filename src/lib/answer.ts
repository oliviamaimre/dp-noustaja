import type { SourceCard } from "./types";

const MODEL = "claude-haiku-5-5";

const SYSTEM_PROMPT = `Sa oled DP-nõustaja, kes vastab küsimustele Eesti detailplaneeringu menetluse kohta.
Vasta eesti keeles ja AINULT allolevast dokumenditekstist. Ära kasuta muid teadmisi ega oma oletusi.
Viita allikatele kujul [dokument, jaotis]. Kui vastust dokumentides ei ole, ütle seda selgelt.
Ole lühike ja selge.`;

/** Returns an AI-written answer, or null if no API key is set or the call fails. */
export async function generateAnswer(question: string, chunks: SourceCard[]): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const context = chunks
    .map(
      (c, i) =>
        `### Allikas ${i + 1}\nDokument: ${c.docTitle} (${c.procedureType})\nJaotis: ${c.section}\n${c.content}`,
    )
    .join("\n\n");

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: `Dokumendid:\n\n${context}\n\nKüsimus: ${question}` }],
      }),
    });
    if (!res.ok) {
      console.error("Anthropic API error", res.status, await res.text());
      return null;
    }
    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = data.content
      ?.filter((b) => b.type === "text")
      .map((b) => b.text ?? "")
      .join("")
      .trim();
    return text || null;
  } catch (error) {
    console.error("Anthropic API request failed", error);
    return null;
  }
}
