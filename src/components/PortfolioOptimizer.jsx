import { Card, Stat, Badge, Progress, MiniBar, Btn } from '../ui';
import { T, fmt, daysUntil, STAGES, PROFILE } from '../globals';
import { API } from '../api';

export const PortfolioOptimizer = ({ grants }) => {
  const [loading, setLoading] = React.useState(false);
  const [simResults, setSimResults] = React.useState(null);
  const active = grants.filter(g => !["declined","closeout"].includes(g.stage));
  const byStage = STAGES.map(s => ({ stage: s, grants: grants.filter(g => g.stage === s.id), total: grants.filter(g => g.stage === s.id).reduce((sum,g)=>sum+(g.amount||0),0) })).filter(x => x.grants.length > 0);
  const byAgency = {};
  grants.forEach(g => { const a = g.agency || "Unknown"; byAgency[a] = (byAgency[a]||0) + 1; });
  const agencyEntries = Object.entries(byAgency).sort((a,b) => b[1] - a[1]);

  const risks = [];
  if (active.filter(g => g.deadline && daysUntil(g.deadline) <= 7 && daysUntil(g.deadline) >= 0).length > 2) risks.push({ level:"high", msg:"3+ deadlines in the next 7 days — risk of quality issues" });
  if (agencyEntries.length === 1 && grants.length > 2) risks.push({ level:"medium", msg:"All grants from one agency — diversify funding sources" });
  if (grants.filter(g => g.stage === "discovered").length > 10) risks.push({ level:"low", msg:"10+ discovered grants not progressing — consider qualifying or removing" });
  if (active.filter(g => !g.deadline).length > 3) risks.push({ level:"medium", msg:"Multiple grants without deadlines — add dates for better planning" });
  const awarded = grants.filter(g=>["awarded","active","closeout"].includes(g.stage));
  const declined = grants.filter(g=>g.stage==="declined");
  if (declined.length > awarded.length * 3 && declined.length > 5) risks.push({ level:"high", msg:"High decline rate — review targeting strategy" });
  if (active.some(g => (g.amount || 0) > 1000000 && !g.deadline)) risks.push({ level: "high", msg: "Major grant ($1M+) missing deadline — priority risk" });

  // ROA Calculation (Return on Application)
  // Assuming grants have an 'hours' field (effort)
  const hourlyRate = 125; // Default internal rate
  const roaData = awarded.map(g => {
    const hours = g.hours || 20; // fallback mock
    const cost = hours * hourlyRate;
    const yield_val = g.amount / hours;
    const roa = g.amount / cost;
    return { ...g, roa, yield_val };
  }).sort((a, b) => b.roa - a.roa);

  // Cash Flow Forecast
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const forecast = months.map((m, i) => {
    const monthAwarded = awarded.filter(g => g.deadline && new Date(g.deadline).getMonth() === i).reduce((s, g) => s + (g.amount || 0), 0);
    const monthProbabilistic = active.filter(g => g.deadline && new Date(g.deadline).getMonth() === i && g.stage !== "awarded")
      .reduce((s, g) => s + ((g.amount || 0) * (g.matchScore || 50) / 100), 0);
    return { month: m, awarded: monthAwarded, probable: monthProbabilistic };
  });

  const recs = [];
  if (grants.filter(g => g.stage === "drafting").length > 3) recs.push("You have 3+ grants in drafting — consider focusing to improve quality");
  if (grants.filter(g => g.stage === "preparing").length > 5) recs.push("5+ grants preparing — some may stall. Prioritize by deadline and fit score");
  if (awarded.length === 0 && grants.length > 5) recs.push("No awards yet with 5+ grants tracked — review match quality and narrative strength");
  if (agencyEntries.length >= 3) recs.push("Good agency diversification! Continue building multi-source pipeline");

  const getMetrics = () => {
    const total = grants.length;
    if (total === 0) return { diversification: 0, compliance: 0, readiness: 0, impact: 0 };

    // Diversification: based on agency variety
    const agencyCount = Object.keys(byAgency).length;
    const diversification = Math.min((agencyCount / 5) * 100, 100);

    // Compliance: based on grants with deadlines and stages
    const withDeadlines = grants.filter(g => g.deadline).length;
    const compliance = (withDeadlines / total) * 100;

    // Readiness: grants in drafting or final review
    const ready = grants.filter(g => ["drafting", "reviewing", "submitting"].includes(g.stage)).length;
    const readiness = (ready / Math.max(active.length, 1)) * 100;

    // Impact: awarded ratio
    const totalAwarded = awarded.reduce((s, g) => s + (g.amount || 0), 0);
    const totalRequested = grants.reduce((s, g) => s + (g.amount || 0), 0);
    const impact = totalRequested > 0 ? Math.min((totalAwarded / totalRequested) * 500, 100) : 0; // Scaled for visibility

    return { diversification, compliance, readiness, impact };
  };

  const metrics = getMetrics();

  const runSimulation = async () => {
    setLoading(true);
    const context = `
      Portfolio Size: ${grants.length}
      Awarded: ${awarded.length} (${fmt(awarded.reduce((s, g) => s + (g.amount || 0), 0))})
      Active Pipeline: ${active.length}
      Agency Concentration: ${JSON.stringify(agencyEntries)}
      Recent Risks: ${risks.map(r => r.msg).join(", ")}
    `;
    const sys = `You are a Grant Portfolio Strategist. Analyze the following portfolio context.
    Provide 3-4 specific "prescriptive" allocation adjustments to improve ROA and win rate.
    Focus on:
    1. Redirection: Which agency types to move AWAY from.
    2. Doubling Down: Which sectors/agencies have the best yield.
    3. Resource Timing: Where to shift labor (hours).
    
    Return ONLY JSON:
    {
      "prescriptions": [
        { "action": "string", "impact": "string", "urgency": "high|medium|low" }
      ],
      "strategic_focus": "1-sentence overarching strategy"
    }`;

    const res = await API.callAI([{ role: "user", content: context }], sys);
    if (!res.error) {
      try {
        const cleaned = res.text.replace(/```json\n?|```/g, "").trim();
        setSimResults(JSON.parse(cleaned));
      } catch (e) { console.error("Sim parse failed", e); }
    }
    setLoading(false);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
      <div>
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>🎯 Portfolio Risk Radar</div>
            <Badge color={T.amber}>Live Health Metrics</Badge>
          </div>
          <div style={{ display: "flex", justifyContent: "center", padding: "10px 0" }}>
            <RadarChart
              data={[
                { label: "Diversification", value: metrics.diversification },
                { label: "Compliance", value: metrics.compliance },
                { label: "Readiness", value: metrics.readiness },
                { label: "Impact", value: metrics.impact }
              ]}
              size={240}
            />
          </div>
        </Card>

        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>⚠️ Risk Analysis</div>
          {risks.length === 0 ? <div style={{ color: T.green, fontSize: 12 }}>✅ No significant risks detected</div> :
            risks.map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
                <Badge color={r.level === "high" ? T.red : r.level === "medium" ? T.yellow : T.green}>{r.level}</Badge>
                <span style={{ fontSize: 12, color: T.text }}>{r.msg}</span>
              </div>
            ))
          }
        </Card>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>📊 Pipeline Distribution</div>
          <MiniBar data={byStage.map(x => ({ label: x.stage.label.slice(0, 6), value: x.grants.length }))} height={80} color={T.amber} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 4, marginTop: 8 }}>
            {byStage.map(x => (
              <div key={x.stage.id} style={{ display: "flex", justifyContent: "space-between", padding: "2px 4px", fontSize: 10 }}>
                <span style={{ color: x.stage.color }}>{x.stage.icon} {x.stage.label}</span>
                <span style={{ color: T.text }}>{x.grants.length} · {fmt(x.total)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>🏛️ Agency Concentration</div>
          {agencyEntries.map(([agency, count]) => (
            <div key={agency} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 10, color: T.text, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", maxWidth: 120 }} title={agency}>{agency}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Progress value={count} max={Math.max(...agencyEntries.map(x => x[1]))} color={T.blue} height={3} />
                <Badge color={T.blue} size="sm">{count}</Badge>
              </div>
            </div>
          ))}
        </Card>

        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>💡 Recommendations</div>
          {recs.length === 0 ? <div style={{ color: T.mute, fontSize: 12 }}>Add more grants to see portfolio optimization recommendations</div> :
            recs.slice(0, 3).map((r, i) => (
              <div key={i} style={{ padding: "6px 0", borderBottom: `1px solid ${T.border}`, fontSize: 11, color: T.sub }}>💡 {r}</div>
            ))
          }
        </Card>

        <Card style={{ background: T.red + "05", border: `2px dashed ${T.red}22` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.red }}>⛈️ Portfolio Stress Tester</div>
            <Badge color={T.red} size="sm">What-If Simulation</Badge>
          </div>
          <div style={{ fontSize: 11, color: T.sub, marginBottom: 12 }}>Simulate institutional risk and diversify against potential funding shifts.</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {agencyEntries.slice(0, 3).map(([agency, count]) => {
              const totalVal = grants.filter(g => g.agency === agency).reduce((s, g) => s + (g.amount || 0), 0);
              const portfolioPct = (totalVal / Math.max(active.reduce((s, g) => s + (g.amount || 0), 0), 1)) * 100;
              return (
                <div key={agency} style={{ padding: 10, background: T.bg, borderRadius: 6, border: `1px solid ${T.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: T.text }}>{agency}</span>
                    <span style={{ fontSize: 11, color: T.red }}>{portfolioPct.toFixed(0)}% Exposure</span>
                  </div>
                  <div style={{ fontSize: 10, color: T.mute, marginBottom: 8 }}>If this agency cuts funding by 50%:</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, height: 4, background: T.border, borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: `${portfolioPct * 0.5}%`, height: "100%", background: T.red }} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: T.red }}>-{fmt(totalVal * 0.5)}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <Btn variant="primary" size="sm" style={{ width: "100%", marginTop: 12 }} onClick={runSimulation} disabled={loading}>
            {loading ? "⏳ Analyzing..." : "🧠 Run Prescriptive Simulation"}
          </Btn>

          {simResults && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.text, marginBottom: 8 }}>🎯 STRATEGIC ADVISORY</div>
              {simResults.prescriptions.map((p, i) => (
                <div key={i} style={{ padding: 10, background: T.panel, borderRadius: 6, borderLeft: `3px solid ${p.urgency === "high" ? T.red : p.urgency === "medium" ? T.amber : T.blue}`, marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: T.text, textTransform: "uppercase" }}>{p.action}</span>
                    <Badge color={p.urgency === "high" ? T.red : p.urgency === "medium" ? T.amber : T.blue} size="sm">{p.urgency.toUpperCase()}</Badge>
                  </div>
                  <div style={{ fontSize: 10, color: T.sub }}>{p.impact}</div>
                </div>
              ))}
              <div style={{ fontSize: 10, color: T.dim, fontStyle: "italic", marginTop: 4 }}>"{simResults.strategic_focus}"</div>
            </div>
          )}
        </Card>

        {/* New: ROA Leaderboard */}
        <Card style={{ background: `linear-gradient(to bottom right, ${T.panel}, ${T.green}05)` }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>💰 ROA Leaderboard (Return on Application)</div>
          <div style={{ fontSize: 10, color: T.sub, marginBottom: 12 }}>Top performing grants by funding yield per hour of effort.</div>
          {roaData.slice(0, 3).map((g, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.text }}>{g.title.slice(0, 30)}...</div>
                <div style={{ fontSize: 10, color: T.mute }}>{fmt(g.yield_val)} / hr</div>
              </div>
              <Badge color={T.green}>{g.roa.toFixed(1)}x ROI</Badge>
            </div>
          ))}
          {roaData.length === 0 && <div style={{ fontSize: 11, color: T.mute, textAlign: "center", padding: 10 }}>No awarded grants to calculate ROA.</div>}
        </Card>

        {/* New: Cash Flow Forecast */}
        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>📈 12-Month Revenue Forecast</div>
          <div style={{ fontSize: 10, color: T.sub, marginBottom: 16 }}>Probabilistic revenue based on win-score weighting.</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 100, paddingBottom: 20 }}>
            {forecast.map((f, i) => {
              const max = Math.max(...forecast.map(x => x.awarded + x.probable), 100000);
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ width: "100%", position: "relative", height: 80, display: "flex", flexDirection: "column-reverse" }}>
                    <div style={{ height: `${(f.awarded / max) * 100}%`, background: T.green, width: "100%", borderRadius: "2px 2px 0 0" }} title={`Awarded: ${fmt(f.awarded)}`} />
                    <div style={{ height: `${(f.probable / max) * 100}%`, background: T.amber + "66", width: "100%", borderRadius: "2px 2px 0 0", marginBottom: -2 }} title={`Probable: ${fmt(f.probable)}`} />
                  </div>
                  <span style={{ fontSize: 9, color: T.mute }}>{f.month}</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 8, height: 8, background: T.green, borderRadius: 2 }} />
              <span style={{ fontSize: 9, color: T.sub }}>Awarded</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 8, height: 8, background: T.amber + "66", borderRadius: 2 }} />
              <span style={{ fontSize: 9, color: T.sub }}>Weighted Probable</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

const RadarChart = ({ data, size }) => {
  const center = size / 2;
  const radius = (size / 2) - 40;
  const angleStep = (Math.PI * 2) / data.length;

  const points = data.map((d, i) => {
    const r = (d.value / 100) * radius;
    const angle = i * angleStep - Math.PI / 2;
    return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
  }).join(" ");

  const axis = data.map((d, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    const lx = center + (radius + 20) * Math.cos(angle);
    const ly = center + (radius + 20) * Math.sin(angle);
    return (
      <g key={i}>
        <line x1={center} y1={center} x2={x} y2={y} stroke={T.border} strokeWidth="1" />
        <text
          x={lx} y={ly}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={T.mute}
          fontSize="9"
          fontWeight="600"
        >
          {d.label.toUpperCase()}
        </text>
      </g>
    );
  });

  return (
    <svg width={size} height={size}>
      {/* Background circles */}
      {[0.2, 0.4, 0.6, 0.8, 1].map((p, i) => (
        <circle key={i} cx={center} cy={center} r={radius * p} fill="none" stroke={T.border} strokeDasharray="2,2" />
      ))}
      {axis}
      <polygon
        points={points}
        fill={T.amber + "33"}
        stroke={T.amber}
        strokeWidth="2"
      />
    </svg>
  );
};
