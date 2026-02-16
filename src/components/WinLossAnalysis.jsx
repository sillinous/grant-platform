import React from 'react';
import { Card, Stat } from '../ui';
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
            <div key={g.id} style={{ padding:"8px 0", borderBottom:`1px solid ${T.border}` }}>
              <div style={{ fontSize:12, color:T.text }}>{g.title?.slice(0, 50)}</div>
              <div style={{ fontSize:11, color:T.mute, marginTop:2 }}>{g.agency} · {fmt(g.amount || 0)}</div>
              {g.notes && <div style={{ fontSize:11, color:T.sub, marginTop:4, fontStyle:"italic" }}>Notes: {g.notes}</div>}
            </div>
          ))
        }
      </Card>
    </div>
  );
};
