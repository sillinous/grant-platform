import React, { useState } from "react";
import { T, PROFILE, uid, fmt, fmtDate } from "../globals";
import { Card, Btn, Badge, Input, Select, Empty, TrackBtn, SkeletonCard } from "../ui";
import { API } from "../api";
import { useStore } from "../store";
import { CheckCircle, AlertCircle, Database } from "lucide-react";

const SourcePill = ({ label, count, ok, color, loading }) => (
    <div style={{
        display: "flex", alignItems: "center", gap: 5, padding: "4px 10px",
        borderRadius: 20, background: ok ? `${color}18` : "rgba(255,255,255,0.04)",
        border: `1px solid ${ok ? color + "44" : "rgba(255,255,255,0.08)"}`,
        fontSize: 10, fontWeight: 700, color: ok ? color : T.mute,
    }}>
        {loading ? "⏳" : ok ? <CheckCircle style={{ width: 9, height: 9 }} /> : <AlertCircle style={{ width: 9, height: 9 }} />}
        {label}
        {!loading && <span style={{ background: ok ? `${color}33` : "rgba(255,255,255,0.08)", borderRadius: 8, padding: "1px 5px" }}>{count}</span>}
    </div>
);

export const GovContractRadar = ({ onAdd: propOnAdd }) => {
    const { addGrant: storeOnAdd, alliances = [] } = useStore();
    const onAdd = propOnAdd || storeOnAdd;
    const [query, setQuery] = useState("");
    const [setAside, setSetAside] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);
    const [sources, setSources] = useState(null);

    const handleSearch = async () => {
        if (!query.trim()) return;
        setLoading(true);
        setResults([]);
        setSources(null);
        const data = await API.searchSAMOpportunities(query, setAside);
        setResults(data.results || []);
        setSources(data.sources);
        setLoading(false);
    };

    return (
        <div style={{ animation: "fadeIn 0.4s" }}>
            <Card style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
                    <div style={{ fontSize: 24, padding: "8px", background: `${T.blue}11`, borderRadius: "8px" }}>🏛️</div>
                    <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>Gov Contract Radar</div>
                        <div style={{ fontSize: 13, color: T.sub, marginTop: 4 }}>Live SAM.gov solicitations + USASpending contract award intelligence.</div>
                    </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                    <Input
                        value={query}
                        onChange={e => setQuery(e.target ? e.target.value : e)}
                        placeholder="Search by keywords, NAICS code, or agency…"
                        style={{ flex: 1 }}
                        onKeyDown={e => e.key === "Enter" && handleSearch()}
                    />
                    <Select
                        value={setAside}
                        onChange={e => setSetAside(e.target ? e.target.value : e)}
                        options={[
                            { value: "", label: "All Set-Asides" },
                            { value: "sba", label: "Small Business" },
                            { value: "wosb", label: "WOSB" },
                            { value: "sdvosb", label: "SDVOSB" },
                            { value: "8a", label: "8(a)" },
                            { value: "hubzone", label: "HUBZone" },
                            { value: "vosb", label: "VOSB" },
                        ]}
                    />
                    <Btn variant="primary" onClick={handleSearch} disabled={loading}>
                        {loading ? "⏳ Scanning…" : "🔍 Search Contracts"}
                    </Btn>
                </div>

                {/* Source status */}
                {(sources || loading) && (
                    <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
                        <Database style={{ width: 11, height: 11, color: T.mute }} />
                        <span style={{ fontSize: 10, color: T.mute, fontWeight: 700, letterSpacing: 0.5 }}>SOURCES:</span>
                        <SourcePill label="SAM.gov" count={sources?.sam?.count ?? "…"} ok={sources?.sam?.ok} color="#3b82f6" loading={loading} />
                        <SourcePill label="USASpending" count={sources?.usaSpending?.count ?? "…"} ok={sources?.usaSpending?.ok} color="#f59e0b" loading={loading} />
                        {!loading && results.length > 0 && <span style={{ marginLeft: "auto", fontSize: 10, color: T.mute }}>{results.length} opportunities</span>}
                    </div>
                )}
            </Card>

            {/* Profile hint */}
            {PROFILE.naics && results.length === 0 && !loading && (
                <div style={{ padding: 16, background: `linear-gradient(90deg, ${T.amber}11, transparent)`, borderRadius: 8, border: `1px solid ${T.amber}33`, borderLeft: `4px solid ${T.amber}`, marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ fontSize: 24 }}>🛡️</div>
                    <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.5 }}>
                        <b style={{ color: T.amber, display: "block", marginBottom: 2 }}>Profile Intelligence active</b>
                        Your NAICS code <b>{PROFILE.naics}</b> is pre-loaded. Search to find active solicitations, or type a keyword to see USASpending contract award data for your sector.
                    </div>
                </div>
            )}

            {loading && <div style={{ display: "flex", flexDirection: "column", gap: 16 }}><SkeletonCard lines={4} /><SkeletonCard lines={4} /></div>}

            {results.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {results.map(r => {
                        const isAlliance = alliances.some(a => a.name?.toLowerCase().includes(r.agency?.toLowerCase()));
                        const isHistory = r._source === "USASpending";
                        return (
                            <Card key={r.id} glow style={{ borderLeft: `5px solid ${r._sourceColor || T.blue}`, padding: 22, position: "relative" }}>
                                {isAlliance && (
                                    <div style={{ position: "absolute", top: -12, left: 16 }}>
                                        <Badge color={T.purple} style={{ fontWeight: 900, boxShadow: `0 4px 12px ${T.purple}44` }}>🤝 ALLIANCE AGENCY</Badge>
                                    </div>
                                )}
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, alignItems: "flex-start", marginTop: isAlliance ? 10 : 0 }}>
                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                        <Badge color={r._sourceColor || T.blue} style={{ fontSize: 9, fontWeight: 800 }}>{r._source}</Badge>
                                        {r.type && <Badge color={T.blue} style={{ background: `${T.blue}11`, fontSize: 9 }}>{r.type.toUpperCase()}</Badge>}
                                        {r.setAside && <Badge color={T.amber} style={{ background: `${T.amber}11`, fontSize: 9 }}>{r.setAside}</Badge>}
                                        {isHistory && <Badge color={T.orange} style={{ fontSize: 9 }}>📊 HISTORICAL AWARD</Badge>}
                                    </div>
                                    {r.deadline && !isHistory && (
                                        <div style={{ fontSize: 11, color: T.red, fontWeight: 800, letterSpacing: 1, background: `${T.red}08`, padding: "4px 8px", borderRadius: 6, flexShrink: 0 }}>
                                            ⏰ {typeof r.deadline === "string" ? r.deadline.slice(0, 10) : fmtDate(r.deadline)}
                                        </div>
                                    )}
                                </div>

                                <h3 style={{ fontSize: 17, fontWeight: 800, color: T.text, margin: "0 0 6px", fontFamily: "Outfit", lineHeight: 1.3 }}>{r.title}</h3>
                                <div style={{ fontSize: 12, color: T.sub, marginBottom: 14, fontWeight: 700, display: "flex", gap: 12, flexWrap: "wrap" }}>
                                    {r.agency && <span><b style={{ color: T.text }}>{r.agency}</b></span>}
                                    {r.naics && <span>NAICS: <span style={{ fontFamily: "monospace", color: T.text }}>{r.naics}</span></span>}
                                    {r.solicitationNumber && <span style={{ fontFamily: "monospace", color: T.mute, fontSize: 10 }}>{r.solicitationNumber}</span>}
                                    {r.amount > 0 && <span style={{ color: T.green, fontWeight: 800 }}>${r.amount.toLocaleString()}</span>}
                                </div>

                                {r.description && (
                                    <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.6, padding: "16px", background: "rgba(255,255,255,0.02)", borderRadius: "10px", border: `1px solid ${T.glassBorder}`, marginBottom: 16 }}>
                                        {r.description.slice(0, 280)}{r.description.length > 280 ? "…" : ""}
                                    </div>
                                )}

                                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, borderTop: `1px solid ${T.glassBorder}`, paddingTop: 14 }}>
                                    {r.link && <Btn variant="ghost" size="sm" onClick={() => window.open(r.link, "_blank")}>🔗 SAM.GOV</Btn>}
                                    {onAdd && (
                                        <TrackBtn onTrack={() => onAdd({
                                            id: uid(), title: r.title, agency: r.agency, amount: r.amount || 0,
                                            deadline: r.deadline, stage: "discovered",
                                            description: `Type: ${r.type}. ${r.description}`.slice(0, 500),
                                            category: "Federal Contract",
                                            meta: { riskScore: 75, alignmentScore: isAlliance ? 90 : 65 },
                                            compliance: { matchingFundsRequired: false, reportingFrequency: "Monthly Sub-Contractor Flowdown" },
                                            createdAt: new Date().toISOString()
                                        })} label="+ Track Contract" />
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {results.length === 0 && !loading && (
                <Empty icon="🏛️" title="No Contracts Searched" sub="Search SAM.gov + USASpending simultaneously to find active solicitations, historical awards, and set-aside opportunities matched to your profile." />
            )}
        </div>
    );
};
