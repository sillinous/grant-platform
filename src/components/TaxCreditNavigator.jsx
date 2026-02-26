import React, { useState, useEffect } from "react";
import { T, PROFILE, uid, fmt } from "../globals";
import { Card, Btn, Badge, Empty, Stat, Progress, SkeletonCard } from "../ui";
import { API } from "../api";
import { useStore } from "../store";
import { ExternalLink, CheckCircle, TrendingUp, AlertCircle } from "lucide-react";

export const TaxCreditNavigator = ({ onAdd: propOnAdd }) => {
    const { addGrant: storeOnAdd } = useStore();
    const onAdd = propOnAdd || storeOnAdd;
    const [loading, setLoading] = useState(false);
    const [hasCalculated, setHasCalculated] = useState(false);
    const [credits, setCredits] = useState([]);
    const [sizeStandard, setSizeStandard] = useState(null);
    const [scanPhase, setScanPhase] = useState("");
    const [filterType, setFilterType] = useState("all"); // "all" | "federal" | "state"

    const calculate = async () => {
        setLoading(true);
        setHasCalculated(false);

        // Progressive scan phases for UX feedback
        setScanPhase("Pulling SBA size standards for your NAICS…");
        await new Promise(r => setTimeout(r, 400));
        setScanPhase("Cross-referencing IRS credit eligibility criteria…");
        await new Promise(r => setTimeout(r, 500));
        setScanPhase("Scoring against your profile tags and focus areas…");
        await new Promise(r => setTimeout(r, 400));
        setScanPhase("Checking IRA & WOTC rural bonus eligibility…");

        const data = await API.getSBAProfileEligibility(PROFILE);

        setCredits(data.eligibleCredits || []);
        setSizeStandard(data.sizeStandard);
        setScanPhase("");
        setLoading(false);
        setHasCalculated(true);
    };

    const filteredCredits = credits.filter(c =>
        filterType === "all" ? true :
            filterType === "state" ? c.isState :
                !c.isState
    );

    const scoreColor = (s) => s >= 85 ? T.green : s >= 70 ? T.amber : T.mute;
    const scoreLabel = (s) => s >= 85 ? "High Match" : s >= 70 ? "Moderate" : "Low Match";

    return (
        <div style={{ animation: "fadeIn 0.4s" }}>
            <Card style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
                    <div style={{ fontSize: 24, padding: "8px", background: `${T.green}11`, borderRadius: "8px" }}>💰</div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>Tax Credit Navigator</div>
                        <div style={{ fontSize: 13, color: T.sub, marginTop: 4 }}>
                            AI-powered eligibility scan: IRS, SBA, DOL, Treasury — scored against your profile.
                        </div>
                    </div>
                    <Btn variant="primary" onClick={calculate} disabled={loading}>
                        {loading ? "⏳ Scanning…" : hasCalculated ? "🔄 Re-Scan" : "🧮 Calculate Eligibility"}
                    </Btn>
                </div>

                {/* Profile summary pills */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {PROFILE.type && <Badge color={T.blue} style={{ fontSize: 10 }}>ORG: {PROFILE.type}</Badge>}
                    {PROFILE.naics && <Badge color={T.indigo} style={{ fontSize: 10, fontFamily: "monospace" }}>NAICS: {PROFILE.naics}</Badge>}
                    {PROFILE.loc && <Badge color={T.purple} style={{ fontSize: 10 }}>📍 {PROFILE.loc}</Badge>}
                    {(PROFILE.tags || []).slice(0, 4).map(t => <Badge key={t} color={T.mute} style={{ fontSize: 9 }}>{t}</Badge>)}
                </div>

                {loading && (
                    <div style={{ marginTop: 16, padding: "14px 18px", background: `${T.green}0a`, borderRadius: 12, border: `1px solid ${T.green}22` }}>
                        <div style={{ fontSize: 13, color: T.green, fontWeight: 700, marginBottom: 8 }}>⚡ {scanPhase}</div>
                        <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
                            <div style={{ height: "100%", background: `linear-gradient(90deg, ${T.green}, ${T.blue})`, width: "100%", animation: "shimmer 1.5s infinite", borderRadius: 4 }} />
                        </div>
                    </div>
                )}
            </Card>

            {hasCalculated && !loading && (
                <>
                    {/* Stats row */}
                    <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                        <Stat label="Total Credits Found" value={credits.length} icon="💰" />
                        <Stat label="High Match (85%+)" value={credits.filter(c => c.matchScore >= 85).length} icon="⭐" />
                        <Stat label="Federal" value={credits.filter(c => !c.isState).length} icon="🏛️" />
                        <Stat label="State-Level" value={credits.filter(c => c.isState).length} icon="🗺️" />
                    </div>

                    {/* SBA size standard card */}
                    {sizeStandard && (
                        <Card style={{ marginBottom: 16, borderLeft: `4px solid ${T.blue}`, background: `${T.blue}0a` }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: T.blue, letterSpacing: 0.5, marginBottom: 4 }}>📏 SBA SIZE STANDARD</div>
                            <div style={{ fontSize: 13, color: T.sub }}>
                                NAICS <b style={{ color: T.text }}>{sizeStandard.naics}</b> — Size limit: <b style={{ color: T.text }}>{sizeStandard.sizeLimit}</b> ({sizeStandard.unit})
                                {" "}→ <b style={{ color: T.green }}>✅ Small Business Eligible</b>
                            </div>
                        </Card>
                    )}

                    {/* Filter row */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                        {["all", "federal", "state"].map(f => (
                            <button key={f} onClick={() => setFilterType(f)} style={{
                                padding: "6px 14px", borderRadius: 20, border: `1px solid ${filterType === f ? T.amber + "66" : T.glassBorder}`,
                                background: filterType === f ? `${T.amber}18` : "transparent",
                                color: filterType === f ? T.amber : T.mute, fontSize: 12, fontWeight: 700, cursor: "pointer"
                            }}>
                                {f === "all" ? "All Credits" : f === "federal" ? "🏛️ Federal" : "🗺️ State"}
                            </button>
                        ))}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {filteredCredits.map(credit => (
                            <Card key={credit.id} glow style={{
                                borderLeft: `5px solid ${scoreColor(credit.matchScore)}`,
                                transition: "transform 0.2s",
                            }}
                                onMouseEnter={e => e.currentTarget.style.transform = "translateX(3px)"}
                                onMouseLeave={e => e.currentTarget.style.transform = "translateX(0)"}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap", alignItems: "center" }}>
                                            <Badge color={scoreColor(credit.matchScore)} style={{ fontSize: 10, fontWeight: 800 }}>
                                                {credit.matchScore}% MATCH
                                            </Badge>
                                            <Badge color={scoreColor(credit.matchScore)} style={{ fontSize: 9, background: `${scoreColor(credit.matchScore)}14` }}>
                                                {scoreLabel(credit.matchScore)}
                                            </Badge>
                                            {credit.isState && <Badge color={T.purple} style={{ fontSize: 9 }}>STATE</Badge>}
                                            {!credit.isState && <Badge color={T.blue} style={{ fontSize: 9 }}>FEDERAL</Badge>}
                                            <span style={{ fontSize: 10, color: T.mute }}>{credit.agency}</span>
                                        </div>

                                        <h3 style={{ fontSize: 16, fontWeight: 800, color: T.text, margin: "0 0 6px", fontFamily: "Outfit", lineHeight: 1.3 }}>{credit.title}</h3>
                                        <p style={{ fontSize: 13, color: T.sub, margin: "0 0 10px", lineHeight: 1.6 }}>✅ {credit.criteria}</p>
                                    </div>
                                    <div style={{ textAlign: "right", minWidth: 160, paddingLeft: 16, flexShrink: 0 }}>
                                        <div style={{ fontSize: 15, fontWeight: 800, color: T.green, lineHeight: 1.3 }}>{credit.amount}</div>
                                        <div style={{ marginTop: 6 }}>
                                            <Progress value={credit.matchScore} max={100} color={scoreColor(credit.matchScore)} />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 12, borderTop: `1px solid ${T.glassBorder}`, marginTop: 4 }}>
                                    {credit.link && (
                                        <Btn variant="ghost" size="sm" onClick={() => window.open(credit.link, "_blank")}>
                                            <ExternalLink style={{ width: 13, height: 13, marginRight: 5 }} />IRS/Agency Guidance
                                        </Btn>
                                    )}
                                    {onAdd && (
                                        <Btn variant="primary" size="sm" onClick={() => onAdd({
                                            id: uid(), title: credit.title, agency: credit.agency,
                                            amount: 0, stage: "researching",
                                            description: `Tax Credit. Criteria: ${credit.criteria}. Benefit: ${credit.amount}`,
                                            category: "Tax Credit", createdAt: new Date().toISOString()
                                        })}>
                                            + Track Credit
                                        </Btn>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                </>
            )}

            {!hasCalculated && !loading && (
                <Card style={{ textAlign: "center", padding: 60 }}>
                    <div style={{ fontSize: 40, marginBottom: 16 }}>💰</div>
                    <div style={{ fontWeight: 700, color: T.text, marginBottom: 8, fontSize: 16 }}>Scan Your Profile for Tax Credits</div>
                    <p style={{ color: T.mute, fontSize: 13, maxWidth: 380, margin: "0 auto 20px" }}>
                        Pulls from IRS (R&D, WOTC, ERTC), Treasury (NMTC, IRA), SBA size standards — scored against your org profile, NAICS code, and impact tags.
                    </p>
                    <Btn variant="primary" onClick={calculate}>🧮 Calculate Eligibility Now</Btn>
                </Card>
            )}
        </div>
    );
};
