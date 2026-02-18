import React, { useState, useEffect } from 'react';
import { Card, Btn, Badge } from '../ui';
import { T, fmt } from '../globals';
import { API } from '../api';

export const FortunaLink = () => {
    const [linked, setLinked] = useState(false);
    const [loading, setLoading] = useState(false);
    const [accounts, setAccounts] = useState([]);
    const [health, setHealth] = useState(null);

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        const isLinked = API.fortuna.isLinked();
        setLinked(isLinked);
        if (isLinked) {
            const [accs, h] = await Promise.all([
                API.fortuna.getAccounts(),
                API.fortuna.getFinancialHealth()
            ]);
            setAccounts(accs);
            setHealth(h);
        }
    };

    const handleLink = async () => {
        setLoading(true);
        const res = await API.fortuna.linkAccount();
        if (res.success) {
            setLinked(true);
            await checkStatus();
        }
        setLoading(false);
    };

    const handleUnlink = async () => {
        await API.fortuna.unlink();
        setLinked(false);
        setAccounts([]);
        setHealth(null);
    };

    return (
        <Card glow={linked} style={{ border: linked ? `1px solid ${T.green}44` : `1px dashed ${T.borderHi}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, background: linked ? T.green : T.panel, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                        💰
                    </div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Fortuna Fintech Connection</div>
                        <div style={{ fontSize: 11, color: T.mute }}>{linked ? "Connected to Business Treasury" : "Link your small business accounts"}</div>
                    </div>
                </div>
                <Badge color={linked ? T.green : T.shade}>{linked ? "ACTIVE" : "DISCONNECTED"}</Badge>
            </div>

            {linked ? (
                <div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 15 }}>
                        {accounts.map(acc => (
                            <div key={acc.id} style={{ background: T.panel, padding: 10, borderRadius: 8 }}>
                                <div style={{ fontSize: 10, color: T.sub, textTransform: "uppercase" }}>{acc.name}</div>
                                <div style={{ fontSize: 16, fontWeight: 900, color: T.text }}>{fmt(acc.balance)}</div>
                            </div>
                        ))}
                    </div>

                    {health && (
                        <div style={{ background: T.green + "11", padding: 12, borderRadius: 8, marginBottom: 15, border: `1px solid ${T.green}22` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                <span style={{ fontSize: 11, color: T.green, fontWeight: 700 }}>FINANCIAL HEALTH INDEX</span>
                                <span style={{ fontSize: 11, color: T.text, fontWeight: 900 }}>{health.score}/100</span>
                            </div>
                            <div style={{ display: "flex", gap: 15 }}>
                                <div>
                                    <div style={{ fontSize: 10, color: T.mute }}>RUNWAY</div>
                                    <div style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{health.runway}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 10, color: T.mute }}>LIQUIDITY</div>
                                    <div style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{health.liquidity_ratio}x</div>
                                </div>
                            </div>
                        </div>
                    )}

                    <Btn variant="ghost" size="sm" style={{ width: "100%", color: T.red }} onClick={handleUnlink}>Disconnect Fortuna</Btn>
                </div>
            ) : (
                <div>
                    <p style={{ fontSize: 13, color: T.sub, lineHeight: 1.5, marginBottom: 15 }}>
                        Connecting Fortuna allows the Grant Platform to automatically verify your financial readiness and sync eligible business expenses to grant ledgers.
                    </p>
                    <Btn variant="primary" style={{ width: "100%" }} onClick={handleLink} disabled={loading}>
                        {loading ? "Establishing Secure Link..." : "🔌 Connect Fortuna Accounts"}
                    </Btn>
                </div>
            )}
        </Card>
    );
};
