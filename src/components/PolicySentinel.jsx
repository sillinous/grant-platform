import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn, Stat } from '../ui';
import { T, API } from '../globals';

export const PolicySentinel = () => {
    const [signals, setSignals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const data = await API.getPolicySignals();
            setSignals(data);
            setLoading(false);
        };
        load();
    }, []);

    return (
        <div style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
                <div>
                    <h2 style={{ fontSize: 24, fontWeight: 900, color: T.text, margin: 0 }}>Policy Sentinel</h2>
                    <p style={{ color: T.mute, fontSize: 13, marginTop: 4 }}>Legislative & Regulatory Intelligence Feed</p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                    <Stat label="ACTIVE BILLS" value="14" color={T.blue} />
                    <Stat label="REG DEVIATION" value="+4.2%" color={T.amber} />
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>
                {/* ─── Main Feed ─── */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {loading ? <div style={{ color: T.mute }}>Scanning legislative records...</div> : 
                        signals.map(s => (
                            <Card key={s.id} glow style={{ borderLeft: `4px solid ${s.sentiment === 'positive' ? T.green : T.red}` }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <Badge color={s.sentiment === 'positive' ? T.green : T.red}>
                                            {s.sentiment.toUpperCase()}
                                        </Badge>
                                        <Badge color={T.blue}>{s.agency}</Badge>
                                    </div>
                                    <span style={{ fontSize: 11, color: T.mute }}>{s.date}</span>
                                </div>
                                <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: 0 }}>{s.title}</h3>
                                <p style={{ fontSize: 13, color: T.sub, marginTop: 10, lineHeight: 1.5 }}>{s.description}</p>
                                <div style={{ display: "flex", gap: 6, marginTop: 15 }}>
                                    {s.tags.map(t => <Badge key={t} size="xs" color={T.shade}>{t}</Badge>)}
                                </div>
                                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20, paddingTop: 15, borderTop: `1px solid ${T.border}` }}>
                                    <Btn variant="ghost" size="sm">Regulatory Analysis</Btn>
                                    <Btn variant="primary" size="sm">Draft Rebuttal/Support</Btn>
                                </div>
                            </Card>
                        ))
                    }
                </div>

                {/* ─── Sidebar: Intelligence Radar ─── */}
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <Card style={{ background: `${T.blue}08` }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: T.blue, letterSpacing: 1.2, marginBottom: 15 }}>SECTOR CONCENTRATION</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {['Infrastructure', 'Sustainability', 'Technology', 'Healthcare'].map((s, i) => (
                                <div key={s}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                                        <span style={{ color: T.text }}>{s}</span>
                                        <span style={{ color: T.mute }}>{80 - (i * 15)}%</span>
                                    </div>
                                    <div style={{ height: 4, background: T.border, borderRadius: 2 }}>
                                        <div style={{ height: "100%", width: `${80 - (i * 15)}%`, background: T.blue, borderRadius: 2 }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card style={{ textAlign: "center", background: `linear-gradient(180deg, ${T.green}10, transparent)` }}>
                        <div style={{ fontSize: 32, fontWeight: 900, color: T.green }}>$450M</div>
                        <div style={{ fontSize: 11, color: T.mute, marginTop: 4 }}>OPPORTUNITY SURFACE DELTA</div>
                        <p style={{ fontSize: 12, color: T.sub, marginTop: 12 }}>New policies in the last 7 days have increased the total grant surface area by 4.2%.</p>
                        <Btn variant="primary" style={{ width: "100%", marginTop: 15 }}>Review Impact Report</Btn>
                    </Card>
                </div>
            </div>
        </div>
    );
};
