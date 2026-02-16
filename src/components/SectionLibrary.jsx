import React, { useState, useEffect } from 'react';
import { Card, Btn, Badge, Input, Select, TextArea, Tab, Progress, Empty, Modal } from '../ui';
import { T, LS, uid, fmtDate } from '../globals';
import { API } from '../api';

export const SectionLibrary = ({ vaultDocs, setVaultDocs, grants, sections, setSections }) => {
  const [activeGrantId, setActiveGrantId] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [newSection, setNewSection] = useState({ title: "", category: "need", content: "", tags: [], useCount: 0 });
  const [aiQuery, setAiQuery] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [harvestResults, setHarvestResults] = useState(null);
  const [loading, setLoading] = useState(false);

  // Auto-suggest when active grant changes
  useEffect(() => {
    if (activeGrantId && grants) {
      const g = grants.find(x => x.id === activeGrantId);
      if (g) {
        setAiQuery(`Grant: ${g.title}\nAgency: ${g.agency}\nDescription: ${g.category}`);
        // Small delay to ensure state update if we want to auto-trigger findSimilar
        const timeout = setTimeout(() => {
          const btn = document.getElementById("ai-suggest-btn");
          if (btn) btn.click();
        }, 500);
        return () => clearTimeout(timeout);
      }
    }
  }, [activeGrantId, grants]);

  const SECTION_TYPES = [
    { id: "need", label: "Statement of Need", icon: "📊" }, { id: "methodology", label: "Methodology", icon: "🔬" },
    { id: "evaluation", label: "Evaluation Plan", icon: "📈" }, { id: "sustainability", label: "Sustainability", icon: "🔄" },
    { id: "capacity", label: "Organizational Capacity", icon: "🏢" }, { id: "timeline", label: "Project Timeline", icon: "📅" },
    { id: "budget_just", label: "Budget Justification", icon: "💰" }, { id: "abstract", label: "Abstract/Summary", icon: "📋" },
    { id: "impact", label: "Impact Statement", icon: "🎯" }, { id: "bio", label: "Key Personnel", icon: "👤" },
    { id: "partnership", label: "Partnerships", icon: "🤝" }, { id: "dissemination", label: "Dissemination Plan", icon: "📢" },
  ];

  const typeMap = Object.fromEntries(SECTION_TYPES.map(t => [t.id, t]));

  const addSection = () => {
    if (!newSection.title || !newSection.content) return;
    setSections(prev => [...prev, { ...newSection, id: uid(), createdAt: new Date().toISOString() }]);
    setNewSection({ title: "", category: "need", content: "", tags: [], useCount: 0 });
    setShowAdd(false);
  };

  const useSection = (section) => {
    navigator.clipboard?.writeText(section.content);
    setSections(prev => prev.map(s => s.id === section.id ? { ...s, useCount: (s.useCount || 0) + 1 } : s));
  };

  const deleteSection = (id) => setSections(prev => prev.filter(s => s.id !== id));

  const saveToVault = (section) => {
    if (!setVaultDocs) return;
    const doc = { id: uid(), title: section.title, content: section.content, category: section.category, source: "section_library", createdAt: new Date().toISOString() };
    setVaultDocs(prev => [...prev, doc]);
  };

  const harvestBoilerplate = async () => {
    if (!vaultDocs || vaultDocs.length === 0) return alert("Vault is empty. Add documents first.");
    setLoading(true);
    const content = vaultDocs.map(d => `DOC: ${d.title}\nCONTENT: ${d.content?.slice(0, 500)}`).join("\n\n---\n\n");
    const sys = `You are a Grant Content Architect. Analyze the following documents from the organization's vault.
Identify 3-5 sections that would make excellent REUSABLE boilerplate (e.g., Mission Statements, Organizational Capacity, Team Bios, Methodology fragments).

Format each as JSON:
[{"title": "...", "category": "...", "content": "...", "reason": "..."}]

Available Categories: ${SECTION_TYPES.map(t => t.id).join(", ")}`;

    const result = await API.callAI([{ role: "user", content }], sys);
    if (!result.error) {
      try {
        const cleaned = result.text.replace(/```json\n?|```/g, "").trim();
        setHarvestResults(JSON.parse(cleaned));
      } catch (e) { alert("Failed to parse boilerplate candidates."); }
    }
    setLoading(false);
  };

  const importHarvested = (item) => {
    setSections(prev => [...prev, { ...item, id: uid(), createdAt: new Date().toISOString(), useCount: 1 }]);
    setHarvestResults(prev => prev.filter(x => x !== item));
  };

  const findSimilar = async () => {
    if (!aiQuery.trim() || sections.length === 0) return;
    setLoading(true);
    const context = sections.map(s => `ID:${s.id} | Title:${s.title} | Category:${s.category}`).join('\n');
    const sys = `You are a grant platform AI. Rank the following reusable sections for relevance to the user's current need/RFP text.
User Query/RFP: ${aiQuery}

REUSABLE SECTIONS:
${context}

Return ONLY a JSON array of objects representing the top 5 matches:
[{"id":"...", "score":N, "reason":"...brief 1-sentence reason..."}]`;

    const result = await API.callAI([{ role: "user", content: "Find the most relevant sections." }], sys);
    if (!result.error) {
      try {
        const cleaned = result.text.replace(/```json\n?|```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        setAiSuggestions(parsed);
      } catch (e) { console.error("AI Ranking Error", e); }
    }
    setLoading(false);
  };

  const adaptSection = async (sectionId) => {
    const s = sections.find(x => x.id === sectionId);
    if (!s || !aiQuery.trim()) return;
    setLoading(true);
    const sys = `Refine and adapt this grant section to match the specific context of the user's current grant/RFP. Maintain the core data but adjust tone and relevance.

Current Section Title: ${s.title}
Current Section Content: ${s.content}

Target Context/RFP: ${aiQuery}

Return the adapted content only.`;

    const result = await API.callAI([{ role: "user", content: "Adapt this section." }], sys);
    if (!result.error) {
      navigator.clipboard?.writeText(result.text);
      setSections(prev => prev.map(x => x.id === sectionId ? { ...x, useCount: (x.useCount || 0) + 1 } : x));
      alert("✨ Adapted section copied to clipboard!");
    }
    setLoading(false);
  };

  const filtered = sections.filter(s => !search || s.title.toLowerCase().includes(search.toLowerCase()) || s.content.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card style={{ background: T.panel + "22" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>🧠 AI Smart Suggest</span>
            <Badge size="xs" color={T.amber}>Search</Badge>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Input value={aiQuery} onChange={setAiQuery} placeholder="Paste RFP or describe context..." style={{ flex: 1 }} />
            <Btn id="ai-suggest-btn" variant="primary" size="sm" onClick={findSimilar} disabled={loading || !aiQuery.trim()}>{loading ? "⏳" : "🔍"}</Btn>
          </div>
          {grants && (
            <div style={{ marginTop: 8 }}>
              <Select size="xs" value={activeGrantId} onChange={setActiveGrantId}
                options={[{ value: "", label: "Target an active pursuit..." }, ...grants.map(g => ({ value: g.id, label: g.title?.slice(0, 40) }))]} />
            </div>
          )}
        </Card>

        <Card style={{ background: T.panel + "22" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>🌾 AI Boilerplate Harvest</span>
            <Badge size="xs" color={T.green}>Auto</Badge>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 11, color: T.sub }}>Extract reusable sections from your Document Vault.</div>
            <Btn size="sm" variant="success" onClick={harvestBoilerplate} disabled={loading}>{loading ? "⏳" : "🚀 Harvest"}</Btn>
          </div>
        </Card>
      </div>

      {harvestResults && (
        <Card style={{ marginBottom: 16, borderColor: T.green + "88", background: T.green + "08" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.green }}>✨ Recommended Boilerplate Candidates</div>
            <Btn size="xs" variant="ghost" onClick={() => setHarvestResults(null)}>✕</Btn>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {harvestResults.map((item, i) => (
              <div key={i} style={{ background: T.card, padding: 10, borderRadius: 6, border: `1px solid ${T.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{item.title}</span>
                      <Badge size="xs" color={T.blue}>{typeMap[item.category]?.label || item.category}</Badge>
                    </div>
                    <div style={{ fontSize: 10, color: T.mute, marginTop: 2, fontStyle: "italic" }}>{item.reason}</div>
                  </div>
                  <Btn size="sm" onClick={() => importHarvested(item)}>💾 Import</Btn>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {aiSuggestions && (
        <Card style={{ marginBottom: 16, borderColor: T.amber + "88" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.amber, marginBottom: 10 }}>Top AI Matches</div>
          {aiSuggestions.map(match => {
            const s = sections.find(x => x.id === match.id);
            if (!s) return null;
            return (
              <div key={match.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{s.title}</span>
                    <Badge color={T.green}>{match.score}% Match</Badge>
                  </div>
                  <div style={{ fontSize: 11, color: T.sub, fontStyle: "italic", marginTop: 2 }}>"{match.reason}"</div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <Btn size="sm" variant="success" onClick={() => useSection(s)}>📋 Use</Btn>
                  <Btn size="sm" variant="primary" onClick={() => adaptSection(s.id)} disabled={loading}>✨ Adapt</Btn>
                </div>
              </div>
            );
          })}
        </Card>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <Input value={search} onChange={setSearch} placeholder="Filter by keyword..." style={{ flex: 1 }} />
        <Btn variant="primary" onClick={() => setShowAdd(true)}>+ Add Section</Btn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8, marginBottom: 16 }}>
        <Card><Stat label="Total Sections" value={sections.length} color={T.amber} /></Card>
        <Card><Stat label="Times Used" value={sections.reduce((s, x) => s + (x.useCount || 0), 0)} color={T.green} /></Card>
        <Card><Stat label="Categories" value={new Set(sections.map(s => s.category)).size} color={T.blue} /></Card>
      </div>

      {filtered.length === 0 ? <Empty icon="📚" title="Section library empty" sub="Add reusable sections you commonly include in grant applications" action={<Btn variant="primary" size="sm" onClick={() => setShowAdd(true)}>+ Add First Section</Btn>} /> :
        filtered.map(s => (
          <Card key={s.id} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <Badge color={T.blue}>{typeMap[s.category]?.icon} {typeMap[s.category]?.label || s.category}</Badge>
                  {s.useCount > 0 && <Badge color={T.green}>Used {s.useCount}x</Badge>}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 4 }}>{s.title}</div>
                <div style={{ fontSize: 11, color: T.sub, lineHeight: 1.5 }}>{s.content.slice(0, 150)}...</div>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <Btn size="sm" variant="success" onClick={() => useSection(s)}>📋 Copy</Btn>
                {setVaultDocs && <Btn size="sm" variant="ghost" onClick={() => saveToVault(s)}>📁 Vault</Btn>}
                <button onClick={() => deleteSection(s.id)} style={{ background: "none", border: "none", color: T.red, cursor: "pointer" }}>✕</button>
              </div>
            </div>
          </Card>
        ))
      }

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Reusable Section" width={700}>
        <div style={{ display: "grid", gap: 12 }}>
          <Input value={newSection.title} onChange={v => setNewSection({ ...newSection, title: v })} placeholder="Section title (e.g., 'Standard Org Capacity')" />
          <Select value={newSection.category} onChange={v => setNewSection({ ...newSection, category: v })} options={SECTION_TYPES.map(t => ({ value: t.id, label: `${t.icon} ${t.label}` }))} />
          <TextArea value={newSection.content} onChange={v => setNewSection({ ...newSection, content: v })} rows={10} placeholder="Paste or write your reusable section content..." />
          <Btn variant="primary" onClick={addSection}>Save to Library</Btn>
        </div>
      </Modal>
    </div>
  );
};

