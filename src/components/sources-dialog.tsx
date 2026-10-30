"use client";

import { ExternalLink, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { SourceDoc } from "@/lib/types";

export function SourcesDialog({
  open,
  onOpenChange,
  sources,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sources: SourceDoc[];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle className="pr-6 text-base font-semibold text-zinc-900">Allikad</DialogTitle>
        <DialogDescription className="mt-1 text-sm text-zinc-500">
          Dokumendid, millel vastused põhinevad.
        </DialogDescription>
        <ul className="mt-4 space-y-2">
          {sources.length === 0 && <li className="text-sm text-zinc-500">Allikaid ei leitud.</li>}
          {sources.map((s) => (
            <li key={s.sourceFile}>
              <a
                href={s.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 rounded-lg border border-zinc-200 p-3 hover:bg-zinc-50"
              >
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold text-violet-700">{s.procedureType}</span>
                  <span className="mt-0.5 block text-sm leading-snug text-zinc-800">{s.docTitle}</span>
                </span>
                <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
              </a>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
