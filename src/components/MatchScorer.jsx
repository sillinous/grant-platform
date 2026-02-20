import React, { useState } from 'react';
import { Card, Btn, Empty, Progress } from '../ui';
import { API } from '../api';
import { T, LS, fmt, fmtDate, PROFILE, STAGE_MAP } from '../globals';
import { useStore } from '../store';

export const MatchScorer = () => {
  const { grants } = useStore();
  const [results, setResults] = useState(() => LS.get("match_analyses", {}));
  const [loading, setLoading] = useState(null);

  const quickScore = (grant) => {
    let score = 0;
    const text = `${grant.title} ${grant.description} ${grant.category} ${grant.agency}`.toLowerCase();
    const boosts = [
      { terms: ["rural", "underserved"], pts: 15 }, { terms: ["disability", "disabled", "ada"], pts: 15 },
      { terms: ["small business", "entrepreneur", "sbir", "sttr"], pts: 12 }, { terms: ["technology", "ai", "innovation", "tech"], pts: 10 },
      { terms: ["poverty", "low-income", "economically disadvantaged"], pts: 12 }, { terms: ["illinois", "midwest"], pts: 8 },
      { terms: ["workforce", "employment", "training"], pts: 8 }, { terms: ["community development", "capacity building"], pts: 8 },
      { terms: ["agriculture", "aquaculture", "farming"], pts: 6 }, { terms: ["music", "arts", "creative"], pts: 5 },
    ];
    boosts.forEach(b => { if (b.terms.some(t => text.includes(t))) score += b.pts; });
    return Math.min(score, 100);
  };

  const deepAnalysis = async (grant) => {
    setLoading(grant.id);
    const context = `APPLICANT PROFILE:
- Name: ${PROFILE.name}, Location: ${PROFILE.loc}
- Demographics: Rural (${PROFILE.rural}), Disabled (${PROFILE.disabled}), Below Poverty (${PROFILE.poverty})
- Tags: ${PROFILE.tags.join(", ")}
- Businesses: ${PROFILE.businesses.map(b => `${b.n} (${b.sec}: ${b.d})`).join("; ")}`;

    const sys = `You are a grant strategy expert. Analyze how well this grant opportunity matches the applicant profile. Provide:
1. Overall match score (0-100)
2. 3-5 key strengths (why this is a good fit)
3. 2-3 gaps or concerns
4. Specific recommendations for the application
5. Suggested angle/narrative approach
Be specific and actionable. Reference the applicant's actual profile data.`;

    const result = await API.callAI([{ role: "user", content: `${context}\n\nGRANT OPPORTUNITY:\nTitle: ${grant.title}\nAgency: ${grant.agency}\nAmount: ${fmt(grant.amount || 0)}\nDescription: ${grant.description || "No description"}\nCategory: ${grant.category || "General"}\n\nAnalyze the fit.` }], sys);

    const newAnalyses = { ...analyses, [grant.id]: { text: result.error || result.text, date: new Date().toISOString() } };
    setAnalyses(newAnalyses);
    LS.set("match_analyses", newAnalyses);
    setLoading(null);
  };

  const scored = grants.map(g => ({ ...g, quickScore: quickScore(g) })).sort((a, b) => b.quickScore - a.quickScore);

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 4 }}>🎯 Grant-Profile Match Analysis</div>
        <div style={{ fontSize: 11, color: T.sub }}>Quick scores are keyword-based. Deep Analysis uses AI to evaluate semantic fit against your full profile.</div>
      </Card>

      {scored.length === 0 ? <Empty icon="🎯" title="No grants to analyze" sub="Add grants from Discovery to see match scores" /> :
        scored.map(g => (
          <Card key={g.id} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{g.title?.slice(0, 55)}</div>
                <div style={{ fontSize: 11, color: T.mute, marginTop: 2 }}>{g.agency} · {STAGE_MAP[g.stage]?.label}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: g.quickScore >= 60 ? T.green : g.quickScore >= 30 ? T.yellow : T.red }}>{g.quickScore}</div>
                  <div style={{ fontSize: 9, color: T.mute }}>Quick</div>
                </div>
                <Btn size="sm" variant="default" onClick={() => deepAnalysis(g)} disabled={loading === g.id}>
                  {loading === g.id ? "⏳" : "🧠"} Deep
                </Btn>
              </div>
            </div>
            <Progress value={g.quickScore} max={100} color={g.quickScore >= 60 ? T.green : g.quickScore >= 30 ? T.yellow : T.red} height={4} />
            {analyses[g.id] && (
              <div style={{ marginTop: 12, padding: 12, background: T.panel, borderRadius: 6, fontSize: 12, color: T.sub, lineHeight: 1.6, whiteSpace: "pre-wrap", maxHeight: 300, overflow: "auto" }}>
                {analyses[g.id].text}
                <div style={{ fontSize: 10, color: T.dim, marginTop: 8 }}>Analyzed {fmtDate(analyses[g.id].date)}</div>
              </div>
            )}
          </Card>
        ))
      }
    </div>
  );
};

