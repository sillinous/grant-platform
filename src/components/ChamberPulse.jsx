import React, { useState, useEffect } from 'react';
import { T, fmt, uid, PROFILE } from '../globals';
import { API } from '../api';
import { Card, Badge, Btn, TrackBtn, SkeletonCard, Empty } from '../ui';
import { useStore } from '../store';

export const ChamberPulse = ({ onAdd: propOnAdd }) => {
    const { addGrant: storeOnAdd } = useStore();
    const onAdd = propOnAdd || storeOnAdd;
    const [grants, setGrants] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.getChamberGrants().then(d => {
            setGrants(d);
            setLoading(false);
        });
    }, []);

    return (
        <div style={{ padding: 20, animation: "fadeIn 0.4s" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 24, padding: "8px", background: `${T.orange}11`, borderRadius: "8px" }}>🏛️</div>
                <div>
                    <h2 style={{ fontSize: 24, fontWeight: 900, color: T.text, margin: 0 }}>Chamber Pulse</h2>
                    <p style={{ color: T.mute, fontSize: 13, marginTop: 4 }}>Hyper-local grants from Business Improvement Districts (BIDs), SBA programs, and federal small business awards.</p>
                </div>
            </div>

            <Card style={{ padding: "16px 20px", background: `${T.orange}08`, border: `1px solid ${T.orange}22`, display: "flex", alignItems: "center", gap: 12, borderRadius: 12, marginBottom: 20 }}>
                <span style={{ fontSize: 20 }}>📍</span>
                <div style={{ fontSize: 14, color: T.sub }}>
                    Scanning SBA resources and USASpending awards near <b style={{ color: T.text }}>{PROFILE.loc || PROFILE.zip || "your registered location"}</b>.
                </div>
            </Card>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {loading ? (
                    <>
                        <SkeletonCard lines={3} style={{ borderLeft: `6px solid ${T.orange}` }} />
                        <SkeletonCard lines={3} style={{ borderLeft: `6px solid ${T.orange}` }} />
                    </>
                ) : grants.length === 0 ? (
                    <Empty icon="🏛️" title="No Local Grants Found" sub="Checking Business Improvement Districts and SBA programs." />
                ) : grants.map(g => (
                    <Card key={g.id} glow style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderLeft: `6px solid ${T.orange}`, padding: "20px 24px", gap: 20 }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
                                <Badge color={T.orange} style={{ background: `${T.orange}11` }}>{g.agency || g.org || "Local"}</Badge>
                                {g.awardType && <Badge color={T.sub}>{g.awardType}</Badge>}
                                {g.status && <Badge color={g.status === "Open" ? T.green : T.mute}>{g.status}</Badge>}
                            </div>
                            <h3 style={{ fontSize: 17, fontWeight: 800, color: T.text, margin: "0 0 8px", fontFamily: "Outfit", lineHeight: 1.3 }}>
                                {g.link ? (
                                    <a href={g.link} target="_blank" rel="noopener noreferrer"
                                        style={{ color: T.text, textDecoration: "none" }}
                                        onMouseEnter={e => e.target.style.color = T.blue}
                                        onMouseLeave={e => e.target.style.color = T.text}>
                                        {g.title} <span style={{ fontSize: 11, color: T.blue, fontWeight: 400 }}>↗</span>
                                    </a>
                                ) : g.title}
                            </h3>
                            {g.description && <p style={{ fontSize: 13, color: T.sub, margin: "0 0 8px", lineHeight: 1.6 }}>{g.description}</p>}
                            <div style={{ display: "flex", gap: 10, fontSize: 11, color: T.mute, flexWrap: "wrap" }}>
                                {g.deadline && g.deadline !== "Rolling" && <span>⏰ {String(g.deadline).slice(0, 10)}</span>}
                                {g.deadline === "Rolling" && <span>Rolling deadline</span>}
                                {g.link && <a href={g.link} target="_blank" rel="noopener noreferrer" style={{ color: T.blue, textDecoration: "none" }}>View source ↗</a>}
                            </div>
                        </div>
                        <div style={{ textAlign: "right", minWidth: 150, flexShrink: 0 }}>
                            <div style={{ fontSize: 11, color: T.mute, fontWeight: 800, letterSpacing: 1, marginBottom: 4 }}>FUNDING</div>
                            <div style={{ fontSize: 26, fontWeight: 900, color: T.text, letterSpacing: "-0.02em", marginBottom: 12 }}>
                                {typeof g.amount === "number" && g.amount > 0
                                    ? g.amount >= 1e6 ? `$${(g.amount / 1e6).toFixed(1)}M` : fmt(g.amount)
                                    : "Varies"}
                            </div>
                            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                                {g.link && (
                                    <a href={g.link} target="_blank" rel="noopener noreferrer">
                                        <Btn size="sm" variant="ghost">View ↗</Btn>
                                    </a>
                                )}
                                {onAdd && (
                                    <TrackBtn onTrack={() => onAdd({
                                        id: uid(),
                                        title: g.title,
                                        agency: g.agency || g.org,
                                        amount: g.amount,
                                        deadline: g.deadline || "Rolling",
                                        stage: "discovered",
                                        description: g.description,
                                        category: "Local/Chamber",
                                        link: g.link,
                                        createdAt: new Date().toISOString()
                                    })} label="+ Track" />
                                )}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};
