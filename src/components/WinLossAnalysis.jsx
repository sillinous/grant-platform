import React from 'react';
import { Card, Stat, Btn } from '../ui';
import { T, fmt, pct } from '../globals';

export const WinLossAnalysis = ({ grants }) => {
  const awarded = grants.filter(g => ["awarded","active","closeout"].includes(g.stage));
  const declined = grants.filter(g => g.stage === "declined");
  const total = awarded.length + declined.length;
  const winRate = total > 0 ? (awarded.length / total) * 100 : 0;

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:8, marginBottom:16 }}>
        <Card><Stat label="Won" value={awarded.length} color={T.green} /></Card>
        <Card><Stat label="Lost" value={declined.length} color={T.red} /></Card>
        <Card><Stat label="Win Rate" value={pct(winRate)} color={winRate > 50 ? T.green : T.yellow} /></Card>
        <Card><Stat label="Total Decided" value={total} color={T.amber} /></Card>
      </div>

      <Card style={{ marginBottom:12 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>🏆 Awarded Grants</div>
        {awarded.length === 0 ? <div style={{ color:T.mute, fontSize:12 }}>No awards yet — keep applying!</div> :
          awarded.map(g => (
            <div key={g.id} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:`1px solid ${T.border}` }}>
              <span style={{ fontSize:12, color:T.text }}>{g.title?.slice(0, 40)}</span>
              <span style={{ fontSize:12, fontWeight:600, color:T.green }}>{fmt(g.amount || 0)}</span>
            </div>
          ))
        }
      </Card>

      <Card>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>❌ Declined Grants</div>
        {declined.length === 0 ? <div style={{ color:T.mute, fontSize:12 }}>No declined grants on record</div> :
          declined.map(g => (
            <div key={g.id} style={{ padding: "12px 0", borderBottom: `1px solid ${T.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 12, color: T.text }}>{g.title?.slice(0, 50)}</div>
                  <div style={{ fontSize: 11, color: T.mute, marginTop: 2 }}>{g.agency} · {fmt(g.amount || 0)}</div>
                </div>
                <PostMortemButton grant={g} />
              </div>
              {g.notes && <div style={{ fontSize:11, color:T.sub, marginTop:4, fontStyle:"italic" }}>Notes: {g.notes}</div>}
              {g.postMortem && (
                <div style={{ marginTop: 8, padding: 8, background: T.red + "11", borderRadius: 4, border: `1px solid ${T.red}22`, fontSize: 10 }}>
                  <div style={{ fontWeight: 700, color: T.red, marginBottom: 4 }}>🧠 AI Lessons Learned</div>
                  <div style={{ color: T.text, lineHeight: 1.4 }}>{g.postMortem}</div>
                </div>
              )}
            </div>
          ))
        }
      </Card>
    </div>
  );
};

const PostMortemButton = ({ grant }) => {
  const [loading, setLoading] = React.useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const prompt = `Analyze why this grant application was declined. 
      Title: ${grant.title}
      Agency: ${grant.agency}
      Amount: ${fmt(grant.amount || 0)}
      Notes/Feedback: ${grant.notes || "None provided"}
      
      Provide a concise (2-3 sentence) post-mortem highlighting the likely strategic gap or lesson learned for future applications. Focus on actionable insights.`;

      const res = await API.callAI(prompt, "You are a Grant Strategy Consultant specializing in win/loss analysis.");
      // In a real app, we'd call updateGrant. For now, we'll just simulate it if updateGrant was passed as prop.
      // Since it's not passed, we'll just show it locally or use a global update if available via context (not yet).
      // Let's assume for this phase we want to see the UI/logic.
      alert("AI Post-Mortem Generated:\n\n" + res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Btn variant="ghost" size="xs" onClick={generate} loading={loading}>
      {loading ? "Analyzing..." : "🧠 Post-Mortem"}
    </Btn>
  );
};
