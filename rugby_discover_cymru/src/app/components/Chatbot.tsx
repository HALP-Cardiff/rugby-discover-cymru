"use client";

import React, { useState, useRef, useEffect } from "react";

type ApiRole = "user" | "assistant";
type ApiMsg = { role: ApiRole; content: string };

type UiMsg = { from: "user" | "bot"; text: string };

function toUiMessages(apiMessages: ApiMsg[]): UiMsg[] {
  return apiMessages.map((m) => ({
    from: m.role === "assistant" ? "bot" : "user",
    text: m.content,
  }));
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<UiMsg[]>([
    { from: "bot", text: "Hi — how can I help you today?" },
  ]);

  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!open) return;
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const alreadyInitialized =
      messages.length > 1 || (messages.length === 1 && messages[0]?.text !== "Hi — how can I help you today?");
    if (alreadyInitialized) return;

    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ message: "" }),
        });

        if (!res.ok) throw new Error(`API error: ${res.status}`);

        const data: { messages: ApiMsg[]; quickReplies?: string[] } = await res.json();
        setMessages(toUiMessages(data.messages));
        setQuickReplies(data.quickReplies ?? []);
      } catch (err) {
        setMessages((m) => [
          ...m,
          { from: "bot", text: "Backend error: couldn’t start the chat. Check /api/chat." },
        ]);
      } finally {
        setLoading(false);
      }
    })();
  }, [open]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;

    setMessages((m) => [...m, { from: "user", text: trimmed }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: trimmed }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const data: { messages: ApiMsg[]; quickReplies?: string[] } = await res.json();

      setMessages(toUiMessages(data.messages));
      setQuickReplies(data.quickReplies ?? []);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { from: "bot", text: "Backend error: couldn’t send your message. Check server logs." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      {open && (
        <div
          ref={panelRef}
          className="mb-3 w-96 h-[520px] bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden border border-gray-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-2 bg-red-600 text-white font-semibold flex items-center justify-between">
            <span>Chatbot</span>
            {loading && <span className="text-xs opacity-90">…</span>}
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-gray-50">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`p-2 rounded-md max-w-[80%] ${
                  m.from === "user" ? "bg-blue-600 text-white ml-auto" : "bg-white text-gray-800"
                }`}
              >
                {m.text}
              </div>
            ))}

            {quickReplies.length > 0 && (
              <div className="pt-2 flex flex-wrap gap-2">
                {quickReplies.map((qr) => (
                  <button
                    key={qr}
                    onClick={() => send(qr)}
                    disabled={loading}
                    className="px-3 py-1 rounded-full border border-gray-300 bg-white text-gray-800 text-sm hover:bg-gray-100 disabled:opacity-50"
                    type="button"
                  >
                    {qr}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-2 border-t border-gray-200 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send(input)}
              className="flex-1 px-3 py-2 rounded-md border border-gray-300 focus:outline-none"
              placeholder="Type a message"
              disabled={loading}
            />
            <button
              onClick={() => send(input)}
              className="px-3 py-2 bg-red-600 text-white rounded-md font-semibold disabled:opacity-60"
              disabled={loading}
              type="button"
            >
              Send
            </button>
          </div>
        </div>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label={open ? "Close chat" : "Open chat"}
        className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200 shadow-xl bg-white flex items-center justify-center"
        type="button"
      >
        <img
          src="/wru_assets/smiling_rugby_ball.png"
          alt="chatbot"
          className="w-full h-full object-cover"
        />
      </button>
    </div>
  );
}
