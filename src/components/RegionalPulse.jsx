import React, { useState, useEffect } from 'react';
import { T, fmt, PROFILE, getProfileState } from '../globals';
import { API } from '../api';
import { Card, Badge, Btn, Empty } from '../ui';

export const RegionalPulse = () => {
    const [foundations, setFoundations] = useState([]);
    const [incentives, setIncentives] = useState([]);
    const [loading, setLoading] = useState(false);
    const state = getProfileState().abbr;

    useEffect(() => {
        loadRegionalData();
    }, [PROFILE.zip, state]);

    const loadRegionalData = async () => {
        setLoading(true);
        const [phil, edc] = await Promise.all([
            API.getPhilanthropicIntel(PROFILE.zip),
            API.getRegionalIncentives(state)
        ]);
        if (!phil._error) setFoundations(phil || []);
        if (!edc._error) setIncentives(edc || []);
        setLoading(false);
    };

    return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* ─── Column 1: Philanthropic Radar (Foundations) ─── */}
            <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 16 }}>🤝 Philanthropic Radar (Private Foundations)</div>
                {loading ? <div style={{ color: T.mute, fontSize: 12 }}>Scanning 990-PF filings & matching tags...</div> : (
                    <div style={{ display: "grid", gap: 10 }}>
                        {foundations.length === 0 ? <Empty title="No local foundations found" sub="Expanding search radius..." size="sm" /> : 
                            foundations.map(f => (
                                <Card key={f.id} style={{ background: T.purple + "05", borderLeft: `3px solid ${T.purple}` }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                        <Badge color={T.purple} size="xs">{f.type}</Badge>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            <Badge color={f.affinity > 60 ? T.green : f.affinity > 30 ? T.amber : T.mute} size="xs">
                                                {f.affinity}% Match
                                            </Badge>
                                            <Badge color={T.green} size="xs">{f.potential} Fit</Badge>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{f.agency}</div>
                                    <div style={{ fontSize: 11, color: T.sub, marginTop: 4, lineHeight: 1.4 }}>{f.description}</div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                                        <div style={{ fontSize: 10, color: T.mute }}>Est. Award: <b style={{ color: T.green }}>{fmt(f.amount)}</b></div>
                                        <Btn size="xs" variant="ghost">View 990-PF</Btn>
                                    </div>
                                </Card>
                            ))
                        }
                    </div>
                )}
            </div>

            {/* ─── Column 2: EDC & Regional Incentives ─── */}
            <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 16 }}>🏗️ EDC & Regional Incentives</div>
                {loading ? <div style={{ color: T.mute, fontSize: 12 }}>Fetching state incentives...</div> : (
                    <div style={{ display: "grid", gap: 10 }}>
                        {incentives.length === 0 ? <Empty title="No EDC incentives active" sub="Check back for quarterly releases" size="sm" /> : 
                            incentives.map(i => (
                                <Card key={i.id} style={{ background: T.amber + "05", borderLeft: `3px solid ${T.amber}` }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                        <Badge color={T.amber} size="xs">{i.type}</Badge>
                                        <span style={{ fontSize: 9, color: T.mute }}>{i.agency}</span>
                                    </div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{i.title}</div>
                                    <div style={{ fontSize: 11, color: T.sub, marginTop: 4, lineHeight: 1.4 }}>{i.description}</div>
                                    <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                                        <Btn size="xs" variant="primary" style={{ flex: 1 }}>Check Eligibility</Btn>
                                        <Btn size="xs" variant="ghost">Details</Btn>
                                    </div>
                                </Card>
                            ))
                        }
                    </div>
                )}
            </div>
        </div>
    );
};
