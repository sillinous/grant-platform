import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn, Stat, TrackBtn, SkeletonCard, Empty } from '../ui';
import { T, fmt, uid } from '../globals';
import { API } from '../api';
import { useStore } from '../store';

export const UnsolicitedProspector = ({ onAdd: propOnAdd }) => {
    const { addGrant: storeOnAdd } = useStore();
    const onAdd = propOnAdd || storeOnAdd;
    const [funders, setFunders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.discoverUnsolicitedFunders().then(d => {
            setFunders(d);
            setLoading(false);
        });
    }, []);

    return (
        <div style={{ padding: 20, animation: "fadeIn 0.4s" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 24, padding: "8px", background: `${T.purple}11`, borderRadius: "8px" }}>💎</div>
                <div>
                    <h2 style={{ fontSize: 24, fontWeight: 900, color: T.text, margin: 0 }}>Unsolicited Prospector</h2>
                    <p style={{ color: T.mute, fontSize: 13, marginTop: 4 }}>Identifying funders who prioritize relationship-based "Unsolicited Inquiries" over formal RFPs.</p>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {loading ? <div style={{ display: "contents" }}><SkeletonCard lines={6} /><SkeletonCard lines={6} /></div> :
                    funders.length === 0 ? <div style={{ gridColumn: "1 / -1" }}><Empty icon="💎" title="No Unsolicited Funders Found" sub="Monitoring 990-PF data for open-inquiry foundations." /></div> :
                    funders.map(f => (
                        <Card key={f.id} glow style={{ borderTop: `4px solid ${T.purple}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                                <Badge color={T.purple} style={{ background: `${T.purple}11` }}>{f.inquiryPolicy}</Badge>
                                <div style={{ textAlign: "right" }}>
                                    <div style={{ fontSize: 10, color: T.mute, fontWeight: 800, letterSpacing: 1, marginBottom: 4 }}>UNSOLICITED RATE</div>
                                    <div style={{ fontSize: 18, fontWeight: 900, color: T.purple }}>{f.unsolicitedRate}</div>
                                </div>
                            </div>

                            <h3 style={{ fontSize: 18, fontWeight: 800, color: T.text, margin: 0, marginBottom: 8, fontFamily: "Outfit", height: 24, overflow: "hidden" }}>{f.name}</h3>
                            <div style={{ fontSize: 14, color: T.sub, marginBottom: 20, lineHeight: 1.6, height: 44, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", fontStyle: "italic" }}>{f.logic}</div>

                            <div style={{ padding: 16, background: "rgba(255,255,255,0.02)", borderRadius: 12, marginBottom: 20, border: `1px solid ${T.glassBorder}` }}>
                                <div style={{ fontSize: 11, color: T.mute, fontWeight: 800, letterSpacing: 1, marginBottom: 4 }}>MEDIAN AWARD</div>
                                <div style={{ fontSize: 28, fontWeight: 900, color: T.green, letterSpacing: "-0.02em" }}>{fmt(f.medianAward)}</div>
                            </div>

                            <div style={{ display: "flex", gap: 12, borderTop: `1px solid ${T.glassBorder}`, paddingTop: 20 }}>
                                <Btn variant="primary" style={{ flex: 1 }}>Pitch Interface</Btn>
                                {onAdd && (
                                    <TrackBtn onTrack={() => {
                                        onAdd({
                                            id: uid(),
                                            title: f.name,
                                            agency: "Private Funder (Unsolicited)",
                                            amount: f.medianAward,
                                            deadline: "Rolling",
                                            stage: "discovered",
                                            description: `Unsolicited Inquiry Policy: ${f.inquiryPolicy}. Logic: ${f.logic}`,
                                            category: "Unsolicited Foundation",
                                            createdAt: new Date().toISOString()
                                        });
                                    }} label="+ Track" />
                                )}
                            </div>
                        </Card>
                    ))
                }
            </div>

            <Card style={{ marginTop: 24, background: `linear-gradient(90deg, ${T.purple}11, transparent)`, borderColor: T.purple + "33", borderLeft: `4px solid ${T.purple}` }}>
                <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                    <div style={{ fontSize: 24 }}>🏗️</div>
                    <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.5 }}>
                        <strong style={{ color: T.text, display: "block", marginBottom: 4 }}>WHY THIS WORKS</strong> 40% of private foundations do not publish open RFPs. This engine identifies those with the highest "Open Inquiry" success rates using historical 990-PF filing data.
                    </div>
                </div>
            </Card>
        </div>
    );
};
