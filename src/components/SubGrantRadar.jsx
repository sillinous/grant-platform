import { useStore } from '../store';

export const SubGrantRadar = () => {
    const { addGrant: onAdd } = useStore();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.searchSubGrantOpportunities().then(d => {
            setData(d);
            setLoading(false);
        });
    }, []);

    return (
        <div style={{ padding: 20, animation: "fadeIn 0.4s" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 24, padding: "8px", background: `${T.amber}11`, borderRadius: "8px" }}>🛰️</div>
                <div>
                    <h2 style={{ fontSize: 24, fontWeight: 900, color: T.text, margin: 0 }}>Sub-Grant Radar</h2>
                    <p style={{ color: T.mute, fontSize: 13, marginTop: 4 }}>Tracking massive "Prime" awards that require pass-through funding to partners like you.</p>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {loading ? <div style={{ color: T.mute }}>Scanning prime award registries...</div> : 
                    data.map(item => (
                        <Card key={item.id} style={{ borderTop: `4px solid ${T.amber}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                                <Badge color={T.amber}>{item.status}</Badge>
                                <div style={{ textAlign: "right" }}>
                                    <div style={{ fontSize: 10, color: T.mute, fontWeight: 700, letterSpacing: 0.5, marginBottom: 4 }}>POTENTIAL WIN</div>
                                    <div style={{ fontSize: 18, fontWeight: 900, color: T.green }}>{fmt(item.subGrantAlloc)}</div>
                                </div>
                            </div>
                            
                            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: 0, marginBottom: 16, height: 44, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.title}</h3>

                            <div style={{ padding: 12, background: T.panel, borderRadius: 8, marginBottom: 16 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 8 }}>
                                    <span style={{ color: T.mute }}>PRIME FUNDER</span>
                                    <span style={{ color: T.text, fontWeight: 600 }}>{item.prime}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                                    <span style={{ color: T.mute }}>PRIMARY RECIPIENT</span>
                                    <span style={{ color: T.blue, fontWeight: 600 }}>{item.recipient}</span>
                                </div>
                            </div>

                            <div style={{ padding: 12, background: `${T.green}11`, borderLeft: `3px solid ${T.green}`, borderRadius: 8, fontSize: 12, color: T.sub, marginBottom: 16, lineHeight: 1.5 }}>
                                <strong style={{ color: T.text }}>PARTNERSHIP MANDATE:</strong> {item.requirement}
                            </div>

                            <div style={{ display: "flex", gap: 10, borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
                                <Btn variant="primary" style={{ flex: 1 }}>Contact Prime</Btn>
                                {onAdd && (
                                    <Btn variant="success" onClick={() => {
                                        onAdd({
                                            id: uid(),
                                            title: item.title,
                                            agency: item.prime,
                                            amount: item.subGrantAlloc,
                                            deadline: "Rolling",
                                            stage: "discovered",
                                            description: `Prime Recipient: ${item.recipient}. Requirement: ${item.requirement}`,
                                            category: "Sub-Grant",
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
    );
};
