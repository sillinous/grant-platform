import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn, Progress, TrackBtn } from '../ui';
import { T, LS, uid } from '../globals';
import { API } from '../api';

export const PhilanthropyPulse = ({ onAdd }) => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const profile = LS.get("profile", { tags: ["AI", "Rural", "STEM"] });
        API.philanthropy.getNewsPulse(profile.tags).then(data => {
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

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
                {loading ? <div style={{ color: T.mute }}>Scanning specialized philanthropy news feeds...</div> :
                    news.map(item => (
                        <Card key={item.id} style={{ borderTop: `4px solid ${item.matchScore > 80 ? T.green : T.blue}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                                        <Badge color={T.blue}>{item.source}</Badge>
                                        <Badge color={T.shade}>{item.date}</Badge>
                                    </div>
                                    <h4 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: 0, lineHeight: 1.3 }}>{item.title}</h4>
                                </div>
                                <div style={{ textAlign: "right", marginLeft: 16 }}>
                                    <div style={{ fontSize: 10, color: T.mute, fontWeight: 800, letterSpacing: 0.5, marginBottom: 4 }}>OPPORTUNITY MATCH</div>
                                    <div style={{ fontSize: 24, fontWeight: 900, color: item.matchScore > 80 ? T.green : T.yellow }}>
                                        {Math.round(item.matchScore)}%
                                    </div>
                                </div>
                            </div>

                            <p style={{ fontSize: 13, color: T.sub, lineHeight: 1.5, margin: "0 0 16px 0", padding: 12, background: T.panel, borderRadius: 8 }}>{item.summary}</p>

                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                                {item.tags.map(tag => (
                                    <span key={tag} style={{ fontSize: 11, background: T.blue, color: "#fff", padding: "4px 8px", borderRadius: 4, fontWeight: 700, letterSpacing: 0.5 }}>
                                        #{tag}
                                    </span>
                                ))}
                            </div>

                            <div style={{ display: "flex", gap: 10, borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
                                <Btn variant="primary" style={{ flex: 1 }}>Analyze Alignment</Btn>
                                <TrackBtn onTrack={() => console.log("Saved Lead locally")} defaultLabel="💾 Save" />
                                {onAdd && (
                                    <TrackBtn onTrack={() => {
                                        onAdd({
                                            id: uid(),
                                            title: item.title,
                                            agency: item.source,
                                            amount: 0,
                                            deadline: "Rolling",
                                            stage: "discovered",
                                            description: item.summary,
                                            category: "News Signal",
                                            createdAt: new Date().toISOString()
                                        });
                                    }} defaultLabel="+ Track" />
                                )}
                            </div>
                        </Card>
                    ))
                }
            </div>
        </div>
    );
};
