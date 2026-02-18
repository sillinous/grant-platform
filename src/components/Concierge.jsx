import React, { useState, useEffect } from 'react';
import { Card, Btn, Badge, Icon, Progress } from '../ui';
import { T, fmt, PROFILE } from '../globals';
import { API } from '../api';

export const Concierge = ({ onSelect }) => {
    const [briefing, setBriefing] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBriefing();
    }, []);

    const loadBriefing = async () => {
        setLoading(true);
        const data = await API.getCuratedBriefing(PROFILE);
        setBriefing(data);
        setLoading(false);
    };

    if (loading) {
        return (
            <div style={{ padding: 40, textAlign: "center", color: T.mute }}>
                <div style={{ fontSize: 32, marginBottom: 16, animation: "pulse 2s infinite" }}>🛰️</div>
                <div>Scanning Galactic Funding Signals...</div>
            </div>
        );
    }

    return (
        <div style={{ animation: "fadeIn 1s ease-out" }}>
            <div style={{ marginBottom: 32 }}>
                <h2 style={{ color: T.text, fontSize: 24, margin: "0 0 8px 0" }}>Good Morning, {PROFILE.name.split(' ')[0]}</h2>
                <p style={{ color: T.sub, fontSize: 14 }}>Your AI-curated funding intelligence for today.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, marginBottom: 40 }}>
                {briefing?.topPicks.map((pick, i) => (
                    <Card key={i} glow style={{ display: "flex", flexDirection: "column", height: "100%", position: "relative", overflow: "hidden" }}>
                        <div style={{ position: "absolute", top: 12, right: 12 }}>
                            <Badge color={T.green}>{pick.matchScore}% Match</Badge>
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: T.amber, textTransform: "uppercase", marginBottom: 12 }}>{pick.sector}</div>
                        <h3 style={{ fontSize: 16, color: T.text, margin: "0 0 12px 0", lineHeight: 1.4 }}>{pick.title}</h3>
                        <p style={{ fontSize: 13, color: T.sub, flex: 1, marginBottom: 20 }}>{pick.reasoning}</p>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
                            <div style={{ color: T.text, fontWeight: 700 }}>{fmt(pick.amount)}</div>
                            <Btn variant="primary" size="sm" onClick={() => onSelect(pick)}>Configure &rarr;</Btn>
                        </div>
                    </Card>
                ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 32 }}>
                <Card style={{ background: T.panel }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 18 }}>🧠</span> Strategic Analysis
                    </div>
                    <div style={{ display: "grid", gap: 16 }}>
                        {briefing?.insights.map((insight, i) => (
                            <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                                <div style={{ width: 40, height: 40, borderRadius: 8, background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                                    {insight.icon}
                                </div>
                                <div>
                                    <div style={{ fontSize: 13, color: T.text, fontWeight: 600, marginBottom: 4 }}>{insight.label}</div>
                                    <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.5 }}>{insight.text}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card style={{ background: `linear-gradient(180deg, ${T.panel}, transparent)` }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 20 }}>Daily Velocity</div>
                    <div style={{ display: "grid", gap: 20 }}>
                        <div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.sub, marginBottom: 8 }}>
                                <span>PIPELINE HEALTH</span>
                                <span style={{ color: T.green }}>OPTIMAL</span>
                            </div>
                            <Progress value={85} height={6} color={T.green} />
                        </div>
                        <div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.sub, marginBottom: 8 }}>
                                <span>COMPLIANCE DRIFT</span>
                                <span style={{ color: T.amber }}>2% DETECTED</span>
                            </div>
                            <Progress value={2} height={6} color={T.amber} />
                        </div>
                    </div>
                    <div style={{ marginTop: 24, padding: 12, background: T.bg, borderRadius: 8, fontSize: 11, color: T.dim, fontStyle: "italic" }}>
                        "Federal signals indicate a shift toward rural infrastructure projects for Q3. Adjusting weights..."
                    </div>
                </Card>
            </div>
        </div>
    );
};
