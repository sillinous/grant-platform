import React, { useState } from 'react';
import { Card, Btn, Badge, Select, Empty, Modal } from '../ui';
import { T, fmt, fmtDate, LS, uid } from '../globals';

export const SubmissionAssembler = ({ grants, vaultDocs, sections }) => {
    const [selectedGrantId, setSelectedGrantId] = useState("");
    const [manifest, setManifest] = useState([]);
    const [isExporting, setIsExporting] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const grant = grants.find(g => g.id === selectedGrantId);
    const docs = vaultDocs || [];
    const library = sections || [];

    const addToManifest = (item, type) => {
        if (manifest.some(m => m.id === item.id)) return;
        setManifest([...manifest, { ...item, manifestType: type }]);
    };

    const removeFromManifest = (id) => {
        setManifest(manifest.filter(m => m.id !== id));
    };

    const generatePackage = () => {
        setIsExporting(true);
        // Simulate package generation
        setTimeout(() => {
            const blob = new Blob([JSON.stringify({
                grant: grant.title,
                agency: grant.agency,
                timestamp: new Date().toISOString(),
                files: manifest.map(m => ({ title: m.title, type: m.manifestType, length: m.content?.length }))
            }, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Submission_Package_${grant.title.replace(/\s+/g, '_')}.json`;
            a.click();
            setIsExporting(false);
            alert("📦 Submission Package Manifest Generated! In a production environment, this would initiate a multi-file ZIP download.");
        }, 1500);
    };

    return (
        <div>
            <Card style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>📦 Submission Assembler</div>
                <div style={{ fontSize: 11, color: T.sub, marginBottom: 16 }}>Bundle your narratives, budgets, and vault documents into a final submission-ready package.</div>
                
                <Select 
                    value={selectedGrantId} 
                    onChange={setSelectedGrantId}
                    options={[{ value: "", label: "Select target grant pursuit..." }, ...grants.map(g => ({ value: g.id, label: g.title }))]} 
                    style={{ marginBottom: 16 }}
                />

                {grant && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 8 }}>📚 AVAILABLE MATERIALS</div>
                            
                            <div style={{ fontSize: 10, fontWeight: 600, color: T.amber, marginBottom: 4 }}>Section Library</div>
                            <div style={{ display: "grid", gap: 4, marginBottom: 12 }}>
                                {library.map(s => (
                                    <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: T.panel, padding: "4px 8px", borderRadius: 4 }}>
                                        <span style={{ fontSize: 10 }}>{s.title}</span>
                                        <Btn size="xs" variant="ghost" onClick={() => addToManifest(s, "library")}>+</Btn>
                                    </div>
                                ))}
                            </div>

                            <div style={{ fontSize: 10, fontWeight: 600, color: T.blue, marginBottom: 4 }}>Document Vault</div>
                            <div style={{ display: "grid", gap: 4 }}>
                                {docs.map(d => (
                                    <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: T.panel, padding: "4px 8px", borderRadius: 4 }}>
                                        <span style={{ fontSize: 10 }}>{d.title || d.name}</span>
                                        <Btn size="xs" variant="ghost" onClick={() => addToManifest(d, "vault")}>+</Btn>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ borderLeft: `1px solid ${T.border}`, paddingLeft: 16 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: T.green, marginBottom: 8 }}>📋 PACKAGE MANIFEST</div>
                            {manifest.length === 0 ? (
                                <div style={{ fontSize: 10, color: T.mute, textAlign: "center", marginTop: 20 }}>No items added to package.</div>
                            ) : (
                                <div style={{ display: "grid", gap: 8 }}>
                                    {manifest.map(m => (
                                        <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: T.border + "33", padding: "6px 10px", borderRadius: 4 }}>
                                            <div>
                                                <div style={{ fontSize: 11, fontWeight: 600 }}>{m.title || m.name}</div>
                                                <Badge size="xs" color={m.manifestType === "vault" ? T.blue : T.amber}>{m.manifestType.toUpperCase()}</Badge>
                                            </div>
                                            <Btn size="xs" variant="ghost" onClick={() => removeFromManifest(m.id)}>✕</Btn>
                                        </div>
                                    ))}
                                    <Btn variant="primary" style={{ marginTop: 16, width: "100%" }} onClick={generatePackage} disabled={isExporting}>
                                        {isExporting ? "⏳ Packaging..." : "🚀 Generate Submission Package"}
                                    </Btn>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};
