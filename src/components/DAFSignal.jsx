import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn, TrackBtn, SkeletonCard, Empty } from '../ui';
import { T, uid } from '../globals';
import { API } from '../api';
import { useStore } from '../store';

export const DAFSignal = ({ onAdd: propOnAdd }) => {
    const { addGrant: storeOnAdd } = useStore();
    const onAdd = propOnAdd || storeOnAdd;
    const [signals, setSignals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.getDAFSignals().then(d => {
            setSignals(d);
            setLoading(false);
        });
    }, []);

    return (
        <div style={{ padding: 20, animation: "fadeIn 0.4s" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 24, padding: "8px", background: `${T.gold}11`, borderRadius: "8px" }}>🤫</div>
                <div>
                    <h2 style={{ fontSize: 24, fontWeight: 900, color: T.text, margin: 0 }}>DAF Signal</h2>
                    <p style={{ color: T.mute, fontSize: 13, marginTop: 4 }}>Interception of "Advisor-Led" funding through Donor Advised Funds (anonymous philanthropy).</p>
                </div>
            </div>

            {API.fortuna.isLinked() && (
                <Card style={{ marginBottom: 24, padding: 20, background: `linear-gradient(90deg, ${T.green}15, transparent)`, border: `1px solid ${T.green}33`, borderLeft: `6px solid ${T.green}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                            <div style={{ fontSize: 32 }}>⚡</div>
                            <div>
                                <div style={{ fontSize: 16, fontWeight: 900, color: T.text }}>Fortuna Auto-Philanthropy Active</div>
                                <div style={{ fontSize: 13, color: T.sub, marginTop: 4 }}>Surplus detected: <b style={{ color: T.green }}>$10,000</b>. AI-driven DAF matching enabled.</div>
                            </div>
                        </div>
                        <Btn variant="success" onClick={() => {
                            API.fortuna.syncToLedger().then(() => toast("DAF Transfer Initialized via Fortuna Engine."));
                        }}>Execute DAF Transfer</Btn>
                    </div>
                </Card>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                {loading ? <div style={{ display: "contents" }}><SkeletonCard lines={6} /><SkeletonCard lines={6} /></div> :
                    signals.length === 0 ? <div style={{ gridColumn: "1 / -1" }}><Empty icon="🤫" title="No DAF Signals Found" sub="Monitoring wealth advisor activity for donor-advised fund leads." /></div> :
                    signals.map(s => (
                        <Card key={s.id} glow style={{ borderTop: `6px solid ${T.gold}`, padding: 24 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                                <Badge color={T.gold} style={{ background: `${T.gold}11`, letterSpacing: 1 }}>WEALTH ADVISOR SIGNAL</Badge>
                                <div style={{ fontSize: 20, fontWeight: 900, color: T.gold, letterSpacing: "-0.04em" }}>{s.grantRange}</div>
                            </div>

                            <div style={{ fontSize: 10, color: T.mute, fontWeight: 800, letterSpacing: 1, marginBottom: 8 }}>INTERMEDIARY INSTITUTION</div>
                            <h3 style={{ fontSize: 20, fontWeight: 900, color: T.text, margin: 0, fontFamily: "Outfit", lineHeight: 1.3 }}>{s.advisorFirm}</h3>
                            
                            <div style={{ padding: 20, background: "rgba(255,255,255,0.02)", borderRadius: 16, margin: "24px 0", borderLeft: `6px solid ${T.gold}`, border: `1px solid ${T.glassBorder}`, borderLeftWidth: 6 }}>
                                <div style={{ fontSize: 10, color: T.gold, fontWeight: 800, letterSpacing: 1, marginBottom: 10 }}>ADVISOR-LED MANDATE</div>
                                <p style={{ fontSize: 14, color: T.text, margin: 0, fontStyle: "italic", lineHeight: 1.7 }}>"{s.note}"</p>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.sub, marginBottom: 16, padding: "0 4px", flexWrap: "wrap", gap: 8 }}>
                                <div><span style={{ fontWeight: 800, color: T.mute, marginRight: 6 }}>FOCUS:</span> {s.clientFocus?.toUpperCase()}</div>
                                <div><span style={{ fontWeight: 800, color: T.mute, marginRight: 6 }}>DEADLINE:</span> {(s.deadline || "ROLLING")?.toUpperCase()}</div>
                                {s.ein && <div><span style={{ fontWeight: 800, color: T.mute, marginRight: 6 }}>EIN:</span> <span style={{ fontFamily: "monospace" }}>{s.ein}</span></div>}
                            </div>

                            {(s.url || s.ein) && (
                                <div style={{ marginBottom: 16 }}>
                                    <a href={s.url || `https://projects.propublica.org/nonprofits/organizations/${s.ein}`}
                                        target="_blank" rel="noopener noreferrer"
                                        style={{ fontSize: 12, color: T.blue, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                                        View 990 / Grantmaking History ↗
                                    </a>
                                </div>
                            )}

                            <div style={{ display: "flex", gap: 12, borderTop: `1px solid ${T.glassBorder}`, paddingTop: 24 }}>
                                <Btn variant="primary" style={{ flex: 1 }}>Draft Advisor Pitch</Btn>
                                {onAdd && (
                                    <TrackBtn onTrack={() => {
                                        onAdd({
                                            id: uid(),
                                            title: s.advisorFirm,
                                            agency: "Donor Advised Fund",
                                            amount: "TBD",
                                            deadline: s.deadline || "Rolling",
                                            stage: "discovered",
                                            description: `Advisor: ${s.advisorFirm}. Focus: ${s.clientFocus}. Note: ${s.note}`,
                                            category: "DAF Lead",
                                            ein: s.ein,
                                            link: s.url,
                                            createdAt: new Date().toISOString()
                                        });
                                    }} label="+ Track Lead" />
                                )}
                            </div>
                        </Card>
                    ))
                }
            </div>
        </div>
    );
};
