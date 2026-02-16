import React, { useState, useEffect } from 'react';
import { Card, Btn, Select, TextArea, Progress } from '../ui';
import { LS, T, uid, fmtDate } from '../globals';
import { API } from '../api';

export const NarrativeScorer = ({ grants }) => {
  const [text, setText] = useState("");
  const [grantId, setGrantId] = useState("");
  const [scoreResult, setScoreResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState(() => LS.get("score_history", []));

  useEffect(() => { LS.set("score_history", history); }, [history]);

  const score = async () => {
    if (!text.trim()) return;
    setLoading(true);
    const grant = grants.find(g => g.id === grantId);
    const sys = `You are an expert grant reviewer. Score this narrative section on the following criteria (0-100 each):
1. CLARITY: Is the writing clear, concise, and well-organized?
2. EVIDENCE: Does it use specific data, statistics, and evidence?
3. IMPACT: Does it clearly articulate measurable impact and outcomes?
4. ALIGNMENT: Does it align with typical federal grant reviewer expectations?
5. COMPELLING: Is the narrative persuasive and engaging?
6. SPECIFICITY: Are goals, methods, and timelines specific rather than vague?
7. FEASIBILITY: Does the plan seem achievable and realistic?

Respond ONLY in JSON format:
{"scores":{"clarity":N,"evidence":N,"impact":N,"alignment":N,"compelling":N,"specificity":N,"feasibility":N},"overall":N,"strengths":["..."],"weaknesses":["..."],"suggestions":["..."]}`;

    const content = `${grant ? `Grant: ${grant.title}\nAgency: ${grant.agency}\n\n` : ""}Score this narrative:\n\n${text}`;
    const result = await API.callAI([{ role:"user", content }], sys);
    if (result.error) { setScoreResult({ error: result.error }); }
    else {
      try {
        const cleaned = result.text.replace(/```json\n?|```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        setScoreResult(parsed);
        setHistory(prev => [{ id:uid(), date:new Date().toISOString(), overall:parsed.overall, grant:grant?.title || "General", preview:text.slice(0,80) }, ...prev].slice(0, 20));
      } catch { setScoreResult({ raw: result.text }); }
    }
    setLoading(false);
  };

  const CRITERIA = ["clarity","evidence","impact","alignment","compelling","specificity","feasibility"];
  const CRITERIA_LABELS = { clarity:"Clarity",evidence:"Evidence",impact:"Impact",alignment:"Alignment",compelling:"Compelling",specificity:"Specificity",feasibility:"Feasibility" };

  return (
    <div>
      <Card style={{ marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:8 }}>📝 AI Narrative Scorer</div>
        <div style={{ fontSize:11, color:T.sub, marginBottom:12 }}>Paste a draft narrative section. The AI will score it across 7 criteria that federal reviewers use, and provide specific improvement suggestions.</div>
        <Select value={grantId} onChange={setGrantId} style={{ marginBottom:8 }}
          options={[{ value:"", label:"General (no specific grant)" }, ...grants.map(g => ({ value:g.id, label:g.title?.slice(0,50) }))]} />
        <TextArea value={text} onChange={setText} rows={8} placeholder="Paste your narrative draft here..." />
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
          <Btn variant="primary" onClick={score} disabled={loading}>{loading ? "⏳ Scoring..." : "📊 Score Narrative"}</Btn>
          <div style={{ fontSize:11, color:T.mute }}>{text.split(/\s+/).filter(Boolean).length} words</div>
        </div>
      </Card>

      {scoreResult && !scoreResult.error && !scoreResult.raw && (
        <div>
          <Card style={{ marginBottom:12, borderColor: scoreResult.overall >= 70 ? T.green+"44" : T.border }} glow={scoreResult.overall >= 80}>
            <div style={{ display:"flex", alignItems:"center", gap:16 }}>
              <div style={{ fontSize:48, fontWeight:700, color: scoreResult.overall >= 80 ? T.green : scoreResult.overall >= 60 ? T.yellow : T.red }}>{scoreResult.overall}</div>
              <div>
                <div style={{ fontSize:14, fontWeight:600, color:T.text }}>Overall Score</div>
                <div style={{ fontSize:12, color:T.sub }}>
                  {scoreResult.overall >= 80 ? "Excellent — competitive quality" : scoreResult.overall >= 60 ? "Good — needs some refinement" : "Needs significant improvement"}
                </div>
              </div>
            </div>
          </Card>

          <Card style={{ marginBottom:12 }}>
            <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>📊 Criteria Breakdown</div>
            {CRITERIA.map(c => {
              const val = scoreResult.scores?.[c] || 0;
              return (
                <div key={c} style={{ marginBottom:8 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:3 }}>
                    <span style={{ color:T.sub }}>{CRITERIA_LABELS[c]}</span>
                    <span style={{ color: val >= 80 ? T.green : val >= 60 ? T.yellow : T.red, fontWeight:600 }}>{val}/100</span>
                  </div>
                  <Progress value={val} max={100} color={val >= 80 ? T.green : val >= 60 ? T.yellow : T.red} height={6} />
                </div>
              );
            })}
          </Card>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
            <Card>
              <div style={{ fontSize:12, fontWeight:600, color:T.green, marginBottom:8 }}>✅ Strengths</div>
              {(scoreResult.strengths || []).map((s, i) => <div key={i} style={{ fontSize:11, color:T.sub, padding:"3px 0", borderBottom:`1px solid ${T.border}` }}>{s}</div>)}
            </Card>
            <Card>
              <div style={{ fontSize:12, fontWeight:600, color:T.red, marginBottom:8 }}>⚠️ Weaknesses</div>
              {(scoreResult.weaknesses || []).map((w, i) => <div key={i} style={{ fontSize:11, color:T.sub, padding:"3px 0", borderBottom:`1px solid ${T.border}` }}>{w}</div>)}
            </Card>
          </div>

          <Card>
            <div style={{ fontSize:12, fontWeight:600, color:T.amber, marginBottom:8 }}>💡 Improvement Suggestions</div>
            {(scoreResult.suggestions || []).map((s, i) => <div key={i} style={{ fontSize:11, color:T.sub, padding:"4px 0", borderBottom:`1px solid ${T.border}` }}>→ {s}</div>)}
          </Card>
        </div>
      )}

      {scoreResult?.error && <Card><div style={{ color:T.red, fontSize:12 }}>Error: {scoreResult.error}</div></Card>}
      {scoreResult?.raw && <Card><div style={{ fontSize:12, color:T.sub, whiteSpace:"pre-wrap" }}>{scoreResult.raw}</div></Card>}

      {history.length > 0 && (
        <Card style={{ marginTop:16 }}>
          <div style={{ fontSize:12, fontWeight:600, color:T.sub, marginBottom:8 }}>📈 Score History</div>
          {history.slice(0, 10).map(h => (
            <div key={h.id} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom:`1px solid ${T.border}`, fontSize:11 }}>
              <span style={{ color:T.mute }}>{fmtDate(h.date)}</span>
              <span style={{ color:T.text }}>{h.grant?.slice(0,25)}</span>
              <span style={{ color: h.overall >= 70 ? T.green : T.yellow, fontWeight:600 }}>{h.overall}/100</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};
