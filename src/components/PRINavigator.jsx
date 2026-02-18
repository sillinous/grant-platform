import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn, Stat } from '../ui';
import { T, fmt } from '../globals';
import { API } from '../api';

export const PRINavigator = () => {
    const [signals, setSignals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.getPRISignals().then(d => {
            setSignals(d);
            setLoading(false);
        });
    }, []);

    return (
        <div style={{ padding: 20 }}>
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: T.text, margin: 0 }}>PRI Navigator 🏦</h2>
                <p style={{ color: T.mute, fontSize: 13, marginTop: 4 }}>Accessing Program-Related Investments: Low-interest, high-impact capital that foundations MUST deploy.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {loading ? <div style={{ color: T.mute }}>Analyzing foundation balance sheets...</div> : 
                    signals.map(s => (
                        <Card key={s.id} glow style={{ borderTop: `4px solid ${T.green}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 15 }}>
                                <Badge color={T.green}>RATE: {s.rate}</Badge>
                                <div style={{ textAlign: "right" }}>
                                    <div style={{ fontSize: 10, color: T.mute }}>TERM</div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{s.term}</div>
                                </div>
                            </div>

                            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: 0 }}>{s.foundation}</h3>
                            <div style={{ fontSize: 20, fontWeight: 900, color: T.green, marginTop: 8 }}>{fmt(s.amount)}</div>
                            
                            <div style={{ marginTop: 15, padding: 10, background: `${T.shade}10`, borderRadius: 6, fontSize: 13, color: T.sub, lineHeight: 1.5 }}>
                                🎯 <b>FOCUS:</b> {s.focus}<br/>
                                <span style={{ fontSize: 12, marginTop: 5, display: "block" }}>{s.logic}</span>
                            </div>

                            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                                <Btn variant="primary" style={{ flex: 1 }}>Submit Investment Prequel</Btn>
                                <Btn variant="ghost">Tax Compliance</Btn>
                            </div>
                        </Card>
                    ))
                }
            </div>

            <Card style={{ marginTop: 30, background: `linear-gradient(90deg, ${T.green}10, transparent)`, borderColor: T.green + "33" }}>
                <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                    <div style={{ fontSize: 32 }}>📈</div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>The PRI Opportunity</div>
                        <p style={{ fontSize: 12, color: T.sub, margin: "4px 0 0" }}>Program-Related Investments count towards a foundation's mandatory 5% annual payout but are often underutilized. For you, this is "Recoverable Funding" that builds organizational credit.</p>
                    </div>
                </div>
            </Card>
        </div>
    );
};
