import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn, Progress, TrackBtn, SkeletonCard, Empty } from '../ui';
import { T, LS, uid } from '../globals';
import { API } from '../api';
import { useStore } from '../store';

export const PhilanthropyPulse = ({ onAdd: propOnAdd }) => {
    const { addGrant: storeOnAdd } = useStore();
    const onAdd = propOnAdd || storeOnAdd;
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const profile = LS.get("org_profile", { tags: ["AI", "Rural", "STEM"] });
        const tags = profile.tags?.length ? profile.tags : (profile.focus || ["AI", "Rural", "STEM"]);
        API.philanthropy.getNewsPulse(tags).then(data => {
            setNews(data);
            setLoading(false);
        });
    }, []);

    return (
        <div style={{ padding: 20, animation: "fadeIn 0.4s" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 24, padding: "8px", background: `${T.blue}11`, borderRadius: "8px" }}>📡</div>
                <div>
                    <h2 style={{ fontSize: 24, fontWeight: 900, color: T.text, margin: 0 }}>Philanthropy Pulse</h2>
                    <p style={{ color: T.mute, fontSize: 13, marginTop: 4 }}>Real-time news and AI-matched signals from the private funding ecosystem.</p>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24 }}>
                {loading ? <div style={{ display: "contents" }}><SkeletonCard lines={6} /><SkeletonCard lines={6} /></div> :
                    news.length === 0 ? <div style={{ gridColumn: "1 / -1" }}><Empty icon="📡" title="No Signals Yet" sub="Monitoring private funding ecosystem for real-time news." /></div> :
                    news.map(item => (
                        <Card key={item.id} glow style={{ borderTop: `6px solid ${item.matchScore > 80 ? T.green : T.blue}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                                        <Badge color={T.blue} style={{ background: `${T.blue}11` }}>{item.source?.toUpperCase()}</Badge>
                                        <Badge color={T.sub}>{item.date?.toUpperCase()}</Badge>
                                    </div>
                                    <h4 style={{ fontSize: 20, fontWeight: 900, color: T.text, margin: 0, lineHeight: 1.4, fontFamily: "Outfit" }}>{item.title}</h4>
                                </div>
                                <div style={{ textAlign: "right", marginLeft: 24 }}>
                                    <div style={{ fontSize: 10, color: T.mute, fontWeight: 800, letterSpacing: 1, marginBottom: 4 }}>STRATEGIC ALIGNMENT</div>
                                    <div style={{ fontSize: 28, fontWeight: 900, color: item.matchScore > 80 ? T.green : T.amber, letterSpacing: "-0.04em" }}>
                                        {Math.round(item.matchScore)}%
                                    </div>
                                </div>
                            </div>

                            <div style={{ fontSize: 14, color: T.sub, lineHeight: 1.7, margin: "0 0 20px 0", padding: "20px", background: "rgba(255,255,255,0.02)", borderRadius: 16, border: `1px solid ${T.glassBorder}` }}>
                                {item.summary}
                            </div>

                            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24 }}>
                                {item.tags.map(tag => (
                                    <Badge key={tag} color={T.blue} style={{ background: `${T.blue}08`, textTransform: "none", fontWeight: 700 }}>#{tag}</Badge>
                                ))}
                            </div>

                            <div style={{ display: "flex", gap: 12, borderTop: `1px solid ${T.glassBorder}`, paddingTop: 24 }}>
                                <Btn variant="primary" style={{ flex: 1 }}>Intelligence Brief</Btn>
                                {onAdd && (
                                    <TrackBtn onTrack={() => {
                                        onAdd({
                                            id: uid(),
                                            title: item.title,
                                            agency: item.source,
                                            amount: "TBD",
                                            deadline: "Rolling",
                                            stage: "discovered",
                                            description: item.summary,
                                            category: "Philanthropy Signal",
                                            createdAt: new Date().toISOString()
                                        });
                                    }} label="+ Track Intelligence" />
                                )}
                            </div>
                        </Card>
                    ))
                }
            </div>
        </div>
    );
};
