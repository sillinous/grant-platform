import React from "react";
import { T, PROFILE, fmt, fmtDate, daysUntil, pct, STAGES } from "../globals";
import { Btn, Card, Badge, Stat } from "../ui";

export const Dashboard = ({ grants, docs, contacts, vaultDocs, events, navigate }) => {
  const active = grants.filter(g => !["declined","closeout"].includes(g.stage));
  const awarded = grants.filter(g => ["awarded","active"].includes(g.stage));
  const urgent = active.filter(g => g.deadline && daysUntil(g.deadline) <= 14 && daysUntil(g.deadline) >= 0).sort((a,b) => new Date(a.deadline) - new Date(b.deadline));
  const recentDocs = (vaultDocs || []).slice(-5).reverse();
  const upcomingEvents = (events || []).filter(e => new Date(e.date) >= new Date()).sort((a,b) => new Date(a.date) - new Date(b.date)).slice(0, 5);
  const totalSought = active.reduce((s, g) => s + (g.amount || 0), 0);
  const totalAwarded = awarded.reduce((s, g) => s + (g.amount || 0), 0);
  const winRate = grants.filter(g=>["awarded","active","closeout"].includes(g.stage)).length / Math.max(grants.filter(g=>["awarded","active","closeout","declined"].includes(g.stage)).length, 1) * 100;

  return (
    <div>
      {/* New User Welcome */}
      {!PROFILE.name && (
        <Card style={{ marginBottom:16, borderColor:T.amber+"66" }} glow>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontSize:16, fontWeight:700, color:T.amber, marginBottom:4 }}>👋 Welcome to UNLESS Grant Platform</div>
              <div style={{ fontSize:12, color:T.sub, lineHeight:1.5 }}>Set up your profile first — it powers grant matching, AI narratives, and personalized recommendations across all 39 modules.</div>
            </div>
            <Btn variant="primary" onClick={() => navigate("settings")}>⚙️ Set Up Profile</Btn>
          </div>
        </Card>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(140px, 1fr))", gap:12, marginBottom:20 }}>
        <Card><Stat label="Active Grants" value={active.length} color={T.blue} /></Card>
        <Card><Stat label="Total Sought" value={fmt(totalSought)} color={T.amber} /></Card>
        <Card><Stat label="Awarded" value={fmt(totalAwarded)} color={T.green} /></Card>
        <Card><Stat label="Win Rate" value={pct(winRate)} color={winRate > 50 ? T.green : T.yellow} /></Card>
        <Card><Stat label="Documents" value={(vaultDocs||[]).length} color={T.purple} /></Card>
        <Card><Stat label="Contacts" value={(contacts||[]).length} color={T.cyan} /></Card>
      </div>

      {/* Pipeline Overview */}
      <Card style={{ marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>📊 Pipeline Overview</div>
        <div style={{ display:"flex", gap:2, flexWrap:"wrap" }}>
          {STAGES.map(s => {
            const count = grants.filter(g => g.stage === s.id).length;
            return count > 0 ? (
              <div key={s.id} style={{ padding:"6px 10px", background:s.color+"15", borderRadius:6, fontSize:11, color:s.color, display:"flex", alignItems:"center", gap:4 }}>
                <span>{s.icon}</span> {s.label} <strong>{count}</strong>
              </div>
            ) : null;
          })}
          {grants.length === 0 && <div style={{ color:T.mute, fontSize:12 }}>No grants in pipeline yet. Start by discovering opportunities.</div>}
        </div>
      </Card>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        {/* Urgent Deadlines */}
        <Card>
          <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>🚨 Urgent Deadlines</div>
          {urgent.length === 0 ? <div style={{ color:T.mute, fontSize:12 }}>No deadlines in the next 14 days</div> :
            urgent.map(g => (
              <div key={g.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:`1px solid ${T.border}` }}>
                <div style={{ fontSize:12, color:T.text }}>{g.title?.slice(0,40)}</div>
                <Badge color={daysUntil(g.deadline) <= 3 ? T.red : T.yellow}>{daysUntil(g.deadline)}d</Badge>
              </div>
            ))
          }
        </Card>

        {/* Recent Activity */}
        <Card>
          <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>📅 Upcoming Events</div>
          {upcomingEvents.length === 0 ? <div style={{ color:T.mute, fontSize:12 }}>No upcoming events</div> :
            upcomingEvents.map(e => (
              <div key={e.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:`1px solid ${T.border}` }}>
                <div style={{ fontSize:12, color:T.text }}>{e.title?.slice(0,35)}</div>
                <div style={{ fontSize:11, color:T.mute }}>{fmtDate(e.date)}</div>
              </div>
            ))
          }
        </Card>
      </div>

      {/* Quick Actions */}
      <Card style={{ marginTop:16 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>⚡ Quick Actions</div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <Btn variant="primary" size="sm" onClick={() => navigate("discovery")}>🔍 Find Grants</Btn>
          <Btn size="sm" onClick={() => navigate("pipeline")}>📋 Pipeline</Btn>
          <Btn size="sm" onClick={() => navigate("intel_feed")}>🧿 Intel Feed</Btn>
          <Btn size="sm" onClick={() => navigate("rfp_parser")}>📑 Parse RFP</Btn>
          <Btn size="sm" onClick={() => navigate("ai_drafter")}>✍️ AI Drafter</Btn>
          <Btn size="sm" onClick={() => navigate("templates")}>📋 Templates</Btn>
          <Btn size="sm" onClick={() => navigate("advisor")}>🧠 AI Advisor</Btn>
          <Btn size="sm" onClick={() => navigate("budget")}>💵 Budget</Btn>
          <Btn size="sm" onClick={() => navigate("export")}>📤 Export</Btn>
        </div>
      </Card>
    </div>
  );
};
