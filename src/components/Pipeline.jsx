import React, { useState } from "react";
import { STAGES, STAGE_MAP, T, fmt, daysUntil, fmtDate } from "../globals";
import { Badge, Card, Btn, Input, Select, TextArea, Modal } from "../ui";

// ════════════════════════════════════════════════════════════════════════
// MODULE: GRANT PIPELINE (KANBAN BOARD)
// ════════════════════════════════════════════════════════════════════════
export const Pipeline = ({ grants, updateGrant, deleteGrant }) => {
  const [selected, setSelected] = useState(null);
  const [draggedGrant, setDraggedGrant] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  // Group grants by stage
  const columns = STAGES.map(stage => ({
    ...stage,
    items: grants.filter(g => g.stage === stage.id).sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
  }));

  const moveGrant = (grant, direction) => {
    const currentIndex = STAGES.findIndex(s => s.id === grant.stage);
    const newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < STAGES.length) {
      updateGrant(grant.id, { stage: STAGES[newIndex].id });
    }
  };

  const onDragStart = (e, grant) => {
    setDraggedGrant(grant);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", grant.id);
  };

  const onDragOver = (e, colId) => {
    e.preventDefault();
    setDragOverCol(colId);
  };

  const onDrop = (e, colId) => {
    e.preventDefault();
    setDragOverCol(null);
    if (draggedGrant && draggedGrant.stage !== colId) {
      updateGrant(draggedGrant.id, { stage: colId });
    }
    setDraggedGrant(null);
  };

  const getStageColor = (stageId) => STAGE_MAP[stageId]?.color || T.mute;

  return (
    <div style={{ height: "calc(100vh - 140px)", overflowX: "auto", overflowY: "hidden", display: "flex", gap: 16, paddingBottom: 12 }}>
      {columns.map(col => (
        <div key={col.id}
          onDragOver={(e) => onDragOver(e, col.id)}
          onDragLeave={() => setDragOverCol(null)}
          onDrop={(e) => onDrop(e, col.id)}
          style={{
            minWidth: 300, width: 300, display: "flex", flexDirection: "column",
            background: dragOverCol === col.id ? `${T.panel}cc` : T.panel,
            borderRadius: 12, border: `1px solid ${dragOverCol === col.id ? T.blue : T.border}`,
            maxHeight: "100%", transition: "all 0.2s"
          }}>
          {/* Column Header */}
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: getStageColor(col.id) + "10", borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>{col.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{col.label}</span>
            </div>
            <Badge color={col.items.length > 0 ? getStageColor(col.id) : T.mute} style={{ fontSize: 11 }}>{col.items.length}</Badge>
          </div>

          {/* Column Content */}
          <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
            {col.items.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px 0", color: T.dim, fontSize: 12, border: `2px dashed ${T.border}`, borderRadius: 8 }}>
                No grants
              </div>
            ) : (
              col.items.map(g => (
                <div key={g.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, g)}
                  style={{ opacity: draggedGrant?.id === g.id ? 0.5 : 1 }}>
                  <Card style={{ padding: 12, cursor: "grab", borderLeft: `3px solid ${getStageColor(g.stage)}` }} onClick={() => setSelected(g)}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 4, lineHeight: 1.4 }}>
                      {g.title?.slice(0, 50)}...
                    </div>
                    <div style={{ fontSize: 11, color: T.mute, marginBottom: 8 }}>{g.agency}</div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.green }}>{g.amount > 0 ? fmt(g.amount) : "—"}</div>
                      {g.deadline && <div style={{ fontSize: 10, color: daysUntil(g.deadline) <= 14 ? T.red : T.sub }}>{fmtDate(g.deadline)}</div>}
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
                      {/* Move Left */}
                      <button onClick={(e) => { e.stopPropagation(); moveGrant(g, -1); }} disabled={col.id === STAGES[0].id}
                        style={{ background: "none", border: "none", cursor: col.id === STAGES[0].id ? "default" : "pointer", opacity: col.id === STAGES[0].id ? 0.2 : 0.6, fontSize: 14 }}>
                        ◀
                      </button>

                      <div style={{ display: "flex", gap: 4 }}>
                        {g.tags?.slice(0, 2).map(t => <div key={t} style={{ width: 6, height: 6, borderRadius: "50%", background: T.blue }} title={t} />)}
                      </div>

                      {/* Move Right */}
                      <button onClick={(e) => { e.stopPropagation(); moveGrant(g, 1); }} disabled={col.id === STAGES[STAGES.length - 1].id}
                        style={{ background: "none", border: "none", cursor: col.id === STAGES[STAGES.length - 1].id ? "default" : "pointer", opacity: col.id === STAGES[STAGES.length - 1].id ? 0.2 : 0.6, fontSize: 14 }}>
                        ▶
                      </button>
                    </div>
                  </Card>
                </div>
              ))
            )}
            {/* Total Value */}
            {col.items.length > 0 && (
              <div style={{ textAlign: "center", fontSize: 10, color: T.mute, marginTop: 4 }}>
                Total: {fmt(col.items.reduce((s, g) => s + (g.amount || 0), 0))}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Grant Details" width={700}>
        {selected && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: T.text, marginBottom: 4 }}>{selected.title}</div>
              <div style={{ fontSize: 12, color: T.mute }}>{selected.agency}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 11, color: T.mute, display: "block", marginBottom: 4 }}>Stage</label>
                <Select value={selected.stage} onChange={v => { updateGrant(selected.id, { stage: v }); setSelected({ ...selected, stage: v }); }}
                  options={STAGES.map(s => ({ value: s.id, label: `${s.icon} ${s.label}` }))} style={{ width: "100%" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: T.mute, display: "block", marginBottom: 4 }}>Amount</label>
                <Input type="number" value={selected.amount || ""} onChange={v => { updateGrant(selected.id, { amount: Number(v) }); setSelected({ ...selected, amount: Number(v) }); }} placeholder="Award amount" />
              </div>
              <div>
                <label style={{ fontSize: 11, color: T.mute, display: "block", marginBottom: 4 }}>Deadline</label>
                <Input type="date" value={selected.deadline?.split("T")[0] || ""} onChange={v => { updateGrant(selected.id, { deadline: v }); setSelected({ ...selected, deadline: v }); }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: T.mute, display: "block", marginBottom: 4 }}>Category</label>
                <Input value={selected.category || ""} onChange={v => { updateGrant(selected.id, { category: v }); setSelected({ ...selected, category: v }); }} placeholder="e.g., SBIR, Community Development" />
              </div>
            </div>
            <label style={{ fontSize: 11, color: T.mute, display: "block", marginBottom: 4 }}>Notes</label>
            <TextArea value={selected.notes || ""} onChange={v => { updateGrant(selected.id, { notes: v }); setSelected({ ...selected, notes: v }); }} placeholder="Add notes..." rows={4} />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              <Btn variant="danger" size="sm" onClick={() => { deleteGrant(selected.id); setSelected(null); }}>🗑️ Delete</Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
