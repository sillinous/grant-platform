import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn, Empty, TrackBtn, SkeletonCard } from '../ui';
import { T, PROFILE, getProfileState } from '../globals';
import { API } from '../api';
import { useStore } from '../store';

export const RegionalPulse = ({ onAdd: propOnAdd }) => {
    const { addGrant: storeOnAdd } = useStore();
    const onAdd = propOnAdd || storeOnAdd;
    const [foundations, setFoundations] = useState([]);
    const [incentives, setIncentives] = useState([]);
    const [signals, setSignals] = useState([]);
    const [charities, setCharities] = useState([]);
    const [loading, setLoading] = useState(false);
    const state = getProfileState().abbr;

    useEffect(() => {
        loadRegionalData();
    }, [PROFILE.zip, state]);

    const loadRegionalData = async () => {
        setLoading(true);
        const [phil, edc, sig, char] = await Promise.all([
            API.getPhilanthropicIntel(PROFILE.zip),
            API.getRegionalIncentives(state),
            API.searchHyperLocalSignals(PROFILE.zip, PROFILE.tags),
            API.searchCharityConsortiums("innovation")
        ]);
        if (!phil._error) setFoundations(phil || []);
        if (!edc._error) setIncentives(edc || []);
        if (!sig._error) setSignals(sig || []);
        if (!char._error) setCharities(char || []);
        setLoading(false);
    };

    return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

            {/* ─── Column A: Official & Institutional ─── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                {/* 1. Philanthropic Radar */}
                <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: T.mute, letterSpacing: 2, marginBottom: 20, textTransform: "uppercase" }}>🤝 Philanthropic Intel Radar</div>
                    <div style={{ display: "grid", gap: 16 }}>
                        {loading ? (
                            <>
                                <SkeletonCard lines={3} />
                                <SkeletonCard lines={3} />
                            </>
                        ) :
                            foundations.slice(0, 3).map(f => (
                                <Card key={f.id} glow style={{ borderLeft: `6px solid ${T.purple}`, background: `${T.purple}05`, padding: 20 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, alignItems: "center" }}>
                                        <Badge color={T.purple} style={{ background: `${T.purple}11` }}>{f.type?.toUpperCase()}</Badge>
                                        <Badge color={T.green} style={{ background: `${T.green}11` }}>{f.affinity}% STRATEGIC MATCH</Badge>
                                    </div>
                                    <div style={{ fontSize: 16, fontWeight: 800, color: T.text, marginBottom: 4, fontFamily: "Outfit" }}>{f.agency}</div>
                                    <div style={{ fontSize: 12, color: T.sub, marginBottom: 16, lineHeight: 1.5 }}>{f.description.slice(0, 100)}...</div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${T.glassBorder}`, paddingTop: 16 }}>
                                        <div style={{ fontSize: 18, fontWeight: 900, color: T.text }}>{fmt(f.amount)}</div>
                                        <div style={{ display: "flex", gap: 8 }}>
                                            <Btn size="xs" variant="ghost">IRS-990</Btn>
                                            {onAdd && (
                                                <TrackBtn onTrack={() => {
                                                    onAdd({
                                                        id: uid(),
                                                        title: f.agency,
                                                        agency: "Philanthropy",
                                                        amount: f.amount,
                                                        deadline: "Rolling",
                                                        stage: "discovered",
                                                        description: f.description,
                                                        category: f.type,
                                                        createdAt: new Date().toISOString()
                                                    });
                                                }} label="+ Track" size="xs" />
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            ))
                        }
                    </div>
                </div>

                {/* 2. EDC Incentives */}
                <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: T.mute, letterSpacing: 2, marginBottom: 20, textTransform: "uppercase" }}>🏗️ Strategic EDC Incentives</div>
                    <div style={{ display: "grid", gap: 16 }}>
                        {incentives.length === 0 && !loading && <Empty icon="🏢" title="No Incentives" sub="No current EDC incentives." />}
                        {incentives.map(i => (
                            <Card key={i.id} glow style={{ borderLeft: `6px solid ${T.amber}`, background: `${T.amber}05`, padding: 20 }}>
                                <div style={{ fontSize: 10, color: T.sub, fontWeight: 800, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>{i.agency}</div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: T.text, marginBottom: 8, fontFamily: "Outfit" }}>{i.title}</div>
                                <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.6, marginBottom: 20 }}>{i.description}</div>
                                <div style={{ display: "flex", gap: 12, borderTop: `1px solid ${T.glassBorder}`, paddingTop: 16 }}>
                                    <Btn variant="primary" style={{ flex: 1 }}>Check Specs</Btn>
                                    {onAdd && (
                                        <TrackBtn onTrack={() => onAdd({
                                            id: uid(), title: i.title, agency: i.agency, stage: "discovered", description: i.description, category: i.type,
                                            createdAt: new Date().toISOString()
                                        })} label="+ Track" />
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

            {/* ─── Column B: Hyper-Local & Niche ─── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                {/* 1. Community Intelligence (Whisper Feed) */}
                <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: T.mute, letterSpacing: 2, marginBottom: 20, textTransform: "uppercase" }}>📡 Signal Whisper Intelligence</div>
                    <div style={{ display: "grid", gap: 16 }}>
                        {signals.length === 0 && !loading && <Empty icon="💬" title="No Signals" sub="No whisper feed signals found locally." />}
                        {signals.map(s => (
                            <Card key={s.id} glow style={{ borderLeft: `6px solid ${T.blue}`, background: `${T.blue}05`, padding: 20 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, alignItems: "center" }}>
                                    <Badge color={T.blue} style={{ background: `${T.blue}11` }}>{s.type?.toUpperCase()}</Badge>
                                    <div style={{ fontSize: 11, fontWeight: 800, color: T.green }}>{Math.round(s.probability * 100)}% CONFIDENCE</div>
                                </div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: T.text, marginBottom: 8, fontFamily: "Outfit" }}>{s.title}</div>
                                <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.6, marginBottom: 12 }}>{s.description}</div>
                                <div style={{ fontSize: 11, color: T.text, marginBottom: 20, background: "rgba(255,255,255,0.03)", padding: "8px 12px", borderRadius: 8, display: "inline-block", border: `1px solid ${T.glassBorder}` }}>
                                    STRATEGIC TIMING: <b style={{ color: T.blue, marginLeft: 4 }}>{s.timing?.toUpperCase()}</b>
                                </div>
                                {onAdd && (
                                    <TrackBtn onTrack={() => onAdd({
                                        id: uid(), title: s.title, agency: s.agency, stage: "discovered", description: `Confidence: ${Math.round(s.probability * 100)}% - ${s.description}`, category: s.type,
                                        createdAt: new Date().toISOString()
                                    })} label="+ Track Signal" />
                                )}
                            </Card>
                        ))}
                    </div>
                </div>

                {/* 2. Charity Consortiums */}
                <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: T.mute, letterSpacing: 2, marginBottom: 20, textTransform: "uppercase" }}>💎 Niche Institutional Pool</div>
                    <div style={{ display: "grid", gap: 16 }}>
                        {charities.length === 0 && !loading && <Empty icon="🤝" title="No Consortiums" sub="No niche private consortiums found locally." />}
                        {charities.map(c => (
                            <Card key={c.id} glow style={{ borderLeft: `6px solid ${T.green}`, background: `${T.green}05`, padding: 20 }}>
                                <div style={{ fontSize: 16, fontWeight: 800, color: T.text, marginBottom: 8, fontFamily: "Outfit" }}>{c.title}</div>
                                <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.6, marginBottom: 20 }}>{c.description}</div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, background: "rgba(255,255,255,0.02)", padding: 12, borderRadius: 12, border: `1px solid ${T.glassBorder}` }}>
                                    <span style={{ fontSize: 20, fontWeight: 900, color: T.text }}>{fmt(c.amount)}</span>
                                    <Badge color={T.green} style={{ background: `${T.green}11` }}>PRIVATE FUND</Badge>
                                </div>
                                {onAdd && (
                                    <TrackBtn onTrack={() => onAdd({
                                        id: uid(), title: c.title, agency: c.agency, amount: c.amount, stage: "discovered", description: c.description, category: c.type,
                                        createdAt: new Date().toISOString()
                                    })} label="+ Track Fund" />
                                )}
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    );
};
