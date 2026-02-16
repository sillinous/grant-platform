import React, { useState } from 'react';
import { Card, Btn, Badge, Progress, Stat, Empty } from '../ui';
import { API } from '../api';
import { T, fmt, LS } from '../globals';

export const ImpactPredictor = ({ grants, vaultDocs }) => {
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState(null);

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

      const sys = `You are a Social Impact Actuary. Analyze this grant portfolio against real-world metrics.
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

      const res = await API.callAI([{ role: "user", content: `Predict impact for this portfolio:\n\n${portfolioText}` }], sys);
      if (!res.error) {
        const cleaned = res.text.replace(/```json\n?|```/g, "").trim();
        setPredictions(JSON.parse(cleaned));
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
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>🔮 AI Impact Modeler</div>
            <div style={{ fontSize: 11, color: T.sub }}>Predicting long-term social outcomes via historical benchmarks & portfolio trajectory.</div>
          </div>
          <Btn variant="primary" size="sm" onClick={runPrediction} disabled={loading}>
            {loading ? "⏳ Modeling..." : "⚡ Run Prediction"}
          </Btn>
        </div>

        {!predictions && !loading && (
          <div style={{ padding: 40, textAlign: "center", background: T.panel + "33", borderRadius: 8, border: `1px dashed ${T.border}` }}>
            <div style={{ fontSize: 24, marginBottom: 12 }}>🚀</div>
            <div style={{ fontSize: 13, color: T.sub }}>Click "Run Prediction" to generate an AI-driven impact forecast for your {awarded.length} active projects.</div>
          </div>
        )}

        {predictions && (
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <Card style={{ background: T.green + "08", border: `1px solid ${T.green}22` }}>
                  <Stat label="Estimated SROI" value={`${predictions.sroi.value}x`} color={T.green} />
                  <div style={{ fontSize: 10, color: T.sub, marginTop: 4 }}>{predictions.sroi.label}</div>
                </Card>
                <Card style={{ background: T.blue + "08", border: `1px solid ${T.blue}22` }}>
                  <Stat label="Projected Reach" value={fmt(predictions.reach.projected)} color={T.blue} />
                  <div style={{ fontSize: 10, color: T.sub, marginTop: 4 }}>Total {predictions.reach.unit}</div>
                </Card>
              </div>

              <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 12 }}>📅 5-Year Impact Trajectory</div>
              {predictions.forecasts.map((f, i) => (
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
                {predictions.risks.map((r, i) => (
                  <div key={i} style={{ fontSize: 11, color: T.sub, marginBottom: 6, display: "flex", gap: 6 }}>
                    <span>•</span> {r}
                  </div>
                ))}
              </Card>

              <Card style={{ background: T.green + "05" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.green, marginBottom: 8, textTransform: "uppercase" }}>💡 Strategic Recs</div>
                {predictions.recommendations.map((r, i) => (
                  <div key={i} style={{ fontSize: 11, color: T.sub, marginBottom: 6, display: "flex", gap: 6 }}>
                    <span style={{ color: T.green }}>✓</span> {r}
                  </div>
                ))}
              </Card>

              <div style={{ marginTop: 16, padding: 12, background: T.panel, borderRadius: 6 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.mute, marginBottom: 4 }}>AI JUSTIFICATION</div>
                <div style={{ fontSize: 10, color: T.dim, fontStyle: "italic", lineHeight: 1.5 }}>
                  {predictions.sroi.justification}
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
