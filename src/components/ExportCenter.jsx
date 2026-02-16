import React, { useState } from 'react';
import { Card, Badge } from '../ui';
import { LS, T, PROFILE, fmt, STAGES } from '../globals';

export const ExportCenter = ({ grants, vaultDocs, contacts, events }) => {
  const [exported, setExported] = useState("");

  const exportCSV = () => {
    const headers = "ID,Title,Agency,Amount,Stage,Deadline,Category,Tags,Created,Notes";
    const rows = grants.map(g => `"${g.id}","${(g.title||"").replace(/"/g,'""')}","${g.agency||""}",${g.amount||0},"${g.stage}","${g.deadline||""}","${g.category||""}","${(g.tags||[]).join(";")}","${g.createdAt||""}","${(g.notes||"").replace(/"/g,'""').replace(/\n/g," ")}"`);
    const csv = headers + "\n" + rows.join("\n");
    downloadFile(csv, "grants-export.csv", "text/csv");
  };

  const exportJSON = () => {
    const data = {
      exportDate: new Date().toISOString(), platform: "UNLESS Grant Lifecycle Platform v5.2",
      grants, documents: vaultDocs || [], contacts: contacts || [], events: events || [],
      sections: LS.get("section_library", []), tasks: LS.get("tasks", []),
      budgets: LS.get("budgets", {}), peers: LS.get("peers", []),
      profile: PROFILE,
    };
    downloadFile(JSON.stringify(data, null, 2), "unless-full-export.json", "application/json");
  };

  const exportICal = () => {
    const icalEvents = [];
    grants.filter(g => g.deadline).forEach(g => {
      const d = new Date(g.deadline);
      const dateStr = d.toISOString().replace(/[-:]/g,"").split(".")[0] + "Z";
      icalEvents.push(`BEGIN:VEVENT\nDTSTART:${dateStr}\nSUMMARY:Grant Deadline: ${g.title}\nDESCRIPTION:${g.agency} — ${fmt(g.amount||0)}\nEND:VEVENT`);
    });
    (events || []).forEach(e => {
      const d = new Date(e.date);
      const dateStr = d.toISOString().replace(/[-:]/g,"").split(".")[0] + "Z";
      icalEvents.push(`BEGIN:VEVENT\nDTSTART:${dateStr}\nSUMMARY:${e.title}\nDESCRIPTION:${e.type}${e.notes ? " — " + e.notes : ""}\nEND:VEVENT`);
    });
    const ical = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//UNLESS//Grant Platform//EN\n${icalEvents.join("\n")}\nEND:VCALENDAR`;
    downloadFile(ical, "unless-deadlines.ics", "text/calendar");
  };

  const exportContacts = () => {
    const headers = "Name,Organization,Role,Email,Type,Notes";
    const rows = (contacts||[]).map(c => `"${c.name}","${c.org||""}","${c.role||""}","${c.email||""}","${c.type||""}","${(c.notes||"").replace(/"/g,'""')}"`);
    downloadFile(headers + "\n" + rows.join("\n"), "contacts-export.csv", "text/csv");
  };

  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
    setExported(filename);
    setTimeout(() => setExported(""), 3000);
  };

  const tasks = LS.get("tasks", []);
  const library = LS.get("section_library", []);

  return (
    <div>
      <Card style={{ marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:4 }}>📤 Export Center</div>
        <div style={{ fontSize:11, color:T.sub }}>Export your data in various formats for backup, sharing, or integration with other tools.</div>
        {exported && <Badge color={T.green} style={{ marginTop:6 }}>✅ Exported: {exported}</Badge>}
      </Card>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(250px, 1fr))", gap:12 }}>
        <Card onClick={exportJSON} style={{ cursor:"pointer" }}>
          <div style={{ fontSize:28, marginBottom:8 }}>💾</div>
          <div style={{ fontSize:14, fontWeight:600, color:T.text }}>Full Platform Backup</div>
          <div style={{ fontSize:11, color:T.mute, marginTop:4 }}>JSON — all grants, docs, contacts, events, tasks, sections, budgets</div>
          <div style={{ fontSize:10, color:T.amber, marginTop:8 }}>{grants.length} grants · {(vaultDocs||[]).length} docs · {(contacts||[]).length} contacts</div>
        </Card>

        <Card onClick={exportCSV} style={{ cursor:"pointer" }}>
          <div style={{ fontSize:28, marginBottom:8 }}>📊</div>
          <div style={{ fontSize:14, fontWeight:600, color:T.text }}>Grants → CSV</div>
          <div style={{ fontSize:11, color:T.mute, marginTop:4 }}>Spreadsheet-ready export of all grants with stage, amount, deadlines</div>
          <div style={{ fontSize:10, color:T.amber, marginTop:8 }}>{grants.length} rows</div>
        </Card>

        <Card onClick={exportICal} style={{ cursor:"pointer" }}>
          <div style={{ fontSize:28, marginBottom:8 }}>📅</div>
          <div style={{ fontSize:14, fontWeight:600, color:T.text }}>Deadlines → iCal</div>
          <div style={{ fontSize:11, color:T.mute, marginTop:4 }}>Import deadlines and events into Google Calendar, Outlook, or Apple Calendar</div>
          <div style={{ fontSize:10, color:T.amber, marginTop:8 }}>{grants.filter(g=>g.deadline).length + (events||[]).length} events</div>
        </Card>

        <Card onClick={exportContacts} style={{ cursor:"pointer" }}>
          <div style={{ fontSize:28, marginBottom:8 }}>👥</div>
          <div style={{ fontSize:14, fontWeight:600, color:T.text }}>Contacts → CSV</div>
          <div style={{ fontSize:11, color:T.mute, marginTop:4 }}>Export CRM contacts for use in email campaigns or other tools</div>
          <div style={{ fontSize:10, color:T.amber, marginTop:8 }}>{(contacts||[]).length} contacts</div>
        </Card>

        <Card onClick={() => {
          const report = `UNLESS PLATFORM ANALYTICS\n${"═".repeat(40)}\nExported: ${new Date().toLocaleDateString()}\n\nGrants: ${grants.length}\nDocuments: ${(vaultDocs||[]).length}\nContacts: ${(contacts||[]).length}\nTasks: ${tasks.length} (${tasks.filter(t=>t.status==="done").length} done)\nSection Library: ${library.length}\nCalendar Events: ${(events||[]).length}\n\nPIPELINE:\n${STAGES.map(s => `  ${s.icon} ${s.label}: ${grants.filter(g=>g.stage===s.id).length}`).filter(x=>!x.endsWith(": 0")).join("\n")}\n\nTOTAL SOUGHT: ${fmt(grants.reduce((s,g)=>s+(g.amount||0),0))}\nTOTAL AWARDED: ${fmt(grants.filter(g=>["awarded","active"].includes(g.stage)).reduce((s,g)=>s+(g.amount||0),0))}`;
          navigator.clipboard?.writeText(report);
          setExported("Analytics (copied to clipboard)");
          setTimeout(() => setExported(""), 3000);
        }} style={{ cursor:"pointer" }}>
          <div style={{ fontSize:28, marginBottom:8 }}>📈</div>
          <div style={{ fontSize:14, fontWeight:600, color:T.text }}>Quick Analytics</div>
          <div style={{ fontSize:11, color:T.mute, marginTop:4 }}>Copy platform summary stats to clipboard</div>
        </Card>

        <Card onClick={() => {
          const data = { grants: LS.get("grants",[]), vault_docs: LS.get("vault_docs",[]), contacts: LS.get("contacts",[]), events: LS.get("events",[]), tasks: LS.get("tasks",[]), section_library: LS.get("section_library",[]), budgets: LS.get("budgets",{}), peers: LS.get("peers",[]), saved_funders: LS.get("saved_funders",[]), match_alerts: LS.get("match_alerts",[]), watch_terms: LS.get("watch_terms",[]) };
          downloadFile(JSON.stringify(data), `unless-backup-${new Date().toISOString().split("T")[0]}.json`, "application/json");
        }} style={{ cursor:"pointer" }}>
          <div style={{ fontSize:28, marginBottom:8 }}>🔐</div>
          <div style={{ fontSize:14, fontWeight:600, color:T.text }}>Raw localStorage Backup</div>
          <div style={{ fontSize:11, color:T.mute, marginTop:4 }}>Complete backup of all localStorage data for migration or restoration</div>
        </Card>
      </div>
    </div>
  );
};
