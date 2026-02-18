import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn } from '../ui';
import { T, fmt } from '../globals';
import { API } from '../api';

export const FaithFunder = () => {
    const [grants, setGrants] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.getFaithGrants().then(d => {
            setGrants(d);
            setLoading(false);
        });
    }, []);

    return (
        <div style={{ padding: 20 }}>
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: T.text, margin: 0 }}>Faith Funder 🕌</h2>
                <p style={{ color: T.mute, fontSize: 13, marginTop: 4 }}>Secular funding from major religious philanthropic arms (Interfaith Capital).</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {loading ? <div style={{ color: T.mute }}>Scanning interfaith councils...</div> : 
                    grants.map(g => (
                        <Card key={g.id} glow style={{ borderTop: `4px solid ${T.blue}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: T.blue }}>{g.deadline} DEADLINE</div>
                                <Badge color={T.shade}>SECULAR: YES</Badge>
                            </div>

                            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: 0 }}>{g.grant}</h3>
                            <div style={{ fontSize: 12, color: T.mute, marginTop: 2 }}>{g.org}</div>
                            
                            <div style={{ marginTop: 15, fontSize: 24, fontWeight: 900, color: T.text }}>{fmt(g.amount)}</div>

                            <div style={{ marginTop: 10, padding: 8, background: `${T.blue}10`, borderRadius: 6, fontSize: 12, color: T.sub }}>
                                🕊️ <b>Mission Fit:</b> {g.focus}
                            </div>

                            <Btn size="sm" variant="primary" style={{ width: "100%", marginTop: 15 }}>Review Guidelines</Btn>
                        </Card>
                    ))
                }
            </div>

            <Card style={{ marginTop: 20, textAlign: "center", border: `1px dashed ${T.border}` }}>
                <p style={{ fontSize: 12, color: T.mute, margin: 0 }}>
                    <b>Did you know?</b> Faith-based organizations contribute over $1.2 Trillion annually to the US social economy, much of it open to secular applicants.
                </p>
            </Card>
        </div>
    );
};
