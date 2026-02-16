import React, { useState } from 'react';
import { Card, Btn, Badge, Progress, Empty, Select } from '../ui';
import { T, LS, uid, fmt } from '../globals';
import { API } from '../api';

export const PolicyModeler = ({ grants }) => {
  const [loading, setLoading] = useState(false);
  const [simulation, setSimulation] = useState(null);
  const [policyType, setPolicyType] = useState("Appropriations");

  const runSimulation = async () => {
    setLoading(true);
    const sys = `You are a Legislative Policy Analyst. Analyze the impact of pending ${policyType} legislation on this grant portfolio.
    Return ONLY JSON:
    {
      "confidence": N,
      "summary": "1-sentence summary of overall shift.",
      "shifts": [
        { "sector": "string", "direction": "up|down|neutral", "reason": "string", "impact_score": 0-100 }
      ],
      "strategic_advice": "3-bullet strategy to mitigate risk or capture new funding."
    }`;

    const portfolioContext = grants.map(g => `${g.title} (${g.agency}) - ${fmt(g.amount)}`).join("\n");
    const prompt = `Simulate impact of new ${policyType} cycle on:\n\n${portfolioContext}`;

    const res = await API.callAI([{ role: "user", content: prompt }], sys, { forceJson: true });
    if (!res.error) {
      const data = typeof res.text === "string" ? JSON.parse(res.text.replace(/```json\n?|```/g, "").trim()) : res.text;
      setSimulation(data);
    }
    setLoading(false);
  };

  const POLICY_OPTIONS = [
    { value: "Appropriations", label: "🏛️ Federal Appropriations (FY2027)" },
    { value: "Infrastructure", label: "🏗️ Infrastructure & Jobs Act Reallocations" },
    { value: "Tech_Sovereignty", label: "💻 Tech Sovereignty & CHIPS II" },
    { value: "Climate_Resilience", label: "🌡️ Climate Resilience & EPA Policy Shifts" }
  ];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>🏛️ Predictive Policy Modeler</div>
            <div style={{ fontSize: 11, color: T.sub }}>Forecasting legislative impact on portfolio sustainability.</div>
          </div>
          <Badge color={T.purple}>AI Simulation Engine</Badge>
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: T.mute, marginBottom: 4 }}>SELECT POLICY VECTOR</div>
            <Select 
              value={policyType} 
              onChange={setPolicyType} 
              options={POLICY_OPTIONS}
            />
          </div>
          <Btn variant="primary" onClick={runSimulation} disabled={loading} style={{ alignSelf: "flex-end", height: 38 }}>
            {loading ? "⏳ Running Simulation..." : "🚀 Run " + policyType.split("_").join(" ") + " Model"}
          </Btn>
        </div>

        {!simulation && !loading && (
          <Empty icon="🔮" title="Ready to Forecast?" sub="Select a legislative vector to simulate how pending bills will shift funding availability for your specific mission areas." />
        )}

        {loading && (
          <div style={{ padding: 40, textAlign: "center" }}>
            <Progress value={45} color={T.purple} />
            <div style={{ fontSize: 11, color: T.purple, marginTop: 12, fontWeight: 700 }}>AI ANALYZING LEGISLATIVE TEXT & APPROPRIATIONS DATA...</div>
          </div>
        )}

        {simulation && !loading && (
          <div style={{ display: "grid", gap: 20, animation: "fadeIn 0.5s ease-out" }}>
            <div style={{ padding: 16, background: T.purple + "08", border: `1px solid ${T.purple}22`, borderRadius: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: T.purple }}>MODEL OUTCOME: {policyType.toUpperCase()}</div>
                    <Badge color={T.green}>Confidence: {simulation.confidence}%</Badge>
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{simulation.summary}</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {simulation.shifts.map((s, i) => (
                    <Card key={i} style={{ background: T.panel }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                            <div style={{ fontSize: 11, fontWeight: 700 }}>{s.sector}</div>
                            <Badge color={s.direction === "up" ? T.green : s.direction === "down" ? T.red : T.mute}>
                                {s.direction === "up" ? "📈 EXPANDING" : s.direction === "down" ? "📉 CONTRACTING" : "↔️ STABLE"}
                            </Badge>
                        </div>
                        <div style={{ fontSize: 10, color: T.sub, marginBottom: 8 }}>{s.reason}</div>
                        <Progress value={s.impact_score} color={s.direction === "up" ? T.green : s.direction === "down" ? T.red : T.blue} height={4} />
                    </Card>
                ))}
            </div>

            <div style={{ padding: 16, background: T.panel, borderRadius: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: T.amber, marginBottom: 12 }}>🛡️ STRATEGIC MITIGATION ADVICE</div>
                <div style={{ fontSize: 11, color: T.sub, lineHeight: 1.6 }}>
                    {simulation.strategic_advice.split("\n").map((line, i) => <div key={i} style={{ marginBottom: 4 }}>• {line}</div>)}
                </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
