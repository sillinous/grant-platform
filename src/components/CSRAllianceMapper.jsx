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
        <div style={{ padding: 20, animation: "fadeIn 0.4s" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 24, padding: "8px", background: `${T.blue}11`, borderRadius: "8px" }}>🤝</div>
                <div>
                    <h2 style={{ fontSize: 24, fontWeight: 900, color: T.text, margin: 0 }}>CSR Alliance Mapper</h2>
                    <p style={{ color: T.mute, fontSize: 13, marginTop: 4 }}>Syncing your capabilities with Corporate Social Responsibility (CSR) strategic unallocated budgets.</p>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {loading ? <div style={{ color: T.mute }}>Mapping corporate ESG objectives...</div> : 
                    results.map(r => (
                        <Card key={r.id} style={{ borderTop: `4px solid ${T.blue}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                                <Badge color={T.shade}>{r.company}</Badge>
                                <Badge color={T.blue}>{r.status}</Badge>
                            </div>

                            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: 0, marginBottom: 8 }}>{r.goal}</h3>
                            <p style={{ fontSize: 13, color: T.sub, margin: 0, lineHeight: 1.5, height: 40, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{r.description}</p>

                            <div style={{ marginTop: 16, padding: 12, background: T.panel, borderRadius: 8 }}>
                                <div style={{ fontSize: 11, color: T.mute, fontWeight: 700, letterSpacing: 0.5, marginBottom: 8 }}>SYNERGETIC TAGS</div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                    {r.synergeticTags.map(tag => <Badge key={tag} size="xs" color={T.blue} style={{ opacity: 0.8 }}>{tag}</Badge>)}
                                </div>
                            </div>

                            <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <div style={{ fontSize: 10, color: T.mute, fontWeight: 700, letterSpacing: 0.5, marginBottom: 2 }}>EST. BUDGET</div>
                                    <div style={{ fontSize: 18, fontWeight: 900, color: T.green }}>{fmt(r.budget)}</div>
                                </div>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <Btn variant="primary" size="sm">Alliance Deck</Btn>
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

            <Card style={{ marginTop: 24, background: `linear-gradient(90deg, ${T.blue}11, transparent)`, borderColor: T.blue + "33", borderLeft: `4px solid ${T.blue}` }}>
                <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                    <div style={{ fontSize: 24 }}>💡</div>
                    <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.5 }}>
                        <strong style={{ color: T.text, display: "block", marginBottom: 4 }}>PRO-TIP</strong> These are not "grants" in the traditional sense. They are strategic corporate expense-line items. They move 5x faster than federal grants and have 90% less administrative overhead.
                    </div>
                </div>
            </Card>
        </div>
    );
};
