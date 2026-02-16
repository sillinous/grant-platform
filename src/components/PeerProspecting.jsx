import React, { useState, useEffect } from 'react';
import { Card, Input, Btn } from '../ui';
import { LS, T, fmt, uid } from '../globals';
import { API } from '../api';

export const PeerProspecting = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
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
          <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:8 }}>⭐ Saved Peers ({savedPeers.length})</div>
          {savedPeers.map(p => (
            <div key={p.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:`1px solid ${T.border}` }}>
              <div>
                <div style={{ fontSize:12, color:T.text }}>{p.name}</div>
                <div style={{ fontSize:10, color:T.mute }}>{p.agency}{p.amount ? ` · ${fmt(p.amount)}` : ""}</div>
              </div>
              <button onClick={() => setSavedPeers(prev => prev.filter(x => x.id !== p.id))} style={{ background:"none", border:"none", color:T.red, cursor:"pointer" }}>✕</button>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};
