"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, Loader2, Menu, Send, Trash, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/sidebar";
import { SourceCard } from "@/components/source-card";
import { SourcesDialog } from "@/components/sources-dialog";
import { MAX_MESSAGE_LENGTH } from "@/lib/types";
import type { ChatMessage, ChatSummary, SourceDoc } from "@/lib/types";

const EXAMPLE_QUESTIONS = [
  "Kui kaua kestab detailplaneeringu avalik väljapanek?",
  "Millal on vaja Maa- ja Ruumiameti heakskiitu?",
  "Kuidas teavitatakse DP kehtestamisest?",
  "Millal saab koostada detailplaneeringut muutvat detailplaneeringut?",
];

const DB_ERROR = "Andmebaasiga ei saanud ühendust. Palun proovi mõne hetke pärast uuesti.";

class ApiError extends Error {}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: init?.body ? { "content-type": "application/json" } : undefined,
    });
  } catch {
    throw new ApiError("Serveriga ei saanud ühendust. Kontrolli internetiühendust ja proovi uuesti.");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(data?.error ?? DB_ERROR);
  return data as T;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("et-EE", { hour: "2-digit", minute: "2-digit" });
}

export function ChatApp() {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [sources, setSources] = useState<SourceDoc[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [procedureType, setProcedureType] = useState("");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [slowStart, setSlowStart] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const procedureTypes = [...new Set(sources.map((s) => s.procedureType))];

  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  useEffect(resizeTextarea, [input, resizeTextarea]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

  const setUrlChat = (id: string | null) => {
    const url = id ? `?c=${id}` : window.location.pathname;
    window.history.replaceState(null, "", url);
  };

  const openChat = useCallback(async (id: string) => {
    setError(null);
    setSidebarOpen(false);
    try {
      const chat = await api<ChatSummary & { messages: ChatMessage[] }>(`/api/chats/${id}`);
      setActiveId(chat.id);
      setMessages(chat.messages);
      setProcedureType(chat.procedureType ?? "");
      setUrlChat(chat.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : DB_ERROR);
      setUrlChat(null);
    }
  }, []);

  const load = useCallback(async () => {
    setInitLoading(true);
    setSlowStart(false);
    setError(null);
    // The free Render instance sleeps; tell the user when the first request is slow.
    const timer = setTimeout(() => setSlowStart(true), 2500);
    try {
      const [chatList, sourceList] = await Promise.all([
        api<ChatSummary[]>("/api/chats"),
        api<SourceDoc[]>("/api/sources"),
      ]);
      setChats(chatList);
      setSources(sourceList);
      const wanted = new URLSearchParams(window.location.search).get("c");
      if (wanted && chatList.some((c) => c.id === wanted)) await openChat(wanted);
    } catch (e) {
      setError(e instanceof Error ? e.message : DB_ERROR);
    } finally {
      clearTimeout(timer);
      setSlowStart(false);
      setInitLoading(false);
    }
  }, [openChat]);

  useEffect(() => {
    void load();
  }, [load]);

  const newChat = () => {
    setActiveId(null);
    setMessages([]);
    setError(null);
    setSidebarOpen(false);
    setUrlChat(null);
    textareaRef.current?.focus();
  };

  const deleteChat = async (id: string) => {
    if (!window.confirm("Kas kustutada see vestlus?")) return;
    try {
      await api(`/api/chats/${id}`, { method: "DELETE" });
      setChats((list) => list.filter((c) => c.id !== id));
      if (id === activeId) newChat();
    } catch (e) {
      setError(e instanceof Error ? e.message : DB_ERROR);
    }
  };

  const clearChat = async () => {
    if (!activeId) {
      setInput("");
      return;
    }
    await deleteChat(activeId);
  };

  const changeProcedure = async (value: string) => {
    setProcedureType(value);
    if (!activeId) return;
    try {
      await api(`/api/chats/${activeId}`, {
        method: "PATCH",
        body: JSON.stringify({ procedureType: value }),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : DB_ERROR);
    }
  };

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || sending) return;
    if (content.length > MAX_MESSAGE_LENGTH) {
      setError(`Küsimus on liiga pikk (kuni ${MAX_MESSAGE_LENGTH} tähemärki).`);
      return;
    }

    setError(null);
    setSending(true);
    setInput("");

    const tempId = `temp-${Date.now()}`;
    setMessages((m) => [
      ...m,
      {
        id: tempId,
        sessionId: activeId ?? "",
        role: "user",
        content,
        sources: null,
        createdAt: new Date().toISOString(),
      },
    ]);

    try {
      let id = activeId;
      if (!id) {
        const created = await api<ChatSummary>("/api/chats", {
          method: "POST",
          body: JSON.stringify({ procedureType }),
        });
        id = created.id;
        setActiveId(id);
        setUrlChat(id);
        setChats((list) => [created, ...list]);
      }
      const result = await api<{ session: ChatSummary; messages: ChatMessage[] }>(
        `/api/chats/${id}/messages`,
        { method: "POST", body: JSON.stringify({ content }) },
      );
      setMessages((m) => [...m.filter((x) => x.id !== tempId), ...result.messages]);
      setChats((list) => [result.session, ...list.filter((c) => c.id !== result.session.id)]);
    } catch (e) {
      setMessages((m) => m.filter((x) => x.id !== tempId));
      setInput(content);
      setError(e instanceof Error ? e.message : DB_ERROR);
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send(input);
    }
  };

  const empty = messages.length === 0 && !sending;

  return (
    <div className="flex h-full">
      <Sidebar
        chats={chats}
        activeId={activeId}
        open={sidebarOpen}
        loading={initLoading}
        onClose={() => setSidebarOpen(false)}
        onSelect={openChat}
        onDelete={deleteChat}
        onNew={newChat}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-zinc-200 bg-white px-3 sm:px-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Ava menüü"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="shrink-0 text-base font-semibold text-zinc-900">DP-nõustaja</h1>
          <div className="ml-auto flex min-w-0 items-center gap-2">
            <label className="sr-only" htmlFor="procedure">
              Menetluse liik
            </label>
            <select
              id="procedure"
              value={procedureType}
              onChange={(e) => void changeProcedure(e.target.value)}
              title="Menetluse liik"
              className="h-9 min-w-0 max-w-[11rem] rounded-lg border border-zinc-300 bg-white px-2 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500 sm:max-w-xs"
            >
              <option value="">Kõik menetlused</option>
              {procedureTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <Button variant="outline" size="sm" onClick={() => setSourcesOpen(true)}>
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Allikad</span>
              <span className="sr-only sm:hidden">Allikad</span>
            </Button>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto bg-white">
          <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-3 py-4 sm:px-4">
            {initLoading && (
              <div className="m-auto flex max-w-sm flex-col items-center gap-3 text-center text-zinc-500">
                <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
                <p className="text-sm">
                  {slowStart
                    ? "Server ärkab üles. Esimene laadimine võib võtta kuni minuti, palun oota..."
                    : "Laen..."}
                </p>
              </div>
            )}

            {!initLoading && empty && (
              <div className="m-auto w-full max-w-xl py-6 text-center">
                <h2 className="text-xl font-semibold text-zinc-900">Tere! Mina olen DP-nõustaja</h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                  Aitan leida vastuseid detailplaneeringu menetluse kohta. Vastan ainult
                  ministeeriumi menetlusskeemide põhjal ja viitan alati algallikale.
                </p>
                <div className="mt-6 grid gap-2 text-left sm:grid-cols-2">
                  {EXAMPLE_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => void send(q)}
                      className="rounded-xl border border-zinc-200 bg-white p-3 text-sm text-zinc-700 transition-colors hover:border-violet-300 hover:bg-violet-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!initLoading && (
              <ul className="space-y-4">
                {messages.map((m) => (
                  <li key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                    <div className={m.role === "user" ? "max-w-[85%]" : "w-full max-w-[95%]"}>
                      <div
                        className={
                          m.role === "user"
                            ? "whitespace-pre-wrap break-words rounded-2xl rounded-br-sm bg-violet-600 px-4 py-2.5 text-sm text-white"
                            : "whitespace-pre-wrap break-words rounded-2xl rounded-bl-sm bg-zinc-100 px-4 py-2.5 text-sm text-zinc-900"
                        }
                      >
                        {m.content}
                      </div>
                      {m.role === "assistant" && m.sources && m.sources.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {m.sources.map((s) => (
                            <SourceCard key={s.id} source={s} />
                          ))}
                        </div>
                      )}
                      <p
                        className={`mt-1 text-[11px] text-zinc-400 ${m.role === "user" ? "text-right" : "text-left"}`}
                      >
                        {formatTime(m.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
                {sending && (
                  <li className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-zinc-100 px-4 py-2.5 text-sm text-zinc-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Otsin vastust...
                    </div>
                  </li>
                )}
              </ul>
            )}
            <div ref={bottomRef} />
          </div>
        </main>

        <div className="shrink-0 border-t border-zinc-200 bg-white px-3 py-3 sm:px-4">
          <div className="mx-auto w-full max-w-3xl">
            {error && (
              <div
                role="alert"
                className="mb-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
              >
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="flex-1">{error}</span>
                {!activeId && chats.length === 0 && sources.length === 0 && (
                  <button type="button" onClick={() => void load()} className="font-medium underline">
                    Proovi uuesti
                  </button>
                )}
              </div>
            )}
            <div className="rounded-xl border border-zinc-300 bg-white p-2 focus-within:ring-2 focus-within:ring-violet-500">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
                onKeyDown={onKeyDown}
                rows={1}
                maxLength={MAX_MESSAGE_LENGTH}
                placeholder="Küsi detailplaneeringu menetluse kohta..."
                className="block max-h-40 w-full resize-none bg-transparent px-2 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
              />
              <div className="mt-1 flex items-center justify-between gap-2">
                <Button variant="ghost" size="sm" onClick={() => void clearChat()} disabled={sending}>
                  <Trash className="h-4 w-4" />
                  Tühjenda vestlus
                </Button>
                <div className="flex items-center gap-3">
                  {input.length > MAX_MESSAGE_LENGTH * 0.8 && (
                    <span className="text-[11px] text-zinc-400">
                      {input.length}/{MAX_MESSAGE_LENGTH}
                    </span>
                  )}
                  <Button size="sm" onClick={() => void send(input)} disabled={sending || !input.trim()}>
                    <Send className="h-4 w-4" />
                    Saada
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SourcesDialog open={sourcesOpen} onOpenChange={setSourcesOpen} sources={sources} />
    </div>
  );
}
