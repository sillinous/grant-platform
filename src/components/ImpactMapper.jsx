import React, { useState, useMemo } from "react";
import { T, fmt, fmtDate, PROFILE } from "../globals";
import { Card, Btn, Badge, Progress, Select } from "../ui";

export const ImpactMapper = ({ grants }) => {
    const [view, setView] = useState("map");
    const [selectedZip, setSelectedZip] = useState(null);
    const [timeframe, setTimeframe] = useState("current");

    // Simulating Zip-Code level data mapping
    const zipData = useMemo(() => {
        const awards = (grants || []).filter(g => ["awarded", "active"].includes(g.stage));
        const zips = ["60601", "60605", "60611", "60616", "60653"];
        return zips.map(zip => {
            const zipAwards = awards.filter(() => Math.random() > 0.6); // Randomly distribute for demo
            const total = zipAwards.reduce((s, a) => s + (a.amount || 0), 0);
            return {
                zip,
                count: zipAwards.length,
                total,
                pop: Math.floor(Math.random() * 50000 + 10000),
                povertyRate: (Math.random() * 20 + 5).toFixed(1),
                impactScore: Math.floor(Math.random() * 40 + 60)
            };
        });
    }, [grants]);

    const stats = useMemo(() => {
        const totalImpact = zipData.reduce((s, z) => s + z.total, 0);
        const avgScore = zipData.reduce((s, z) => s + z.impactScore, 0) / zipData.length;
        return { totalImpact, avgScore };
    }, [zipData]);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Header / Metrics */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: T.text, margin: 0 }}>Zip-Code Impact Mapper</h2>
                    <div style={{ fontSize: 13, color: T.sub }}>
                        {stats.totalImpact > 0
                            ? `Mapping ${fmt(stats.totalImpact)} in awarded funding to community outcomes.`
                            : "No awarded funding found. Add 'Active' or 'Awarded' grants to see impact distribution."
                        }
                    </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <Select value={timeframe} onChange={setTimeframe} 
                        options={[{id: "current", label: "Current Portfolio"}, {id: "projection", label: "24-Month Projection"}]}
                        style={{ width: 180 }} />
                    <Btn variant="ghost" onClick={() => setView(view === "map" ? "table" : "map")}>
                        {view === "map" ? "📋 View Table" : "🗺️ View Map"}
                    </Btn>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>
                {/* Left Side: Map or Table */}
                <Card style={{ minHeight: 450, padding: view === "map" ? 0 : 20, position: "relative", overflow: "hidden" }}>
                    {view === "map" ? (
                        <div style={{ width: "100%", height: "100%", background: T.panel, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {/* Simulated SVG Map */}
                            <svg width="100%" height="100%" viewBox="0 0 800 500">
                                <rect width="800" height="500" fill={T.panel} />
                                {zipData.map((z, i) => {
                                    const x = 150 + (i * 120);
                                    const y = 100 + (Math.sin(i) * 50) + 100;
                                    const radius = 10 + (z.total / stats.totalImpact) * 80;
                                    return (
                                        <g key={z.zip} cursor="pointer" onClick={() => setSelectedZip(z)}>
                                            <circle cx={x} cy={y} r={radius} fill={T.blue} fillOpacity="0.2" stroke={T.blue} strokeWidth="2" />
                                            <circle cx={x} cy={y} r="4" fill={T.blue} />
                                            <text x={x} y={y + radius + 15} textAnchor="middle" fontSize="10" fill={T.mute}>{z.zip}</text>
                                            {selectedZip?.zip === z.zip && (
                                                <circle cx={x} cy={y} r={radius + 4} fill="none" stroke={T.amber} strokeWidth="2" strokeDasharray="4 2" />
                                            )}
                                        </g>
                                    );
                                })}
                                <text x="20" y="30" fontSize="12" fill={T.sub} fontWeight="600">Region: Greater {PROFILE.loc?.split(",")[0] || "Metropolitan"} Area</text>
                            </svg>
                            <div style={{ position: "absolute", bottom: 12, left: 12, padding: 8, background: T.card, borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 10, color: T.mute }}>
                                💡 Bubbles represent funding density relative to total portfolio.
                            </div>
                        </div>
                    ) : (
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: `2px solid ${T.border}`, textAlign: "left" }}>
                                    <th style={{ padding: 12, fontSize: 12, color: T.mute }}>Zip Code</th>
                                    <th style={{ padding: 12, fontSize: 12, color: T.mute }}>Awards</th>
                                    <th style={{ padding: 12, fontSize: 12, color: T.mute }}>Total Funding</th>
                                    <th style={{ padding: 12, fontSize: 12, color: T.mute }}>Poverty Rate</th>
                                    <th style={{ padding: 12, fontSize: 12, color: T.mute }}>Impact Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {zipData.map(z => (
                                    <tr key={z.zip} style={{ borderBottom: `1px solid ${T.border}`, cursor: "pointer" }} onClick={() => setSelectedZip(z)}>
                                        <td style={{ padding: 12, fontSize: 13, fontWeight: 600, color: T.text }}>{z.zip}</td>
                                        <td style={{ padding: 12, fontSize: 13, color: T.text }}>{z.count}</td>
                                        <td style={{ padding: 12, fontSize: 13, color: T.green, fontWeight: 700 }}>{fmt(z.total)}</td>
                                        <td style={{ padding: 12, fontSize: 13, color: T.mute }}>{z.povertyRate}%</td>
                                        <td style={{ padding: 12 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                <div style={{ flex: 1, height: 4, background: T.border, borderRadius: 2 }}>
                                                    <div style={{ height: "100%", width: `${z.impactScore}%`, background: T.blue, borderRadius: 2 }} />
                                                </div>
                                                <span style={{ fontSize: 11, fontWeight: 600, color: T.blue }}>{z.impactScore}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </Card>

                {/* Right Side: Details */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <Card>
                        <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Portfolio Breakdown</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                                    <span style={{ color: T.sub }}>Community Health</span>
                                    <span style={{ color: T.text, fontWeight: 600 }}>42%</span>
                                </div>
                                <Progress value={42} color={T.blue} height={6} />
                            </div>
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                                    <span style={{ color: T.sub }}>Workforce dev</span>
                                    <span style={{ color: T.text, fontWeight: 600 }}>28%</span>
                                </div>
                                <Progress value={28} color={T.purple} height={6} />
                            </div>
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                                    <span style={{ color: T.sub }}>Infrastructure</span>
                                    <span style={{ color: T.text, fontWeight: 600 }}>30%</span>
                                </div>
                                <Progress value={30} color={T.amber} height={6} />
                            </div>
                        </div>
                    </Card>

                    <Card style={{ flex: 1, background: selectedZip ? `linear-gradient(to bottom, ${T.card}, ${T.panel})` : T.card }}>
                        {selectedZip ? (
                            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                                <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 4 }}>Zip Code: {selectedZip.zip}</div>
                                <div style={{ fontSize: 11, color: T.mute, marginBottom: 16 }}>Detailed Local Impact Analysis</div>
                                
                                <div style={{ background: T.panel, padding: 12, borderRadius: 8, marginBottom: 16 }}>
                                    <div style={{ fontSize: 10, color: T.mute, textTransform: "uppercase", letterSpacing: 0.5 }}>Local Economic Velocity</div>
                                    <div style={{ fontSize: 20, fontWeight: 700, color: T.green, marginTop: 4 }}>{selectedZip.impactScore} / 100</div>
                                    <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>Top 15% of regional clusters.</div>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                                        <span style={{ color: T.mute }}>Population</span>
                                        <span style={{ color: T.text }}>{selectedZip.pop.toLocaleString()}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                                        <span style={{ color: T.mute }}>Active Awards</span>
                                        <span style={{ color: T.text }}>{selectedZip.count}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                                        <span style={{ color: T.mute }}>Invested Capital</span>
                                        <span style={{ color: T.green, fontWeight: 600 }}>{fmt(selectedZip.total)}</span>
                                    </div>
                                </div>

                                <div style={{ marginTop: "auto", paddingTop: 16 }}>
                                    <Btn variant="primary" block style={{ padding: "10px" }}>📥 Export Local Brief</Btn>
                                </div>
                            </div>
                        ) : (
                            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", color: T.mute, padding: 20 }}>
                                <div>
                                    <div style={{ fontSize: 32, marginBottom: 12 }}>📍</div>
                                    <div style={{ fontSize: 13 }}>Select a zip code on the map to view hyper-local details.</div>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            {/* AI Insights Bar */}
            <Card style={{ background: `linear-gradient(90deg, ${T.panel}, ${T.card})`, borderLeft: `4px solid ${T.blue}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 20 }}>🧠</span>
                    <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.5 }}>
                        <span style={{ fontWeight: 700, color: T.text }}>AI Analysis:</span> Your funding is currently weighted towards infrastructure in the northern quadrants. 
                        To maximize **Social ROI**, consider shifting focus to workforce initiatives in **Zip 60616**, where poverty rates are 12% above regional average.
                    </div>
                </div>
            </Card>
        </div>
    );
};
