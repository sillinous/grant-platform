import React, { useState, useEffect, useRef, useCallback } from 'react';
import { T, LS } from '../globals';
import { Btn } from '../ui';
import { API, buildPortfolioContext } from '../api';
import { getActiveProvider } from '../ai-config';

const MAX_STORED_MESSAGES = 50;
const STORAGE_KEY = "ai_chat_history";

export const AIChatBar = ({ grants, vaultDocs, contacts }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(() => LS.get(STORAGE_KEY, []));
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);
  const debounceRef = useRef(null);

  // Debounced persist to localStorage
  const persistMessages = useCallback((msgs) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      // Keep only the last MAX_STORED_MESSAGES
      const toStore = msgs.slice(-MAX_STORED_MESSAGES);
      LS.set(STORAGE_KEY, toStore);
    }, 500);
  }, []);

  useEffect(() => {
    persistMessages(messages);
  }, [messages, persistMessages]);

  const clearHistory = () => {
    setMessages([]);
    LS.del(STORAGE_KEY);
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    const context = buildPortfolioContext(grants, vaultDocs, contacts);
    const activeP = getActiveProvider();
    const sys = `You are the UNLESS Grant Platform AI assistant. ${context}\n\nHelp the user with grant strategy, writing, analysis, and planning. Be specific, actionable, and reference their actual portfolio data. Current provider: ${activeP.name}.`;
    const history = [...messages.slice(-10), { role: "user", content: userMsg }];
    const result = await API.callAI(history, sys);

    setMessages(prev => [...prev, { role: "assistant", content: result.error ? `Error: ${result.error}` : result.text, provider: result.provider, model: result.model }]);
    setLoading(false);
  };

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const activeP = getActiveProvider();

  if (!open) return (
    <button onClick={() => setOpen(true)} style={{
      position: "fixed", bottom: 20, right: 20, width: 52, height: 52, borderRadius: "50%",
      background: T.amber, border: "none", cursor: "pointer", fontSize: 22, display: "flex",
      alignItems: "center", justifyContent: "center", boxShadow: `0 4px 20px ${T.amber}44`, zIndex: 999,
    }}>🧠</button>
  );

  return (
    <div style={{
      position: "fixed", bottom: 20, right: 20, width: 380, height: 500, background: T.panel,
      border: `1px solid ${T.border}`, borderRadius: 12, display: "flex", flexDirection: "column",
      boxShadow: `0 8px 40px rgba(0,0,0,0.5)`, zIndex: 999,
    }}>
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>🧠 AI Assistant</span>
          <Badge size="xs" style={{ background: (activeP.color || T.amber) + "22", color: activeP.color || T.amber, border: `1px solid ${activeP.color}44` }}>
            {activeP.icon} {activeP.name}
          </Badge>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {messages.length > 0 && (
            <button onClick={clearHistory} title="Clear chat history" style={{
              background: "none", border: "none", color: T.mute, cursor: "pointer", fontSize: 11,
              padding: "2px 6px", borderRadius: 4, transition: "color 0.2s",
            }} onMouseEnter={e => e.target.style.color = T.red}
              onMouseLeave={e => e.target.style.color = T.mute}>
              🗑️
            </button>
          )}
          <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: T.mute, cursor: "pointer" }}>✕</button>
        </div>
      </div>
      <div ref={chatRef} style={{ flex: 1, overflow: "auto", padding: 12 }}>
        {messages.length === 0 && (
          <div style={{ padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 14, color: T.sub, marginBottom: 12 }}>What can I help with?</div>
            {["What should I prioritize?", "Which grants am I most likely to win?", "Draft an executive summary", "What documents am I missing?"].map(s => (
              <Btn key={s} size="sm" variant="ghost" onClick={() => { setInput(s); }} style={{ margin: 2 }}>{s}</Btn>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 8, textAlign: m.role === "user" ? "right" : "left" }}>
            <div style={{
              display: "inline-block", maxWidth: "85%", padding: "8px 12px", borderRadius: 10,
              background: m.role === "user" ? T.amber + "22" : T.card,
              color: T.text, fontSize: 12, lineHeight: 1.5, whiteSpace: "pre-wrap",
            }}>{m.content}</div>
          </div>
        ))}
        {loading && <div style={{ fontSize: 12, color: T.mute, textAlign: "center" }}>⏳ Thinking...</div>}
      </div>
      <div style={{ padding: 8, borderTop: `1px solid ${T.border}`, display: "flex", gap: 8 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Ask about your grants..."
          style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: "8px 12px", color: T.text, outline: "none" }} />
        <Btn size="sm" variant="primary" onClick={send} disabled={loading}>→</Btn>
      </div>
    </div>
  );
};
