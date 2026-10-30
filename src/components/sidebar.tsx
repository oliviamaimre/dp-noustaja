"use client";

import { MessageSquare, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ChatSummary } from "@/lib/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("et-EE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function Sidebar({
  chats,
  activeId,
  open,
  loading,
  onClose,
  onSelect,
  onDelete,
  onNew,
}: {
  chats: ChatSummary[];
  activeId: string | null;
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-zinc-900/40 md:hidden" onClick={onClose} aria-hidden />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-zinc-200 bg-zinc-50 transition-transform md:static md:z-auto md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between px-4">
          <h2 className="text-sm font-semibold text-zinc-800">Vestlused</h2>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={onClose} aria-label="Sulge menüü">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          {loading && <p className="px-2 py-3 text-sm text-zinc-500">Laen vestlusi...</p>}
          {!loading && chats.length === 0 && (
            <p className="px-2 py-3 text-sm text-zinc-500">Vestlusi veel ei ole.</p>
          )}
          <ul className="space-y-0.5">
            {chats.map((chat) => (
              <li key={chat.id} className="group relative">
                <button
                  type="button"
                  onClick={() => onSelect(chat.id)}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-lg px-2 py-2 pr-9 text-left hover:bg-zinc-200/70",
                    chat.id === activeId && "bg-zinc-200/80",
                  )}
                >
                  <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-zinc-800">{chat.title}</span>
                    <span className="block text-[11px] text-zinc-500">{formatDate(chat.updatedAt)}</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(chat.id)}
                  aria-label="Kustuta vestlus"
                  className="absolute right-1.5 top-2 rounded-md p-1 text-zinc-400 hover:bg-zinc-300 hover:text-red-600 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sticky bottom-0 shrink-0 border-t border-zinc-200 bg-zinc-50 p-3">
          <Button className="w-full" onClick={onNew}>
            <Plus className="h-4 w-4" />
            Uus vestlus
          </Button>
        </div>
      </aside>
    </>
  );
}
