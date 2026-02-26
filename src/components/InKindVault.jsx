import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn, Stat, TrackBtn, SkeletonCard, Empty } from '../ui';
import { T, fmt, uid } from '../globals';
import { API } from '../api';
import { useStore } from '../store';

export const InKindVault = ({ onAdd: propOnAdd }) => {
    const { addGrant: storeOnAdd, alliances = [] } = useStore();
    const onAdd = propOnAdd || storeOnAdd;
    const [credits, setCredits] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.getInKindScale().then(d => {
            setCredits(d);
            setLoading(false);
        });
    }, []);

    const [filterCat, setFilterCat] = useState("All");

    let totalOffset = credits.reduce((acc, c) => acc + c.value, 0);

    return (
        <div style={{ padding: 20, animation: "fadeIn 0.4s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ fontSize: 24, padding: "8px", background: `${T.teal}11`, borderRadius: "8px" }}>💳</div>
                    <div>
                        <h2 style={{ fontSize: 24, fontWeight: 900, color: T.text, margin: 0 }}>In-Kind Vault</h2>
                        <p style={{ color: T.mute, fontSize: 13, marginTop: 4 }}>Aggregating high-value operational subsidies and credits.</p>
                    </div>
                </div>
                <div style={{ padding: "8px 16px", background: `${T.green}10`, borderRadius: 8, textAlign: "right" }}>
                    <div style={{ fontSize: 10, color: T.mute, fontWeight: 700 }}>TOTAL OPEX OFFSET</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: T.green }}>{fmt(totalOffset)}</div>
                </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                {["All", "Cloud Credits", "CRM Licenses", "Legal Services", "Capacity Building", "Hardware"].map(cat => (
                    <button key={cat} onClick={() => setFilterCat(cat)} style={{ padding: "4px 12px", borderRadius: 20, border: `1px solid ${filterCat === cat ? T.teal : T.border}`, background: filterCat === cat ? `${T.teal}22` : "transparent", color: filterCat === cat ? T.teal : T.sub, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{cat}</button>
                ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                {loading ? <div style={{ display: "contents" }}><SkeletonCard lines={6} /><SkeletonCard lines={6} /></div> :
                    credits.filter(c => filterCat === "All" || c.type === filterCat).length === 0 ? <div style={{ gridColumn: "1 / -1" }}><Empty icon="💳" title="No Credits in This Category" sub="Select a different category or check back later." /></div> :
                        credits.filter(c => filterCat === "All" || c.type === filterCat).map(c => (
                            <Card key={c.id} glow style={{ borderTop: `6px solid ${T.teal}`, padding: 24, position: "relative" }}>
                                {alliances.some(a => a.name.toLowerCase().includes(c.provider?.toLowerCase())) && (
                                    <div style={{ position: "absolute", top: -14, left: 16 }}>
                                        <Badge color={T.purple} style={{ fontWeight: 900, boxShadow: `0 4px 12px ${T.purple}44` }}>🤝 EXISTING ALLIANCE</Badge>
                                    </div>
                                )}
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, alignItems: "center", marginTop: alliances.some(a => a.name.toLowerCase().includes(c.provider?.toLowerCase())) ? 12 : 0 }}>
                                <Badge color={T.teal} style={{ background: `${T.teal}11`, fontWeight: 800 }}>{c.type?.toUpperCase()}</Badge>
                                <Badge color={T.sub} style={{ background: "rgba(255,255,255,0.03)", fontSize: 10, letterSpacing: 1, fontWeight: 900 }}>MATCH DIFFICULTY: {c.claimDifficulty?.toUpperCase()}</Badge>
                            </div>

                            <h3 style={{ fontSize: 20, fontWeight: 900, color: T.text, margin: 0, marginBottom: 12, fontFamily: "Outfit", lineHeight: 1.3 }}>{c.provider}</h3>
                            <div style={{ fontSize: 32, fontWeight: 900, color: T.green, marginBottom: 20, letterSpacing: "-0.04em" }}>{fmt(c.value)}</div>
                            
                            <div style={{ padding: 20, background: "rgba(255,255,255,0.02)", borderRadius: 16, fontSize: 14, color: T.sub, lineHeight: 1.7, marginBottom: 24, border: `1px solid ${T.glassBorder}` }}>
                                <div style={{ fontSize: 10, color: T.teal, fontWeight: 800, letterSpacing: 1, marginBottom: 10 }}>OPERATIONAL IMPACT</div>
                                {c.impact}
                            </div>

                            <div style={{ display: "flex", gap: 12, borderTop: `1px solid ${T.glassBorder}`, paddingTop: 24 }}>
                                <Btn variant="primary" style={{ flex: 1 }}>Claim Provision</Btn>
                                {onAdd && (
                                    <TrackBtn onTrack={() => {
                                        onAdd({
                                            id: uid(),
                                            title: `${c.provider} - ${c.type}`,
                                            agency: c.provider,
                                            amount: c.value,
                                            deadline: "Rolling",
                                            stage: "discovered",
                                            description: `Difficulty: ${c.claimDifficulty}. ${c.impact}`,
                                            category: "In-Kind Subsidy",
                                            meta: { riskScore: c.claimDifficulty?.toLowerCase() === "high" ? 60 : 30, alignmentScore: 90 },
                                            createdAt: new Date().toISOString()
                                        });
                                    }} label="+ Track Value" />
                                )}
                            </div>
                        </Card>
                    ))
                }
            </div>
        </div>
    );
};
