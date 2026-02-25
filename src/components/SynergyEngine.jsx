import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn, TrackBtn, SkeletonCard, Empty } from '../ui';
import { T, PROFILE, uid, fmt } from '../globals';
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

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 24 }}>
                {loading ? <div style={{ display: "contents" }}><SkeletonCard lines={6} /><SkeletonCard lines={6} /><SkeletonCard lines={6} /></div> :
                    synergies.length === 0 ? <div style={{ gridColumn: "1 / -1" }}><Empty icon="🧬" title="No Immediate Synergies" sub="We couldn't find adjacent sector opportunities matching your current profile." /></div> :
                    synergies.map(s => (
                        <Card key={s.id} glow style={{ borderTop: `6px solid ${T.blue}`, padding: 24 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                                <Badge color={T.blue} style={{ background: `${T.blue}11`, fontWeight: 800, padding: "6px 12px" }}>{s.sector?.toUpperCase()}</Badge>
                                <div style={{ textAlign: "right" }}>
                                    <div style={{ fontSize: 10, color: T.mute, fontWeight: 900, letterSpacing: 1.5, marginBottom: 4 }}>MATCH QUALITY</div>
                                    <div style={{ fontSize: 20, fontWeight: 900, color: T.blue, letterSpacing: "-0.04em" }}>{s.synergyScore}%</div>
                                </div>
                            </div>

                            <h3 style={{ fontSize: 18, fontWeight: 900, color: T.text, margin: 0, height: 48, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", marginBottom: 20, fontFamily: "Outfit", lineHeight: 1.3 }}>{s.title}</h3>
                            
                            <div style={{ padding: 20, background: "rgba(255,255,255,0.02)", borderRadius: 16, marginBottom: 24, border: `1px solid ${T.glassBorder}` }}>
                                <div style={{ fontSize: 10, color: T.mute, fontWeight: 900, marginBottom: 12, letterSpacing: 1.5 }}>STRATEGIC CAPABILITIES</div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                    {s.matchingTags.map(t => <Badge key={t} color={T.blue} style={{ background: `${T.blue}08`, textTransform: "none", fontWeight: 700 }}>#{t}</Badge>)}
                                </div>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${T.glassBorder}`, paddingTop: 24 }}>
                                <div style={{ fontSize: 22, fontWeight: 900, color: T.green }}>{fmt(s.amount)}</div>
                                <div style={{ display: "flex", gap: 10 }}>
                                    <Btn variant="primary">Match Logic</Btn>
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
