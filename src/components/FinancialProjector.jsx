import React, { useState, useMemo } from 'react';
import { Card, Stat, Btn, Input, Progress, MiniBar, Badge } from '../ui';
import { T, fmt, pct, PROFILE, STAGE_MAP } from '../globals';

// ─── HELPERS ────────────────────────────────────────────────────────────

const RunwayRadial = ({ value, max = 24, color = T.amber }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / max, 1);
  const offset = circumference - progress * circumference;

  return (
    <div style={{ position: "relative", width: 120, height: 120, margin: "0 auto" }}>
      <svg width="120" height="120" viewBox="0 0 100 100">
        {/* Background Track */}
        <circle cx="50" cy="50" r={radius} fill="none" stroke={T.border} strokeWidth="8" />
        {/* Progress Bar */}
        <circle
          cx="50" cy="50" r={radius} fill="none"
          stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 22, fontWeight: 900, color: T.text }}>{value === Infinity ? "∞" : value.toFixed(1)}</span>
        <span style={{ fontSize: 9, color: T.mute, fontWeight: 600 }}>MONTHS</span>
      </div>
    </div>
  );
};

const CashFlowWave = ({ data, color = T.amber }) => {
  const width = 300;
  const height = 120;
  const padding = 20;

  const maxVal = Math.max(...data.map(d => d.value), 1);
  const minVal = Math.min(...data.map(d => d.value), 0);
  const range = maxVal - minVal || 1;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
    const y = height - ((d.value - minVal) / range) * (height - padding * 2) - padding;
    return `${x},${y}`;
  }).join(" ");

  const areaPoints = `${points} ${width - padding},${height} ${padding},${height}`;

  return (
    <div style={{ width: "100%", height: height, marginTop: 10 }}>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Area */}
        <polyline points={areaPoints} fill="url(#waveGradient)" />
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transition: "all 0.5s ease" }}
        />
        {/* Dots at key points */}
        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
          const y = height - ((d.value - minVal) / range) * (height - padding * 2) - padding;
          return (i % 3 === 0 || i === data.length - 1) && (
            <circle key={i} cx={x} cy={y} r="4" fill={T.bg} stroke={color} strokeWidth="2" />
          );
        })}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "0 10px", marginTop: 4 }}>
        <span style={{ fontSize: 9, color: T.mute }}>{data[0]?.label}</span>
        <span style={{ fontSize: 9, color: T.mute }}>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
};

// ─── COMPONENT ──────────────────────────────────────────────────────────

export const FinancialProjector = ({ grants }) => {
  const [runway, setRunway] = useState({ monthly_expenses: 3000, current_savings: 500, other_income: 0 });
  const [scenario, setScenario] = useState("expected");

  const awarded = grants.filter(g => ["awarded", "active"].includes(g.stage));
  const pending = grants.filter(g => ["submitted", "under_review"].includes(g.stage));
  const pipeline = grants.filter(g => ["discovered", "researching", "qualifying", "preparing", "drafting", "reviewing"].includes(g.stage));

  const totalAwarded = awarded.reduce((s, g) => s + (g.amount || 0), 0);
  const totalPending = pending.reduce((s, g) => s + (g.amount || 0), 0);
  const totalPipeline = pipeline.reduce((s, g) => s + (g.amount || 0), 0);

  const scenarios = {
      conservative: { winRate: 0.15, label: "CONSERVATIVE", color: T.red, desc: "15% Win Rate" },
      expected: { winRate: 0.30, label: "EXPECTED", color: T.blue, desc: "30% Win Rate" },
      optimistic: { winRate: 0.55, label: "OPTIMISTIC", color: T.green, desc: "55% Win Rate" },
    };

  const sc = scenarios[scenario];
  const projectedFromPending = totalPending * sc.winRate;
  const projectedFromPipeline = totalPipeline * sc.winRate * 0.5;
  const totalProjected = totalAwarded + projectedFromPending + projectedFromPipeline;
  const monthlyBurn = Math.max(runway.monthly_expenses - runway.other_income, 0);

  const currentRunway = monthlyBurn > 0 ? runway.current_savings / monthlyBurn : 24;
  const projectedRunway = monthlyBurn > 0 ? (runway.current_savings + totalProjected) / monthlyBurn : 24;

  const monthlyProjection = useMemo(() => {
    const months = [];
    let balance = runway.current_savings;
    const monthlyGrant = totalProjected / 12;
    for (let i = 0; i < 12; i++) {
      balance = balance - monthlyBurn + monthlyGrant;
        months.push({ label: `M${i + 1}`, value: Math.max(balance, 0) });
      }
      return months;
    }, [runway, totalProjected, monthlyBurn]);

  return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gridTemplateRows: "auto auto", gap: 16 }}>

        {/* 1. RUNWAY RADIAL (Bento Block A) */}
        <Card glow shadow style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, background: `linear-gradient(180deg, ${T.card}, ${T.bg})` }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: T.mute, letterSpacing: 1.5, marginBottom: 20 }}>PROJECTED RUNWAY</div>
          <RunwayRadial value={projectedRunway} color={sc.color} />
          <div style={{ marginTop: 20, textAlign: "center" }}>
            <div style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>{fmt(totalProjected)} Pipeline Value</div>
            <div style={{ fontSize: 10, color: T.mute }}>Based on {sc.label} scenario</div>
          </div>
        </Card>

        {/* 2. CASH FLOW WAVE (Bento Block B) */}
        <Card style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: T.mute, letterSpacing: 1.5 }}>CASH FLOW FORECAST</div>
            <Badge color={T.blue}>12 MONTHS</Badge>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: T.text }}>{fmt(monthlyProjection[11].value)}</div>
          <div style={{ fontSize: 10, color: T.mute, marginBottom: 8 }}>Estimated EOY Balance</div>
          <CashFlowWave data={monthlyProjection} color={sc.color} />
        </Card>

        {/* 3. SCENARIO CONTROL (Bento Block C) */}
        <Card style={{ padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: T.mute, letterSpacing: 1.5, marginBottom: 16 }}>RISK ARCHITECTURE</div>

          <div style={{ display: "flex", background: T.panel, padding: 4, borderRadius: 8, marginBottom: 20 }}>
            {Object.entries(scenarios).map(([key, s]) => (
                      <button
                        key={key}
                        onClick={() => setScenario(key)}
                        style={{
                          flex: 1, padding: "8px 0", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 10, fontWeight: 700,
                          background: scenario === key ? s.color : "transparent",
                          color: scenario === key ? T.bg : T.mute,
                          transition: "0.2s"
                        }}
                      >
                        {s.label}
                      </button>
                    ))}
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.sub, marginBottom: 4 }}>
                <span>MONTHLY BURN</span>
                <span style={{ fontWeight: 700, color: T.text }}>{fmt(monthlyBurn)}</span>
              </div>
              <Input type="number" value={runway.monthly_expenses} onChange={v => setRunway({ ...runway, monthly_expenses: Number(v) })} style={{ height: 32, fontSize: 12 }} />
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.sub, marginBottom: 4 }}>
                <span>LIQUID RESERVES</span>
                <span style={{ fontWeight: 700, color: T.text }}>{fmt(runway.current_savings)}</span>
              </div>
              <Input type="number" value={runway.current_savings} onChange={v => setRunway({ ...runway, current_savings: Number(v) })} style={{ height: 32, fontSize: 12 }} />
            </div>
          </div>
        </Card>

        {/* 4. GRANT PIPELINE (Bento Block D) */}
        <Card style={{ padding: 20, overflow: "hidden" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: T.mute, letterSpacing: 1.5, marginBottom: 12 }}>PROBABILISTIC PIPELINE</div>
          <div style={{ display: "grid", gap: 8, maxHeight: 220, overflowY: "auto", paddingRight: 4 }}>
            {[...pending, ...pipeline].slice(0, 5).map(g => {
              const prob = pending.includes(g) ? sc.winRate : sc.winRate * 0.5;
              return (
                          <div key={g.id} style={{ padding: 10, background: T.panel, borderRadius: 8, border: `1px solid ${T.border}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                              <span style={{ fontSize: 11, fontWeight: 600, color: T.text }}>{g.title?.slice(0, 25)}...</span>
                              <span style={{ fontSize: 11, fontWeight: 700, color: sc.color }}>{fmt(g.amount * prob)}</span>
                            </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Progress value={prob * 100} color={sc.color} height={4} />
                            <span style={{ fontSize: 9, color: T.mute, minWidth: 25 }}>{pct(prob * 100)}</span>
                          </div>
                        </div>
                      );
                    })}
            {pending.length + pipeline.length === 0 && (
              <div style={{ textAlign: "center", padding: 40, fontSize: 12, color: T.dim }}>No active pipeline found.</div>
            )}
          </div>
        </Card>

      </div>
    );
};

