import React, { useMemo } from "react";
import { daysUntil, fmtDate, T, LS } from "../globals";
import { Card, Stat, Empty, Badge } from "../ui";

// ════════════════════════════════════════════════════════════════════════
// MODULE: INTELLIGENCE FEED (Cross-Module)
// ════════════════════════════════════════════════════════════════════════
export const IntelligenceFeed = ({ grants, vaultDocs, contacts, events }) => {
  const insights = useMemo(() => {
    const items = [];
    const now = new Date();

    // Deadline alerts
    grants.filter(g => g.deadline && !["declined","closeout","awarded","active"].includes(g.stage)).forEach(g => {
      const days = daysUntil(g.deadline);
      if (days < 0) items.push({ priority:1, type:"overdue", icon:"🚨", color:T.red, title:`OVERDUE: ${g.title?.slice(0,35)}`, detail:`${Math.abs(days)} days past deadline`, action:"pipeline" });
      else if (days <= 3) items.push({ priority:2, type:"critical", icon:"🔴", color:T.red, title:`Due in ${days}d: ${g.title?.slice(0,35)}`, detail:fmtDate(g.deadline), action:"pipeline" });
      else if (days <= 7) items.push({ priority:3, type:"urgent", icon:"🟡", color:T.yellow, title:`Due in ${days}d: ${g.title?.slice(0,35)}`, detail:fmtDate(g.deadline), action:"pipeline" });
    });

    // Stalled grants
    grants.filter(g => g.stage === "discovered" && g.createdAt && (now - new Date(g.createdAt)) / 86400000 > 14).forEach(g => {
      items.push({ priority:5, type:"stalled", icon:"⏸️", color:T.mute, title:`Stalled: "${g.title?.slice(0,30)}" in Discovery 14+ days`, detail:"Consider qualifying or removing", action:"pipeline" });
    });

    // Empty vault
    if ((vaultDocs || []).length === 0) items.push({ priority:6, type:"tip", icon:"📝", color:T.blue, title:"Document Vault is empty", detail:"Add reusable narratives to speed up applications", action:"vault" });

    // No contacts
    if ((contacts || []).length === 0) items.push({ priority:6, type:"tip", icon:"👥", color:T.purple, title:"No contacts in CRM", detail:"Add program officers and partners to build your network", action:"network" });

    // Drafting bottleneck
    const drafting = grants.filter(g => g.stage === "drafting").length;
    if (drafting > 3) items.push({ priority:4, type:"warning", icon:"⚠️", color:T.yellow, title:`${drafting} grants in Drafting`, detail:"Consider focusing to improve quality — spread too thin", action:"pipeline" });

    // Win rate concern
    const won = grants.filter(g=>["awarded","active","closeout"].includes(g.stage)).length;
    const lost = grants.filter(g=>g.stage==="declined").length;
    if (lost > 5 && won === 0) items.push({ priority:4, type:"warning", icon:"📉", color:T.red, title:"High decline rate with no awards", detail:"Review targeting strategy — consider using Match Scorer", action:"match_scorer" });

    // Positive signals
    if (won > 0 && won > lost) items.push({ priority:8, type:"positive", icon:"🏆", color:T.green, title:`Win rate above 50%!`, detail:`${won} won vs ${lost} declined — strong performance`, action:"winloss" });

    // Award management
    grants.filter(g => g.awardData?.period?.end && ["awarded","active"].includes(g.stage)).forEach(g => {
      const days = daysUntil(g.awardData.period.end);
      if (days >= 0 && days <= 30) items.push({ priority:3, type:"award_ending", icon:"⏰", color:T.orange, title:`Award period ending: ${g.title?.slice(0,30)}`, detail:`${days} days remaining — start closeout planning`, action:"awards" });
    });

    // Match alerts
    const alerts = LS.get("match_alerts", []).filter(a => !a.dismissed);
    if (alerts.length > 0) items.push({ priority:4, type:"matches", icon:"🔔", color:T.amber, title:`${alerts.length} new grant matches found`, detail:"Review potential opportunities", action:"match_alerts" });

    // Tasks overdue
    const tasks = LS.get("tasks", []);
    const overdueTasks = tasks.filter(t => t.dueDate && daysUntil(t.dueDate) < 0 && t.status !== "done").length;
    if (overdueTasks > 0) items.push({ priority:3, type:"tasks", icon:"📝", color:T.red, title:`${overdueTasks} overdue task${overdueTasks>1?"s":""}`, detail:"Review and update your action plan", action:"tasks" });

    return items.sort((a,b) => a.priority - b.priority);
  }, [grants, vaultDocs, contacts, events]);

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:8, marginBottom:16 }}>
        <Card><Stat label="Critical" value={insights.filter(i=>i.priority<=2).length} color={T.red} /></Card>
        <Card><Stat label="Warnings" value={insights.filter(i=>i.priority>2&&i.priority<=4).length} color={T.yellow} /></Card>
        <Card><Stat label="Tips" value={insights.filter(i=>i.priority>4&&i.priority<=6).length} color={T.blue} /></Card>
        <Card><Stat label="Positive" value={insights.filter(i=>i.priority>6).length} color={T.green} /></Card>
      </div>

      {insights.length === 0 ? <Empty icon="✅" title="All clear!" sub="No issues detected across your portfolio" /> :
        insights.map((insight, i) => (
          <Card key={i} style={{ marginBottom:6, borderColor: insight.color+"33" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:36, height:36, borderRadius:"50%", background:insight.color+"15", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>{insight.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:600, color:T.text }}>{insight.title}</div>
                <div style={{ fontSize:11, color:T.mute }}>{insight.detail}</div>
              </div>
              <Badge color={insight.color}>{insight.type}</Badge>
            </div>
          </Card>
        ))
      }
    </div>
  );
};
