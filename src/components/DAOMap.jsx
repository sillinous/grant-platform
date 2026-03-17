import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn, TrackBtn, SkeletonCard, Empty } from '../ui';
import { T, uid } from '../globals';
import { API } from '../api';
import { useStore } from '../store';

export const DAOMap = ({ onAdd: propOnAdd }) => {
    const { addGrant: storeOnAdd } = useStore();
    const onAdd = propOnAdd || storeOnAdd;
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

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {loading ? <div style={{ display: "contents" }}><SkeletonCard lines={6} /><SkeletonCard lines={6} /></div> :
                    treasuries.length === 0 ? <div style={{ gridColumn: "1 / -1" }}><Empty icon="⛓️" title="No DAO Treasuries Found" sub="Monitoring decentralized governance networks for public goods funding." /></div> :
                    treasuries.map(dao => (
                        <Card key={dao.id} glow style={{ borderTop: `4px solid ${T.indigo}`, background: `linear-gradient(145deg, ${T.indigo}08, transparent)` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <Badge color={T.indigo} style={{ background: `${T.indigo}11` }}>{dao.token}</Badge>
                                    <Badge color={T.sub}>GOVERNANCE TOKEN</Badge>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <div style={{ fontSize: 10, color: T.mute, fontWeight: 800, letterSpacing: 1, marginBottom: 4 }}>TREASURY AUM</div>
                                    <div style={{ fontSize: 18, fontWeight: 900, color: T.text, letterSpacing: "-0.02em" }}>{dao.aum}</div>
                                </div>
                            </div>

                            <h3 style={{ fontSize: 18, fontWeight: 800, color: T.text, margin: "0 0 6px", fontFamily: "Outfit" }}>
                                {dao.url ? (
                                    <a href={dao.url} target="_blank" rel="noopener noreferrer"
                                        style={{ color: T.text, textDecoration: "none" }}
                                        onMouseEnter={e => e.target.style.color = T.indigo}
                                        onMouseLeave={e => e.target.style.color = T.text}>
                                        {dao.name} <span style={{ fontSize: 11, color: T.indigo, fontWeight: 400 }}>↗</span>
                                    </a>
                                ) : dao.name}
                            </h3>
                            <div style={{ fontSize: 12, color: T.indigo, marginBottom: 12, fontWeight: 700, letterSpacing: 0.5 }}>🔭 {dao.focus?.toUpperCase()}</div>

                            {dao.description && (
                                <p style={{ fontSize: 13, color: T.sub, margin: "0 0 16px", lineHeight: 1.5 }}>{dao.description}</p>
                            )}

                            <div style={{ padding: 14, background: "rgba(255,255,255,0.02)", border: `1px solid ${T.glassBorder}`, borderRadius: 12, marginBottom: 20 }}>
                                <div style={{ fontSize: 10, color: T.sub, fontWeight: 800, letterSpacing: 1, marginBottom: 10 }}>ACTIVE PROPOSAL EPOCH</div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 6 }}>{dao.activeProp}</div>
                                <div style={{ fontSize: 13, color: T.green, fontWeight: 800, letterSpacing: 0.5 }}>💰 GRANT RANGE: {dao.GrantSize}</div>
                                {dao.members && <div style={{ fontSize: 11, color: T.mute, marginTop: 6 }}>Members: {dao.members}</div>}
                            </div>

                            <div style={{ display: "flex", gap: 10, borderTop: `1px solid ${T.glassBorder}`, paddingTop: 18 }}>
                                {dao.url ? (
                                    <a href={dao.url} target="_blank" rel="noopener noreferrer" style={{ flex: 1 }}>
                                        <Btn variant="primary" style={{ width: "100%" }}>Draft Proposal ↗</Btn>
                                    </a>
                                ) : (
                                    <Btn variant="primary" style={{ flex: 1 }}>Draft Proposal</Btn>
                                )}
                                {onAdd && (
                                    <TrackBtn onTrack={() => onAdd({
                                        id: uid(),
                                        title: dao.name,
                                        agency: "DAO Treasury",
                                        amount: 0,
                                        deadline: dao.activeProp,
                                        stage: "discovered",
                                        description: `Token: ${dao.token}. Focus: ${dao.focus}. AUM: ${dao.aum}. Grant Range: ${dao.GrantSize}. ${dao.description || ""}`,
                                        category: "Web3/DAO",
                                        link: dao.url,
                                        createdAt: new Date().toISOString()
                                    })} label="+ Track" />
                                )}
                            </div>
                        </Card>
                    ))
                }
            </div>
        </div>
    );
};
