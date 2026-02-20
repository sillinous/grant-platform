import { useStore } from '../store';

export const RegionalPulse = () => {
    const { addGrant: onAdd } = useStore();
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
                                        {onAdd && (
                                            <Btn size="xs" variant="success" onClick={() => {
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
                                            }}>+ Track</Btn>
                                        )}
                                    </div>
                                </Card>
                            ))
                        }
                    </div>
                </div>

                {/* 2. EDC Incentives */}
                <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: T.mute, letterSpacing: 1.5, marginBottom: 16 }}>🏗️ REGIONAL INCENTIVES</div>
                    <div style={{ display: "grid", gap: 12 }}>
                        {incentives.length === 0 && !loading && <Empty icon="🏢" title="No Incentives" sub="No current EDC incentives." />}
                        {incentives.map(i => (
                            <Card key={i.id} style={{ borderLeft: `3px solid ${T.amber}`, background: `${T.amber}05` }}>
                                <div style={{ fontSize: 11, color: T.sub, marginBottom: 6 }}>{i.agency}</div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 6 }}>{i.title}</div>
                                <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.4, marginBottom: 12 }}>{i.description}</div>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <Btn size="sm" variant="primary" style={{ flex: 1 }}>Check Eligibility</Btn>
                                    {onAdd && (
                                        <Btn size="sm" variant="success" onClick={() => onAdd({
                                            id: uid(), title: i.title, agency: i.agency, stage: "discovered", description: i.description, category: i.type,
                                            createdAt: new Date().toISOString()
                                        })}>+ Track</Btn>
                                    )}
                                </div>
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
                    <div style={{ display: "grid", gap: 12 }}>
                        {signals.length === 0 && !loading && <Empty icon="💬" title="No Signals" sub="No whisper feed signals found locally." />}
                        {signals.map(s => (
                            <Card key={s.id} style={{ borderLeft: `3px solid ${T.blue}`, background: `${T.blue}05` }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                    <Badge color={T.blue}>{s.type}</Badge>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: T.green }}>{Math.round(s.probability * 100)}% Confidence</span>
                                </div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 6 }}>{s.title}</div>
                                <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.4, marginBottom: 8 }}>{s.description}</div>
                                <div style={{ fontSize: 11, color: T.mute, marginBottom: 12, background: T.panel, padding: "4px 8px", borderRadius: 4, display: "inline-block" }}>
                                    Timing: <b style={{ color: T.blue }}>{s.timing}</b>
                                </div>
                                {onAdd && (
                                    <Btn size="sm" variant="ghost" style={{ width: "100%", textAlign: "center" }} onClick={() => onAdd({
                                        id: uid(), title: s.title, agency: s.agency, stage: "discovered", description: `Confidence: ${Math.round(s.probability * 100)}% - ${s.description}`, category: s.type,
                                        createdAt: new Date().toISOString()
                                    })}>+ Track Signal</Btn>
                                )}
                            </Card>
                        ))}
                    </div>
                </div>

                {/* 2. Charity Consortiums */}
                <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: T.mute, letterSpacing: 1.5, marginBottom: 16 }}>💎 NICHE PRIVATE GRANTS</div>
                    <div style={{ display: "grid", gap: 12 }}>
                        {charities.length === 0 && !loading && <Empty icon="🤝" title="No Consortiums" sub="No niche private consortiums found locally." />}
                        {charities.map(c => (
                            <Card key={c.id} style={{ borderLeft: `3px solid ${T.green}`, background: `${T.green}05` }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 6 }}>{c.title}</div>
                                <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.4, marginBottom: 12 }}>{c.description}</div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                    <span style={{ fontSize: 15, fontWeight: 800, color: T.green }}>{fmt(c.amount)}</span>
                                    <Badge color={T.green}>Private Pool</Badge>
                                </div>
                                {onAdd && (
                                    <Btn size="sm" variant="success" style={{ width: "100%" }} onClick={() => onAdd({
                                        id: uid(), title: c.title, agency: c.agency, amount: c.amount, stage: "discovered", description: c.description, category: c.type,
                                        createdAt: new Date().toISOString()
                                    })}>+ Track Grant</Btn>
                                )}
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    );
};
