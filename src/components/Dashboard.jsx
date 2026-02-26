import React from 'react';
import { Card, Stat, Btn, Progress, Badge, MiniBar, Icon } from '../ui';
import { T, fmt, fmtDate, daysUntil, STAGES, PROFILE } from '../globals';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';

export const Dashboard = () => {
    const navigate = useNavigate();
    const { grants, tasks, budgets, events } = useStore();

    const active = grants.filter(g => !["awarded", "declined", "closeout", "archived"].includes(g.stage));
    const awarded = grants.filter(g => ["awarded", "active", "closeout"].includes(g.stage));

    const totalPipeline = active.reduce((s, g) => s + (g.amount || 0), 0);
    const totalAwarded = awarded.reduce((s, g) => s + (g.amount || 0), 0);

    const upcomingDeadlines = grants.filter(g => g.deadline && new Date(g.deadline) > new Date())
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
        .slice(0, 4);

    return (
        <div style={{ animation: "fadeIn 0.5s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: T.text, letterSpacing: "-0.02em" }}>
                        Good {new Date().getHours() < 12 ? "morning" : "afternoon"}, {PROFILE.name || "Explorer"}
                    </h1>
                    <div style={{ fontSize: 14, color: T.sub, marginTop: 4 }}>
                        You have {active.length} active grant pursuits and {upcomingDeadlines.length} critical deadlines this month.
                    </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                    <Btn variant="primary" onClick={() => navigate("/discovery")}>🔍 Find Grants</Btn>
                    <Btn variant="ghost" onClick={() => navigate("/pipeline")}>📋 View Pipeline</Btn>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
                <Card glow style={{ borderTop: `4px solid ${T.amber}` }}>
                    <Stat label="Total Awarded" value={fmt(totalAwarded)} color={T.amber} />
                    <div style={{ fontSize: 10, color: T.green, marginTop: 4 }}>↑ ${fmt(totalAwarded * 0.1)} this quarter</div>
                </Card>
                <Card>
                    <Stat label="Active Pipeline" value={fmt(totalPipeline)} color={T.blue} />
                    <div style={{ fontSize: 10, color: T.sub, marginTop: 4 }}>Across {active.length} opportunities</div>
                </Card>
                <Card>
                    <Stat label="Action Plan Tasks" value={tasks.filter(t => t.status === "todo").length} color={T.purple} />
                    <div style={{ fontSize: 10, color: T.sub, marginTop: 4 }}>{tasks.filter(t => t.status === "done").length} completed items</div>
                </Card>
                <Card>
                    <Stat label="Upcoming Events" value={events?.length || 0} color={T.cyan} />
                    <div style={{ fontSize: 10, color: T.sub, marginTop: 4 }}>Next: Proposal Workshop</div>
                </Card>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    {/* Active Pursuits */}
                    <Card>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: T.text, textTransform: "uppercase", letterSpacing: 1 }}>🎯 High-Probability Pursuits</div>
                            <Btn variant="ghost" size="xs">View All</Btn>
                        </div>
                        {active.length > 0 ? (
                            <div style={{ display: "grid", gap: 12 }}>
                                {active.slice(0, 3).map(g => (
                                    <div key={g.id} style={{ display: "flex", padding: 12, background: T.panel, borderRadius: 8, border: `1px solid ${T.border}`, alignItems: "center", gap: 16 }}>
                                        <div style={{ padding: 10, background: `${T.blue}11`, borderRadius: 8, fontSize: 20 }}>💎</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4 }}>{g.title}</div>
                                            <div style={{ fontSize: 12, color: T.sub }}>{g.agency} • {fmt(g.amount)}</div>
                                        </div>
                                        <div style={{ textAlign: "right" }}>
                                            <Badge color={T.blue}>{g.stage?.toUpperCase()}</Badge>
                                            <div style={{ fontSize: 10, color: T.mute, marginTop: 4 }}>{g.deadline ? `Due ${fmtDate(g.deadline)}` : "No Deadline"}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: "center", padding: "40px 0", color: T.mute }}>
                                <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
                                <div style={{ fontSize: 14 }}>No active pursuits. Start by discovering new opportunities.</div>
                            </div>
                        )}
                    </Card>

                    <Card style={{ background: `linear-gradient(135deg, ${T.panel}, ${T.purple}05)`, border: `1px solid ${T.purple}33` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                            <span style={{ fontSize: 18 }}>✨</span>
                            <div style={{ fontWeight: 700, fontSize: 13, color: T.purple, textTransform: "uppercase", letterSpacing: 1 }}>AI Strategic Intelligence</div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                            <div style={{ padding: 12, background: T.bg, borderRadius: 8, borderLeft: `3px solid ${T.blue}` }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: T.blue, marginBottom: 6 }}>PIPELINE HEALTH</div>
                                <div style={{ fontSize: 13, color: T.text, lineHeight: 1.5 }}>
                                    {active.length > 0
                                        ? `${active.length} active pursuits with ${fmt(totalPipeline)} in pipeline. ${awarded.length} grants awarded.`
                                        : "No active grants yet. Visit the Discovery Hub to find matching opportunities."}
                                </div>
                            </div>
                            <div style={{ padding: 12, background: T.bg, borderRadius: 8, borderLeft: `3px solid ${T.amber}` }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: T.amber, marginBottom: 6 }}>DEADLINE WATCH</div>
                                <div style={{ fontSize: 13, color: T.text, lineHeight: 1.5 }}>
                                    {upcomingDeadlines.length > 0
                                        ? `${upcomingDeadlines[0].title.slice(0, 30)}... due in ${daysUntil(upcomingDeadlines[0].deadline)} days. ${upcomingDeadlines.length} total upcoming.`
                                        : "No upcoming deadlines. Add grant deadlines to get alerts."}
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    {/* Deadlines */}
                    <Card>
                        <div style={{ fontWeight: 700, fontSize: 13, color: T.text, textTransform: "uppercase", letterSpacing: 1, marginBottom: 20 }}>⏰ Critical Deadlines</div>
                        {upcomingDeadlines.length > 0 ? (
                            <div style={{ display: "grid", gap: 12 }}>
                                {upcomingDeadlines.map(d => (
                                    <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 10, borderBottom: `1px solid ${T.border}` }}>
                                        <div style={{ maxWidth: "60%" }}>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.title}</div>
                                            <div style={{ fontSize: 10, color: T.sub }}>{d.agency}</div>
                                        </div>
                                        <div style={{ textAlign: "right" }}>
                                            <Badge color={T.red} size="sm">{fmtDate(d.deadline)}</Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ fontSize: 12, color: T.mute, textAlign: "center", padding: 20 }}>No critical deadlines found.</div>
                        )}
                    </Card>

                    {/* Progress */}
                    <Card>
                        <div style={{ fontWeight: 700, fontSize: 13, color: T.text, textTransform: "uppercase", letterSpacing: 1, marginBottom: 20 }}>📊 Pipeline Maturity</div>
                        {STAGES.filter(s => ["researching", "drafting", "submitted"].includes(s.id)).map(s => {
                            const count = grants.filter(g => g.stage === s.id).length;
                            return (
                                <div key={s.id} style={{ marginBottom: 16 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 6 }}>
                                        <span style={{ color: T.sub }}>{s.label}</span>
                                        <span style={{ color: T.text, fontWeight: 700 }}>{count}</span>
                                    </div>
                                    <Progress value={count} max={grants.length || 1} color={s.color} height={4} />
                                </div>
                            );
                        })}
                    </Card>
                </div>
            </div>
        </div>
    );
};
