import React, { useState, useMemo } from 'react';
import { OpportunityDrawer } from './OpportunityDrawer';
import { Card, Badge, Btn, Stat, Progress, Empty, Modal } from '../ui';
import { T, fmt, fmtDate, daysUntil, STAGE_MAP, uid, toast } from '../globals';
import { useStore } from '../store';
import { API } from '../api';

const STAGES = Object.entries(STAGE_MAP).map(([id, data]) => ({ id, ...data }));

// ── Deadline urgency color ────────────────────────────────────────────────────
const deadlineColor = (deadline) => {
    if (!deadline) return T.mute;
    const d = daysUntil(deadline);
    if (d < 0) return T.red;
    if (d <= 7) return T.red;
    if (d <= 21) return T.amber;
    if (d <= 60) return T.yellow;
    return T.green;
};

const deadlineLabel = (deadline) => {
    if (!deadline) return "No deadline";
    const d = daysUntil(deadline);
    if (d < 0) return `Overdue ${Math.abs(d)}d`;
    if (d === 0) return "Due today!";
    if (d === 1) return "Due tomorrow";
    if (d <= 7) return `${d}d left ⚠`;
    return `${fmtDate(deadline)} (${d}d)`;
};

// ── Grant card ────────────────────────────────────────────────────────────────
const GrantCard = ({ g, onSelect, onStageChange, onDelete, tasks }) => {
    const myTasks = (tasks || []).filter(t => t.grantId === g.id);
    const doneTasks = myTasks.filter(t => t.status === "done").length;
    const dc = deadlineColor(g.deadline);
    const days = g.deadline ? daysUntil(g.deadline) : null;

    return (
        <Card
            style={{
                borderLeft: `4px solid ${STAGE_MAP[g.stage]?.color || T.border}`,
                cursor: "pointer", transition: "all 0.2s",
                background: days !== null && days < 0 ? `${T.red}06` : undefined
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
        >
            {/* Source + link row */}
            {(g._source || g.link || g.cfda) && (
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8, alignItems: "center" }}>
                    {g._source && (
                        <span style={{ fontSize: 9, fontWeight: 800, padding: "1px 6px", borderRadius: 6, background: `${g._sourceColor || T.blue}18`, color: g._sourceColor || T.blue, border: `1px solid ${g._sourceColor || T.blue}33` }}>
                            {g._source}
                        </span>
                    )}
                    {g.cfda && <span style={{ fontSize: 9, color: "#6366f1", fontFamily: "monospace" }}>CFDA {g.cfda}</span>}
                    {g._score >= 80 && <span style={{ fontSize: 9, color: T.amber, fontWeight: 700 }}>⭐ {g._score}%</span>}
                    {g.link && (
                        <a href={g.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                            style={{ fontSize: 9, color: g._sourceColor || T.blue, textDecoration: "none", marginLeft: "auto", fontWeight: 700 }}>
                            View ↗
                        </a>
                    )}
                </div>
            )}

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ flex: 1, paddingRight: 8 }} onClick={() => onSelect(g)}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text, lineHeight: 1.3, marginBottom: 3 }}>{g.title}</div>
                    <div style={{ fontSize: 11, color: T.mute, fontWeight: 600 }}>{g.agency || "Unknown Agency"}</div>
                </div>
                <Badge color={STAGE_MAP[g.stage]?.color} style={{ fontSize: 9, flexShrink: 0 }}>
                    {STAGE_MAP[g.stage]?.label}
                </Badge>
            </div>

            {/* Amount + deadline */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: T.green, letterSpacing: "-0.02em" }}>
                    {typeof g.amount === "number" && g.amount > 0
                        ? g.amount >= 1e6 ? `$${(g.amount/1e6).toFixed(1)}M` : fmt(g.amount)
                        : "Amount TBD"}
                </div>
                <div style={{ fontSize: 10, color: dc, fontWeight: 700 }}>⏰ {deadlineLabel(g.deadline)}</div>
            </div>

            {/* Task progress */}
            {myTasks.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.mute, marginBottom: 3 }}>
                        <span>Tasks</span><span>{doneTasks}/{myTasks.length}</span>
                    </div>
                    <Progress value={myTasks.length > 0 ? (doneTasks / myTasks.length) * 100 : 0} height={3} color={T.blue} />
                </div>
            )}

            {/* Badges */}
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
                {g.meta?.riskScore > 30 && <Badge size="xs" color={T.red}>⚠ Risk</Badge>}
                {g.meta?.alignmentScore >= 70 && <Badge size="xs" color={T.blue}>✓ Aligned</Badge>}
                {g.compliance?.matchingFundsRequired && <Badge size="xs" color={T.amber}>Match Req</Badge>}
                {(g.focus || []).slice(0, 2).map(f => <Badge key={f} size="xs" color={T.indigo}>{f}</Badge>)}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 4, borderTop: `1px solid ${T.glassBorder}`, paddingTop: 10 }}>
                <select
                    value={g.stage}
                    onChange={(e) => { e.stopPropagation(); onStageChange(g.id, e.target.value); }}
                    style={{ flex: 1, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 11, color: T.text, padding: "5px 8px", cursor: "pointer" }}
                    onClick={e => e.stopPropagation()}
                >
                    {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
                <Btn size="sm" variant="ghost" onClick={() => onSelect(g)}>📋</Btn>
                <Btn size="sm" variant="ghost" style={{ color: T.red }} onClick={(e) => { e.stopPropagation(); onDelete(g.id); }}>🗑</Btn>
            </div>
        </Card>
    );
};

// ── Kanban column ─────────────────────────────────────────────────────────────
const KanbanColumn = ({ stage, grants, onSelect, onStageChange, onDelete, tasks }) => (
    <div style={{ minWidth: 260, maxWidth: 280, flexShrink: 0 }}>
        <div style={{
            padding: "8px 12px", borderRadius: "8px 8px 0 0",
            background: stage.color + "18", borderBottom: `2px solid ${stage.color}`,
            display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8
        }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: stage.color, letterSpacing: 0.5 }}>
                {stage.label.toUpperCase()}
            </span>
            <span style={{ fontSize: 11, color: T.mute, fontWeight: 700 }}>
                {grants.length} · {fmt(grants.reduce((s, g) => s + (g.amount || 0), 0))}
            </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, minHeight: 100 }}>
            {grants.map(g => (
                <GrantCard key={g.id} g={g} onSelect={onSelect} onStageChange={onStageChange} onDelete={onDelete} tasks={tasks} />
            ))}
            {grants.length === 0 && (
                <div style={{ padding: 20, textAlign: "center", color: T.mute, fontSize: 12, border: `1px dashed ${T.glassBorder}`, borderRadius: 8 }}>
                    No grants
                </div>
            )}
        </div>
    </div>
);

// ── Main Pipeline component ───────────────────────────────────────────────────
export const Pipeline = () => {
    const { grants, updateGrant, deleteGrant, tasks, addGrant } = useStore();
    const [view, setView] = useState("kanban"); // kanban | list
    const [filterStage, setFilterStage] = useState("all");
    const [selectedGrant, setSelectedGrant] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [editData, setEditData] = useState({});
    const [aiLoading, setAiLoading] = useState(false);
    const [aiInsight, setAiInsight] = useState(null);
    const [sortBy, setSortBy] = useState("deadline"); // deadline | amount | stage

    const handleStageChange = (id, newStage) => {
        updateGrant(id, { stage: newStage });
        toast(`Moved to ${STAGE_MAP[newStage]?.label}`);
    };

    const handleDelete = (id) => {
        const g = grants.find(x => x.id === id);
        deleteGrant(id);
        toast(`Removed: ${g?.title?.slice(0, 40) || "Grant"}`, "info");
    };

    const sorted = useMemo(() => {
        let list = filterStage === "all" ? [...grants] : grants.filter(g => g.stage === filterStage);
        if (sortBy === "deadline") list.sort((a, b) => {
            if (!a.deadline) return 1; if (!b.deadline) return -1;
            return new Date(a.deadline) - new Date(b.deadline);
        });
        else if (sortBy === "amount") list.sort((a, b) => (b.amount || 0) - (a.amount || 0));
        else if (sortBy === "stage") list.sort((a, b) => (STAGE_MAP[a.stage]?.level || 0) - (STAGE_MAP[b.stage]?.level || 0));
        return list;
    }, [grants, filterStage, sortBy]);

    // Stats
    const totalValue = grants.reduce((s, g) => s + (g.amount || 0), 0);
    const awarded = grants.filter(g => ["awarded", "active"].includes(g.stage));
    const awardedValue = awarded.reduce((s, g) => s + (g.amount || 0), 0);
    const urgent = grants.filter(g => g.deadline && daysUntil(g.deadline) >= 0 && daysUntil(g.deadline) <= 14);
    const winRate = grants.length > 0
        ? Math.round((awarded.length / grants.filter(g => ["awarded", "active", "rejected", "declined"].includes(g.stage)).length || 0) * 100) || 0
        : 0;

    const getAiInsight = async (grant) => {
        setAiLoading(true);
        setAiInsight(null);
        const sys = `You are a grant strategy advisor. Given this grant opportunity in the pipeline, provide a concise 3-point strategic assessment:
1. Current stage assessment and readiness
2. Top 1-2 action items to advance this grant
3. Risk factors to watch

Be specific, actionable, and under 150 words total.`;
        const msg = `Grant: ${grant.title} | Agency: ${grant.agency} | Amount: ${fmt(grant.amount)} | Stage: ${STAGE_MAP[grant.stage]?.label} | Deadline: ${grant.deadline || "None"} | Description: ${(grant.description || "").slice(0, 300)}`;
        const result = await API.callAI([{ role: "user", content: msg }], sys);
        setAiInsight(result.error ? `Error: ${result.error}` : result.text);
        setAiLoading(false);
    };

    const saveEdit = () => {
        updateGrant(selectedGrant.id, editData);
        setSelectedGrant({ ...selectedGrant, ...editData });
        setEditMode(false);
        toast("Grant updated ✓");
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {selectedGrant && <OpportunityDrawer grant={selectedGrant} onClose={() => setSelectedGrant(null)} onAdd={onAdd || (() => {})} isTracked={false} />}

            {/* ── Stats bar ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                {[
                    { label: "Pipeline Value", value: fmt(totalValue), color: T.amber },
                    { label: "Awarded / Active", value: fmt(awardedValue), color: T.green },
                    { label: "Urgent (≤14d)", value: urgent.length, color: urgent.length > 0 ? T.red : T.mute },
                    { label: "Win Rate", value: `${winRate}%`, color: T.blue },
                ].map(({ label, value, color }) => (
                    <Card key={label} style={{ padding: "12px 16px", background: `${color}08`, borderTop: `2px solid ${color}` }}>
                        <Stat label={label} value={value} color={color} />
                    </Card>
                ))}
            </div>

            {/* ── Controls ── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                <div style={{ display: "flex", gap: 6 }}>
                    <Btn size="sm" variant={view === "kanban" ? "primary" : "ghost"} onClick={() => setView("kanban")}>📋 Kanban</Btn>
                    <Btn size="sm" variant={view === "list" ? "primary" : "ghost"} onClick={() => setView("list")}>☰ List</Btn>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: T.mute, fontWeight: 700 }}>SORT:</span>
                    {[["deadline", "⏰ Deadline"], ["amount", "💰 Amount"], ["stage", "📊 Stage"]].map(([val, label]) => (
                        <button key={val} onClick={() => setSortBy(val)} style={{
                            padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: "pointer",
                            border: `1px solid ${sortBy === val ? T.amber + "60" : T.glassBorder}`,
                            background: sortBy === val ? T.amber + "14" : "transparent",
                            color: sortBy === val ? T.amber : T.sub, transition: "all 0.15s"
                        }}>{label}</button>
                    ))}
                </div>
                {view === "list" && (
                    <div style={{ display: "flex", gap: 4, background: T.panel, padding: 4, borderRadius: 8, flexWrap: "wrap" }}>
                        <Btn size="xs" variant={filterStage === "all" ? "primary" : "ghost"} onClick={() => setFilterStage("all")}>All</Btn>
                        {STAGES.map(s => (
                            <Btn key={s.id} size="xs" variant={filterStage === s.id ? "primary" : "ghost"} onClick={() => setFilterStage(s.id)}>
                                {s.label} ({grants.filter(g => g.stage === s.id).length})
                            </Btn>
                        ))}
                    </div>
                )}
            </div>

            {grants.length === 0 ? (
                <Empty icon="🚀" title="Pipeline is empty" sub="Discover grants and click 'Track' to add them here." />
            ) : view === "kanban" ? (
                /* ── KANBAN VIEW ── */
                <div style={{ overflowX: "auto", paddingBottom: 16 }}>
                    <div style={{ display: "flex", gap: 16, minWidth: "max-content" }}>
                        {STAGES.map(stage => (
                            <KanbanColumn
                                key={stage.id}
                                stage={stage}
                                grants={grants.filter(g => g.stage === stage.id).sort((a, b) => {
                                    if (sortBy === "deadline") {
                                        if (!a.deadline) return 1; if (!b.deadline) return -1;
                                        return new Date(a.deadline) - new Date(b.deadline);
                                    }
                                    if (sortBy === "amount") return (b.amount || 0) - (a.amount || 0);
                                    return 0;
                                })}
                                onSelect={setSelectedGrant}
                                onStageChange={handleStageChange}
                                onDelete={handleDelete}
                                tasks={tasks}
                            />
                        ))}
                    </div>
                </div>
            ) : (
                /* ── LIST VIEW ── */
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {sorted.map(g => {
                        const myTasks = (tasks || []).filter(t => t.grantId === g.id);
                        const doneTasks = myTasks.filter(t => t.status === "done").length;
                        const dc = deadlineColor(g.deadline);
                        return (
                            <Card key={g.id} style={{
                                borderLeft: `4px solid ${STAGE_MAP[g.stage]?.color || T.border}`,
                                padding: "12px 16px", cursor: "pointer",
                                background: g.deadline && daysUntil(g.deadline) < 0 ? `${T.red}06` : undefined
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    <div style={{ flex: 1 }} onClick={() => setSelectedGrant(g)}>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{g.title}</div>
                                        <div style={{ fontSize: 11, color: T.mute }}>{g.agency}</div>
                                    </div>
                                    <div style={{ textAlign: "right", minWidth: 100 }}>
                                        <div style={{ fontSize: 15, fontWeight: 800, color: T.green }}>{fmt(g.amount || 0)}</div>
                                    </div>
                                    <div style={{ minWidth: 120, textAlign: "right" }}>
                                        <div style={{ fontSize: 10, color: dc, fontWeight: 700 }}>{deadlineLabel(g.deadline)}</div>
                                    </div>
                                    <Badge color={STAGE_MAP[g.stage]?.color} style={{ minWidth: 80, textAlign: "center" }}>
                                        {STAGE_MAP[g.stage]?.label}
                                    </Badge>
                                    {myTasks.length > 0 && (
                                        <div style={{ fontSize: 10, color: T.sub, minWidth: 50 }}>
                                            {doneTasks}/{myTasks.length} tasks
                                        </div>
                                    )}
                                    <div style={{ display: "flex", gap: 4 }}>
                                        <select
                                            value={g.stage}
                                            onChange={(e) => handleStageChange(g.id, e.target.value)}
                                            style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 11, color: T.text, padding: "4px 6px" }}
                                            onClick={e => e.stopPropagation()}
                                        >
                                            {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                                        </select>
                                        <Btn size="sm" variant="ghost" style={{ color: T.red }} onClick={() => handleDelete(g.id)}>🗑</Btn>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* ── Grant Detail Modal ── */}
            {selectedGrant && (
                <Modal open={!!selectedGrant} onClose={() => { setSelectedGrant(null); setEditMode(false); setAiInsight(null); }} title={selectedGrant.title} width={680}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                        {/* Stats */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                            <Card style={{ background: T.panel }}>
                                <Stat label="Amount" value={fmt(selectedGrant.amount || 0)} color={T.green} />
                            </Card>
                            <Card style={{ background: T.panel }}>
                                <Stat label="Days Left" value={selectedGrant.deadline ? `${daysUntil(selectedGrant.deadline)}d` : "N/A"} color={deadlineColor(selectedGrant.deadline)} />
                                <div style={{ fontSize: 10, color: T.mute, marginTop: 4 }}>{fmtDate(selectedGrant.deadline)}</div>
                            </Card>
                            <Card style={{ background: T.panel }}>
                                <Stat label="Stage" value={STAGE_MAP[selectedGrant.stage]?.label} color={STAGE_MAP[selectedGrant.stage]?.color} />
                            </Card>
                        </div>

                        {/* Quick edit fields */}
                        {editMode ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                <div>
                                    <div style={{ fontSize: 10, color: T.mute, marginBottom: 4 }}>TITLE</div>
                                    <input value={editData.title ?? selectedGrant.title} onChange={e => setEditData(d => ({ ...d, title: e.target.value }))}
                                        style={{ width: "100%", background: T.panel, border: `1px solid ${T.border}`, borderRadius: 6, color: T.text, padding: "8px 10px", fontSize: 13 }} />
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                    <div>
                                        <div style={{ fontSize: 10, color: T.mute, marginBottom: 4 }}>DEADLINE</div>
                                        <input type="date" value={editData.deadline ?? selectedGrant.deadline ?? ""} onChange={e => setEditData(d => ({ ...d, deadline: e.target.value }))}
                                            style={{ width: "100%", background: T.panel, border: `1px solid ${T.border}`, borderRadius: 6, color: T.text, padding: "8px 10px", fontSize: 13 }} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 10, color: T.mute, marginBottom: 4 }}>AMOUNT ($)</div>
                                        <input type="number" value={editData.amount ?? selectedGrant.amount ?? ""} onChange={e => setEditData(d => ({ ...d, amount: parseFloat(e.target.value) || 0 }))}
                                            style={{ width: "100%", background: T.panel, border: `1px solid ${T.border}`, borderRadius: 6, color: T.text, padding: "8px 10px", fontSize: 13 }} />
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 10, color: T.mute, marginBottom: 4 }}>NOTES</div>
                                    <textarea value={editData.notes ?? selectedGrant.notes ?? ""} onChange={e => setEditData(d => ({ ...d, notes: e.target.value }))} rows={3}
                                        style={{ width: "100%", background: T.panel, border: `1px solid ${T.border}`, borderRadius: 6, color: T.text, padding: "8px 10px", fontSize: 13, resize: "vertical", fontFamily: "inherit" }} />
                                </div>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <Btn variant="primary" onClick={saveEdit}>💾 Save</Btn>
                                    <Btn variant="ghost" onClick={() => setEditMode(false)}>Cancel</Btn>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div style={{ fontSize: 11, color: T.mute, marginBottom: 4 }}>DESCRIPTION</div>
                                <div style={{ fontSize: 13, color: T.text, lineHeight: 1.6, padding: 12, background: T.panel, borderRadius: 8 }}>
                                    {selectedGrant.description || "No description provided."}
                                </div>
                                {selectedGrant.notes && (
                                    <div style={{ marginTop: 10, fontSize: 12, color: T.sub, fontStyle: "italic", padding: "8px 12px", background: `${T.amber}08`, borderRadius: 8, border: `1px solid ${T.amber}20` }}>
                                        📝 {selectedGrant.notes}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Compliance / meta */}
                        {(selectedGrant.meta || selectedGrant.compliance) && (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, padding: 12, background: T.panel, borderRadius: 8 }}>
                                <div style={{ fontSize: 11, textAlign: "center" }}>
                                    <div style={{ color: T.mute, marginBottom: 2 }}>Risk</div>
                                    <div style={{ color: selectedGrant.meta?.riskScore > 30 ? T.red : T.green, fontWeight: 700 }}>{selectedGrant.meta?.riskScore ?? "—"}</div>
                                </div>
                                <div style={{ fontSize: 11, textAlign: "center" }}>
                                    <div style={{ color: T.mute, marginBottom: 2 }}>Alignment</div>
                                    <div style={{ color: T.blue, fontWeight: 700 }}>{selectedGrant.meta?.alignmentScore ? `${selectedGrant.meta.alignmentScore}%` : "—"}</div>
                                </div>
                                <div style={{ fontSize: 11, textAlign: "center" }}>
                                    <div style={{ color: T.mute, marginBottom: 2 }}>Match Req</div>
                                    <div style={{ color: selectedGrant.compliance?.matchingFundsRequired ? T.amber : T.mute, fontWeight: 700 }}>
                                        {selectedGrant.compliance?.matchingFundsRequired ? "Yes" : "No"}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* AI insight */}
                        {aiInsight && (
                            <div style={{ padding: 14, background: `${T.amber}08`, borderRadius: 10, border: `1px solid ${T.amber}22`, fontSize: 13, color: T.text, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                                <div style={{ fontSize: 10, fontWeight: 800, color: T.amber, letterSpacing: 1, marginBottom: 8 }}>🧠 AI STRATEGIC INSIGHT</div>
                                {aiInsight}
                            </div>
                        )}

                        {/* Footer actions */}
                        <div style={{ display: "flex", gap: 8, borderTop: `1px solid ${T.glassBorder}`, paddingTop: 14, flexWrap: "wrap" }}>
                            <Btn variant="primary" onClick={() => { setEditMode(true); setEditData({}); }}>✏️ Edit</Btn>
                            <Btn variant="ghost" onClick={() => getAiInsight(selectedGrant)} disabled={aiLoading}>
                                {aiLoading ? "⏳ Thinking..." : "🧠 AI Insight"}
                            </Btn>
                            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                                <select
                                    value={selectedGrant.stage}
                                    onChange={(e) => { handleStageChange(selectedGrant.id, e.target.value); setSelectedGrant({ ...selectedGrant, stage: e.target.value }); }}
                                    style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, color: T.text, padding: "6px 10px" }}
                                >
                                    {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                                </select>
                                <Btn variant="ghost" style={{ color: T.red }} onClick={() => { handleDelete(selectedGrant.id); setSelectedGrant(null); }}>🗑 Delete</Btn>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};
