import React, { useState, useEffect } from 'react';
import { Card, Btn, Badge, Progress } from '../ui';
import { T, fmt, PROFILE, toast, watchGrant } from '../globals';
import { API } from '../api';
import { useStore } from '../store';
import { OpportunityDrawer } from './OpportunityDrawer';
import { ExternalLink, RefreshCw, Settings, Zap } from 'lucide-react';

export const Concierge = ({ onSelect }) => {
    const [briefing, setBriefing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [aiAvailable, setAiAvailable] = useState(null); // null=checking, true, false
    const [selectedGrant, setSelectedGrant] = useState(null);
    const { addGrant, grants: trackedGrants = [] } = useStore();
    const trackedTitles = new Set((trackedGrants || []).map(g => (g.title || "").trim().toLowerCase()));

    useEffect(() => {
        // Check AI availability first
        API.callAI([{ role: "user", content: "ping" }], "Reply: ok")
            .then(r => setAiAvailable(!r?.error))
            .catch(() => setAiAvailable(false));
        loadBriefing();
    }, []);

    const loadBriefing = async () => {
        setLoading(true);
        try {
            const data = await API.getCuratedBriefing(PROFILE);
            setBriefing(data);
        } catch {
            setBriefing({ topPicks: [], insights: [] });
        }
        setLoading(false);
    };

    const greet = () => {
        const h = new Date().getHours();
        if (h < 12) return "Good morning";
        if (h < 17) return "Good afternoon";
        return "Good evening";
    };

    const openPick = (pick) => {
        // Normalize pick into a grant-like object for the drawer
        const g = {
            id: pick.id || pick.title,
            title: pick.title,
            agency: pick.agency || pick.sector,
            amount: pick.amount || 0,
            deadline: pick.deadline,
            description: pick.reasoning || pick.description || "",
            _source: pick._source || pick.sector || "Concierge",
            _sourceColor: pick._sourceColor || T.amber,
            _score: pick.matchScore || pick._score,
            link: pick.link || pick.url,
            cfda: pick.cfda,
            oppNumber: pick.oppNumber,
        };
        setSelectedGrant(g);
    };

    if (loading) {
        return (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 40px", gap: 16 }}>
                <div style={{ fontSize: 48, animation: "pulse 2s ease-in-out infinite" }}>🛰️</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>Scanning funding signals…</div>
                <div style={{ fontSize: 13, color: T.mute }}>Querying 7 federal databases for {PROFILE.name || "your organization"}</div>
                <div style={{ width: 280, height: 3, background: T.glassBorder, borderRadius: 2, overflow: "hidden", marginTop: 8 }}>
                    <div style={{ height: "100%", background: `linear-gradient(90deg, ${T.amber}, ${T.blue})`, borderRadius: 2, animation: "shimmer 1.8s ease-in-out infinite", backgroundSize: "200% 100%" }} />
                </div>
                <style>{`@keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }`}</style>
            </div>
        );
    }

    return (
        <div style={{ animation: "fadeIn 0.5s ease-out" }}>

            {selectedGrant && (
                <OpportunityDrawer grant={selectedGrant} onClose={() => setSelectedGrant(null)}
                    onAdd={addGrant} isTracked={trackedTitles.has((selectedGrant.title || "").trim().toLowerCase())} />
            )}

            {/* Header */}
            <div style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                    <h2 style={{ color: T.text, fontSize: 26, margin: "0 0 6px", fontFamily: "Outfit", fontWeight: 900, letterSpacing: "-0.03em" }}>
                        {greet()}, {(PROFILE.name || "").split(" ")[0] || "there"} 👋
                    </h2>
                    <p style={{ color: T.sub, fontSize: 14, margin: 0 }}>Your AI-curated funding intelligence for today.</p>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {aiAvailable === false && (
                        <button onClick={() => window.location.href = "/settings"}
                            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, border: `1px solid ${T.amber}44`, background: `${T.amber}0d`, cursor: "pointer", fontSize: 12, color: T.amber, fontWeight: 600 }}>
                            <Settings size={12} /> Configure AI →
                        </button>
                    )}
                    <button onClick={loadBriefing} title="Refresh briefing"
                        style={{ padding: 8, borderRadius: 8, border: `1px solid ${T.glassBorder}`, background: "transparent", cursor: "pointer", color: T.mute, display: "flex", alignItems: "center" }}>
                        <RefreshCw size={14} />
                    </button>
                </div>
            </div>

            {/* AI offline notice */}
            {aiAvailable === false && (
                <div style={{ padding: "14px 18px", background: `${T.amber}0d`, border: `1px solid ${T.amber}33`, borderRadius: 12, marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 20 }}>⚡</span>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 2 }}>AI features limited</div>
                        <div style={{ fontSize: 12, color: T.sub }}>Configure an AI provider in Settings to enable smart briefings, eligibility analysis, and narrative drafts.</div>
                    </div>
                    <button onClick={() => window.location.href = "/settings"}
                        style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${T.amber}44`, background: `${T.amber}15`, cursor: "pointer", fontSize: 12, color: T.amber, fontWeight: 700, whiteSpace: "nowrap" }}>
                        Open Settings
                    </button>
                </div>
            )}

            {/* Top Picks */}
            {(briefing?.topPicks?.length > 0) ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20, marginBottom: 32 }}>
                    {briefing.topPicks.map((pick, i) => {
                        const isTracked = trackedTitles.has((pick.title || "").trim().toLowerCase());
                        return (
                            <Card key={i} glow style={{
                                display: "flex", flexDirection: "column", position: "relative",
                                borderTop: `3px solid ${T.amber}`, cursor: "pointer",
                                transition: "transform 0.2s",
                            }}
                                onClick={() => openPick(pick)}
                                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                                onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
                                {/* Score badge */}
                                <div style={{ position: "absolute", top: 12, right: 12 }}>
                                    <Badge color={pick.matchScore >= 85 ? T.green : T.amber} style={{ fontSize: 9 }}>
                                        {pick.matchScore}% match
                                    </Badge>
                                </div>

                                {/* Sector */}
                                <div style={{ fontSize: 10, fontWeight: 800, color: T.amber, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                                    {pick.sector}
                                </div>

                                {/* Title */}
                                <h3 style={{ fontSize: 15, color: T.text, margin: "0 0 10px", lineHeight: 1.4, fontFamily: "Outfit", fontWeight: 700, paddingRight: 60 }}>
                                    {pick.title}
                                </h3>

                                {/* Agency */}
                                {pick.agency && <div style={{ fontSize: 11, color: T.mute, marginBottom: 10, fontWeight: 600 }}>{pick.agency}</div>}

                                {/* Reasoning */}
                                <p style={{ fontSize: 12, color: T.sub, flex: 1, marginBottom: 16, lineHeight: 1.6, margin: "0 0 16px" }}>
                                    {pick.reasoning}
                                </p>

                                {/* Footer */}
                                <div style={{ borderTop: `1px solid ${T.glassBorder}`, paddingTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                                    <div style={{ fontSize: 18, fontWeight: 900, color: T.green, letterSpacing: "-0.03em" }}>
                                        {pick.amount > 0 ? (pick.amount >= 1e6 ? `$${(pick.amount/1e6).toFixed(1)}M` : fmt(pick.amount)) : "—"}
                                    </div>
                                    <div style={{ display: "flex", gap: 6 }}>
                                        {pick.link && (
                                            <a href={pick.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                                                style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${T.glassBorder}`, fontSize: 11, color: T.blue, textDecoration: "none", fontWeight: 600 }}>
                                                View ↗
                                            </a>
                                        )}
                                        <button onClick={e => { e.stopPropagation(); watchGrant(pick); }}
                                            style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${T.glassBorder}`, background: "none", cursor: "pointer", fontSize: 11, color: T.mute }}
                                            title="Watch for similar">👁</button>
                                        <Btn variant={isTracked ? "ghost" : "primary"} size="sm" style={{ fontSize: 11 }}
                                            onClick={e => { e.stopPropagation(); if (!isTracked) addGrant({ ...pick, stage: "discovered", id: pick.id || pick.title }); }}>
                                            {isTracked ? "✓" : "+ Track"}
                                        </Btn>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <Card style={{ textAlign: "center", padding: "40px 32px", marginBottom: 32, borderTop: `3px solid ${T.amber}` }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>🔭</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: T.text, marginBottom: 8 }}>No picks yet</div>
                    <p style={{ fontSize: 13, color: T.mute, maxWidth: 360, margin: "0 auto 20px", lineHeight: 1.6 }}>
                        {aiAvailable === false
                            ? "Configure an AI provider to enable smart grant picks tailored to your profile."
                            : "No focus areas found in your profile. Update your organization profile to get personalized picks."}
                    </p>
                    <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                        <Btn variant="primary" onClick={() => window.location.href = "/discovery"}>🔭 Browse Discovery</Btn>
                        <Btn variant="ghost" onClick={() => window.location.href = "/profile"}>Edit Profile →</Btn>
                    </div>
                </Card>
            )}

            {/* Strategic Insights + Velocity */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
                <Card style={{ background: T.panel }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: T.text, marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 18 }}>🧠</span> Strategic Analysis
                    </div>
                    {briefing?.insights?.length > 0 ? (
                        <div style={{ display: "grid", gap: 14 }}>
                            {briefing.insights.map((insight, i) => (
                                <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "12px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 10, border: `1px solid ${T.glassBorder}` }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 8, background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                                        {insight.icon}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 12, color: T.text, fontWeight: 700, marginBottom: 3 }}>{insight.label}</div>
                                        <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.6 }}>{insight.text}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ fontSize: 13, color: T.mute, fontStyle: "italic", padding: "12px 0" }}>
                            {aiAvailable === false
                                ? "AI insights require a configured provider. Visit Settings to set one up."
                                : "Loading strategic insights…"}
                        </div>
                    )}
                </Card>

                <Card style={{ background: `linear-gradient(180deg, ${T.panel}, transparent)` }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: T.text, marginBottom: 18 }}>Quick Actions</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {[
                            { label: "Smart Scan", icon: "🔭", href: "/discovery", color: T.blue },
                            { label: "Match Alerts", icon: "🔔", href: "/match-alerts", color: T.amber },
                            { label: "Grant Pipeline", icon: "🚀", href: "/pipeline", color: T.green },
                            { label: "AI Drafter", icon: "✨", href: "/ai-drafter", color: "#a855f7" },
                            { label: "Readiness Check", icon: "✅", href: "/readiness", color: T.teal || T.green },
                        ].map(a => (
                            <button key={a.label} onClick={() => window.location.href = a.href}
                                style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 9, border: `1px solid ${T.glassBorder}`, background: "rgba(255,255,255,0.02)", cursor: "pointer", fontSize: 13, color: T.sub, fontWeight: 500, transition: "all 0.15s", textAlign: "left" }}
                                onMouseEnter={e => { e.currentTarget.style.background = `${a.color}10`; e.currentTarget.style.color = T.text; e.currentTarget.style.borderColor = `${a.color}33`; }}
                                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.color = T.sub; e.currentTarget.style.borderColor = T.glassBorder; }}>
                                <span style={{ fontSize: 16 }}>{a.icon}</span> {a.label}
                            </button>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
};
