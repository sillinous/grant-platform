import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn, Stat } from '../ui';
import { T, fmt, uid } from '../globals';
import { API } from '../api';

export const CSRAllianceMapper = ({ onAdd }) => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.searchCSRPartnerships().then(d => {
            setResults(d);
            setLoading(false);
        });
    }, []);

    return (
        <div style={{ padding: 20 }}>
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: T.text, margin: 0 }}>CSR Alliance Mapper 🤝</h2>
                <p style={{ color: T.mute, fontSize: 13, marginTop: 4 }}>Syncing your capabilities with Corporate Social Responsibility (CSR) strategic unallocated budgets.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {loading ? <div style={{ color: T.mute }}>Mapping corporate ESG objectives...</div> : 
                    results.map(r => (
                        <Card key={r.id} glow style={{ borderLeft: `4px solid ${T.blue}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                                <Badge color={T.shade}>{r.company}</Badge>
                                <Badge color={T.blue}>{r.status}</Badge>
                            </div>

                            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: 0 }}>{r.goal}</h3>
                            <p style={{ fontSize: 13, color: T.sub, marginTop: 10, lineHeight: 1.5 }}>{r.description}</p>

                            <div style={{ marginTop: 15, display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {r.synergeticTags.map(tag => <Badge key={tag} size="xs" color={T.blue} style={{ opacity: 0.8 }}>{tag}</Badge>)}
                            </div>

                            <div style={{ marginTop: 20, paddingTop: 15, borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ fontSize: 18, fontWeight: 900, color: T.text }}>{fmt(r.budget)}</div>
                                <div style={{ display: "flex", gap: 10 }}>
                                    <Btn variant="primary" size="sm">Request Alliance Deck</Btn>
                                    {onAdd && (
                                        <Btn variant="success" size="sm" onClick={() => {
                                            onAdd({
                                                id: uid(),
                                                title: r.goal,
                                                agency: r.company,
                                                amount: r.budget,
                                                deadline: "Rolling",
                                                stage: "discovered",
                                                description: `Status: ${r.status}. ${r.description}`,
                                                category: "CSR Partnership",
                                                createdAt: new Date().toISOString()
                                            });
                                        }}>+ Track CSR</Btn>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))
                }
            </div>

            <Card style={{ marginTop: 30, background: `${T.blue}05`, textAlign: "center" }}>
                <p style={{ fontSize: 12, color: T.sub, margin: 0 }}>
                    💡 <b>PRO-TIP:</b> These are not "grants" in the traditional sense. They are strategic corporate expense-line items. They move 5x faster than federal grants and have 90% less administrative overhead.
                </p>
            </Card>
        </div>
    );
};
