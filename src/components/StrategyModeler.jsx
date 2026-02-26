import React, { useState, useMemo } from 'react';
import { Card, Stat, Btn, Progress, Badge, Icon } from '../ui';
import { T, fmt, fmtDate } from '../globals';
import { useStore } from '../store';
import { TrendingUp, ShieldAlert, BarChart3, CalendarDays } from 'lucide-react';

export const StrategyModeler = () => {
    const { grants } = useStore();
    const [scenario, setScenario] = useState("base"); // base, conservative, aggressive
    
    // Stage-based win probabilities
    const STAGE_PROBS = {
        discovered: 0.1,
        researching: 0.2,
        drafting: 0.5,
        review: 0.7,
        submitted: 0.35,
        awarded: 1.0,
        active: 1.0
    };

    const multiplier = scenario === "conservative" ? 0.6 : scenario === "aggressive" ? 1.4 : 1.0;

    const pipeline = useMemo(() => {
        const now = new Date();
        return grants
            .filter(g => !["declined", "rejected"].includes(g.stage))
            .map(g => {
                const prob = (STAGE_PROBS[g.stage] || 0.1) * multiplier;
                const expectedValue = (g.amount || 0) * Math.min(1, prob);
                const deadline = g.deadline ? new Date(g.deadline) : new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000)); // Default 90 days out
                return { ...g, prob, expectedValue, deadline };
            })
            .sort((a, b) => a.deadline - b.deadline);
    }, [grants, scenario, multiplier]);

    // Grouping by Month for the Time-Series Chart
    const monthlyData = useMemo(() => {
        const months = {};
        const now = new Date();
        for (let i = 0; i < 12; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            months[key] = { label: d.toLocaleDateString('default', { month: 'short' }), value: 0 };
        }

        pipeline.forEach(g => {
            const key = `${g.deadline.getFullYear()}-${g.deadline.getMonth()}`;
            if (months[key]) months[key].value += g.expectedValue;
        });

        return Object.values(months);
    }, [pipeline]);

    const totalExpected = pipeline.reduce((s, g) => s + g.expectedValue, 0);
    const maxMonth = Math.max(...monthlyData.map(d => d.value), 10000);

    return (
        <div style={{ animation: "fadeIn 0.5s ease-out" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h3 style={{ color: T.text, fontSize: 18, fontWeight: 800, margin: 0, fontFamily: 'Outfit' }}>Strategic Pipeline Yield Engine</h3>
                    <p style={{ color: T.sub, fontSize: 13, margin: '4px 0 0' }}>Forward-looking 12-month fiscal modeling based on current maturity.</p>
                </div>
                <div style={{ display: 'flex', gap: 8, background: T.panel, padding: 4, borderRadius: 8, border: `1px solid ${T.border}` }}>
                    {["conservative", "base", "aggressive"].map(s => (
                        <Btn
                            key={s}
                            variant={scenario === s ? "primary" : "ghost"}
                            size="xs"
                            onClick={() => setScenario(s)}
                            style={{ textTransform: 'capitalize', minWidth: 90 }}
                        >
                            {s}
                        </Btn>
                    ))}
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 2.5fr", gap: 20 }}>
                <div style={{ display: "grid", gap: 16 }}>
                    <Card glow style={{ background: `linear-gradient(135deg, ${T.panel}, ${T.amber}10)` }}>
                        <Stat label="Total Modeled Yield" value={fmt(totalExpected)} color={T.amber} size="lg" />
                        <div style={{ fontSize: 10, color: T.sub, marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <TrendingUp size={12} /> {((totalExpected / (pipeline.reduce((s, g) => s + (g.amount || 0), 0) || 1)) * 100).toFixed(1)}% Realization Rate
                        </div>
                    </Card>

                    <Card style={{ background: T.panel }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <ShieldAlert size={14} color={T.red} /> Critical Risk Path
                        </div>
                        {pipeline.filter(g => g.prob < 0.3).slice(0, 2).map((g, i) => (
                            <div key={i} style={{ marginBottom: 12, borderLeft: `2px solid ${T.red}`, paddingLeft: 8 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: T.text }}>{g.title}</div>
                                <div style={{ fontSize: 10, color: T.sub }}>Yield at risk: {fmt(g.amount)}</div>
                            </div>
                        ))}
                    </Card>
                </div>

                <Card style={{ background: T.bg, border: `1px solid ${T.border}`, padding: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>12-Month Expected Cash Flow (Adjusted)</div>
                        <Badge color={scenario === "aggressive" ? T.purple : scenario === "conservative" ? T.blue : T.amber}>
                            {scenario.toUpperCase()} SCENARIO
                        </Badge>
                    </div>

                    {/* SVG Time-Series Chart */}
                    <div style={{ position: "relative", height: 220, width: '100%' }}>
                        <svg width="100%" height="100%" viewBox="0 0 800 200" preserveAspectRatio="none">
                            {/* Grid Lines */}
                            {[0, 0.25, 0.5, 0.75, 1].map(p => (
                                <line
                                    key={p} x1="0" y1={200 - (p * 200)} x2="800" y2={200 - (p * 200)}
                                    stroke={T.border} strokeWidth="1" strokeDasharray="4 4"
                                />
                            ))}

                            {/* Area Path */}
                            <path
                                d={`M 0 200 ${monthlyData.map((d, i) => `L ${(i / (monthlyData.length - 1)) * 800} ${200 - (d.value / maxMonth) * 180}`).join(" ")} L 800 200 Z`}
                                fill={`url(#gradient-${scenario})`}
                                opacity="0.3"
                            />

                            {/* Line Path */}
                            <path
                                d={`M ${monthlyData.map((d, i) => `${(i / (monthlyData.length - 1)) * 800} ${200 - (d.value / maxMonth) * 180}`).join(" L ")}`}
                                fill="none"
                                stroke={scenario === "aggressive" ? T.purple : scenario === "conservative" ? T.blue : T.amber}
                                strokeWidth="3"
                                strokeLinejoin="round"
                            />

                            {/* Data Points */}
                            {monthlyData.map((d, i) => (
                                <circle
                                    key={i}
                                    cx={(i / (monthlyData.length - 1)) * 800}
                                    cy={200 - (d.value / maxMonth) * 180}
                                    r="4"
                                    fill={T.text}
                                    stroke={scenario === "aggressive" ? T.purple : scenario === "conservative" ? T.blue : T.amber}
                                    strokeWidth="2"
                                />
                            ))}

                            <defs>
                                <linearGradient id="gradient-base" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={T.amber} />
                                    <stop offset="100%" stopColor={T.amber} stopOpacity="0" />
                                </linearGradient>
                                <linearGradient id="gradient-conservative" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={T.blue} />
                                    <stop offset="100%" stopColor={T.blue} stopOpacity="0" />
                                </linearGradient>
                                <linearGradient id="gradient-aggressive" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={T.purple} />
                                    <stop offset="100%" stopColor={T.purple} stopOpacity="0" />
                                </linearGradient>
                            </defs>
                        </svg>

                        {/* X-Axis Labels */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                            {monthlyData.map((d, i) => (
                                <span key={i} style={{ fontSize: 9, color: T.dim, fontWeight: 600 }}>{d.label}</span>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginTop: 24, padding: 12, background: T.panel, borderRadius: 8, border: `1px solid ${T.border}`, display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{ padding: 8, background: T.bg, borderRadius: 6 }}><BarChart3 size={16} color={T.blue} /></div>
                        <div style={{ fontSize: 11, color: T.sub, lineHeight: 1.5 }}>
                            <strong style={{ color: T.text }}>Scenario Narrative:</strong> {scenario === "conservative"
                                ? "Modeling extreme vetting and 40% reduction in hit rate. Use for rainy-day planning."
                                : scenario === "aggressive"
                                    ? "Modeling high-velocity submission and partner-accelerated drafting. Target trajectory."
                                    : "Balanced modeling based on historical stage-transition averages."}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};
