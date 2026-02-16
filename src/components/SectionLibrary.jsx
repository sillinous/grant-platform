import React, { useState, useEffect } from 'react';
import { Card, Input, Btn, Select, TextArea, Stat, Badge, Empty, Modal } from '../ui';
import { LS, T, uid } from '../globals';

export const SectionLibrary = ({ vaultDocs, setVaultDocs }) => {
  const [sections, setSections] = useState(() => LS.get("section_library", []));
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [newSection, setNewSection] = useState({ title: "", category: "need", content: "", tags: [], useCount: 0 });

  useEffect(() => { LS.set("section_library", sections); }, [sections]);

  const SECTION_TYPES = [
    { id: "need", label: "Statement of Need", icon: "📊" }, { id: "methodology", label: "Methodology", icon: "🔬" },
    { id: "evaluation", label: "Evaluation Plan", icon: "📈" }, { id: "sustainability", label: "Sustainability", icon: "🔄" },
    { id: "capacity", label: "Organizational Capacity", icon: "🏢" }, { id: "timeline", label: "Project Timeline", icon: "📅" },
    { id: "budget_just", label: "Budget Justification", icon: "💰" }, { id: "abstract", label: "Abstract/Summary", icon: "📋" },
    { id: "impact", label: "Impact Statement", icon: "🎯" }, { id: "bio", label: "Key Personnel", icon: "👤" },
    { id: "partnership", label: "Partnerships", icon: "🤝" }, { id: "dissemination", label: "Dissemination Plan", icon: "📢" },
  ];

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

  const filtered = sections.filter(s => !search || s.title.toLowerCase().includes(search.toLowerCase()) || s.content.toLowerCase().includes(search.toLowerCase()));
  const typeMap = Object.fromEntries(SECTION_TYPES.map(t => [t.id, t]));

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <Input value={search} onChange={setSearch} placeholder="Search library..." style={{ flex: 1 }} />
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
