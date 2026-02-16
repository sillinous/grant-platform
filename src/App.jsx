import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { T, PROFILE, saveProfile, LS, uid, fmt, fmtDate, daysUntil, clamp, pct, getProfileState, STAGES, STAGE_MAP, getStorageUsage, logActivity } from "./globals";
import { Icon, Btn, Card, Badge, Input, TextArea, Select, Tab, Progress, Empty, Modal, Stat, MiniBar, ErrorBoundary } from "./ui";
import { API, buildPortfolioContext } from "./api";
import { auth } from "./auth";
import { cloud } from "./cloud";

// ═══════════════════════════════════════════════════════════════════
// GRANT LIFECYCLE PLATFORM v5.2 — UNLESS
// ═══════════════════════════════════════════════════════════════════
// 48 modules · 23+ APIs · 22 cross-module data flows · AI-powered
// NEW: Timeline Calendar, Document Vault, Financial Impact Projector,
//      Grant Relationship Map, Enhanced Intelligence Engine
// ═══════════════════════════════════════════════════════════════════

// ─── THEME ─────────────────────────────────────────────────────────


// ─── PROFILE ───────────────────────────────────────────────────────


// Dynamic profile — loads from localStorage, falls back to defaults

// ───────────────────────────────────────────────────────────────────

// ═══ Component Imports ═══
import { Dashboard } from "./components/Dashboard"; // Extracted
import { Discovery } from "./components/Discovery";
import { Pipeline } from "./components/Pipeline";
import { IntelligenceFeed } from "./components/IntelligenceFeed";
import { GrantTemplates } from "./components/GrantTemplates";
import { RFPParser } from './components/RFPParser';
import { MatchScorer } from './components/MatchScorer';
import { ComplianceTracker } from './components/ComplianceTracker';
import { AwardManagement } from './components/AwardManagement';
import { CensusNarrative } from './components/CensusNarrative';
import { ActionPlan } from './components/ActionPlan';
import { DocumentVault } from './components/DocumentVault';
import { TimelineCalendar } from './components/TimelineCalendar';
import { FinancialProjector } from './components/FinancialProjector';
import { RelationshipMap } from './components/RelationshipMap';
import { AIDrafter } from './components/AIDrafter';
import { Settings } from './components/Settings';
import { AIChatBar } from './components/AIChatBar';
import { WinLossAnalysis } from './components/WinLossAnalysis';
import { PeerProspecting } from './components/PeerProspecting';
import { SectionLibrary } from './components/SectionLibrary';
import { ReportGenerator } from './components/ReportGenerator';
import { FunderResearch } from './components/FunderResearch';
import { PortfolioOptimizer } from './components/PortfolioOptimizer';
import { BudgetBuilder } from './components/BudgetBuilder';
import { MatchAlerts } from './components/MatchAlerts';
import { NarrativeScorer } from './components/NarrativeScorer';
import { LetterGenerator } from './components/LetterGenerator';
import { FundingForecast } from './components/FundingForecast';
import { ActivityLog } from './components/ActivityLog';
import { DeadlineWatchdog } from './components/DeadlineWatchdog';
import { CollaborationHub } from './components/CollaborationHub';
import { DocumentAssembler } from './components/DocumentAssembler';
import { OutcomeTracker } from './components/OutcomeTracker';
import { ExportCenter } from './components/ExportCenter';
import { StrategicAdvisor } from './components/StrategicAdvisor';
import { ReadinessAssessment } from './components/ReadinessAssessment';
import { SAMWizard } from './components/SAMWizard';
import { ImpactPortfolio } from './components/ImpactPortfolio';
import { OnboardingWizard } from './components/OnboardingWizard';
import { Toast } from './components/Toast';


// ═══════════════════════════════════════════════════════════════════
// MODULE: WIN/LOSS ANALYSIS
// ═══════════════════════════════════════════════════════════════════
// Moved to src/components/WinLossAnalysis.jsx







// ═══════════════════════════════════════════════════════════════════
// MODULE: COMPLIANCE TRACKER
// ═══════════════════════════════════════════════════════════════════


// ═══════════════════════════════════════════════════════════════════
// All remaining modules extracted to src/components/:
// SectionLibrary, ReportGenerator, FunderResearch, PortfolioOptimizer,
// BudgetBuilder, MatchAlerts, NarrativeScorer, LetterGenerator,
// FundingForecast, ActivityLog, DeadlineWatchdog, CollaborationHub,
// DocumentAssembler, OutcomeTracker, ExportCenter, StrategicAdvisor,
// ReadinessAssessment, SAMWizard, ImpactPortfolio, OnboardingWizard, Toast

// ═══════════════════════════════════════════════════════════════════
// MAIN APPLICATION
// ═══════════════════════════════════════════════════════════════════
export default function App() {
  const [page, setPage] = useState("dashboard");
  const [grants, setGrants] = useState(() => LS.get("grants", []));
  const [vaultDocs, setVaultDocs] = useState(() => LS.get("vault_docs", []));
  const [contacts, setContacts] = useState(() => LS.get("contacts", []));
  const [events, setEvents] = useState(() => LS.get("events", []));
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [collapsedGroups, setCollapsedGroups] = useState(() => LS.get("sidebar_collapsed", {}));
  const [toast, setToast] = useState(null);
  const [onboardingComplete, setOnboardingComplete] = useState(() => LS.get("onboarding_complete", false));
  const [user, setUser] = useState(null);
  const [syncStatus, setSyncStatus] = useState("local"); // local, syncing, synced, error

  // Initialize Auth & Cloud
  useEffect(() => {
    auth.init((u) => {
      setUser(u);
      if (u) {
        cloud.pull().then((data) => {
          if (data) {
            // If cloud has data, update state
            if (data.grants) setGrants(data.grants);
            if (data.docs) setVaultDocs(data.docs);
            if (data.contacts) setContacts(data.contacts);
            if (data.events) setEvents(data.events);
            showToast("Data synced from cloud", "success");
          }
        });
      }
    });
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Debounced Persist (Local + Cloud)
  const debounceRef = useRef({});
  const debouncedPersist = useCallback((key, value) => {
    clearTimeout(debounceRef.current[key]);
    debounceRef.current[key] = setTimeout(() => {
      LS.set(key, value);
      // Attempt cloud sync if logged in
      if (auth.user) {
        setSyncStatus("syncing");
        cloud.push().then(() => setSyncStatus("synced")).catch(() => setSyncStatus("error"));
      }
    }, 1000); // 1s delay for cloud
  }, []);
  useEffect(() => { debouncedPersist("grants", grants); }, [grants, debouncedPersist]);
  useEffect(() => { debouncedPersist("vault_docs", vaultDocs); }, [vaultDocs, debouncedPersist]);
  useEffect(() => { debouncedPersist("contacts", contacts); }, [contacts, debouncedPersist]);
  useEffect(() => { debouncedPersist("events", events); }, [events, debouncedPersist]);

  // D6: Auto-backup every 5 minutes
  useEffect(() => {
    const backupInterval = setInterval(() => {
      try {
        const backup = { grants, vaultDocs, contacts, events, profile: PROFILE, timestamp: new Date().toISOString() };
        LS.set("_backup", backup);
        LS.set("_backup_prev", LS.get("_backup", null)); // Keep one previous backup
      } catch (e) { console.warn("Auto-backup failed:", e); }
    }, 300000); // 5 minutes
    return () => clearInterval(backupInterval);
  }, [grants, vaultDocs, contacts, events]);

  const addGrant = (grant) => {
    // Deduplicate by oppNumber or ID when available, fall back to title
    if (grant.oppNumber && grants.some(g => g.oppNumber === grant.oppNumber)) return;
    if (grant.id && grants.some(g => g.id === grant.id)) return;
    if (!grant.oppNumber && !grant.id && grants.some(g => g.title === grant.title)) return;
    setGrants(prev => [...prev, { ...grant, createdAt: grant.createdAt || new Date().toISOString() }]);
    logActivity("grant_added", grant.title || "New Grant", { icon: "➕", color: T.green });
  };
  const updateGrant = (id, updates) => {
    setGrants(prev => prev.map(g => {
      if (g.id !== id) return g;
      const updated = { ...g, ...updates, updatedAt: new Date().toISOString() };

      // Stage Transition History (B3)
      if (updates.stage && updates.stage !== g.stage) {
        const history = g.stageHistory || [];
        updated.stageHistory = [...history, {
          from: g.stage || "new",
          to: updates.stage,
          date: new Date().toISOString(),
        }];
      }

      // Submission Tracking
      if (updates.stage === "submitted" && g.stage !== "submitted") {
        const date = prompt("📅 Submission Date (YYYY-MM-DD):", new Date().toISOString().split("T")[0]);
        const method = prompt("📤 Submission Method (e.g. Grants.gov, Email):", "Grants.gov");
        if (date) updated.submittedAt = date;
        if (method) updated.submissionMethod = method;
      }
      return updated;
    }));

    if (updates.stage) {
      const g = grants.find(x => x.id === id);
      logActivity("stage_change", `${updates.stage} → ${g?.title || id}`, { icon: STAGE_MAP[updates.stage]?.icon || "📋", color: STAGE_MAP[updates.stage]?.color || T.blue });
    }
    showToast("Grant updated", "success");
  };
  const deleteGrant = (id) => {
    const g = grants.find(x => x.id === id);
    setGrants(prev => prev.filter(x => x.id !== id));
    logActivity("grant_deleted", g?.title || id, { icon: "🗑️", color: T.red });
  };

  // C6: Auto lifecycle stage transitions based on deadlines
  useEffect(() => {
    const now = new Date();
    let transitioned = 0;
    setGrants(prev => prev.map(g => {
      if (!g.deadline) return g;
      const deadline = new Date(g.deadline);
      const daysLeft = Math.ceil((deadline - now) / 86400000);
      // Auto-advance: research → drafting when < 30 days out
      if (g.stage === "research" && daysLeft <= 30 && daysLeft > 0) {
        transitioned++;
        return { ...g, stage: "drafting", stageHistory: [...(g.stageHistory || []), { from: "research", to: "drafting", date: now.toISOString(), auto: true }] };
      }
      // Auto-flag: past deadline in drafting → mark as overdue
      if (g.stage === "drafting" && daysLeft < 0) {
        transitioned++;
        return { ...g, overdue: true };
      }
      return g;
    }));
    if (transitioned > 0) showToast(`Auto-updated ${transitioned} grant(s) based on deadlines`, "info");
  }, []); // Run once on mount

  // C9: Global keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.isContentEditable) return;
      const ctrlOrMeta = e.ctrlKey || e.metaKey;
      if (ctrlOrMeta && e.key === "1") { e.preventDefault(); setPage("dashboard"); }
      else if (ctrlOrMeta && e.key === "2") { e.preventDefault(); setPage("discovery"); }
      else if (ctrlOrMeta && e.key === "3") { e.preventDefault(); setPage("pipeline"); }
      else if (ctrlOrMeta && e.key === "4") { e.preventDefault(); setPage("calendar"); }
      else if (ctrlOrMeta && e.key === "5") { e.preventDefault(); setPage("tasks"); }
      else if (ctrlOrMeta && e.key === "b") { e.preventDefault(); setSidebarOpen(prev => !prev); }
      else if (e.key === "Escape") { setPage("dashboard"); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const NAV = [
    { id: "dashboard", icon: "📈", label: "Dashboard", group: "core" },
    { id: "discovery", icon: "🔍", label: "Discovery", group: "core" },
    { id: "pipeline", icon: "📋", label: "Pipeline", group: "core" },
    { id: "calendar", icon: "📅", label: "Calendar", group: "core" },
    { id: "watchdog", icon: "⏰", label: "Deadline Watchdog", group: "core" },
    { id: "intel_feed", icon: "🧠", label: "Intelligence Feed", group: "core" },
    { id: "rfp_parser", icon: "📄", label: "RFP Parser", group: "analysis" },
    { id: "match_scorer", icon: "🎯", label: "Match Scorer", group: "analysis" },
    { id: "match_alerts", icon: "🔔", label: "Match Alerts", group: "analysis" },
    { id: "readiness", icon: "✅", label: "Readiness Check", group: "analysis" },
    { id: "ai_drafter", icon: "✍️", label: "AI Drafter", group: "writing" },
    { id: "narrative_scorer", icon: "📊", label: "Narrative Scorer", group: "writing" },
    { id: "section_library", icon: "📚", label: "Section Library", group: "writing" },
    { id: "letter_gen", icon: "✉️", label: "Letter Generator", group: "writing" },
    { id: "census", icon: "📊", label: "Census Narratives", group: "writing" },
    { id: "assembler", icon: "📦", label: "Doc Assembler", group: "writing" },
    { id: "budget", icon: "💵", label: "Budget Builder", group: "docs" },
    { id: "vault", icon: "🗄️", label: "Document Vault", group: "docs" },
    { id: "templates", icon: "📋", label: "Grant Templates", group: "docs" },
    { id: "compliance", icon: "✅", label: "Compliance", group: "management" },
    { id: "tasks", icon: "📑", label: "Action Plan", group: "management" },
    { id: "awards", icon: "🏆", label: "Award Mgmt", group: "management" },
    { id: "outcomes", icon: "📈", label: "Outcome Tracker", group: "management" },
    { id: "collab", icon: "💬", label: "Collaboration", group: "management" },
    { id: "sam_wizard", icon: "🧙", label: "SAM Wizard", group: "management" },
    { id: "projector", icon: "💰", label: "Financial Projector", group: "intelligence" },
    { id: "forecast", icon: "📈", label: "Funding Forecast", group: "intelligence" },
    { id: "advisor", icon: "🧠", label: "AI Advisor", group: "intelligence" },
    { id: "network", icon: "🕸️", label: "Relationship Map", group: "intelligence" },
    { id: "peers", icon: "🔍", label: "Peer Prospecting", group: "intelligence" },
    { id: "funder_research", icon: "🔍", label: "Funder Research", group: "intelligence" },
    { id: "optimizer", icon: "⚡", label: "Portfolio Optimizer", group: "intelligence" },
    { id: "winloss", icon: "📉", label: "Win/Loss Analysis", group: "intelligence" },
    { id: "impact", icon: "📈", label: "Impact Portfolio", group: "intelligence" },
    { id: "reports", icon: "📜", label: "Report Generator", group: "output" },
    { id: "export", icon: "📤", label: "Export Center", group: "output" },
    { id: "activity", icon: "📜", label: "Activity Log", group: "output" },
    { id: "settings", icon: "⚙️", label: "Settings", group: "system" },
  ];

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <Dashboard grants={grants} docs={vaultDocs} contacts={contacts} vaultDocs={vaultDocs} events={events} navigate={setPage} />;
      case "discovery": return <Discovery onAdd={addGrant} grants={grants} />;
      case "pipeline": return <Pipeline grants={grants} updateGrant={updateGrant} deleteGrant={deleteGrant} />;
      case "calendar": return <TimelineCalendar grants={grants} events={events} setEvents={setEvents} />;
      case "watchdog": return <DeadlineWatchdog grants={grants} events={events} />;
      case "intel_feed": return <IntelligenceFeed grants={grants} vaultDocs={vaultDocs} contacts={contacts} events={events} navigate={setPage} />;
      case "rfp_parser": return <RFPParser grants={grants} onUpdate={updateGrant} />;
      case "match_scorer": return <MatchScorer grants={grants} />;
      case "match_alerts": return <MatchAlerts grants={grants} addGrant={addGrant} />;
      case "readiness": return <ReadinessAssessment grants={grants} vaultDocs={vaultDocs} contacts={contacts} />;
      case "ai_drafter": return <AIDrafter grants={grants} vaultDocs={vaultDocs} />;
      case "narrative_scorer": return <NarrativeScorer grants={grants} />;
      case "section_library": return <SectionLibrary vaultDocs={vaultDocs} setVaultDocs={setVaultDocs} />;
      case "letter_gen": return <LetterGenerator grants={grants} contacts={contacts} />;
      case "census": return <CensusNarrative />;
      case "assembler": return <DocumentAssembler grants={grants} vaultDocs={vaultDocs} setVaultDocs={setVaultDocs} />;
      case "budget": return <BudgetBuilder grants={grants} updateGrant={updateGrant} />;
      case "vault": return <DocumentVault vaultDocs={vaultDocs} setVaultDocs={setVaultDocs} grants={grants} />;
      case "templates": return <GrantTemplates grants={grants} addGrant={addGrant} />;
      case "compliance": return <ComplianceTracker grants={grants} updateGrant={updateGrant} />;
      case "tasks": return <ActionPlan grants={grants} />;
      case "awards": return <AwardManagement grants={grants} updateGrant={updateGrant} />;
      case "outcomes": return <OutcomeTracker grants={grants} updateGrant={updateGrant} />;
      case "collab": return <CollaborationHub grants={grants} />;
      case "sam_wizard": return <SAMWizard />;
      case "projector": return <FinancialProjector grants={grants} />;
      case "forecast": return <FundingForecast grants={grants} />;
      case "advisor": return <StrategicAdvisor grants={grants} vaultDocs={vaultDocs} contacts={contacts} />;
      case "network": return <RelationshipMap grants={grants} contacts={contacts} setContacts={setContacts} />;
      case "peers": return <PeerProspecting />;
      case "funder_research": return <FunderResearch />;
      case "optimizer": return <PortfolioOptimizer grants={grants} />;
      case "winloss": return <WinLossAnalysis grants={grants} />;
      case "impact": return <ImpactPortfolio grants={grants} />;
      case "reports": return <ReportGenerator grants={grants} vaultDocs={vaultDocs} contacts={contacts} />;
      case "export": return <ExportCenter grants={grants} vaultDocs={vaultDocs} contacts={contacts} events={events} />;
      case "activity": return <ActivityLog grants={grants} />;
      case "settings": return <Settings showToast={showToast} />;
      default: return <Dashboard grants={grants} docs={vaultDocs} contacts={contacts} vaultDocs={vaultDocs} events={events} navigate={setPage} />;
    }
  };

  const currentNav = NAV.find(n => n.id === page);

  return (
    <div style={{ display:"flex", height:"100vh", background:T.bg, color:T.text, fontFamily:"'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? 220 : 56, background:T.panel, borderRight:`1px solid ${T.border}`,
        display:"flex", flexDirection:"column", transition:"width 0.3s", overflow:"hidden", flexShrink:0,
      }}>
        <div style={{ padding:"16px 12px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:8 }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background:"none", border:"none", color:T.amber, cursor:"pointer", fontSize:20 }}>
            {sidebarOpen ? "◀" : "▶"}
          </button>
          {sidebarOpen && <div style={{ fontSize:14, fontWeight:700, color:T.amber, letterSpacing:1 }}>UNLESS</div>}
        </div>
        <div style={{ flex:1, padding:"8px 4px", overflow:"auto" }}>
          {["core","analysis","writing","docs","management","intelligence","output","system"].map(group => {
            const items = NAV.filter(n => n.group === group);
            if (items.length === 0) return null;
            const groupLabels = { core:"", analysis:"ANALYSIS", writing:"WRITING", docs:"DOCUMENTS", management:"MANAGEMENT", intelligence:"INTELLIGENCE", output:"OUTPUT", system:"" };
            const label = groupLabels[group];
            const isCollapsed = collapsedGroups[group];
            const toggleGroup = () => {
              const updated = { ...collapsedGroups, [group]: !isCollapsed };
              setCollapsedGroups(updated);
              LS.set("sidebar_collapsed", updated);
            };
            return (
              <div key={group}>
                {sidebarOpen && label ? (
                  <div onClick={toggleGroup} style={{ padding: "8px 12px 2px", fontSize: 9, fontWeight: 700, color: T.dim, letterSpacing: 1.5, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", userSelect: "none" }}>
                    <span>{label}</span>
                    <span style={{ fontSize: 8, transition: "transform 0.2s", transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)" }}>▼</span>
                  </div>
                ) : null}
                {!sidebarOpen && label && <div style={{ height: 1, background: T.border, margin: "6px 8px" }} />}
                {(!isCollapsed || !sidebarOpen || !label) && items.map(n => (
                  <button key={n.id} onClick={() => setPage(n.id)} style={{
                    width:"100%", padding: sidebarOpen ? "8px 12px" : "8px", border:"none", borderRadius:6, cursor:"pointer",
                    display:"flex", alignItems:"center", gap:8, fontFamily:"inherit", fontSize:11,
                    background: page === n.id ? T.amber+"15" : "transparent",
                    color: page === n.id ? T.amber : T.sub, marginBottom:1, textAlign:"left",
                    justifyContent: sidebarOpen ? "flex-start" : "center",
                  }}>
                    <span style={{ fontSize:14 }}>{n.icon}</span>
                    {sidebarOpen && <span>{n.label}</span>}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
        {sidebarOpen && (
          <div style={{ padding:12, borderTop:`1px solid ${T.border}`, fontSize:10, color:T.dim }}>
            {/* Auth Status */}
            <div style={{ marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              {user ? (
                <>
                  <span title={user.email}>👤 {user.user_metadata?.full_name || user.email.split("@")[0]}</span>
                  <button onClick={() => auth.logout()} style={{ background: "none", border: "none", color: T.red, cursor: "pointer", fontSize: 10 }}>Logout</button>
                </>
              ) : (
                <button onClick={() => auth.login()} style={{ width: "100%", background: T.blue, color: "white", border: "none", padding: "4px", borderRadius: 4, cursor: "pointer" }}>☁️ Login to Sync</button>
              )}
            </div>

            <div>v5.3 · {grants.length} grants · {(vaultDocs || []).length} docs</div>

            {user && (
              <div style={{ marginTop: 4, color: syncStatus === "error" ? T.red : T.green }}>
                {syncStatus === "syncing" ? "🔄 Syncing..." : syncStatus === "synced" ? "☁️ Cloud Saved" : "☁️ Connected"}
              </div>
            )}

            {(() => { const s = getStorageUsage(); return s.warning ? <div style={{ marginTop: 4, color: T.red }}>⚠️ Local Storage: {s.pct}%</div> : <div style={{ marginTop: 4, color: T.mute }}>💾 Local: {s.pct}% used</div>; })()}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ padding:"12px 20px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <h2 style={{ margin:0, fontSize:18, fontWeight:600, color:T.text }}>{currentNav?.icon} {currentNav?.label}</h2>
          </div>
          <div style={{ display:"flex", gap:12, alignItems:"center" }}>
            <div style={{ fontSize: 11, color: T.mute }}>{grants.length} grants · {fmt(grants.filter(g => ["awarded", "active"].includes(g.stage)).reduce((s, g) => s + (g.amount || 0), 0))} awarded</div>
          </div>
        </div>
        <div style={{ flex:1, overflow:"auto", padding:20 }}>
          <ErrorBoundary name={currentNav?.label || page}>
            {renderPage()}
          </ErrorBoundary>
        </div>
      </div>

      {/* Onboarding Wizard */}
      {!onboardingComplete && <OnboardingWizard onComplete={(profile) => {
        saveProfile(profile);
        setOnboardingComplete(true);
        LS.set("onboarding_complete", true);
        if (profile.name) showToast(`Welcome, ${profile.name}!`, "success");
      }} />}

      {/* Floating AI Chat */}
      <AIChatBar grants={grants} vaultDocs={vaultDocs} contacts={contacts} />

      {/* Toast Notifications */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
