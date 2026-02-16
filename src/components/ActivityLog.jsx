import React, { useState, useMemo } from 'react';
import { Card, Btn } from '../ui';
import { LS, T, fmt, fmtDate } from '../globals';

export const ActivityLog = ({ grants }) => {
  /* eslint-disable-next-line no-unused-vars */
  const [logs] = useState(() => LS.get("activity_log", []));

  const [filter, setFilter] = useState("all");

  const autoLogs = useMemo(() => {
    const entries = [];
    grants.forEach(g => {
      if (g.createdAt) entries.push({ id:`c_${g.id}`, type:"created", title:`Added "${g.title?.slice(0,40)}" to pipeline`, date:g.createdAt, icon:"➕", color:T.blue });
      if (g.stage === "submitted") entries.push({ id:`s_${g.id}`, type:"submitted", title:`Submitted "${g.title?.slice(0,40)}"`, date:g.createdAt, icon:"📤", color:T.green });
      if (g.stage === "awarded") entries.push({ id:`a_${g.id}`, type:"awarded", title:`Awarded "${g.title?.slice(0,40)}" — ${fmt(g.amount||0)}`, date:g.createdAt, icon:"🏆", color:T.amber });
      if (g.stage === "declined") entries.push({ id:`d_${g.id}`, type:"declined", title:`Declined: "${g.title?.slice(0,40)}"`, date:g.createdAt, icon:"❌", color:T.red });
    });
    return entries.sort((a,b) => new Date(b.date) - new Date(a.date));
  }, [grants]);

  const allLogs = [...autoLogs, ...logs].sort((a,b) => new Date(b.date) - new Date(a.date));
  const filtered = filter === "all" ? allLogs : allLogs.filter(l => l.type === filter);

  return (
    <div>
      <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
        {[{ id:"all", label:"All" }, { id:"created", label:"➕ Added" }, { id:"submitted", label:"📤 Submitted" }, { id:"awarded", label:"🏆 Awarded" }, { id:"declined", label:"❌ Declined" }].map(f => (
          <Btn key={f.id} size="sm" variant={filter === f.id ? "primary" : "ghost"} onClick={() => setFilter(f.id)}>{f.label}</Btn>
        ))}
      </div>

      <Card>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>📜 Activity Timeline</div>
        {filtered.length === 0 ? <div style={{ color:T.mute, fontSize:12 }}>No activity recorded yet</div> :
          filtered.slice(0, 50).map((log, i) => (
            <div key={log.id || i} style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"10px 0", borderBottom:`1px solid ${T.border}` }}>
              <div style={{ width:32, height:32, borderRadius:"50%", background:log.color+"15", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>{log.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, color:T.text }}>{log.title}</div>
                <div style={{ fontSize:10, color:T.mute, marginTop:2 }}>{log.date ? fmtDate(log.date) : ""}</div>
              </div>
            </div>
          ))
        }
      </Card>
    </div>
  );
};
