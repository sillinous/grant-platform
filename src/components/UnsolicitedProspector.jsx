import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn, Stat } from '../ui';
import { T, fmt } from '../globals';
import { API } from '../api';

export const UnsolicitedProspector = () => {
    const [funders, setFunders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.discoverUnsolicitedFunders().then(d => {
            setFunders(d);
            setLoading(false);
        });
    }, []);

    return (
        <div style={{ padding: 20 }}>
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: T.text, margin: 0 }}>Unsolicited Prospector 💎</h2>
                <p style={{ color: T.mute, fontSize: 13, marginTop: 4 }}>Identifying funders who prioritize relationship-based "Unsolicited Inquiries" over formal RFPs.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {loading ? <div style={{ color: T.mute }}>Analyzing 990-PF behavioral patterns...</div> : 
                    funders.map(f => (
                        <Card key={f.id} glow style={{ borderTop: `4px solid ${T.purple}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 15 }}>
                                <Badge color={T.purple}>{f.inquiryPolicy}</Badge>
                                <div style={{ textAlign: "right" }}>
                                    <div style={{ fontSize: 10, color: T.mute }}>UNSOLICITED RATE</div>
                                    <div style={{ fontSize: 18, fontWeight: 900, color: T.purple }}>{f.unsolicitedRate}</div>
                                </div>
                            </div>

                            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: 0 }}>{f.name}</h3>
                            <p style={{ fontSize: 12, color: T.sub, marginTop: 10, lineHeight: 1.5 }}>{f.logic}</p>

                            <div style={{ marginTop: 15, display: "flex", gap: 10, alignItems: "center" }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 9, color: T.mute }}>MEDIAN AWARD</div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{fmt(f.medianAward)}</div>
                                </div>
                                <Btn size="sm" variant="primary">Launch Pitch Builder</Btn>
                            </div>
                        </Card>
                    ))
                }
            </div>

            <Card style={{ marginTop: 30, background: `${T.purple}05`, border: `1px dashed ${T.purple}44` }}>
                <div style={{ display: "flex", gap: 15, alignItems: "center" }}>
                    <div style={{ fontSize: 24 }}>🏗️</div>
                    <div style={{ fontSize: 13, color: T.sub }}>
                        <b>WHY THIS WORKS:</b> 40% of private foundations do not publish open RFPs. This engine identifies those with the highest "Open Inquiry" success rates using historical 990-PF filing data.
                    </div>
                </div>
            </Card>
        </div>
    );
};
