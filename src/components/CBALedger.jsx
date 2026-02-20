import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn, Progress, TrackBtn } from '../ui';
import { T, fmt, uid } from '../globals';
import { API } from '../api';

export const CBALedger = ({ onAdd }) => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.getCBASignals().then(d => {
            setProjects(d);
            setLoading(false);
        });
    }, []);

    return (
        <div style={{ padding: 20, animation: "fadeIn 0.4s" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 24, padding: "8px", background: `${T.orange}11`, borderRadius: "8px" }}>🏗️</div>
                <div>
                    <h2 style={{ fontSize: 24, fontWeight: 900, color: T.text, margin: 0 }}>CBA Ledger</h2>
                    <p style={{ color: T.mute, fontSize: 13, marginTop: 4 }}>Accessing "Community Benefit Agreement" funds mandated for mega-developments.</p>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {loading ? <div style={{ color: T.mute }}>Auditing construction permits...</div> : 
                    projects.map(p => {
                        const percentLeft = (p.remaining / p.fundTotal) * 100;
                        return (
                            <Card key={p.id} style={{ borderTop: `4px solid ${T.orange}` }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                                    <Badge color={T.orange}>DEVELOPER FUND</Badge>
                                    <Badge color={T.shade}>{p.status}</Badge>
                                </div>

                                <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: 0, marginBottom: 4, height: 44, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.project}</h3>
                                <div style={{ fontSize: 13, color: T.mute, marginBottom: 16 }}>Dev: {p.developer}</div>

                                <div style={{ padding: 12, background: T.panel, borderRadius: 8, marginBottom: 16 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.mute, fontWeight: 700, letterSpacing: 0.5, marginBottom: 8 }}>
                                        <span>REMAINING FUNDS</span>
                                        <span style={{ color: T.text }}>{fmt(p.remaining)} / {fmt(p.fundTotal)}</span>
                                    </div>
                                    <div style={{ height: 6, background: T.border, borderRadius: 3, overflow: "hidden" }}>
                                        <div style={{ height: "100%", width: `${percentLeft}%`, background: T.green, borderRadius: 3 }} />
                                    </div>
                                </div>

                                <div style={{ padding: 12, background: `${T.orange}11`, borderLeft: `3px solid ${T.orange}`, borderRadius: 8, fontSize: 13, color: T.sub, marginBottom: 16 }}>
                                    <strong style={{ color: T.text }}>Focus:</strong> {p.focus}
                                </div>

                                <div style={{ display: "flex", gap: 10, borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
                                    <Btn variant="primary" style={{ flex: 1 }}>Contact {p.contact}</Btn>
                                    <Btn variant="ghost" onClick={async () => {
                                        const res = await API.fortuna.syncToLedger();
                                        alert(`CBA LEDGER SYNC: ${res.synced} transactions processed for ${p.project}.`);
                                    }}>🔄 Sync</Btn>
                                    {onAdd && (
                                        <TrackBtn onTrack={() => {
                                            onAdd({
                                                id: uid(),
                                                title: `${p.project} - CBA Fund`,
                                                agency: p.developer,
                                                amount: p.remaining,
                                                deadline: "Rolling",
                                                stage: "discovered",
                                                description: `Developer: ${p.developer}. Focus: ${p.focus}. Contact: ${p.contact}`,
                                                category: "CBA Fund",
                                                createdAt: new Date().toISOString()
                                            });
                                        }} defaultLabel="+ Track Fund" />
                                    )}
                                </div>
                            </Card>
                        );
                    })
                }
            </div>
        </div>
    );
};
