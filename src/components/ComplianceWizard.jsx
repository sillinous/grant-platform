import React, { useState } from "react";
import { T, uid } from "../globals";
import { Tab, Input, Select, Card, Badge, Btn, Progress } from "../ui";
import { API } from "../api";

const ComplianceGauge = ({ value, label, color }) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <div style={{ position: "relative", width: 80, height: 80 }}>
            <svg width="80" height="80" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="36" fill="none" stroke={T.border} strokeWidth="6" opacity="0.3" />
                <circle
                    cx="40" cy="40" r="36" fill="none" stroke={color}
                    strokeWidth="6" strokeDasharray={`${2 * Math.PI * 36}`}
                    strokeDashoffset={`${2 * Math.PI * 36 * (1 - value / 100)}`}
                    strokeLinecap="round" transform="rotate(-90 40 40)"
                    style={{ transition: "stroke-dashoffset 1s ease-out" }}
                />
            </svg>
            <div style={{
                position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, fontWeight: 900, color: T.text
            }}>
                {value}%
            </div>
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, textTransform: "uppercase", textAlign: "center" }}>{label}</div>
    </div>
);

export const ComplianceWizard = ({ grants }) => {
    const [loading, setLoading] = useState(false);
    const [crosswalk, setCrosswalk] = useState(null);
    const [selectedGrant, setSelectedGrant] = useState(null);

    const runCrossWalk = async (grant) => {
        setLoading(true);
        setSelectedGrant(grant);
        
        // Simulating delay for "Scanning" effect
        await new Promise(r => setTimeout(r, 1500));

        const sys = `You are a compliance architect. Your task is to perform a "Unified Cross-Walk" between Federal (2 CFR 200) standards and localized State/Local requirements. 
        Identify which documents satisfy multiple tiers of oversight.
        
        RESPOND IN JSON: {"mappings":[{"requirement":"...","federal":"...","local":"...","status":"aligned|drift|missing","notes":"..."}]}`;
        
        const content = `Target Grant: ${grant.title}
        Agency: ${grant.agency}
        Tier: ${grant.type || "Federal"}`;

        const result = await API.callAI([{ role: "user", content }], sys);
        if (!result.error) {
            try {
                const cleaned = result.text.replace(/```json\n?|```/g, "").trim();
                setCrosswalk(JSON.parse(cleaned));
            } catch { setCrosswalk(null); }
        }
        setLoading(false);
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Header */}
            <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                background: `linear-gradient(90deg, ${T.panel}, ${T.bg})`,
                padding: "20px 24px", borderRadius: 16, border: `1px solid ${T.border}`
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: 12, background: `${T.blue}22`,
                        border: `1px solid ${T.blue}44`, display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 24, boxShadow: `0 0 15px ${T.blue}22`
                    }}>
                        🛡️
                    </div>
                    <div>
                        <h2 style={{ fontSize: 20, fontWeight: 900, color: T.text, margin: 0, letterSpacing: -0.5 }}>Unified Compliance Shield</h2>
                        <div style={{ fontSize: 13, color: T.sub, fontWeight: 500 }}>AI-Driven Regulatory Alignment & Risk Mitigation</div>
                    </div>
                </div>
                {crosswalk && (
                    <Btn variant="ghost" onClick={() => setCrosswalk(null)} style={{ border: `1px solid ${T.borderHi}`, color: T.sub }}>
                        Running New Scan
                    </Btn>
                )}
            </div>

            {!crosswalk ? (
                /* Shield Landing / Selection Grid */
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
                    {grants.filter(g => ["active", "awarded", "preparing"].includes(g.stage)).map(g => (
                        <Card key={g.id} style={{
                            background: T.panel, border: `1px solid ${T.border}`,
                            transition: "all 0.2s", cursor: "pointer",
                            padding: 24, display: "flex", flexDirection: "column", gap: 16
                        }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.blue; e.currentTarget.style.transform = "translateY(-2px)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = "translateY(0)"; }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <Badge variant="outline" style={{ borderColor: T.borderHi, color: T.sub }}>{g.agency}</Badge>
                                {(loading && selectedGrant?.id === g.id) && <span style={{ fontSize: 12, color: T.blue }} className="animate-pulse">Scanning...</span>}
                            </div>

                            <div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 4, lineHeight: 1.4 }}>{g.title}</div>
                                <div style={{ fontSize: 12, color: T.sub }}>Req ID: {uid()} • Tier 1 Federal</div>
                            </div>

                            <Btn
                                variant={loading && selectedGrant?.id === g.id ? "ghost" : "primary"}
                                onClick={() => runCrossWalk(g)}
                                disabled={loading}
                                style={{ marginTop: "auto", justifyContent: "center" }}
                            >
                                {loading && selectedGrant?.id === g.id ? "Analyzing Protocol..." : "Activate Shield"}
                            </Btn>
                        </Card>
                    ))}
                    {grants.filter(g => ["active", "awarded", "preparing"].includes(g.stage)).length === 0 && (
                        <div style={{ gridColumn: "1 / -1", padding: 60, textAlign: "center", border: `2px dashed ${T.border}`, borderRadius: 16 }}>
                            <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.5 }}>🔒</div>
                            <div style={{ color: T.sub }}>No active grants detected for shield deployment.</div>
                        </div>
                    )}
                </div>
            ) : (
                    /* Active Shield Dashboard */
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>

                        {/* Main Compliance Matrix */}
                        <Card style={{ padding: 0, overflow: "hidden", background: T.bg, border: `1px solid ${T.borderHi}` }}>
                            <div style={{
                                padding: "16px 20px", borderBottom: `1px solid ${T.borderHi}`, background: T.panel,
                                display: "flex", justifyContent: "space-between", alignItems: "center"
                            }}>
                                <div style={{ fontWeight: 700, color: T.text, fontSize: 14 }}>Regulatory Alignment Matrix</div>
                                <Badge style={{ background: `${T.green}22`, color: T.green, border: `1px solid ${T.green}44` }}>
                                    SHIELD ACTIVE
                                </Badge>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column" }}>
                                {crosswalk.mappings.map((m, i) => (
                                    <div key={i} style={{
                                        padding: 20, borderBottom: `1px solid ${T.border}`,
                                        display: "grid", gridTemplateColumns: "1fr 1fr 100px", gap: 16, alignItems: "center",
                                        background: m.status === "drift" ? `${T.red}04` : "transparent"
                                    }}>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 800, color: T.text, marginBottom: 4 }}>{m.requirement}</div>
                                            <div style={{ fontSize: 11, color: T.sub }}>{m.notes}</div>
                                        </div>

                                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
                                                <span style={{ color: T.sub, width: 40 }}>FED:</span>
                                                <span style={{ color: T.text, fontWeight: 500, background: T.dim, padding: "2px 6px", borderRadius: 4 }}>{m.federal}</span>
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
                                                <span style={{ color: T.sub, width: 40 }}>LOC:</span>
                                                <span style={{ color: T.text, fontWeight: 500, background: T.dim, padding: "2px 6px", borderRadius: 4 }}>{m.local}</span>
                                            </div>
                                        </div>

                                    <div style={{ textAlign: "right" }}>
                                        <Badge style={{
                                            background: m.status === "aligned" ? `${T.green}15` : m.status === "drift" ? `${T.red}15` : `${T.amber}15`,
                                            color: m.status === "aligned" ? T.green : m.status === "drift" ? T.red : T.amber,
                                            border: `1px solid ${m.status === "aligned" ? T.green : m.status === "drift" ? T.red : T.amber}44`
                                        }}>
                                            {m.status.toUpperCase()}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                            </div>
                    </Card>

                        {/* Intelligence Sidebar */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                            <Card style={{
                                background: `linear-gradient(135deg, ${T.panel}, ${T.bg})`,
                                padding: 24, borderRadius: 16, border: `1px solid ${T.borderHi}`
                            }}>
                                <div style={{ fontSize: 12, fontWeight: 900, color: T.sub, textTransform: "uppercase", marginBottom: 20, letterSpacing: 1 }}>Shield Integrity</div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
                                    <ComplianceGauge value={94} label="Audit Ready" color={T.green} />
                                    <ComplianceGauge value={88} label="Optimized" color={T.blue} />
                            </div>

                                <div style={{ padding: 16, background: `${T.blue}11`, borderRadius: 12, border: `1px solid ${T.blue}33` }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: T.blue, textTransform: "uppercase", marginBottom: 8 }}>Redundancy Eliminated</div>
                                    <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                                        <span style={{ fontSize: 24, fontWeight: 900, color: T.text }}>-18</span>
                                        <span style={{ fontSize: 13, color: T.sub }}>Hours / Month</span>
                                </div>
                            </div>
                        </Card>

                            <Card style={{ padding: 24, borderRadius: 16, background: T.panel }}>
                                <div style={{ fontSize: 12, fontWeight: 900, color: T.text, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                                    <span>🤖</span> Regulatory Intelligence Brief
                                </div>
                                <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.6 }}>
                                    <strong>System Optimization:</strong> 94% of your Federal financial audit documents satisfy the local <span style={{ color: T.text, fontWeight: 600 }}>County Transparency Act</span>. No dual-reporting required.
                                </div>
                                <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${T.border}` }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: "uppercase", marginBottom: 12 }}>Recommended Actions</div>
                                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: T.text, display: "flex", flexDirection: "column", gap: 8 }}>
                                        <li>Map Internal Control Policy to State portal.</li>
                                        <li>Flag Indirect Cost Rate for sub-recipient review.</li>
                                    </ul>
                                </div>
                                <Btn variant="primary" block style={{ marginTop: 20 }}>
                                    Export Brief
                                </Btn>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
};
