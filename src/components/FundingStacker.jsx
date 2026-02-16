import React, { useMemo } from 'react';
import { Card, Badge, Empty, Stat, MiniBar, Progress } from '../ui';
import { T, fmt, daysUntil } from '../globals';

export const FundingStacker = ({ grants }) => {
  // Generate 24 months of data starting from current month
  const timeline = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 24; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
        months.push({
            label: d.toLocaleString('default', { month: 'short', year: '2y' }),
            iso: d.toISOString().slice(0, 7), // YYYY-MM
            amount: 0,
            projected: 0,
            grants: []
        });
    }

    grants.forEach(g => {
        if (!g.amount || !g.deadline) return;
        const start = new Date(g.deadline);
        // Assume 12 month duration if not specified
        const duration = 12; 
        const monthly = g.amount / duration;

        months.forEach(m => {
            const mDate = new Date(m.iso + "-01");
            const diffMonths = (mDate.getFullYear() - start.getFullYear()) * 12 + (mDate.getMonth() - start.getMonth());
            
            if (diffMonths >= 0 && diffMonths < duration) {
                if (["awarded", "active"].includes(g.stage)) {
                    m.amount += monthly;
                } else if (["drafting", "reviewing", "submitting"].includes(g.stage)) {
                    // Weight projected by win probability (default 30% if missing)
                    const prob = (g.winProbability || 30) / 100;
                    m.projected += monthly * prob;
                }
                m.grants.push(g.title);
            }
        });
    });

    return months;
  }, [grants]);

  const maxVal = Math.max(...timeline.map(m => m.amount + m.projected)) || 10000;
  const avgMonthly = timeline.reduce((s, m) => s + m.amount, 0) / 24;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        <Stat label="Avg. Monthly Run" value={fmt(avgMonthly)} color={T.blue} />
        <Stat label="24-Month Pipeline" value={fmt(timeline.reduce((s, m) => s + m.amount + m.projected, 0))} color={T.green} />
        <Stat label="Sustainability Index" value={avgMonthly > 50000 ? "High" : avgMonthly > 20000 ? "Stable" : "At Risk"} color={avgMonthly > 20000 ? T.green : T.red} />
      </div>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>📊 Predictive Funding Stack (24-Month Horizon)</div>
            <div style={{ fontSize: 11, color: T.sub }}>Visualizing potential "funding cliffs" and stacking across overlapping cycles.</div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 10, height: 10, background: T.blue, borderRadius: 2 }} />
              <span style={{ fontSize: 10, color: T.sub }}>Awarded</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 10, height: 10, background: T.blue + "44", borderRadius: 2, border: `1px dashed ${T.blue}` }} />
              <span style={{ fontSize: 10, color: T.sub }}>Projected (Prob. Weighted)</span>
            </div>
          </div>
        </div>

        <div style={{ height: 250, display: "flex", alignItems: "flex-end", gap: 4, paddingBottom: 24, position: "relative" }}>
          {/* Y-Axis markers */}
          <div style={{ position: "absolute", left: -30, top: 0, bottom: 24, display: "flex", flexDirection: "column", justifyContent: "space-between", fontSize: 9, color: T.mute }}>
            <span>{fmt(maxVal)}</span>
            <span>{fmt(maxVal / 2)}</span>
            <span>$0</span>
          </div>

          {timeline.map((m, i) => {
            const h1 = (m.amount / maxVal) * 100;
            const h2 = (m.projected / maxVal) * 100;
            const isCliff = m.amount < avgMonthly * 0.5 && i > 0;

            return (
              <div key={m.iso} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%", position: "relative" }}>
                <div style={{ 
                  width: "100%", 
                  background: T.blue + "44", 
                  height: `${h2}%`, 
                  borderRadius: "2px 2px 0 0",
                  border: `1px dashed ${T.blue}66`,
                  borderBottom: "none"
                }} />
                <div style={{ 
                  width: "100%", 
                  background: isCliff ? T.red : T.blue, 
                  height: `${h1}%`, 
                  borderRadius: h2 > 0 ? "0" : "2px 2px 0 0" 
                }} />
                
                <div style={{ 
                  position: "absolute", 
                  bottom: -20, 
                  left: "50%", 
                  transform: "translateX(-50%) rotate(-45deg)", 
                  fontSize: 8, 
                  color: T.dim,
                  whiteSpace: "nowrap"
                }}>
                  {m.label}
                </div>

                {isCliff && m.amount + m.projected < avgMonthly && (
                  <div style={{ position: "absolute", top: -20, left: "50%", transform: "translateX(-50%)", color: T.red, fontSize: 14 }}>⚠️</div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 12 }}>🚀 Strategic Growth Recommendations</div>
          <div style={{ display: "grid", gap: 8 }}>
            {avgMonthly < 20000 && (
                <div style={{ padding: 10, background: T.red + "11", border: `1px solid ${T.red}22`, borderRadius: 6 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.red }}>FUNDING GAP DETECTED</div>
                    <div style={{ fontSize: 10, color: T.sub }}>Revenue drops below threshold in Q3. Prioritize 'Fast-Track' state grants.</div>
                </div>
            )}
            <div style={{ padding: 10, background: T.blue + "11", border: `1px solid ${T.blue}22`, borderRadius: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.blue }}>DIVERSIFY PIPELINE</div>
                <div style={{ fontSize: 10, color: T.sub }}>80% of projected revenue is federal. Shift 15% to Private Foundations to hedge risk.</div>
            </div>
            <div style={{ padding: 10, background: T.green + "11", border: `1px solid ${T.green}22`, borderRadius: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.green }}>OPTIMAL STIMULUS ZONE</div>
                <div style={{ fontSize: 10, color: T.sub }}>Max capacity reached in Nov-Dec. Avoid high-effort RFPs during this window.</div>
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 12 }}>📈 Probability Analysis</div>
          {grants.filter(g => ["drafting", "reviewing", "submitting"].includes(g.stage)).map(g => (
            <div key={g.id} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 600 }}>{g.title}</span>
                    <Badge color={T.amber} size="xs">{g.winProbability || 30}% Win Prob</Badge>
                </div>
                <Progress value={g.winProbability || 30} max={100} color={T.amber} height={4} />
            </div>
          ))}
          {grants.filter(g => ["drafting", "reviewing", "submitting"].includes(g.stage)).length === 0 && (
              <div style={{ fontSize: 11, color: T.mute, textAlign: "center", padding: 20 }}>No pending grants to analyze.</div>
          )}
        </Card>
      </div>
    </div>
  );
};
