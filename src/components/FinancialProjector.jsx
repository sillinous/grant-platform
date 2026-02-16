import React, { useState, useMemo } from 'react';
import { Card, Stat, Btn, Input, Progress, MiniBar } from '../ui';
import { T, fmt, pct, PROFILE, STAGE_MAP } from '../globals';

export const FinancialProjector = ({ grants }) => {
  const [runway, setRunway] = useState({ monthly_expenses: 3000, current_savings: 500, other_income: 0 });
  const [scenario, setScenario] = useState("expected");

  const awarded = grants.filter(g => ["awarded", "active"].includes(g.stage));
  const pending = grants.filter(g => ["submitted", "under_review"].includes(g.stage));
  const pipeline = grants.filter(g => ["discovered", "researching", "qualifying", "preparing", "drafting", "reviewing"].includes(g.stage));

  const totalAwarded = awarded.reduce((s, g) => s + (g.amount || 0), 0);
  const totalPending = pending.reduce((s, g) => s + (g.amount || 0), 0);
  const totalPipeline = pipeline.reduce((s, g) => s + (g.amount || 0), 0);

  // Scenario modeling
  const scenarios = {
    conservative: { winRate: 0.15, label: "Conservative (15% win rate)", color: T.red },
    expected: { winRate: 0.30, label: "Expected (30% win rate)", color: T.yellow },
    optimistic: { winRate: 0.50, label: "Optimistic (50% win rate)", color: T.green },
  };

  const sc = scenarios[scenario];
  const projectedFromPending = totalPending * sc.winRate;
  const projectedFromPipeline = totalPipeline * sc.winRate * 0.5; // pipeline is less certain
  const totalProjected = totalAwarded + projectedFromPending + projectedFromPipeline;
  const monthlyBurn = runway.monthly_expenses - runway.other_income;
  const currentRunway = monthlyBurn > 0 ? runway.current_savings / monthlyBurn : Infinity;
  const projectedRunway = monthlyBurn > 0 ? (runway.current_savings + totalProjected) / monthlyBurn : Infinity;

  // 12-month projection
  const monthlyProjection = useMemo(() => {
    const months = [];
    let balance = runway.current_savings;
    const monthlyGrant = totalProjected / 12;
    for (let i = 0; i < 12; i++) {
      balance = balance - monthlyBurn + monthlyGrant;
      months.push({ month: i + 1, label: `M${i + 1}`, balance: Math.max(balance, 0), value: Math.max(balance, 0) });
    }
    return months;
  }, [runway, totalProjected, monthlyBurn]);

  // Business allocation
  const bizAllocation = PROFILE.businesses.filter(b => b.st === "active").map(b => ({
    name: b.n, sector: b.sec,
    suggestedAllocation: totalProjected / PROFILE.businesses.filter(b2 => b2.st === "active").length,
  }));

  return (
    <div>
      {/* Summary Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8, marginBottom: 16 }}>
        <Card glow><Stat label="Awarded" value={fmt(totalAwarded)} color={T.green} /></Card>
        <Card><Stat label="Pending" value={fmt(totalPending)} color={T.yellow} sub={`${pending.length} applications`} /></Card>
        <Card><Stat label="Pipeline" value={fmt(totalPipeline)} color={T.blue} sub={`${pipeline.length} opportunities`} /></Card>
        <Card><Stat label="Projected Total" value={fmt(totalProjected)} color={T.amber} sub={sc.label} /></Card>
      </div>

      {/* Scenario Selector */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>🎲 Scenario Modeling</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {Object.entries(scenarios).map(([key, s]) => (
            <Btn key={key} size="sm" variant={scenario === key ? "primary" : "default"} onClick={() => setScenario(key)} style={{ borderColor: s.color + "44" }}>{s.label}</Btn>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ fontSize: 10, color: T.mute, display: "block", marginBottom: 4 }}>Monthly Expenses</label>
            <Input type="number" value={runway.monthly_expenses} onChange={v => setRunway({ ...runway, monthly_expenses: Number(v) })} />
          </div>
          <div>
            <label style={{ fontSize: 10, color: T.mute, display: "block", marginBottom: 4 }}>Current Savings</label>
            <Input type="number" value={runway.current_savings} onChange={v => setRunway({ ...runway, current_savings: Number(v) })} />
          </div>
          <div>
            <label style={{ fontSize: 10, color: T.mute, display: "block", marginBottom: 4 }}>Other Monthly Income</label>
            <Input type="number" value={runway.other_income} onChange={v => setRunway({ ...runway, other_income: Number(v) })} />
          </div>
        </div>
      </Card>

      {/* Runway Analysis */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>🛤️ Runway Analysis</div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: T.sub }}>Current Runway</span>
              <span style={{ color: currentRunway < 3 ? T.red : T.green, fontWeight: 600 }}>{currentRunway === Infinity ? "∞" : `${currentRunway.toFixed(1)} months`}</span>
            </div>
            <Progress value={Math.min(currentRunway, 24)} max={24} color={currentRunway < 3 ? T.red : currentRunway < 6 ? T.yellow : T.green} />
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: T.sub }}>Projected Runway</span>
              <span style={{ color: T.green, fontWeight: 600 }}>{projectedRunway === Infinity ? "∞" : `${projectedRunway.toFixed(1)} months`}</span>
            </div>
            <Progress value={Math.min(projectedRunway, 24)} max={24} color={T.green} />
          </div>
          <div style={{ fontSize: 11, color: T.mute, marginTop: 8 }}>Monthly burn: {fmt(monthlyBurn)}/mo</div>
        </Card>

        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 8 }}>📊 12-Month Cash Flow</div>
          <MiniBar data={monthlyProjection} height={100} color={T.amber} />
        </Card>
      </div>

      {/* Business Allocation */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>🏢 Suggested Business Allocation</div>
        {bizAllocation.map((b, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
            <div>
              <div style={{ fontSize: 12, color: T.text }}>{b.name}</div>
              <div style={{ fontSize: 10, color: T.mute }}>{b.sector}</div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.amber }}>{fmt(b.suggestedAllocation)}</div>
          </div>
        ))}
      </Card>

      {/* Grant-Level Projections */}
      <Card>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>📋 Grant-Level Projections</div>
        {[...awarded, ...pending, ...pipeline].map(g => {
          const probability = awarded.some(a => a.id === g.id) ? 1 : pending.some(p => p.id === g.id) ? sc.winRate : sc.winRate * 0.5;
          return (
            <div key={g.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: T.text }}>{g.title?.slice(0, 40)}</div>
                <div style={{ fontSize: 10, color: T.mute }}>{STAGE_MAP[g.stage]?.label}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.green }}>{fmt(g.amount || 0)}</div>
                <div style={{ fontSize: 10, color: probability === 1 ? T.green : T.mute }}>{pct(probability * 100)} likely → {fmt((g.amount || 0) * probability)}</div>
              </div>
            </div>
          );
        })}
        {grants.length === 0 && <div style={{ color: T.mute, fontSize: 12 }}>Add grants to see financial projections</div>}
      </Card>
    </div>
  );
};

