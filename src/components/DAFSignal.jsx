import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn } from '../ui';
import { T, uid } from '../globals';
import { API } from '../api';

export const DAFSignal = ({ onAdd }) => {
    const [signals, setSignals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.getDAFSignals().then(d => {
            setSignals(d);
            setLoading(false);
        });
    }, []);

    return (
        <div style={{ padding: 20, animation: "fadeIn 0.4s" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 24, padding: "8px", background: `${T.gold}11`, borderRadius: "8px" }}>🤫</div>
                <div>
                    <h2 style={{ fontSize: 24, fontWeight: 900, color: T.text, margin: 0 }}>DAF Signal</h2>
                    <p style={{ color: T.mute, fontSize: 13, marginTop: 4 }}>Interception of "Advisor-Led" funding through Donor Advised Funds (anonymous philanthropy).</p>
                </div>
            </div>

            {API.fortuna.isLinked() && (
                <Card style={{ marginBottom: 24, background: T.green + "08", border: `1px solid ${T.green}33` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: T.green }}>Fortuna Auto-Philanthropy Active ⚡</div>
                            <div style={{ fontSize: 12, color: T.text, marginTop: 4 }}>Profit Milestone reached: **$10,000 surplus** detected.</div>
                        </div>
                        <Btn variant="primary" size="sm">Execute DAF Transfer</Btn>
                    </div>
                </Card>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {loading ? <div style={{ color: T.mute }}>Listening to wealth advisor channels...</div> : 
                    signals.map(s => (
                        <Card key={s.id} style={{ borderTop: `4px solid ${T.gold}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                                <Badge color={T.gold}>WEALTH ADVISOR</Badge>
                                <div style={{ fontSize: 14, fontWeight: 800, color: T.gold }}>{s.grantRange}</div>
                            </div>

                            <div style={{ fontSize: 10, color: T.mute, fontWeight: 700, letterSpacing: 0.5, marginBottom: 4 }}>INTERMEDIARY</div>
                            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: 0 }}>{s.advisorFirm}</h3>
                            
                            <div style={{ padding: 12, background: `${T.gold}11`, borderRadius: 8, margin: "16px 0", borderLeft: `3px solid ${T.gold}` }}>
                                <div style={{ fontSize: 10, color: T.gold, fontWeight: 700, letterSpacing: 0.5, marginBottom: 6 }}>CLIENT MANDATE</div>
                                <p style={{ fontSize: 13, color: T.text, margin: 0, fontStyle: "italic", lineHeight: 1.5 }}>"{s.note}"</p>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.sub, marginBottom: 16 }}>
                                <div><span style={{ fontWeight: 600, color: T.text }}>Focus:</span> {s.clientFocus}</div>
                                <div><span style={{ fontWeight: 600, color: T.text }}>Deadline:</span> {s.deadline}</div>
                            </div>

                            <div style={{ display: "flex", gap: 10, borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
                                <Btn variant="primary" style={{ flex: 1 }}>One-Sheet Pitch</Btn>
                                {onAdd && (
                                    <Btn variant="success" onClick={() => {
                                        onAdd({
                                            id: uid(),
                                            title: s.advisorFirm,
                                            agency: "Donor Advised Fund",
                                            amount: 0,
                                            deadline: s.deadline || "Rolling",
                                            stage: "discovered",
                                            description: `Advisor: ${s.advisorFirm}. Focus: ${s.clientFocus}. Note: ${s.note}`,
                                            category: "DAF",
                                            createdAt: new Date().toISOString()
                                        });
                                    }}>+ Track Lead</Btn>
                                )}
                            </div>
                        </Card>
                    ))
                }
            </div>
        </div>
    );
};
