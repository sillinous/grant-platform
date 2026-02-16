import React, { useState, useEffect } from 'react';
import { Card, Input, Btn, Badge } from '../ui';
import { LS, T, uid } from '../globals';
import { API } from '../api';

export const FunderResearch = ({ savedFunders, setSavedFunders, vaultDocs, grants, setGrants }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("federal"); // federal (sam) or private (foundations)
  const [provisions, setProvisions] = useState(null);
  const [genLoading, setGenLoading] = useState(false);

  const calculateAffinity = (funder) => {
    if (!vaultDocs || vaultDocs.length === 0) return 50; // Neutral if no docs
    const missionText = vaultDocs.map(d => `${d.title} ${d.category} ${d.content?.slice(0, 100)}`).join(" ").toLowerCase();
    const funderText = `${funder.name} ${funder.type || ""} ${funder.focus || ""} ${funder.tip || ""}`.toLowerCase();

    // Simple keyword overlap logic
    const keywords = ["rural", "disability", "veteran", "technology", "research", "community", "education", "impact", "innovation", "healthcare"];
    let score = 50;
    keywords.forEach(k => {
      if (missionText.includes(k) && funderText.includes(k)) score += 10;
    });
    return Math.min(score, 100);
  };

  const searchSAM = async () => {
    if (!query.trim()) return;
    setLoading(true);
    const data = await API.searchSAMEntities(query);
    const mapped = (data.entityData || []).map(e => {
      const f = {
        name: e.entityRegistration?.legalBusinessName || "Unknown",
        uei: e.entityRegistration?.ueiSAM || "",
        status: e.entityRegistration?.registrationStatus || "",
        type: e.entityRegistration?.businessTypes?.join(", ") || "Federal Entity",
        expiration: e.entityRegistration?.registrationExpirationDate || "",
        cage: e.entityRegistration?.cageCode || "",
        source: "federal"
      };
      return { ...f, affinity: calculateAffinity(f) };
    });
    setResults(mapped.sort((a, b) => b.affinity - a.affinity));
    setLoading(false);
  };

  const searchFoundations = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const data = await API.searchNonprofits(query);
      const mapped = (data.organizations || []).map(org => {
        const f = {
          name: org.name,
          ein: org.ein,
          city: org.city,
          state: org.state,
          type: org.org_type || "Private Foundation",
          amount: "990 Data Available",
          tip: `Based in ${org.city}, ${org.state}. Assets: ${fmt(org.assets || 0)}.`,
          source: "private",
          propublica_url: `https://projects.propublica.org/nonprofits/organizations/${org.ein}`
        };
        return { ...f, affinity: calculateAffinity(f) };
      });
      setResults(mapped.sort((a, b) => b.affinity - a.affinity));
    } catch (e) {
      console.error(e);
      alert("ProPublica search failed. Falling back to simulation if needed.");
    }
    setLoading(false);
  };

  const generateProvisions = async () => {
    if (!query.trim()) return;
    setGenLoading(true);
    const sys = `You are an AI Search Optimizer. Take the user's mission/keyword and generate 4 platform-specific search strings to find "the hidden money."
Keyword: "${query}"

Return ONLY JSON:
{
  "queries": [
    { "platform": "Grants.gov", "string": "...", "logic": "..." },
    { "platform": "Foundation Directory", "string": "...", "logic": "..." },
    { "platform": "LinkedIn Philanthropy", "string": "...", "logic": "..." },
    { "platform": "IRS 990 Search", "string": "...", "logic": "..." }
  ]
}`;
    const res = await API.callAI([{ role: "user", content: "Optimize my lookup." }], sys);
    if (!res.error) {
      try {
        const cleaned = res.text.replace(/```json\n?|```/g, "").trim();
        setProvisions(JSON.parse(cleaned));
      } catch { console.error("Provisions parse error"); }
    }
    setGenLoading(false);
  };

  const handleSearch = () => mode === "federal" ? searchSAM() : searchFoundations();

  const saveFunder = (funder) => {
    if (savedFunders.some(f => f.name === funder.name)) return;
    setSavedFunders(prev => [...prev, { ...funder, id: uid(), savedAt: new Date().toISOString(), notes: funder.tip || "", priority: "medium" }]);
  };

  const initializeGrant = (funder) => {
    const newGrant = {
      id: uid(),
      title: funder.name,
      agency: funder.source === "federal" ? "Federal (SAM)" : "Private Foundation",
      amount: funder.amount?.replace(/[$,]/g, "") || 0,
      stage: "discovered",
      deadline: funder.expiration || "",
      description: funder.tip || `Discovered via ${funder.source} research.`,
      tags: funder.peers || [],
      createdAt: new Date().toISOString()
    };
    const updated = [...grants, newGrant];
    setGrants(updated);
    LS.set("grants", updated);
    alert(`Grant lead "${funder.name}" added to Pipeline.`);
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
          <Btn variant="ghost" onClick={generateProvisions} disabled={genLoading}>{genLoading ? "⏳" : "🧠 Optimize Query"}</Btn>
        </div>
      </Card>

      {provisions && (
        <Card style={{ marginBottom: 16, background: T.panel + "22", border: `1px dashed ${T.amber}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.amber }}>🧠 AI Search Provisor: Platform-Specific Strings</div>
            <button onClick={() => setProvisions(null)} style={{ background: "none", border: "none", color: T.sub, cursor: "pointer" }}>✕</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {provisions.queries.map((q, i) => (
              <div key={i} style={{ background: T.card, padding: 8, borderRadius: 6, border: `1px solid ${T.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: T.sub, textTransform: "uppercase" }}>{q.platform}</span>
                  <Btn size="xs" variant="ghost" onClick={() => navigator.clipboard.writeText(q.string)}>📋 Copy</Btn>
                </div>
                <div style={{ fontSize: 11, color: T.text, fontWeight: 600, fontFamily: "monospace" }}>{q.string}</div>
                <div style={{ fontSize: 9, color: T.mute, marginTop: 4 }}>{q.logic}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {results.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 8 }}>📋 {mode === "federal" ? "SAM.gov" : "Foundation"} Results ({results.length})</div>
          {results.map((r, i) => (
            <div key={i} style={{ padding: "12px 0", borderBottom: `1px solid ${T.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{r.name}</div>
                    <div style={{ display: "flex", gap: 4 }}>
                      <Badge color={r.affinity > 80 ? T.green : r.affinity > 60 ? T.amber : T.blue}>
                        🧬 {r.affinity}% AI Match
                      </Badge>
                      <Badge color={T.panel} variant="ghost" size="sm">{r.source === "federal" ? "🏛️ SAM" : "🏢 Foundation"}</Badge>
                    </div>
                  </div>
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
                        <div style={{ fontSize: 11, color: T.amber, fontWeight: 600, marginTop: 2 }}>EIN: {r.ein}</div>
                        <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{r.city}, {r.state}</div>
                        <div style={{ fontSize: 10, color: T.mute, marginTop: 4, fontStyle: "italic", borderLeft: `2px solid ${T.amber}`, paddingLeft: 8 }}>{r.tip}</div>
                        <a href={r.propublica_url} target="_blank" rel="noreferrer" style={{ fontSize: 9, color: T.blue, textDecoration: "none", marginTop: 4, display: "block" }}>🌐 View on ProPublica Nonprofit Explorer</a>
                    </>
                  )}
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <Btn size="sm" variant="ghost" onClick={() => saveFunder(r)}>💾 Save</Btn>
                  <Btn size="sm" variant="primary" onClick={() => initializeGrant(r)}>🚀 Initialize</Btn>
                </div>
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
