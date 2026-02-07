"use client";

import React, { useState, useRef, useEffect } from "react";

// need to get the question and send answer back to
// localhost:3000/api/chat

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ from: "user" | "bot"; text: string }[]>([
    { from: "bot", text: "Hi — how can I help you today?" },
  ]);
  const [input, setInput] = useState("");
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

  const send = () => {
    if (!input.trim()) return;
    setMessages((m) => [...m, { from: "user", text: input.trim() }]);
    setInput("");
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      {open && (
        <div
          ref={panelRef}
          className="mb-3 w-96 h-[520px] bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden border border-gray-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-2 bg-red-600 text-white font-semibold">Chatbot</div>
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
          </div>
          <div className="p-2 border-t border-gray-200 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              className="flex-1 px-3 py-2 rounded-md border border-gray-300 focus:outline-none"
              placeholder="Type a message"
            />
            <button
              onClick={send}
              className="px-3 py-2 bg-red-600 text-white rounded-md font-semibold"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Chat toggle image button (always visible) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label={open ? "Close chat" : "Open chat"}
        className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200 shadow-xl bg-white flex items-center justify-center"
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
