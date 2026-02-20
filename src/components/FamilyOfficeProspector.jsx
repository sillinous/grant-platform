import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn, Stat, TrackBtn } from '../ui';
import { T, uid } from '../globals';
import { API } from '../api';

export const FamilyOfficeProspector = ({ onAdd }) => {
    const [signals, setSignals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.philanthropy.getUHNWSignals().then(data => {
            setSignals(data);
            setLoading(false);
        });
    }, []);

    return (
        <div style={{ padding: 20, animation: "fadeIn 0.4s" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 24, padding: "8px", background: `${T.gold}11`, borderRadius: "8px" }}>💎</div>
                <div>
                    <h2 style={{ fontSize: 24, fontWeight: 900, color: T.text, margin: 0 }}>Family Office Prospector</h2>
                    <p style={{ color: T.mute, fontSize: 13, marginTop: 4 }}>Tracking "Quiet Capital" and wealth advisor signals for ultra-high-net-worth philanthropy.</p>
                </div>
            </div>

            {loading ? <div style={{ color: T.mute }}>Listening to family office advisory channels...</div> : 
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    {signals.map(s => (
                        <Card key={s.id} style={{ borderTop: `4px solid ${T.gold}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                                <Badge color={T.gold}>PRIVATE SIGNAL</Badge>
                                <Badge color={s.confidence === "High" ? T.green : T.yellow}>{s.confidence} Confidence</Badge>
                            </div>

                            <h4 style={{ fontSize: 16, fontWeight: 800, color: T.text, margin: 0, marginBottom: 8, height: 44, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{s.name}</h4>
                            <p style={{ fontSize: 13, color: T.sub, lineHeight: 1.5, margin: 0, marginBottom: 16, height: 40, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{s.intent}</p>

                            <div style={{ padding: 12, background: `${T.gold}11`, borderLeft: `3px solid ${T.gold}`, borderRadius: 8, marginBottom: 16 }}>
                                <div style={{ fontSize: 10, color: T.gold, fontWeight: 800, letterSpacing: 0.5, marginBottom: 4 }}>INSIDER TIP</div>
                                <div style={{ fontSize: 13, color: T.text, fontStyle: "italic", lineHeight: 1.5 }}>"{s.outreachTip}"</div>
                            </div>

                            <div style={{ fontSize: 11, color: T.mute, marginBottom: 16 }}>Source: {s.source}</div>

                            <div style={{ display: "flex", gap: 10, borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
                                <Btn variant="primary" style={{ flex: 1 }}>Request Warm Intro</Btn>
                                {onAdd && (
                                    <TrackBtn onTrack={() => {
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
                                    }} defaultLabel="+ Track" />
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            }
        </div>
    );
};
