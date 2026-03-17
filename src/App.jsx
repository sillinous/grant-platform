import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useStore } from './store';
import { OrganizationProvider } from './context/OrganizationContext';
import { T, LS, uid, PROFILE, sanitizeInput } from './globals';
import { API } from './api';
import { ContextSwitcher } from './components/ContextSwitcher';
import { Toast } from './components/Toast';
import { AIChatBar } from './components/AIChatBar';
import { CommandPalette } from './components/CommandPalette';
import { AuthBar } from './components/AuthBar';

// ── AI Status Indicator ─────────────────────────────────────────────────
const AIStatusBadge = ({ navigate }) => {
    const [status, setStatus] = useState("checking"); // "checking" | "ok" | "error"
    useEffect(() => {
        API.callAI([{ role: "user", content: "ping" }], "Reply with one word: ok")
            .then(r => setStatus(r?.text?.toLowerCase().includes("ok") || !r?.error ? "ok" : "error"))
            .catch(() => setStatus("error"));
    }, []);
    const cfg = {
        checking: { color: T.mute,  dot: "#888",     label: "AI…"    },
        ok:       { color: T.green, dot: T.green,     label: "AI Ready" },
        error:    { color: T.red,   dot: T.red,       label: "AI Offline" },
    }[status];
    return (
        <button onClick={() => navigate("/settings")} title={status === "error" ? "Configure AI provider in Settings" : `AI: ${status}`}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, border: `1px solid ${cfg.color}33`, background: `${cfg.color}0d`, cursor: "pointer", transition: "all 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.background = `${cfg.color}18`}
            onMouseLeave={e => e.currentTarget.style.background = `${cfg.color}0d`}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dot, boxShadow: status === "ok" ? `0 0 6px ${T.green}` : "none", flexShrink: 0,
                animation: status === "checking" ? "pulse 1.2s ease-in-out infinite" : "none" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
        </button>
    );
};

// ── Lazy-loaded route components ────────────────────────────────────────
const ExecutiveDashboard  = lazy(() => import('./components/ExecutiveDashboard').then(m => ({ default: m.ExecutiveDashboard })));
const IntelligenceFeed    = lazy(() => import('./components/IntelligenceFeed').then(m => ({ default: m.IntelligenceFeed })));
const Concierge           = lazy(() => import('./components/Concierge').then(m => ({ default: m.Concierge })));
const Discovery           = lazy(() => import('./components/Discovery').then(m => ({ default: m.Discovery })));
const RFPParser           = lazy(() => import('./components/RFPParser').then(m => ({ default: m.RFPParser })));
const MatchScorer         = lazy(() => import('./components/MatchScorer').then(m => ({ default: m.MatchScorer })));
const MatchAlerts         = lazy(() => import('./components/MatchAlerts').then(m => ({ default: m.MatchAlerts })));
const ReadinessAssessment = lazy(() => import('./components/ReadinessAssessment').then(m => ({ default: m.ReadinessAssessment })));
const GrantWritingStudio  = lazy(() => import('./components/GrantWritingStudio').then(m => ({ default: m.GrantWritingStudio })));
const AIDrafter           = lazy(() => import('./components/AIDrafter').then(m => ({ default: m.AIDrafter })));
const NarrativeScorer     = lazy(() => import('./components/NarrativeScorer').then(m => ({ default: m.NarrativeScorer })));
const SectionLibrary      = lazy(() => import('./components/SectionLibrary').then(m => ({ default: m.SectionLibrary })));
const LetterGenerator     = lazy(() => import('./components/LetterGenerator').then(m => ({ default: m.LetterGenerator })));
const CensusNarrative     = lazy(() => import('./components/CensusNarrative').then(m => ({ default: m.CensusNarrative })));
const DocumentAssembler   = lazy(() => import('./components/DocumentAssembler').then(m => ({ default: m.DocumentAssembler })));
const BudgetBuilder       = lazy(() => import('./components/BudgetBuilder').then(m => ({ default: m.BudgetBuilder })));
const DocumentVault       = lazy(() => import('./components/DocumentVault').then(m => ({ default: m.DocumentVault })));
const GrantTemplates      = lazy(() => import('./components/GrantTemplates').then(m => ({ default: m.GrantTemplates })));
const Pipeline            = lazy(() => import('./components/Pipeline').then(m => ({ default: m.Pipeline })));
const ComplianceTracker   = lazy(() => import('./components/ComplianceTracker').then(m => ({ default: m.ComplianceTracker })));
const ActionPlan          = lazy(() => import('./components/ActionPlan').then(m => ({ default: m.ActionPlan })));
const AwardManagement     = lazy(() => import('./components/AwardManagement').then(m => ({ default: m.AwardManagement })));
const OutcomeTracker      = lazy(() => import('./components/OutcomeTracker').then(m => ({ default: m.OutcomeTracker })));
const CollaborationHub    = lazy(() => import('./components/CollaborationHub').then(m => ({ default: m.CollaborationHub })));
const SAMWizard           = lazy(() => import('./components/SAMWizard').then(m => ({ default: m.SAMWizard })));
const FinancialProjector  = lazy(() => import('./components/FinancialProjector').then(m => ({ default: m.FinancialProjector })));
const FundingForecast     = lazy(() => import('./components/FundingForecast').then(m => ({ default: m.FundingForecast })));
const StrategicAdvisor    = lazy(() => import('./components/StrategicAdvisor').then(m => ({ default: m.StrategicAdvisor })));
const RelationshipMap     = lazy(() => import('./components/RelationshipMap').then(m => ({ default: m.RelationshipMap })));
const PeerProspecting     = lazy(() => import('./components/PeerProspecting').then(m => ({ default: m.PeerProspecting })));
const FunderResearch      = lazy(() => import('./components/FunderResearch').then(m => ({ default: m.FunderResearch })));
const PortfolioOptimizer  = lazy(() => import('./components/PortfolioOptimizer').then(m => ({ default: m.PortfolioOptimizer })));
const WinLossAnalysis     = lazy(() => import('./components/WinLossAnalysis').then(m => ({ default: m.WinLossAnalysis })));
const ImpactPortfolio     = lazy(() => import('./components/ImpactPortfolio').then(m => ({ default: m.ImpactPortfolio })));
const TimelineCalendar    = lazy(() => import('./components/TimelineCalendar').then(m => ({ default: m.TimelineCalendar })));
const DeadlineWatchdog    = lazy(() => import('./components/DeadlineWatchdog').then(m => ({ default: m.DeadlineWatchdog })));
const ActivityLog         = lazy(() => import('./components/ActivityLog').then(m => ({ default: m.ActivityLog })));
const ReportGenerator     = lazy(() => import('./components/ReportGenerator').then(m => ({ default: m.ReportGenerator })));
const ExportCenter        = lazy(() => import('./components/ExportCenter').then(m => ({ default: m.ExportCenter })));
const ImpactMapper        = lazy(() => import('./components/ImpactMapper').then(m => ({ default: m.ImpactMapper })));
const OrgProfile          = lazy(() => import('./components/OrgProfile').then(m => ({ default: m.OrgProfile })));
const Settings            = lazy(() => import('./components/Settings').then(m => ({ default: m.Settings })));
const OnboardingWizard    = lazy(() => import('./components/OnboardingWizard').then(m => ({ default: m.OnboardingWizard })));

// ── Error Boundary ───────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
    constructor(props) { super(props); this.state = { error: null }; }
    static getDerivedStateFromError(error) { return { error }; }
    render() {
        if (this.state.error) {
            return (
                <div style={{ padding: 40, textAlign: "center", color: T.mute }}>
                    <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 8 }}>Module failed to load</div>
                    <div style={{ fontSize: 13, marginBottom: 24 }}>{this.state.error?.message}</div>
                    <button
                        onClick={() => this.setState({ error: null })}
                        style={{ background: T.amber + "20", border: `1px solid ${T.amber}40`, color: T.amber, padding: "8px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}
                    >
                        Try Again
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

// ── Loading fallback ─────────────────────────────────────────────────────
const PageLoader = () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: T.mute, gap: 12 }}>
        <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${T.amber}`, borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
        <span style={{ fontSize: 14 }}>Loading...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
);

// ── Full navigation (39 modules across 8 groups) ─────────────────────────
const NAV = [
    {
        group: "Strategic", items: [
            { id: "dashboard",    label: "Executive Suite",    icon: "📊" },
            { id: "intelligence", label: "Intelligence Feed",  icon: "📡" },
            { id: "concierge",    label: "AI Concierge",       icon: "🤖" },
        ]
    },
    {
        group: "Discovery", items: [
            { id: "discovery",    label: "Discovery Hub",       icon: "🔭" },
            { id: "rfp-parser",   label: "RFP Parser",          icon: "📄" },
            { id: "match-scorer", label: "Match Scorer",        icon: "🎯" },
            { id: "match-alerts", label: "Match Alerts",        icon: "🔔" },
            { id: "readiness",    label: "Readiness Check",     icon: "✅" },
        ]
    },
    {
        group: "Writing", items: [
            { id: "studio",         label: "Grant Studio",        icon: "🖋️" },
            { id: "ai-drafter",     label: "AI Drafter",          icon: "✨" },
            { id: "narrative",      label: "Narrative Scorer",    icon: "📝" },
            { id: "section-library",label: "Section Library",     icon: "📚" },
            { id: "letter-gen",     label: "Letter Generator",    icon: "✉️" },
            { id: "census-narrative",label:"Census Narratives",   icon: "📊" },
            { id: "doc-assembler",  label: "Document Assembler",  icon: "🗂️" },
        ]
    },
    {
        group: "Documents", items: [
            { id: "budget",       label: "Budget Builder",      icon: "💰" },
            { id: "vault",        label: "Document Vault",      icon: "🔒" },
            { id: "templates",    label: "Grant Templates",     icon: "📋" },
        ]
    },
    {
        group: "Management", items: [
            { id: "pipeline",       label: "Grant Pipeline",      icon: "🚀" },
            { id: "compliance",     label: "Compliance Tracker",  icon: "⚖️" },
            { id: "action-plan",    label: "Action Plan",         icon: "📌" },
            { id: "awards",         label: "Award Management",    icon: "🏆" },
            { id: "outcomes",       label: "Outcome Tracker",     icon: "📈" },
            { id: "collaboration",  label: "Collaboration Hub",   icon: "🤝" },
            { id: "sam-wizard",     label: "SAM Registration",    icon: "🏛️" },
        ]
    },
    {
        group: "Intelligence", items: [
            { id: "financial",        label: "Financial Projector", icon: "💹" },
            { id: "forecast",         label: "Funding Forecast",    icon: "🔮" },
            { id: "strategic-advisor",label: "Strategic Advisor",   icon: "🧠" },
            { id: "relationships",    label: "Relationship Map",    icon: "🕸️" },
            { id: "peer-prospecting", label: "Peer Prospecting",    icon: "👥" },
            { id: "funder-research",  label: "Funder Research",     icon: "🔍" },
            { id: "portfolio",        label: "Portfolio Optimizer", icon: "⚡" },
            { id: "win-loss",         label: "Win/Loss Analysis",   icon: "📉" },
            { id: "impact-portfolio", label: "Impact Portfolio",    icon: "🌍" },
        ]
    },
    {
        group: "Tracking", items: [
            { id: "calendar",         label: "Timeline Calendar",   icon: "📅" },
            { id: "deadline-watchdog",label: "Deadline Watchdog",   icon: "⏰" },
            { id: "activity-log",     label: "Activity Log",        icon: "📋" },
        ]
    },
    {
        group: "Output", items: [
            { id: "reports",     label: "Report Generator",    icon: "📊" },
            { id: "export",      label: "Export Center",       icon: "📤" },
            { id: "impact",      label: "Impact Portfolios",   icon: "🌱" },
        ]
    },
    {
        group: "Settings", items: [
            { id: "profile",   label: "Organization",   icon: "🏢" },
            { id: "settings",  label: "System Config",  icon: "⚙️" },
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

    const currentNav = NAV.flatMap(g => g.items).find(n => n.id === page);

    return (
        <div style={{ display: "flex", height: "100vh", background: "#020203", color: T.text, fontFamily: "'Inter', sans-serif" }}>
            {/* ── Sidebar ── */}
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
                    {NAV.map(({ group, items }) => {
                        const isCollapsed = sidebarCollapsed[group];
                        return (
                            <div key={group}>
                                {sidebarOpen && (
                                    <div
                                        onClick={() => setSidebarCollapsed({ ...sidebarCollapsed, [group]: !isCollapsed })}
                                        style={{ padding: "16px 16px 4px", fontSize: 10, fontWeight: 800, color: T.mute, letterSpacing: 1.5, cursor: "pointer", display: "flex", justifyContent: "space-between", opacity: 0.6 }}
                                    >
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
                                        title={!sidebarOpen ? n.label : undefined}
                                    >
                                        <span style={{ fontSize: 18, opacity: page === n.id ? 1 : 0.7, flexShrink: 0 }}>{n.icon}</span>
                                        {sidebarOpen && <span style={{ fontWeight: page === n.id ? 600 : 400, fontSize: 13 }}>{n.label}</span>}
                                    </button>
                                ))}
                            </div>
                        );
                    })}
                </nav>

                <AuthBar />
            </div>

            {/* ── Main content ── */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "radial-gradient(circle at 50% -20%, #1a1a2e 0%, #020203 100%)" }}>
                <header style={{
                    padding: "16px 24px",
                    borderBottom: `1px solid ${T.glassBorder}`,
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    background: "rgba(2,2,3,0.5)",
                    backdropFilter: "blur(10px)"
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${T.glassBorder}`, color: T.sub, cursor: "pointer", width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}
                        >
                            {sidebarOpen ? "◀" : "▶"}
                        </button>
                        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.text, fontFamily: "Outfit", letterSpacing: "-0.03em" }}>
                            {currentNav?.icon} {currentNav?.label || page}
                        </h2>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <AIStatusBadge navigate={navigate} />
                        <button
                            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))}
                            style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.glassBorder}`, borderRadius: 8, padding: '6px 12px', color: T.mute, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}
                            title="Open Command Palette (Ctrl+K)"
                        >
                            <span>🔍</span>
                            <span>Search</span>
                            <kbd style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4, padding: '1px 5px', fontSize: 10 }}>Ctrl+K</kbd>
                        </button>
                    </div>
                </header>

                <main style={{ flex: 1, overflowY: "auto", padding: 32 }} className="scrollbar-hide">
                    <ErrorBoundary>
                        <Suspense fallback={<PageLoader />}>
                            <Routes>
                                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                                {/* Strategic */}
                                <Route path="/dashboard"         element={<ExecutiveDashboard />} />
                                <Route path="/intelligence"      element={<IntelligenceFeed />} />
                                <Route path="/concierge"         element={<Concierge />} />
                                {/* Discovery */}
                                <Route path="/discovery"         element={<Discovery />} />
                                <Route path="/rfp-parser"        element={<RFPParser />} />
                                <Route path="/match-scorer"      element={<MatchScorer />} />
                                <Route path="/match-alerts"      element={<MatchAlerts />} />
                                <Route path="/readiness"         element={<ReadinessAssessment />} />
                                {/* Writing */}
                                <Route path="/studio"            element={<GrantWritingStudio />} />
                                <Route path="/ai-drafter"        element={<AIDrafter />} />
                                <Route path="/narrative"         element={<NarrativeScorer />} />
                                <Route path="/section-library"   element={<SectionLibrary />} />
                                <Route path="/letter-gen"        element={<LetterGenerator />} />
                                <Route path="/census-narrative"  element={<CensusNarrative />} />
                                <Route path="/doc-assembler"     element={<DocumentAssembler />} />
                                {/* Documents */}
                                <Route path="/budget"            element={<BudgetBuilder />} />
                                <Route path="/vault"             element={<DocumentVault />} />
                                <Route path="/templates"         element={<GrantTemplates />} />
                                {/* Management */}
                                <Route path="/pipeline"          element={<Pipeline />} />
                                <Route path="/compliance"        element={<ComplianceTracker />} />
                                <Route path="/action-plan"       element={<ActionPlan />} />
                                <Route path="/awards"            element={<AwardManagement />} />
                                <Route path="/outcomes"          element={<OutcomeTracker />} />
                                <Route path="/collaboration"     element={<CollaborationHub />} />
                                <Route path="/sam-wizard"        element={<SAMWizard />} />
                                {/* Intelligence */}
                                <Route path="/financial"         element={<FinancialProjector />} />
                                <Route path="/forecast"          element={<FundingForecast />} />
                                <Route path="/strategic-advisor" element={<StrategicAdvisor />} />
                                <Route path="/relationships"     element={<RelationshipMap />} />
                                <Route path="/peer-prospecting"  element={<PeerProspecting />} />
                                <Route path="/funder-research"   element={<FunderResearch />} />
                                <Route path="/portfolio"         element={<PortfolioOptimizer />} />
                                <Route path="/win-loss"          element={<WinLossAnalysis />} />
                                <Route path="/impact-portfolio"  element={<ImpactPortfolio />} />
                                {/* Tracking */}
                                <Route path="/calendar"          element={<TimelineCalendar />} />
                                <Route path="/deadline-watchdog" element={<DeadlineWatchdog />} />
                                <Route path="/activity-log"      element={<ActivityLog />} />
                                {/* Output */}
                                <Route path="/reports"           element={<ReportGenerator />} />
                                <Route path="/export"            element={<ExportCenter />} />
                                <Route path="/impact"            element={<ImpactMapper />} />
                                {/* Settings */}
                                <Route path="/profile"           element={<OrgProfile />} />
                                <Route path="/settings"          element={<Settings />} />
                                <Route path="*"                  element={<Navigate to="/dashboard" replace />} />
                            </Routes>
                        </Suspense>
                    </ErrorBoundary>
                </main>
            </div>

            {/* ── Overlays ── */}
            <Suspense fallback={null}>
                {!onboardingComplete && (
                    <OnboardingWizard onComplete={(profile) => {
                        if (profile) {
                            try { localStorage.setItem('gp_profile', JSON.stringify(profile)); } catch (e) {}
                        }
                        localStorage.setItem("gp_onboarded", "1");
                        setOnboardingComplete(true);
                    }} />
                )}
            </Suspense>
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
