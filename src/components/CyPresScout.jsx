import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn, Stat, TrackBtn, SkeletonCard, Empty } from '../ui';
import { T, fmt, uid } from '../globals';
import { API } from '../api';
import { useStore } from '../store';

export const CyPresScout = ({ onAdd: propOnAdd }) => {
    const { addGrant: storeOnAdd } = useStore();
    const onAdd = propOnAdd || storeOnAdd;
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.getCyPresAwards().then(d => {
            setCases(d);
            setLoading(false);
        });
    }, []);

    return (
        <div style={{ padding: 20, animation: "fadeIn 0.4s" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 24, padding: "8px", background: `${T.crimson}11`, borderRadius: "8px" }}>⚖️</div>
                <div>
                    <h2 style={{ fontSize: 24, fontWeight: 900, color: T.text, margin: 0 }}>Cy Pres Scout</h2>
                    <p style={{ color: T.mute, fontSize: 13, marginTop: 4 }}>Tracking "Cy Pres" (Next Best Use) residual funds from class action settlements.</p>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                {loading ? <div style={{ display: "contents" }}><SkeletonCard lines={6} /><SkeletonCard lines={6} /></div> :
                    cases.length === 0 ? <div style={{ gridColumn: "1 / -1" }}><Empty icon="⚖️" title="No Active Settlements" sub="Monitoring dockets for new residual fund distributions." /></div> :
                    cases.map(c => (
                        <Card key={c.id} glow style={{ borderTop: `6px solid ${T.crimson}`, padding: 24 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, alignItems: "center" }}>
                                <Badge color={T.crimson} style={{ background: `${T.crimson}11`, fontWeight: 800 }}>{c.status?.toUpperCase()}</Badge>
                                <div style={{ fontSize: 11, fontFamily: "Outfit", color: T.mute, fontWeight: 900, letterSpacing: 1 }}>{c.docket?.toUpperCase()}</div>
                            </div>

                            <h3 style={{ fontSize: 20, fontWeight: 900, color: T.text, margin: 0, marginBottom: 8, fontFamily: "Outfit", lineHeight: 1.3 }}>{c.caseName}</h3>
                            <div style={{ fontSize: 14, color: T.sub, marginBottom: 24, fontWeight: 700 }}>Alignment: <span style={{ color: T.text, fontWeight: 800, marginLeft: 6 }}>{c.cause?.toUpperCase()}</span></div>
                            
                            <div style={{ padding: 20, background: "rgba(255,100,100,0.03)", borderRadius: 16, marginBottom: 24, border: `1px solid ${T.crimson}22`, borderLeft: `8px solid ${T.crimson}` }}>
                                <div style={{ fontSize: 10, color: T.crimson, textTransform: "uppercase", fontWeight: 900, letterSpacing: 2, marginBottom: 8 }}>ESTIMATED RESIDUAL POOL</div>
                                <div style={{ fontSize: 32, fontWeight: 900, color: T.crimson, letterSpacing: "-0.04em" }}>{fmt(c.residualFund)}</div>
                            </div>

                            <p style={{ fontSize: 13, color: T.sub, lineHeight: 1.7, margin: 0, height: 66, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", fontStyle: "italic", borderBottom: `1px solid ${T.glassBorder}`, paddingBottom: 16 }}>{c.description}</p>

                            <div style={{ marginTop: 20, display: "flex", gap: 12, paddingTop: 4 }}>
                                <Btn variant="primary" style={{ flex: 1 }}>Draft Amicus</Btn>
                                {onAdd && (
                                    <TrackBtn onTrack={() => {
                                        onAdd({
                                            id: uid(),
                                            title: c.caseName,
                                            agency: "Cy Pres Settlement",
                                            amount: c.residualFund,
                                            deadline: "Rolling",
                                            stage: "discovered",
                                            description: `Docket: ${c.docket}. Cause: ${c.cause}. ${c.description}`,
                                            category: "Cy Pres",
                                            createdAt: new Date().toISOString()
                                        });
                                    }} label="+ Track Award" />
                                )}
                            </div>
                        </Card>
                    ))
                }
            </div>

            <Card style={{ marginTop: 24, background: `linear-gradient(90deg, ${T.crimson}11, transparent)`, borderColor: T.crimson + "33", borderLeft: `4px solid ${T.crimson}` }}>
                <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                    <div style={{ fontSize: 24 }}>👨‍⚖️</div>
                    <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.5 }}>
                        <strong style={{ color: T.text, display: "block", marginBottom: 4 }}>Found Money</strong> When plaintiffs can't be found, courts distribute millions to non-profits with a "nexus" to the case. You just need to raise your hand.
                    </div>
                </div>
            </Card>
        </div>
    );
};
