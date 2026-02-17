import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn, Stat } from '../ui';
import { T, API, fmt } from '../globals';

export const SubGrantRadar = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.searchSubGrantOpportunities().then(d => {
            setData(d);
            setLoading(false);
        });
    }, []);

    return (
        <div style={{ padding: 20 }}>
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: T.text, margin: 0 }}>Sub-Grant Radar 🛰️</h2>
                <p style={{ color: T.mute, fontSize: 13, marginTop: 4 }}>Tracking massive "Prime" awards that require pass-through funding to partners like you.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {loading ? <div style={{ color: T.mute }}>Scanning prime award registries...</div> : 
                    data.map(item => (
                        <Card key={item.id} glow style={{ borderLeft: `4px solid ${T.amber}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                                <Badge color={T.amber}>{item.status}</Badge>
                                <div style={{ fontSize: 11, fontWeight: 700, color: T.green }}>POTENTIAL WIN: {fmt(item.subGrantAlloc)}</div>
                            </div>
                            
                            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: 0 }}>{item.title}</h3>
                            <div style={{ marginTop: 15, padding: 12, background: `${T.shade}20`, borderRadius: 8 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 8 }}>
                                    <span style={{ color: T.mute }}>PRIME FUNDER</span>
                                    <span style={{ color: T.text, fontWeight: 600 }}>{item.prime}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                                    <span style={{ color: T.mute }}>PRIMARY RECIPIENT</span>
                                    <span style={{ color: T.blue, fontWeight: 600 }}>{item.recipient}</span>
                                </div>
                            </div>

                            <div style={{ marginTop: 15, fontSize: 12, color: T.sub, lineHeight: 1.5, background: `${T.green}05`, padding: 10, borderRadius: 6, border: `1px solid ${T.green}20` }}>
                                💡 <b>PARTNERSHIP MANDATE:</b> {item.requirement}
                            </div>

                            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                                <Btn variant="primary" style={{ flex: 1 }}>Contact Prime Partner</Btn>
                                <Btn variant="ghost">Analysis</Btn>
                            </div>
                        </Card>
                    ))
                }
            </div>
        </div>
    );
};
