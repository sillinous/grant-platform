import React, { useState, useEffect } from 'react';
import { Card, Btn, Select, TextArea, Stat, Badge, Empty, Modal } from '../ui';
import { LS, T, uid, fmtDate } from '../globals';

export const CollaborationHub = ({ grants }) => {
  const [notes, setNotes] = useState(() => LS.get("collab_notes", []));
  const [showAdd, setShowAdd] = useState(false);
  const [newNote, setNewNote] = useState({ grantId:"", content:"", type:"note", priority:"normal" });
  const [filter, setFilter] = useState("all");

  useEffect(() => { LS.set("collab_notes", notes); }, [notes]);

  const addNote = () => {
    if (!newNote.content) return;
    setNotes(prev => [{ ...newNote, id:uid(), createdAt:new Date().toISOString(), resolved:false }, ...prev]);
    setNewNote({ grantId:"", content:"", type:"note", priority:"normal" });
    setShowAdd(false);
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
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
          {[{ id:"all", label:"All" },{ id:"active", label:"Active" },{ id:"resolved", label:"Resolved" },...Object.entries(TYPES).map(([k,v]) => ({ id:k, label:`${v.icon} ${v.label}` }))].map(f => (
            <Btn key={f.id} size="sm" variant={filter === f.id ? "primary" : "ghost"} onClick={() => setFilter(f.id)}>{f.label}</Btn>
          ))}
        </div>
        <Btn variant="primary" size="sm" onClick={() => setShowAdd(true)}>+ Add Note</Btn>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:8, marginBottom:16 }}>
        <Card><Stat label="Total Notes" value={notes.length} color={T.amber} /></Card>
        <Card><Stat label="Open" value={notes.filter(n=>!n.resolved).length} color={T.blue} /></Card>
        <Card><Stat label="Blockers" value={notes.filter(n=>n.type==="blocker"&&!n.resolved).length} color={T.red} /></Card>
        <Card><Stat label="Decisions" value={notes.filter(n=>n.type==="decision").length} color={T.green} /></Card>
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
                  </div>
                  <div style={{ fontSize:12, color: n.resolved ? T.mute : T.text, textDecoration: n.resolved ? "line-through" : "none", lineHeight:1.5 }}>{n.content}</div>
                  <div style={{ fontSize:10, color:T.dim, marginTop:4 }}>{fmtDate(n.createdAt)}</div>
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
