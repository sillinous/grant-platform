import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn } from '../ui';
import { T } from '../globals';
import { API } from '../api';

export const DAFSignal = () => {
    const [signals, setSignals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.getDAFSignals().then(d => {
            setSignals(d);
            setLoading(false);
        });
    }, []);

    return (
        <div style={{ padding: 20 }}>
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: T.text, margin: 0 }}>DAF Signal 🤫</h2>
                <p style={{ color: T.mute, fontSize: 13, marginTop: 4 }}>Interception of "Advisor-Led" funding through Donor Advised Funds (anonymous philanthropy).</p>
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

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {loading ? <div style={{ color: T.mute }}>Listening to wealth advisor channels...</div> : 
                    signals.map(s => (
                        <Card key={s.id} glow style={{ background: `linear-gradient(135deg, ${T.panel}, #1a1a2e)` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                                <Badge color={T.gold}>WEALTH ADVISOR</Badge>
                                <div style={{ fontSize: 13, fontWeight: 700, color: T.gold }}>{s.grantRange}</div>
                            </div>

                            <div style={{ fontSize: 11, color: T.mute, textTransform: "uppercase" }}>INTERMEDIARY</div>
                            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: "4px 0" }}>{s.advisorFirm}</h3>
                            
                            <div style={{ marginTop: 15, padding: 12, borderLeft: `2px solid ${T.gold}`, background: `${T.gold}10` }}>
                                <div style={{ fontSize: 10, color: T.gold, fontWeight: 700 }}>CLIENT MANDATE</div>
                                <p style={{ fontSize: 13, color: T.text, margin: "6px 0", fontStyle: "italic" }}>"{s.note}"</p>
                            </div>

                            <div style={{ marginTop: 15, display: "flex", justifyContent: "space-between", fontSize: 11, color: T.sub }}>
                                <span>Focus: {s.clientFocus}</span>
                                <span>Deadline: {s.deadline}</span>
                            </div>

                            <Btn variant="primary" style={{ width: "100%", marginTop: 20 }}>Generate One-Sheet Pitch</Btn>
                        </Card>
                    ))
                }
            </div>
        </div>
    );
};
