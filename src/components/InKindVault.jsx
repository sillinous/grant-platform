import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn, Stat, TrackBtn, SkeletonCard, Empty } from '../ui';
import { T, fmt, uid } from '../globals';
import { API } from '../api';
import { useStore } from '../store';

export const InKindVault = ({ onAdd: propOnAdd }) => {
    const { addGrant: storeOnAdd } = useStore();
    const onAdd = propOnAdd || storeOnAdd;
    const [credits, setCredits] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.getInKindScale().then(d => {
            setCredits(d);
            setLoading(false);
        });
    }, []);

    let totalOffset = credits.reduce((acc, c) => acc + c.value, 0);

    return (
        <div style={{ padding: 20, animation: "fadeIn 0.4s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
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

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                {loading ? <div style={{ display: "contents" }}><SkeletonCard lines={6} /><SkeletonCard lines={6} /></div> :
                    credits.length === 0 ? <div style={{ gridColumn: "1 / -1" }}><Empty icon="💳" title="No Available Credits" sub="Check back later for new high-value operational subsidies." /></div> :
                    credits.map(c => (
                        <Card key={c.id} glow style={{ borderTop: `6px solid ${T.teal}`, padding: 24 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, alignItems: "center" }}>
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
