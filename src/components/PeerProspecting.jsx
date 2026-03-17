import React, { useState, useEffect } from 'react';
import { Card, Input, Btn, SkeletonCard, Empty } from '../ui';
import { LS, T, fmt, uid, toast} from '../globals';
import { API } from '../api';
import { useStore } from '../store';

export const PeerProspecting = () => {
  const { contacts, setContacts, savedFunders = [], setSavedFunders } = useStore();
  const savedPeers = savedFunders.filter(f => f.type === "Peer");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null); // { id, text }

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
    else toast(res.error);
    setLoading(false);
  };

  const savePeer = (peer) => {
    if (contacts.some(p => p.name === peer.recipient_name)) return;
    setContacts([...(contacts || []), {
      id: uid(),
      name: peer.recipient_name,
      role: "Peer Organization",
      influenceScore: 50,
      associatedGrants: [],
      lastInteraction: new Date().toISOString(),
      meta: { federalAwardTotal: peer.amount || 0, primaryAgency: peer.agency || "" }
    }]);
  };

  return (
    <div>
      <Card style={{ marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:8 }}>🔎 Peer Prospecting</div>
        <div style={{ fontSize:12, color:T.sub, marginBottom:12 }}>Find organizations similar to yours that have received federal funding. Learn from their strategies and identify potential partners or competitors.</div>
        <div style={{ display:"flex", gap:8, marginBottom:8 }}>
          <Input value={query} onChange={v => setQuery(v)} placeholder="Search recipients... (e.g., technology, disability services, Newton IL)" style={{ flex: 1 }} />
          <Btn variant="primary" onClick={searchRecipients} disabled={loading}>🔍 Recipients</Btn>
          <Btn onClick={searchSpending} disabled={loading}>💰 Awards</Btn>
        </div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {["rural technology", "disability services Illinois", "small business innovation", "workforce development", "community development block"].map(q => (
            <Btn key={q} size="sm" variant="ghost" onClick={() => setQuery(q)}>{q}</Btn>
          ))}
        </div>
      </Card>

      {loading && <div style={{ marginBottom: 20 }}><SkeletonCard lines={4} /><SkeletonCard lines={4} /></div>}

      {results.length === 0 && !loading && savedPeers.length === 0 && (
        <div style={{ marginBottom: 20 }}>
          <Empty icon="👥" title="No Peers Tracked" sub="Search to find organizations that have won federal awards similar to your goals." />
        </div>
      )}

      {results.length > 0 && !loading && (
        <Card glow style={{ marginBottom: 20, borderTop: `4px solid ${T.blue}` }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: T.text, marginBottom: 16, letterSpacing: 1, textTransform: "uppercase" }}>📋 Federal Spending Signals ({results.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {results.map((r, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16, background: "rgba(255,255,255,0.02)", borderRadius: 12, border: `1px solid ${T.glassBorder}` }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{r.recipient_name}</div>
                  <div style={{ fontSize: 11, color: T.sub, marginTop: 4, fontWeight: 600 }}>{r.agency || r.uei || "N/A"} {r.amount ? ` • ${fmt(r.amount)}` : ""}</div>
                </div>
                {contacts.some(p => p.name === r.recipient_name) ? (
                  <Btn size="sm" variant="ghost" disabled style={{ color: T.green }}>✓ In CRM</Btn>
                ) : (
                    <Btn size="sm" variant="ghost" onClick={() => savePeer(r)}>💾 Track Peer</Btn>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {savedPeers.length > 0 && (
        <Card glow style={{ borderTop: `4px solid ${T.amber}` }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: T.text, marginBottom: 20, letterSpacing: 1, textTransform: "uppercase" }}>⭐ Watchlist: Peer Intelligence ({savedPeers.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {savedPeers.map(p => (
              <div key={p.id} style={{ borderBottom: `1px solid ${T.glassBorder}`, paddingBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: T.text, fontFamily: "Outfit" }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: T.sub, fontWeight: 700, letterSpacing: 0.5 }}>{p.agency} • {p.amount ? fmt(p.amount) : "Various"}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn size="xs" variant="primary" onClick={() => analyzePeer(p)} disabled={loading}>✨ Run Audit</Btn>
                    <button onClick={() => setSavedPeers(prev => prev.filter(x => x.id !== p.id))} style={{ background: "rgba(255,100,100,0.1)", border: "none", color: T.red, cursor: "pointer", padding: "4px 8px", borderRadius: 4, fontSize: 10 }}>✕</button>
                  </div>
                </div>

                {analysis?.id === p.id && (
                  <div style={{ fontSize: 13, color: T.sub, background: `${T.amber}05`, padding: 20, borderRadius: 12, border: `1px solid ${T.amber}22`, borderLeft: `6px solid ${T.amber}`, position: "relative", marginTop: 12 }}>
                    <div style={{ fontWeight: 800, fontSize: 11, color: T.amber, marginBottom: 12, letterSpacing: 1 }}>STRATEGIC PEER AUDIT BRIEF</div>
                    <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.7, fontStyle: "italic" }}>{analysis.text}</div>
                    <button onClick={() => setAnalysis(null)} style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", color: T.mute, cursor: "pointer", fontSize: 14 }}>✕</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
