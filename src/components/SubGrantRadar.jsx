import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn, Input, TrackBtn, SkeletonCard, Empty } from '../ui';
import { T, uid, fmt, PROFILE } from '../globals';
import { API } from '../api';
import { useStore } from '../store';
import { Database, CheckCircle, AlertCircle } from 'lucide-react';
import { OpportunityDrawer } from "./OpportunityDrawer";

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

export const SubGrantRadar = ({ onAdd: propOnAdd }) => {
    const { addGrant: storeOnAdd, grants = [], alliances = [] } = useStore();
    const onAdd = propOnAdd || storeOnAdd;
    const [query, setQuery] = useState(() => {
        // Default to profile focus keywords as an initial search
        return (PROFILE.focus || ["workforce", "technology", "community"])[0] || "workforce";
    });
    const [data, setData] = useState([]);
    const [selectedGrant, setSelectedGrant] = useState(null);
    const [regAlerts, setRegAlerts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sources, setSources] = useState(null);
    const [autoLoaded, setAutoLoaded] = useState(false);

    // Auto-search on mount using profile focus
    useEffect(() => {
        if (!autoLoaded) {
            setAutoLoaded(true);
            handleSearch(query);
        }
    }, []);

    const handleSearch = async (q = query) => {
        if (!q.trim()) return;
        setLoading(true);
        setData([]);
        setSources(null);

        // Fan out: large prime awards from USASpending + regulation alerts
        const [primeResult, grantsResult, regResult] = await Promise.allSettled([
            // Large prime grants that could have sub-award opportunities
            fetch("https://api.usaspending.gov/api/v2/search/spending_by_award/", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    filters: {
                        keywords: [q],
                        award_type_codes: ["02", "03", "04", "05"],
                        award_amounts: [{ lower_bound: 1000000 }] // Prime awards $1M+
                    },
                    fields: ["Award ID", "Recipient Name", "Award Amount", "Awarding Agency", "Description", "End Date", "Place of Performance State Code"],
                    limit: 8, page: 1, sort: "Award Amount", order: "desc"
                }),
                signal: AbortSignal.timeout(9000)
            }).then(r => r.ok ? r.json() : { results: [] }).catch(() => ({ results: [] })),

            // Also search Grants.gov for posted opportunities with sub-award language
            fetch("https://apply07.grants.gov/grantsws/rest/opportunities/search", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ keyword: q + " sub-award", oppStatuses: "forecasted|posted", rows: 5 }),
                signal: AbortSignal.timeout(8000)
            }).then(r => r.ok ? r.json() : { oppHits: [] }).catch(() => ({ oppHits: [] })),

            // Regulation alerts for this sector
            API.searchRegulations(grants?.[0]?.title || q).catch(() => ({ data: [] }))
        ]);

        // Sub-award opportunity estimation: USASpending prime awards
        const primeAwards = (primeResult.value?.results || []).map(r => ({
            id: uid(),
            title: r["Award ID"] ? `[Prime Award] ${r["Recipient Name"] || r["Award ID"]}` : "Prime Federal Award",
            prime: r["Awarding Agency"] || "Federal Agency",
            recipient: r["Recipient Name"] || "Large Prime Recipient",
            amount: r["Award Amount"] || 0,
            subGrantAlloc: Math.round((r["Award Amount"] || 0) * 0.15), // 15% typical sub-award floor
            description: r["Description"] || `Large-scale federal award in the ${q} sector. Prime recipients often required to sub-contract local partners.`,
            status: "Subaward Eligible",
            state: r["Place of Performance State Code"] || "",
            requirement: `Awards over $${((r["Award Amount"] || 0) / 1000000).toFixed(1)}M often require community partnership clauses (2 CFR 200, 15% local sub-award floor).`,
            _source: "USASpending"
        }));

        const grantsHits = (grantsResult.value?.oppHits || []).map(g => ({
            id: uid(),
            title: g.oppTitle || g.title || "Federal Opportunity",
            prime: g.agencyName || "Federal Agency",
            recipient: "Open Competition",
            amount: g.awardCeiling || 0,
            subGrantAlloc: g.awardCeiling || 0, // These are direct opportunities
            description: g.synopsisDesc || "",
            status: "Active Solicitation",
            requirement: g.synopsisDesc?.slice(0, 200) || "See Grants.gov for partnership requirements.",
            _source: "Grants.gov",
            deadline: g.closeDate
        }));

        const combined = [...primeAwards, ...grantsHits];
        setData(combined);
        setSources({
            usaSpending: { count: primeAwards.length, ok: primeResult.status === "fulfilled" },
            grantsGov: { count: grantsHits.length, ok: grantsResult.status === "fulfilled" }
        });

        if (regResult.value && !regResult.value._error) {
            setRegAlerts(regResult.value.data?.slice(0, 2) || []);
        }
        setLoading(false);
    };

    return (
        <div style={{ padding: 20, animation: "fadeIn 0.4s" }}>
            {selectedGrant && <OpportunityDrawer grant={selectedGrant} onClose={() => setSelectedGrant(null)} onAdd={onAdd} isTracked={false} />}
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 24, padding: "8px", background: `${T.amber}11`, borderRadius: "8px" }}>🛰️</div>
                <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: 22, fontWeight: 900, color: T.text, margin: 0, fontFamily: "Outfit" }}>Sub-Grant Radar</h2>
                    <p style={{ color: T.mute, fontSize: 13, marginTop: 4 }}>
                        Real-time scan of USASpending prime awards ($1M+) and Grants.gov sub-award opportunities.
                    </p>
                </div>
            </div>

            {/* Search bar */}
            <Card style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", gap: 8 }}>
                    <Input
                        value={query}
                        onChange={v => setQuery(v)}
                        placeholder="Search sector for prime awards with sub-grant potential…"
                        style={{ flex: 1 }}
                        onKeyDown={e => e.key === "Enter" && handleSearch()}
                    />
                    <Btn variant="primary" onClick={() => handleSearch()} disabled={loading}>
                        {loading ? "⏳ Scanning…" : "🛰️ Scan"}
                    </Btn>
                </div>
                {(sources || loading) && (
                    <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
                        <Database style={{ width: 11, height: 11, color: T.mute }} />
                        <span style={{ fontSize: 10, color: T.mute, fontWeight: 700, letterSpacing: 0.5 }}>SOURCES:</span>
                        <SourcePill label="USASpending" count={sources?.usaSpending?.count ?? "…"} ok={sources?.usaSpending?.ok} color="#f59e0b" loading={loading} />
                        <SourcePill label="Grants.gov" count={sources?.grantsGov?.count ?? "…"} ok={sources?.grantsGov?.ok} color="#22c55e" loading={loading} />
                        {!loading && data.length > 0 && <span style={{ marginLeft: "auto", fontSize: 10, color: T.mute }}>{data.length} prime awards with sub-potential</span>}
                    </div>
                )}
            </Card>

            {/* Regulation alerts */}
            {regAlerts.length > 0 && (
                <Card style={{ background: `${T.red}0d`, border: `1px solid ${T.red}22`, marginBottom: 20 }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <div style={{ fontSize: 20 }}>⚖️</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: T.red }}>ACTIVE RULEMAKING ALERT</div>
                            <div style={{ fontSize: 11, color: T.sub }}>New federal regulations that may affect compliance in this sector:</div>
                            {regAlerts.map((alert, i) => (
                                <div key={i} style={{ fontSize: 11, color: T.text, fontWeight: 600, marginTop: 4 }}>• {alert.attributes?.title}</div>
                            ))}
                        </div>
                        <Btn size="xs" variant="ghost" style={{ color: T.red }}>View Regs</Btn>
                    </div>
                </Card>
            )}

            {loading && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <SkeletonCard lines={5} /><SkeletonCard lines={5} />
                </div>
            )}

            {!loading && data.length === 0 && (
                <Empty icon="🛰️" title="No Prime Awards Found" sub="Search for a funding sector to find large federal awards with sub-grant potential. Try 'workforce', 'broadband', or 'health'." />
            )}

            {!loading && data.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                    {data.map(item => {
                        const isAlliance = alliances.some(a => a.name?.toLowerCase().includes(item.prime?.toLowerCase()));
                        const isHistorical = item._source === "USASpending";
                        return (
                            <Card key={item.id} glow style={{ borderTop: `5px solid ${item._source === "USASpending" ? T.amber : T.green}`, position: "relative", cursor: "pointer" }} onClick={() => setSelectedGrant(item)}>
                                {isAlliance && (
                                    <div style={{ position: "absolute", top: -12, left: 16 }}>
                                        <Badge color={T.purple} style={{ fontWeight: 900, boxShadow: `0 4px 12px ${T.purple}44` }}>🤝 ALLIANCE TARGET</Badge>
                                    </div>
                                )}

                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, alignItems: "flex-start", marginTop: isAlliance ? 10 : 0 }}>
                                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                        <Badge color={item._source === "USASpending" ? T.amber : T.green} style={{ fontSize: 9, fontWeight: 800 }}>{item._source}</Badge>
                                        <Badge color={item.status === "Active Solicitation" ? T.green : T.amber} style={{ fontSize: 9 }}>{item.status}</Badge>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <div style={{ fontSize: 10, color: T.mute, fontWeight: 800, letterSpacing: 1 }}>
                                            {isHistorical ? "SUB-ALLOC EST." : "AWARD"}
                                        </div>
                                        <div style={{ fontSize: 20, fontWeight: 900, color: T.green, letterSpacing: "-0.03em" }}>
                                            {fmt(isHistorical ? item.subGrantAlloc : item.amount)}
                                        </div>
                                    </div>
                                </div>

                                <h3 style={{ fontSize: 15, fontWeight: 800, color: T.text, margin: "0 0 14px", fontFamily: "Outfit", lineHeight: 1.35 }}>
                                    {item.title}
                                </h3>

                                <div style={{ padding: 14, background: "rgba(255,255,255,0.02)", borderRadius: 12, marginBottom: 14, border: `1px solid ${T.glassBorder}`, fontSize: 12 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                        <span style={{ color: T.mute, fontWeight: 800 }}>PRIME FUNDER</span>
                                        <span style={{ color: T.text, fontWeight: 700 }}>{item.prime}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span style={{ color: T.mute, fontWeight: 800 }}>PRIME RECIPIENT</span>
                                        <span style={{ color: T.blue, fontWeight: 700 }}>{item.recipient}</span>
                                    </div>
                                </div>

                                <div style={{ padding: 14, background: `${T.green}08`, borderLeft: `4px solid ${T.green}`, borderRadius: 10, fontSize: 13, color: T.sub, marginBottom: 14, lineHeight: 1.6 }}>
                                    <strong style={{ color: T.text, fontWeight: 800, display: "block", marginBottom: 6, fontSize: 10, letterSpacing: 1 }}>PARTNERSHIP OPPORTUNITY</strong>
                                    {item.requirement?.slice(0, 200)}
                                </div>

                                {onAdd && (
                                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", borderTop: `1px solid ${T.glassBorder}`, paddingTop: 12 }}>
                                        <TrackBtn onTrack={() => onAdd({
                                            id: uid(), title: item.title, agency: item.prime,
                                            amount: isHistorical ? item.subGrantAlloc : item.amount,
                                            deadline: item.deadline || "Rolling", stage: "discovered",
                                            description: `Prime: ${item.recipient}. ${item.requirement}`.slice(0, 500),
                                            category: "Sub-Grant", createdAt: new Date().toISOString()
                                        })} defaultLabel="+ Track" />
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
