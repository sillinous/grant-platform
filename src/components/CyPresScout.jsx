import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn, TrackBtn, SkeletonCard, Empty, Input, Progress } from '../ui';
import { T, fmt, uid, PROFILE } from '../globals';
import { API } from '../api';
import { useStore } from '../store';

export const CyPresScout = ({ onAdd: propOnAdd }) => {
    const { addGrant: storeOnAdd } = useStore();
    const onAdd = propOnAdd || storeOnAdd;
    const [cases, setCases] = useState([]);
    const [query, setQuery] = useState(PROFILE.focus?.[0] || 'consumer protection');
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(null);

    const loadCases = async (q) => {
        setLoading(true);
        const live = await API.searchCourtListener(q);
        setCases(live.length > 0 ? live : await API.getCyPresAwards(q));
        setLoading(false);
    };

    useEffect(() => { loadCases(query); }, []);

    const totalPool = cases.reduce((s, c) => s + (c.residualFund || 0), 0);
    const matchCount = cases.filter(c => PROFILE.focus?.some(f => c.cause?.toLowerCase().includes(f.toLowerCase()))).length;

    return (
        <div className="animate-in">
            {/* ─── Header ─── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${T.glassBorder}` }}>
                <div style={{ fontSize: 28, background: `${T.crimson}18`, borderRadius: 12, width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⚖️</div>
                <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: 22, fontWeight: 900, color: T.text, margin: 0, fontFamily: 'Outfit' }}>Cy Pres Scout</h2>
                    <p style={{ color: T.mute, fontSize: 12, margin: '3px 0 0' }}>Federal court settlement monitoring via CourtListener — unclaimed residual funds distributed to nonprofits.</p>
                </div>
            </div>

            {/* ─── Search ─── */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <Input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && loadCases(query)}
                    placeholder="Search case topic... (e.g. privacy, consumer, tech)"
                    style={{ flex: 1 }}
                />
                <Btn variant="danger" onClick={() => loadCases(query)} disabled={loading} style={{ minWidth: 90 }}>
                    {loading ? <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⚙️</span> …</> : '🔍 Search'}
                </Btn>
            </div>

            {/* ─── Stats ─── */}
            {!loading && cases.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                    {[
                        { label: 'Active Settlements', value: cases.length, color: T.crimson },
                        { label: 'Mission Matches', value: matchCount, color: T.green },
                        { label: 'Total Est. Pool', value: totalPool > 0 ? fmt(totalPool) : '—', color: T.amber }
                    ].map(({ label, value, color }) => (
                        <Card key={label} style={{ padding: '12px 16px', background: `${color}08`, borderTop: `2px solid ${color}` }}>
                            <div style={{ fontSize: 9, color: T.mute, fontWeight: 800, letterSpacing: 1.2, marginBottom: 4, textTransform: 'uppercase' }}>{label}</div>
                            <div style={{ fontSize: 20, fontWeight: 900, color, fontFamily: 'Outfit' }}>{value}</div>
                        </Card>
                    ))}
                </div>
            )}

            {/* ─── Settlement Cards ─── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                {loading
                    ? [1, 2].map(i => <SkeletonCard key={i} lines={6} />)
                    : cases.length === 0
                        ? <div style={{ gridColumn: '1 / -1' }}>
                            <Empty icon="⚖️" title="No Active Settlements Found" sub="No current settlement distributions matched your query. Try a broader topic like 'data privacy' or 'consumer'." action="Try 'Consumer Protection'" onAction={() => { setQuery('consumer protection'); loadCases('consumer protection'); }} />
                        </div>
                        : cases.map(c => {
                            const isMissionMatch = PROFILE.focus?.some(f => c.cause?.toLowerCase().includes(f.toLowerCase()) || f.toLowerCase().includes(c.cause?.toLowerCase()));
                            const isOpen = expanded === c.id;
                            return (
                                <Card key={c.id} interactive glow={isMissionMatch} style={{ borderTop: `4px solid ${isMissionMatch ? T.green : T.crimson}`, position: 'relative', padding: '22px 20px' }}>
                                    {isMissionMatch && (
                                        <div style={{ position: 'absolute', top: -12, left: 14 }}>
                                            <Badge color={T.green} style={{ fontWeight: 900, boxShadow: `0 4px 14px ${T.green}44`, fontSize: 9 }}>🎯 HIGH MISSION ALIGNMENT</Badge>
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: isMissionMatch ? 8 : 0, marginBottom: 12 }}>
                                        <div style={{ flex: 1, marginRight: 10 }}>
                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                                                <Badge color={c.status === 'Active' ? T.green : T.crimson} style={{ fontSize: 9 }}>{c.status?.toUpperCase()}</Badge>
                                                {c.docket && <Badge color={T.mute} style={{ fontSize: 9, textTransform: 'none' }}>{c.docket}</Badge>}
                                            </div>
                                            <h3 style={{ fontSize: 15, fontWeight: 900, color: T.text, margin: '0 0 4px', fontFamily: 'Outfit', lineHeight: 1.35 }}>{c.caseName}</h3>
                                            {c.cause && <div style={{ fontSize: 10, color: T.sub, fontWeight: 700, letterSpacing: 0.5 }}>NEXUS: {c.cause?.toUpperCase()}</div>}
                                        </div>
                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                            <div style={{ fontSize: 22, fontWeight: 900, color: T.crimson, letterSpacing: '-0.03em', fontFamily: 'Outfit' }}>{fmt(c.residualFund)}</div>
                                            <div style={{ fontSize: 9, color: T.mute, fontWeight: 800, letterSpacing: 1 }}>EST. POOL</div>
                                        </div>
                                    </div>

                                    {/* Pool bar */}
                                    {totalPool > 0 && <Progress value={(c.residualFund || 0)} max={totalPool} color={isMissionMatch ? T.green : T.crimson} height={3} style={{ marginBottom: 12 }} />}

                                    <p style={{ fontSize: 12, color: T.sub, lineHeight: 1.7, margin: '0 0 16px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.description}</p>

                                    <div style={{ display: 'flex', gap: 8, borderTop: `1px solid ${T.glassBorder}`, paddingTop: 14 }}>
                                        <Btn variant="primary" size="sm" style={{ flex: 1, fontSize: 12 }}>📜 Draft Amicus</Btn>
                                        {onAdd && (
                                            <TrackBtn onTrack={() => onAdd({
                                                id: uid(), title: c.caseName, agency: 'Cy Pres Settlement',
                                                amount: c.residualFund, deadline: 'Rolling', stage: 'discovered',
                                                description: `Docket: ${c.docket}. Cause: ${c.cause}. ${c.description}`,
                                                category: 'Cy Pres',
                                                meta: { riskScore: 75, alignmentScore: isMissionMatch ? 95 : 50 },
                                                createdAt: new Date().toISOString()
                                            })} label="+ Track" />
                                        )}
                                    </div>
                                </Card>
                            );
                        })
                }
            </div>

            {/* ─── Info Banner ─── */}
            <Card style={{ marginTop: 20, background: `linear-gradient(90deg, ${T.crimson}10, transparent)`, borderColor: T.crimson + '33', borderLeft: `4px solid ${T.crimson}` }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ fontSize: 22 }}>👨‍⚖️</div>
                    <div>
                        <strong style={{ color: T.text, display: 'block', marginBottom: 4, fontSize: 13 }}>How Cy Pres Works</strong>
                        <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.6 }}>When plaintiffs can't be located, courts distribute residual settlement funds to nonprofits with a legal "nexus" to the case. You just need to raise your hand — track a case above to begin.</div>
                    </div>
                </div>
            </Card>
        </div>
    );
};
