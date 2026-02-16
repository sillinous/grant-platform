import React, { useState, useEffect } from 'react';
import { Card, Btn, Badge, Input, Select, TextArea, Tab, Empty, Modal } from '../ui';
import { T, LS, uid, fmtDate } from '../globals';
import { API } from '../api';

export const CollaborationHub = ({ grants }) => {
  const [notes, setNotes] = useState(() => LS.get("collab_notes", []));
  const [showAdd, setShowAdd] = useState(false);
  const [newNote, setNewNote] = useState({ grantId:"", content:"", type:"note", priority:"normal" });
  const [filter, setFilter] = useState("all");
  const [rfpText, setRfpText] = useState("");
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState("lead"); // lead | partner
  const [activity, setActivity] = useState(() => LS.get("collab_activity", [
    { id: 1, user: "Lead Admin", action: "Grant Proposal Orchestrated", time: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
    { id: 2, user: "Partner X", action: "Uploaded Fiscal Report", time: new Date(Date.now() - 1000 * 60 * 30).toISOString() }
  ]));

  useEffect(() => { LS.set("collab_activity", activity); }, [activity]);

  const logActivity = (action) => {
    setActivity(prev => [{ id: uid(), user: userRole === "lead" ? "Lead Admin" : "Partner Org", action, time: new Date().toISOString() }, ...prev.slice(0, 19)]);
  };

  useEffect(() => { LS.set("collab_notes", notes); }, [notes]);

  const addNote = () => {
    if (!newNote.content) return;
    setNotes(prev => [{ ...newNote, id:uid(), createdAt:new Date().toISOString(), resolved:false }, ...prev]);
    logActivity(`Added new ${newNote.type}: ${newNote.content.slice(0, 20)}...`);
    setNewNote({ grantId:"", content:"", type:"note", priority:"normal" });
    setShowAdd(false);
  };

  const orchestrateTasks = async () => {
    if (!rfpText.trim()) return;
    setLoading(true);
    const sys = `You are a Grant Project Manager. Analyze this RFP snippet and generate a high-priority task list for a collaborative team.
Format each task as JSON:
[{"content": "...", "type": "...", "priority": "..."}]

Types: question, decision, blocker, idea, note
Priorities: high, normal`;

    const result = await API.callAI([{ role: "user", content: rfpText }], sys);
    if (!result.error) {
      try {
        const cleaned = result.text.replace(/```json\n?|```/g, "").trim();
        const tasks = JSON.parse(cleaned);
        const formatted = tasks.map(t => ({ ...t, id: uid(), createdAt: new Date().toISOString(), resolved: false }));
        setNotes(prev => [...formatted, ...prev]);
        logActivity(`Orchestrated ${tasks.length} tasks from RFP analysis.`);
        setRfpText("");
        alert(`🚀 Orchestrated ${tasks.length} tasks!`);
      } catch (e) { alert("Failed to parse AI orchestration."); }
    }
    setLoading(false);
  };

  const toggleResolve = (id) => setNotes(prev => prev.map(n => n.id === id ? { ...n, resolved:!n.resolved } : n));
  const deleteNote = (id) => setNotes(prev => prev.filter(n => n.id !== id));

  const TYPES = { note:{ icon:"📝", color:T.blue, label:"Note" }, question:{ icon:"❓", color:T.yellow, label:"Question" }, decision:{ icon:"✅", color:T.green, label:"Decision" }, blocker:{ icon:"🚫", color:T.red, label:"Blocker" }, idea:{ icon:"💡", color:T.amber, label:"Idea" } };

  const filtered = notes.filter(n => {
    if (filter === "all") return true;
    if (filter === "active") return !n.resolved;
    if (filter === "resolved") return n.resolved;
    return n.type === filter;
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>🤝 Consortium Orchestrator</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: T.sub }}>Viewing as:</span>
          <Select value={userRole} onChange={setUserRole} size="sm" options={[
            { value: "lead", label: "🏢 Prime Recipient (Admin)" },
            { value: "partner", label: "🤝 Sub-Recipient (Partner)" },
          ]} />
        </div>
      </div>

      {userRole === "partner" && (
        <div style={{ background: T.blue + "15", padding: "10px 16px", borderRadius: 8, border: `1px solid ${T.blue}33`, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.blue }}>PARTNER VIEW ACTIVE</div>
          <div style={{ fontSize: 11, color: T.sub }}>You have restricted access. You can view tasks assigned to you and upload reports/receipts. Other sensitive grant data is hidden.</div>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 16, marginBottom: 16 }}>
        <div style={{ display: "grid", gap: 16 }}>
          <Card style={{ background: T.panel + "22" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>🤖 AI Workspace Orchestrator</span>
              <Badge size="xs" color={T.blue}>Team</Badge>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Input value={rfpText} onChange={setRfpText} placeholder="Paste RFP text to generate team tasks..." style={{ flex: 1 }} />
              <Btn variant="primary" size="sm" onClick={orchestrateTasks} disabled={loading || !rfpText.trim()}>{loading ? "⏳" : "🧙 Orchestrate"}</Btn>
            </div>
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Card>
              <Stat label="Workspace Velocity" value={`${notes.filter(n => n.resolved).length}`} color={T.green} />
              <div style={{ fontSize: 10, color: T.sub, marginTop: 4 }}>Completed Tasks</div>
            </Card>
            <Card>
              <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>Partner Engagement</div>
              <div style={{ height: 30, display: "flex", alignItems: "flex-end", gap: 2 }}>
                {[4, 7, 5, 9, 6].map((v, i) => (
                  <div key={i} style={{ flex: 1, background: T.blue, height: `${v * 10}%`, borderRadius: "2px 2px 0 0" }} />
                ))}
              </div>
            </Card>
          </div>
        </div>

        <Card style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 12, display: "flex", justifyContent: "space-between" }}>
            <span>📜 Consortium Activity Feed</span>
            <Badge size="xs">Live</Badge>
          </div>
          <div style={{ flex: 1, overflowY: "auto", maxHeight: 200 }}>
            {activity.map(a => (
              <div key={a.id} style={{ padding: "8px 0", borderBottom: `1px solid ${T.border}`, fontSize: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ fontWeight: 700, color: T.text }}>{a.user}</span>
                  <span style={{ color: T.mute }}>{fmtDate(a.time)}</span>
                </div>
                <div style={{ color: T.sub }}>{a.action}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
          {[{ id:"all", label:"All" },{ id:"active", label:"Active" },{ id:"resolved", label:"Resolved" },...Object.entries(TYPES).map(([k,v]) => ({ id:k, label:`${v.icon} ${v.label}` }))].map(f => (
            <Btn key={f.id} size="sm" variant={filter === f.id ? "primary" : "ghost"} onClick={() => setFilter(f.id)}>{f.label}</Btn>
          ))}
        </div>
        <Btn variant="primary" size="sm" onClick={() => setShowAdd(true)}>+ Add Manual Note</Btn>
      </div>

      {filtered.length === 0 ? <Empty icon="💬" title="No notes yet" sub="Track decisions, questions, blockers, and ideas" action={<Btn variant="primary" size="sm" onClick={() => setShowAdd(true)}>+ Add Note</Btn>} /> :
        filtered.map(n => {
          const grant = grants.find(g => g.id === n.grantId);
          const type = TYPES[n.type] || TYPES.note;
          return (
            <Card key={n.id} style={{ marginBottom:6, opacity: n.resolved ? 0.6 : 1 }}>
              <div style={{ display:"flex", alignItems:"flex-start", gap:8 }}>
                <button onClick={() => toggleResolve(n.id)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:16, color: n.resolved ? T.green : T.mute, flexShrink:0, marginTop:2 }}>
                  {n.resolved ? "☑" : "☐"}
                </button>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", gap:4, marginBottom:4 }}>
                    <Badge color={type.color}>{type.icon} {type.label}</Badge>
                    {grant && <Badge color={T.blue}>{grant.title?.slice(0,20)}</Badge>}
                    {n.priority === "high" && <Badge color={T.red}>High</Badge>}
                    <span style={{ fontSize: 10, color: T.dim }}>{fmtDate(n.createdAt)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: n.resolved ? T.mute : T.text, textDecoration: n.resolved ? "line-through" : "none", lineHeight: 1.5 }}>{n.content}</div>
                </div>
                <button onClick={() => deleteNote(n.id)} style={{ background:"none", border:"none", color:T.red, cursor:"pointer", fontSize:11 }}>✕</button>
              </div>
            </Card>
          );
        })
      }

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Note">
        <div style={{ display:"grid", gap:12 }}>
          <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
            {Object.entries(TYPES).map(([k,v]) => (
              <Btn key={k} size="sm" variant={newNote.type === k ? "primary" : "default"} onClick={() => setNewNote({...newNote, type:k})}>{v.icon} {v.label}</Btn>
            ))}
          </div>
          <Select value={newNote.grantId} onChange={v => setNewNote({...newNote, grantId:v})}
            options={[{ value:"", label:"General (no grant)" }, ...grants.map(g => ({ value:g.id, label:g.title?.slice(0,50) }))]} />
          <TextArea value={newNote.content} onChange={v => setNewNote({...newNote, content:v})} rows={4} placeholder="Your note, question, decision, or idea..." />
          <Select value={newNote.priority} onChange={v => setNewNote({...newNote, priority:v})}
            options={[{ value:"normal", label:"Normal priority" }, { value:"high", label:"🔴 High priority" }]} />
          <Btn variant="primary" onClick={addNote}>Add Note</Btn>
        </div>
      </Modal>
    </div>
  );
};
