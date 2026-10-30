"use client";

import { useState } from "react";
import { ChevronDown, ExternalLink, FileText } from "lucide-react";
import type { SourceCard as SourceCardData } from "@/lib/types";

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Wraps words that start with any search stem in <mark>. */
function Highlighted({ text, terms }: { text: string; terms: string[] }) {
  if (terms.length === 0) return <>{text}</>;
  const re = new RegExp(
    `(?<![\\p{L}\\p{N}])(?:${terms.map(escapeRegExp).join("|")})[\\p{L}\\p{N}]*`,
    "giu",
  );
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    const start = m.index ?? 0;
    if (start > last) parts.push(text.slice(last, start));
    parts.push(
      <mark key={start} className="rounded bg-violet-100 px-0.5 text-violet-900">
        {m[0]}
      </mark>,
    );
    last = start + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

export function SourceCard({ source }: { source: SourceCardData }) {
  const [expanded, setExpanded] = useState(false);
  const long = source.content.length > 450;

  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-3 text-left shadow-sm">
      <div className="flex items-start gap-2">
        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
        <div className="min-w-0">
          <p className="line-clamp-2 text-xs font-medium text-zinc-700">{source.docTitle}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">
              {source.procedureType}
            </span>
            <span className="text-[11px] font-semibold text-zinc-500">{source.section}</span>
          </div>
        </div>
      </div>

      <p
        className={`mt-2 whitespace-pre-line text-[13px] leading-relaxed text-zinc-800 ${
          long && !expanded ? "line-clamp-6" : ""
        }`}
      >
        <Highlighted text={source.content} terms={source.terms} />
      </p>

      <div className="mt-2 flex items-center justify-between gap-2">
        {long ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-800"
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
            {expanded ? "Näita vähem" : "Näita rohkem"}
          </button>
        ) : (
          <span />
        )}
        <a
          href={source.pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-violet-700 hover:underline"
        >
          Ava algallikas (PDF)
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </article>
  );
}
