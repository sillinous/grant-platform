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
        <div style={{ padding: 20 }}>
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: T.text, margin: 0 }}>Giving Circle Scout ⭕</h2>
                <p style={{ color: T.mute, fontSize: 13, marginTop: 4 }}>Connecting with local "Pooled Philanthropy" groups who vote on micro-grants.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                {loading ? <div style={{ color: T.mute }}>Mapping local circles...</div> : 
                    circles.map(c => (
                        <Card key={c.id} glow style={{ borderTop: `4px solid ${T.pink}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 15 }}>
                                <Badge color={T.pink}>{c.cycle}</Badge>
                                <div style={{ fontSize: 11, color: T.mute }}>{c.members} VOTERS</div>
                            </div>

                            <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: 0, height: 40 }}>{c.name}</h3>
                            
                            <div style={{ marginTop: 15, fontSize: 24, fontWeight: 900, color: T.pink }}>{fmt(c.pool)}</div>
                            <div style={{ fontSize: 10, color: T.mute }}>CURRENT POOL</div>

                            <div style={{ marginTop: 15, paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
                                <div style={{ fontSize: 11, color: T.sub }}>Focus: <b>{c.focus}</b></div>
                                <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>Vote Date: {c.votingDate}</div>
                            </div>

                            <div style={{ marginTop: 15, display: "flex", gap: 10 }}>
                                <Btn size="sm" variant="primary" style={{ flex: 1 }}>Present to Members</Btn>
                                {onAdd && (
                                    <Btn variant="success" size="sm" onClick={() => {
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
