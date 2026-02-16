import React from 'react';
import { Card, Stat, Badge, Progress, MiniBar } from '../ui';
import { T, fmt, daysUntil, STAGES } from '../globals';

export const PortfolioOptimizer = ({ grants }) => {
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

  const recs = [];
  if (grants.filter(g => g.stage === "drafting").length > 3) recs.push("You have 3+ grants in drafting — consider focusing to improve quality");
  if (grants.filter(g => g.stage === "preparing").length > 5) recs.push("5+ grants preparing — some may stall. Prioritize by deadline and fit score");
  if (awarded.length === 0 && grants.length > 5) recs.push("No awards yet with 5+ grants tracked — review match quality and narrative strength");
  if (agencyEntries.length >= 3) recs.push("Good agency diversification! Continue building multi-source pipeline");

  return (
    <div>
      <Card style={{ marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>⚠️ Risk Analysis</div>
        {risks.length === 0 ? <div style={{ color:T.green, fontSize:12 }}>✅ No significant risks detected</div> :
          risks.map((r, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 0", borderBottom:`1px solid ${T.border}` }}>
              <Badge color={r.level === "high" ? T.red : r.level === "medium" ? T.yellow : T.green}>{r.level}</Badge>
              <span style={{ fontSize:12, color:T.text }}>{r.msg}</span>
            </div>
          ))
        }
      </Card>

      <Card style={{ marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>📊 Pipeline Distribution</div>
        <MiniBar data={byStage.map(x => ({ label:x.stage.label.slice(0,6), value:x.grants.length }))} height={100} color={T.amber} />
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(150px, 1fr))", gap:6, marginTop:8 }}>
          {byStage.map(x => (
            <div key={x.stage.id} style={{ display:"flex", justifyContent:"space-between", padding:4, fontSize:11 }}>
              <span style={{ color:x.stage.color }}>{x.stage.icon} {x.stage.label}</span>
              <span style={{ color:T.text }}>{x.grants.length} · {fmt(x.total)}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>🏛️ Agency Concentration</div>
        {agencyEntries.map(([agency, count]) => (
          <div key={agency} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"4px 0", borderBottom:`1px solid ${T.border}` }}>
            <span style={{ fontSize:12, color:T.text }}>{agency}</span>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <Progress value={count} max={Math.max(...agencyEntries.map(x=>x[1]))} color={T.blue} height={4} />
              <Badge color={T.blue}>{count}</Badge>
            </div>
          </div>
        ))}
      </Card>

      <Card>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>💡 Recommendations</div>
        {recs.length === 0 ? <div style={{ color:T.mute, fontSize:12 }}>Add more grants to see portfolio optimization recommendations</div> :
          recs.map((r, i) => (
            <div key={i} style={{ padding:"6px 0", borderBottom:`1px solid ${T.border}`, fontSize:12, color:T.sub }}>💡 {r}</div>
          ))
        }
      </Card>
    </div>
  );
};
