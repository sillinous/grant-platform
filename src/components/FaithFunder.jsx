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
                    <p style={{ color: T.mute, fontSize: 13, marginTop: 4 }}>Secular funding from major religious philanthropic arms (Interfaith Capital).</p>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {loading ? <div style={{ display: "contents" }}><SkeletonCard lines={6} /><SkeletonCard lines={6} /></div> :
                    grants.length === 0 ? <div style={{ gridColumn: "1 / -1" }}><Empty icon="🕌" title="No Faith-Based Grants Found" sub="Monitoring religious philanthropic networks for secular-aligned opportunities." /></div> :
                    grants.map(g => (
                        <Card key={g.id} glow style={{ borderTop: `4px solid ${T.blue}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                                <Badge color={T.blue} style={{ background: `${T.blue}11`, border: `1px solid ${T.blue}22` }}>{g.deadline} DEADLINE</Badge>
                                <Badge color={T.sub}>SECULAR ALIGNED</Badge>
                            </div>

                            <h3 style={{ fontSize: 18, fontWeight: 800, color: T.text, margin: 0, marginBottom: 8, fontFamily: "Outfit", height: 48, overflow: "hidden", lineHeight: 1.3 }}>{g.grant}</h3>
                            <div style={{ fontSize: 13, color: T.sub, marginBottom: 20, fontWeight: 700, letterSpacing: 0.5 }}>{g.org?.toUpperCase()}</div>
                            
                            <div style={{ padding: 16, background: "rgba(255,255,255,0.02)", borderRadius: 12, marginBottom: 20, border: `1px solid ${T.glassBorder}` }}>
                                <div style={{ fontSize: 10, color: T.mute, fontWeight: 800, letterSpacing: 1, marginBottom: 4 }}>GRANT AMOUNT</div>
                                <div style={{ fontSize: 28, fontWeight: 900, color: T.text, letterSpacing: "-0.02em" }}>{fmt(g.amount)}</div>
                            </div>

                            <div style={{ padding: 16, background: `${T.blue}08`, borderRadius: 12, borderLeft: `4px solid ${T.blue}`, fontSize: 14, color: T.sub, marginBottom: 24, lineHeight: 1.6 }}>
                                <strong style={{ color: T.text, display: "block", marginBottom: 4 }}>STRATEGIC ALIGNMENT</strong> {g.focus}
                            </div>

                            <div style={{ display: "flex", gap: 12, borderTop: `1px solid ${T.glassBorder}`, paddingTop: 20 }}>
                                <Btn variant="primary" style={{ flex: 1 }}>Review Specs</Btn>
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
                                    }} label="+ Track" />
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
