import React, { useState, useEffect } from 'react';
import { T, fmt, PROFILE, getProfileState } from '../globals';
import { API } from '../api';
import { Card, Badge, Btn, Empty } from '../ui';

export const RegionalPulse = () => {
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

            {/* ─── Column A: Official & Institutional ─── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {/* 1. Philanthropic Radar */}
                <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: T.mute, letterSpacing: 1.5, marginBottom: 16 }}>🤝 PHILANTHROPIC RADAR</div>
                    <div style={{ display: "grid", gap: 10 }}>
                        {loading ? <div style={{ color: T.mute, fontSize: 11 }}>Scanning 990-PF fillings...</div> :
                            foundations.slice(0, 3).map(f => (
                                <Card key={f.id} glow style={{ borderLeft: `3px solid ${T.purple}`, background: `linear-gradient(90deg, ${T.purple}08, transparent)` }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                        <Badge color={T.purple}>{f.type}</Badge>
                                        <Badge color={T.green}>{f.affinity}% Match</Badge>
                                    </div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{f.agency}</div>
                                    <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>{f.description.slice(0, 60)}...</div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: T.green }}>{fmt(f.amount)}</div>
                                        <Btn size="xs" variant="ghost">View 990-PF</Btn>
                                    </div>
                                </Card>
                            ))
                        }
                    </div>
                </div>

                {/* 2. EDC Incentives */}
                <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: T.mute, letterSpacing: 1.5, marginBottom: 16 }}>🏗️ REGIONAL INCENTIVES</div>
                    <div style={{ display: "grid", gap: 10 }}>
                        {incentives.map(i => (
                            <Card key={i.id} style={{ borderLeft: `3px solid ${T.amber}`, background: `${T.amber}05` }}>
                                <div style={{ fontSize: 10, color: T.mute, marginBottom: 4 }}>{i.agency}</div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{i.title}</div>
                                <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>{i.description}</div>
                                <Btn size="xs" variant="primary" style={{ marginTop: 10, width: "100%" }}>Check Eligibility</Btn>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

            {/* ─── Column B: Hyper-Local & Niche ─── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {/* 1. Community Intelligence (Whisper Feed) */}
                <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: T.mute, letterSpacing: 1.5, marginBottom: 16 }}>📡 COMMUNITY INTELLIGENCE</div>
                    <div style={{ display: "grid", gap: 10 }}>
                        {signals.map(s => (
                            <Card key={s.id} style={{ borderLeft: `3px solid ${T.blue}`, background: `${T.blue}05` }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                    <Badge color={T.blue}>{s.type}</Badge>
                                    <span style={{ fontSize: 10, fontWeight: 700, color: T.green }}>{Math.round(s.probability * 100)}% Confidence</span>
                                </div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{s.title}</div>
                                <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>{s.description}</div>
                                <div style={{ fontSize: 10, color: T.mute, marginTop: 8 }}>Timing: <b style={{ color: T.blue }}>{s.timing}</b></div>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* 2. Charity Consortiums */}
                <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: T.mute, letterSpacing: 1.5, marginBottom: 16 }}>💎 NICHE PRIVATE GRANTS</div>
                    <div style={{ display: "grid", gap: 10 }}>
                        {charities.map(c => (
                            <Card key={c.id} style={{ borderLeft: `3px solid ${T.green}`, background: `${T.green}05` }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{c.title}</div>
                                <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>{c.description}</div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: T.green }}>{fmt(c.amount)}</span>
                                    <Badge color={T.green}>Private Pool</Badge>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    );
};
