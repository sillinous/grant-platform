import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn, TrackBtn } from '../ui';
import { T, fmt, uid } from '../globals';
import { API } from '../api';

export const FaithFunder = ({ onAdd }) => {
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
                    <p style={{ color: T.mute, fontSize: 13, marginTop: 4 }}>Secular funding from major religious philanthropic arms (Interfaith Capital).</p>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {loading ? <div style={{ color: T.mute }}>Scanning interfaith councils...</div> : 
                    grants.map(g => (
                        <Card key={g.id} style={{ borderTop: `4px solid ${T.blue}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                                <Badge color={T.blue}>{g.deadline} DEADLINE</Badge>
                                <Badge color={T.shade}>SECULAR</Badge>
                            </div>

                            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: 0, marginBottom: 4, height: 44, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{g.grant}</h3>
                            <div style={{ fontSize: 13, color: T.mute, marginBottom: 16 }}>{g.org}</div>
                            
                            <div style={{ padding: 12, background: T.panel, borderRadius: 8, marginBottom: 16 }}>
                                <div style={{ fontSize: 10, color: T.mute, fontWeight: 700, letterSpacing: 0.5, marginBottom: 4 }}>GRANT AMOUNT</div>
                                <div style={{ fontSize: 24, fontWeight: 900, color: T.text }}>{fmt(g.amount)}</div>
                            </div>

                            <div style={{ padding: 12, background: `${T.blue}11`, borderRadius: 8, borderLeft: `3px solid ${T.blue}`, fontSize: 13, color: T.sub, marginBottom: 16 }}>
                                <strong style={{ color: T.text }}>Mission Fit:</strong> {g.focus}
                            </div>

                            <div style={{ display: "flex", gap: 10, borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
                                <Btn size="sm" variant="primary" style={{ flex: 1 }}>Review Guidelines</Btn>
                                {onAdd && (
                                    <TrackBtn onTrack={() => {
                                        onAdd({
                                            id: uid(),
                                            title: g.grant,
                                            agency: g.org,
                                            amount: g.amount,
                                            deadline: g.deadline,
                                            stage: "discovered",
                                            description: g.focus,
                                            category: "Faith-Based Grant",
                                            createdAt: new Date().toISOString()
                                        });
                                    }} defaultLabel="+ Track" />
                                )}
                            </div>
                        </Card>
                    ))
                }
            </div>

            <Card style={{ marginTop: 24, background: `linear-gradient(90deg, ${T.blue}11, transparent)`, borderColor: T.blue + "33", borderLeft: `4px solid ${T.blue}` }}>
                <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                    <div style={{ fontSize: 24 }}>🕊️</div>
                    <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.5 }}>
                        <strong style={{ color: T.text, display: "block", marginBottom: 4 }}>Did you know?</strong> Faith-based organizations contribute over $1.2 Trillion annually to the US social economy, much of it open to secular applicants.
                    </div>
                </div>
            </Card>
        </div>
    );
};
