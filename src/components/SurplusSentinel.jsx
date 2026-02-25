import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn, Progress, TrackBtn } from '../ui';
import { T, fmt, daysUntil, uid } from '../globals';
import { API } from '../api';

export const SurplusSentinel = ({ onAdd }) => {
    const [signals, setSignals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.getSurplusSignals().then(d => {
            setSignals(d);
            setLoading(false);
        });
    }, []);

    return (
        <div style={{ padding: 20, animation: "fadeIn 0.4s" }}>
            <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ fontSize: 24, padding: "8px", background: `${T.red}11`, borderRadius: "8px" }}>⏳</div>
                    <div>
                        <h2 style={{ fontSize: 24, fontWeight: 900, color: T.text, margin: 0 }}>Surplus Sentinel</h2>
                        <p style={{ color: T.mute, fontSize: 13, marginTop: 4 }}>Tracking "Use it or Lose it" budget spend-downs across state and municipal pools.</p>
                    </div>
                </div>
                <Badge color={T.red}>CRITICAL Q4 CYCLE</Badge>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                {loading ? <div style={{ display: "contents" }}><SkeletonCard lines={6} /><SkeletonCard lines={6} /></div> : 
                    signals.map(s => {
                        const daysLeft = daysUntil(s.eofy);
                        const progress = Math.max(0, Math.min(100, (daysLeft / 180) * 100)); // Simulating 6 month window

                        return (
                            <Card key={s.id} glow style={{ borderTop: `6px solid ${T.red}`, padding: 24 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, alignItems: "flex-start" }}>
                                    <div>
                                        <div style={{ fontSize: 10, color: T.mute, textTransform: "uppercase", letterSpacing: 2, fontWeight: 900, marginBottom: 6 }}>{s.budgetPool?.toUpperCase()}</div>
                                        <div style={{ fontSize: 20, fontWeight: 900, color: T.text, fontFamily: "Outfit", lineHeight: 1.2 }}>{s.jurisdiction}</div>
                                    </div>
                                    <div style={{ fontSize: 24, fontWeight: 900, color: T.green, textAlign: "right", letterSpacing: "-0.04em" }}>{fmt(s.surplus)}</div>
                                </div>
                                
                                <div style={{ fontSize: 14, color: T.text, fontWeight: 700, padding: 16, background: `${T.red}08`, borderRadius: 16, borderLeft: `6px solid ${T.red}`, marginBottom: 24 }}>
                                    ⚠️ {s.alert}
                                </div>

                                <div style={{ marginTop: "auto", padding: 20, background: "rgba(255,255,255,0.02)", borderRadius: 16, border: `1px solid ${T.glassBorder}` }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.mute, marginBottom: 12 }}>
                                        <span style={{ fontWeight: 900, letterSpacing: 1 }}>FISCAL EPOCH DEADLINE</span>
                                        <span style={{ color: T.red, fontWeight: 900, letterSpacing: 1 }}>{daysLeft} DAYS REMAINING</span>
                                    </div>
                                    <Progress value={100 - progress} max={100} color={T.red} height={10} />
                                </div>

                                <div style={{ marginTop: 24, display: "flex", gap: 12, borderTop: `1px solid ${T.glassBorder}`, paddingTop: 24 }}>
                                    <Btn variant="primary" style={{ flex: 1 }}>Expedited Inquiry</Btn>
                                    {onAdd && (
                                        <TrackBtn onTrack={() => {
                                            onAdd({
                                                id: uid(),
                                                title: `${s.jurisdiction} - ${s.budgetPool} Surplus`,
                                                agency: s.jurisdiction,
                                                amount: s.surplus,
                                                deadline: s.eofy,
                                                stage: "discovered",
                                                description: `${s.alert}. Budget Pool: ${s.budgetPool}`,
                                                category: "Surplus Fund",
                                                createdAt: new Date().toISOString()
                                            });
                                        }} defaultLabel="+ Track Pool" />
                                    )}
                                </div>
                            </Card>
                        );
                    })
                }
            </div>
        </div>
    );
};
