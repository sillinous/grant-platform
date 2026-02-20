import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn, TrackBtn } from '../ui';
import { T, PROFILE, uid } from '../globals';
import { API } from '../api';
import { useStore } from '../store';

export const SynergyEngine = ({ onAdd: propOnAdd }) => {
    const { addGrant: storeOnAdd } = useStore();
    const onAdd = propOnAdd || storeOnAdd;
    const [synergies, setSynergies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.getCrossSectorSynergies(PROFILE.tags).then(d => {
            setSynergies(d);
            setLoading(false);
        });
    }, []);

    return (
        <div style={{ padding: 20, animation: "fadeIn 0.4s" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 24, padding: "8px", background: `${T.blue}11`, borderRadius: "8px" }}>🧬</div>
                <div>
                    <h2 style={{ fontSize: 24, fontWeight: 900, color: T.text, margin: 0 }}>Synergy Engine</h2>
                    <p style={{ color: T.mute, fontSize: 13, marginTop: 4 }}>Uncovering "Adjacent Wins" — grants in other sectors that match your capabilities.</p>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                {loading ? <div style={{ color: T.mute }}>Mapping cross-sector flows...</div> : 
                    synergies.map(s => (
                        <Card key={s.id} style={{ borderTop: `4px solid ${T.blue}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                <Badge color={T.blue}>{s.sector}</Badge>
                                <div style={{ textAlign: "right" }}>
                                    <div style={{ fontSize: 10, color: T.mute, fontWeight: 700, letterSpacing: 0.5 }}>SYNERGY</div>
                                    <div style={{ fontSize: 15, fontWeight: 900, color: T.blue }}>{s.synergyScore}%</div>
                                </div>
                            </div>

                            <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: 0, height: 44, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", marginBottom: 12 }}>{s.title}</h3>
                            
                            <div style={{ padding: 12, background: T.panel, borderRadius: 8, marginBottom: 16 }}>
                                <div style={{ fontSize: 11, color: T.mute, fontWeight: 700, marginBottom: 8, letterSpacing: 0.5 }}>MATCHING CAPABILITIES</div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                    {s.matchingTags.map(t => <Badge key={t} size="xs" color={T.shade}>{t}</Badge>)}
                                </div>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
                                <div style={{ fontSize: 16, fontWeight: 800, color: T.green }}>{fmt(s.amount)}</div>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <Btn size="sm" variant="primary">Match Logic</Btn>
                                    {onAdd && (
                                        <TrackBtn onTrack={() => {
                                            onAdd({
                                                id: uid(),
                                                title: s.title,
                                                agency: s.sector, // Broadest categorization for agency
                                                amount: s.amount,
                                                deadline: "Rolling",
                                                stage: "discovered",
                                                description: `Synergy Score: ${s.synergyScore}%. Matching Tags: ${s.matchingTags.join(', ')}`,
                                                category: "Cross-Sector Synergy",
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

            <Card style={{ marginTop: 24, background: `linear-gradient(90deg, ${T.blue}11, transparent)`, borderColor: T.blue + "33", borderLeft: `4px solid ${T.blue}` }}>
                <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                    <div style={{ fontSize: 24 }}>🧪</div>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 4 }}>Why am I seeing these?</div>
                        <p style={{ fontSize: 13, color: T.sub, margin: 0, lineHeight: 1.5 }}>Your profile's <Badge color={T.blue} size="xs">technology</Badge> and <Badge color={T.purple} size="xs">rural</Badge> tags are highly relevant to these sectors. Expanding your focus could increase your funding surface area by up to <b>35%</b>.</p>
                    </div>
                </div>
            </Card>
        </div>
    );
};
