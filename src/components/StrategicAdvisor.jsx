import React, { useState } from 'react';
import { Card, Btn } from '../ui';
import { T, fmt, fmtDate, STAGE_MAP } from '../globals';
import { API, buildPortfolioContext } from '../api';

export const StrategicAdvisor = ({ grants, vaultDocs, contacts }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("portfolio");

  const MODES = [
    { id:"portfolio", label:"🎯 Portfolio Strategy", prompt:"Analyze my entire grant portfolio. Evaluate diversification, risk concentration, pipeline health, conversion potential, and strategic gaps. Provide a prioritized action plan for the next 30/60/90 days." },
    { id:"targeting", label:"🔍 Targeting Strategy", prompt:"Based on my profile, businesses, and demographics, what types of federal grants should I prioritize? What agencies and programs are the best fit? What areas am I underexploring?" },
    { id:"narrative", label:"✍️ Narrative Strategy", prompt:"Review my profile and suggest the strongest narrative angles I should use across applications. What's my most compelling story? How should I frame my rural location, disability, and multiple ventures as strengths?" },
    { id:"capacity", label:"🏢 Capacity Building", prompt:"What organizational capacity gaps might reviewers identify? What should I address before submitting more applications? Suggest specific improvements to strengthen my competitive position." },
    { id:"timeline", label:"📅 Timeline Optimization", prompt:"Look at my pipeline deadlines, stages, and workload. Am I overcommitted? Should I drop any grants? What's the optimal sequence for completing applications to maximize quality?" },
    { id:"growth", label:"📈 Growth Plan", prompt:"Design a 12-month grant strategy growth plan. How many grants should I apply for per quarter? What's a realistic funded portfolio target? How should my strategy evolve as I win more awards?" },
  ];

  const analyze = async () => {
    setLoading(true);
    const context = buildPortfolioContext(grants, vaultDocs, contacts);
    const grantDetails = grants.map(g => `- ${g.title} | ${STAGE_MAP[g.stage]?.label} | ${fmt(g.amount||0)} | ${g.agency} | Deadline: ${g.deadline ? fmtDate(g.deadline) : 'none'}`).join("\n");
    const selectedMode = MODES.find(m => m.id === mode);

    const sys = `You are an elite grant strategy consultant with 20+ years of experience advising small organizations and rural entrepreneurs on federal funding. You specialize in building sustainable grant portfolios for underserved communities.

${context}

DETAILED GRANTS:
${grantDetails}

Provide specific, actionable, data-driven advice. Reference the user's actual portfolio data. Include timelines and metrics. Structure your response with clear headers and priorities.`;

    const result = await API.callAI([{ role:"user", content: selectedMode.prompt }], sys);
    setAnalysis({ mode: selectedMode, text: result.error ? `Error: ${result.error}` : result.text, date: new Date().toISOString() });
    setLoading(false);
  };

  return (
    <div>
      <Card style={{ marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:8 }}>🧠 AI Strategic Advisor</div>
        <div style={{ fontSize:11, color:T.sub, marginBottom:12 }}>Deep strategic analysis powered by AI. Select an analysis mode and get specific, actionable recommendations based on your entire portfolio.</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(180px, 1fr))", gap:8, marginBottom:12 }}>
          {MODES.map(m => (
            <div key={m.id} onClick={() => setMode(m.id)} style={{
              padding:10, borderRadius:6, cursor:"pointer",
              border:`1px solid ${mode === m.id ? T.amber+"66" : T.border}`,
              background: mode === m.id ? T.amber+"08" : T.panel,
            }}>
              <div style={{ fontSize:12, fontWeight:600, color: mode === m.id ? T.amber : T.text }}>{m.label}</div>
            </div>
          ))}
        </div>
        <Btn variant="primary" onClick={analyze} disabled={loading}>{loading ? "⏳ Analyzing portfolio..." : `🧠 Run ${MODES.find(m=>m.id===mode)?.label}`}</Btn>
      </Card>

      {analysis && (
        <Card>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:600, color:T.text }}>{analysis.mode.label}</div>
              <div style={{ fontSize:10, color:T.mute }}>Generated {fmtDate(analysis.date)}</div>
            </div>
            <Btn size="sm" variant="ghost" onClick={() => navigator.clipboard?.writeText(analysis.text)}>📋 Copy</Btn>
          </div>
          <div style={{ fontSize:12, color:T.sub, lineHeight:1.7, whiteSpace:"pre-wrap", padding:12, background:T.panel, borderRadius:6, maxHeight:600, overflow:"auto" }}>{analysis.text}</div>
        </Card>
      )}
    </div>
  );
};
