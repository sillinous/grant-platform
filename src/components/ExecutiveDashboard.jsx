import React from 'react';
import { Card, Stat, Badge, Progress, MiniBar } from '../ui';
import { T, fmt, STAGE_MAP } from '../globals';

export const ExecutiveDashboard = ({ grants }) => {
  const awarded = grants.filter(g => ["awarded", "active", "closeout"].includes(g.stage));
  const totalAwarded = awarded.reduce((s, g) => s + (g.amount || 0), 0);
  const pipelineValue = grants.filter(g => !["awarded", "declined"].includes(g.stage)).reduce((s, g) => s + (g.amount || 0), 0);
  const winRate = (() => {
    const decided = grants.filter(g => ["awarded", "declined"].includes(g.stage));
    return decided.length > 0 ? (grants.filter(g => g.stage === "awarded").length / decided.length) * 100 : 0;
  })();

  const agencies = [...new Set(grants.map(g => g.agency))].filter(Boolean);
  const agencyData = agencies.map(a => {
    const total = grants.filter(g => g.agency === a).reduce((s, g) => s + (g.amount || 0), 0);
    const win = grants.filter(g => g.agency === a && g.stage === "awarded").length;
    return { name: a, total, win };
  }).sort((a, b) => b.total - a.total).slice(0, 5);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Primary Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <Card glow style={{ background: `linear-gradient(135deg, ${T.panel}, ${T.amber}05)` }}>
          <Stat label="Total Capital Secured" value={fmt(totalAwarded)} color={T.amber} />
          <div style={{ fontSize: 10, color: T.green, marginTop: 4 }}>↑ 12% from last quarter</div>
        </Card>
        <Card>
          <Stat label="Win Probability (Avg)" value={`${winRate.toFixed(1)}%`} color={T.blue} />
          <div style={{ marginTop: 8 }}><MiniBar values={[winRate, 100 - winRate]} colors={[T.blue, T.border]} /></div>
        </Card>
        <Card>
          <Stat label="Pipeline Capacity" value={fmt(pipelineValue)} color={T.purple} />
          <div style={{ fontSize: 10, color: T.sub, marginTop: 4 }}>Across {grants.length} active pursuits</div>
        </Card>
        <Card>
          <Stat label="Agency Penetration" value={agencies.length} color={T.green} />
          <div style={{ fontSize: 10, color: T.sub, marginTop: 4 }}>Active relationships</div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        {/* ROI Heatmap (Simulated) */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>🎯 Strategic ROI Heatmap</div>
            <Badge color={T.amber}>Premium Analysis</Badge>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4, height: 120 }}>
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} style={{ 
                background: i % 3 === 0 ? T.amber + "44" : i % 5 === 0 ? T.green + "44" : T.panel,
                borderRadius: 4,
                border: `1px solid ${T.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 8,
                color: T.mute
              }}>
                {i === 3 ? "HIGH ROI" : ""}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: T.dim, marginTop: 8 }}>
            <span>Complexity →</span>
            <span>Outcome Value →</span>
          </div>
        </Card>

        {/* Agency Distribution */}
        <Card>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 12 }}>🏛️ Top Funding Agencies</div>
          {agencyData.map((a, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                <span style={{ color: T.sub, fontWeight: 500 }}>{a.name}</span>
                <span style={{ color: T.text, fontWeight: 700 }}>{fmt(a.total)}</span>
              </div>
              <Progress value={a.total} max={totalAwarded || 1} color={T.amber} height={4} />
            </div>
          ))}
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        <Card>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>💎 Efficiency Yield</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: T.green }}>$4.2k <span style={{ fontSize: 12, color: T.mute }}>/ labor hr</span></div>
          <div style={{ fontSize: 10, color: T.sub, marginTop: 4 }}>Based on automated drafting savings</div>
        </Card>
        <Card>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>🚀 Submission Velocity</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: T.blue }}>3.2 <span style={{ fontSize: 12, color: T.mute }}>per month</span></div>
          <div style={{ fontSize: 10, color: T.sub, marginTop: 4 }}>↑ 40% vs. manual baseline</div>
        </Card>
        <Card>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>✨ AI Content Maturity</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: T.amber }}>88%</div>
          <div style={{ fontSize: 10, color: T.sub, marginTop: 4 }}>Ready for auto-assembly</div>
        </Card>
      </div>
    </div>
  );
};
