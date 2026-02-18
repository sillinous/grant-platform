import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn, Stat } from '../ui';
import { T, fmt } from '../globals';
import { API } from '../api';

export const InKindVault = () => {
    const [credits, setCredits] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.getInKindScale().then(d => {
            setCredits(d);
            setLoading(false);
        });
    }, []);

    let totalOffset = credits.reduce((acc, c) => acc + c.value, 0);

    return (
        <div style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                    <h2 style={{ fontSize: 22, fontWeight: 900, color: T.text, margin: 0 }}>In-Kind Vault 💳</h2>
                    <p style={{ color: T.mute, fontSize: 13, marginTop: 4 }}>Aggregating high-value operational subsidies and credits.</p>
                </div>
                <div style={{ padding: "8px 16px", background: `${T.green}10`, borderRadius: 8, textAlign: "right" }}>
                    <div style={{ fontSize: 10, color: T.mute, fontWeight: 700 }}>TOTAL OPEX OFFSET</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: T.green }}>{fmt(totalOffset)}</div>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {loading ? <div style={{ color: T.mute }}>Calculating subsidy potential...</div> : 
                    credits.map(c => (
                        <Card key={c.id} glow style={{ borderTop: `4px solid ${T.teal}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                                <Badge color={T.teal}>{c.type}</Badge>
                                <Badge color={T.shade}>DIFFICULTY: {c.claimDifficulty.toUpperCase()}</Badge>
                            </div>

                            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: 0 }}>{c.provider}</h3>
                            <div style={{ fontSize: 24, fontWeight: 900, color: T.text, margin: "10px 0" }}>{fmt(c.value)}</div>
                            
                            <p style={{ fontSize: 13, color: T.sub, lineHeight: 1.4 }}>{c.impact}</p>

                            <Btn size="sm" variant="primary" style={{ marginTop: 15, width: "100%" }}>Claim Credits</Btn>
                        </Card>
                    ))
                }
            </div>
        </div>
    );
};
