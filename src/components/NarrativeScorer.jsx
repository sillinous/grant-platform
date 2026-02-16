import React, { useState, useEffect } from 'react';
import { Card, Btn, Select, TextArea, Progress, Badge, Tab } from '../ui';
import { LS, T, uid, fmtDate } from '../globals';
import { API } from '../api';

// ─── AGENCY RUBRICS ────────────────────────────────────────────────
const RUBRICS = {
  generic: {
    id: "generic", name: "Generic Federal", icon: "📋", color: T.amber,
    description: "Standard 7-criteria review used across most federal agencies",
    criteria: ["clarity", "evidence", "impact", "alignment", "compelling", "specificity", "feasibility"],
    labels: { clarity: "Clarity", evidence: "Evidence", impact: "Impact", alignment: "Alignment", compelling: "Compelling", specificity: "Specificity", feasibility: "Feasibility" },
    prompt: `Score this narrative section on the following criteria (0-100 each):
1. CLARITY: Is the writing clear, concise, and well-organized?
2. EVIDENCE: Does it use specific data, statistics, and evidence?
3. IMPACT: Does it clearly articulate measurable impact and outcomes?
4. ALIGNMENT: Does it align with typical federal grant reviewer expectations?
5. COMPELLING: Is the narrative persuasive and engaging?
6. SPECIFICITY: Are goals, methods, and timelines specific rather than vague?
7. FEASIBILITY: Does the plan seem achievable and realistic?

Respond ONLY in JSON format:
{"scores":{"clarity":N,"evidence":N,"impact":N,"alignment":N,"compelling":N,"specificity":N,"feasibility":N},"overall":N,"strengths":["..."],"weaknesses":["..."],"suggestions":["..."]}`,
  },

  nsf: {
    id: "nsf", name: "NSF Merit Review", icon: "🔬", color: "#4285f4",
    description: "National Science Foundation — Intellectual Merit + Broader Impacts",
    criteria: ["intellectual_merit", "broader_impacts", "methodology", "innovation", "team_qualifications", "data_management"],
    labels: { intellectual_merit: "Intellectual Merit", broader_impacts: "Broader Impacts", methodology: "Research Methodology", innovation: "Innovation/Novelty", team_qualifications: "Team Qualifications", data_management: "Data Mgmt Plan" },
    prompt: `You are an NSF Merit Review panelist. Score this proposal narrative using NSF's official review criteria (0-100 each):
1. INTELLECTUAL_MERIT: Does it advance knowledge and understanding? Is the research question significant?
2. BROADER_IMPACTS: Does it benefit society? Does it promote diversity, education, or public engagement?
3. METHODOLOGY: Is the research design rigorous, with clear protocols and analysis plans?
4. INNOVATION: Does it challenge existing paradigms or offer novel approaches?
5. TEAM_QUALIFICATIONS: Are the PI and co-PIs qualified? Is institutional support adequate?
6. DATA_MANAGEMENT: Is there a clear plan for data sharing and preservation?

Respond ONLY in JSON format:
{"scores":{"intellectual_merit":N,"broader_impacts":N,"methodology":N,"innovation":N,"team_qualifications":N,"data_management":N},"overall":N,"strengths":["..."],"weaknesses":["..."],"suggestions":["..."]}`,
  },

  nih: {
    id: "nih", name: "NIH Study Section", icon: "🏥", color: "#e53e3e",
    description: "National Institutes of Health — Significance, Investigators, Innovation, Approach, Environment",
    criteria: ["significance", "investigators", "innovation", "approach", "environment"],
    labels: { significance: "Significance", investigators: "Investigators", innovation: "Innovation", approach: "Approach", environment: "Environment" },
    prompt: `You are an NIH Study Section reviewer. Score this proposal using NIH's 5 official review criteria (1-9 scale, where 1=Exceptional, 9=Poor). CONVERT to 0-100 scale for scoring (1→100, 5→55, 9→10):
1. SIGNIFICANCE: Does the project address an important problem? Will it improve scientific knowledge or clinical practice?
2. INVESTIGATORS: Are the PD/PIs and key personnel well-suited? Do they have appropriate experience and training?
3. INNOVATION: Does the application challenge existing paradigms? Are novel concepts or methods proposed?
4. APPROACH: Is the overall strategy, methodology, and analyses well-reasoned? Are potential problems addressed?
5. ENVIRONMENT: Will the scientific environment contribute to the success? Are institutional support and resources adequate?

Respond ONLY in JSON format:
{"scores":{"significance":N,"investigators":N,"innovation":N,"approach":N,"environment":N},"overall":N,"strengths":["..."],"weaknesses":["..."],"suggestions":["..."]}`,
  },

  usda: {
    id: "usda", name: "USDA NIFA", icon: "🌾", color: "#38a169",
    description: "USDA National Institute of Food and Agriculture — Relevance, Merit, Achievability",
    criteria: ["relevance", "technical_merit", "achievability", "expertise", "support_requested"],
    labels: { relevance: "Relevance", technical_merit: "Technical Merit", achievability: "Achievability", expertise: "Expertise & Resources", support_requested: "Support Requested" },
    prompt: `You are a USDA NIFA review panelist. Score this proposal using USDA's review criteria (0-100 each):
1. RELEVANCE: Does the project address USDA priority areas? Is there a clear connection to food, agriculture, or natural resources?
2. TECHNICAL_MERIT: Is the scientific approach sound? Are methods and design appropriate?
3. ACHIEVABILITY: Can the project be completed as proposed? Are timelines realistic?
4. EXPERTISE: Do investigators have the necessary expertise? Are resources and facilities adequate?
5. SUPPORT_REQUESTED: Is the budget reasonable and justified? Are costs appropriate for the scope?

Respond ONLY in JSON format:
{"scores":{"relevance":N,"technical_merit":N,"achievability":N,"expertise":N,"support_requested":N},"overall":N,"strengths":["..."],"weaknesses":["..."],"suggestions":["..."]}`,
  },
};

const RUBRIC_LIST = Object.values(RUBRICS);

export const NarrativeScorer = ({ grants }) => {
  const [text, setText] = useState("");
  const [grantId, setGrantId] = useState("");
  const [rubricId, setRubricId] = useState("generic");
  const [scoreResult, setScoreResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState(() => LS.get("score_history", []));
  const [showCompare, setShowCompare] = useState(false);

  useEffect(() => { LS.set("score_history", history); }, [history]);

  const rubric = RUBRICS[rubricId] || RUBRICS.generic;

  const score = async () => {
    if (!text.trim()) return;
    setLoading(true);
    const grant = grants.find(g => g.id === grantId);
    const sys = `You are an expert grant reviewer acting as a "${rubric.name}" panelist. ${rubric.prompt}`;
    const content = `${grant ? `Grant: ${grant.title}\nAgency: ${grant.agency}\n\n` : ""}Score this narrative:\n\n${text}`;
    const result = await API.callAI([{ role: "user", content }], sys);

    if (result.error) {
      setScoreResult({ error: result.error });
    } else {
      try {
        const cleaned = result.text.replace(/```json\n?|```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        parsed._rubric = rubricId;
        setScoreResult(parsed);
        setHistory(prev => [{
          id: uid(), date: new Date().toISOString(), overall: parsed.overall,
          grant: grant?.title || "General", preview: text.slice(0, 80),
          rubric: rubricId, rubricName: rubric.name,
        }, ...prev].slice(0, 30));
      } catch { setScoreResult({ raw: result.text }); }
    }
    setLoading(false);
  };

  const getScoreColor = (val) => val >= 80 ? T.green : val >= 60 ? T.yellow : T.red;

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>📝 AI Narrative Scorer</div>
          <Badge color={rubric.color}>{rubric.icon} {rubric.name}</Badge>
        </div>
        <div style={{ fontSize: 11, color: T.sub, marginBottom: 12 }}>
          Paste a draft narrative section. The AI will score it as a "{rubric.name}" reviewer using agency-specific criteria.
        </div>

        {/* Rubric Selector */}
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${RUBRIC_LIST.length}, 1fr)`, gap: 6, marginBottom: 12 }}>
          {RUBRIC_LIST.map(r => (
            <button key={r.id} onClick={() => setRubricId(r.id)} style={{
              padding: "8px 6px", borderRadius: 8, border: `1px solid ${rubricId === r.id ? r.color : T.border}`,
              background: rubricId === r.id ? r.color + "18" : T.card, cursor: "pointer",
              transition: "all 0.2s", textAlign: "center",
            }}>
              <div style={{ fontSize: 16 }}>{r.icon}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: rubricId === r.id ? r.color : T.sub, marginTop: 2 }}>{r.name}</div>
              <div style={{ fontSize: 8, color: T.mute, marginTop: 2 }}>{r.criteria.length} criteria</div>
            </button>
          ))}
        </div>

        <Select value={grantId} onChange={setGrantId} style={{ marginBottom: 8 }}
          options={[{ value: "", label: "General (no specific grant)" }, ...grants.map(g => ({ value: g.id, label: g.title?.slice(0, 50) }))]} />
        <TextArea value={text} onChange={setText} rows={8} placeholder="Paste your narrative draft here..." />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          <Btn variant="primary" onClick={score} disabled={loading}>{loading ? "⏳ Scoring..." : `📊 Score with ${rubric.name}`}</Btn>
          <div style={{ fontSize: 11, color: T.mute }}>{text.split(/\s+/).filter(Boolean).length} words</div>
        </div>
      </Card>

      {scoreResult && !scoreResult.error && !scoreResult.raw && (
        <div>
          <Card style={{ marginBottom: 12, borderColor: getScoreColor(scoreResult.overall) + "44" }} glow={scoreResult.overall >= 80}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ fontSize: 48, fontWeight: 700, color: getScoreColor(scoreResult.overall) }}>{scoreResult.overall}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>Overall Score</div>
                <div style={{ fontSize: 12, color: T.sub }}>
                  {scoreResult.overall >= 80 ? "Excellent — competitive quality" : scoreResult.overall >= 60 ? "Good — needs some refinement" : "Needs significant improvement"}
                </div>
                <Badge color={rubric.color} style={{ marginTop: 4 }}>{rubric.icon} Reviewed as: {rubric.name}</Badge>
              </div>
            </div>
          </Card>

          <Card style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>📊 {rubric.name} Criteria Breakdown</div>
            {rubric.criteria.map(c => {
              const val = scoreResult.scores?.[c] || 0;
              return (
                <div key={c} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                    <span style={{ color: T.sub }}>{rubric.labels[c]}</span>
                    <span style={{ color: getScoreColor(val), fontWeight: 600 }}>{val}/100</span>
                  </div>
                  <Progress value={val} max={100} color={getScoreColor(val)} height={6} />
                </div>
              );
            })}
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <Card>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.green, marginBottom: 8 }}>✅ Strengths</div>
              {(scoreResult.strengths || []).map((s, i) => <div key={i} style={{ fontSize: 11, color: T.sub, padding: "3px 0", borderBottom: `1px solid ${T.border}` }}>{s}</div>)}
            </Card>
            <Card>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.red, marginBottom: 8 }}>⚠️ Weaknesses</div>
              {(scoreResult.weaknesses || []).map((w, i) => <div key={i} style={{ fontSize: 11, color: T.sub, padding: "3px 0", borderBottom: `1px solid ${T.border}` }}>{w}</div>)}
            </Card>
          </div>

          <Card>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.amber, marginBottom: 8 }}>💡 Improvement Suggestions</div>
            {(scoreResult.suggestions || []).map((s, i) => <div key={i} style={{ fontSize: 11, color: T.sub, padding: "4px 0", borderBottom: `1px solid ${T.border}` }}>→ {s}</div>)}
          </Card>
        </div>
      )}

      {scoreResult?.error && <Card><div style={{ color: T.red, fontSize: 12 }}>Error: {scoreResult.error}</div></Card>}
      {scoreResult?.raw && <Card><div style={{ fontSize: 12, color: T.sub, whiteSpace: "pre-wrap" }}>{scoreResult.raw}</div></Card>}

      {history.length > 0 && (
        <Card style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 8 }}>📈 Score History</div>
          {history.slice(0, 15).map(h => (
            <div key={h.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>
              <span style={{ color: T.mute }}>{fmtDate(h.date)}</span>
              <span style={{ color: T.text }}>{h.grant?.slice(0, 20)}</span>
              <Badge color={(RUBRICS[h.rubric] || RUBRICS.generic).color} style={{ fontSize: 8 }}>{h.rubricName || "Generic"}</Badge>
              <span style={{ color: getScoreColor(h.overall), fontWeight: 600 }}>{h.overall}/100</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};
