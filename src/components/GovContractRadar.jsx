import React, { useState } from "react";
import { T, PROFILE, uid, fmt } from "../globals";
import { Card, Btn, Badge, Input, Select, Empty, TrackBtn, SkeletonCard } from "../ui";

export const GovContractRadar = ({ onAdd }) => {
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);

    const mockSearch = () => {
        setLoading(true);
        setTimeout(() => {
            setResults([
                {
                    id: uid(),
                    title: "IT Support Services for Regional Office",
                    agency: "Department of Veterans Affairs",
                    type: "Solicitation",
                    setAside: "Service-Disabled Veteran-Owned Small Business (SDVOSB)",
                    naics: "541512",
                    deadline: "2026-03-15T00:00:00Z",
                    description: "Provide tier 1 and tier 2 IT support services, including hardware troubleshooting, software installation, and network maintenance for the regional office."
                },
                {
                    id: uid(),
                    title: "Software License Renewal - Enterprise Resource Planning",
                    agency: "Department of Defense",
                    type: "Sources Sought",
                    setAside: "Total Small Business Set-Aside (FAR 19.5)",
                    naics: "513210",
                    deadline: "2026-04-01T00:00:00Z",
                    description: "The Government is seeking sources capable of providing software license renewals for the existing enterprise resource planning (ERP) system."
                },
                {
                    id: uid(),
                    title: "Janitorial Services for Courthouse",
                    agency: "General Services Administration",
                    type: "Combined Synopsis/Solicitation",
                    setAside: "Woman-Owned Small Business (WOSB)",
                    naics: "561720",
                    deadline: "2026-02-28T00:00:00Z",
                    description: "Provide comprehensive janitorial and custodial services for the federal courthouse facility, including daily cleaning, trash removal, and floor care."
                }
            ]);
            setLoading(false);
        }, 1200);
    };

    return (
        <div style={{ animation: "fadeIn 0.4s" }}>
            <Card style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
                    <div style={{ fontSize: 24, padding: "8px", background: `${T.blue}11`, borderRadius: "8px" }}>🏛️</div>
                    <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>Gov Contract Radar</div>
                        <div style={{ fontSize: 13, color: T.sub, marginTop: 4 }}>Monitor SAM.gov for direct federal procurement and contracting opportunities.</div>
                    </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                    <Input value={query} onChange={setQuery} placeholder="Search by keywords, NAICS code, or agency..." style={{ flex: 1 }} onKeyDown={e => e.key === "Enter" && mockSearch()} />
                    <Select value="" onChange={() => { }} options={[
                        { value: "", label: "All Set-Asides" },
                        { value: "sba", label: "Small Business" },
                        { value: "wosb", label: "WOSB" },
                        { value: "sdvosb", label: "SDVOSB" },
                        { value: "hubzone", label: "HUBZone" },
                    ]} />
                    <Btn variant="primary" onClick={mockSearch} disabled={loading}>{loading ? "⏳ Searching..." : "🔍 Search Contracts"}</Btn>
                </div>
            </Card>

            {PROFILE.naics && results.length === 0 && !loading && (
                <div style={{ padding: 16, background: `linear-gradient(90deg, ${T.amber}11, transparent)`, borderRadius: 8, border: `1px solid ${T.amber}33`, borderLeft: `4px solid ${T.amber}`, marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ fontSize: 24 }}>🛡️</div>
                    <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.5 }}>
                        <b style={{ color: T.amber, display: "block", marginBottom: 2 }}>Profile Intelligence active</b>
                        Your NAICS code <b>{PROFILE.naics}</b> indicates you provide <b>Custom Computer Programming Services</b>. We can automatically monitor for these contracts.
                    </div>
                </div>
            )}

            {loading && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <SkeletonCard lines={3} />
                    <SkeletonCard lines={3} />
                    <SkeletonCard lines={3} />
                </div>
            )}

            {results.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {results.map(r => (
                        <Card key={r.id} style={{ borderLeft: `4px solid ${T.blue}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <Badge color={T.blue}>{r.type.toUpperCase()}</Badge>
                                    {r.setAside && <Badge color={T.amber}>{r.setAside}</Badge>}
                                </div>
                                <span style={{ fontSize: 12, color: T.red, fontWeight: 700 }}>
                                    DUE: {new Date(r.deadline).toLocaleDateString()}
                                </span>
                            </div>

                            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: 0, marginBottom: 8 }}>{r.title}</h3>
                            <div style={{ fontSize: 13, color: T.sub, marginBottom: 12 }}>
                                <span style={{ fontWeight: 600, color: T.text }}>{r.agency}</span> • NAICS: <span style={{ fontFamily: "monospace", color: T.text }}>{r.naics}</span>
                            </div>

                            <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.6, padding: "12px", background: T.panel, borderRadius: "6px" }}>
                                {r.description}
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
                                <Btn variant="ghost" size="sm">🔗 SAM.gov</Btn>
                                {onAdd && (
                                    <TrackBtn onTrack={() => onAdd({
                                        id: uid(),
                                        title: r.title,
                                        agency: r.agency,
                                        amount: 0,
                                        deadline: r.deadline,
                                        stage: "discovered",
                                        description: `Type: ${r.type}. ${r.description}`,
                                        category: "Federal Contract",
                                        tags: ["federal-contract", r.naics],
                                        createdAt: new Date().toISOString()
                                    })} defaultLabel="+ Track Contract" />
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {results.length === 0 && !loading && (
                <Empty icon="🏛️" title="No Contracts Searched" sub="Search to find active federal solicitations and RFPs matched to your capability statement." />
            )}
        </div>
    );
};
