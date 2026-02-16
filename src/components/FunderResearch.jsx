import React, { useState, useEffect } from 'react';
import { Card, Input, Btn, Badge } from '../ui';
import { LS, T, uid } from '../globals';
import { API } from '../api';

export const FunderResearch = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("federal"); // federal (sam) or private (foundations)
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
      type: e.entityRegistration?.businessTypes?.join(", ") || "Federal Entity",
      expiration: e.entityRegistration?.registrationExpirationDate || "",
      cage: e.entityRegistration?.cageCode || "",
      source: "federal"
    })));
    setLoading(false);
  };

  const searchFoundations = async () => {
    if (!query.trim()) return;
    setLoading(true);
    const sys = `You are a Private Foundation Researcher. Find 5 realistic or major US private foundations that match the keyword/mission: "${query}".
For each foundation, provide:
1. Name
2. Typical Grant Range (e.g., $25k - $500k)
3. Primary Focus Areas
4. 1-sentence "Quick Tip" for the application.
5. 3 local organizations (peers) that realistically received funding from them (990 simulation).

Return ONLY JSON array:
[{"name": "...", "amount": "...", "type": "...", "tip": "...", "peers": ["Peer A", "Peer B"]}]`;

    const result = await API.callAI([{ role: "user", content: `Search for funders related to: ${query}` }], sys);
    if (!result.error) {
      try {
        const cleaned = result.text.replace(/```json\n?|```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        setResults(parsed.map(p => ({ ...p, source: "private" })));
      } catch (e) { alert("Failed to parse foundation data."); }
    } else { alert(result.error); }
    setLoading(false);
  };

  const handleSearch = () => mode === "federal" ? searchSAM() : searchFoundations();

  const saveFunder = (funder) => {
    if (savedFunders.some(f => f.name === funder.name)) return;
    setSavedFunders(prev => [...prev, { ...funder, id: uid(), savedAt: new Date().toISOString(), notes: funder.tip || "", priority: "medium" }]);
  };

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>🏛️ Funder & Entity Research</div>
          <div style={{ display: "flex", gap: 4, background: T.panel, padding: 2, borderRadius: 6 }}>
            {["federal", "private"].map(m => (
              <Btn key={m} size="xs" variant={mode === m ? "primary" : "ghost"} onClick={() => { setMode(m); setResults([]); }}>
                {m === "federal" ? "Federal (SAM)" : "Private (Foundations)"}
              </Btn>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 12, color: T.sub, marginBottom: 12 }}>
          {mode === "federal"
            ? "Search SAM.gov to research federal entities, verify registrations, and identify potential funding sources."
            : "Use AI to discover private foundations, community funds, and corporate giving programs matching your mission."}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Input value={query} onChange={setQuery} placeholder={mode === "federal" ? "Search entities... (e.g., Illinois Housing Authority)" : "Mission or keyword... (e.g., Rural STEM education)"} style={{ flex: 1 }} onKeyDown={e => e.key === "Enter" && handleSearch()} />
          <Btn variant="primary" onClick={handleSearch} disabled={loading}>{loading ? "⏳" : "🔍"} Search</Btn>
        </div>
      </Card>

      {results.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 8 }}>📋 {mode === "federal" ? "SAM.gov" : "Foundation"} Results ({results.length})</div>
          {results.map((r, i) => (
            <div key={i} style={{ padding: "12px 0", borderBottom: `1px solid ${T.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{r.name}</div>
                  {mode === "federal" ? (
                    <>
                      <div style={{ fontSize: 11, color: T.mute, marginTop: 2 }}>UEI: {r.uei || "N/A"} · CAGE: {r.cage || "N/A"}</div>
                      <div style={{ fontSize: 10, color: T.sub, marginTop: 2 }}>{r.type}</div>
                      <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                        <Badge color={r.status === "Active" ? T.green : T.yellow}>{r.status || "Unknown"}</Badge>
                        {r.expiration && <Badge color={T.mute}>Expires: {r.expiration}</Badge>}
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 11, color: T.amber, fontWeight: 600, marginTop: 2 }}>{r.amount}</div>
                      <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{r.type}</div>
                      <div style={{ fontSize: 10, color: T.mute, marginTop: 4, fontStyle: "italic", borderLeft: `2px solid ${T.amber}`, paddingLeft: 8 }}>Tip: {r.tip}</div>
                        {r.peers && (
                          <div style={{ marginTop: 8 }}>
                            <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase" }}>Recent Recipients (990 Intel)</div>
                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 2 }}>
                              {r.peers.map((p, pi) => <Badge key={pi} size="xs" variant="ghost" color={T.blue}>{p}</Badge>)}
                            </div>
                          </div>
                        )}
                    </>
                  )}
                </div>
                <Btn size="sm" variant="ghost" onClick={() => saveFunder(r)}>💾 Save</Btn>
              </div>
            </div>
          ))}
        </Card>
      )}

      {savedFunders.length > 0 && (
        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 8 }}>⭐ Saved Research ({savedFunders.length})</div>
          {savedFunders.map(f => (
            <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ fontSize: 12, color: T.text }}>{f.name}</div>
                  <Badge size="xs" variant="ghost">{f.source === "federal" ? "FED" : "PRI"}</Badge>
                </div>
                <div style={{ fontSize: 10, color: T.mute }}>{f.source === "federal" ? `UEI: ${f.uei}` : f.amount}</div>
              </div>
              <button onClick={() => setSavedFunders(prev => prev.filter(x => x.id !== f.id))} style={{ background: "none", border: "none", color: T.red, cursor: "pointer", padding: 8 }}>✕</button>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};
