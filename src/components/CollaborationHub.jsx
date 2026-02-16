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

  useEffect(() => { LS.set("collab_notes", notes); }, [notes]);

  const addNote = () => {
    if (!newNote.content) return;
    setNotes(prev => [{ ...newNote, id:uid(), createdAt:new Date().toISOString(), resolved:false }, ...prev]);
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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card style={{ background: T.panel + "22" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>🤖 AI Workspace Orchestrator</span>
            <Badge size="xs" color={T.blue}>Team</Badge>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Input value={rfpText} onChange={setRfpText} placeholder="Paste RFP text to generate team tasks..." style={{ flex: 1 }} />
            <Btn variant="primary" size="sm" onClick={orchestrateTasks} disabled={loading || !rfpText.trim()}>{loading ? "⏳" : "🧙 Orchestrate"}</Btn>
          </div>
          <div style={{ fontSize: 10, color: T.mute, marginTop: 6 }}>AI will extract roles, deadlines, and requirements into actionable items.</div>
        </Card>

        <Card style={{ background: T.panel + "22" }}>
          <Stat label="Workspace Velocity" value={`${notes.filter(n => n.resolved).length}/${notes.length}`} color={T.green} />
          <div style={{ marginTop: 8 }}>
            <Progress value={notes.length > 0 ? (notes.filter(n => n.resolved).length / notes.length) * 100 : 0} color={T.green} height={6} />
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
