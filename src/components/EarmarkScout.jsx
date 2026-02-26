import React, { useState } from "react";
import { T, PROFILE, uid, fmt, fmtDate } from "../globals";
import { Card, Btn, Badge, Input, Empty, TrackBtn, SkeletonCard } from "../ui";
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

const STATUS_COLOR = {
    "Enacted": "#22c55e",
    "Subcommittee Approved": "#f59e0b",
    "Requested": "#3b82f6",
    "In Committee": "#8b5cf6",
    "Failed": "#ef4444"
};

export const EarmarkScout = ({ onAdd: propOnAdd }) => {
    const { addGrant: storeOnAdd, contacts = [] } = useStore();
    const onAdd = propOnAdd || storeOnAdd;
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);
    const [sources, setSources] = useState(null);

    const handleSearch = async () => {
        if (!query.trim()) return;
        setLoading(true);
        setResults([]);
        setSources(null);
        const data = await API.searchAppropriations(query);
        setResults(data.results || []);
        setSources(data.sources);
        setLoading(false);
    };

    // Extract senator/rep contacts from the CRM
    const legislators = contacts.filter(c => ["Senator", "Representative", "Congressman", "Congresswoman"].some(t => c.title?.includes(t)));

    return (
        <div style={{ animation: "fadeIn 0.4s" }}>
            <Card style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
                    <div style={{ fontSize: 24, padding: "8px", background: `${T.purple}11`, borderRadius: "8px" }}>🇺🇸</div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>Earmark Scout</div>
                        <div style={{ fontSize: 13, color: T.sub, marginTop: 4 }}>
                            Tracks Congressionally Directed Spending (CDS) via Congress.gov + USASpending award data.
                        </div>
                    </div>
                </div>

                {legislators.length > 0 && (
                    <div style={{ marginBottom: 12, padding: "10px 14px", background: `${T.purple}11`, borderRadius: 10, border: `1px solid ${T.purple}33`, fontSize: 12, color: T.sub }}>
                        <b style={{ color: T.purple }}>🤝 {legislators.length} Legislator(s) in Your CRM:</b>{" "}
                        {legislators.map(l => l.name).join(", ")} — request earmarks directly.
                    </div>
                )}

                <div style={{ display: "flex", gap: 8 }}>
                    <Input
                        value={query}
                        onChange={e => setQuery(e.target ? e.target.value : e)}
                        placeholder="Search bills, programs, agencies… (e.g. 'infrastructure', 'broadband')"
                        style={{ flex: 1 }}
                        onKeyDown={e => e.key === "Enter" && handleSearch()}
                    />
                    <Btn variant="primary" onClick={handleSearch} disabled={loading}>
                        {loading ? "⏳ Scanning…" : "🔍 Search Earmarks"}
                    </Btn>
                </div>

                {(sources || loading) && (
                    <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
                        <Database style={{ width: 11, height: 11, color: T.mute }} />
                        <span style={{ fontSize: 10, color: T.mute, fontWeight: 700, letterSpacing: 0.5 }}>SOURCES:</span>
                        <SourcePill label="Congress.gov" count={sources?.congress?.count ?? "…"} ok={sources?.congress?.ok} color="#8b5cf6" loading={loading} />
                        <SourcePill label="USASpending" count={sources?.usaSpending?.count ?? "…"} ok={sources?.usaSpending?.ok} color="#f59e0b" loading={loading} />
                        {!loading && results.length > 0 && <span style={{ marginLeft: "auto", fontSize: 10, color: T.mute }}>{results.length} results</span>}
                    </div>
                )}
            </Card>

            {loading && <div style={{ display: "flex", flexDirection: "column", gap: 16 }}><SkeletonCard lines={4} /><SkeletonCard lines={3} /></div>}

            {results.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {results.map(r => {
                        const statusColor = STATUS_COLOR[r.status] || T.mute;
                        const isCDS = r._source === "USASpending";
                        return (
                            <Card key={r.id} glow style={{ borderLeft: `5px solid ${r._sourceColor || T.purple}` }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                        <Badge color={r._sourceColor || T.purple} style={{ fontSize: 9, fontWeight: 800 }}>{r._source}</Badge>
                                        {r.status && (
                                            <Badge color={statusColor} style={{ background: `${statusColor}14`, fontSize: 9, fontWeight: 700 }}>
                                                {r.status}
                                            </Badge>
                                        )}
                                        {r.billNumber && <Badge color={T.mute} style={{ fontSize: 9, fontFamily: "monospace" }}>{r.billNumber}</Badge>}
                                    </div>
                                    {r.amount > 0 && (
                                        <div style={{ fontSize: 20, fontWeight: 800, color: T.green, letterSpacing: "-0.03em" }}>
                                            {fmt(r.amount)}
                                        </div>
                                    )}
                                </div>

                                <h3 style={{ fontSize: 16, fontWeight: 800, color: T.text, margin: "0 0 6px", fontFamily: "Outfit", lineHeight: 1.35 }}>{r.title}</h3>

                                <div style={{ fontSize: 12, color: T.sub, marginBottom: 10, display: "flex", gap: 12, flexWrap: "wrap" }}>
                                    {r.sponsor && <span>🏛️ <b style={{ color: T.text }}>{r.sponsor}</b></span>}
                                    {r.agency && <span>📋 {r.agency}</span>}
                                    {(r.latestAction || r.startDate) && <span>📅 {r.latestAction || r.startDate}</span>}
                                </div>

                                {r.description && (
                                    <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.6, marginBottom: 12 }}>
                                        {r.description.slice(0, 240)}{r.description.length > 240 ? "…" : ""}
                                    </div>
                                )}

                                {isCDS && (
                                    <div style={{ fontSize: 11, color: T.amber, marginBottom: 12, padding: "8px 12px", background: `${T.amber}0d`, borderRadius: 8, border: `1px solid ${T.amber}33` }}>
                                        💡 This is a recent CDS-adjacent award. Contact the sponsoring agency for sub-award or follow-on earmark opportunities.
                                    </div>
                                )}

                                {onAdd && r.amount > 0 && (
                                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                        <TrackBtn onTrack={() => onAdd({
                                            id: uid(), title: r.title, agency: r.agency || r.sponsor,
                                            amount: r.amount, stage: "discovered",
                                            description: `Congressional ${isCDS ? "CDS Award" : "Bill"}: ${r.status || ""}. ${r.description || ""}`.slice(0, 500),
                                            category: "Earmark/CDS", createdAt: new Date().toISOString()
                                        })} label="+ Track Earmark" />
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}

            {results.length === 0 && !loading && (
                <Empty icon="🇺🇸" title="No Earmarks Searched" sub="Search Congress.gov bills and USASpending CDS awards simultaneously. Try keywords like 'broadband', 'workforce', or 'health center'." />
            )}
        </div>
    );
};
