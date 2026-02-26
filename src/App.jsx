import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useStore } from './store';
import { OrganizationProvider } from './context/OrganizationContext';
import { T, LS, uid, PROFILE, sanitizeInput } from './globals';
import { Discovery } from './components/Discovery';
import { Dashboard } from './components/Dashboard';
import { Pipeline } from './components/Pipeline';
import { ImpactMapper } from './components/ImpactMapper';
import { OrgProfile } from './components/OrgProfile';
import { Settings } from './components/Settings';
import { IntelligenceFeed } from './components/IntelligenceFeed';
import { Concierge } from './components/Concierge';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { ContextSwitcher } from './components/ContextSwitcher';
import { Toast } from './components/Toast';
import { OnboardingWizard } from './components/OnboardingWizard';
import { AIChatBar } from './components/AIChatBar';
import { GrantWritingStudio } from './components/GrantWritingStudio';
import { CommandPalette } from './components/CommandPalette';
import { AuthBar } from './components/AuthBar';

const NAV = [
    {
        group: "Strategic", items: [
            { id: "dashboard", label: "Executive Suite", icon: "📊" },
            { id: "intelligence", label: "Intelligence Feed", icon: "📡" },
            { id: "concierge", label: "AI Concierge", icon: "🤖" },
        ]
    },
    {
        group: "Operations", items: [
            { id: "discovery", label: "Discovery Hub", icon: "🔭" },
            { id: "studio", label: "Grant Studio", icon: "🖋️" },
            { id: "pipeline", label: "Grant Pipeline", icon: "🚀" },
            { id: "impact", label: "Impact Portfolios", icon: "🌍" },
        ]
    },
    {
        group: "Settings", items: [
            { id: "profile", label: "Organization", icon: "🏢" },
            { id: "settings", label: "System Config", icon: "⚙️" },
        ]
    }
];

export const App = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const page = location.pathname === '/' ? 'dashboard' : location.pathname.substring(1);

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [sidebarCollapsed, setSidebarCollapsed] = useState({});
    const [onboardingComplete, setOnboardingComplete] = useState(() => localStorage.getItem("gp_onboarded") === "1");
    const { user, organization, grants, vaultDocs, contacts } = useStore();

    const currentNav = NAV.flatMap(g => g.items).find(n => n.id === page);

    return (
        <div style={{ display: "flex", height: "100vh", background: "#020203", color: T.text, fontFamily: "'Inter', sans-serif" }}>
            <div style={{
                width: sidebarOpen ? 260 : 72,
                background: T.glassLg,
                backdropFilter: "blur(20px)",
                borderRight: `1px solid ${T.glassBorder}`,
                display: "flex", flexDirection: "column",
                transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                overflow: "hidden", flexShrink: 0,
                boxShadow: "10px 0 30px rgba(0,0,0,0.5)"
            }}>
                <div style={{ padding: "24px 16px", borderBottom: `1px solid ${T.glassBorder}` }}>
                    {sidebarOpen ? <ContextSwitcher /> : <div style={{ fontSize: 24, textAlign: "center" }}>🌌</div>}
                </div>

                <nav style={{ flex: 1, overflowY: "auto", padding: "16px 0" }} className="scrollbar-hide">
                    {NAV.map(({ group, label, items }) => {
                        const isCollapsed = sidebarCollapsed[group];
                        return (
                            <div key={group}>
                                {sidebarOpen && (
                                    <div onClick={() => setSidebarCollapsed({ ...sidebarCollapsed, [group]: !isCollapsed })} style={{ padding: "16px 16px 4px", fontSize: 10, fontWeight: 800, color: T.mute, letterSpacing: 1.5, cursor: "pointer", display: "flex", justifyContent: "space-between", opacity: 0.6 }}>
                                        <span>{group.toUpperCase()}</span>
                                        <span style={{ fontSize: 8 }}>{isCollapsed ? "▶" : "▼"}</span>
                                    </div>
                                )}
                                {(!isCollapsed || !sidebarOpen) && items.map(n => (
                                    <button
                                        key={n.id}
                                        onClick={() => navigate(`/${n.id}`)}
                                        style={{
                                            width: "calc(100% - 16px)", margin: "2px 8px", padding: sidebarOpen ? "10px 12px" : "10px",
                                            border: "none", borderRadius: 10, cursor: "pointer",
                                            display: "flex", alignItems: "center", gap: 12,
                                            background: page === n.id ? T.amber + "15" : "transparent",
                                            color: page === n.id ? T.amber : T.sub,
                                            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                            textAlign: "left",
                                            boxShadow: page === n.id ? `inset 0 0 0 1px ${T.amber}33` : "none"
                                        }}
                                        onMouseEnter={e => { if (page !== n.id) { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.color = T.text; } }}
                                        onMouseLeave={e => { if (page !== n.id) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.sub; } }}
                                    >
                                        <span style={{ fontSize: 18, opacity: page === n.id ? 1 : 0.7 }}>{n.icon}</span>
                                        {sidebarOpen && <span style={{ fontWeight: page === n.id ? 600 : 400, fontSize: 13 }}>{n.label}</span>}
                                    </button>
                                ))}
                            </div>
                        );
                    })}
                </nav>

                <AuthBar />
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "radial-gradient(circle at 50% -20%, #1a1a2e 0%, #020203 100%)" }}>
                <header style={{
                    padding: "16px 24px",
                    borderBottom: `1px solid ${T.glassBorder}`,
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    background: "rgba(2,2,3,0.5)",
                    backdropFilter: "blur(10px)"
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${T.glassBorder}`, color: T.sub, cursor: "pointer", width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                            {sidebarOpen ? "◀" : "▶"}
                        </button>
                        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.text, fontFamily: "Outfit", letterSpacing: "-0.03em" }}>{currentNav?.icon} {currentNav?.label}</h2>
                    </div>
                    <button
                        onClick={() => {
                            // Trigger command palette via keyboard event
                            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
                        }}
                        style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.glassBorder}`, borderRadius: 8, padding: '6px 12px', color: T.mute, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}
                        title="Open Command Palette (Ctrl+K)"
                    >
                        <span>🔍</span>
                        <span>Search</span>
                        <kbd style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4, padding: '1px 5px', fontSize: 10 }}>Ctrl+K</kbd>
                    </button>
                </header>

                <main style={{ flex: 1, overflowY: "auto", padding: 32 }} className="scrollbar-hide">
                    <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<ExecutiveDashboard />} />
                        <Route path="/discovery" element={<Discovery />} />
                        <Route path="/studio" element={<GrantWritingStudio />} />
                        <Route path="/pipeline" element={<Pipeline />} />
                        <Route path="/impact" element={<ImpactMapper />} />
                        <Route path="/profile" element={<OrgProfile />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/intelligence" element={<IntelligenceFeed />} />
                        <Route path="/concierge" element={<Concierge />} />
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                </main>
            </div>
            {!onboardingComplete && (
                <OnboardingWizard onComplete={(profile) => {
                    if (profile) {
                        try { localStorage.setItem('gp_profile', JSON.stringify(profile)); } catch (e) { }
                    }
                    setOnboardingComplete(true);
                }} />
            )}
            <AIChatBar />
            <Toast />
            <CommandPalette />
        </div>
    );
};

export default () => (
    <OrganizationProvider>
        <App />
    </OrganizationProvider>
);
