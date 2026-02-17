import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn, Progress } from '../ui';
import { T, API, fmt, PROFILE } from '../globals';

export const UniversalApplication = ({ opportunity, onClose }) => {
    const [analyzing, setAnalyzing] = useState(true);
    const [mapping, setMapping] = useState(null);
    const [step, setStep] = useState(1);
    const [eligibility, setEligibility] = useState(null);

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

    if (!opportunity) return null;

    return (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center" }}>
            <Card style={{ width: 800, maxHeight: "90vh", overflowY: "auto", position: "relative", border: `1px solid ${T.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                    <h2 style={{ margin: 0, fontSize: 20 }}>Universal Application Engine ⚡</h2>
                    <Btn size="sm" onClick={onClose}>Close</Btn>
                </div>

                <div style={{ padding: 15, background: T.panel, borderRadius: 8, marginBottom: 20 }}>
                    <div style={{ fontSize: 11, color: T.mute, textTransform: "uppercase" }}>Target Opportunity</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{opportunity.title}</div>
                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                        <Badge color={T.blue}>{opportunity.agency || "Private Funder"}</Badge>
                        <Badge color={T.green}>{fmt(opportunity.amount)}</Badge>
                    </div>
                </div>

                {analyzing ? (
                    <div style={{ textAlign: "center", padding: 40 }}>
                        <div style={{ fontSize: 24, marginBottom: 10 }}>🔮</div>
                        <div>Running Eligibility Firewall & Auto-Mapping...</div>
                        <Progress value={60} color={T.blue} style={{ marginTop: 20 }} />
                    </div>
                ) : !eligibility.eligible ? (
                    <div style={{ padding: 20, textAlign: "center", border: `1px solid ${T.red}`, borderRadius: 8, background: `${T.red}10` }}>
                        <h3 style={{ color: T.red }}>⛔ Eligibility Firewall Triggered</h3>
                        <p>We saved you from wasting time. You are not eligible.</p>
                        <ul style={{ textAlign: "left", color: T.text }}>
                            {eligibility.issues.map((issue, i) => <li key={i}>{issue}</li>)}
                        </ul>
                        <Btn onClick={onClose} style={{ marginTop: 10 }}>Dismiss</Btn>
                    </div>
                ) : (
                    <div>
                        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                            <div style={{ flex: 1, padding: 10, borderBottom: step === 1 ? `2px solid ${T.blue}` : "none", cursor: "pointer", opacity: step === 1 ? 1 : 0.5 }} onClick={() => setStep(1)}>
                                1. Data Mapping
                            </div>
                            <div style={{ flex: 1, padding: 10, borderBottom: step === 2 ? `2px solid ${T.blue}` : "none", cursor: "pointer", opacity: step === 2 ? 1 : 0.5 }} onClick={() => setStep(2)}>
                                2. Narrative Gen
                            </div>
                            <div style={{ flex: 1, padding: 10, borderBottom: step === 3 ? `2px solid ${T.blue}` : "none", cursor: "pointer", opacity: step === 3 ? 1 : 0.5 }} onClick={() => setStep(3)}>
                                3. Submit
                            </div>
                        </div>

                        {step === 1 && (
                            <div>
                                <div style={{ marginBottom: 15, display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ color: T.green, fontWeight: 700 }}>{mapping?.compatibility}% Compatible Match</span>
                                    <span style={{ color: T.mute }}>Format: {mapping?.format}</span>
                                </div>
                                <div style={{ display: "grid", gap: 10 }}>
                                    {Object.entries(mapping?.mappedFields || {}).map(([key, val]) => (
                                        <div key={key} style={{ padding: 10, background: T.panel, borderRadius: 4, display: "grid", gridTemplateColumns: "150px 1fr" }}>
                                            <div style={{ fontSize: 12, color: T.mute, display: "flex", alignItems: "center" }}>{key}</div>
                                            <div style={{ fontSize: 13, color: T.text }}>{val}</div>
                                        </div>
                                    ))}
                                </div>
                                {mapping?.missingFields?.length > 0 && (
                                    <div style={{ marginTop: 20, padding: 10, border: `1px dashed ${T.orange}`, borderRadius: 4 }}>
                                        <div style={{ fontSize: 12, color: T.orange, fontWeight: 700 }}>⚠️ MISSING ASSETS</div>
                                        {mapping.missingFields.map(f => <div key={f} style={{ fontSize: 13, marginLeft: 10 }}>• {f}</div>)}
                                    </div>
                                )}
                                <div style={{ marginTop: 20, textAlign: "right" }}>
                                    <Btn variant="primary" onClick={() => setStep(2)}>Generate Narratives &rarr;</Btn>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div style={{ textAlign: "center", padding: 40, color: T.mute }}>
                                <i>(AI Narrative Generation Module - Connected in Phase 2)</i>
                                <br />
                                This would generate the full 15-page PDF based on the mapping.
                                <br /><br />
                                <Btn variant="primary" onClick={() => setStep(3)}>Simulate Generation</Btn>
                            </div>
                        )}

                        {step === 3 && (
                            <div style={{ textAlign: "center", padding: 40 }}>
                                <div style={{ fontSize: 40 }}>🚀</div>
                                <h3>Ready to Transmit</h3>
                                <p>Application package compiled for {mapping?.format}.</p>
                                <Btn variant="primary" size="lg" onClick={onClose}>Submit to Portal</Btn>
                            </div>
                        )}
                    </div>
                )}
            </Card>
        </div>
    );
};
