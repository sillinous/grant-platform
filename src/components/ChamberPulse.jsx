import React, { useState, useEffect } from 'react';
import { T, fmt, uid, PROFILE } from '../globals';
import { API } from '../api';
import { Card, Badge, Btn, TrackBtn, SkeletonCard, Empty } from '../ui';
import { useStore } from '../store';

export const ChamberPulse = ({ onAdd: propOnAdd }) => {
    const { addGrant: storeOnAdd } = useStore();
    const onAdd = propOnAdd || storeOnAdd;
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

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
                <Card style={{ padding: "16px 20px", background: `${T.orange}08`, border: `1px solid ${T.orange}22`, display: "flex", alignItems: "center", gap: 12, borderRadius: 12 }}>
                    <span style={{ fontSize: 20 }}>📍</span>
                    <div style={{ fontSize: 14, color: T.sub }}>
                        Scanning local Business Improvement Districts (BIDs) near <b style={{ color: T.text }}>{PROFILE.zip || "your registered location"}</b>.
                    </div>
                </Card>

                {loading ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <SkeletonCard lines={2} style={{ borderLeft: `6px solid ${T.orange}` }} />
                        <SkeletonCard lines={2} style={{ borderLeft: `6px solid ${T.orange}` }} />
                    </div>
                ) : 
                    grants.length === 0 ? <Empty icon="🏛️" title="No Local Grants Found" sub="Checking Business Improvement Districts (BIDs) and local chambers." /> :
                    grants.map(g => (
                        <Card key={g.id} glow style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: `6px solid ${T.orange}`, padding: "24px 32px" }}>
                            <div style={{ flex: 1, paddingRight: 32 }}>
                                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
                                    <Badge color={T.orange} style={{ background: `${T.orange}11` }}>{g.org}</Badge>
                                    <Badge color={T.sub}>{g.type?.toUpperCase()}</Badge>
                                </div>
                                <h3 style={{ fontSize: 20, fontWeight: 800, color: T.text, margin: 0, marginBottom: 8, fontFamily: "Outfit" }}>{g.title}</h3>
                                <p style={{ fontSize: 14, color: T.sub, margin: 0, lineHeight: 1.6 }}>{g.description}</p>
                            </div>
                            <div style={{ textAlign: "right", minWidth: 180 }}>
                                <div style={{ fontSize: 11, color: T.mute, fontWeight: 800, letterSpacing: 1, marginBottom: 4 }}>DIRECT FUNDING</div>
                                <div style={{ fontSize: 32, fontWeight: 900, color: T.text, marginBottom: 20, letterSpacing: "-0.02em" }}>{fmt(g.amount)}</div>
                                <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                                    <Btn size="md" variant="primary">Access Portal</Btn>
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
                                                category: "Local Chamber",
                                                createdAt: new Date().toISOString()
                                            });
                                        }} label="+ Watch" />
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
