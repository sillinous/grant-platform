import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn, Input, Progress, TrackBtn } from '../ui';
import { T, uid } from '../globals';
import { API } from '../api';

export const FoundationScout990 = ({ onAdd }) => {
    const [search, setSearch] = useState("");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    const [animateDist, setAnimateDist] = useState(false);

    const runAnalysis = async () => {
        if (!search) return;
        setLoading(true);
        setData(null);
        setAnimateDist(false);
        try {
            const res = await API.philanthropy.analyzeFoundation990(search);
            if (!res || res.error) throw new Error("Not Found");
            setData(res);
            setTimeout(() => setAnimateDist(true), 100);
        } catch (e) {
            setData({ error: "No 990-PF records found for a foundation with that name or EIN." });
        }
        setLoading(false);
    };

    return (
        <div style={{ padding: 20, animation: "fadeIn 0.4s" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 24, padding: "8px", background: `${T.gold}11`, borderRadius: "8px" }}>🧐</div>
                <div>
                    <h2 style={{ fontSize: 24, fontWeight: 900, color: T.text, margin: 0 }}>990-PF Deep Scout</h2>
                    <p style={{ color: T.mute, fontSize: 13, marginTop: 4 }}>Reverse-engineering private foundation priorities via IRS Form 990-PF Schedule I.</p>
                </div>
            </div>

            <Card style={{ marginBottom: 20, background: T.panel }}>
                <div style={{ display: "flex", gap: 12 }}>
                    <Input value={search} onChange={setSearch} placeholder="Enter foundation name or EIN (e.g. Gates Foundation)" style={{ flex: 1 }} />
                    <Btn variant="primary" onClick={runAnalysis} disabled={loading}>{loading ? "Analyzing..." : "Analyze Filing"}</Btn>
                </div>
            </Card>

            {data && data.error && (
                <div style={{ padding: 16, background: `${T.red}11`, color: T.red, borderRadius: 8, border: `1px solid ${T.red}33`, fontSize: 13, marginBottom: 16 }}>
                    {data.error}
                </div>
            )}

            {data && !data.error && (
                <div style={{ animation: "fadeIn 0.4s" }}>
                    <Card style={{ marginBottom: 15 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 15 }}>
                            <div>
                                <h4 style={{ fontSize: 16, fontWeight: 800, color: T.text, margin: 0 }}>{search || "Gates Foundation"}</h4>
                                <div style={{ fontSize: 11, color: T.mute }}>EIN: {data.ein} | Last Filed: {data.lastFiled}</div>
                            </div>
                            <Badge color={T.green}>{data.growthRate}</Badge>
                        </div>

                        <div style={{ fontSize: 12, fontWeight: 700, color: T.sub, marginBottom: 10, textTransform: "uppercase" }}>Giving Distribution (Last 12 Months)</div>
                        {data.givingHistory.map((h, i) => (
                            <div key={i} style={{ marginBottom: 10 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                                    <span style={{ color: T.text }}>{h.category}</span>
                                    <span style={{ fontWeight: 600, color: T.green }}>{h.amount} ({h.percentage}%)</span>
                                </div>
                                <Progress value={animateDist ? h.percentage : 0} max={100} color={T.green} height={6} />
                            </div>
                        ))}
                    </Card>

                    <Card>
                        <div style={{ fontSize: 12, fontWeight: 700, color: T.sub, marginBottom: 10, textTransform: "uppercase" }}>Trustee Alignment Network</div>
                        {data.trusteeNetwork.map((t, i) => (
                            <div key={i} style={{ padding: 12, background: T.panel, borderRadius: 8, border: `1px solid ${T.border}` }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{t.name}</div>
                                <div style={{ fontSize: 11, color: T.mute, marginTop: 4 }}>Secondary Affiliations:</div>
                                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                                    {t.connections.map(c => <Badge key={c} color={T.blue}>{c}</Badge>)}
                                </div>
                            </div>
                        ))}
                        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                            <Btn variant="primary" style={{ flex: 1 }}>Connection Strategy</Btn>
                            {onAdd && (
                                <TrackBtn onTrack={() => {
                                    onAdd({
                                        id: uid(),
                                        title: search || "Foundation Target",
                                        agency: "Private Foundation",
                                        amount: 0,
                                        deadline: "Rolling",
                                        stage: "discovered",
                                        description: `Identified via 990-PF Scout. Growth Rate: ${data.growthRate}.`,
                                        category: "Foundation",
                                        createdAt: new Date().toISOString()
                                    });
                                }} defaultLabel="+ Track Foundation" />
                            )}
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};
