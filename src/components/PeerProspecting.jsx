import React, { useState, useEffect } from 'react';
import { Card, Input, Btn } from '../ui';
import { LS, T, fmt, uid } from '../globals';
import { API } from '../api';

export const PeerProspecting = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null); // { id, text }
  const [savedPeers, setSavedPeers] = useState(() => LS.get("peers", []));

  useEffect(() => { LS.set("peers", savedPeers); }, [savedPeers]);

  const searchRecipients = async () => {
    if (!query.trim()) return;
    setLoading(true);
    const data = await API.searchUSASpendingRecipients(query);
    setResults(data.results || []);
    setLoading(false);
  };

  const searchSpending = async () => {
    if (!query.trim()) return;
    setLoading(true);
    const data = await API.searchFederalSpending(query);
    setResults((data.results || []).map(r => ({
      recipient_name: r["Recipient Name"] || "Unknown",
      amount: r["Award Amount"] || 0,
      agency: r["Awarding Agency"] || "",
      award_id: r["Award ID"] || "",
      start_date: r["Start Date"] || "",
    })));
    setLoading(false);
  };

  const analyzePeer = async (peer) => {
    setLoading(true);
    const sys = `You are a Senior Grant Strategist. Analyze this peer organization that has received federal funding.
PEER: ${peer.name}
RECENT AWARDS: ${peer.amount ? fmt(peer.amount) : "Various"} from ${peer.agency || "Federal Agencies"}.

Provide a strategic BRIEF:
1. SUCCESS PATTERN: Why do they win? (e.g., technical depth, geographical focus).
2. COMPETITIVE THREAT: High/Medium/Low.
3. PARTNERSHIP POTENTIAL: Could we sub-award or partner with them?

Return a structured professional report.`;

    const res = await API.callAI([{ role: "user", content: "Run Strategic Brief." }], sys);
    if (!res.error) setAnalysis({ id: peer.id, text: res.text });
    else alert(res.error);
    setLoading(false);
  };

  const savePeer = (peer) => {
    if (savedPeers.some(p => p.name === peer.recipient_name)) return;
    setSavedPeers(prev => [...prev, {
      id: uid(), name: peer.recipient_name, amount: peer.amount || 0,
      agency: peer.agency || "", notes: "", savedAt: new Date().toISOString(),
    }]);
  };

  return (
    <div>
      <Card style={{ marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:8 }}>🔎 Peer Prospecting</div>
        <div style={{ fontSize:12, color:T.sub, marginBottom:12 }}>Find organizations similar to yours that have received federal funding. Learn from their strategies and identify potential partners or competitors.</div>
        <div style={{ display:"flex", gap:8, marginBottom:8 }}>
          <Input value={query} onChange={setQuery} placeholder="Search recipients... (e.g., technology, disability services, Newton IL)" style={{ flex:1 }} />
          <Btn variant="primary" onClick={searchRecipients} disabled={loading}>🔍 Recipients</Btn>
          <Btn onClick={searchSpending} disabled={loading}>💰 Awards</Btn>
        </div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {["rural technology", "disability services Illinois", "small business innovation", "workforce development", "community development block"].map(q => (
            <Btn key={q} size="sm" variant="ghost" onClick={() => setQuery(q)}>{q}</Btn>
          ))}
        </div>
      </Card>

      {results.length > 0 && (
        <Card style={{ marginBottom:16 }}>
          <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:8 }}>📋 Search Results ({results.length})</div>
          {results.map((r, i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:`1px solid ${T.border}` }}>
              <div>
                <div style={{ fontSize:12, color:T.text }}>{r.recipient_name}</div>
                <div style={{ fontSize:10, color:T.mute }}>{r.agency || r.uei || ""}{r.amount ? ` · ${fmt(r.amount)}` : ""}</div>
              </div>
              <Btn size="sm" variant="ghost" onClick={() => savePeer(r)}>💾 Save</Btn>
            </div>
          ))}
        </Card>
      )}

      {savedPeers.length > 0 && (
        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>⭐ Saved Peers & Competitors ({savedPeers.length})</div>
          {savedPeers.map(p => (
            <div key={p.id} style={{ marginBottom: 16, borderBottom: `1px solid ${T.border}`, paddingBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: T.mute }}>{p.agency}{p.amount ? ` · ${fmt(p.amount)}` : ""}</div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <Btn size="xs" variant="ghost" onClick={() => analyzePeer(p)} disabled={loading}>✨ Analyze</Btn>
                  <button onClick={() => setSavedPeers(prev => prev.filter(x => x.id !== p.id))} style={{ background: "none", border: "none", color: T.red, cursor: "pointer", padding: "0 8px" }}>✕</button>
                </div>
              </div>

              {analysis?.id === p.id && (
                <div style={{ fontSize: 11, color: T.sub, background: T.panel, padding: 10, borderRadius: 6, borderLeft: `3px solid ${T.amber}`, position: "relative" }}>
                  <div style={{ fontWeight: 600, fontSize: 10, color: T.amber, marginBottom: 4 }}>STRATEGIC BRIEF:</div>
                  <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{analysis.text}</div>
                  <button onClick={() => setAnalysis(null)} style={{ position: "absolute", top: 4, right: 8, background: "none", border: "none", color: T.mute, cursor: "pointer", fontSize: 10 }}>✕</button>
                </div>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};
