import React, { useState, useEffect } from 'react';
import { Card, Input, Btn, Stat, Badge, Empty } from '../ui';
import { LS, T, uid, fmt, fmtDate } from '../globals';
import { API } from '../api';
import { useStore } from '../store';

export const MatchAlerts = ({ onAdd }) => {
  const { grants, addGrant: storeAddGrant } = useStore();
  const activeOnAdd = onAdd || storeAddGrant;
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
    activeOnAdd({
      id: uid(), title: alert.title, agency: alert.agency, amount: alert.amount,
      deadline: alert.deadline, stage: "discovered", description: alert.description,
      oppId: alert.oppId, createdAt: new Date().toISOString(), notes: `Discovered via Match Alert (${alert.matchTerm})`, tags: [alert.matchTerm],
    });
    dismissAlert(alert.id);
  };

  const activeAlerts = alerts.filter(a => !a.dismissed);

  return (
    <div className="animate-in">
      <Card style={{ marginBottom: 24, background: T.glassLg }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ fontSize: 20 }}>🔔</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text, fontFamily: "Outfit" }}>Grant Watch List</div>
        </div>
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        <Card><Stat label="Active Alerts" value={activeAlerts.length} color={T.amber} /></Card>
        <Card><Stat label="Watch Terms" value={watchTerms.length} color={T.blue} /></Card>
        <Card><Stat label="Tracked" value={alerts.filter(a => a.dismissed).length} color={T.green} /></Card>
        <Card><Stat label="Avg Match" value={activeAlerts.length > 0 ? `${Math.round(activeAlerts.reduce((s,a)=>s+a.matchScore,0)/activeAlerts.length)}` : "—"} color={T.purple} /></Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
        {activeAlerts.length === 0 ? <div style={{ gridColumn: "1 / -1" }}><Empty icon="🔔" title="No new alerts" sub="Click 'Scan Now' to check for new matching grants" /></div> :
          activeAlerts.sort((a, b) => b.matchScore - a.matchScore).map(a => (
            <Card key={a.id} glow={a.matchScore >= 75} style={{ borderTop: `6px solid ${a.matchScore >= 50 ? T.green : T.yellow}`, padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <Badge color={a.matchScore >= 50 ? T.green : a.matchScore >= 25 ? T.yellow : T.mute} style={{ background: a.matchScore >= 50 ? `${T.green}11` : `${T.yellow}11`, fontWeight: 800 }}>MATCH: {a.matchScore}%</Badge>
                    <Badge color={T.blue} style={{ background: `${T.blue}11`, textTransform: "none", fontWeight: 700 }}>#{a.matchTerm}</Badge>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: T.text, marginBottom: 6, fontFamily: "Outfit", lineHeight: 1.3 }}>{a.title}</div>
                  <div style={{ fontSize: 11, color: T.mute, fontWeight: 800, letterSpacing: 1 }}>{a.agency?.toUpperCase()}</div>
                </div>
                <div style={{ textAlign: "right", marginLeft: 20, flexShrink: 0 }}>
                  {a.amount > 0 && <div style={{ fontSize: 20, fontWeight: 900, color: T.green, letterSpacing: "-0.04em" }}>{fmt(a.amount)}</div>}
                  {a.deadline && <div style={{ fontSize: 11, color: T.mute, fontWeight: 800, marginTop: 4 }}>{fmtDate(a.deadline).toUpperCase()}</div>}
                </div>
              </div>

              <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.7, marginBottom: 24, padding: 20, background: "rgba(255,255,255,0.02)", borderRadius: 16, border: `1px solid ${T.glassBorder}`, fontStyle: "italic" }}>
                {a.description?.slice(0, 250)}...
              </div>

              <div style={{ display: "flex", gap: 12, borderTop: `1px solid ${T.glassBorder}`, paddingTop: 24 }}>
                <Btn variant="success" style={{ flex: 1 }} onClick={() => trackAlert(a)}>📋 Initialize Tracking</Btn>
                <Btn variant="ghost" onClick={() => dismissAlert(a.id)}>✕ Dismiss</Btn>
              </div>
            </Card>
          ))
        }
      </div>
    </div>
  );
};
