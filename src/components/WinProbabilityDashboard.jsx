import React, { useState, useEffect } from 'react';
import { Card, Btn, Badge, Progress } from '../ui';
import { T, fmt } from '../globals';
import { API } from '../api';

export const WinProbabilityDashboard = ({ grant, vaultDocs }) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const runAnalysis = async () => {
    if (!grant) return;
    setLoading(true);
    const sys = `You are a Grant Probability Actuary. Analyze the following grant against the organization's context.
Evaluate 4 dimensions (0-100 each):
1. MISSION_ALIGNMENT: How well does this grant fit the org's core purpose?
2. CAPACITY_READY: Does the org have the team/resources for this specific project?
3. COMPETITIVE_EDGE: Does the org have unique advantages (location, demographics, past performance)?
4. REGULATORY_FIT: How complex are the reporting/compliance requirements vs org experience?

Return ONLY JSON:
{
  "scores": { "mission": N, "capacity": N, "edge": N, "fit": N },
  "win_probability": N,
  "risk_factors": [ { "label": "...", "severity": "high|medium|low" } ],
  "winning_strategies": [ "..." ]
}`;
    
    const prompt = `GRANT: ${grant.title}\nAGENCY: ${grant.agency}\nAMOUNT: ${fmt(grant.amount || 0)}\nDESCRIPTION: ${grant.category}\n\nVAULT CONTEXT: ${vaultDocs?.slice(0, 3).map(d => d.title).join(", ")}`;
    
    const res = await API.callAI([{ role: "user", content: prompt }], sys);
    if (!res.error) {
      try {
        const data = JSON.parse(res.text);
        setAnalysis(data);
      } catch (e) {
        setAnalysis(null);
      }
    }
    setLoading(false);
  };

  if (!grant) return <div style={{ color: T.mute, fontSize: 12, textAlign: "center", padding: 20 }}>Select a grant to analyze win probability</div>;

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>📈 Win Probability: {grant.title}</div>
            <div style={{ fontSize: 11, color: T.sub }}>AI-driven probability and risk scorecard</div>
          </div>
          <Btn size="sm" variant="primary" onClick={runAnalysis} disabled={loading}>
            {loading ? "⌛ Calculating..." : "🧠 Refresh Scorecard"}
          </Btn>
        </div>

        {analysis ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <div style={{ fontSize: 80, fontWeight: 800, color: T.amber, textAlign: "center", lineHeight: 1 }}>{analysis.win_probability}%</div>
              <div style={{ textAlign: "center", fontSize: 12, color: T.mute, marginTop: 8 }}>Estimated Success Probability</div>
              
              <div style={{ marginTop: 24 }}>
                <ScoreBar label="Mission Alignment" value={analysis.scores.mission} color={T.green} />
                <ScoreBar label="Capacity Readiness" value={analysis.scores.capacity} color={T.blue} />
                <ScoreBar label="Competitive Edge" value={analysis.scores.edge} color={T.amber} />
                <ScoreBar label="Regulatory Fit" value={analysis.scores.fit} color={T.purple} />
              </div>
            </div>

            <div style={{ borderLeft: `1px solid ${T.border}`, paddingLeft: 20 }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.text, marginBottom: 8, letterSpacing: 0.5 }}>🛑 CRITICAL RISKS</div>
                {analysis.risk_factors.map((r, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: r.severity === "high" ? T.red : r.severity === "medium" ? T.yellow : T.blue }} />
                    <div style={{ fontSize: 11, color: T.sub }}>{r.label}</div>
                  </div>
                ))}
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.text, marginBottom: 8, letterSpacing: 0.5 }}>🏆 WINNING STRATEGIES</div>
                {analysis.winning_strategies.map((s, i) => (
                  <div key={i} style={{ fontSize: 11, color: T.green, marginBottom: 4 }}>✓ {s}</div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: "40px 0", textAlign: "center", border: `1px dashed ${T.border}`, borderRadius: 8 }}>
            <div style={{ fontSize: 24, marginBottom: 12 }}>🎲</div>
            <div style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>Ready for Go/No-Go Analysis</div>
            <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>Compare mission compatibility against agency trends</div>
          </div>
        )}
      </Card>
    </div>
  );
};

const ScoreBar = ({ label, value, color }) => (
  <div style={{ marginBottom: 10 }}>
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.mute, marginBottom: 4 }}>
      <span>{label.toUpperCase()}</span>
      <span style={{ fontWeight: 600, color: T.text }}>{value}</span>
    </div>
    <Progress value={value} max={100} color={color} height={4} />
  </div>
);
