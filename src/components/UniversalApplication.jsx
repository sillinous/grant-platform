import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn, Progress } from '../ui';
import { T, fmt, PROFILE, uid } from '../globals';
import { API } from '../api';

export const UniversalApplication = ({ opportunity, onClose }) => {
    const [analyzing, setAnalyzing] = useState(true);
    const [mapping, setMapping] = useState(null);
    const [step, setStep] = useState(1);
    const [eligibility, setEligibility] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [narrative, setNarrative] = useState("");
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        const init = async () => {
            setAnalyzing(true);
            const elig = API.checkEligibilityFirewall(PROFILE, opportunity);
            setEligibility(elig);
            
            if (elig.eligible) {
                const map = await API.autoMapToGrant(PROFILE, opportunity);
                setMapping(map);
            }
            setAnalyzing(false);
        };
        init();
    }, [opportunity]);

    const handleGenerate = async () => {
        setGenerating(true);
        setStep(2);
        const text = await API.generateApplicationNarratives(PROFILE, opportunity);
        setNarrative(text);
        setGenerating(false);
    };

    const handleSubmit = async () => {
        setAnalyzing(true);
        const result = await API.submitApplication({ opportunity, narrative });
        if (result.success) {
            setSubmitted(true);
            setStep(3);
        }
        setAnalyzing(false);
    };

    if (!opportunity) return null;

    return (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center", backdropFilter: "blur(4px)", animation: "fadeIn 0.2s" }}>
            <Card style={{ width: 800, maxHeight: "90vh", overflowY: "auto", position: "relative", border: `1px solid ${T.border}`, boxShadow: `0 20px 50px rgba(0,0,0,0.5)`, background: T.card }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, alignItems: "center" }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: 20, color: T.text }}>Universal Application Engine ⚡</h2>
                        <div style={{ fontSize: 11, color: T.mute }}>Autonomous Application Lifecycle · v2.0</div>
                    </div>
                    <Btn variant="ghost" size="sm" onClick={onClose}>✕</Btn>
                </div>

                <div style={{ padding: 15, background: T.panel, borderRadius: 10, marginBottom: 20, border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 10, color: T.mute, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Target Opportunity</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{opportunity.title}</div>
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        <Badge color={T.blue}>{opportunity.agency || "Private Funder"}</Badge>
                        {opportunity.amount && <Badge color={T.green}>{fmt(opportunity.amount)}</Badge>}
                        <Badge color={T.amber}>{opportunity.type || (opportunity.category ? opportunity.category : "Grant")}</Badge>
                    </div>
                </div>

                {analyzing ? (
                    <div style={{ textAlign: "center", padding: 60 }}>
                        <div style={{ fontSize: 40, marginBottom: 20, animation: "spin 2s linear infinite" }}>⚙️</div>
                        <div style={{ fontSize: 18, color: T.text, fontWeight: 600 }}>Executing Engine Logic...</div>
                        <div style={{ fontSize: 12, color: T.sub, marginTop: 8 }}>Firewall Check · Funder Mapping · Submission Prep</div>
                        <Progress value={85} color={T.amber} style={{ marginTop: 30, maxWidth: 300, margin: "30px auto" }} />
                    </div>
                ) : !eligibility.eligible ? (
                        <div style={{ padding: 30, textAlign: "center", border: `1px solid ${T.red}44`, borderRadius: 12, background: `${T.red}08` }}>
                            <div style={{ fontSize: 40, marginBottom: 15 }}>🛡️</div>
                            <h3 style={{ color: T.red, margin: "0 0 10px 0" }}>Eligibility Firewall Triggered</h3>
                            <p style={{ color: T.sub, fontSize: 13, marginBottom: 20 }}>Our autonomous filters blocked this pursuit to protect your labor-hour efficiency.</p>
                            <div style={{ textAlign: "left", background: T.panel, padding: 16, borderRadius: 8, marginBottom: 20 }}>
                                <div style={{ fontSize: 11, color: T.mute, marginBottom: 8, fontWeight: 700 }}>BLOCKING ISSUES:</div>
                                {eligibility.issues.map((issue, i) => (
                                    <div key={i} style={{ color: T.text, fontSize: 12, marginBottom: 6, display: "flex", gap: 8 }}>
                                        <span>•</span> {issue}
                                    </div>
                                ))}
                            </div>
                            <Btn variant="primary" onClick={onClose}>Dismiss & Find Better Leads</Btn>
                    </div>
                ) : (
                    <div>
                                <div style={{ display: "flex", gap: 2, background: T.panel, padding: 4, borderRadius: 8, marginBottom: 24 }}>
                                    {[
                                        { s: 1, l: "1. Data Mapping", i: "🎯" },
                                        { s: 2, l: "2. Narrative Gen", i: "✍️" },
                                        { s: 3, l: "3. Transmit", i: "🚀" }
                                    ].map(x => (
                                        <div key={x.s} style={{
                                            flex: 1, padding: "10px", textAlign: "center", borderRadius: 6,
                                            background: step === x.s ? T.card : "transparent",
                                            color: step === x.s ? T.amber : T.mute,
                                            fontWeight: step === x.s ? 700 : 400,
                                            fontSize: 12, transition: "all 0.2s"
                                        }}>
                                            {x.i} {x.l}
                                        </div>
                                    ))}
                        </div>

                        {step === 1 && (
                                    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
                                        <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <div style={{ fontSize: 14, color: T.green, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                                                <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.green }} />
                                                {mapping?.compatibility}% Compatible Match Found
                                            </div>
                                            <Badge color={T.sub}>Format: {mapping?.format}</Badge>
                                        </div>
                                        <div style={{ display: "grid", gap: 8 }}>
                                    {Object.entries(mapping?.mappedFields || {}).map(([key, val]) => (
                                        <div key={key} style={{ padding: "12px 16px", background: T.panel, borderRadius: 8, display: "grid", gridTemplateColumns: "160px 1fr", border: `1px solid ${T.border}` }}>
                                            <div style={{ fontSize: 11, color: T.mute, fontWeight: 600 }}>{key}</div>
                                            <div style={{ fontSize: 13, color: T.text }}>{val}</div>
                                        </div>
                                    ))}
                                </div>
                                {mapping?.missingFields?.length > 0 && (
                                            <div style={{ marginTop: 24, padding: "16px 20px", border: `1px dashed ${T.orange}44`, borderRadius: 10, background: `${T.orange}05` }}>
                                                <div style={{ fontSize: 11, color: T.orange, fontWeight: 800, marginBottom: 10 }}>⚠️ ATTENTION: MISSING ARCHITECTURE ASSETS</div>
                                                {mapping.missingFields.map(f => (
                                                    <div key={f} style={{ fontSize: 13, color: T.text, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
                                                        <span style={{ fontSize: 10 }}>🔴</span> {f} (Manual input required in Final Review)
                                                    </div>
                                                ))}
                                    </div>
                                )}
                                        <div style={{ marginTop: 32, display: "flex", justifyContent: "flex-end", gap: 12 }}>
                                            <Btn variant="ghost" onClick={onClose}>Save for Later</Btn>
                                            <Btn variant="primary" size="lg" onClick={handleGenerate}>Generate Narrative Context ✨</Btn>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                                    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
                                        <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>✨ AI Context Drafting</div>
                                            {generating && <Badge color={T.blue}>Model: Flagship L/0</Badge>}
                                        </div>
                                        <div style={{
                                            background: T.panel, padding: 24, borderRadius: 12, border: `1px solid ${generating ? T.amber : T.border}`,
                                            minHeight: 300, position: "relative", transition: "border 0.5s"
                                        }}>
                                            {generating ? (
                                                <div style={{ color: T.mute, fontStyle: "italic", textAlign: "center", marginTop: 100 }}>
                                                    <div style={{ fontSize: 24, marginBottom: 10 }}>🧠</div>
                                                    Synthsizing Org Profile with Funder Priorities...
                                                </div>
                                            ) : (
                                                <div style={{ fontSize: 14, color: T.sub, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                                                    {narrative}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ marginTop: 32, display: "flex", justifyContent: "flex-end", gap: 12 }}>
                                            <Btn variant="ghost" onClick={() => setStep(1)} disabled={generating}>&larr; Refine Mapping</Btn>
                                            <Btn variant="primary" size="lg" onClick={handleSubmit} disabled={generating}>Assemble & Transmit Package &rarr;</Btn>
                                        </div>
                            </div>
                        )}

                        {step === 3 && (
                                    <div style={{ textAlign: "center", padding: "60px 40px", animation: "fadeIn 0.5s ease-out" }}>
                                        <div style={{ fontSize: 60, marginBottom: 24, animation: "bounce 2s infinite" }}>🚀</div>
                                        <h2 style={{ color: T.green, fontSize: 28, margin: "0 0 10px 0" }}>Transmission Successful</h2>
                                        <p style={{ color: T.sub, fontSize: 15, marginBottom: 32, maxWidth: 500, margin: "0 auto 32px" }}>
                                            The application for <b>{opportunity.title}</b> has been autonomously compiled and moved to your <b>Submitted Pipeline</b>.
                                        </p>
                                        <div style={{ background: T.panel, padding: 20, borderRadius: 12, border: `1px solid ${T.border}`, marginBottom: 32, textAlign: "left" }}>
                                            <div style={{ fontSize: 11, color: T.mute, fontWeight: 700, marginBottom: 12 }}>TRANSMISSION RECEIPT:</div>
                                            <div style={{ fontSize: 12, marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
                                                <span style={{ color: T.sub }}>Receipt ID:</span>
                                                <span style={{ color: T.text, fontFamily: "monospace" }}>{uid().toUpperCase()}</span>
                                            </div>
                                            <div style={{ fontSize: 12, display: "flex", justifyContent: "space-between" }}>
                                                <span style={{ color: T.sub }}>Submission Status:</span>
                                                <span style={{ color: T.green, fontWeight: 700 }}>VERIFIED</span>
                                            </div>
                                        </div>
                                        <Btn variant="primary" size="lg" onClick={onClose}>Return to Discovery Hub</Btn>
                            </div>
                        )}
                    </div>
                )}
            </Card>
        </div>
    );
};
