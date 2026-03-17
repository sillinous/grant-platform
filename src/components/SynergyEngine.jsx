import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn, TrackBtn, SkeletonCard, Empty } from '../ui';
import { T, PROFILE, uid, fmt } from '../globals';
import { API } from '../api';
import { useStore } from '../store';
import { Zap, Database, RefreshCw } from 'lucide-react';
import { OpportunityDrawer } from "./OpportunityDrawer";

const ScoreRing = ({ score }) => {
    const color = score >= 85 ? T.green : score >= 70 ? T.blue : T.amber;
    return (
        <div style={{ position: "relative", width: 56, height: 56, flexShrink: 0 }}>
            <svg viewBox="0 0 56 56" style={{ transform: "rotate(-90deg)", width: 56, height: 56 }}>
                <circle cx={28} cy={28} r={22} fill="none" stroke={T.border} strokeWidth={5} />
                <circle cx={28} cy={28} r={22} fill="none" stroke={color} strokeWidth={5}
                    strokeDasharray={`${(score / 100) * 138.2} 138.2`} strokeLinecap="round" style={{ transition: "stroke-dasharray 0.8s" }} />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color }}>
                {score}%
            </div>
        </div>
    );
};

export const SynergyEngine = ({ onAdd: propOnAdd }) => {
    const { addGrant: storeOnAdd, alliances = [] } = useStore();
    const onAdd = propOnAdd || storeOnAdd;
    const [synergies, setSynergies] = useState([]);
    const [selectedGrant, setSelectedGrant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [aiExplain, setAiExplain] = useState(null);
    const [explaining, setExplaining] = useState(null);
    const [sourceInfo, setSourceInfo] = useState({ count: 0 });

    const load = async () => {
        setLoading(true);
        const d = await API.getCrossSectorSynergies(PROFILE.tags || PROFILE.focus);
        setSynergies(Array.isArray(d) ? d : []);
        if (d?.length) {
            const liveCount = d.filter(s => s._source && !s._source.includes("Preview")).length;
            setSourceInfo({ count: d.length, liveCount });
        }
        setLoading(false);
    };

    const explainMatch = async (s) => {
        setExplaining(s.id);
        const { contacts = [] } = useStore.getState();
        const relevantContacts = contacts.filter(c =>
            c.org?.toLowerCase().includes(s.sector?.toLowerCase()) ||
            s.title?.toLowerCase().includes(c.org?.toLowerCase())
        );

        const contactContext = relevantContacts.length > 0
            ? `Your organization HAS CONTACTS at or related to this agency/sector: ${relevantContacts.map(c => `${c.name} (${c.role} at ${c.org})`).join(", ")}.`
            : "No specific contacts known for this agency/sector.";

        const sys = `You are a grant strategy consultant. Explain in 3 bullet points WHY this funding opportunity is relevant to this organization's capabilities.`;
        const prompt = `Organization: ${PROFILE.name}, Focus: ${(PROFILE.focus || []).join(", ")}, Tags: ${(PROFILE.tags || []).join(", ")}.\nOpportunity: ${s.title} (${s.sector}), Matching Tags: ${(s.matchingTags || []).join(", ")}, Synergy Score: ${s.synergyScore}%.\n\n${contactContext}\n\nTo apply, what existing skills/assets would they leverage? If contacts were mentioned above, recommend reaching out to them as a FIRST STEP. Return 3 concise bullet points starting with •`;

        const res = await API.callAI([{ role: "user", content: prompt }], sys);
        setAiExplain({ id: s.id, title: s.title, text: res.text || "Unable to generate explanation." });
        setExplaining(null);
    };

    useEffect(() => { load(); }, []);

    return (
        <div style={{ padding: 20, animation: "fadeIn 0.4s" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16, justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ fontSize: 24, padding: "8px", background: `${T.blue}11`, borderRadius: "8px" }}>🧬</div>
                    <div>
                        <h2 style={{ fontSize: 22, fontWeight: 900, color: T.text, margin: 0, fontFamily: "Outfit" }}>Synergy Engine</h2>
                        <p style={{ color: T.mute, fontSize: 13, marginTop: 2 }}>
                            Real-time Grants.gov cross-sector scan — adjacent wins matched to your profile tags.
                        </p>
                    </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {!loading && sourceInfo.count > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: T.mute }}>
                            <Database style={{ width: 11, height: 11 }} />
                            <span>{sourceInfo.liveCount || 0} live from Grants.gov</span>
                        </div>
                    )}
                    <button onClick={load} disabled={loading} style={{
                        background: `${T.blue}11`, border: `1px solid ${T.blue}22`, color: T.blue,
                        borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 11, fontWeight: 700,
                        display: "flex", alignItems: "center", gap: 5
                    }}>
                        <RefreshCw style={{ width: 11, height: 11, animation: loading ? "spin 1s linear infinite" : "none" }} />
                        {loading ? "Scanning…" : "Refresh"}
                    </button>
                </div>
            </div>

            {/* Profile tags info */}
            <Card style={{ marginBottom: 16, background: `${T.blue}08`, border: `1px solid ${T.blue}22` }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <Zap style={{ width: 14, height: 14, color: T.blue }} />
                    <span style={{ fontSize: 11, fontWeight: 800, color: T.blue }}>SCANNING TAGS:</span>
                    {(PROFILE.tags || PROFILE.focus || ["technology", "workforce"]).slice(0, 6).map(tag => (
                        <Badge key={tag} color={T.blue} style={{ background: `${T.blue}14`, textTransform: "none", fontSize: 10 }}>#{tag}</Badge>
                    ))}
                    <span style={{ fontSize: 11, color: T.mute, marginLeft: "auto" }}>
                        Grants.gov searched for each tag simultaneously → cross-sector scored
                    </span>
                </div>
            </Card>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
                {loading ? (
                    <div style={{ display: "contents" }}>
                        <SkeletonCard lines={6} /><SkeletonCard lines={6} /><SkeletonCard lines={6} />
                    </div>
                ) : synergies.length === 0 ? (
                    <div style={{ gridColumn: "1 / -1" }}>
                        <Empty icon="🧬" title="No Cross-Sector Synergies Found" sub="Try updating your profile tags or refreshing the scan." />
                    </div>
                    ) : synergies.map(s => {
                        const isAlliance = alliances.some(a => a.name?.toLowerCase().includes(s.sector?.toLowerCase()));
                        return (
                            <Card key={s.id} glow style={{ borderTop: `5px solid ${T.blue}`, position: "relative", cursor: "pointer" }} onClick={() => setSelectedGrant(s)}>
                                {isAlliance && (
                                    <div style={{ position: "absolute", top: -12, left: 14 }}>
                                        <Badge color={T.purple} style={{ fontWeight: 900, boxShadow: `0 4px 12px ${T.purple}44` }}>🤝 EXISTING ALLIANCE SECTOR</Badge>
                                    </div>
                                )}

                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, marginTop: isAlliance ? 10 : 0 }}>
                                    <div>
                                        <Badge color={T.blue} style={{ background: `${T.blue}11`, fontWeight: 800, fontSize: 10 }}>{s.sector?.toUpperCase()}</Badge>
                                        {s._source && (
                                            <span style={{ fontSize: 9, color: T.mute, marginLeft: 6 }}>via {s._source}</span>
                                        )}
                                </div>
                                    <ScoreRing score={s.synergyScore || 75} />
                            </div>

                                <h3 style={{ fontSize: 15, fontWeight: 800, color: T.text, margin: "0 0 14px", fontFamily: "Outfit", lineHeight: 1.35, height: 44, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                    {s.title}
                                </h3>

                                <div style={{ padding: 12, background: "rgba(255,255,255,0.02)", borderRadius: 10, marginBottom: 14, border: `1px solid ${T.glassBorder}` }}>
                                    <div style={{ fontSize: 9, color: T.mute, fontWeight: 900, marginBottom: 8, letterSpacing: 1.5 }}>CAPABILITY MATCH TAGS</div>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                        {(s.matchingTags || []).map(tag => (
                                            <Badge key={tag} color={T.green} style={{ background: `${T.green}0d`, textTransform: "none", fontSize: 10, fontWeight: 700 }}>✓ #{tag}</Badge>
                                        ))}
                                </div>
                            </div>

                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${T.glassBorder}`, paddingTop: 14 }}>
                                    <div>
                                        <div style={{ fontSize: 9, color: T.mute, fontWeight: 900, letterSpacing: 1 }}>AWARD VALUE</div>
                                        <div style={{ fontSize: 20, fontWeight: 900, color: T.green }}>{fmt(s.amount)}</div>
                                    </div>
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <Btn variant="primary" onClick={() => explainMatch(s)} disabled={explaining === s.id} style={{ fontSize: 11, padding: "6px 12px" }}>
                                            {explaining === s.id ? "⏳" : "🧠 Why This?"}
                                        </Btn>
                                    {onAdd && (
                                            <TrackBtn onTrack={() => onAdd({
                                                id: uid(), title: s.title, agency: s.sector,
                                                amount: s.amount, deadline: s.deadline || "Rolling",
                                                stage: "discovered",
                                            description: `Synergy Score: ${s.synergyScore}%. Tags: ${(s.matchingTags || []).join(", ")}`,
                                            category: "Cross-Sector Synergy",
                                            meta: { riskScore: s.synergyScore < 50 ? 45 : 15, alignmentScore: s.synergyScore },
                                            createdAt: new Date().toISOString()
                                        })} defaultLabel="+ Track" />
                                    )}
                                </div>
                            </div>
                        </Card>
                        );
                    })}
            </div>

            {!loading && synergies.length > 0 && (
                <Card style={{ marginTop: 20, background: `linear-gradient(90deg, ${T.blue}08, transparent)`, borderLeft: `4px solid ${T.blue}` }}>
                    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                        <div style={{ fontSize: 22 }}>🧪</div>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4 }}>Why am I seeing these?</div>
                            <p style={{ fontSize: 13, color: T.sub, margin: 0, lineHeight: 1.6 }}>
                                Grants.gov was searched simultaneously for each of your profile tags.
                                Results are cross-scored — opportunities matching multiple tags score higher.
                                Your tags {(PROFILE.tags || PROFILE.focus || []).slice(0, 3).map(t => (
                                    <Badge key={t} color={T.blue} style={{ fontSize: 10, marginLeft: 2 }}>#{t}</Badge>
                                ))} are active in this scan.
                            </p>
                        </div>
                    </div>
                </Card>
            )}

            {/* AI Explain Modal */}
            {aiExplain && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }} onClick={() => setAiExplain(null)}>
                    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 16, padding: 28, maxWidth: 540, width: "90%", borderTop: `4px solid ${T.blue}` }} onClick={e => e.stopPropagation()}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: T.blue, letterSpacing: 2, marginBottom: 8 }}>🧠 AI MATCH ANALYSIS</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: T.text, marginBottom: 16 }}>{aiExplain.title}</div>
                        <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.9, whiteSpace: "pre-wrap" }}>{aiExplain.text}</div>
                        <button onClick={() => setAiExplain(null)} style={{ marginTop: 20, width: "100%", background: T.blue, color: "#fff", border: "none", borderRadius: 8, padding: 10, cursor: "pointer", fontWeight: 700 }}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};
