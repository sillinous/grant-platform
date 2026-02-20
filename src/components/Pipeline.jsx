import React, { useState } from 'react';
import { Card, Badge, Btn, Stat, Progress, Empty, Modal, Tab } from '../ui';
import { T, fmt, fmtDate, daysUntil, STAGE_MAP, uid } from '../globals';
import { useStore } from '../store';

export const Pipeline = () => {
    const { grants, updateGrant, deleteGrant } = useStore();
    const [filter, setFilter] = useState("all");
    const [selectedGrant, setSelectedGrant] = useState(null);

    const STAGES = Object.entries(STAGE_MAP).map(([id, data]) => ({ id, ...data }));

    const filtered = grants.filter(g => filter === "all" || g.stage === filter);

    const handleStageChange = (id, newStage) => {
        updateGrant(id, { stage: newStage });
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 8, background: T.panel, padding: 4, borderRadius: 8 }}>
                    <Btn size="xs" variant={filter === "all" ? "primary" : "ghost"} onClick={() => setFilter("all")}>All Pursuits</Btn>
                    {STAGES.map(s => (
                        <Btn key={s.id} size="xs" variant={filter === s.id ? "primary" : "ghost"} onClick={() => setFilter(s.id)}>
                            {s.label}
                        </Btn>
                    ))}
                </div>
                <Stat label="Total Pipeline Value" value={fmt(grants.reduce((s, g) => s + (g.amount || 0), 0))} color={T.amber} size="sm" />
            </div>

            {filtered.length === 0 ? (
                <Empty icon="🚀" title="No grants in this stage" sub="Move grants through the pipeline or discover new ones in the Discovery Hub." />
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
                    {filtered.map(g => (
                        <Card key={g.id} style={{ borderLeft: `4px solid ${STAGE_MAP[g.stage]?.color || T.border}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{g.title}</div>
                                    <div style={{ fontSize: 11, color: T.mute }}>{g.agency}</div>
                                </div>
                                <Badge color={STAGE_MAP[g.stage]?.color}>{STAGE_MAP[g.stage]?.label}</Badge>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                <div style={{ fontSize: 16, fontWeight: 800, color: T.green }}>{fmt(g.amount || 0)}</div>
                                <div style={{ fontSize: 10, color: T.sub }}>{g.deadline ? `Due: ${fmtDate(g.deadline)}` : "No deadline"}</div>
                            </div>

                            <div style={{ display: "flex", gap: 4 }}>
                                <select
                                    value={g.stage}
                                    onChange={(e) => handleStageChange(g.id, e.target.value)}
                                    style={{ flex: 1, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 11, color: T.text, padding: "4px 8px" }}
                                >
                                    {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                                </select>
                                <Btn size="sm" variant="ghost" onClick={() => setSelectedGrant(g)}>Details</Btn>
                                <Btn size="sm" variant="ghost" onClick={() => deleteGrant(g.id)}>🗑️</Btn>
                            </div>
                        </Card>
                    ))}
                    </div>
            )}

            {selectedGrant && (
                <Modal open={!!selectedGrant} onClose={() => setSelectedGrant(null)} title={selectedGrant.title} width={600}>
                    <div style={{ display: "grid", gap: 16 }}>
                        <div>
                            <div style={{ fontSize: 11, color: T.mute, marginBottom: 4 }}>DESCRIPTION</div>
                            <div style={{ fontSize: 13, color: T.text, lineHeight: 1.6 }}>{selectedGrant.description || "No description provided."}</div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <Card style={{ background: T.panel }}>
                                <Stat label="Amount" value={fmt(selectedGrant.amount || 0)} color={T.green} />
                            </Card>
                            <Card style={{ background: T.panel }}>
                                <Stat label="Days Remaining" value={selectedGrant.deadline ? daysUntil(selectedGrant.deadline) : "N/A"} color={T.amber} />
                            </Card>
                        </div>
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                            <Btn variant="primary" onClick={() => setSelectedGrant(null)}>Close</Btn>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};
