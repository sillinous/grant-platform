import React, { useState } from 'react';
import { Card, Btn, Select, TextArea, Stat, Badge, Empty } from '../ui';
import { LS, T, uid } from '../globals';

export const DocumentAssembler = ({ grants, vaultDocs, setVaultDocs }) => {
  const [selectedGrant, setSelectedGrant] = useState("");
  const [sections, setSections] = useState([]);
  const [assembled, setAssembled] = useState("");
  const library = LS.get("section_library", []);

  const STANDARD_SECTIONS = [
    { id: "cover", label: "Cover Letter", order: 1 },
    { id: "abstract", label: "Abstract / Executive Summary", order: 2 },
    { id: "need", label: "Statement of Need", order: 3 },
    { id: "goals", label: "Goals & Objectives", order: 4 },
    { id: "methodology", label: "Methodology / Approach", order: 5 },
    { id: "timeline", label: "Project Timeline", order: 6 },
    { id: "evaluation", label: "Evaluation Plan", order: 7 },
    { id: "capacity", label: "Organizational Capacity", order: 8 },
    { id: "sustainability", label: "Sustainability Plan", order: 9 },
    { id: "budget_narrative", label: "Budget Narrative", order: 10 },
    { id: "personnel", label: "Key Personnel", order: 11 },
    { id: "partnerships", label: "Partnerships & Letters", order: 12 },
    { id: "dissemination", label: "Dissemination Plan", order: 13 },
  ];

  const addSection = (section) => {
    if (sections.some(s => s.id === section.id)) return;
    const vaultMatch = (vaultDocs || []).find(d => d.category === section.id || d.title.toLowerCase().includes(section.label.toLowerCase()));
    const libMatch = library.find(l => l.category === section.id);
    setSections(prev => [...prev, {
      ...section, content: vaultMatch?.content || libMatch?.content || "",
      source: vaultMatch ? "vault" : libMatch ? "library" : "empty",
      included: true,
    }].sort((a, b) => a.order - b.order));
  };

  const updateSection = (id, updates) => setSections(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  const removeSection = (id) => setSections(prev => prev.filter(s => s.id !== id));

  const assemble = () => {
    const grant = grants.find(g => g.id === selectedGrant);
    const included = sections.filter(s => s.included);
    const doc = included.map(s => {
      const divider = "═".repeat(60);
      return `${divider}\n${s.label.toUpperCase()}\n${divider}\n\n${s.content || "[SECTION NOT YET WRITTEN]"}\n`;
    }).join("\n\n");

    const header = `${"═".repeat(60)}\n${grant?.title || "GRANT APPLICATION"}\n${grant?.agency || ""}\nAssembled: ${new Date().toLocaleDateString()}\nSections: ${included.length}\n${"═".repeat(60)}\n\n`;
    setAssembled(header + doc);
  };

  const wordCount = sections.filter(s => s.included).reduce((sum, s) => sum + (s.content?.split(/\s+/).filter(Boolean).length || 0), 0);
  const completeSections = sections.filter(s => s.included && s.content && s.content.length > 50).length;
  const totalSections = sections.filter(s => s.included).length;

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 8 }}>📦 Application Assembler</div>
        <div style={{ fontSize: 11, color: T.sub, marginBottom: 12 }}>Build a complete grant application by assembling sections from your Document Vault, Section Library, and custom content. Drag sections in order and export the full package.</div>
        <Select value={selectedGrant} onChange={setSelectedGrant} style={{ marginBottom: 8 }}
          options={[{ value: "", label: "Select grant to assemble for..." }, ...grants.map(g => ({ value: g.id, label: `${g.title?.slice(0, 50)} — ${g.agency}` }))]} />
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16 }}>
        <div>
          <Card>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>📋 Standard Sections</div>
            {STANDARD_SECTIONS.map(s => {
              const added = sections.some(x => x.id === s.id);
              const hasContent = (vaultDocs || []).some(d => d.category === s.id) || library.some(l => l.category === s.id);
              return (
                <div key={s.id} onClick={() => !added && addSection(s)} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px",
                  borderRadius: 4, cursor: added ? "default" : "pointer", marginBottom: 2,
                  background: added ? T.green + "10" : "transparent", opacity: added ? 0.6 : 1,
                }}>
                  <span style={{ fontSize: 11, color: added ? T.green : T.text }}>{added ? "☑" : "☐"} {s.label}</span>
                  {hasContent && !added && <Badge color={T.blue} style={{ fontSize: 8 }}>content</Badge>}
                </div>
              );
            })}
          </Card>
          <Card style={{ marginTop: 8 }}>
            <Stat label="Sections" value={`${completeSections}/${totalSections}`} color={completeSections === totalSections && totalSections > 0 ? T.green : T.yellow} />
            <div style={{ marginTop: 8 }}><Stat label="Word Count" value={wordCount.toLocaleString()} color={T.blue} /></div>
          </Card>
        </div>

        <div>
          {sections.length === 0 ? <Empty icon="📦" title="Add sections to begin" sub="Click sections from the left panel to build your application" /> :
            <div>
              {sections.filter(s => s.included).map(s => (
                <Card key={s.id} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{s.order}. {s.label}</span>
                      <Badge color={s.source === "vault" ? T.green : s.source === "library" ? T.blue : T.mute}>
                        {s.source === "vault" ? "From Vault" : s.source === "library" ? "From Library" : "Empty"}
                      </Badge>
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => updateSection(s.id, { included: !s.included })} style={{ background: "none", border: "none", color: s.included ? T.green : T.mute, cursor: "pointer" }}>{s.included ? "☑" : "☐"}</button>
                      <button onClick={() => removeSection(s.id)} style={{ background: "none", border: "none", color: T.red, cursor: "pointer", fontSize: 11 }}>✕</button>
                    </div>
                  </div>
                  <TextArea value={s.content || ""} onChange={v => updateSection(s.id, { content: v })} rows={4} placeholder={`Write or paste your ${s.label} content here...`} />
                  <div style={{ fontSize: 10, color: T.dim, marginTop: 4 }}>{s.content?.split(/\s+/).filter(Boolean).length || 0} words</div>
                </Card>
              ))}
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <Btn variant="primary" onClick={assemble}>📦 Assemble Full Application</Btn>
                <Btn variant="ghost" onClick={() => setSections([])}>🗑️ Clear All</Btn>
              </div>
            </div>
          }

          {assembled && (
            <Card style={{ marginTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>📄 Assembled Application</span>
                <div style={{ display: "flex", gap: 4 }}>
                  <Btn size="sm" variant="ghost" onClick={() => navigator.clipboard?.writeText(assembled)}>📋 Copy All</Btn>
                  {setVaultDocs && <Btn size="sm" variant="ghost" onClick={() => {
                    const grant = grants.find(g => g.id === selectedGrant);
                    const doc = { id: uid(), title: `${grant?.title || "Application"} — Assembled`, content: assembled, category: "assembler", source: "assembler", createdAt: new Date().toISOString() };
                    setVaultDocs(prev => [...prev, doc]);
                  }}>📁 Save to Vault</Btn>}
                </div>
              </div>
              <div style={{ fontSize: 11, color: T.sub, lineHeight: 1.6, whiteSpace: "pre-wrap", padding: 12, background: T.panel, borderRadius: 6, maxHeight: 500, overflow: "auto", fontFamily: "monospace" }}>{assembled}</div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
