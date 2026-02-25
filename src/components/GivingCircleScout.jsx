import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn, TrackBtn, SkeletonCard, Empty } from '../ui';
import { T, fmt, uid } from '../globals';
import { API } from '../api';
import { useStore } from '../store';

export const GivingCircleScout = ({ onAdd: propOnAdd }) => {
    const { addGrant: storeOnAdd } = useStore();
    const onAdd = propOnAdd || storeOnAdd;
    const [circles, setCircles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.searchGivingCircles().then(d => {
            setCircles(d);
            setLoading(false);
        });
    }, []);

    return (
        <div style={{ padding: 20, animation: "fadeIn 0.4s" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 24, padding: "8px", background: `${T.pink}11`, borderRadius: "8px" }}>⭕</div>
                <div>
                    <h2 style={{ fontSize: 24, fontWeight: 900, color: T.text, margin: 0 }}>Giving Circle Scout</h2>
                    <p style={{ color: T.mute, fontSize: 13, marginTop: 4 }}>Connecting with local "Pooled Philanthropy" groups who vote on micro-grants.</p>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
                {loading ? <div style={{ display: "contents" }}><SkeletonCard lines={6} /><SkeletonCard lines={6} /><SkeletonCard lines={6} /></div> :
                    circles.length === 0 ? <div style={{ gridColumn: "1 / -1" }}><Empty icon="⭕" title="No Active Circles" sub="We couldn't locate active giving circles in your impact area." /></div> :
                    circles.map(c => (
                        <Card key={c.id} glow style={{ borderTop: `6px solid ${T.pink}`, padding: 24 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, alignItems: "center" }}>
                                <Badge color={T.pink} style={{ background: `${T.pink}11`, fontWeight: 800 }}>{c.cycle?.toUpperCase()}</Badge>
                                <div style={{ fontSize: 11, color: T.sub, fontWeight: 900, letterSpacing: 2 }}>{c.members} VOTERS</div>
                            </div>

                            <h3 style={{ fontSize: 20, fontWeight: 900, color: T.text, margin: 0, marginBottom: 12, fontFamily: "Outfit", lineHeight: 1.4 }}>{c.name}</h3>
                            
                            <div style={{ padding: 20, background: "rgba(255,255,255,0.02)", borderRadius: 16, marginBottom: 24, border: `1px solid ${T.glassBorder}` }}>
                                <div style={{ fontSize: 10, color: T.mute, fontWeight: 800, letterSpacing: 1, marginBottom: 8 }}>RESERVED FUND POOL</div>
                                <div style={{ fontSize: 32, fontWeight: 900, color: T.pink, letterSpacing: "-0.04em" }}>{fmt(c.pool)}</div>
                            </div>

                            <div style={{ marginBottom: 24, display: "flex", flexDirection: "column", gap: 10 }}>
                                <div style={{ fontSize: 13, color: T.sub, fontWeight: 700 }}><span style={{ color: T.mute, marginRight: 8 }}>MISSION:</span> {c.focus?.toUpperCase()}</div>
                                <div style={{ fontSize: 13, color: T.sub, fontWeight: 700 }}><span style={{ color: T.mute, marginRight: 8 }}>VOTE EPOCH:</span> {c.votingDate?.toUpperCase()}</div>
                            </div>

                            <div style={{ display: "flex", gap: 12, borderTop: `1px solid ${T.glassBorder}`, paddingTop: 24 }}>
                                <Btn variant="primary" style={{ flex: 1 }}>Submit Impact Story</Btn>
                                {onAdd && (
                                    <TrackBtn onTrack={() => {
                                        onAdd({
                                            id: uid(),
                                            title: c.name,
                                            agency: "Giving Circle",
                                            amount: c.pool,
                                            deadline: c.votingDate,
                                            stage: "discovered",
                                            description: `Cycle: ${c.cycle}. Focus: ${c.focus}. Voters: ${c.members}`,
                                            category: "Giving Circle",
                                            createdAt: new Date().toISOString()
                                        });
                                    }} label="+ Track Circle" />
                                )}
                            </div>
                        </Card>
                    ))
                }
            </div>
        </div>
    );
};
