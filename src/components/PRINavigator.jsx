import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn, Stat } from '../ui';
import { T, fmt, uid } from '../globals';
import { API } from '../api';

export const PRINavigator = ({ onAdd }) => {
    const [signals, setSignals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.getPRISignals().then(d => {
            setSignals(d);
            setLoading(false);
        });
    }, []);

    return (
        <div style={{ padding: 20, animation: "fadeIn 0.4s" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 24, padding: "8px", background: `${T.green}11`, borderRadius: "8px" }}>🏦</div>
                <div>
                    <h2 style={{ fontSize: 24, fontWeight: 900, color: T.text, margin: 0 }}>PRI Navigator</h2>
                    <p style={{ color: T.mute, fontSize: 13, marginTop: 4 }}>Accessing Program-Related Investments: Low-interest, high-impact capital that foundations MUST deploy.</p>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {loading ? <div style={{ color: T.mute }}>Analyzing foundation balance sheets...</div> : 
                    signals.map(s => (
                        <Card key={s.id} style={{ borderTop: `4px solid ${T.green}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                                <Badge color={T.green}>RATE: {s.rate}</Badge>
                                <div style={{ textAlign: "right" }}>
                                    <div style={{ fontSize: 10, color: T.mute, fontWeight: 700, letterSpacing: 0.5 }}>TERM</div>
                                    <div style={{ fontSize: 15, fontWeight: 800, color: T.text }}>{s.term}</div>
                                </div>
                            </div>

                            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: 0, marginBottom: 8 }}>{s.foundation}</h3>
                            <div style={{ fontSize: 24, fontWeight: 900, color: T.green, marginBottom: 16 }}>{fmt(s.amount)}</div>
                            
                            <div style={{ padding: 12, background: T.panel, borderRadius: 8, fontSize: 13, color: T.sub, lineHeight: 1.5, marginBottom: 20 }}>
                                <div style={{ fontSize: 11, color: T.mute, fontWeight: 700, letterSpacing: 0.5, marginBottom: 4 }}>🎯 FOCUS</div>
                                <div style={{ color: T.text, fontWeight: 600, marginBottom: 6 }}>{s.focus}</div>
                                <span style={{ fontSize: 12, display: "block" }}>{s.logic}</span>
                            </div>

                            <div style={{ display: "flex", gap: 10, borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
                                <Btn variant="primary" style={{ flex: 1 }}>Investment Prequel</Btn>
                                <Btn variant="ghost">Tax Compliance</Btn>
                                {onAdd && (
                                    <Btn variant="success" onClick={() => {
                                        onAdd({
                                            id: uid(),
                                            title: s.foundation,
                                            agency: s.foundation,
                                            amount: s.amount,
                                            deadline: "Rolling",
                                            stage: "discovered",
                                            description: `Term: ${s.term}. Rate: ${s.rate}. Focus: ${s.focus}.`,
                                            category: "PRI",
                                            createdAt: new Date().toISOString()
                                        });
                                    }}>+ Track PRI</Btn>
                                )}
                            </div>
                        </Card>
                    ))
                }
            </div>

            <Card style={{ marginTop: 24, background: `linear-gradient(90deg, ${T.green}11, transparent)`, borderColor: T.green + "33", borderLeft: `4px solid ${T.green}` }}>
                <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                    <div style={{ fontSize: 24 }}>📈</div>
                    <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.5 }}>
                        <strong style={{ color: T.text, display: "block", marginBottom: 4 }}>The PRI Opportunity</strong> Program-Related Investments count towards a foundation's mandatory 5% annual payout but are often underutilized. For you, this is "Recoverable Funding" that builds organizational credit.
                    </div>
                </div>
            </Card>
        </div>
    );
};
