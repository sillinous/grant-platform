import React, { useState } from 'react';
import { Card, Btn, Badge, Progress, Stat, Empty } from '../ui';
import { API } from '../api';
import { T, fmt, LS } from '../globals';

export const ImpactPredictor = ({ grants, vaultDocs }) => {
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState(null);
  const [stressMode, setStressMode] = useState(false);
  const [stressType, setStressType] = useState("economic"); // economic | environmental

  const awarded = grants.filter(g => ["awarded", "active", "closeout"].includes(g.stage));

  const runPrediction = async () => {
    if (awarded.length === 0) return;
    setLoading(true);
    try {
      const [fred, noaa] = await Promise.all([
        API.getEconomicData("UNRATE"),
        API.getClimateData()
      ]);

      const portfolioText = awarded.map(g =>
        `GRANT: ${g.title}\nAGENCY: ${g.agency}\nAMOUNT: ${fmt(g.amount)}\nDESCRIPTION: ${g.description}`
      ).join("\n\n---\n\n");

      const sys = stressMode
        ? `You are a Social Impact Risk Actuary. Perform a PORTFOLIO STRESS TEST.
           STRESS TYPE: ${stressType.toUpperCase()}
           ECONOMIC CONTEXT (FRED): ${JSON.stringify(fred.observations?.slice(0, 5))}
           CLIMATE CONTEXT (NOAA): ${JSON.stringify(noaa.results?.slice(0, 5))}
           
           Identify 3-5 specific "Stress Points" where external factors could break project sustainability.
           Return ONLY JSON with this schema:
           {
             "stress_level": "low|medium|high|critical",
             "vulnerability_score": N,
             "stress_points": [{ "factor": "string", "impact": "string", "mitigation": "string", "risk_level": "high|medium|low" }],
             "resilience_rating": "string",
             "executive_summary": "1-sentence summary of the portfolio's resilience."
           }`
        : `You are a Social Impact Actuary. Analyze this grant portfolio against real-world metrics.
           ECONOMIC CONTEXT (FRED): ${JSON.stringify(fred.observations?.slice(0, 3))}
           CLIMATE CONTEXT (NOAA): ${JSON.stringify(noaa.results?.slice(0, 3))}
           
           Forecast 3-5 high-level "Predictive Impact Milestones" for the next 3-5 years.
           Evaluate SROI, Reach, and Sustainability based on this REAL data.
           
           Return ONLY JSON:
           {
             "sroi": { "value": N.N, "label": "string", "justification": "string" },
             "reach": { "current": N, "projected": N, "unit": "string" },
             "forecasts": [{ "milestone": "string", "year": "YYYY", "probability": N, "impact": "high|medium" }],
             "risks": [ "string" ],
             "recommendations": [ "string" ],
             "real_world_context": "1-sentence summary of how FRED/NOAA data influenced this."
           }`;

      const prompt = stressMode
        ? `Run a ${stressType} stress test on this grant portfolio:\n\n${portfolioText}`
        : `Predict impact for this portfolio:\n\n${portfolioText}`;

      const res = await API.callAI([{ role: "user", content: prompt }], sys, { forceJson: true });
      if (!res.error) {
        const data = typeof res.text === "string" ? JSON.parse(res.text.replace(/```json\n?|```/g, "").trim()) : res.text;
        setPredictions(prev => ({
          ...prev,
          [stressMode ? "stress" : "standard"]: data,
          history: [...(prev?.history || []), { mode: stressMode ? "stress" : "standard", data, timestamp: new Date() }]
        }));
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  if (awarded.length === 0) {
    return (
      <Empty
        icon="📉"
        title="No Impact Data Yet"
        sub="Impact prediction requires awarded or active grants to model trajectory."
      />
    );
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant={!stressMode ? "primary" : "ghost"} size="sm" onClick={() => setStressMode(false)}>📈 Standard Impact</Btn>
            <Btn variant={stressMode ? "primary" : "ghost"} size="sm" onClick={() => setStressMode(true)}>🛡️ Executive Stress Test</Btn>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {stressMode && (
              <Select value={stressType} onChange={setStressType} size="sm" options={[
                { value: "economic", label: "Economic Stress" },
                { value: "environmental", label: "Environmental Stress" },
              ]} />
            )}
            <Btn variant="primary" size="sm" onClick={runPrediction} disabled={loading}>
              {loading ? "⏳ Modeling..." : "⚡ Run " + (stressMode ? "Stress Test" : "Prediction")}
            </Btn>
          </div>
        </div>

        {!predictions?.[stressMode ? "stress" : "standard"] && !loading && (
          <div style={{ padding: 40, textAlign: "center", background: T.panel + "33", borderRadius: 8, border: `1px dashed ${T.border}` }}>
            <div style={{ fontSize: 24, marginBottom: 12 }}>{stressMode ? "🛡️" : "🚀"}</div>
            <div style={{ fontSize: 13, color: T.sub }}>Click "Run {stressMode ? "Stress Test" : "Prediction"}" to generate an AI-driven {stressMode ? "risk" : "impact"} forecast for your {awarded.length} active projects.</div>
          </div>
        )}

        {predictions?.standard && !stressMode && (
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <Card style={{ background: T.green + "08", border: `1px solid ${T.green}22` }}>
                  <Stat label="Estimated SROI" value={`${predictions.standard.sroi.value}x`} color={T.green} />
                  <div style={{ fontSize: 10, color: T.sub, marginTop: 4 }}>{predictions.standard.sroi.label}</div>
                </Card>
                <Card style={{ background: T.blue + "08", border: `1px solid ${T.blue}22` }}>
                  <Stat label="Projected Reach" value={fmt(predictions.standard.reach.projected)} color={T.blue} />
                  <div style={{ fontSize: 10, color: T.sub, marginTop: 4 }}>Total {predictions.standard.reach.unit}</div>
                </Card>
              </div>

              <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 12 }}>📅 5-Year Impact Trajectory</div>
              {predictions.standard.forecasts.map((f, i) => (
                <div key={i} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: `1px solid ${T.border}`, alignItems: "flex-start" }}>
                  <div style={{ background: T.panel, padding: "4px 8px", borderRadius: 4, textAlign: "center", minWidth: 50 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: T.text }}>{f.year}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{f.milestone}</div>
                      <Badge color={f.impact === "high" ? T.green : f.impact === "medium" ? T.amber : T.blue}>{f.impact.toUpperCase()}</Badge>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Progress value={f.probability} max={100} color={T.amber} height={4} />
                      <span style={{ fontSize: 9, color: T.mute }}>{f.probability}% Prob</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <Card style={{ marginBottom: 12, background: T.amber + "05" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.amber, marginBottom: 8, textTransform: "uppercase" }}>🛡️ Risk Assessment</div>
                {predictions.standard.risks.map((r, i) => (
                  <div key={i} style={{ fontSize: 11, color: T.sub, marginBottom: 6, display: "flex", gap: 6 }}>
                    <span>•</span> {r}
                  </div>
                ))}
              </Card>

              <Card style={{ background: T.green + "05" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.green, marginBottom: 8, textTransform: "uppercase" }}>💡 Strategic Recs</div>
                {predictions.standard.recommendations.map((r, i) => (
                  <div key={i} style={{ fontSize: 11, color: T.sub, marginBottom: 6, display: "flex", gap: 6 }}>
                    <span style={{ color: T.green }}>✓</span> {r}
                  </div>
                ))}
              </Card>

              <div style={{ marginTop: 16, padding: 12, background: T.panel, borderRadius: 6 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.mute, marginBottom: 4 }}>AI JUSTIFICATION</div>
                <div style={{ fontSize: 10, color: T.dim, fontStyle: "italic", lineHeight: 1.5 }}>
                  {predictions.standard.sroi.justification}
                </div>
              </div>
            </div>
          </div>
        )}

        {predictions?.stress && stressMode && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <Card style={{ background: T.red + "08", border: `1px solid ${T.red}22` }}>
                  <Stat label="Stress Level" value={predictions.stress.stress_level.toUpperCase()} color={T.red} />
                  <div style={{ fontSize: 10, color: T.sub, marginTop: 4 }}>Portfolio Vulnerability</div>
                </Card>
                <Card style={{ background: T.amber + "08", border: `1px solid ${T.amber}22` }}>
                  <Stat label="Vulnerability" value={`${predictions.stress.vulnerability_score}/10`} color={T.amber} />
                  <div style={{ fontSize: 10, color: T.sub, marginTop: 4 }}>External Factor Sensitivity</div>
                </Card>
              </div>

              <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 12 }}>🔥 Critical Stress Points</div>
              {predictions.stress.stress_points.map((p, i) => (
                <Card key={i} style={{ marginBottom: 12, padding: 12, borderLeft: `4px solid ${p.risk_level === "high" ? T.red : T.amber}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{p.factor}</div>
                    <Badge color={p.risk_level === "high" ? T.red : T.amber}>{p.risk_level.toUpperCase()}</Badge>
                  </div>
                  <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>{p.impact}</div>
                  <div style={{ fontSize: 10, color: T.green, background: T.green + "08", padding: "4px 8px", borderRadius: 4 }}>
                    <strong>Mitigation:</strong> {p.mitigation}
                  </div>
                </Card>
              ))}
            </div>

            <div>
              <Card style={{ marginBottom: 16, background: T.panel }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.mute, marginBottom: 8, textTransform: "uppercase" }}>Executive Resilience Analysis</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: T.text, marginBottom: 8 }}>{predictions.stress.resilience_rating}</div>
                <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.6 }}>{predictions.stress.executive_summary}</div>
              </Card>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.text, marginBottom: 8 }}>🌡️ Risk Heatmap (Impact vs Probability)</div>
                <div style={{ height: 120, background: `linear-gradient(to top right, ${T.green}22, ${T.amber}22, ${T.red}22)`, borderRadius: 8, position: "relative", border: `1px solid ${T.border}` }}>
                  {predictions.stress.stress_points.map((p, i) => {
                    const x = p.risk_level === "high" ? 80 : p.risk_level === "medium" ? 50 : 20;
                    const y = p.risk_level === "high" ? 80 : p.risk_level === "medium" ? 60 : 30;
                    return (
                      <div key={i} style={{ position: "absolute", left: `${x}%`, bottom: `${y}%`, transform: "translate(-50%, 50%)", cursor: "help" }} title={`${p.factor}: ${p.impact}`}>
                        <div style={{ width: 12, height: 12, borderRadius: "50%", background: p.risk_level === "high" ? T.red : p.risk_level === "medium" ? T.amber : T.blue, border: "2px solid #fff", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }} />
                      </div>
                    );
                  })}
                  <div style={{ position: "absolute", bottom: -18, left: "50%", transform: "translateX(-50%)", fontSize: 9, color: T.mute }}>PROBABILITY →</div>
                  <div style={{ position: "absolute", left: -35, top: "50%", transform: "translateY(-50%) rotate(-90deg)", fontSize: 9, color: T.mute }}>IMPACT →</div>
                </div>
              </div>

              {predictions?.standard && (
                <Card style={{ background: T.blue + "05", border: `1px dashed ${T.blue}44` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.blue, marginBottom: 8 }}>📊 STRATEGIC OVERLAY: STRESS VS. STANDARD</div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                    <span>Standard SROI: {predictions.standard.sroi.value}x</span>
                    <span style={{ color: T.red }}>Stress Vuln: {predictions.stress.vulnerability_score}/10</span>
                  </div>
                  <Progress value={100 - (predictions.stress.vulnerability_score * 10)} max={100} color={T.blue} height={4} style={{ marginTop: 8 }} />
                  <div style={{ fontSize: 9, color: T.mute, marginTop: 4 }}>Scenario-adjusted sustainability rating.</div>
                </Card>
              )}

              <div style={{ padding: 16, border: `1px dashed ${T.border}`, borderRadius: 8, marginTop: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.mute, marginBottom: 8 }}>DATA SOURCES</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Badge color={T.blue}>FRED Economic Data</Badge>
                  <Badge color={T.cyan}>NOAA Climate Metrics</Badge>
                </div>
                <div style={{ fontSize: 9, color: T.dim, marginTop: 8 }}>
                  Last synced: {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
