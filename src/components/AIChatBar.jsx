import React, { useState, useEffect, useRef, useCallback } from 'react';
import { T, LS } from '../globals';
import { Btn, Badge } from '../ui';
import { API, buildPortfolioContext } from '../api';
import { getActiveProvider } from '../ai-config';
import { useStore } from '../store';

const MAX_STORED_MESSAGES = 50;
const STORAGE_KEY = "ai_chat_history";

export const AIChatBar = () => {
  const { grants, vaultDocs, contacts } = useStore();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(() => LS.get(STORAGE_KEY, []));
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);
  const debounceRef = useRef(null);

  const persistMessages = useCallback((msgs) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const toStore = msgs.slice(-MAX_STORED_MESSAGES);
      LS.set(STORAGE_KEY, toStore);
    }, 500);
  }, []);

  useEffect(() => {
    persistMessages(messages);
  }, [messages, persistMessages]);

  const clearHistory = () => {
    setMessages([]);
    LS.rm(STORAGE_KEY);
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    const context = buildPortfolioContext(grants, vaultDocs, contacts);
    const activeP = getActiveProvider();
    const sys = `You are the Grant Platform AI assistant. ${context}\n\nHelp the user with grant strategy, writing, analysis, and planning. Be specific, actionable, and reference their actual portfolio data. Current provider: ${activeP.name}.`;
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
      background: `linear-gradient(135deg, ${T.amber}, #f97316)`, border: "none", cursor: "pointer",
      fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: `0 4px 20px ${T.amber}44`, zIndex: 999, transition: "transform 0.2s",
    }}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      title="AI Assistant"
    >🧠</button>
  );

  return (
    <div style={{
      position: "fixed", bottom: 20, right: 20, width: 390, height: 520, background: T.panel,
      border: `1px solid ${T.border}`, borderRadius: 16, display: "flex", flexDirection: "column",
      boxShadow: `0 16px 50px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)`, zIndex: 999,
      animation: "fadeSlideUp 0.3s ease-out",
    }}>
      {/* Header */}
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.02)", borderRadius: "16px 16px 0 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>🧠</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>AI Assistant</span>
          <Badge style={{ background: (activeP.color || T.amber) + "22", color: activeP.color || T.amber, border: `1px solid ${(activeP.color || T.amber)}44`, fontSize: 9 }}>
            {activeP.icon} {activeP.name}
          </Badge>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {messages.length > 0 && (
            <button onClick={clearHistory} title="Clear history" style={{
              background: "none", border: "none", color: T.mute, cursor: "pointer", fontSize: 14,
              padding: "2px 6px", borderRadius: 4, transition: "color 0.2s",
            }}
              onMouseEnter={e => e.target.style.color = T.red}
              onMouseLeave={e => e.target.style.color = T.mute}
            >🗑️</button>
          )}
          <button onClick={() => setOpen(false)} style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${T.border}`, color: T.sub, cursor: "pointer", fontSize: 14, borderRadius: 6, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
      </div>

      {/* Messages */}
      <div ref={chatRef} style={{ flex: 1, overflow: "auto", padding: "12px 14px" }}>
        {messages.length === 0 && (
          <div style={{ padding: "20px 8px", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🧠</div>
            <div style={{ fontSize: 14, color: T.sub, marginBottom: 16, fontWeight: 600 }}>What can I help with?</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {["What should I prioritize?", "Which grants am I most likely to win?", "Draft an executive summary", "What documents am I missing?"].map(s => (
                <button key={s} onClick={() => setInput(s)} style={{
                  background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8,
                  padding: "8px 10px", color: T.sub, fontSize: 11, cursor: "pointer", textAlign: "left",
                  transition: "all 0.2s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.amber; e.currentTarget.style.color = T.text; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.sub; }}
                >{s}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 10, display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "85%", padding: "9px 13px", borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
              background: m.role === "user" ? `${T.amber}22` : "rgba(255,255,255,0.04)",
              border: `1px solid ${m.role === "user" ? T.amber + "33" : T.border}`,
              color: T.text, fontSize: 12, lineHeight: 1.6, whiteSpace: "pre-wrap",
            }}>{m.content}</div>
          </div>
        ))}
        {loading && <div style={{ fontSize: 12, color: T.amber, textAlign: "center", padding: 8 }}>⏳ Thinking...</div>}
      </div>

      {/* Input */}
      <div style={{ padding: "10px 12px", borderTop: `1px solid ${T.border}`, display: "flex", gap: 8 }}>
        <input value={input} onChange={v => setInput(v)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Ask about your grants..."
          style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}`, borderRadius: 10, padding: "9px 13px", color: T.text, outline: "none", fontSize: 13, transition: "border-color 0.2s" }}
          onFocus={e => e.currentTarget.style.borderColor = T.amber}
          onBlur={e => e.currentTarget.style.borderColor = T.border}
        />
        <Btn size="sm" variant="primary" onClick={send} disabled={loading} style={{ borderRadius: 10 }}>→</Btn>
      </div>
    </div>
  );
};
