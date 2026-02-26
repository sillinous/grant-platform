import React, { useState, useEffect } from 'react';
import { Card, Btn, Badge, Input, Empty, TrackBtn, SkeletonCard } from '../ui';
import { T, fmt, uid, PROFILE } from '../globals';
import { API } from '../api';
import { useStore } from '../store';

export const GivingCircleScout = ({ onAdd: propOnAdd }) => {
    const { addGrant: storeOnAdd, savedFunders = [], setSavedFunders } = useStore();
    const onAdd = propOnAdd || storeOnAdd;
    const [circles, setCircles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generatingPitch, setGeneratingPitch] = useState(null);
    const [pitches, setPitches] = useState({});
    const [expanded, setExpanded] = useState(null);

    const generatePitch = async (c) => {
        setGeneratingPitch(c.id);
        const sys = `You are a nonprofit fundraising expert. Write a 2-sentence pitch for a giving circle.`;
        const prompt = `The giving circle "${c.name}" focuses on "${c.focus}". It has ${c.members} voting members and a pool of $${(c.pool || 0).toLocaleString()} available this cycle (${c.cycle}).\n\nDraft a 2-sentence pitch for ${PROFILE.name} (which serves ${PROFILE.impactMetrics?.demographicFocus || 'broad demographics'}) to present to this circle. Be specific to their focus. Start with an attention-grabbing stat or question.`;
        const res = await API.callAI([{ role: 'user', content: prompt }], sys);
        setPitches(prev => ({ ...prev, [c.id]: res.text || 'Unable to generate pitch.' }));
        setGeneratingPitch(null);
    };

    useEffect(() => {
        API.searchGivingCircles().then(d => { setCircles(d); setLoading(false); });
    }, []);

    return (
        <div className="animate-in">
            {/* ─── Header ─── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, padding: '20px 0 16px', borderBottom: `1px solid ${T.glassBorder}` }}>
                <div style={{ fontSize: 28, background: `${T.pink}18`, borderRadius: 12, width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⭕</div>
                <div>
                    <h2 style={{ fontSize: 22, fontWeight: 900, color: T.text, margin: 0, fontFamily: 'Outfit' }}>Giving Circle Scout</h2>
                    <p style={{ color: T.mute, fontSize: 12, marginTop: 3, margin: 0 }}>Real-time ProPublica search for pooled philanthropy networks that vote on micro-grants.</p>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                    <Badge color={T.pink} style={{ fontSize: 10, fontWeight: 900 }}>
                        {loading ? '…' : circles.length} CIRCLES FOUND
                    </Badge>
                </div>
            </div>

            {/* ─── Cards ─── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                {loading
                    ? [1, 2, 3].map(i => <SkeletonCard key={i} lines={5} />)
                    : circles.length === 0
                        ? <div style={{ gridColumn: '1 / -1' }}>
                            <Empty icon="⭕" title="No Active Circles Found" sub="ProPublica returned no giving circles matching your profile focus. Try updating your tags in Settings." action="Open Settings" onAction={() => window.__NAV?.('Settings')} />
                        </div>
                        : circles.map(c => {
                            const isDemographicMatch = PROFILE.impactMetrics?.demographicFocus && c.focus?.toLowerCase().includes(PROFILE.impactMetrics.demographicFocus.toLowerCase());
                            const focusMatch = (PROFILE.focus || []).some(f => c.focus?.toLowerCase().includes(f.toLowerCase()));
                            const isOpen = expanded === c.id;
                            return (
                                <Card key={c.id} interactive glow={focusMatch} style={{ borderTop: `4px solid ${isDemographicMatch ? T.blue : T.pink}`, position: 'relative', padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: 0 }}>
                                    {isDemographicMatch && (
                                        <div style={{ position: 'absolute', top: -12, left: 14 }}>
                                            <Badge color={T.blue} style={{ fontWeight: 900, boxShadow: `0 4px 14px ${T.blue}44`, fontSize: 9 }}>📈 DEMOGRAPHIC MATCH</Badge>
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: isDemographicMatch ? 8 : 0, marginBottom: 12 }}>
                                        <div>
                                            <h3 style={{ fontSize: 17, fontWeight: 900, color: T.text, margin: '0 0 4px', fontFamily: 'Outfit', lineHeight: 1.35 }}>{c.name}</h3>
                                            {(c.city || c.state) && <div style={{ fontSize: 10, color: T.mute, fontWeight: 700, letterSpacing: 0.8 }}>{[c.city, c.state].filter(Boolean).join(', ')}</div>}
                                        </div>
                                        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 10 }}>
                                            <div style={{ fontSize: 22, fontWeight: 900, color: T.pink, letterSpacing: '-0.03em', fontFamily: 'Outfit' }}>{fmt(c.pool)}</div>
                                            <div style={{ fontSize: 9, color: T.mute, fontWeight: 800, letterSpacing: 1 }}>EST. POOL</div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                                        <Badge color={T.pink} style={{ fontSize: 9 }}>{c.cycle?.toUpperCase()}</Badge>
                                        <Badge color={T.sub} style={{ fontSize: 9 }}>{c.members} MEMBERS</Badge>
                                        {c.focus && <Badge color={focusMatch ? T.green : T.mute} style={{ fontSize: 9, textTransform: 'none' }}>{c.focus}</Badge>}
                                        {c.ein && <Badge color={T.dim} style={{ fontSize: 9 }}>EIN {c.ein}</Badge>}
                                    </div>

                                    <div style={{ fontSize: 11, color: T.mute, fontWeight: 700, marginBottom: 6 }}>VOTING SCHEDULE</div>
                                    <div style={{ fontSize: 12, color: T.sub, marginBottom: 16 }}>{c.votingDate || 'Contact organization for schedule'}</div>

                                    {/* Pitch display */}
                                    {pitches[c.id] && (
                                        <div style={{ padding: '12px 14px', background: `${T.pink}0c`, borderRadius: 10, border: `1px solid ${T.pink}28`, marginBottom: 14, animation: 'fadeIn 0.35s' }}>
                                            <div style={{ fontSize: 9, fontWeight: 900, color: T.pink, letterSpacing: 1, marginBottom: 6 }}>🎤 YOUR AI PITCH</div>
                                            <div style={{ fontSize: 12, color: T.text, lineHeight: 1.7, fontStyle: 'italic' }}>{pitches[c.id]}</div>
                                        </div>
                                    )}

                                    <div style={{ marginTop: 'auto', display: 'flex', gap: 8, borderTop: `1px solid ${T.glassBorder}`, paddingTop: 14 }}>
                                        <Btn size="sm" variant="ghost" onClick={() => generatePitch(c)} disabled={generatingPitch === c.id} style={{ border: `1px dashed ${T.pink}60`, color: generatingPitch === c.id ? T.mute : T.pink, flex: 1 }}>
                                            {generatingPitch === c.id ? '✨ Drafting…' : '🎤 Gen Pitch'}
                                        </Btn>
                                        {onAdd && (
                                            <TrackBtn onTrack={() => onAdd({ id: uid(), title: c.name, agency: 'Giving Circle', amount: c.pool, stage: 'discovered', description: `Cycle: ${c.cycle}. Focus: ${c.focus}. Members: ${c.members}`, category: 'Giving Circle', createdAt: new Date().toISOString() })} label="+ Track" />
                                        )}
                                        {savedFunders?.some(sf => sf.name === c.name)
                                            ? <Btn variant="ghost" disabled style={{ color: T.green, fontSize: 12 }}>✓ Saved</Btn>
                                            : <Btn variant="ghost" style={{ fontSize: 12 }} onClick={() => setSavedFunders([...(savedFunders || []), { id: uid(), name: c.name, type: 'Giving Circle', tags: ['Collaborative Fund'], addedAt: new Date().toISOString() }])}>🏛️ Save</Btn>
                                        }
                                    </div>
                                </Card>
                            );
                        })
                }
            </div>
        </div>
    );
};
