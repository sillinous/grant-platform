import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn, MiniBar } from '../ui';
import { T, API, PROFILE, fmt } from '../globals';

export const SynergyEngine = () => {
    const [synergies, setSynergies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.getCrossSectorSynergies(PROFILE.tags).then(d => {
            setSynergies(d);
            setLoading(false);
        });
    }, []);

    return (
        <div style={{ padding: 20 }}>
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: T.text, margin: 0 }}>Synergy Engine 🧬</h2>
                <p style={{ color: T.mute, fontSize: 13, marginTop: 4 }}>Uncovering "Adjacent Wins" — grants in other sectors that match your capabilities.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                {loading ? <div style={{ color: T.mute }}>Mapping cross-sector flows...</div> : 
                    synergies.map(s => (
                        <Card key={s.id} glow style={{ borderTop: `4px solid ${T.blue}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
                                <Badge color={T.blue}>{s.sector}</Badge>
                                <div style={{ textAlign: "right" }}>
                                    <div style={{ fontSize: 10, color: T.mute }}>SYNERGY</div>
                                    <div style={{ fontSize: 14, fontWeight: 900, color: T.blue }}>{s.synergyScore}%</div>
                                </div>
                            </div>

                            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: 0, height: 40, overflow: "hidden" }}>{s.title}</h3>
                            
                            <div style={{ marginTop: 15, fontSize: 10, color: T.mute }}>MATCHING CAPABILITIES:</div>
                            <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                                {s.matchingTags.map(t => <Badge key={t} size="xs" color={T.shade}>{t}</Badge>)}
                            </div>

                            <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: T.green }}>{fmt(s.amount)}</div>
                                <Btn size="xs" variant="primary">Match Logic</Btn>
                            </div>
                        </Card>
                    ))
                }
            </div>

            <Card style={{ marginTop: 30, background: `linear-gradient(90deg, ${T.blue}10, transparent)`, borderColor: T.blue + "33" }}>
                <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                    <div style={{ fontSize: 32 }}>🧪</div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Why am I seeing these?</div>
                        <p style={{ fontSize: 12, color: T.sub, margin: "4px 0 0" }}>Your profile's technology and rural tags are highly relevant to these sectors. Expanding your focus could increase your funding surface area by up to 35%.</p>
                    </div>
                </div>
            </Card>
        </div>
    );
};
