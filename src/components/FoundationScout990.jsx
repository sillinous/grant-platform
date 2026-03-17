import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn, Input, Progress, TrackBtn, SkeletonCard, Empty } from '../ui';
import { T, uid } from '../globals';
import { API } from '../api';
import { useStore } from '../store';

export const FoundationScout990 = ({ onAdd: propOnAdd }) => {
    const { addGrant: storeOnAdd, contacts, setContacts } = useStore();
    const onAdd = propOnAdd || storeOnAdd;
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
                    <Input value={search} onChange={v => setSearch(v)} placeholder="Enter foundation name or EIN (e.g. Gates Foundation)" style={{ flex: 1 }} />
                    <Btn variant="primary" onClick={runAnalysis} disabled={loading}>{loading ? "Analyzing..." : "Analyze Filing"}</Btn>
                </div>
            </Card>

            {!data && !loading && (
                <div style={{ marginTop: 24 }}>
                    <Empty icon="🧐" title="Search for a Foundation" sub="Enter a foundation name or EIN to analyze their 990-PF filing history and giving patterns." />
                </div>
            )}

            {loading && (
                <div style={{ marginTop: 24 }}><SkeletonCard lines={6} /></div>
            )}

            {data && data.error && !loading && (
                <div style={{ padding: 16, background: `${T.red}11`, color: T.red, borderRadius: 8, border: `1px solid ${T.red}33`, fontSize: 13, marginBottom: 16 }}>
                    {data.error}
                </div>
            )}

            {data && !data.error && (
                <div style={{ animation: "fadeIn 0.4s", display: "flex", flexDirection: "column", gap: 24 }}>
                    <Card glow style={{ borderTop: `4px solid ${T.green}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 32 }}>
                            <div>
                                <h4 style={{ fontSize: 24, fontWeight: 900, color: T.text, margin: 0, fontFamily: "Outfit", letterSpacing: "-0.02em" }}>{search || "Foundation Target"}</h4>
                                <div style={{ fontSize: 12, color: T.sub, marginTop: 6, fontWeight: 700, letterSpacing: 0.5 }}>EIN: {data.ein} • LAST FILED: {data.lastFiled?.toUpperCase()}</div>
                            </div>
                            <Badge color={T.green} style={{ fontSize: 14, padding: "8px 16px", background: `${T.green}11` }}>{data.growthRate} GROWTH</Badge>
                        </div>

                        <div style={{ fontSize: 11, fontWeight: 800, color: T.mute, marginBottom: 20, letterSpacing: 2 }}>GIVING DISTRIBUTION SPECTRUM</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                            {data.givingHistory.map((h, i) => (
                                <div key={i}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 10 }}>
                                        <span style={{ color: T.text, fontWeight: 700 }}>{h.category?.toUpperCase()}</span>
                                        <span style={{ fontWeight: 900, color: T.green }}>{h.amount} ({h.percentage}%)</span>
                                    </div>
                                    <Progress value={animateDist ? h.percentage : 0} max={100} color={T.green} height={10} />
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card glow style={{ borderTop: `4px solid ${T.blue}` }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: T.mute, marginBottom: 20, letterSpacing: 2 }}>TRUSTEE ALIGNMENT NETWORK</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                            {data.trusteeNetwork.map((t, i) => (
                                <div key={i} style={{ padding: 20, background: "rgba(255,255,255,0.02)", borderRadius: 16, border: `1px solid ${T.glassBorder}` }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                        <div style={{ fontSize: 16, fontWeight: 800, color: T.text, fontFamily: "Outfit" }}>{t.name}</div>
                                        {contacts.some(c => c.name === t.name) ? (
                                            <Badge color={T.green}>✓ LINKED</Badge>
                                        ) : (
                                            <Btn size="xs" variant="ghost" onClick={() => {
                                                setContacts([...(contacts || []), {
                                                    id: uid(),
                                                    name: t.name,
                                                    role: "Foundation Trustee",
                                                    influenceScore: 90,
                                                    associatedGrants: [search],
                                                    lastInteraction: new Date().toISOString(),
                                                    meta: { affiliations: t.connections }
                                                }]);
                                            }}>👤 CRM Sync</Btn>
                                        )}
                                    </div>
                                    <div style={{ fontSize: 10, color: T.mute, marginTop: 12, marginBottom: 12, fontWeight: 800, letterSpacing: 1 }}>AFFILIATIONS:</div>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                        {t.connections.map(c => <Badge key={c} color={T.blue} style={{ textTransform: "none", background: `${T.blue}08` }}>{c}</Badge>)}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: "flex", gap: 12, marginTop: 32, borderTop: `1px solid ${T.glassBorder}`, paddingTop: 32 }}>
                            <Btn variant="primary" style={{ flex: 1 }}>Connection Strategy</Btn>
                            {onAdd && (
                                <TrackBtn onTrack={() => {
                                    onAdd({
                                        id: uid(),
                                        title: search || "Foundation Target",
                                        agency: "Private Foundation",
                                        amount: "TBD",
                                        deadline: "Rolling",
                                        stage: "discovered",
                                        description: `Identified via 990-PF Scout. Growth Rate: ${data.growthRate}.`,
                                        category: "Foundation",
                                        createdAt: new Date().toISOString()
                                    });
                                }} label="+ Track Foundation" />
                            )}
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};
