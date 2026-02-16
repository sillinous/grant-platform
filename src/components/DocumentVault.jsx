import React, { useState } from 'react';
import { Card, Btn, Stat, Empty, Badge, Input, Select, TextArea, Modal } from '../ui';
import { T, uid, fmtDate, Badge } from '../globals';
import { API } from '../api';

export const DocumentVault = ({ vaultDocs, setVaultDocs }) => {
    const [search, setSearch] = useState("");
    const [showAdd, setShowAdd] = useState(false);
    const [selected, setSelected] = useState(null);
    const [filter, setFilter] = useState("all");
    const [newDoc, setNewDoc] = useState({ title: "", category: "narrative", content: "", tags: [], grantIds: [], version: 1, status: "draft" });
    const [redacting, setRedacting] = useState(false);

    const redactPII = async () => {
        if (!selected) return;
        setRedacting(true);
        const sys = `You are a Privacy & Security Expert. Scan the document for PII (Personally Identifiable Information) such as Social Security Numbers, phone numbers, home addresses, and bank details. Replace them with [REDACTED]. Keep all other grant-specific technical language intact.
        Return ONLY the redacted text.`;

        const res = await API.callAI([{ role: "user", content: selected.content }], sys);
        if (!res.error) {
            updateDoc(selected.id, { content: res.text });
            setSelected({ ...selected, content: res.text });
            alert("🔒 Zero-Trust Redaction Complete: All identified PII has been masked.");
        }
        setRedacting(false);
    };

    const CATEGORIES = [
        { id: "narrative", label: "📄 Narratives", color: T.amber },
        { id: "budget", label: "💰 Budgets", color: T.green },
        { id: "letter", label: "✉️ Letters of Support", color: T.blue },
        { id: "bio", label: "👤 Bios & Resumes", color: T.purple },
        { id: "data", label: "📊 Data & Evidence", color: T.cyan },
        { id: "compliance", label: "✅ Compliance", color: T.yellow },
        { id: "template", label: "📋 Templates", color: T.orange },
        { id: "other", label: "📎 Other", color: T.mute },
    ];

    const docs = vaultDocs || [];
    const filtered = docs.filter(d => {
        if (filter !== "all" && d.category !== filter) return false;
        if (search && !d.title.toLowerCase().includes(search.toLowerCase()) && !d.content?.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const addDoc = () => {
        if (!newDoc.title) return;
        const doc = { ...newDoc, id: uid(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), versions: [{ version: 1, content: newDoc.content, date: new Date().toISOString() }] };
        setVaultDocs([...docs, doc]);
        setNewDoc({ title: "", category: "narrative", content: "", tags: [], grantIds: [], version: 1, status: "draft" });
        setShowAdd(false);
    };

    const updateDoc = (id, updates) => {
        setVaultDocs(docs.map(d => {
            if (d.id !== id) return d;
            const updated = { ...d, ...updates, updatedAt: new Date().toISOString() };
            if (updates.content && updates.content !== d.content) {
                updated.version = (d.version || 1) + 1;
                updated.versions = [...(d.versions || []), { version: updated.version, content: updates.content, date: new Date().toISOString() }];
            }
            return updated;
        }));
    };

    const deleteDoc = (id) => {
        setVaultDocs(docs.filter(d => d.id !== id));
        setSelected(null);
    };

    const duplicateDoc = (doc) => {
        const newD = { ...doc, id: uid(), title: `${doc.title} (Copy)`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        setVaultDocs([...docs, newD]);
    };

    const catMap = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

    return (
        <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <Input value={search} onChange={setSearch} placeholder="Search documents..." style={{ flex: 1 }} />
                <Btn variant="primary" onClick={() => setShowAdd(true)}>+ New Document</Btn>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                <Btn size="sm" variant={filter === "all" ? "primary" : "ghost"} onClick={() => setFilter("all")}>All ({docs.length})</Btn>
                {CATEGORIES.map(c => {
                    const count = docs.filter(d => d.category === c.id).length;
                    return count > 0 ? <Btn key={c.id} size="sm" variant={filter === c.id ? "primary" : "ghost"} onClick={() => setFilter(c.id)}>{c.label} ({count})</Btn> : null;
                })}
            </div>

            {/* Document Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 }}>
                <Card><Stat label="Total Docs" value={docs.length} color={T.amber} /></Card>
                <Card><Stat label="Drafts" value={docs.filter(d => d.status === "draft").length} color={T.yellow} /></Card>
                <Card><Stat label="Final" value={docs.filter(d => d.status === "final").length} color={T.green} /></Card>
                <Card><Stat label="Linked to Grants" value={docs.filter(d => d.grantIds?.length > 0).length} color={T.blue} /></Card>
            </div>

            {filtered.length === 0 ? <Empty icon="🗄️" title="No documents yet" sub="Create reusable documents for your grant applications" action={<Btn variant="primary" size="sm" onClick={() => setShowAdd(true)}>+ Create First Document</Btn>} /> :
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 8 }}>
                    {filtered.map(d => (
                        <Card key={d.id} onClick={() => setSelected(d)} style={{ cursor: "pointer" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                                <Badge color={catMap[d.category]?.color || T.mute}>{catMap[d.category]?.label || d.category}</Badge>
                                <Badge color={d.status === "final" ? T.green : T.yellow}>{d.status || "draft"}</Badge>
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 4 }}>{d.title}</div>
                            <div style={{ fontSize: 11, color: T.mute }}>{d.content?.slice(0, 80)}...</div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 10, color: T.dim }}>
                                <span>v{d.version || 1}</span>
                                <span>{fmtDate(d.updatedAt)}</span>
                            </div>
                            {d.grantIds?.length > 0 && <div style={{ fontSize: 10, color: T.blue, marginTop: 4 }}>🔗 Linked to {d.grantIds.length} grant{d.grantIds.length > 1 ? "s" : ""}</div>}
                        </Card>
                    ))}
                </div>
            }

            {/* Document Detail Modal */}
            <Modal open={!!selected} onClose={() => setSelected(null)} title="Document Editor" width={800}>
                {selected && (
                    <div>
                        <Input value={selected.title} onChange={v => { updateDoc(selected.id, { title: v }); setSelected({ ...selected, title: v }); }} style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }} />
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                            <Select value={selected.category} onChange={v => { updateDoc(selected.id, { category: v }); setSelected({ ...selected, category: v }); }}
                                options={CATEGORIES.map(c => ({ value: c.id, label: c.label }))} />
                            <Select value={selected.status || "draft"} onChange={v => { updateDoc(selected.id, { status: v }); setSelected({ ...selected, status: v }); }}
                                options={[{ value: "draft", label: "📄 Draft" }, { value: "review", label: "👁️ In Review" }, { value: "final", label: "✅ Final" }]} />
                            <div style={{ fontSize: 11, color: T.mute, display: "flex", alignItems: "center" }}>Version {selected.version || 1} · {(selected.versions || []).length} revisions</div>
                        </div>
                        <TextArea value={selected.content || ""} onChange={v => { updateDoc(selected.id, { content: v }); setSelected({ ...selected, content: v }); }} rows={16} placeholder="Document content..." />
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
                            <div style={{ display: "flex", gap: 8 }}>
                                <Btn size="sm" onClick={() => duplicateDoc(selected)}>📋 Duplicate</Btn>
                                <Btn size="sm" onClick={() => navigator.clipboard?.writeText(selected.content || "")}>📎 Copy</Btn>
                                <Btn size="sm" variant="primary" onClick={redactPII} disabled={redacting}>
                                    {redacting ? "⏳ Redacting..." : "🔒 Redact PII"}
                                </Btn>
                            </div>
                            <Btn variant="danger" size="sm" onClick={() => deleteDoc(selected.id)}>🗑️ Delete</Btn>
                        </div>
                        {/* Version History */}
                        {(selected.versions || []).length > 1 && (
                            <div style={{ marginTop: 16 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 8 }}>Version History</div>
                                {[...(selected.versions || [])].reverse().map((v, i) => (
                                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${T.border}`, fontSize: 11, color: T.mute }}>
                                        <span>v{v.version}</span>
                                        <span>{fmtDate(v.date)}</span>
                                        <Btn size="sm" variant="ghost" onClick={() => { updateDoc(selected.id, { content: v.content }); setSelected({ ...selected, content: v.content }); }}>Restore</Btn>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Add Document Modal */}
            <Modal open={showAdd} onClose={() => setShowAdd(false)} title="New Document">
                <div style={{ display: "grid", gap: 12 }}>
                    <Input value={newDoc.title} onChange={v => setNewDoc({ ...newDoc, title: v })} placeholder="Document title" />
                    <Select value={newDoc.category} onChange={v => setNewDoc({ ...newDoc, category: v })} options={CATEGORIES.map(c => ({ value: c.id, label: c.label }))} />
                    <TextArea value={newDoc.content} onChange={v => setNewDoc({ ...newDoc, content: v })} rows={8} placeholder="Document content..." />
                    <Btn variant="primary" onClick={addDoc}>Create Document</Btn>
                </div>
            </Modal>
        </div>
    );
};

