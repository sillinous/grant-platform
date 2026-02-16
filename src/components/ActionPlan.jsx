import React, { useState, useEffect } from 'react';
import { Card, Btn, Stat, Empty, Badge, Select, Input, TextArea, Modal } from '../ui';
import { T, LS, uid, daysUntil } from '../globals';

export const ActionPlan = ({ grants, tasks, setTasks }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", grantId: "", priority: "medium", dueDate: "", status: "todo", notes: "" });
  const [filter, setFilter] = useState("all");

  const saveTasks = (newTasks) => {
    setTasks(newTasks);
    LS.set("tasks", newTasks);
  };

  const addTask = () => {
    if (!newTask.title) return;
    saveTasks([...tasks, { ...newTask, id: uid(), createdAt: new Date().toISOString() }]);
    setNewTask({ title: "", grantId: "", priority: "medium", dueDate: "", status: "todo", notes: "" });
    setShowAdd(false);
  };

  const updateTask = (id, updates) => saveTasks(tasks.map(t => t.id === id ? { ...t, ...updates } : t));
  const deleteTask = (id) => saveTasks(tasks.filter(t => t.id !== id));

  const PRIORITIES = { high: { color: T.red, label: "🔴 High" }, medium: { color: T.yellow, label: "🟡 Medium" }, low: { color: T.green, label: "🟢 Low" } };
  const STATUSES = { todo: { color: T.mute, label: "To Do" }, inprogress: { color: T.blue, label: "In Progress" }, blocked: { color: T.red, label: "Blocked" }, done: { color: T.green, label: "Done" } };

  const filtered = tasks.filter(t => {
    if (filter === "all") return true;
    if (filter === "active") return t.status !== "done";
    if (filter === "done") return t.status === "done";
    if (filter === "overdue") return t.dueDate && daysUntil(t.dueDate) < 0 && t.status !== "done";
    return true;
  }).sort((a, b) => {
    const pOrder = { high: 0, medium: 1, low: 2 };
    if (a.status === "done" !== (b.status === "done")) return a.status === "done" ? 1 : -1;
    if (pOrder[a.priority] !== pOrder[b.priority]) return pOrder[a.priority] - pOrder[b.priority];
    if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
    return 0;
  });

  const overdue = tasks.filter(t => t.dueDate && daysUntil(t.dueDate) < 0 && t.status !== "done").length;
  const completed = tasks.filter(t => t.status === "done").length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8 }}>
          {[{ id: "all", label: `All (${tasks.length})` }, { id: "active", label: "Active" }, { id: "overdue", label: `Overdue (${overdue})` }, { id: "done", label: `Done (${completed})` }].map(f => (
            <Btn key={f.id} size="sm" variant={filter === f.id ? "primary" : "ghost"} onClick={() => setFilter(f.id)}>{f.label}</Btn>
          ))}
        </div>
        <Btn variant="primary" size="sm" onClick={() => setShowAdd(true)}>+ Add Task</Btn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 }}>
        <Card><Stat label="Total Tasks" value={tasks.length} color={T.amber} /></Card>
        <Card><Stat label="Completed" value={completed} color={T.green} /></Card>
        <Card><Stat label="In Progress" value={tasks.filter(t => t.status === "inprogress").length} color={T.blue} /></Card>
        <Card><Stat label="Overdue" value={overdue} color={T.red} /></Card>
      </div>

      {filtered.length === 0 ? <Empty icon="📋" title="No tasks" sub="Create tasks to track your grant workflow" action={<Btn variant="primary" size="sm" onClick={() => setShowAdd(true)}>+ Create Task</Btn>} /> :
        filtered.map(t => {
          const grant = grants.find(g => g.id === t.grantId);
          const isOverdue = t.dueDate && daysUntil(t.dueDate) < 0 && t.status !== "done";
          return (
            <Card key={t.id} style={{ marginBottom: 6, borderColor: isOverdue ? T.red + "44" : T.border }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => updateTask(t.id, { status: t.status === "done" ? "todo" : "done" })}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: t.status === "done" ? T.green : T.mute }}>
                  {t.status === "done" ? "☑️" : "☐"}
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: t.status === "done" ? T.mute : T.text, textDecoration: t.status === "done" ? "line-through" : "none" }}>{t.title}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 3 }}>
                    {grant && <Badge color={T.blue}>{grant.title?.slice(0, 20)}</Badge>}
                    <Badge color={PRIORITIES[t.priority]?.color || T.mute}>{t.priority}</Badge>
                    {t.status !== "todo" && t.status !== "done" && <Badge color={STATUSES[t.status]?.color}>{STATUSES[t.status]?.label}</Badge>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  {t.dueDate && (
                    <span style={{ fontSize: 11, color: isOverdue ? T.red : daysUntil(t.dueDate) <= 3 ? T.yellow : T.mute }}>
                      {isOverdue ? `${Math.abs(daysUntil(t.dueDate))}d overdue` : `${daysUntil(t.dueDate)}d`}
                    </span>
                  )}
                  <Select value={t.status} onChange={v => updateTask(t.id, { status: v })} style={{ fontSize: 10, padding: "2px 4px" }}
                    options={Object.entries(STATUSES).map(([k, v]) => ({ value: k, label: v.label }))} />
                  <button onClick={() => deleteTask(t.id)} style={{ background: "none", border: "none", color: T.red, cursor: "pointer", fontSize: 12 }}>✕</button>
                </div>
              </div>
            </Card>
          );
        })
      }

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Task">
        <div style={{ display: "grid", gap: 12 }}>
          <Input value={newTask.title} onChange={v => setNewTask({ ...newTask, title: v })} placeholder="Task description" />
          <Select value={newTask.grantId} onChange={v => setNewTask({ ...newTask, grantId: v })}
            options={[{ value: "", label: "No specific grant" }, ...grants.map(g => ({ value: g.id, label: g.title?.slice(0, 50) }))]} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <Select value={newTask.priority} onChange={v => setNewTask({ ...newTask, priority: v })}
              options={[{ value: "high", label: "🔴 High" }, { value: "medium", label: "🟡 Medium" }, { value: "low", label: "🟢 Low" }]} />
            <Input type="date" value={newTask.dueDate} onChange={v => setNewTask({ ...newTask, dueDate: v })} />
          </div>
          <TextArea value={newTask.notes} onChange={v => setNewTask({ ...newTask, notes: v })} rows={2} placeholder="Notes..." />
          <Btn variant="primary" onClick={addTask}>Add Task</Btn>
        </div>
      </Modal>
    </div>
  );
};

