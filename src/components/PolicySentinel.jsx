import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn, Stat, TrackBtn } from '../ui';
import { T, uid } from '../globals';
import { API } from '../api';

export const PolicySentinel = ({ onAdd }) => {
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
        <div style={{ padding: 20, animation: "fadeIn 0.4s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ fontSize: 24, padding: "8px", background: `${T.purple}11`, borderRadius: "8px" }}>⚖️</div>
                    <div>
                        <h2 style={{ fontSize: 24, fontWeight: 900, color: T.text, margin: 0 }}>Policy Sentinel</h2>
                        <p style={{ color: T.mute, fontSize: 13, marginTop: 4 }}>Legislative & Regulatory Intelligence Feed</p>
                    </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                    <Stat label="ACTIVE BILLS" value="14" color={T.blue} />
                    <Stat label="REG DEVIATION" value="+4.2%" color={T.amber} />
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>
                {/* ─── Main Feed ─── */}
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    {loading ? <SkeletonCard lines={8} /> : 
                        signals.map(s => (
                            <Card key={s.id} glow style={{ borderLeft: `8px solid ${s.sentiment === 'positive' ? T.green : T.red}`, padding: 24 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                                    <div style={{ display: "flex", gap: 10 }}>
                                        <Badge color={s.sentiment === 'positive' ? T.green : T.red} style={{ background: s.sentiment === 'positive' ? `${T.green}11` : `${T.red}11`, fontWeight: 800 }}>
                                            {s.sentiment.toUpperCase()} FORECAST
                                        </Badge>
                                        <Badge color={T.blue} style={{ background: `${T.blue}11`, fontWeight: 800 }}>{s.agency?.toUpperCase()}</Badge>
                                    </div>
                                    <span style={{ fontSize: 11, color: T.mute, fontWeight: 900, letterSpacing: 1 }}>{s.date?.toUpperCase()}</span>
                                </div>
                                <h3 style={{ fontSize: 20, fontWeight: 900, color: T.text, margin: 0, marginBottom: 12, fontFamily: "Outfit", lineHeight: 1.4 }}>{s.title}</h3>
                                <div style={{ fontSize: 14, color: T.sub, lineHeight: 1.7, padding: "20px", background: "rgba(255,255,255,0.02)", borderRadius: 16, border: `1px solid ${T.glassBorder}` }}>{s.description}</div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
                                    {s.tags.map(t => <Badge key={t} color={T.blue} style={{ background: `${T.blue}08`, textTransform: "none" }}>#{t}</Badge>)}
                                </div>
                                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24, paddingTop: 24, borderTop: `1px solid ${T.glassBorder}` }}>
                                    <Btn variant="primary">Executive Summary</Btn>
                                    {onAdd && (
                                        <TrackBtn onTrack={() => {
                                            onAdd({
                                                id: uid(),
                                                title: s.title,
                                                agency: s.agency,
                                                amount: 0,
                                                deadline: s.date,
                                                stage: "discovered",
                                                description: `Sentiment: ${s.sentiment.toUpperCase()}. ${s.description}`,
                                                category: "Policy Signal",
                                                createdAt: new Date().toISOString()
                                            });
                                        }} label="+ Track Signal" />
                                    )}
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
