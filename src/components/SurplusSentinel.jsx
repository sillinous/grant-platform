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

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {loading ? <div style={{ color: T.mute }}>Scanning budget committee minutes...</div> : 
                    signals.map(s => {
                        const daysLeft = daysUntil(s.eofy);
                        const progress = Math.max(0, Math.min(100, (daysLeft / 180) * 100)); // Simulating 6 month window

                        return (
                            <Card key={s.id} style={{ borderTop: `4px solid ${T.red}` }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                                    <div>
                                        <div style={{ fontSize: 13, color: T.mute, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{s.budgetPool}</div>
                                        <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>{s.jurisdiction}</div>
                                    </div>
                                    <div style={{ fontSize: 20, fontWeight: 900, color: T.green }}>{fmt(s.surplus)}</div>
                                </div>
                                
                                <div style={{ fontSize: 14, color: T.text, fontWeight: 600, padding: 12, background: `${T.amber}11`, borderRadius: 8, borderLeft: `3px solid ${T.amber}` }}>
                                    🚨 {s.alert}
                                </div>

                                <div style={{ marginTop: 24, padding: 16, background: T.panel, borderRadius: 8 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.mute, marginBottom: 8 }}>
                                        <span style={{ fontWeight: 700, letterSpacing: 0.5 }}>FISCAL DEADLINE</span>
                                        <span style={{ color: T.red, fontWeight: 800 }}>{daysLeft} DAYS REMAINING</span>
                                    </div>
                                    <div style={{ height: 8, background: T.border, borderRadius: 4, overflow: "hidden" }}>
                                        <div style={{ height: "100%", width: `${100 - progress}%`, background: T.red, borderRadius: 4 }} />
                                    </div>
                                </div>

                                <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
                                    <Btn variant="primary" style={{ flex: 1 }}>Initialize Rapid Inquiry</Btn>
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
