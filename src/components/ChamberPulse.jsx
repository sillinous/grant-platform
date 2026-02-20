import React, { useState, useEffect } from 'react';
import { T, fmt, uid, PROFILE } from '../globals';
import { API } from '../api';
import { Card, Badge, Btn, TrackBtn, SkeletonCard } from '../ui';

export const ChamberPulse = ({ onAdd }) => {
    const [grants, setGrants] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.getChamberGrants().then(d => {
            setGrants(d);
            setLoading(false);
        });
    }, []);

    return (
        <div style={{ padding: 20, animation: "fadeIn 0.4s" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 24, padding: "8px", background: `${T.orange}11`, borderRadius: "8px" }}>🏛️</div>
                <div>
                    <h2 style={{ fontSize: 24, fontWeight: 900, color: T.text, margin: 0 }}>Chamber Pulse</h2>
                    <p style={{ color: T.mute, fontSize: 13, marginTop: 4 }}>Hyper-local grants from Business Improvement Districts (BIDs) and Chambers.</p>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
                <div style={{ padding: 12, background: `${T.orange}11`, borderRadius: 8, border: `1px solid ${T.orange}33`, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>📍</span>
                    <div style={{ fontSize: 12, color: T.sub }}>
                        <b>Local Target:</b> Scanning Chambers of Commerce and Business Improvement Districts near <b>{PROFILE.zip || "your location"}</b>.
                    </div>
                </div>

                {loading ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <SkeletonCard lines={2} style={{ borderLeft: `4px solid ${T.orange}` }} />
                        <SkeletonCard lines={2} style={{ borderLeft: `4px solid ${T.orange}` }} />
                    </div>
                ) : 
                    grants.map(g => (
                        <Card key={g.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderLeft: `4px solid ${T.orange}` }}>
                            <div style={{ flex: 1, paddingRight: 24 }}>
                                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
                                    <Badge color={T.orange}>{g.org}</Badge>
                                    <Badge color={T.shade}>{g.type}</Badge>
                                </div>
                                <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: 0, marginBottom: 8 }}>{g.title}</h3>
                                <p style={{ fontSize: 13, color: T.sub, margin: 0, lineHeight: 1.5 }}>{g.description}</p>
                            </div>
                            <div style={{ textAlign: "right", minWidth: 150 }}>
                                <div style={{ fontSize: 10, color: T.mute, fontWeight: 700, letterSpacing: 0.5, marginBottom: 4 }}>FUNDING</div>
                                <div style={{ fontSize: 24, fontWeight: 900, color: T.text, marginBottom: 16 }}>{fmt(g.amount)}</div>
                                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                                    <Btn size="sm" variant="primary">Apply</Btn>
                                    {onAdd && (
                                        <TrackBtn onTrack={() => {
                                            onAdd({
                                                id: uid(),
                                                title: g.title,
                                                agency: g.org,
                                                amount: g.amount,
                                                deadline: "Rolling",
                                                stage: "discovered",
                                                description: g.description,
                                                category: "Chamber Pulse",
                                                createdAt: new Date().toISOString()
                                            });
                                        }} defaultLabel="+ Track" />
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))
                }
            </div>
        </div>
    );
};
