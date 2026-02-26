import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn, Stat, TrackBtn, SkeletonCard, Empty } from '../ui';
import { T, uid, PROFILE, saveProfile } from '../globals';
import { API } from '../api';
import { useStore } from '../store';
import { CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

const SourceBadge = ({ source }) => {
    const colors = {
        "Regulations.gov": T.purple,
        "Congress.gov": T.blue,
        "Congress.gov (Preview)": `${T.blue}88`,
        "Regulations.gov (Preview)": `${T.purple}88`
    };
    const c = colors[source] || T.mute;
    return (
        <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 8, background: `${c}18`, color: c, letterSpacing: 0.5 }}>
            {source}
        </span>
    );
};

export const PolicySentinel = ({ onAdd: propOnAdd }) => {
    const { addGrant: storeOnAdd } = useStore();
    const onAdd = propOnAdd || storeOnAdd;
    const [signals, setSignals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all"); // all | positive | negative

    useEffect(() => {
        API.getPolicySignals().then(data => {
            setSignals(Array.isArray(data) ? data : []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const filtered = filter === "all" ? signals : signals.filter(s => s.sentiment === filter);

    const posCount = signals.filter(s => s.sentiment === "positive").length;
    const negCount = signals.filter(s => s.sentiment === "negative").length;
    const sourceBreakdown = {
        regulations: signals.filter(s => s._source?.includes("Regulations")).length,
        congress: signals.filter(s => s._source?.includes("Congress")).length,
    };

    return (
        <div style={{ padding: 20, animation: "fadeIn 0.4s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ fontSize: 24, padding: "8px", background: `${T.purple}11`, borderRadius: "8px" }}>⚖️</div>
                    <div>
                        <h2 style={{ fontSize: 22, fontWeight: 900, color: T.text, margin: 0, fontFamily: "Outfit" }}>Policy Sentinel</h2>
                        <p style={{ color: T.mute, fontSize: 13, marginTop: 2 }}>
                            Live feed from Regulations.gov + Congress.gov — rules, bills &amp; actions affecting your sector.
                        </p>
                    </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                    <Stat label="FAVORABLE" value={posCount} color={T.green} />
                    <Stat label="RISK SIGNALS" value={negCount} color={T.red} />
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>
                {/* ─── Main Feed ─── */}
                <div>
                    {/* Filter pills */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                        {["all", "positive", "negative"].map(f => (
                            <button key={f} onClick={() => setFilter(f)} style={{
                                background: filter === f ? (f === "positive" ? T.green : f === "negative" ? T.red : T.blue) : "rgba(255,255,255,0.04)",
                                color: filter === f ? "#fff" : T.mute,
                                border: "none", borderRadius: 8, padding: "5px 14px", fontSize: 11, fontWeight: 800,
                                cursor: "pointer", letterSpacing: 0.5, textTransform: "uppercase"
                            }}>{f === "all" ? `All (${signals.length})` : f === "positive" ? `✅ Favorable (${posCount})` : `⚠️ Risk (${negCount})`}</button>
                        ))}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        {loading ? <SkeletonCard lines={8} /> :
                            filtered.length === 0 ? <Empty icon="⚖️" title="No Signals" sub="No policy signals match the current filter." /> :
                                filtered.map(s => (
                                    <Card key={s.id} glow style={{ borderLeft: `6px solid ${s.sentiment === "positive" ? T.green : T.red}`, padding: 20 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
                                            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                                                <Badge color={s.sentiment === "positive" ? T.green : T.red} style={{ background: s.sentiment === "positive" ? `${T.green}15` : `${T.red}15`, fontWeight: 800, fontSize: 10 }}>
                                                    {s.sentiment === "positive" ? "✅ FAVORABLE" : "⚠️ RISK"} FORECAST
                                                </Badge>
                                                <SourceBadge source={s._source} />
                                                {s.billNumber && <Badge color={T.amber} style={{ fontSize: 9, fontWeight: 800 }}>{s.billNumber}</Badge>}
                                            </div>
                                            <span style={{ fontSize: 11, color: T.mute, fontWeight: 700 }}>{s.agency?.toUpperCase()} • {s.date}</span>
                                        </div>
                                        <h3 style={{ fontSize: 17, fontWeight: 900, color: T.text, margin: "0 0 12px", fontFamily: "Outfit", lineHeight: 1.4 }}>{s.title}</h3>
                                        <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.7, padding: 16, background: "rgba(255,255,255,0.02)", borderRadius: 12, border: `1px solid ${T.glassBorder}` }}>
                                            {s.description}
                                        </div>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
                                            {(s.tags || []).map(tag => (
                                                <Badge key={tag} color={T.blue} style={{ background: `${T.blue}08`, textTransform: "none", fontSize: 10 }}>#{tag}</Badge>
                                            ))}
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.glassBorder}` }}>
                                            {s.link && (
                                                <a href={s.link} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: T.blue, textDecoration: "none", fontWeight: 700 }}>
                                                    <ExternalLink style={{ width: 11, height: 11 }} /> View Source
                                                </a>
                                            )}
                                            {onAdd && (
                                                <TrackBtn onTrack={() => {
                                                    if (s.tags?.length) {
                                                        const newTags = [...new Set([...(PROFILE.tags || []), ...s.tags])];
                                                        saveProfile({ ...PROFILE, tags: newTags });
                                                    }
                                                    onAdd({
                                                        id: uid(), title: s.title, agency: s.agency, amount: 0,
                                                        deadline: s.date, stage: "discovered",
                                                        description: `Sentiment: ${s.sentiment?.toUpperCase()}. Source: ${s._source}. ${s.description}`,
                                                        category: "Policy Signal",
                                                        meta: { riskScore: s.sentiment === "positive" ? 20 : 80 },
                                                        createdAt: new Date().toISOString()
                                                    });
                                                }} label="+ Track Signal" />
                                            )}
                                        </div>
                                    </Card>
                                ))
                        }
                    </div>
                </div>

                {/* ─── Sidebar ─── */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <Card style={{ background: `${T.blue}08` }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: T.blue, letterSpacing: 1.2, marginBottom: 14 }}>SOURCE BREAKDOWN</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {[
                                { label: "Regulations.gov", count: sourceBreakdown.regulations, color: T.purple },
                                { label: "Congress.gov", count: sourceBreakdown.congress, color: T.blue }
                            ].map(({ label, count, color }) => (
                                <div key={label}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                                        <span style={{ color: T.text }}>{label}</span>
                                        <span style={{ color }}>{count} signals</span>
                                    </div>
                                    <div style={{ height: 4, background: T.border, borderRadius: 2 }}>
                                        <div style={{ height: "100%", width: signals.length ? `${(count / signals.length) * 100}%` : "0%", background: color, borderRadius: 2, transition: "width 0.6s" }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card style={{ background: `linear-gradient(180deg, ${T.green}10, transparent)`, textAlign: "center" }}>
                        <div style={{ fontSize: 36, fontWeight: 900, color: T.green }}>{signals.length}</div>
                        <div style={{ fontSize: 10, color: T.mute, fontWeight: 800, letterSpacing: 1, marginTop: 4 }}>POLICY SIGNALS LIVE</div>
                        <p style={{ fontSize: 12, color: T.sub, marginTop: 10, lineHeight: 1.6 }}>
                            Live feed from Regulations.gov Federal Register + Congress.gov recent bills.
                        </p>
                    </Card>

                    <Card style={{ background: `${T.amber}08`, border: `1px solid ${T.amber}22` }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: T.amber, marginBottom: 8 }}>💡 STRATEGY TIP</div>
                        <p style={{ fontSize: 12, color: T.sub, margin: 0, lineHeight: 1.6 }}>
                            Track "RISK" signals early — agencies often issue RFPs within 90 days of a rule finalization. Add <code>VITE_REGULATIONS_KEY</code> for live Regulations.gov data.
                        </p>
                    </Card>
                </div>
            </div>
        </div>
    );
};
