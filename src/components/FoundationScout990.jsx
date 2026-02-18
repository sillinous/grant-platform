import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn, Input, Progress } from '../ui';
import { T } from '../globals';
import { PhilanthropyAPI } from '../philanthropy';

export const FoundationScout990 = () => {
    const [search, setSearch] = useState("");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    const runAnalysis = async () => {
        setLoading(true);
        const res = await PhilanthropyAPI.analyzeFoundation990(search);
        setData(res);
        setLoading(false);
    };

    return (
        <div>
            <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: T.text, margin: 0 }}>990-PF Deep Scout 🧐</h3>
                <p style={{ color: T.mute, fontSize: 13, marginTop: 4 }}>Reverse-engineering private foundation priorities via IRS Form 990-PF Schedule I.</p>
            </div>

            <Card style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", gap: 8 }}>
                    <Input value={search} onChange={setSearch} placeholder="Enter foundation name or EIN (e.g. Gates Foundation)" />
                    <Btn variant="primary" onClick={runAnalysis} disabled={loading}>{loading ? "Analyzing..." : "Analyze Filing"}</Btn>
                </div>
            </Card>

            {data && (
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
                                <Progress value={h.percentage} max={100} color={T.green} height={6} />
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
                        <Btn variant="ghost" size="sm" style={{ width: "100%", marginTop: 15 }}>Generate Connection Strategy</Btn>
                    </Card>
                </div>
            )}
        </div>
    );
};
