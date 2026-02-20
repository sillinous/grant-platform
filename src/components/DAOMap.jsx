import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn, TrackBtn } from '../ui';
import { T, uid } from '../globals';
import { API } from '../api';

export const DAOMap = ({ onAdd }) => {
    const [treasuries, setTreasuries] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.getDAOTreasuries().then(d => {
            setTreasuries(d);
            setLoading(false);
        });
    }, []);

    return (
        <div style={{ padding: 20, animation: "fadeIn 0.4s" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 24, padding: "8px", background: `${T.indigo}11`, borderRadius: "8px" }}>⛓️</div>
                <div>
                    <h2 style={{ fontSize: 24, fontWeight: 900, color: T.text, margin: 0 }}>DAO Treasury Map</h2>
                    <p style={{ color: T.mute, fontSize: 13, marginTop: 4 }}>Navigating decentralized governance treasuries funding "Public Goods".</p>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {loading ? <div style={{ color: T.mute }}>Syncing blockchain governance proposals...</div> : 
                    treasuries.map(dao => (
                        <Card key={dao.id} style={{ borderTop: `4px solid ${T.indigo}`, background: `linear-gradient(145deg, ${T.panel}, transparent)` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <Badge color={T.indigo}>{dao.token}</Badge>
                                    <Badge color={T.shade}>WEB3</Badge>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <div style={{ fontSize: 10, color: T.mute, fontWeight: 700, letterSpacing: 0.5 }}>TREASURY AUM</div>
                                    <div style={{ fontSize: 15, fontWeight: 800, color: T.text }}>{dao.aum}</div>
                                </div>
                            </div>

                            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: 0, marginBottom: 8 }}>{dao.name}</h3>
                            <div style={{ fontSize: 13, color: T.indigo, marginBottom: 16 }}>🔭 Focus: <span style={{ fontWeight: 600 }}>{dao.focus}</span></div>

                            <div style={{ padding: 12, background: `${T.indigo}11`, border: `1px solid ${T.indigo}22`, borderRadius: 8, marginBottom: 16 }}>
                                <div style={{ fontSize: 10, color: T.indigo, fontWeight: 700, letterSpacing: 0.5, marginBottom: 4 }}>ACTIVE PROPOSAL EPOCH</div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 8 }}>{dao.activeProp}</div>
                                <div style={{ fontSize: 12, color: T.green, fontWeight: 600 }}>💰 Grant Size: {dao.GrantSize}</div>
                            </div>

                            <div style={{ display: "flex", gap: 10, borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
                                <Btn variant="primary" style={{ flex: 1 }}>Draft Proposal</Btn>
                                {onAdd && (
                                    <TrackBtn onTrack={() => {
                                        onAdd({
                                            id: uid(),
                                            title: dao.name,
                                            agency: "DAO Treasury",
                                            amount: 0, // Usually DAO grants are variable, amount not explicitly typed as number in the mock
                                            deadline: dao.activeProp,
                                            stage: "discovered",
                                            description: `Token: ${dao.token}. Focus: ${dao.focus}. AUM: ${dao.aum}. Grant Size Expected: ${dao.GrantSize}`,
                                            category: "Web3/DAO",
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
