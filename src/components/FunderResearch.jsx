import React, { useState, useEffect } from 'react';
import { Card, Input, Btn, Badge } from '../ui';
import { LS, T, uid } from '../globals';
import { API } from '../api';

export const FunderResearch = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedFunders, setSavedFunders] = useState(() => LS.get("saved_funders", []));

  useEffect(() => { LS.set("saved_funders", savedFunders); }, [savedFunders]);

  const searchSAM = async () => {
    if (!query.trim()) return;
    setLoading(true);
    const data = await API.searchSAMEntities(query);
    setResults((data.entityData || []).map(e => ({
      name: e.entityRegistration?.legalBusinessName || "Unknown",
      uei: e.entityRegistration?.ueiSAM || "",
      status: e.entityRegistration?.registrationStatus || "",
      type: e.entityRegistration?.businessTypes?.join(", ") || "",
      expiration: e.entityRegistration?.registrationExpirationDate || "",
      cage: e.entityRegistration?.cageCode || "",
    })));
    setLoading(false);
  };

  const saveFunder = (funder) => {
    if (savedFunders.some(f => f.name === funder.name)) return;
    setSavedFunders(prev => [...prev, { ...funder, id: uid(), savedAt: new Date().toISOString(), notes:"", priority:"medium" }]);
  };

  return (
    <div>
      <Card style={{ marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:8 }}>🏛️ Funder & Entity Research</div>
        <div style={{ fontSize:12, color:T.sub, marginBottom:12 }}>Search SAM.gov to research federal entities, verify registrations, and identify potential funding sources.</div>
        <div style={{ display:"flex", gap:8 }}>
          <Input value={query} onChange={setQuery} placeholder="Search entities... (e.g., Illinois Housing Authority)" style={{ flex:1 }} onKeyDown={e => e.key === "Enter" && searchSAM()} />
          <Btn variant="primary" onClick={searchSAM} disabled={loading}>{loading ? "⏳" : "🔍"} Search</Btn>
        </div>
      </Card>

      {results.length > 0 && (
        <Card style={{ marginBottom:16 }}>
          <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:8 }}>📋 SAM.gov Results ({results.length})</div>
          {results.map((r, i) => (
            <div key={i} style={{ padding:"10px 0", borderBottom:`1px solid ${T.border}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:T.text }}>{r.name}</div>
                  <div style={{ fontSize:11, color:T.mute, marginTop:2 }}>UEI: {r.uei || "N/A"} · CAGE: {r.cage || "N/A"}</div>
                  {r.type && <div style={{ fontSize:10, color:T.sub, marginTop:2 }}>{r.type}</div>}
                  <div style={{ display:"flex", gap:4, marginTop:4 }}>
                    <Badge color={r.status === "Active" ? T.green : T.yellow}>{r.status || "Unknown"}</Badge>
                    {r.expiration && <Badge color={T.mute}>Expires: {r.expiration}</Badge>}
                  </div>
                </div>
                <Btn size="sm" variant="ghost" onClick={() => saveFunder(r)}>💾 Save</Btn>
              </div>
            </div>
          ))}
        </Card>
      )}

      {savedFunders.length > 0 && (
        <Card>
          <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:8 }}>⭐ Saved Funders ({savedFunders.length})</div>
          {savedFunders.map(f => (
            <div key={f.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:`1px solid ${T.border}` }}>
              <div>
                <div style={{ fontSize:12, color:T.text }}>{f.name}</div>
                <div style={{ fontSize:10, color:T.mute }}>UEI: {f.uei || "N/A"}</div>
              </div>
              <button onClick={() => setSavedFunders(prev => prev.filter(x => x.id !== f.id))} style={{ background:"none", border:"none", color:T.red, cursor:"pointer" }}>✕</button>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};
