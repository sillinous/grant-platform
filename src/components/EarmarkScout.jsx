import React, { useState } from "react";
import { T, PROFILE, uid, fmt } from "../globals";
import { Card, Btn, Badge, Input, Select, Empty } from "../ui";

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

            <div style={{ padding: 12, background: T.panel, borderRadius: 8, border: `1px solid ${T.border}`, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>📅</span>
                <div style={{ fontSize: 12, color: T.sub }}>
                    <b>Current Cycle:</b> FY2027 Requests. The window for submitting Community Project Funding requests to your local Representative typically opens in <b>March</b>. Start preparing your 1-pager now.
                </div>
            </div>

            {results.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {results.map(r => (
                        <Card key={r.id} style={{ borderLeft: `3px solid ${r.status === "Enacted" ? T.green : r.status === "Requested" ? T.amber : T.blue}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                        <Badge color={r.status === "Enacted" ? T.green : r.status === "Requested" ? T.amber : T.blue}>{r.status}</Badge>
                                    </div>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 4 }}>{r.title}</div>
                                    <div style={{ fontSize: 12, color: T.sub }}>{r.sponsor} • {r.agency}</div>
                                </div>
                                <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                                    <div style={{ fontSize: 16, fontWeight: 800, color: T.green, background: `${T.green}11`, padding: "6px 12px", borderRadius: "16px" }}>{fmt(r.amount)}</div>
                                    {r.deadline && <div style={{ fontSize: 11, color: T.red, fontWeight: 600, background: `${T.red}11`, padding: "4px 8px", borderRadius: "12px" }}>Due: {new Date(r.deadline).toLocaleDateString()}</div>}
                                </div>
                            </div>

                            <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.6, marginBottom: 16, padding: "12px", background: T.panel, borderRadius: "6px" }}>{r.description}</div>

                            <div style={{ display: "flex", gap: 10, borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
                                {onAdd && (
                                    <Btn size="sm" variant="success" onClick={() => onAdd({
                                        id: uid(), title: r.title, agency: r.agency, stage: "discovered", description: r.description, category: "Earmark", tags: ["earmark", "cds"]
                                    })}>📋 Track Project</Btn>
                                )}
                                <Btn size="sm" variant="ghost">🔗 Rep. Office Guidelines</Btn>
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
