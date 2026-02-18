import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn } from '../ui';
import { T } from '../globals';
import { API } from '../api';

export const DAOMap = () => {
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

                            <Btn variant="primary" style={{ width: "100%", marginTop: 20 }}>Draft Governance Proposal</Btn>
                        </Card>
                    ))
                }
            </div>
        </div>
    );
};
