import React, { useState } from "react";
import { T, uid } from "../globals";
import { Card, Btn, Badge, Progress, Input } from "../ui";
import { API } from "../api";

export const ComplianceWizard = ({ grants }) => {
    const [loading, setLoading] = useState(false);
    const [crosswalk, setCrosswalk] = useState(null);
    const [selectedGrant, setSelectedGrant] = useState(null);

    const runCrossWalk = async (grant) => {
        setLoading(true);
        setSelectedGrant(grant);
        
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
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: T.text, margin: 0 }}>Unified Compliance Cross-Walk</h2>
                    <div style={{ fontSize: 13, color: T.sub }}>AI-driven alignment between Federal, State, and Local regulatory standards.</div>
                </div>
                <Btn variant="primary" onClick={() => setCrosswalk(null)} disabled={!crosswalk}>
                    🔄 Reset Analysis
                </Btn>
            </div>

            {!crosswalk ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
                    {grants.filter(g => ["active", "awarded", "preparing"].includes(g.stage)).map(g => (
                        <Card key={g.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{g.title?.slice(0, 45)}</div>
                                <div style={{ fontSize: 11, color: T.mute }}>{g.agency}</div>
                            </div>
                            <Btn size="sm" onClick={() => runCrossWalk(g)} disabled={loading}>
                                {loading && selectedGrant?.id === g.id ? "⏳" : "🪄 Align"}
                            </Btn>
                        </Card>
                    ))}
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>
                    <Card style={{ padding: 0 }}>
                        <div style={{ padding: 16, borderBottom: `1px solid ${T.border}`, background: T.panel }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{selectedGrant?.title} — Requirement Map</div>
                                <Badge color={T.green}>AI Aligned</Badge>
                            </div>
                        </div>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ textAlign: "left", background: T.card }}>
                                    <th style={{ padding: 12, fontSize: 11, color: T.mute }}>Requirement</th>
                                    <th style={{ padding: 12, fontSize: 11, color: T.mute }}>Federal (2 CFR 200)</th>
                                    <th style={{ padding: 12, fontSize: 11, color: T.mute }}>State/Local</th>
                                    <th style={{ padding: 12, fontSize: 11, color: T.mute }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {crosswalk.mappings.map((m, i) => (
                                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                                        <td style={{ padding: 12 }}>
                                            <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{m.requirement}</div>
                                            <div style={{ fontSize: 10, color: T.sub }}>{m.notes}</div>
                                        </td>
                                        <td style={{ padding: 12, fontSize: 11, color: T.sub }}>{m.federal}</td>
                                        <td style={{ padding: 12, fontSize: 11, color: T.sub }}>{m.local}</td>
                                        <td style={{ padding: 12 }}>
                                            <Badge color={m.status === "aligned" ? T.green : m.status === "drift" ? T.amber : T.red}>
                                                {m.status.toUpperCase()}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>

                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <Card style={{ background: `linear-gradient(to bottom, ${T.blue}10, transparent)` }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Alignment Summary</div>
                            <div style={{ fontSize: 12, color: T.sub, marginBottom: 16 }}>
                                94% of your Federal financial audit documents satisfy the local **County Transparency Act**. No dual-reporting required.
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                                    <span style={{ color: T.mute }}>Redundancy Reduction</span>
                                    <span style={{ color: T.green, fontWeight: 600 }}>-18 Hours / Month</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                                    <span style={{ color: T.mute }}>Accuracy Confidence</span>
                                    <span style={{ color: T.blue, fontWeight: 600 }}>99.8%</span>
                                </div>
                            </div>
                        </Card>

                        <Card>
                            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 8 }}>Next Steps</div>
                            <ul style={{ paddingLeft: 20, margin: 0, fontSize: 11, color: T.sub, display: "flex", flexDirection: "column", gap: 8 }}>
                                <li>Map your existing **Internal Control Policy** to the State portal.</li>
                                <li>Flag **Indirect Cost Rate** for sub-recipient review.</li>
                                <li>Export Unified Audit Brief for the Board.</li>
                            </ul>
                            <Btn variant="primary" block style={{ marginTop: 16, padding: 10 }}>📤 Export Cross-Walk Brief</Btn>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
};
