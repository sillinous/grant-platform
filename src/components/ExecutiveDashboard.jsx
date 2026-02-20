import React, { useState } from 'react';
import { Card, Stat, Btn, Progress, Badge, MiniBar, Icon } from '../ui';
import { T, fmt, STAGE_MAP } from '../globals';
import { useStore } from '../store';
import { StrategyModeler } from './StrategyModeler';

export const ExecutiveDashboard = () => {
  const { grants } = useStore();
  const [boardReady, setBoardReady] = React.useState(false);
  const [showForecast, setShowForecast] = React.useState(false);

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

  if (boardReady) {
    return (
      <div style={{ background: T.bg, padding: 32, borderRadius: 12, border: `1px solid ${T.border}`, maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: T.text }}>Executive Impact One-Slider</div>
            <div style={{ fontSize: 14, color: T.sub }}>Quarterly Portfolio Performance & Strategic Outlook</div>
          </div>
          <Btn variant="ghost" size="sm" onClick={() => setBoardReady(false)}>Exit Presentation</Btn>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 40 }}>
          <Stat label="Capital Secured" value={fmt(totalAwarded)} color={T.amber} size="lg" />
          <Stat label="Win Rate" value={`${winRate.toFixed(0)}%`} color={T.blue} size="lg" />
          <Stat label="Pipeline Value" value={fmt(pipelineValue)} color={T.purple} size="lg" />
          <Stat label="Active Agencies" value={agencies.length} color={T.green} size="lg" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
          <Card style={{ background: T.panel + "66" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 16 }}>Funding Distribution</div>
            {agencyData.map((a, i) => (
              <div key={i} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                  <span>{a.name}</span>
                  <span style={{ fontWeight: 700 }}>{fmt(a.total)}</span>
                </div>
                <Progress value={a.total} max={totalAwarded || 1} color={T.amber} height={8} />
              </div>
            ))}
          </Card>
          <Card style={{ background: T.panel + "66" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 16 }}>Strategic Momentum</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ padding: 16, background: T.bg, borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: T.sub, textTransform: "uppercase" }}>Efficiency Yield</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: T.green }}>$4,200/hr</div>
              </div>
              <div style={{ padding: 16, background: T.bg, borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: T.sub, textTransform: "uppercase" }}>Submission Rate</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: T.blue }}>3.2/mo</div>
              </div>
            </div>
            <div style={{ marginTop: 20, fontSize: 12, color: T.dim, fontStyle: "italic", lineHeight: 1.6 }}>
              "The transition to AI-augmented workflows has increased submission velocity by 40% while maintaining an 88% content maturity score."
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Primary Metrics */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: -8, gap: 12 }}>
        <Btn variant="ghost" size="xs" onClick={() => setShowForecast(!showForecast)} icon={<Icon name="chart" />}>
          {showForecast ? "📊 Show Overview" : "🔮 Strategic Forecast"}
        </Btn>
        <Btn variant="ghost" size="xs" onClick={() => setBoardReady(true)}>📺 Board-Ready View</Btn>
      </div>

      {showForecast ? (
        <StrategyModeler grants={grants} />
      ) : (
        <React.Fragment>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
            <Card glow style={{ background: `linear-gradient(135deg, ${T.panel}, ${T.amber}05)` }}>
              <Stat label="Total Capital Secured" value={fmt(totalAwarded)} color={T.amber} />
              <div style={{ fontSize: 10, color: T.green, marginTop: 4 }}>↑ 12% from last quarter</div>
            </Card>
            <Card>
                <Stat label="Win Probability" value={`${winRate.toFixed(1)}%`} color={T.blue} />
                <div style={{ marginTop: 8 }}><MiniBar values={[winRate, 100 - winRate]} colors={[T.blue, T.border]} /></div>
              </Card>
              <Card>
                <Stat label="Pipeline Capacity" value={fmt(pipelineValue)} color={T.purple} />
                <div style={{ fontSize: 10, color: T.sub, marginTop: 4 }}>Across {grants.length} active pursuits</div>
              </Card>
              <Card>
                <Stat label="Autonomous Throughput" value={grants.filter(g => g.stage === "submitted").length} color={T.green} />
                <div style={{ fontSize: 10, color: T.green, marginTop: 4 }}>{fmt(grants.filter(g => g.stage === "submitted").reduce((s, g) => s + (g.amount || 0), 0))} WIP Capital</div>
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

                <div style={{ position: "relative", height: 180, background: T.panel, borderRadius: 8, border: `1px solid ${T.border}`, overflow: "hidden" }}>
                  {/* Quadrant Labels */}
                  <div style={{ position: "absolute", top: 10, left: 10, fontSize: 10, color: T.green, fontWeight: 700, opacity: 0.6 }}>QUICK WINS</div>
                  <div style={{ position: "absolute", top: 10, right: 10, fontSize: 10, color: T.blue, fontWeight: 700, opacity: 0.6 }}>MOONSHOTS</div>
                  <div style={{ position: "absolute", bottom: 10, left: 10, fontSize: 10, color: T.sub, fontWeight: 700, opacity: 0.6 }}>CORE FUNDING</div>
                  <div style={{ position: "absolute", bottom: 10, right: 10, fontSize: 10, color: T.amber, fontWeight: 700, opacity: 0.6 }}>DIVERSIFICATION</div>

                  {/* Grid Lines */}
                  <div style={{ position: "absolute", inset: 0, display: "flex", pointerEvents: "none" }}>
                    <div style={{ flex: 1, borderRight: `1px dashed ${T.border}` }} />
                    <div style={{ flex: 1 }} />
                  </div>
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", pointerEvents: "none" }}>
                    <div style={{ flex: 1, borderBottom: `1px dashed ${T.border}` }} />
                    <div style={{ flex: 1 }} />
                  </div>

                  {/* Data Points */}
                  {grants.filter(g => g.amount).map((g, i) => {
                  const complexity = 20 + ((STAGE_MAP[g.stage]?.level || 1) * 10);
                  const valueScore = Math.min(100, (Math.log10(g.amount || 1000) - 3) * 25);
                  return (
                    <div
                      key={g.id}
                      title={`${g.title}\nValue: ${fmt(g.amount)}\nROI: ${valueScore.toFixed(0)}%`}
                      style={{
                        position: "absolute",
                        left: `${complexity}%`,
                        bottom: `${valueScore}%`,
                        width: 12,
                        height: 12,
                        background: valueScore > 60 ? T.green : valueScore > 30 ? T.amber : T.blue,
                        borderRadius: "50%",
                        border: `2px solid ${T.text}`,
                        boxShadow: `0 0 10px ${T.text}33`,
                        cursor: "help",
                        transform: "translate(-50%, 50%)",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                      }}
                    />
                  );
                })}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: T.dim, marginTop: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 6, height: 6, background: T.border, border: `1px solid ${T.dim}`, borderRadius: "50%" }} />
                    Complexity (Low → High)
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    Value (Low → High)
                    <span style={{ width: 6, height: 6, background: T.border, border: `1px solid ${T.dim}`, borderRadius: "50%" }} />
                  </div>
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
        </React.Fragment>
      )}
    </div>
  );
};
