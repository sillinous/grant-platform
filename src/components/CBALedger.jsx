import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn, Progress } from '../ui';
import { T, API, fmt } from '../globals';

export const CBALedger = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.getCBASignals().then(d => {
            setProjects(d);
            setLoading(false);
        });
    }, []);

    return (
        <div style={{ padding: 20 }}>
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: T.text, margin: 0 }}>CBA Ledger 🏗️</h2>
                <p style={{ color: T.mute, fontSize: 13, marginTop: 4 }}>Accessing "Community Benefit Agreement" funds mandated for mega-developments.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {loading ? <div style={{ color: T.mute }}>Auditing construction permits...</div> : 
                    projects.map(p => {
                        const percentLeft = (p.remaining / p.fundTotal) * 100;
                        return (
                            <Card key={p.id} glow style={{ borderLeft: `4px solid ${T.orange}` }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                                    <Badge color={T.orange}>DEVELOPER FUND</Badge>
                                    <Badge color={T.shade}>{p.status}</Badge>
                                </div>

                                <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: 0 }}>{p.project}</h3>
                                <div style={{ fontSize: 11, color: T.mute, marginTop: 2 }}>Dev: {p.developer}</div>

                                <div style={{ marginTop: 15 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.sub, marginBottom: 4 }}>
                                        <span>REMAINING FUNDS</span>
                                        <span style={{ fontWeight: 700, color: T.green }}>{fmt(p.remaining)} / {fmt(p.fundTotal)}</span>
                                    </div>
                                    <div style={{ height: 6, background: T.border, borderRadius: 3 }}>
                                        <div style={{ height: "100%", width: `${percentLeft}%`, background: T.green, borderRadius: 3 }} />
                                    </div>
                                </div>

                                <p style={{ fontSize: 13, color: T.text, marginTop: 15, lineHeight: 1.4 }}>
                                    <b>Focus:</b> {p.focus}
                                </p>

                                <Btn variant="primary" style={{ width: "100%", marginTop: 15 }}>Contact {p.contact}</Btn>
                            </Card>
                        );
                    })
                }
            </div>
        </div>
    );
};
