import React, { useState } from 'react';
import { Card, Btn, Badge, Progress, Empty, Select, TextArea } from '../ui';
import { T, LS, uid, PROFILE } from '../globals';
import { API } from '../api';
import { useStore } from '../store';

export const PreFlightCheck = () => {
    const { grants, vaultDocs } = useStore();
    const [selectedGrant, setSelectedGrant] = useState("");
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState(null);

    const runCheck = async () => {
        if (!selectedGrant) return;
        setLoading(true);
        const grant = grants.find(g => g.id === selectedGrant);

        // Simulate gathering proposal components
        const proposalDocs = vaultDocs.filter(d => d.grantId === selectedGrant);
        const context = `GRANT: ${grant.title} (${grant.agency})
RUBRIC/REQUIREMENTS: ${grant.category || "Standard Federal"}

PROPOSAL ASSETS:
${proposalDocs.map(d => `- ${d.name} (${d.type})`).join("\n")}
Applicant: ${PROFILE.name}`;

        const sys = `You are a "Red Team" Grant Auditor. Your goal is to find reasons to REJECT this proposal. 
Be brutal and bureaucratic. Check for:
1. Missing mandatory attachments (simulated based on agency).
2. Character count risk (estimated).
3. "Bureaucratic Tone" (is it too informal? too academic? not enough keywords?).
4. Demographic alignment (did they mention their rural status enough?).
5. Compliance with ${grant.agency} standards.

Return ONLY a JSON object:
{
  "readiness": 0-100,
  "findings": [
    { "severity": "REJECT", "category": "Compliance", "msg": "Missing SF-424 backup." },
    { "severity": "WARNING", "category": "Tone", "msg": "Narrative is too conversational for NSF." }
  ],
  "verdict": "DO NOT SUBMIT | PROCEED WITH CAUTION | READY"
}`;

        const res = await API.callAI([{ role: "user", content: context }], sys);
        if (!res.error) {
            try {
                const cleaned = res.text.replace(/```json\n?|```/g, "").trim();
                setReport(JSON.parse(cleaned));
            } catch { setReport({ error: "Failed to parse auditor report." }); }
        } else { setReport({ error: res.error }); }
        setLoading(false);
    };

    return (
        <div>
            <Card style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 8 }}>🛡️ Submission Pre-Flight Red Team</div>
                <div style={{ fontSize: 11, color: T.sub, marginBottom: 16 }}>
                    Run a final, brutal audit of your entire proposal package. This tool replicates the strictness of a federal reviewer looking for technicality-based rejections.
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                    <Select
                        value={selectedGrant}
                        onChange={setSelectedGrant}
                        style={{ flex: 1 }}
                        options={[{ value: "", label: "Select a grant to audit..." }, ...grants.map(g => ({ value: g.id, label: g.title?.slice(0, 45) }))]}
                    />
                    <Btn variant="primary" onClick={runCheck} disabled={loading || !selectedGrant}>
                        {loading ? "⚔️ Auditing..." : "⚔️ Run Red Team Audit"}
                    </Btn>
                </div>
            </Card>

            {!report && !loading && (
                <Empty icon="🛡️" title="Ready for Pre-Flight" sub="Select a grant pursuit above to initiate the Red Team audit. We will scan your Vault, Narrative, and Compliance Matrix." />
            )}

            {report && (
                <div>
                    <Card style={{ marginBottom: 12, borderColor: report.readiness >= 90 ? T.green : report.readiness >= 60 ? T.yellow : T.red }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <div style={{ fontSize: 18, fontWeight: 800, color: report.readiness >= 90 ? T.green : report.readiness >= 60 ? T.yellow : T.red }}>
                                    {report.readiness}% READINESS
                                </div>
                                <div style={{ fontSize: 12, fontWeight: 700, marginTop: 4, textTransform: "uppercase", color: T.text }}>
                                    Verdict: <span style={{ color: report.verdict === "READY" ? T.green : T.red }}>{report.verdict}</span>
                                </div>
                            </div>
                        </div>
                        <Progress value={report.readiness} max={100} color={report.readiness >= 90 ? T.green : report.readiness >= 60 ? T.yellow : T.red} height={8} style={{ marginTop: 12 }} />
                    </Card>

                    <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 8 }}>❌ REJECTION RISKS & FINDINGS</div>
                    {report.findings?.map((f, idx) => (
                        <Card key={idx} style={{ marginBottom: 8, padding: 12, background: T.panel, borderLeft: `4px solid ${f.severity === "REJECT" ? T.red : T.yellow}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                <Badge color={f.severity === "REJECT" ? T.red : T.yellow}>{f.severity}</Badge>
                                <span style={{ fontSize: 10, color: T.mute, fontWeight: 700 }}>{f.category}</span>
                            </div>
                            <div style={{ fontSize: 12, color: T.text }}>{f.msg}</div>
                        </Card>
                    ))}

                    {!report.findings?.length && !report.error && (
                        <Card style={{ textAlign: "center", padding: 24 }}>
                            <div style={{ fontSize: 24 }}>🚀</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: T.green, marginTop: 12 }}>CLEAN PRE-FLIGHT</div>
                            <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>The auditor found no technical reasons for rejection. You are cleared for submission.</div>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
};
