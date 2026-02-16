import React, { useState } from 'react';
import { Card, Btn, Badge, Input, Select, TextArea, Empty, Progress } from '../ui';
import { T, LS, uid, fmtDate, fmt } from '../globals';
import { API } from '../api';

export const AdvisoryBoard = ({ grants }) => {
  const [activeGrantId, setActiveGrantId] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [persona, setPersona] = useState("auditor"); // auditor | growth | policy

  const PERSONAS = {
    auditor: {
      name: "The Auditor",
      icon: "⚖️",
      role: "Compliance & Risk Expert",
      color: T.red,
      sys: "You are 'The Auditor'. Your goal is to find compliance holes, financial risks, and reporting gaps in grant proposals. Be rigorous, skeptical, and focused on audit-readiness."
    },
    growth: {
      name: "The Growth Hacker",
      icon: "🚀",
      role: "Strategic ROI Expert",
      color: T.blue,
      sys: "You are 'The Growth Hacker'. Your goal is to maximize impact metrics, narrative punch, and funding visibility. Focus on SROI, scalability, and 'wow' factor."
    },
    policy: {
      name: "The Policy Expert",
      icon: "🏛️",
      role: "Agency Alignment Expert",
      color: T.purple,
      sys: "You are 'The Policy Expert'. Your goal is to align the proposal with current agency priorities, legislative trends, and political climate. Focus on mission alignment and 'fit'."
    }
  };

  const activeGrant = grants.find(g => g.id === activeGrantId);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { id: uid(), role: "user", text: input, persona: persona, time: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const activePersona = PERSONAS[persona];
    const sys = `${activePersona.sys}\n\nCONTEXT:\nGrant: ${activeGrant?.title || "General Advisory"}\nAgency: ${activeGrant?.agency || "N/A"}\nAmount: ${fmt(activeGrant?.amount || 0)}\nDescription: ${activeGrant?.description || "N/A"}`;

    const res = await API.callAI([...messages.map(m => ({ role: m.role, content: m.text })), { role: "user", content: input }], sys);
    
    if (!res.error) {
      const aiMsg = { id: uid(), role: "assistant", text: res.text, persona: persona, time: new Date().toISOString() };
      setMessages(prev => [...prev, aiMsg]);
    }
    setLoading(false);
  };

  const clearChat = () => setMessages([]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, height: "100%" }}>
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 200px)" }}>
        <Card style={{ flex: 1, display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
          {/* Header */}
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, background: T.panel, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>{PERSONAS[persona].icon}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{PERSONAS[persona].name}</div>
                <div style={{ fontSize: 10, color: T.sub }}>{PERSONAS[persona].role}</div>
              </div>
            </div>
            <Btn variant="ghost" size="xs" onClick={clearChat}>🧹 Clear Session</Btn>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
            {messages.length === 0 ? (
              <Empty
                icon="💬"
                title="War Room Ready"
                sub={`Start a session with ${PERSONAS[persona].name} to stress-test your strategy.`}
              />
            ) : (
              messages.map(m => (
                <div key={m.id} style={{ marginBottom: 16, display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{
                    maxWidth: "80%",
                    padding: "10px 14px",
                    borderRadius: 12,
                    background: m.role === "user" ? T.blue : T.panel,
                    color: m.role === "user" ? "#fff" : T.text,
                    fontSize: 12,
                    lineHeight: 1.5,
                    border: m.role === "user" ? "none" : `1px solid ${T.border}`
                  }}>
                    {m.role === "assistant" && (
                      <div style={{ fontSize: 10, fontWeight: 700, color: PERSONAS[m.persona].color, marginBottom: 4, textTransform: "uppercase" }}>
                        {PERSONAS[m.persona].name}
                      </div>
                    )}
                    {m.text}
                  </div>
                </div>
              ))
            )}
            {loading && <div style={{ fontSize: 11, color: T.sub }}>{PERSONAS[persona].name} is analyzing...</div>}
          </div>

          {/* Input */}
          <div style={{ padding: 16, borderTop: `1px solid ${T.border}`, background: T.panel }}>
            <div style={{ display: "flex", gap: 8 }}>
              <Input
                value={input}
                onChange={setInput}
                placeholder={`Ask ${PERSONAS[persona].name}...`}
                style={{ flex: 1 }}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                disabled={loading}
              />
              <Btn variant="primary" onClick={sendMessage} disabled={loading || !input.trim()}>⚡ Send</Btn>
            </div>
          </div>
        </Card>
      </div>

      <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
        <Card>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 12 }}>🎯 Strategy Focus</div>
          <Select
            value={activeGrantId}
            onChange={setActiveGrantId}
            options={[
              { value: "", label: "General Strategy" },
              ...grants.map(g => ({ value: g.id, label: g.title?.slice(0, 30) + (g.title?.length > 30 ? "..." : "") }))
            ]}
          />
          <div style={{ fontSize: 10, color: T.sub, marginTop: 8 }}>
            AI will tailor advice to this specific project context.
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 12 }}>🤖 Active Advisor</div>
          <div style={{ display: "grid", gap: 8 }}>
            {Object.entries(PERSONAS).map(([key, p]) => (
              <div
                key={key}
                onClick={() => setPersona(key)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  cursor: "pointer",
                  border: `1px solid ${persona === key ? p.color : T.border}`,
                  background: persona === key ? p.color + "08" : T.panel,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  transition: "all 0.2s"
                }}
              >
                <span style={{ fontSize: 18 }}>{p.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.text }}>{p.name}</div>
                  <div style={{ fontSize: 9, color: T.sub }}>{p.role}</div>
                </div>
                {persona === key && <Badge color={p.color} size="xs">Active</Badge>}
              </div>
            ))}
          </div>
        </Card>

        {activeGrant && (
          <Card style={{ background: T.panel + "22" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.mute, marginBottom: 8 }}>CONTEXT PREVIEW</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.text, marginBottom: 4 }}>{activeGrant.title}</div>
            <div style={{ fontSize: 11, color: T.sub, lineHeight: 1.4 }}>{activeGrant.description?.slice(0, 100)}...</div>
          </Card>
        )}
      </div>
    </div>
  );
};
