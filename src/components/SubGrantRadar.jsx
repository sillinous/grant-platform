import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn, TrackBtn, SkeletonCard, Empty } from '../ui';
import { T, uid, fmt } from '../globals';
import { API } from '../api';
import { useStore } from '../store';

export const SubGrantRadar = ({ onAdd: propOnAdd }) => {
    const { addGrant: storeOnAdd } = useStore();
    const onAdd = propOnAdd || storeOnAdd;
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.searchSubGrantOpportunities().then(d => {
            setData(d);
            setLoading(false);
        });
    }, []);

    return (
        <div style={{ padding: 20, animation: "fadeIn 0.4s" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 24, padding: "8px", background: `${T.amber}11`, borderRadius: "8px" }}>🛰️</div>
                <div>
                    <h2 style={{ fontSize: 24, fontWeight: 900, color: T.text, margin: 0 }}>Sub-Grant Radar</h2>
                    <p style={{ color: T.mute, fontSize: 13, marginTop: 4 }}>Tracking massive "Prime" awards that require pass-through funding to partners like you.</p>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                {loading ? <div style={{ display: "contents" }}><SkeletonCard lines={6} /><SkeletonCard lines={6} /></div> :
                    data.length === 0 ? <div style={{ gridColumn: "1 / -1" }}><Empty icon="🛰️" title="No Sub-Grants Found" sub="Monitoring for prime awards that mandate partnership distributions." /></div> :
                    data.map(item => (
                        <Card key={item.id} glow style={{ borderTop: `6px solid ${T.amber}`, padding: 24 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, alignItems: "center" }}>
                                <Badge color={T.amber} style={{ background: `${T.amber}11`, fontWeight: 800 }}>{item.status?.toUpperCase()}</Badge>
                                <div style={{ textAlign: "right" }}>
                                    <div style={{ fontSize: 10, color: T.mute, fontWeight: 900, letterSpacing: 1.5, marginBottom: 4 }}>SUB-ALLOCATION</div>
                                    <div style={{ fontSize: 24, fontWeight: 900, color: T.green, letterSpacing: "-0.04em" }}>{fmt(item.subGrantAlloc)}</div>
                                </div>
                            </div>
                            
                            <h3 style={{ fontSize: 18, fontWeight: 900, color: T.text, margin: 0, marginBottom: 20, height: 48, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", fontFamily: "Outfit", lineHeight: 1.3 }}>{item.title}</h3>

                            <div style={{ padding: 20, background: "rgba(255,255,255,0.02)", borderRadius: 16, marginBottom: 24, border: `1px solid ${T.glassBorder}` }}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 12 }}>
                                    <span style={{ color: T.mute, fontWeight: 800 }}>PRIME FUNDER</span>
                                    <span style={{ color: T.text, fontWeight: 900 }}>{item.prime?.toUpperCase()}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                                    <span style={{ color: T.mute, fontWeight: 800 }}>PRIMARY RECIPIENT</span>
                                    <span style={{ color: T.blue, fontWeight: 900 }}>{item.recipient?.toUpperCase()}</span>
                                </div>
                            </div>

                            <div style={{ padding: 20, background: `${T.green}08`, borderLeft: `6px solid ${T.green}`, borderRadius: 16, fontSize: 14, color: T.sub, marginBottom: 24, lineHeight: 1.7 }}>
                                <strong style={{ color: T.text, fontWeight: 900, display: "block", marginBottom: 8, fontSize: 11, letterSpacing: 1 }}>PARTNERSHIP MANDATE</strong>
                                {item.requirement}
                            </div>

                            <div style={{ display: "flex", gap: 12, borderTop: `1px solid ${T.glassBorder}`, paddingTop: 24 }}>
                                <Btn variant="primary" style={{ flex: 1 }}>Initiate Prime Contact</Btn>
                                {onAdd && (
                                    <TrackBtn onTrack={() => {
                                        onAdd({
                                            id: uid(),
                                            title: item.title,
                                            agency: item.prime,
                                            amount: item.subGrantAlloc,
                                            deadline: "Rolling",
                                            stage: "discovered",
                                            description: `Prime Recipient: ${item.recipient}. Requirement: ${item.requirement}`,
                                            category: "Sub-Grant",
                                            createdAt: new Date().toISOString()
                                        });
                                    }} defaultLabel="+ Track" />
                                )}
                            </div>
                        </Card>
                    ))
                }
            </div>
        </div>
    );
};
