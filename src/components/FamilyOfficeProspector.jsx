import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn, Stat, TrackBtn, SkeletonCard, Empty } from '../ui';
import { T, uid } from '../globals';
import { API } from '../api';
import { useStore } from '../store';

export const FamilyOfficeProspector = ({ onAdd: propOnAdd }) => {
    const { addGrant: storeOnAdd, savedFunders, setSavedFunders } = useStore();
    const onAdd = propOnAdd || storeOnAdd;
    const [signals, setSignals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.philanthropy.getUHNWSignals().then(data => {
            setSignals(data);
            setLoading(false);
        });
    }, []);

    return (
        <div className="animate-in" style={{ padding: 20 }}>
            <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 32 }}>
                <div style={{ fontSize: 28, padding: "12px", background: T.glassLg, border: `1px solid ${T.glassBorder}`, borderRadius: "14px", boxShadow: T.glow }}>💎</div>
                <div>
                    <h2 style={{ fontSize: 26, fontWeight: 800, color: T.text, margin: 0, fontFamily: "Outfit" }}>Family Office Prospector</h2>
                    <p style={{ color: T.mute, fontSize: 13, marginTop: 4 }}>Tracking "Quiet Capital" and wealth advisor signals for ultra-high-net-worth philanthropy.</p>
                </div>
            </div>

            {loading ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 24 }}><SkeletonCard lines={6} /><SkeletonCard lines={6} /></div> :
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 24 }}>
                    {signals.length === 0 ? <div style={{ gridColumn: "1 / -1" }}><Empty icon="💎" title="No Family Office Signals" sub="Monitoring wealth advisor activity and quiet capital movements for private philanthropy leads." /></div> :
                        signals.map(s => (
                            <Card key={s.id} glow style={{ borderTop: `6px solid ${T.gold}`, padding: 24 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                                    <Badge color={T.gold} style={{ background: `${T.gold}11`, letterSpacing: 1 }}>PRIVATE SIGNAL</Badge>
                                    <Badge color={s.confidence === "High" ? T.green : T.amber} style={{ background: s.confidence === "High" ? `${T.green}11` : `${T.amber}11` }}>{s.confidence?.toUpperCase()} CONFIDENCE</Badge>
                            </div>

                            <h4 style={{ fontSize: 20, fontWeight: 900, color: T.text, margin: 0, marginBottom: 12, fontFamily: "Outfit", lineHeight: 1.4 }}>{s.name}</h4>
                            <p style={{ fontSize: 14, color: T.sub, lineHeight: 1.7, margin: 0, marginBottom: 20 }}>{s.intent}</p>

                            <div style={{ padding: 20, background: "rgba(255,255,255,0.02)", borderLeft: `6px solid ${T.gold}`, borderRadius: 16, marginBottom: 24, border: `1px solid ${T.glassBorder}`, borderLeftWidth: 6 }}>
                                <div style={{ fontSize: 10, color: T.gold, fontWeight: 800, letterSpacing: 1, marginBottom: 10 }}>QUALIFIED INTEL BRIEF</div>
                                <div style={{ fontSize: 13, color: T.text, fontStyle: "italic", lineHeight: 1.6 }}>"{s.outreachTip}"</div>
                            </div>

                            <div style={{ fontSize: 11, color: T.mute, marginBottom: 24, fontWeight: 800, letterSpacing: 1 }}>SOURCE: {s.source?.toUpperCase()}</div>

                            <div style={{ display: "flex", gap: 12, borderTop: `1px solid ${T.glassBorder}`, paddingTop: 24 }}>
                                    {savedFunders?.some(f => f.name === s.name) ? (
                                        <Btn variant="ghost" disabled style={{ color: T.green, flex: 1 }}>✓ In CRM</Btn>
                                    ) : (
                                        <Btn variant="primary" style={{ flex: 1 }} onClick={() => {
                                            setSavedFunders([...(savedFunders || []), {
                                                id: uid(),
                                                name: s.name,
                                                type: "Family Office",
                                                tags: ["UHNW", s.source],
                                                addedAt: new Date().toISOString(),
                                                meta: { intent: s.intent }
                                            }]);
                                        }}>🏛️ Save to Funders</Btn>
                                    )}
                                {onAdd && (
                                    <TrackBtn onTrack={() => {
                                        onAdd({
                                            id: uid(),
                                            title: s.name,
                                            agency: "Private Wealth",
                                            amount: "TBD",
                                            deadline: "Rolling",
                                            stage: "discovered",
                                            description: `${s.intent} Tip: ${s.outreachTip}`,
                                            category: "Family Office",
                                            createdAt: new Date().toISOString()
                                        });
                                    }} label="+ Track Signal" />
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            }
        </div>
    );
};
