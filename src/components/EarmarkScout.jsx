import React, { useState } from "react";
import { T, PROFILE, uid, fmt } from "../globals";
import { Card, Btn, Badge, Input, Select, Empty, TrackBtn, SkeletonCard } from "../ui";

export const EarmarkScout = ({ onAdd }) => {
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);
    const [filterState, setFilterState] = useState(PROFILE.loc?.split(",").pop()?.trim() || "All");

    const mockSearch = () => {
        setLoading(true);
        setTimeout(() => {
            setResults([
                {
                    id: uid(),
                    title: "Downtown Revitalization Phase II",
                    sponsor: "Sen. John Doe (D-IL)",
                    agency: "Department of Transportation",
                    amount: 2500000,
                    status: "Requested",
                    deadline: "2026-03-01T00:00:00Z",
                    description: "Congressionally Directed Spending request to fund the pedestrian infrastructure and lighting upgrades for the downtown corridor."
                },
                {
                    id: uid(),
                    title: "Community Health Center Expansion",
                    sponsor: "Rep. Jane Smith (R-TX)",
                    agency: "Health Resources and Services Administration",
                    amount: 1200000,
                    status: "Subcommittee Approved",
                    deadline: "2026-04-15T00:00:00Z",
                    description: "Funding to construct a new wing for the regional community health center to increase capacity for underserved patients."
                },
                {
                    id: uid(),
                    title: "Workforce Training Initiative",
                    sponsor: "Sen. Bob Johnson (D-NY)",
                    agency: "Department of Labor",
                    amount: 850000,
                    status: "Enacted",
                    deadline: null,
                    description: "Earmark secured to provide advanced manufacturing training programs in partnership with the local community college."
                }
            ]);
            setLoading(false);
        }, 1200);
    };

    return (
        <div style={{ animation: "fadeIn 0.4s" }}>
            <Card style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
                    <div style={{ fontSize: 24, padding: "8px", background: `${T.blue}11`, borderRadius: "8px" }}>🇺🇸</div>
                    <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>Earmark Scout</div>
                        <div style={{ fontSize: 13, color: T.sub, marginTop: 4 }}>Track Congressionally Directed Spending (CDS) and Community Project Funding requests.</div>
                    </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                    <Input value={query} onChange={setQuery} placeholder="Search projects by keyword, sponsor, or city..." style={{ flex: 1 }} onKeyDown={e => e.key === "Enter" && mockSearch()} />
                    <Select value={filterState} onChange={setFilterState} options={[
                        { value: "All", label: "All States" },
                        { value: "IL", label: "Illinois" },
                        { value: "NY", label: "New York" },
                        { value: "TX", label: "Texas" },
                        { value: "CA", label: "California" }
                    ]} />
                    <Btn variant="primary" onClick={mockSearch} disabled={loading}>{loading ? "⏳ Searching..." : "🔍 Search Earmarks"}</Btn>
                </div>
            </Card>

            <div style={{ padding: 16, background: `linear-gradient(90deg, ${T.purple}11, transparent)`, borderRadius: 8, border: `1px solid ${T.purple}33`, borderLeft: `4px solid ${T.purple}`, marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 24 }}>📅</div>
                <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.5 }}>
                    <b style={{ color: T.purple, display: "block", marginBottom: 2 }}>Current Cycle: FY2027 Requests</b>
                    The window for submitting Community Project Funding requests to your local Representative typically opens in <b>March</b>. Start preparing your 1-pager now.
                </div>
            </div>

            {loading && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <SkeletonCard lines={4} />
                    <SkeletonCard lines={4} />
                    <SkeletonCard lines={4} />
                </div>
            )}

            {results.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {results.map(r => (
                        <Card key={r.id} glow style={{ borderLeft: `6px solid ${r.status === "Enacted" ? T.green : r.status === "Requested" ? T.amber : T.blue}`, padding: 24 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                                        <Badge color={r.status === "Enacted" ? T.green : r.status === "Requested" ? T.amber : T.blue} style={{ background: `${r.status === "Enacted" ? T.green : r.status === "Requested" ? T.amber : T.blue}11` }}>{r.status?.toUpperCase()}</Badge>
                                        <Badge color={T.sub}>FY2027 PROJECT</Badge>
                                    </div>
                                    <div style={{ fontSize: 20, fontWeight: 800, color: T.text, marginBottom: 8, fontFamily: "Outfit" }}>{r.title}</div>
                                    <div style={{ fontSize: 13, color: T.sub, fontWeight: 700 }}>SPONSOR: {r.sponsor?.toUpperCase()} • {r.agency?.toUpperCase()}</div>
                                </div>
                                <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
                                    <div style={{ fontSize: 24, fontWeight: 900, color: T.text, background: "rgba(255,255,255,0.03)", padding: "10px 20px", borderRadius: "14px", border: `1px solid ${T.glassBorder}`, letterSpacing: "-0.02em" }}>{fmt(r.amount)}</div>
                                    {r.deadline && <div style={{ fontSize: 11, color: T.red, fontWeight: 800, letterSpacing: 1, background: `${T.red}08`, padding: "4px 8px", borderRadius: "6px" }}>WINDOW CLOSES: {new Date(r.deadline).toLocaleDateString()}</div>}
                                </div>
                            </div>

                            <div style={{ fontSize: 14, color: T.sub, lineHeight: 1.7, marginBottom: 24, padding: "16px", background: "rgba(255,255,255,0.02)", borderRadius: "12px", border: `1px solid ${T.glassBorder}`, fontStyle: "italic" }}>{r.description}</div>

                            <div style={{ display: "flex", gap: 12, borderTop: `1px solid ${T.glassBorder}`, paddingTop: 20 }}>
                                {onAdd && (
                                    <TrackBtn onTrack={() => onAdd({
                                        id: uid(), title: r.title, agency: r.agency, stage: "discovered", description: r.description, category: "Earmark", createdAt: new Date().toISOString()
                                    })} label="Track CDS Request" />
                                )}
                                <Btn variant="ghost">📄 Rep. Office Interface</Btn>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {results.length === 0 && !loading && (
                <Empty icon="🇺🇸" title="Search Earmark History" sub="Find recent successful earmarks in your state to gauge committee priorities." />
            )}
        </div>
    );
};
