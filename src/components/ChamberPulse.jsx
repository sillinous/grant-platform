import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn } from '../ui';
import { T, fmt } from '../globals';
import { API } from '../api';

export const ChamberPulse = () => {
    const [grants, setGrants] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.getChamberGrants().then(d => {
            setGrants(d);
            setLoading(false);
        });
    }, []);

    return (
        <div style={{ padding: 20 }}>
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: T.text, margin: 0 }}>Chamber Pulse 🏛️</h2>
                <p style={{ color: T.mute, fontSize: 13, marginTop: 4 }}>Hyper-local grants from Business Improvement Districts (BIDs) and Chambers.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
                {loading ? <div style={{ color: T.mute }}>Contacting local chambers...</div> : 
                    grants.map(g => (
                        <Card key={g.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: `4px solid ${T.orange}` }}>
                            <div>
                                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                                    <Badge color={T.shade}>{g.org}</Badge>
                                    <Badge color={T.orange} size="xs">{g.type}</Badge>
                                </div>
                                <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: 0 }}>{g.title}</h3>
                                <p style={{ fontSize: 13, color: T.sub, margin: "4px 0 0" }}>{g.description}</p>
                            </div>
                            <div style={{ textAlign: "right", minWidth: 100 }}>
                                <div style={{ fontSize: 18, fontWeight: 900, color: T.text }}>{fmt(g.amount)}</div>
                                <Btn size="xs" variant="primary" style={{ marginTop: 8 }}>Apply</Btn>
                            </div>
                        </Card>
                    ))
                }
            </div>
        </div>
    );
};
