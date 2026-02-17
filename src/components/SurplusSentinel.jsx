import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn, Progress } from '../ui';
import { T, API, fmt, daysUntil } from '../globals';

export const SurplusSentinel = () => {
    const [signals, setSignals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.getSurplusSignals().then(d => {
            setSignals(d);
            setLoading(false);
        });
    }, []);

    return (
        <div style={{ padding: 20 }}>
            <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                    <h2 style={{ fontSize: 22, fontWeight: 900, color: T.text, margin: 0 }}>Surplus Sentinel ⏳</h2>
                    <p style={{ color: T.mute, fontSize: 13, marginTop: 4 }}>Tracking "Use it or Lose it" budget spend-downs across state and municipal pools.</p>
                </div>
                <Badge color={T.red}>CRITICAL Q4 CYCLE</Badge>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {loading ? <div style={{ color: T.mute }}>Scanning budget committee minutes...</div> : 
                    signals.map(s => {
                        const daysLeft = daysUntil(s.eofy);
                        const progress = Math.max(0, Math.min(100, (daysLeft / 180) * 100)); // Simulating 6 month window

                        return (
                            <Card key={s.id} glow style={{ background: `linear-gradient(135deg, ${T.panel}, transparent)` }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 15 }}>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{s.jurisdiction}</div>
                                    <div style={{ fontSize: 16, fontWeight: 900, color: T.green }}>{fmt(s.surplus)}</div>
                                </div>
                                
                                <div style={{ fontSize: 11, color: T.mute, textTransform: "uppercase", letterSpacing: 1 }}>{s.budgetPool}</div>
                                <div style={{ marginTop: 10, fontSize: 13, color: T.amber, fontWeight: 600 }}>🚨 {s.alert}</div>

                                <div style={{ marginTop: 20 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.mute, marginBottom: 4 }}>
                                        <span>FISCAL DEADLINE</span>
                                        <span style={{ color: T.red, fontWeight: 700 }}>{daysLeft} DAYS REMAINING</span>
                                    </div>
                                    <div style={{ height: 6, background: T.border, borderRadius: 3 }}>
                                        <div style={{ height: "100%", width: `${100 - progress}%`, background: T.red, borderRadius: 3 }} />
                                    </div>
                                </div>

                                <Btn variant="primary" style={{ width: "100%", marginTop: 20 }}>Initialize Rapid Inquiry</Btn>
                            </Card>
                        );
                    })
                }
            </div>
        </div>
    );
};
