import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn, Progress } from '../ui';
import { T, LS } from '../globals';
import { PhilanthropyAPI } from '../philanthropy';

export const PhilanthropyPulse = () => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const profile = LS.get("profile", { tags: ["AI", "Rural", "STEM"] });
        PhilanthropyAPI.getNewsPulse(profile.tags).then(data => {
            setNews(data);
            setLoading(false);
        });
    }, []);

    return (
        <div>
            <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: T.text, margin: 0 }}>Philanthropy Pulse 📡</h3>
                <p style={{ color: T.mute, fontSize: 13, marginTop: 4 }}>Real-time news and AI-matched signals from the private funding ecosystem.</p>
            </div>

            {loading ? <div style={{ color: T.mute }}>Scanning specialized philanthropy news feeds...</div> : 
                news.map(item => (
                    <Card key={item.id} glow={item.matchScore > 85} style={{ marginBottom: 15 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                                    <Badge color={T.blue}>{item.source}</Badge>
                                    <Badge color={T.shade}>{item.date}</Badge>
                                </div>
                                <h4 style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: 0, lineHeight: 1.3 }}>{item.title}</h4>
                            </div>
                            <div style={{ textAlign: "right", marginLeft: 15 }}>
                                <div style={{ fontSize: 10, color: T.mute, fontWeight: 800 }}>OPPORTUNITY MATCH</div>
                                <div style={{ fontSize: 18, fontWeight: 900, color: item.matchScore > 80 ? T.green : T.yellow }}>
                                    {Math.round(item.matchScore)}%
                                </div>
                            </div>
                        </div>

                        <p style={{ fontSize: 13, color: T.sub, lineHeight: 1.5, margin: "10px 0" }}>{item.summary}</p>

                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 15 }}>
                            {item.tags.map(tag => (
                                <span key={tag} style={{ fontSize: 10, background: T.panel, color: T.text, padding: "2px 8px", borderRadius: 4, border: `1px solid ${T.border}` }}>
                                    #{tag}
                                </span>
                            ))}
                        </div>

                        <div style={{ display: "flex", gap: 8 }}>
                            <Btn variant="primary" size="sm" style={{ flex: 1 }}>Analyze Alignment</Btn>
                            <Btn variant="ghost" size="sm">💾 Save Lead</Btn>
                        </div>
                    </Card>
                ))
            }
        </div>
    );
};
