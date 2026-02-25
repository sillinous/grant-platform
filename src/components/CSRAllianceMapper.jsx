import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn, Stat, TrackBtn, SkeletonCard, Empty } from '../ui';
import { T, fmt, uid } from '../globals';
import { API } from '../api';
import { useStore } from '../store';

export const CSRAllianceMapper = ({ onAdd: propOnAdd }) => {
    const { addGrant: storeOnAdd } = useStore();
    const onAdd = propOnAdd || storeOnAdd;
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

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                {loading ? <div style={{ display: "contents" }}><SkeletonCard lines={6} /><SkeletonCard lines={6} /></div> :
                    results.length === 0 ? <div style={{ gridColumn: "1 / -1" }}><Empty icon="🤝" title="No Corporate Partners Found" sub="Monitoring CSR initiatives and strategic corporate budgets." /></div> :
                    results.map(r => (
                        <Card key={r.id} glow style={{ borderTop: `6px solid ${T.blue}`, padding: 24 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, alignItems: "center" }}>
                                <Badge color={T.blue} style={{ background: `${T.blue}11`, fontWeight: 800, padding: "6px 12px" }}>{r.company?.toUpperCase()}</Badge>
                                <Badge color={r.status === "Open" ? T.green : T.amber} style={{ background: r.status === "Open" ? `${T.green}11` : `${T.amber}11`, fontSize: 11, fontWeight: 900 }}>{r.status?.toUpperCase()}</Badge>
                            </div>

                            <h3 style={{ fontSize: 20, fontWeight: 900, color: T.text, margin: 0, marginBottom: 12, fontFamily: "Outfit", lineHeight: 1.4 }}>{r.goal}</h3>
                            <p style={{ fontSize: 14, color: T.sub, margin: 0, lineHeight: 1.7, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", marginBottom: 24 }}>{r.description}</p>

                            <div style={{ padding: 20, background: "rgba(255,255,255,0.02)", borderRadius: 16, border: `1px solid ${T.glassBorder}`, marginBottom: 24 }}>
                                <div style={{ fontSize: 10, color: T.sub, fontWeight: 900, letterSpacing: 2, marginBottom: 12 }}>ESG STRATEGIC SYNERGIES</div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                    {r.synergeticTags?.map(tag => <Badge key={tag} color={T.blue} style={{ background: `${T.blue}08`, textTransform: "none", fontWeight: 700 }}>#{tag}</Badge>)}
                                </div>
                            </div>

                            <div style={{ borderTop: `1px solid ${T.glassBorder}`, paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <div style={{ fontSize: 10, color: T.mute, fontWeight: 800, letterSpacing: 1, marginBottom: 4 }}>ALLOCATED CSR BUDGET</div>
                                    <div style={{ fontSize: 24, fontWeight: 900, color: T.green, letterSpacing: "-0.04em" }}>{fmt(r.budget)}</div>
                                </div>
                                <div style={{ display: "flex", gap: 10 }}>
                                    <Btn variant="primary">Alliance Deck</Btn>
                                    {onAdd && (
                                        <TrackBtn onTrack={() => {
                                            onAdd({
                                                id: uid(),
                                                title: r.goal,
                                                agency: r.company,
                                                amount: r.budget,
                                                deadline: "Rolling",
                                                stage: "discovered",
                                                description: `Status: ${r.status}. ${r.description}`,
                                                category: "CSR Alliance",
                                                createdAt: new Date().toISOString()
                                            });
                                        }} label="+ Track" />
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
