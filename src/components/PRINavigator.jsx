import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn, Stat, TrackBtn, SkeletonCard, Empty } from '../ui';
import { T, fmt, uid } from '../globals';
import { API } from '../api';
import { useStore } from '../store';

export const PRINavigator = ({ onAdd: propOnAdd }) => {
    const { addGrant: storeOnAdd } = useStore();
    const onAdd = propOnAdd || storeOnAdd;
    const [signals, setSignals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.getPRISignals().then(d => {
            setSignals(d);
            setLoading(false);
        });
    }, []);

    return (
        <div style={{ padding: 20, animation: "fadeIn 0.4s" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 24, padding: "8px", background: `${T.green}11`, borderRadius: "8px" }}>🏦</div>
                <div>
                    <h2 style={{ fontSize: 24, fontWeight: 900, color: T.text, margin: 0 }}>PRI Navigator</h2>
                    <p style={{ color: T.mute, fontSize: 13, marginTop: 4 }}>Accessing Program-Related Investments: Low-interest, high-impact capital that foundations MUST deploy.</p>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                {loading ? <div style={{ display: "contents" }}><SkeletonCard lines={6} /><SkeletonCard lines={6} /></div> :
                    signals.length === 0 ? <div style={{ gridColumn: "1 / -1" }}><Empty icon="🏦" title="No PRI Opportunities Found" sub="Monitoring foundations for low-interest program-related investments." /></div> :
                    signals.map(s => (
                        <Card key={s.id} glow style={{ borderTop: `6px solid ${T.green}`, padding: 24 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24, alignItems: "center" }}>
                                <Badge color={T.green} style={{ background: `${T.green}11`, padding: "8px 12px", fontWeight: 800 }}>RATE: {s.rate}</Badge>
                                <div style={{ textAlign: "right" }}>
                                    <div style={{ fontSize: 10, color: T.mute, fontWeight: 800, letterSpacing: 1, marginBottom: 4 }}>REPAYMENT TERM</div>
                                    <div style={{ fontSize: 18, fontWeight: 900, color: T.text, letterSpacing: "-0.02em" }}>{s.term}</div>
                                </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                <h3 style={{ fontSize: 20, fontWeight: 900, color: T.text, margin: 0, fontFamily: "Outfit", lineHeight: 1.3 }}>{s.foundation}</h3>
                                {(s.link || s.url) && <a href={s.link || s.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 11, color: T.green, textDecoration: "none", padding: "1px 7px", borderRadius: 5, border: `1px solid ${T.green}33`, background: `${T.green}0d`, fontWeight: 600, whiteSpace: "nowrap" }}>990-PF ↗</a>}
                            </div>
                            <div style={{ fontSize: 36, fontWeight: 900, color: T.green, marginBottom: 24, letterSpacing: "-0.04em" }}>{fmt(s.amount)}</div>
                            
                            <div style={{ padding: 20, background: "rgba(255,255,255,0.02)", borderRadius: 16, fontSize: 14, color: T.sub, lineHeight: 1.7, marginBottom: 24, border: `1px solid ${T.glassBorder}` }}>
                                <div style={{ fontSize: 10, color: T.sub, fontWeight: 800, letterSpacing: 1, marginBottom: 10 }}>🎯 PRI STRATEGIC ALIGNMENT</div>
                                <div style={{ color: T.text, fontWeight: 800, marginBottom: 10, fontSize: 15 }}>{s.focus}</div>
                                <span style={{ fontSize: 13, display: "block", fontStyle: "italic", color: T.sub }}>{s.logic}</span>
                            </div>

                            <div style={{ display: "flex", gap: 12, borderTop: `1px solid ${T.glassBorder}`, paddingTop: 24 }}>
                                <Btn variant="primary" style={{ flex: 1 }}>Structure Deal</Btn>
                                {onAdd && (
                                    <TrackBtn onTrack={() => {
                                        onAdd({
                                            id: uid(),
                                            title: s.foundation,
                                            agency: s.foundation,
                                            amount: s.amount,
                                            deadline: "Rolling",
                                            stage: "discovered",
                                            description: `Term: ${s.term}. Rate: ${s.rate}. Focus: ${s.focus}.`,
                                            link: s.link || s.url,
                                            category: "PRI Investment",
                                            createdAt: new Date().toISOString()
                                        });
                                    }} label="+ Track PRI" />
                                )}
                            </div>
                        </Card>
                    ))
                }
            </div>

            <Card style={{ marginTop: 24, background: `linear-gradient(90deg, ${T.green}11, transparent)`, borderColor: T.green + "33", borderLeft: `4px solid ${T.green}` }}>
                <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                    <div style={{ fontSize: 24 }}>📈</div>
                    <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.5 }}>
                        <strong style={{ color: T.text, display: "block", marginBottom: 4 }}>The PRI Opportunity</strong> Program-Related Investments count towards a foundation's mandatory 5% annual payout but are often underutilized. For you, this is "Recoverable Funding" that builds organizational credit.
                    </div>
                </div>
            </Card>
        </div>
    );
};
