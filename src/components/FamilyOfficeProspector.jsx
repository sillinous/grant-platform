import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn, Stat } from '../ui';
import { T, uid } from '../globals';
import { PhilanthropyAPI } from '../philanthropy';

export const FamilyOfficeProspector = ({ onAdd }) => {
    const [signals, setSignals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        PhilanthropyAPI.getUHNWSignals().then(data => {
            setSignals(data);
            setLoading(false);
        });
    }, []);

    return (
        <div>
            <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: T.text, margin: 0 }}>Family Office Prospector 💎</h3>
                <p style={{ color: T.mute, fontSize: 13, marginTop: 4 }}>Tracking "Quiet Capital" and wealth advisor signals for ultra-high-net-worth philanthropy.</p>
            </div>

            {loading ? <div style={{ color: T.mute }}>Listening to family office advisory channels...</div> : 
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15 }}>
                    {signals.map(s => (
                        <Card key={s.id} glow style={{ background: `linear-gradient(135deg, ${T.panel}, #0f172a)` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                                <Badge color={T.gold}>PRIVATE SIGNAL</Badge>
                                <Badge color={s.confidence === "High" ? T.green : T.yellow}>{s.confidence} Confidence</Badge>
                            </div>

                            <h4 style={{ fontSize: 16, fontWeight: 800, color: T.text, margin: "0 0 8px 0" }}>{s.name}</h4>
                            <p style={{ fontSize: 13, color: T.sub, lineHeight: 1.4 }}>{s.intent}</p>

                            <div style={{ marginTop: 15, padding: 10, background: T.gold + "10", borderLeft: `2px solid ${T.gold}`, borderRadius: "0 4px 4px 0" }}>
                                <div style={{ fontSize: 9, color: T.gold, fontWeight: 800, marginBottom: 4 }}>INSIDER TIP</div>
                                <div style={{ fontSize: 12, color: T.text, fontStyle: "italic" }}>"{s.outreachTip}"</div>
                            </div>

                            <div style={{ marginTop: 15, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                                <div style={{ fontSize: 10, color: T.mute, flex: 1 }}>Source: {s.source}</div>
                                <Btn variant="primary" size="sm">Request Warm Intro</Btn>
                                {onAdd && (
                                    <Btn variant="success" size="sm" onClick={() => {
                                        onAdd({
                                            id: uid(),
                                            title: s.name,
                                            agency: "Private Wealth",
                                            amount: 0,
                                            deadline: "Rolling",
                                            stage: "discovered",
                                            description: `${s.intent} Tip: ${s.outreachTip}`,
                                            category: "Family Office",
                                            createdAt: new Date().toISOString()
                                        });
                                    }}>+ Track</Btn>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            }
        </div>
    );
};
