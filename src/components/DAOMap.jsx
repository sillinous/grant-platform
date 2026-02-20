import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn } from '../ui';
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
        <div style={{ padding: 20 }}>
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: T.text, margin: 0 }}>DAO Treasury Map ⛓️</h2>
                <p style={{ color: T.mute, fontSize: 13, marginTop: 4 }}>Navigating decentralized governance treasuries funding "Public Goods".</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {loading ? <div style={{ color: T.mute }}>Syncing blockchain governance proposals...</div> : 
                    treasuries.map(dao => (
                        <Card key={dao.id} glow style={{ background: `linear-gradient(145deg, ${T.panel}, #2a2a40)` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 15 }}>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <Badge color={T.indigo}>{dao.token}</Badge>
                                    <Badge color={T.shade}>WEB3</Badge>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <div style={{ fontSize: 10, color: T.mute }}>TREASURY AUM</div>
                                    <div style={{ fontSize: 14, fontWeight: 900, color: T.text }}>{dao.aum}</div>
                                </div>
                            </div>

                            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: 0 }}>{dao.name}</h3>
                            <div style={{ marginTop: 10, fontSize: 13, color: T.indigo }}>🔭 Focus: {dao.focus}</div>

                            <div style={{ marginTop: 20, padding: 12, border: `1px solid ${T.indigo}44`, borderRadius: 8 }}>
                                <div style={{ fontSize: 10, color: T.mute, marginBottom: 4 }}>ACTIVE PROPOSAL EPOCH</div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{dao.activeProp}</div>
                                <div style={{ marginTop: 8, fontSize: 12, color: T.green }}>💰 Grant Size: {dao.GrantSize}</div>
                            </div>

                            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                                <Btn variant="primary" style={{ flex: 1 }}>Draft Governance Proposal</Btn>
                                {onAdd && (
                                    <Btn variant="success" size="sm" onClick={() => {
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
                                    }}>+ Track</Btn>
                                )}
                            </div>
                        </Card>
                    ))
                }
            </div>
        </div>
    );
};
