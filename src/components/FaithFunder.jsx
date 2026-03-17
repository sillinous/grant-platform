import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn, TrackBtn, SkeletonCard, Empty } from '../ui';
import { T, fmt, uid } from '../globals';
import { API } from '../api';
import { useStore } from '../store';

export const FaithFunder = ({ onAdd: propOnAdd }) => {
    const { addGrant: storeOnAdd } = useStore();
    const onAdd = propOnAdd || storeOnAdd;
    const [grants, setGrants] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.getFaithGrants().then(d => {
            setGrants(d);
            setLoading(false);
        });
    }, []);

    return (
        <div style={{ padding: 20, animation: "fadeIn 0.4s" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 24, padding: "8px", background: `${T.blue}11`, borderRadius: "8px" }}>🕌</div>
                <div>
                    <h2 style={{ fontSize: 24, fontWeight: 900, color: T.text, margin: 0 }}>Faith Funder</h2>
                    <p style={{ color: T.mute, fontSize: 13, marginTop: 4 }}>Federal and faith-based funding open to secular applicants via HUD, Grants.gov, and religious philanthropy networks.</p>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {loading ? (
                    <div style={{ display: "contents" }}>
                        <SkeletonCard lines={6} />
                        <SkeletonCard lines={6} />
                    </div>
                ) : grants.length === 0 ? (
                    <div style={{ gridColumn: "1 / -1" }}>
                        <Empty icon="🕌" title="No Faith-Based Grants Found" sub="Monitoring religious philanthropic networks for secular-aligned opportunities." />
                    </div>
                ) : grants.map(g => (
                    <Card key={g.id} glow style={{ borderTop: `4px solid ${T.blue}`, display: "flex", flexDirection: "column" }}>
                        {/* Header badges */}
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 6 }}>
                            <Badge color={T.blue} style={{ background: `${T.blue}11` }}>
                                {g.status || "OPEN"}
                            </Badge>
                            {g.cfda && <Badge color="#6366f1">CFDA {g.cfda}</Badge>}
                            {g.category && <Badge color={T.mute}>{g.category}</Badge>}
                        </div>

                        {/* Title */}
                        <h3 style={{ fontSize: 16, fontWeight: 800, color: T.text, margin: "0 0 6px", fontFamily: "Outfit", lineHeight: 1.3 }}>
                            {g.link ? (
                                <a href={g.link} target="_blank" rel="noopener noreferrer"
                                    style={{ color: T.text, textDecoration: "none" }}
                                    onMouseEnter={e => e.target.style.color = T.blue}
                                    onMouseLeave={e => e.target.style.color = T.text}>
                                    {g.title} <span style={{ fontSize: 11, color: T.blue, fontWeight: 400 }}>↗</span>
                                </a>
                            ) : (g.title || g.grant)}
                        </h3>

                        {/* Agency */}
                        <div style={{ fontSize: 12, color: T.sub, marginBottom: 12, fontWeight: 700, letterSpacing: 0.3 }}>
                            {(g.agency || g.org || "Faith Network")?.toUpperCase()}
                        </div>

                        {/* Amount */}
                        <div style={{ padding: 14, background: "rgba(255,255,255,0.02)", borderRadius: 10, marginBottom: 14, border: `1px solid ${T.glassBorder}` }}>
                            <div style={{ fontSize: 10, color: T.mute, fontWeight: 800, letterSpacing: 1, marginBottom: 4 }}>GRANT AMOUNT</div>
                            <div style={{ fontSize: 26, fontWeight: 900, color: T.text, letterSpacing: "-0.02em" }}>
                                {typeof g.amount === "number" && g.amount > 0
                                    ? g.amount >= 1e6 ? `$${(g.amount / 1e6).toFixed(1)}M` : fmt(g.amount)
                                    : "Varies"}
                            </div>
                        </div>

                        {/* Description */}
                        {(g.description || g.focus) && (
                            <div style={{ padding: 12, background: `${T.blue}08`, borderRadius: 10, borderLeft: `4px solid ${T.blue}`, fontSize: 13, color: T.sub, marginBottom: 14, lineHeight: 1.6, flex: 1 }}>
                                {g.description || g.focus}
                            </div>
                        )}

                        {/* Meta: oppNumber, ein, deadline */}
                        <div style={{ fontSize: 11, color: T.mute, marginBottom: 14, display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {g.oppNumber && <span style={{ fontFamily: "monospace" }}>#{g.oppNumber}</span>}
                            {g.ein && <span>EIN: {g.ein}</span>}
                            {g.deadline && g.deadline !== "Rolling" && <span>⏰ {String(g.deadline).slice(0, 10)}</span>}
                            {g.link && <a href={g.link} target="_blank" rel="noopener noreferrer" style={{ color: T.blue, textDecoration: "none" }}>View source ↗</a>}
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", gap: 10, borderTop: `1px solid ${T.glassBorder}`, paddingTop: 16, marginTop: "auto" }}>
                            {g.link ? (
                                <a href={g.link} target="_blank" rel="noopener noreferrer" style={{ flex: 1 }}>
                                    <Btn variant="primary" style={{ width: "100%" }}>View Specs ↗</Btn>
                                </a>
                            ) : (
                                <Btn variant="primary" style={{ flex: 1 }}>Review Specs</Btn>
                            )}
                            {onAdd && (
                                <TrackBtn onTrack={() => onAdd({
                                    id: uid(),
                                    title: g.title || g.grant,
                                    agency: g.agency || g.org,
                                    amount: g.amount,
                                    deadline: g.deadline || "Rolling",
                                    stage: "discovered",
                                    description: g.description || g.focus,
                                    category: "Faith-Based Grant",
                                    link: g.link,
                                    ein: g.ein,
                                    cfda: g.cfda,
                                    createdAt: new Date().toISOString()
                                })} label="+ Track" />
                            )}
                        </div>
                    </Card>
                ))}
            </div>

            <Card style={{ marginTop: 24, background: `linear-gradient(90deg, ${T.blue}11, transparent)`, borderColor: T.blue + "33", borderLeft: `4px solid ${T.blue}` }}>
                <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                    <div style={{ fontSize: 24 }}>🕊️</div>
                    <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.5 }}>
                        <strong style={{ color: T.text, display: "block", marginBottom: 4 }}>Did you know?</strong>
                        Faith-based organizations contribute over $1.2 Trillion annually to the US social economy, much of it open to secular applicants. HUD's Center for Faith-Based and Neighborhood Partnerships is a direct access point.
                    </div>
                </div>
            </Card>
        </div>
    );
};
