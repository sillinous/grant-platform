import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn, Progress, TrackBtn, SkeletonCard, Empty } from '../ui';
import { T, fmt, uid } from '../globals';
import { API } from '../api';

export const CBALedger = ({ onAdd }) => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.getCBASignals().then(d => {
            setProjects(d);
            setLoading(false);
        });
    }, []);

    return (
        <div style={{ padding: 20, animation: "fadeIn 0.4s" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 24, padding: "8px", background: `${T.orange}11`, borderRadius: "8px" }}>🏗️</div>
                <div>
                    <h2 style={{ fontSize: 24, fontWeight: 900, color: T.text, margin: 0 }}>CBA Ledger</h2>
                    <p style={{ color: T.mute, fontSize: 13, marginTop: 4 }}>Accessing "Community Benefit Agreement" funds mandated for mega-developments.</p>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {loading ? <><SkeletonCard lines={6} /><SkeletonCard lines={6} /></> : 
                    projects.map(p => {
                        return (
                            <Card key={p.id} glow style={{ borderTop: `4px solid ${T.orange}` }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                                    <Badge color={T.orange} style={{ background: `${T.orange}11` }}>DEVELOPER FUND</Badge>
                                    <Badge color={T.sub}>{p.status}</Badge>
                                </div>

                                <h3 style={{ fontSize: 18, fontWeight: 800, color: T.text, margin: 0, marginBottom: 6, fontFamily: "Outfit", height: 48, overflow: "hidden", lineHeight: 1.3 }}>{p.project}</h3>
                                <div style={{ fontSize: 13, color: T.sub, marginBottom: 20, fontWeight: 700, letterSpacing: 0.5 }}>DEV: {p.developer?.toUpperCase()}</div>

                                <div style={{ padding: 16, background: "rgba(255,255,255,0.02)", borderRadius: 12, marginBottom: 20, border: `1px solid ${T.glassBorder}` }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.sub, fontWeight: 800, letterSpacing: 1, marginBottom: 12 }}>
                                        <span>CBA POOL UTILIZATION</span>
                                        <span style={{ color: T.text }}>{fmt(p.remaining)} / {fmt(p.fundTotal)}</span>
                                    </div>
                                    <Progress value={(p.remaining / p.fundTotal) * 100} color={T.green} height={8} />
                                </div>

                                <div style={{ padding: 16, background: `${T.orange}08`, borderLeft: `4px solid ${T.orange}`, borderRadius: 12, fontSize: 14, color: T.sub, marginBottom: 24, lineHeight: 1.6 }}>
                                    <strong style={{ color: T.text, display: "block", marginBottom: 4 }}>COMMUNITY TARGET</strong> {p.focus}
                                </div>

                                {p.url && (
                                    <div style={{ marginBottom: 12 }}>
                                        <a href={p.url} target="_blank" rel="noopener noreferrer"
                                            style={{ fontSize: 12, color: T.blue, textDecoration: "none" }}>
                                            View USASpending Award ↗
                                        </a>
                                        {p.awardId && <span style={{ fontSize: 10, color: T.mute, marginLeft: 8, fontFamily: "monospace" }}>{p.awardId}</span>}
                                    </div>
                                )}
                                {p.startDate && (
                                    <div style={{ fontSize: 11, color: T.mute, marginBottom: 12 }}>
                                        Award period: {String(p.startDate).slice(0,10)} – {p.deadline ? String(p.deadline).slice(0,10) : "ongoing"}
                                    </div>
                                )}

                                <div style={{ display: "flex", gap: 12, borderTop: `1px solid ${T.glassBorder}`, paddingTop: 20 }}>
                                    {p.url ? (
                                        <a href={p.url} target="_blank" rel="noopener noreferrer" style={{ flex: 1 }}>
                                            <Btn variant="primary" style={{ width: "100%" }}>View Award ↗</Btn>
                                        </a>
                                    ) : (
                                        <Btn variant="primary" style={{ flex: 1 }}>Contact Liaison</Btn>
                                    )}
                                    {onAdd && (
                                        <TrackBtn onTrack={() => {
                                            onAdd({
                                                id: uid(),
                                                title: `${p.project} - CBA Fund`,
                                                agency: p.developer,
                                                amount: p.remaining,
                                                deadline: p.deadline || "Rolling",
                                                stage: "discovered",
                                                description: `Developer: ${p.developer}. Focus: ${p.focus}`,
                                                category: "CBA Fund",
                                                link: p.url,
                                                awardId: p.awardId,
                                                createdAt: new Date().toISOString()
                                            });
                                        }} label="+ Track Fund" />
                                    )}
                                </div>
                            </Card>
                        );
                    })
                }
            </div>
        </div>
    );
};
