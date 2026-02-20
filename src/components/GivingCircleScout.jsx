import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn } from '../ui';
import { T, fmt, uid } from '../globals';
import { API } from '../api';

export const GivingCircleScout = ({ onAdd }) => {
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

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                {loading ? <div style={{ color: T.mute }}>Mapping local circles...</div> : 
                    circles.map(c => (
                        <Card key={c.id} style={{ borderTop: `4px solid ${T.pink}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                                <Badge color={T.pink}>{c.cycle}</Badge>
                                <div style={{ fontSize: 11, color: T.mute, fontWeight: 600 }}>{c.members} VOTERS</div>
                            </div>

                            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: 0, marginBottom: 8, height: 44, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{c.name}</h3>
                            
                            <div style={{ padding: 12, background: T.panel, borderRadius: 8, marginBottom: 16 }}>
                                <div style={{ fontSize: 10, color: T.mute, fontWeight: 700, letterSpacing: 0.5, marginBottom: 4 }}>CURRENT POOL</div>
                                <div style={{ fontSize: 24, fontWeight: 900, color: T.pink }}>{fmt(c.pool)}</div>
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: 13, color: T.sub, marginBottom: 4 }}><span style={{ fontWeight: 600, color: T.text }}>Focus:</span> {c.focus}</div>
                                <div style={{ fontSize: 13, color: T.sub }}><span style={{ fontWeight: 600, color: T.text }}>Vote Date:</span> {c.votingDate}</div>
                            </div>

                            <div style={{ display: "flex", gap: 10, borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
                                <Btn size="sm" variant="primary" style={{ flex: 1 }}>Present</Btn>
                                {onAdd && (
                                    <Btn variant="success" onClick={() => {
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
                                    }}>+ Track</Btn>
                                )}
                            </div>
                        </Card>
                    ))
                }
            </div>
        </div>
    );
};
