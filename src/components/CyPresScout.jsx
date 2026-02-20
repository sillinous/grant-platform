import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn, Stat } from '../ui';
import { T, fmt, uid } from '../globals';
import { API } from '../api';

export const CyPresScout = ({ onAdd }) => {
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.getCyPresAwards().then(d => {
            setCases(d);
            setLoading(false);
        });
    }, []);

    return (
        <div style={{ padding: 20 }}>
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: T.text, margin: 0 }}>Cy Pres Scout ⚖️</h2>
                <p style={{ color: T.mute, fontSize: 13, marginTop: 4 }}>Tracking "Cy Pres" (Next Best Use) residual funds from class action settlements.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {loading ? <div style={{ color: T.mute }}>Scanning federal dockets...</div> : 
                    cases.map(c => (
                        <Card key={c.id} glow style={{ borderLeft: `4px solid ${T.crimson}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                                <Badge color={T.crimson}>{c.status}</Badge>
                                <div style={{ fontSize: 11, fontFamily: "monospace", color: T.mute }}>{c.docket}</div>
                            </div>

                            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: 0 }}>{c.caseName}</h3>
                            <div style={{ fontSize: 13, color: T.sub, marginTop: 4 }}>Alignment: <span style={{ color: T.text, fontWeight: 600 }}>{c.cause}</span></div>
                            
                            <div style={{ margin: "15px 0", padding: 12, background: `${T.crimson}10`, borderRadius: 6 }}>
                                <div style={{ fontSize: 10, color: T.mute, textTransform: "uppercase" }}>Estimated Residual Fund</div>
                                <div style={{ fontSize: 20, fontWeight: 900, color: T.crimson }}>{fmt(c.residualFund)}</div>
                            </div>

                            <p style={{ fontSize: 12, color: T.sub, lineHeight: 1.5 }}>{c.description}</p>

                            <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
                                <Btn variant="primary" style={{ flex: 1 }}>Draft Amicus Letter</Btn>
                                <Btn variant="ghost">Docket View</Btn>
                                {onAdd && (
                                    <Btn variant="success" size="sm" onClick={() => {
                                        onAdd({
                                            id: uid(),
                                            title: c.caseName,
                                            agency: "Cy Pres Settlement",
                                            amount: c.residualFund,
                                            deadline: "Rolling",
                                            stage: "discovered",
                                            description: `Docket: ${c.docket}. Cause: ${c.cause}. ${c.description}`,
                                            category: "Cy Pres",
                                            createdAt: new Date().toISOString()
                                        });
                                    }}>+ Track Fund</Btn>
                                )}
                            </div>
                        </Card>
                    ))
                }
            </div>

            <Card style={{ marginTop: 30, background: `linear-gradient(90deg, ${T.crimson}10, transparent)`, borderColor: T.crimson + "33" }}>
                <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                    <div style={{ fontSize: 32 }}>👨‍⚖️</div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Found Money</div>
                        <p style={{ fontSize: 12, color: T.sub, margin: "4px 0 0" }}>When plaintiffs can't be found, courts distribute millions to non-profits with a "nexus" to the case. You just need to raise your hand.</p>
                    </div>
                </div>
            </Card>
        </div>
    );
};
