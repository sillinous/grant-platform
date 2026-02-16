import React, { useState, useEffect } from 'react';
import { Card, Input, Btn, Stat, Badge, Empty } from '../ui';
import { LS, T, uid, fmt, fmtDate } from '../globals';
import { API } from '../api';

export const MatchAlerts = ({ grants, addGrant }) => {
  const [alerts, setAlerts] = useState(() => LS.get("match_alerts", []));
  const [watchTerms, setWatchTerms] = useState(() => LS.get("watch_terms", ["rural technology","disability entrepreneurship","small business innovation","AI research","workforce development"]));
  const [newTerm, setNewTerm] = useState("");
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState(() => LS.get("last_scan", null));

  useEffect(() => { LS.set("match_alerts", alerts); }, [alerts]);
  useEffect(() => { LS.set("watch_terms", watchTerms); }, [watchTerms]);

  const addWatch = () => {
    if (!newTerm.trim() || watchTerms.includes(newTerm.trim())) return;
    setWatchTerms(prev => [...prev, newTerm.trim()]);
    setNewTerm("");
  };

  const removeWatch = (term) => setWatchTerms(prev => prev.filter(t => t !== term));

  const scanAll = async () => {
    setScanning(true);
    const newAlerts = [];
    for (const term of watchTerms.slice(0, 5)) {
      try {
        const data = await API.searchGrants(term, { rows: 5 });
        const hits = data.oppHits || [];
        hits.forEach(opp => {
          const title = opp.title || opp.opportunityTitle || "";
          const alreadyTracked = grants.some(g => g.title === title);
          const alreadyAlerted = alerts.some(a => a.title === title);
          if (!alreadyTracked && !alreadyAlerted) {
            const text = `${title} ${opp.description || opp.synopsis || ""}`.toLowerCase();
            let score = 0;
            if (text.includes("rural") || text.includes("underserved")) score += 15;
            if (text.includes("disab")) score += 15;
            if (text.includes("small business") || text.includes("sbir")) score += 12;
            if (text.includes("technology") || text.includes("ai") || text.includes("innovation")) score += 10;
            if (text.includes("poverty") || text.includes("low-income")) score += 12;
            if (text.includes("illinois")) score += 8;
            if (score >= 10) {
              newAlerts.push({
                id: uid(), title, agency: opp.agency || opp.agencyName || "",
                amount: opp.awardCeiling || opp.estimatedFunding || 0,
                deadline: opp.closeDate || "", description: (opp.description || opp.synopsis || "").slice(0, 300),
                matchScore: Math.min(score, 100), matchTerm: term,
                discoveredAt: new Date().toISOString(), dismissed: false, oppId: opp.id || opp.opportunityId,
              });
            }
          }
        });
      } catch {}
      await new Promise(r => setTimeout(r, 500));
    }
    setAlerts(prev => [...newAlerts, ...prev].slice(0, 50));
    setLastScan(new Date().toISOString());
    LS.set("last_scan", new Date().toISOString());
    setScanning(false);
  };

  const dismissAlert = (id) => setAlerts(prev => prev.map(a => a.id === id ? { ...a, dismissed:true } : a));
  const trackAlert = (alert) => {
    addGrant({
      id: uid(), title: alert.title, agency: alert.agency, amount: alert.amount,
      deadline: alert.deadline, stage: "discovered", description: alert.description,
      oppId: alert.oppId, createdAt: new Date().toISOString(), notes: `Discovered via Match Alert (${alert.matchTerm})`, tags: [alert.matchTerm],
    });
    dismissAlert(alert.id);
  };

  const activeAlerts = alerts.filter(a => !a.dismissed);

  return (
    <div>
      <Card style={{ marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:8 }}>🔔 Grant Watch List</div>
        <div style={{ fontSize:11, color:T.sub, marginBottom:8 }}>Monitor for new grants matching these keywords. Scan runs against Grants.gov and scores matches against your profile.</div>
        <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:8 }}>
          {watchTerms.map(t => (
            <Badge key={t} color={T.blue} style={{ cursor:"pointer" }} onClick={() => removeWatch(t)}>{t} ✕</Badge>
          ))}
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <Input value={newTerm} onChange={setNewTerm} placeholder="Add watch keyword..." style={{ flex:1 }} onKeyDown={e => e.key === "Enter" && addWatch()} />
          <Btn size="sm" onClick={addWatch}>+ Add</Btn>
          <Btn variant="primary" onClick={scanAll} disabled={scanning}>{scanning ? "⏳ Scanning..." : "🔍 Scan Now"}</Btn>
        </div>
        {lastScan && <div style={{ fontSize:10, color:T.dim, marginTop:6 }}>Last scan: {fmtDate(lastScan)}</div>}
      </Card>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:8, marginBottom:16 }}>
        <Card><Stat label="Active Alerts" value={activeAlerts.length} color={T.amber} /></Card>
        <Card><Stat label="Watch Terms" value={watchTerms.length} color={T.blue} /></Card>
        <Card><Stat label="Tracked" value={alerts.filter(a => a.dismissed).length} color={T.green} /></Card>
        <Card><Stat label="Avg Match" value={activeAlerts.length > 0 ? `${Math.round(activeAlerts.reduce((s,a)=>s+a.matchScore,0)/activeAlerts.length)}` : "—"} color={T.purple} /></Card>
      </div>

      {activeAlerts.length === 0 ? <Empty icon="🔔" title="No new alerts" sub="Click 'Scan Now' to check for new matching grants" /> :
        activeAlerts.sort((a,b) => b.matchScore - a.matchScore).map(a => (
          <Card key={a.id} style={{ marginBottom:8, borderColor: a.matchScore >= 50 ? T.green+"44" : T.border }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                  <Badge color={a.matchScore >= 50 ? T.green : a.matchScore >= 25 ? T.yellow : T.mute}>Match: {a.matchScore}</Badge>
                  <Badge color={T.blue}>{a.matchTerm}</Badge>
                </div>
                <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:2 }}>{a.title?.slice(0,60)}</div>
                <div style={{ fontSize:11, color:T.mute }}>{a.agency}</div>
                <div style={{ fontSize:11, color:T.sub, marginTop:4, lineHeight:1.4 }}>{a.description?.slice(0,150)}...</div>
              </div>
              <div style={{ textAlign:"right", marginLeft:12, flexShrink:0 }}>
                {a.amount > 0 && <div style={{ fontSize:14, fontWeight:700, color:T.green }}>{fmt(a.amount)}</div>}
                {a.deadline && <div style={{ fontSize:11, color:T.mute }}>{fmtDate(a.deadline)}</div>}
                <div style={{ display:"flex", gap:4, marginTop:8 }}>
                  <Btn size="sm" variant="success" onClick={() => trackAlert(a)}>📋 Track</Btn>
                  <Btn size="sm" variant="ghost" onClick={() => dismissAlert(a.id)}>✕</Btn>
                </div>
              </div>
            </div>
          </Card>
        ))
      }
    </div>
  );
};
