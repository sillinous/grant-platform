import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn, Stat, TrackBtn, SkeletonCard, Empty } from '../ui';
import { T, fmt, uid } from '../globals';
import { API } from '../api';
import { useStore } from '../store';
import { Building2, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';

const SourceTag = ({ source }) => {
    const colors = { "ProPublica": T.purple, "USASpending": "#f59e0b", "ProPublica (Preview)": T.purple };
    const c = colors[source] || T.mute;
    return <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 8, background: `${c}18`, color: c }}>{source}</span>;
};

export const CSRAllianceMapper = ({ onAdd: propOnAdd }) => {
    const { addGrant: storeOnAdd, alliances, setAlliances } = useStore();
    const onAdd = propOnAdd || storeOnAdd;
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(null);
    const [verified, setVerified] = useState({});
    const [filterStatus, setFilterStatus] = useState("all");

    useEffect(() => {
        API.searchCSRPartnerships().then(d => {
            setResults(Array.isArray(d) ? d : []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const verifyCompany = async (name) => {
        setVerifying(name);
        const data = await API.lookupOpenCorporates(name);
        const companies = Array.isArray(data) ? data : data.results || [];
        const match = companies[0];
        setVerified(prev => ({ ...prev, [name]: match || { status: "Not Found", jurisdiction: "N/A" } }));
        setVerifying(null);
    };

    const filtered = filterStatus === "all" ? results : results.filter(r => r.status === filterStatus);
    const openCount = results.filter(r => r.status === "Open").length;
    const totalBudget = results.reduce((sum, r) => sum + (r.budget || 0), 0);

    return (
        <div style={{ padding: 20, animation: "fadeIn 0.4s" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 24, padding: "8px", background: `${T.blue}11`, borderRadius: "8px" }}>🤝</div>
                <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: 22, fontWeight: 900, color: T.text, margin: 0, fontFamily: "Outfit" }}>CSR Alliance Mapper</h2>
                    <p style={{ color: T.mute, fontSize: 13, marginTop: 2 }}>
                        Live scan of ProPublica nonprofit database + USASpending corporate recipients — CSR partnership targets aligned to your focus.
                    </p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                    <Stat label="OPEN" value={openCount} color={T.green} />
                    <Stat label="TOTAL BUDGET" value={fmt(totalBudget)} color={T.blue} />
                </div>
            </div>

            {/* Filter pills */}
            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
                {["all", "Open", "Active", "Closed"].map(s => (
                    <button key={s} onClick={() => setFilterStatus(s)} style={{
                        background: filterStatus === s ? T.blue : "rgba(255,255,255,0.04)",
                        color: filterStatus === s ? "#fff" : T.mute,
                        border: "none", borderRadius: 8, padding: "5px 14px", fontSize: 11,
                        fontWeight: 700, cursor: "pointer", letterSpacing: 0.3
                    }}>{s === "all" ? `All Partners (${results.length})` : s}</button>
                ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {loading ? <div style={{ display: "contents" }}><SkeletonCard lines={6} /><SkeletonCard lines={6} /></div> :
                    filtered.length === 0 ? (
                        <div style={{ gridColumn: "1 / -1" }}>
                            <Empty icon="🤝" title="No Corporate Partners Found" sub="Monitoring CSR initiatives aligned to your focus areas." />
                        </div>
                    ) : filtered.map(r => (
                        <Card key={r.id} glow style={{ borderTop: `5px solid ${T.blue}`, padding: 20 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, alignItems: "flex-start", flexWrap: "wrap", gap: 6 }}>
                                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                                    <Building2 style={{ width: 14, height: 14, color: T.blue }} />
                                    <span style={{ fontWeight: 900, color: T.text, fontSize: 15, fontFamily: "Outfit" }}>{r.company}</span>
                                    <SourceTag source={r._source} />
                                </div>
                                <Badge color={r.status === "Open" ? T.green : r.status === "Active" ? T.blue : T.red}
                                    style={{ background: r.status === "Open" ? `${T.green}12` : r.status === "Active" ? `${T.blue}12` : `${T.red}12`, fontSize: 9, fontWeight: 900 }}>
                                    {r.status?.toUpperCase()}
                                </Badge>
                            </div>

                            <h3 style={{ fontSize: 15, fontWeight: 800, color: T.text, margin: "0 0 10px", fontFamily: "Outfit", lineHeight: 1.4 }}>{r.goal}</h3>
                            <p style={{ fontSize: 13, color: T.sub, margin: "0 0 14px", lineHeight: 1.7, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                {r.description}
                            </p>

                            <div style={{ padding: 12, background: "rgba(255,255,255,0.02)", borderRadius: 10, border: `1px solid ${T.glassBorder}`, marginBottom: 14 }}>
                                <div style={{ fontSize: 9, color: T.sub, fontWeight: 900, letterSpacing: 2, marginBottom: 8 }}>ESG STRATEGIC SYNERGIES</div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                    {(r.synergeticTags || []).map(tag => (
                                        <Badge key={tag} color={T.blue} style={{ background: `${T.blue}0a`, textTransform: "none", fontWeight: 700, fontSize: 10 }}>#{tag}</Badge>
                                    ))}
                                </div>
                            </div>

                            {/* Verification result */}
                            {verified[r.company] && (
                                <div style={{ padding: "8px 10px", background: verified[r.company].status === "Active" ? `${T.green}10` : `${T.amber}10`, borderRadius: 8, fontSize: 11, color: T.sub, marginBottom: 12, display: "flex", gap: 6, alignItems: "center" }}>
                                    {verified[r.company].status === "Active"
                                        ? <CheckCircle style={{ width: 11, height: 11, color: T.green }} />
                                        : <AlertCircle style={{ width: 11, height: 11, color: T.amber }} />}
                                    <span style={{ fontWeight: 800, color: verified[r.company].status === "Active" ? T.green : T.amber }}>
                                        {verified[r.company].status === "Active" ? "Verified Active" : "⚠️ Unverified"}
                                    </span>
                                    <span style={{ color: T.mute }}>{verified[r.company].name || r.company} — {verified[r.company].jurisdiction}</span>
                                </div>
                            )}

                            <div style={{ borderTop: `1px solid ${T.glassBorder}`, paddingTop: 14 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                                    <div>
                                        <div style={{ fontSize: 9, color: T.mute, fontWeight: 800, letterSpacing: 1 }}>EST. CSR BUDGET</div>
                                        <div style={{ fontSize: 22, fontWeight: 900, color: T.green, letterSpacing: "-0.03em" }}>{fmt(r.budget)}</div>
                                    </div>
                                    {r.ein && <Badge color={T.purple} style={{ fontSize: 9, fontWeight: 700 }}>EIN: {r.ein}</Badge>}
                                </div>

                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                    <Btn size="xs" variant="ghost" onClick={() => verifyCompany(r.company)} disabled={verifying === r.company} style={{ border: `1px dashed ${T.blue}` }}>
                                        {verifying === r.company ? "⏳ Verifying…" : "🔎 Verify Corp"}
                                    </Btn>
                                    {alliances?.some(a => a.name === r.company) ? (
                                        <Btn variant="ghost" disabled style={{ color: T.green, fontSize: 11 }}>✓ Alliance Active</Btn>
                                    ) : (
                                        <Btn variant="primary" onClick={() => {
                                            setAlliances([...(alliances || []), {
                                                id: uid(), name: r.company, partners: [],
                                                sharedGoals: r.synergeticTags || [],
                                                activeJointGrants: [],
                                                meta: { verified: !!verified[r.company], verificationData: verified[r.company], source: r._source }
                                            }]);
                                        }} style={{ fontSize: 11, padding: "6px 12px" }}>🤝 Form Alliance</Btn>
                                    )}
                                    {onAdd && (
                                        <TrackBtn onTrack={() => onAdd({
                                            id: uid(), title: r.goal, agency: r.company, amount: r.budget,
                                            deadline: "Rolling", stage: "discovered",
                                            description: `Status: ${r.status}. ${r.description}`,
                                            category: "CSR Alliance", createdAt: new Date().toISOString()
                                        })} label="+ Track" />
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))
                }
            </div>

            <Card style={{ marginTop: 20, background: `linear-gradient(90deg, ${T.blue}0a, transparent)`, borderLeft: `4px solid ${T.blue}` }}>
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <div style={{ fontSize: 22 }}>💡</div>
                    <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.6 }}>
                        <strong style={{ color: T.text, display: "block", marginBottom: 4 }}>PRO-TIP</strong>
                        CSR allocations move 5× faster than federal grants with 90% less overhead. ProPublica data shows nonprofit financials — budget estimates assume ~5% CSR allocation. Use "Verify Corp" to cross-check via OpenCorporates.
                    </div>
                </div>
            </Card>
        </div>
    );
};
