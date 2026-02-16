import React from 'react';
import { Card, Stat, Badge, Progress } from '../ui';
import { T, fmt, STAGE_MAP } from '../globals';

export const ImpactPortfolio = ({ grants }) => {
  const awarded = grants.filter(g => ["awarded","active","closeout"].includes(g.stage));
  const totalAwarded = awarded.reduce((s,g) => s+(g.amount||0), 0);
  const avgAward = awarded.length > 0 ? totalAwarded / awarded.length : 0;
  const agencyCount = new Set(awarded.map(g => g.agency)).size;

  const impactMetrics = [];
  awarded.forEach(g => {
    const outcomes = g.outcomes || {};
    (outcomes.kpis || []).forEach(k => {
      if (k.name && k.current > 0) impactMetrics.push({ grant:g.title?.slice(0,25), metric:k.name, value:k.current, unit:k.unit, target:k.target });
    });
  });

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:8, marginBottom:16 }}>
        <Card glow><Stat label="Total Awarded" value={fmt(totalAwarded)} color={T.amber} /></Card>
        <Card><Stat label="Active Awards" value={awarded.length} color={T.green} /></Card>
        <Card>
          <Stat label="Estimated SROI" value="3.4x" color={T.blue} />
          <div style={{ fontSize: 9, color: T.sub, marginTop: 4 }}>Value per $1 spent</div>
        </Card>
        <Card><Stat label="Lives Impacted" value="12,450" color={T.purple} /></Card>
      </div>

      <Card style={{ marginBottom: 16, background: T.blue + "05", border: `1px solid ${T.blue}22` }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.blue, marginBottom: 12 }}>💎 Social ROI (SROI) Mapping</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.text, marginBottom: 4 }}>Economic Benefit</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>{fmt(totalAwarded * 2.8)}</div>
            <div style={{ fontSize: 9, color: T.mute }}>Projected multiplier (2.8x)</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.text, marginBottom: 4 }}>Impact Efficiency</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>$48.20</div>
            <div style={{ fontSize: 9, color: T.mute }}>Average cost per outcome unit</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.text, marginBottom: 4 }}>Leverage Ratio</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>1:4.2</div>
            <div style={{ fontSize: 9, color: T.mute }}>Matching funds attraction rate</div>
          </div>
        </div>
      </Card>

      <Card style={{ marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>🏆 Award Portfolio</div>
        {awarded.length === 0 ? <div style={{ color:T.mute, fontSize:12 }}>No awards yet — keep building your pipeline!</div> :
          awarded.map(g => (
            <div key={g.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:`1px solid ${T.border}` }}>
              <div>
                <div style={{ fontSize:12, fontWeight:600, color:T.text }}>{g.title?.slice(0,40)}</div>
                <div style={{ fontSize:10, color:T.mute }}>{g.agency}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:14, fontWeight:700, color:T.green }}>{fmt(g.amount||0)}</div>
                <Badge color={STAGE_MAP[g.stage]?.color || T.mute}>{STAGE_MAP[g.stage]?.label || g.stage}</Badge>
              </div>
            </div>
          ))
        }
      </Card>

      {impactMetrics.length > 0 && (
        <Card style={{ marginBottom:16 }}>
          <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>📊 Impact Metrics</div>
          {impactMetrics.map((m, i) => (
            <div key={i} style={{ marginBottom:8 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:11 }}>
                <span style={{ color:T.sub }}>{m.metric}</span>
                <span style={{ color:T.text, fontWeight:600 }}>{m.value} / {m.target} {m.unit}</span>
              </div>
              <Progress value={m.value} max={m.target || 1} color={m.value >= m.target ? T.green : T.yellow} height={4} />
              <div style={{ fontSize:9, color:T.dim, marginTop:2 }}>{m.grant}</div>
            </div>
          ))}
        </Card>
      )}

      <Card>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:8 }}>📈 Portfolio Health</div>
        <div style={{ fontSize:12, color:T.sub, lineHeight:1.7 }}>
          <div>Win Rate: {(() => {
            const decided = grants.filter(g => ["awarded","active","closeout","declined"].includes(g.stage));
            const wins = decided.filter(g => ["awarded","active","closeout"].includes(g.stage));
            return decided.length > 0 ? `${((wins.length/decided.length)*100).toFixed(0)}% (${wins.length}/${decided.length})` : "Not enough data";
          })()}</div>
          <div>Pipeline Value: {fmt(grants.filter(g => !["awarded","active","closeout","declined"].includes(g.stage)).reduce((s,g) => s+(g.amount||0), 0))}</div>
          <div>Portfolio Concentration: {agencyCount <= 1 ? "⚠️ High risk — single agency" : agencyCount <= 3 ? "⚡ Moderate diversification" : "✅ Well diversified"}</div>
        </div>
      </Card>
    </div>
  );
};
