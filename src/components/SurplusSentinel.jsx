import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn, Progress, TrackBtn, SkeletonCard, Empty, Stat } from '../ui';
import { T, fmt, daysUntil, uid, PROFILE } from '../globals';
import { API } from '../api';
import { useStore } from '../store';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';

const urgencyColor = (daysLeft) => {
    if (daysLeft <= 14) return T.red;
    if (daysLeft <= 30) return T.amber;
    return T.green;
};

const SourceTag = ({ source }) => {
    const colors = { "HUD": T.blue, "DOL": T.purple, "Treasury": T.amber, "USASpending": "#f59e0b", "Grants.gov": T.green };
    const c = colors[source] || T.mute;
    return <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 8, background: `${c}18`, color: c }}>{source}</span>;
};

export const SurplusSentinel = ({ onAdd: propOnAdd }) => {
    const { addGrant: storeOnAdd, alliances = [] } = useStore();
    const onAdd = propOnAdd || storeOnAdd;
    const [signals, setSignals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState("urgency"); // urgency | amount

    useEffect(() => {
        API.getSurplusSignals().then(d => {
            setSignals(Array.isArray(d) ? d : []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const sorted = [...signals].sort((a, b) => {
        if (sortBy === "urgency") return daysUntil(a.eofy) - daysUntil(b.eofy);
        return (b.surplus || 0) - (a.surplus || 0);
    });

    const totalSurplus = signals.reduce((sum, s) => sum + (s.surplus || 0), 0);
    const criticalCount = signals.filter(s => daysUntil(s.eofy) <= 30).length;

    return (
        <div style={{ padding: 20, animation: "fadeIn 0.4s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ fontSize: 24, padding: "8px", background: `${T.red}11`, borderRadius: "8px" }}>⏳</div>
                    <div>
                        <h2 style={{ fontSize: 22, fontWeight: 900, color: T.text, margin: 0, fontFamily: "Outfit" }}>Surplus Sentinel</h2>
                        <p style={{ color: T.mute, fontSize: 13, marginTop: 2 }}>
                            Live scan of "use-it-or-lose-it" federal &amp; state budget surplus — USASpending + Grants.gov.
                        </p>
                    </div>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    {criticalCount > 0 && <Badge color={T.red} style={{ fontWeight: 900, fontSize: 11 }}>🔴 {criticalCount} CRITICAL</Badge>}
                    <Stat label="TOTAL SURPLUS" value={fmt(totalSurplus)} color={T.green} />
                </div>
            </div>

            {/* Sort controls */}
            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
                {[["urgency", "⚡ By Urgency"], ["amount", "💰 By Amount"]].map(([val, label]) => (
                    <button key={val} onClick={() => setSortBy(val)} style={{
                        background: sortBy === val ? T.red : "rgba(255,255,255,0.04)",
                        color: sortBy === val ? "#fff" : T.mute,
                        border: "none", borderRadius: 8, padding: "5px 14px", fontSize: 11,
                        fontWeight: 700, cursor: "pointer"
                    }}>{label}</button>
                ))}
            </div>

            {loading && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                    <SkeletonCard lines={6} /><SkeletonCard lines={6} />
                </div>
            )}
            {!loading && signals.length === 0 && (
                <Empty icon="⏳" title="No Surplus Signals" sub="No active surplus detected for your region. Check back at fiscal year-end." />
            )}

            {!loading && signals.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                    {sorted.map(s => {
                        const daysLeft = daysUntil(s.eofy);
                        const urgency = urgencyColor(daysLeft);
                        const progress = Math.min(100, Math.max(0, ((180 - daysLeft) / 180) * 100));
                        const isLocal = PROFILE.loc?.toLowerCase().includes(s.jurisdiction?.toLowerCase().split(" ")[0]);
                        const isAlliance = alliances.some(a => a.name?.toLowerCase().includes(s.jurisdiction?.toLowerCase()));

                        return (
                            <Card key={s.id} glow style={{ borderTop: `5px solid ${urgency}`, position: "relative" }}>
                                {/* Badges */}
                                <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
                                    <SourceTag source={s._source} />
                                    {isLocal && <Badge color={T.green} style={{ fontSize: 9, fontWeight: 900 }}>📍 LOCAL</Badge>}
                                    {isAlliance && <Badge color={T.purple} style={{ fontSize: 9, fontWeight: 900 }}>🤝 ALLIANCE</Badge>}
                                    {daysLeft <= 14 && <Badge color={T.red} style={{ fontSize: 9, fontWeight: 900 }}>🔴 CRITICAL</Badge>}
                                    {(s.link || s.url) && <a href={s.link || s.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 10, color: "#f59e0b", textDecoration: "none", padding: "1px 7px", borderRadius: 5, border: "1px solid #f59e0b33", background: "#f59e0b0d", fontWeight: 700 }}>View Award ↗</a>}
                                </div>

                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, alignItems: "flex-start" }}>
                                    <div>
                                        <div style={{ fontSize: 10, color: T.mute, textTransform: "uppercase", letterSpacing: 2, fontWeight: 900, marginBottom: 4 }}>
                                            {s.budgetPool?.toUpperCase()}
                                        </div>
                                        <div style={{ fontSize: 17, fontWeight: 900, color: T.text, fontFamily: "Outfit", lineHeight: 1.2 }}>{s.jurisdiction}</div>
                                    </div>
                                    <div style={{ fontSize: 22, fontWeight: 900, color: T.green, letterSpacing: "-0.03em" }}>{fmt(s.surplus)}</div>
                                </div>

                                <div style={{ fontSize: 13, color: T.text, fontWeight: 700, padding: 12, background: `${urgency}08`, borderRadius: 10, borderLeft: `4px solid ${urgency}`, marginBottom: 16, lineHeight: 1.6 }}>
                                    <AlertTriangle style={{ width: 12, height: 12, display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                                    {s.alert}
                                </div>

                                <div style={{ padding: 14, background: "rgba(255,255,255,0.02)", borderRadius: 12, border: `1px solid ${T.glassBorder}`, marginBottom: 14 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.mute, marginBottom: 8, fontWeight: 900 }}>
                                        <span>FISCAL DEADLINE</span>
                                        <span style={{ color: urgency }}>{daysLeft} DAYS LEFT</span>
                                    </div>
                                    <Progress value={progress} max={100} color={urgency} height={8} />
                                    <div style={{ fontSize: 10, color: T.mute, marginTop: 4 }}>{s.eofy}</div>
                                </div>

                                {onAdd && (
                                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", borderTop: `1px solid ${T.glassBorder}`, paddingTop: 12 }}>
                                        <TrackBtn onTrack={() => onAdd({
                                            id: uid(), title: `${s.jurisdiction} — ${s.budgetPool} Surplus`,
                                            agency: s.jurisdiction, amount: s.surplus, deadline: s.eofy,
                                            stage: "discovered", description: s.alert,
                                            category: "Surplus Fund",
                                            meta: { riskScore: daysLeft < 30 ? 80 : 40, alignmentScore: isLocal ? 95 : 60 },
                                            createdAt: new Date().toISOString()
                                        })} defaultLabel="+ Track Pool" />
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
