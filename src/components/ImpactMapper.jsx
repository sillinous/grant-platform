import React, { useState, useMemo, useEffect } from "react";
import { T, fmt, fmtDate, PROFILE } from "../globals";
import { Card, Btn, Badge, Progress, Select } from "../ui";

// Helper for radial metrics - Enhanced for Fintech Premium
const RadialGauge = ({ value, color, label, size = 100 }) => {
    const radius = size * 0.4;
    const center = size / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div style={{ position: "relative", width: size, height: size }}>
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    <circle cx={center} cy={center} r={radius} fill="none" stroke={T.border} strokeWidth="8" opacity="0.3" />
                    <circle
                        cx={center} cy={center} r={radius} fill="none" stroke={color}
                        strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={offset}
                        strokeLinecap="round" transform={`rotate(-90 ${center} ${center})`}
                        style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)" }}
                    />
                </svg>
                <div style={{
                    position: "absolute", inset: 0, display: "flex", flexWrap: "wrap", alignContent: "center", justifyContent: "center",
                    fontSize: size * 0.18, fontWeight: 900, color: T.text, letterSpacing: -0.5
                }}>
                    {value}%
                </div>
            </div>
            <span style={{ fontSize: 10, fontWeight: 800, color: T.sub, textTransform: "uppercase", letterSpacing: 1.5, textAlign: "center" }}>{label}</span>
        </div>
    );
};

export const ImpactMapper = ({ grants }) => {
    const [view, setView] = useState("map");
    const [selectedZip, setSelectedZip] = useState(null);
    const [hoveredZip, setHoveredZip] = useState(null);

    // Simulated local data with deterministic randomization for better feel
    const zipData = useMemo(() => {
        const awards = (grants || []).filter(g => ["awarded", "active"].includes(g.stage));
        const zips = ["60601", "60605", "60611", "60616", "60653", "60637", "60615", "60607"];

        return zips.map((zip, idx) => {
            const seed = parseInt(zip) % 100;
            const count = Math.floor((seed / 100) * 10) + 2;
            const total = awards.length > 0 ? (awards[idx % awards.length]?.amount || 50000) * (idx + 1) : idx * 75000 + 40000;

            return {
                zip,
                count,
                total,
                pop: Math.floor(seed * 400 + 15000),
                povertyRate: (10 + (seed % 15)).toFixed(1),
                impactScore: 60 + (seed % 35),
                velocity: 45 + (seed % 45),
                healthIndex: 55 + (seed % 40),
                equityGap: 15 + (seed % 35),
                x: 100 + (idx % 3) * 260 + (idx > 3 ? 120 : 0),
                y: 80 + Math.floor(idx / 3) * 160
            };
        });
    }, [grants]);

    const stats = useMemo(() => {
        const totalImpact = zipData.reduce((s, z) => s + z.total, 0);
        const avgScore = zipData.reduce((s, z) => s + z.impactScore, 0) / zipData.length;
        return { totalImpact, avgScore };
    }, [zipData]);

    useEffect(() => {
        if (!selectedZip && zipData.length > 0) setSelectedZip(zipData[0]);
    }, [zipData, selectedZip]);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Fintech Premium Header */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: T.panel,
                padding: "20px 24px",
                borderRadius: 16,
                border: `1px solid ${T.border}`,
                boxShadow: `0 8px 32px -8px rgba(0,0,0,0.4)`
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <div style={{
                        width: 52, height: 52, borderRadius: 14,
                        background: T.gradient,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 26, boxShadow: `0 10px 20px -5px ${T.blue}66`
                    }}>
                        🌍
                    </div>
                    <div>
                        <h2 style={{ fontSize: 22, fontWeight: 900, color: T.text, margin: 0, letterSpacing: -0.7 }}>Strategic Impact Optimizer</h2>
                        <div style={{ fontSize: 13, color: T.sub, fontWeight: 600, marginTop: 2 }}>
                            <span style={{ color: T.green }}>● Active Engine</span>
                            <span style={{ margin: "0 8px", opacity: 0.3 }}>|</span>
                            {fmt(stats.totalImpact)} Total Allocated Capital
                        </div>
                    </div>
                </div>

                <div style={{ display: "flex", background: T.dim, borderRadius: 10, padding: 4, border: `1px solid ${T.borderHi}` }}>
                    {["map", "table"].map(v => (
                        <Btn
                            key={v}
                            variant={view === v ? "primary" : "ghost"}
                            onClick={() => setView(v)}
                            style={{
                                padding: "8px 16px", fontSize: 12, height: 36, fontWeight: 800, borderRadius: 8,
                                background: view === v ? T.blue : "transparent",
                                boxShadow: view === v ? `0 4px 12px ${T.blue}44` : "none"
                            }}
                        >
                            {v.charAt(0).toUpperCase() + v.slice(1)} View
                        </Btn>
                    ))}
                </div>
            </div>

            {/* Main Application Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 24, alignItems: "start" }}>

                {/* Visual Analysis Zone */}
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    <Card style={{
                        height: 560, padding: 0, overflow: "hidden",
                        background: T.bg,
                        border: `1px solid ${T.borderHi}`,
                        position: "relative",
                        borderRadius: 20
                    }}>
                        {view === "map" ? (
                            <>
                                {/* Grid Pattern Mask */}
                                <div style={{
                                    position: "absolute", inset: 0,
                                    backgroundImage: `radial-gradient(circle at 2px 2px, ${T.borderHi} 1px, transparent 0)`,
                                    backgroundSize: "32px 32px",
                                    opacity: 0.4
                                }} />

                                <svg width="100%" height="100%" viewBox="0 0 800 500" style={{ position: "relative", zIndex: 1 }}>
                                    <defs>
                                        <filter id="ultraGlow" x="-30%" y="-30%" width="160%" height="160%">
                                            <feGaussianBlur stdDeviation="6" result="blur" />
                                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                        </filter>
                                        <linearGradient id="glowLine" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor={T.blue} stopOpacity="0" />
                                            <stop offset="50%" stopColor={T.blue} stopOpacity="0.4" />
                                            <stop offset="100%" stopColor={T.blue} stopOpacity="0" />
                                        </linearGradient>
                                    </defs>

                                    {/* Intelligence Mesh Nodes */}
                                    {zipData.map((z, i) => i > 0 && (
                                        <path
                                            key={`l-${i}`}
                                            d={`M ${zipData[i - 1].x} ${zipData[i - 1].y} Q ${(zipData[i - 1].x + z.x) / 2} ${(zipData[i - 1].y + z.y) / 2 - 20} ${z.x} ${z.y}`}
                                            fill="none" stroke="url(#glowLine)" strokeWidth="1.5" strokeDasharray="8,6"
                                        />
                                    ))}

                                    {zipData.map((z) => {
                                        const isSelected = selectedZip?.zip === z.zip;
                                        const isHovered = hoveredZip === z.zip;
                                        const radius = 22 + (z.total / stats.totalImpact) * 70;

                                        return (
                                            <g
                                                key={z.zip}
                                                cursor="pointer"
                                                onClick={() => setSelectedZip(z)}
                                                onMouseEnter={() => setHoveredZip(z.zip)}
                                                onMouseLeave={() => setHoveredZip(null)}
                                            >
                                                {/* Orbital Animation */}
                                                {(isSelected || isHovered) && (
                                                    <circle
                                                        cx={z.x} cy={z.y} r={radius + 12}
                                                        fill="none" stroke={T.blue} strokeWidth="2"
                                                        strokeDasharray="6,4" opacity={isSelected ? 1 : 0.4}
                                                    >
                                                        <animateTransform
                                                            attributeName="transform" type="rotate"
                                                            from={`0 ${z.x} ${z.y}`} to={`-360 ${z.x} ${z.y}`}
                                                            dur="12s" repeatCount="indefinite"
                                                        />
                                                    </circle>
                                                )}

                                                {/* Strategic Node Surface */}
                                                <circle
                                                    cx={z.x} cy={z.y} r={radius}
                                                    fill={isSelected ? T.blue : T.dim}
                                                    fillOpacity={isSelected ? 0.3 : 0.2}
                                                    stroke={isSelected ? T.blue : T.borderHi}
                                                    strokeWidth={isSelected ? 4 : 2}
                                                    filter={isSelected ? "url(#ultraGlow)" : "none"}
                                                    style={{ transition: "all 0.5s cubic-bezier(0.19, 1, 0.22, 1)" }}
                                                />

                                                {/* Node Core */}
                                                <circle cx={z.x} cy={z.y} r="6" fill={isSelected ? T.blue : T.borderHi} />

                                                {/* Micro Label */}
                                                <g transform={`translate(${z.x - 40}, ${z.y + radius + 14})`}>
                                                    <rect width="80" height="24" rx="8" fill={isSelected ? T.blue : T.dim} />
                                                    <text x="40" y="16" textAnchor="middle" fontSize="12" fill={isSelected ? "#fff" : T.sub} fontWeight="900">
                                                        LOC {z.zip}
                                                    </text>
                                                </g>
                                            </g>
                                        );
                                    })}

                                    <text x="30" y="45" fontSize="13" fill={T.sub} fontWeight="900" textTransform="uppercase" letterSpacing="3">
                                        Geospatial Impact Matrix
                                    </text>
                                </svg>

                                {/* Floating Dashboard Info */}
                                <div style={{
                                    position: "absolute", bottom: 24, left: 24,
                                    background: T.glass, backdropFilter: "blur(18px)",
                                    padding: "16px 24px", borderRadius: 16, border: `1px solid ${T.borderHi}`,
                                    display: "flex", gap: 32, boxShadow: `0 10px 40px -10px rgba(0,0,0,0.6)`
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                        <div style={{ width: 14, height: 14, borderRadius: 4, background: T.blue, boxShadow: `0 0 12px ${T.blue}` }} />
                                        <span style={{ fontSize: 12, color: T.text, fontWeight: 700 }}>High Efficiency Zone</span>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                        <div style={{ width: 14, height: 14, borderRadius: 4, background: T.dim, border: `1px solid ${T.borderHi}` }} />
                                        <span style={{ fontSize: 12, color: T.sub, fontWeight: 700 }}>Emerging Market</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                                <div style={{ padding: 32 }}>
                                    <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 12px" }}>
                                        <thead>
                                            <tr style={{ textAlign: "left" }}>
                                                <th style={{ padding: "0 16px 16px", fontSize: 12, color: T.sub, textTransform: "uppercase", letterSpacing: 2 }}>Territory</th>
                                                <th style={{ padding: "0 16px 16px", fontSize: 12, color: T.sub, textTransform: "uppercase", letterSpacing: 2 }}>Units</th>
                                                <th style={{ padding: "0 16px 16px", fontSize: 12, color: T.sub, textTransform: "uppercase", letterSpacing: 2 }}>Principal</th>
                                                <th style={{ padding: "0 16px 16px", fontSize: 12, color: T.sub, textTransform: "uppercase", letterSpacing: 2 }}>Momentum</th>
                                                <th style={{ padding: "0 16px 16px", fontSize: 12, color: T.sub, textTransform: "uppercase", letterSpacing: 2 }}>Rating</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {zipData.map(z => (
                                            <tr
                                                key={z.zip}
                                                onClick={() => setSelectedZip(z)}
                                                style={{
                                                    background: selectedZip?.zip === z.zip ? `${T.blue}20` : T.dim,
                                                    cursor: "pointer",
                                                    transition: "background 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
                                                }}
                                            >
                                                <td style={{ padding: 20, borderRadius: "12px 0 0 12px", borderLeft: selectedZip?.zip === z.zip ? `4px solid ${T.blue}` : "none" }}>
                                                    <div style={{ fontWeight: 900, fontSize: 17, color: T.text }}>{z.zip}</div>
                                                    <div style={{ fontSize: 11, color: T.sub, fontWeight: 600 }}>Pop: {z.pop.toLocaleString()}</div>
                                                </td>
                                                <td style={{ padding: 20 }}>
                                                    <Badge variant="ghost" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${T.borderHi}`, color: T.sub }}>{z.count} Programs</Badge>
                                                </td>
                                                <td style={{ padding: 20, fontWeight: 900, color: T.green, fontSize: 15 }}>{fmt(z.total)}</td>
                                                <td style={{ padding: 20 }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                        <div style={{ flex: 1, height: 8, background: T.bg, borderRadius: 4 }}>
                                                            <div style={{ height: "100%", width: `${z.velocity}%`, background: T.purple, borderRadius: 4, boxShadow: `0 0 10px ${T.purple}44` }} />
                                                        </div>
                                                        <span style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{z.velocity}%</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: 20, borderRadius: "0 12px 12px 0" }}>
                                                    <span style={{
                                                        padding: "6px 12px", background: T.bg, border: `1px solid ${selectedZip?.zip === z.zip ? T.blue : T.borderHi}`,
                                                        borderRadius: 10, fontSize: 14, fontWeight: 900, color: selectedZip?.zip === z.zip ? T.blue : T.text
                                                    }}>
                                                        {z.impactScore}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                        )}
                    </Card>

                    {/* AI Insights - Premium Bento Block */}
                    <Card style={{
                        background: `linear-gradient(135deg, ${T.panel}, ${T.bg})`,
                        border: `1px solid ${T.border}`,
                        padding: "24px 32px",
                        borderRadius: 20,
                        boxShadow: `0 12px 48px -12px rgba(0,0,0,0.6)`
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                            <div style={{
                                width: 64, height: 64, borderRadius: "50%",
                                background: `rgba(69, 38, 228, 0.08)`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 28, border: `1px solid ${T.blue}33`,
                                position: "relative"
                            }}>
                                🌌
                                <div style={{ position: "absolute", inset: -4, border: `2px solid ${T.blue}22`, borderRadius: "50%", animation: "pulse 3s infinite" }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 12, color: T.blue, fontWeight: 900, textTransform: "uppercase", letterSpacing: 2.5, marginBottom: 8 }}>
                                    Neural Architecture Insight
                                </div>
                                <div style={{ fontSize: 15, color: T.text, lineHeight: 1.7, fontWeight: 500 }}>
                                    {selectedZip ? (
                                        <>
                                            Node <span style={{ color: T.amber, fontWeight: 900 }}>{selectedZip.zip}</span> exhibits a structural efficiency delta of {selectedZip.equityGap}%.
                                            Strategic Recommendation: Optimize <span style={{ color: T.blue, fontWeight: 900 }}>{fmt(selectedZip.total * 0.1)}</span> towards digital infrastructure for maximum yield.
                                        </>
                                    ) : "Initializing regional node clusters... Awaiting selection for predictive strategic modeling."}
                                </div>
                            </div>
                            <Btn variant="primary" style={{ height: 48, borderRadius: 12, padding: "0 24px", fontSize: 13, fontWeight: 900 }}>
                                Execute Pivot
                            </Btn>
                        </div>
                    </Card>
                </div>

                {/* Vertical Analytics Sidebar - Bento Grid Pattern */}
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    {selectedZip ? (
                        <>
                            <Card style={{
                                background: `linear-gradient(180deg, ${T.dim}, ${T.panel})`,
                                padding: 28, borderRadius: 20, border: `1px solid ${T.borderHi}`
                            }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
                                    <div>
                                        <div style={{ fontSize: 32, fontWeight: 900, color: T.text, letterSpacing: -1.5 }}>{selectedZip.zip}</div>
                                        <div style={{ fontSize: 12, color: T.sub, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5, marginTop: 4 }}>Primary Target Vector</div>
                                    </div>
                                    <div style={{
                                        padding: "6px 14px", background: `${T.green}25`, border: `1px solid ${T.green}55`,
                                        borderRadius: 24, fontSize: 11, fontWeight: 900, color: T.green, letterSpacing: 0.5
                                    }}>
                                        OPTIMIZED
                                    </div>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>
                                    <RadialGauge value={selectedZip.impactScore} color={T.blue} label="Strategic ROI" size={130} />
                                    <RadialGauge value={selectedZip.healthIndex} color={T.purple} label="Public Equity" size={130} />
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                                    <div style={{ padding: 20, background: T.bg, borderRadius: 16, border: `1px solid ${T.borderHi}` }}>
                                        <div style={{ fontSize: 11, color: T.sub, textTransform: "uppercase", fontWeight: 900, letterSpacing: 1 }}>Principal Investment</div>
                                        <div style={{ fontSize: 28, fontWeight: 900, color: T.text, marginTop: 8, letterSpacing: -0.5 }}>{fmt(selectedZip.total)}</div>
                                        <div style={{ width: "100%", height: 50, marginTop: 16, display: "flex", alignItems: "flex-end", gap: 4 }}>
                                            {[35, 55, 30, 75, 50, 90, 65, 100].map((h, i) => (
                                                <div key={i} style={{ flex: 1, background: T.blue, opacity: 0.15 + (i * 0.12), height: `${h}%`, borderRadius: "4px 4px 1px 1px" }} />
                                            ))}
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "0 8px" }}>
                                        {[
                                            { l: "Local Poverty Index", v: `${selectedZip.povertyRate}%`, c: T.red },
                                            { l: "Resilience Milestone", v: `${selectedZip.equityGap}/100`, c: T.amber },
                                            { l: "Citizen Footprint", v: selectedZip.pop.toLocaleString(), c: T.text }
                                        ].map((item, idx) => (
                                            <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, alignItems: "center" }}>
                                                <span style={{ color: T.sub, fontWeight: 600 }}>{item.l}</span>
                                                <span style={{ color: item.c, fontWeight: 900 }}>{item.v}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <Btn variant="primary" block style={{ marginTop: 32, padding: 20, borderRadius: 14, height: "auto", boxShadow: `0 12px 30px -10px ${T.blue}88` }}>
                                    <div style={{ fontWeight: 900, fontSize: 15, letterSpacing: 0.5 }}>DOWNLOAD IMPACT DOSSIER</div>
                                    <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 700, marginTop: 2 }}>Formal Strategic Forensics (PDF)</div>
                                </Btn>
                            </Card>

                            <Card style={{ padding: 24, borderRadius: 20, background: T.panel }}>
                                <div style={{ fontSize: 13, fontWeight: 900, color: T.text, textTransform: "uppercase", letterSpacing: 2, marginBottom: 20 }}>Allocation Mix</div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                                    {[
                                        { l: "Community Health", p: 42, c: T.blue },
                                        { l: "Workforce Development", p: 28, c: T.purple },
                                        { l: "Digital Literacy", p: 18, c: T.amber }
                                    ].map((cat, idx) => (
                                        <div key={idx}>
                                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 10 }}>
                                                <span style={{ color: T.sub, fontWeight: 700 }}>{cat.l}</span>
                                                <span style={{ color: cat.c, fontWeight: 900 }}>{cat.p}%</span>
                                            </div>
                                            <Progress value={cat.p} color={cat.c} height={10} />
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </>
                    ) : (
                        <div style={{ padding: 80, textAlign: "center", border: `2px dashed ${T.borderHi}`, borderRadius: 24, background: T.bg }}>
                            <div style={{ fontSize: 64, marginBottom: 24, opacity: 0.6 }}>🛰️</div>
                            <div style={{ fontSize: 16, color: T.sub, fontWeight: 700, lineHeight: 1.5, textTransform: "uppercase", letterSpacing: 1 }}>
                                Synchronizing Target Cluster...<br /><span style={{ fontSize: 12, opacity: 0.5 }}>Select node for forensic data.</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
