import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn, Stat } from '../ui';
import { T, fmt, uid } from '../globals';
import { API } from '../api';

export const UnsolicitedProspector = ({ onAdd }) => {
    const [funders, setFunders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.discoverUnsolicitedFunders().then(d => {
            setFunders(d);
            setLoading(false);
        });
    }, []);

    return (
        <div style={{ padding: 20, animation: "fadeIn 0.4s" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 24, padding: "8px", background: `${T.purple}11`, borderRadius: "8px" }}>💎</div>
                <div>
                    <h2 style={{ fontSize: 24, fontWeight: 900, color: T.text, margin: 0 }}>Unsolicited Prospector</h2>
                    <p style={{ color: T.mute, fontSize: 13, marginTop: 4 }}>Identifying funders who prioritize relationship-based "Unsolicited Inquiries" over formal RFPs.</p>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {loading ? <div style={{ color: T.mute }}>Analyzing 990-PF behavioral patterns...</div> : 
                    funders.map(f => (
                        <Card key={f.id} style={{ borderTop: `4px solid ${T.purple}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                                <Badge color={T.purple}>{f.inquiryPolicy}</Badge>
                                <div style={{ textAlign: "right" }}>
                                    <div style={{ fontSize: 10, color: T.mute, fontWeight: 700, letterSpacing: 0.5, marginBottom: 4 }}>UNSOLICITED RATE</div>
                                    <div style={{ fontSize: 18, fontWeight: 900, color: T.purple }}>{f.unsolicitedRate}</div>
                                </div>
                            </div>

                            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: 0, marginBottom: 8, height: 22, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{f.name}</h3>
                            <div style={{ fontSize: 13, color: T.mute, marginBottom: 16, height: 40, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{f.logic}</div>

                            <div style={{ padding: 12, background: T.panel, borderRadius: 8, marginBottom: 16 }}>
                                <div style={{ fontSize: 10, color: T.mute, fontWeight: 700, letterSpacing: 0.5, marginBottom: 4 }}>MEDIAN AWARD</div>
                                <div style={{ fontSize: 24, fontWeight: 900, color: T.green }}>{fmt(f.medianAward)}</div>
                            </div>

                            <div style={{ display: "flex", gap: 10, borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
                                <Btn variant="primary" style={{ flex: 1 }}>Pitch Builder</Btn>
                                {onAdd && (
                                    <Btn variant="success" onClick={() => {
                                        onAdd({
                                            id: uid(),
                                            title: f.name,
                                            agency: "Private Funder",
                                            amount: f.medianAward,
                                            deadline: "Rolling",
                                            stage: "discovered",
                                            description: `Unsolicited Inquiry Policy: ${f.inquiryPolicy}. Logic: ${f.logic}`,
                                            category: "Unsolicited Foundation",
                                            createdAt: new Date().toISOString()
                                        });
                                    }}>+ Track</Btn>
                                )}
                            </div>
                        </Card>
                    ))
                }
            </div>

            <Card style={{ marginTop: 24, background: `linear-gradient(90deg, ${T.purple}11, transparent)`, borderColor: T.purple + "33", borderLeft: `4px solid ${T.purple}` }}>
                <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                    <div style={{ fontSize: 24 }}>🏗️</div>
                    <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.5 }}>
                        <strong style={{ color: T.text, display: "block", marginBottom: 4 }}>WHY THIS WORKS</strong> 40% of private foundations do not publish open RFPs. This engine identifies those with the highest "Open Inquiry" success rates using historical 990-PF filing data.
                    </div>
                </div>
            </Card>
        </div>
    );
};
