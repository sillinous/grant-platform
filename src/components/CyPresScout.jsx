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
        <div style={{ padding: 20, animation: "fadeIn 0.4s" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 24, padding: "8px", background: `${T.crimson}11`, borderRadius: "8px" }}>⚖️</div>
                <div>
                    <h2 style={{ fontSize: 24, fontWeight: 900, color: T.text, margin: 0 }}>Cy Pres Scout</h2>
                    <p style={{ color: T.mute, fontSize: 13, marginTop: 4 }}>Tracking "Cy Pres" (Next Best Use) residual funds from class action settlements.</p>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {loading ? <div style={{ color: T.mute }}>Scanning federal dockets...</div> : 
                    cases.map(c => (
                        <Card key={c.id} style={{ borderTop: `4px solid ${T.crimson}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                                <Badge color={T.crimson}>{c.status}</Badge>
                                <div style={{ fontSize: 11, fontFamily: "monospace", color: T.mute, fontWeight: 600 }}>{c.docket}</div>
                            </div>

                            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: 0, marginBottom: 4 }}>{c.caseName}</h3>
                            <div style={{ fontSize: 13, color: T.sub, marginBottom: 16 }}>Alignment: <span style={{ color: T.text, fontWeight: 600 }}>{c.cause}</span></div>
                            
                            <div style={{ padding: 12, background: `${T.crimson}11`, borderRadius: 8, marginBottom: 16, border: `1px solid ${T.crimson}22` }}>
                                <div style={{ fontSize: 10, color: T.crimson, textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5, marginBottom: 2 }}>ESTIMATED RESIDUAL FUND</div>
                                <div style={{ fontSize: 24, fontWeight: 900, color: T.crimson }}>{fmt(c.residualFund)}</div>
                            </div>

                            <p style={{ fontSize: 13, color: T.sub, lineHeight: 1.5, margin: 0, height: 60, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{c.description}</p>

                            <div style={{ marginTop: 20, display: "flex", gap: 10, borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
                                <Btn variant="primary" style={{ flex: 1 }}>Draft Amicus</Btn>
                                <Btn variant="ghost">Docket</Btn>
                                {onAdd && (
                                    <Btn variant="success" onClick={() => {
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

            <Card style={{ marginTop: 24, background: `linear-gradient(90deg, ${T.crimson}11, transparent)`, borderColor: T.crimson + "33", borderLeft: `4px solid ${T.crimson}` }}>
                <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                    <div style={{ fontSize: 24 }}>👨‍⚖️</div>
                    <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.5 }}>
                        <strong style={{ color: T.text, display: "block", marginBottom: 4 }}>Found Money</strong> When plaintiffs can't be found, courts distribute millions to non-profits with a "nexus" to the case. You just need to raise your hand.
                    </div>
                </div>
            </Card>
        </div>
    );
};
