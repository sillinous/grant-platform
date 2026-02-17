import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { T, PROFILE, saveProfile, LS, uid, fmt, fmtDate, daysUntil, clamp, pct, getProfileState, STAGES, STAGE_MAP, getStorageUsage, logActivity, t, setLocale, LOCALE, LANGS, CURRENCIES } from "./globals";
import { Icon, Btn, Card, Badge, Input, TextArea, Select, Tab, Progress, Empty, Modal, Stat, MiniBar, ErrorBoundary } from "./ui";
import { API } from "./api";
import { auth } from "./auth";
import { cloud } from "./cloud";
import { OrganizationProvider, useOrganization } from "./context/OrganizationContext";
import { ContextSwitcher } from "./components/ContextSwitcher";
import { OrgProfile } from "./components/OrgProfile";


// ═══════════════════════════════════════════════════════════════════
// GRANT LIFECYCLE PLATFORM v5.2 — UNLESS
// ═══════════════════════════════════════════════════════════════════
// 48 modules · 23+ APIs · 22 cross-module data flows · AI-powered
// NEW: Timeline Calendar, Document Vault, Financial Impact Projector,
//      Grant Relationship Map, Enhanced Intelligence Engine
// ═══════════════════════════════════════════════════════════════════

// Component Imports
import { Dashboard } from "./components/Dashboard";
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
import { ComplianceMatrix } from './components/ComplianceMatrix';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
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
import { SubmissionAssembler } from './components/SubmissionAssembler';
import { ScenarioModeler } from './components/ScenarioModeler';
import { CollaborationHub } from './components/CollaborationHub';
import { GrantSentinel } from './components/GrantSentinel';
import { PreFlightCheck } from './components/PreFlightCheck';
import { DocumentAssembler } from './components/DocumentAssembler';
import { OutcomeTracker } from './components/OutcomeTracker';
import { ExportCenter } from './components/ExportCenter';
import { StrategicAdvisor } from './components/StrategicAdvisor';
import { ReadinessAssessment } from './components/ReadinessAssessment';
import { SAMWizard } from './components/SAMWizard';
import { ImpactPortfolio } from './components/ImpactPortfolio';
import { ImpactPredictor } from './components/ImpactPredictor';
import { WinProbabilityDashboard } from "./components/WinProbabilityDashboard";
import { OnboardingWizard } from './components/OnboardingWizard';
import { Toast } from './components/Toast';
import { ExecutiveSummary } from './components/ExecutiveSummary';
import { LegislativeTracker } from './components/LegislativeTracker';
import { AdvisoryBoard } from './components/AdvisoryBoard';
import { FundingStacker } from './components/FundingStacker';
import { CloseoutWizard } from './components/CloseoutWizard';
import { PolicyModeler } from './components/PolicyModeler';
import { ImpactMapper } from './components/ImpactMapper';
import { ComplianceWizard } from './components/ComplianceWizard';

import { ComplianceWizard } from './components/ComplianceWizard';

const AppContent = () => {
    const { activeContext, isPersonal } = useOrganization();
    
    // Derived state for filtered grants based on context
    // In a real app, we'd filter grants by orgId. For now, we'll simulare it.
    // const contextGrants = isPersonal ? grants.filter(g => !g.orgId) : grants.filter(g => g.orgId === activeContext.id);
    
    // For prototype, we will just share grants but change the sidebar
  const [page, setPage] = useState("dashboard");
  const [grants, setGrants] = useState(() => LS.get("grants", []));
  const [vaultDocs, setVaultDocs] = useState(() => LS.get("vault_docs", []));
  const [contacts, setContacts] = useState(() => LS.get("contacts", []));
  const [events, setEvents] = useState(() => LS.get("events", []));
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [collapsedGroups, setCollapsedGroups] = useState(() => LS.get("sidebar_collapsed", {}));
  const [toast, setToast] = useState(null);
  const [onboardingComplete, setOnboardingComplete] = useState(() => LS.get("onboarding_complete", false));
  const [sections, setSections] = useState(() => LS.get("section_library", []));
  const [savedFunders, setSavedFunders] = useState(() => LS.get("saved_funders", []));
  const [scoreHistory, setScoreHistory] = useState(() => LS.get("score_history", []));
  const [draftSnapshots, setDraftSnapshots] = useState(() => LS.get("draft_snapshots", []));
  const [voicePersona, setVoicePersona] = useState(() => LS.get("org_voice_persona", null));
  const [tasks, setTasks] = useState(() => LS.get("tasks", []));
  const [budgets, setBudgets] = useState(() => LS.get("budgets", {}));
  const [user, setUser] = useState(null);
  const [syncStatus, setSyncStatus] = useState("local");

  useEffect(() => {
    auth.init((u) => {
      setUser(u);
      if (u) {
        cloud.pull().then((data) => {
          if (data) {
            if (data.grants) setGrants(data.grants);
            if (data.docs) setVaultDocs(data.docs);
            if (data.contacts) setContacts(data.contacts);
            if (data.events) setEvents(data.events);
            if (data.library) setSections(data.library);
            if (data.funders) setSavedFunders(data.funders);
            if (data.scores) setScoreHistory(data.scores);
            if (data.snapshots) setDraftSnapshots(data.snapshots);
            if (data.onboarding !== undefined) setOnboardingComplete(data.onboarding);
            if (data.voicePersona) setVoicePersona(data.voicePersona);
            if (data.tasks) setTasks(data.tasks);
            if (data.budgets) setBudgets(data.budgets);
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

  // Autonomous Status Sentinel (detect overdue grants)
  useEffect(() => {
    const overdue = grants.filter(g =>
      g.deadline &&
      daysUntil(g.deadline) < 0 &&
      !["awarded", "active", "closeout", "declined", "archived"].includes(g.stage)
    );
    if (overdue.length > 0) {
      console.log(`Sentinel: Found ${overdue.length} overdue grants.`);
    }
  }, [grants]);

  const debounceRef = useRef({});
  const debouncedPersist = useCallback((key, value) => {
    clearTimeout(debounceRef.current[key]);
    debounceRef.current[key] = setTimeout(() => {
      LS.set(key, value);
      if (auth.user) {
        setSyncStatus("syncing");
        cloud.push().then(() => setSyncStatus("synced")).catch(() => setSyncStatus("error"));
      }
    }, 1000);
  }, []);

  useEffect(() => { debouncedPersist("grants", grants); }, [grants, debouncedPersist]);
  useEffect(() => { debouncedPersist("vault_docs", vaultDocs); }, [vaultDocs, debouncedPersist]);
  useEffect(() => { debouncedPersist("contacts", contacts); }, [contacts, debouncedPersist]);
  useEffect(() => { debouncedPersist("events", events); }, [events, debouncedPersist]);
  useEffect(() => { debouncedPersist("section_library", sections); }, [sections, debouncedPersist]);
  useEffect(() => { debouncedPersist("saved_funders", savedFunders); }, [savedFunders, debouncedPersist]);
  useEffect(() => { debouncedPersist("score_history", scoreHistory); }, [scoreHistory, debouncedPersist]);
  useEffect(() => { debouncedPersist("draft_snapshots", draftSnapshots); }, [draftSnapshots, debouncedPersist]);
  useEffect(() => { debouncedPersist("org_voice_persona", voicePersona); }, [voicePersona, debouncedPersist]);
  useEffect(() => { debouncedPersist("onboarding_complete", onboardingComplete); }, [onboardingComplete, debouncedPersist]);
  useEffect(() => { debouncedPersist("tasks", tasks); }, [tasks, debouncedPersist]);
  useEffect(() => { debouncedPersist("budgets", budgets); }, [budgets, debouncedPersist]);

  useEffect(() => {
    const backupInterval = setInterval(() => {
      try {
        const backup = { grants, vaultDocs, contacts, events, profile: PROFILE, timestamp: new Date().toISOString() };
        LS.set("_backup", backup);
      } catch (e) { console.warn("Auto-backup failed:", e); }
    }, 300000);
    return () => clearInterval(backupInterval);
  }, [grants, vaultDocs, contacts, events]);

  const addGrant = (grant) => {
    if (grant.oppNumber && grants.some(g => g.oppNumber === grant.oppNumber)) return;
    if (grant.id && grants.some(g => g.id === grant.id)) return;
    const newGrant = { ...grant, createdAt: new Date().toISOString() };
    setGrants(prev => [...prev, newGrant]);

    // Auto-generate standard pursuit tasks
    const defaultTasks = [
      { id: uid(), grantId: newGrant.id, title: "🔍 RFP Deep Dive", status: "todo", notes: "Initial review of requirements and eligibility.", priority: "high" },
      { id: uid(), grantId: newGrant.id, title: "📋 Compliance Matrix", status: "todo", notes: "Draft the internal compliance and requirements matrix.", priority: "medium" },
      { id: uid(), grantId: newGrant.id, title: "✍️ Narrative Skeleton", status: "todo", notes: "Build the initial draft framework based on the RFP.", priority: "high" },
      { id: uid(), grantId: newGrant.id, title: "💰 Budget Alignment", status: "todo", notes: "Cross-check budget placeholders against award limits.", priority: "medium" }
    ];
    setTasks(prev => [...prev, ...defaultTasks]);

    // Initialize budget with award ceiling as guideline
    if (newGrant.amount > 0) {
      setBudgets(prev => ({
        ...prev,
        [newGrant.id]: {
          items: [
            { id: uid(), category: "personnel", description: "Program Director / Lead", amount: Math.round(newGrant.amount * 0.4), quantity: 1, justification: "Estimated leadership for program implementation." },
            { id: uid(), category: "other", description: "Operational Reserve", amount: Math.round(newGrant.amount * 0.6), quantity: 1, justification: "Balance of award ceiling for program activities." }
          ],
          updatedAt: new Date().toISOString()
        }
      }));
    }

    logActivity("grant_added", grant.title || "New Grant", { icon: "📈", color: T.green });
    showToast(`Lead injected: ${defaultTasks.length} tasks generated`, "success");
  };

  const updateGrant = (id, updates) => {
    setGrants(prev => prev.map(g => {
      if (g.id !== id) return g;
      const updated = { ...g, ...updates, updatedAt: new Date().toISOString() };
      if (updates.stage && updates.stage !== g.stage) {
        updated.stageHistory = [...(g.stageHistory || []), { from: g.stage || "new", to: updates.stage, date: new Date().toISOString() }];
      }
      return updated;
    }));
    showToast("Grant updated", "success");
  };

  const deleteGrant = (id) => {
    setGrants(prev => prev.filter(x => x.id !== id));
    showToast("Grant deleted", "info");
  };

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      const ctrlOrMeta = e.ctrlKey || e.metaKey;
      if (ctrlOrMeta && e.key === "1") { e.preventDefault(); setPage("dashboard"); }
      if (ctrlOrMeta && e.key === "2") { e.preventDefault(); setPage("discovery"); }
      if (ctrlOrMeta && e.key === "3") { e.preventDefault(); setPage("pipeline"); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const NAV = [
    { id: "dashboard", icon: "📈", label: t("dashboard"), group: "core" },
    { id: "exec_dash", icon: "💎", label: "Executive View", group: "core" },
    { id: "discovery", icon: "🔍", label: t("discovery"), group: "core" },
    { id: "pipeline", icon: "📋", label: t("pipeline"), group: "core" },
    { id: "calendar", icon: "📅", label: "Calendar", group: "core" },
    { id: "rfp_parser", icon: "📄", label: "RFP Parser", group: "analysis" },
    { id: "match_scorer", icon: "🎯", label: "Match Scorer", group: "analysis" },
    { id: "preflight", icon: "⚔️", label: "Pre-Flight Audit", group: "analysis" },
    { id: "ai_drafter", icon: "✍️", label: "AI Drafter", group: "writing" },
    { id: "narrative_scorer", icon: "📊", label: "Narrative Scorer", group: "writing" },
    { id: "section_library", icon: "📚", label: "Section Library", group: "writing" },
    { id: "budget", icon: "💵", label: t("budget"), group: "docs" },
    { id: "vault", icon: "🗄️", label: t("vault"), group: "docs" },
    { id: "compliance_tracker", icon: "✅", label: "Compliance Tracker", group: "management" },
    { id: "tasks", icon: "📑", label: "Action Plan", group: "management" },
    { id: "awards", icon: "🏆", label: "Award Mgmt", group: "management" },
    { id: "closeout", icon: "📑", label: "Closeout Engine", group: "management" },
    { id: "action_plan", icon: "📋", label: t("plan"), group: "execution" },
    { id: "submission_assembler", icon: "📦", label: "Packager", group: "docs" },
    { id: "outcomes", icon: "📈", label: "Outcome Tracker", group: "management" },
    { id: "projector", icon: "💰", label: "Financial Projector", group: "intelligence" },
    { id: "forecast", icon: "📈", label: "Funding Forecast", group: "intelligence" },
    { id: "advisor", icon: "🧠", label: "AI Advisor", group: "intelligence" },
    { id: "sentinel", icon: "📡", label: "Grant Sentinel", group: "intelligence" },
    { id: "network", icon: "🕸️", label: "Relationship Map", group: "intelligence" },
    { id: "funder_research", icon: "🔍", label: "Funder Research", group: "intelligence" },
    { id: "optimizer", icon: "⚡", label: "Portfolio Optimizer", group: "intelligence" },
    { id: "portfolio_optimizer", icon: "📊", label: "Optimizer", group: "intelligence" },
    { id: "executive_summary", icon: "📄", label: "Board Report", group: "intelligence" },
    { id: "winloss", icon: "📉", label: "Win/Loss Analysis", group: "intelligence" },
    { id: "impact", icon: "📈", label: "Impact Portfolio", group: "intelligence" },
    { id: "impact_predict", icon: "🔮", label: "Impact Predictor", group: "intelligence" },
    { id: "win_prob", icon: "🎲", label: "Win Probability", group: "intelligence" },
    { id: "scenario_modeler", icon: "🎲", label: "Scenario Modeler", group: "intelligence" },
    { id: "advisory", icon: "🤝", label: "War Room", group: "intelligence" },
    { id: "funding_stacker", icon: "📊", label: "Funding Stacker", group: "intelligence" },
    { id: "impact_mapper", icon: "🗺️", label: "Impact Mapper", group: "hyper_local" },
    { id: "compliance_wizard", icon: "🧙", label: "Compliance Wizard", group: "hyper_local" },
    { id: "policy_modeler", icon: "🏛️", label: "Policy Modeler", group: "intelligence" },
    { id: "settings", icon: "⚙️", label: t("settings"), group: "system" },
  ];

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <Dashboard grants={grants} docs={vaultDocs} contacts={contacts} vaultDocs={vaultDocs} events={events} navigate={setPage} />;
      case "exec_dash": return <ExecutiveDashboard grants={grants} />;
      case "discovery": return <Discovery onAdd={addGrant} grants={grants} setGrants={setGrants} />;
      case "pipeline": return <Pipeline grants={grants} updateGrant={updateGrant} deleteGrant={deleteGrant} />;
      case "calendar": return <TimelineCalendar grants={grants} events={events} setEvents={setEvents} />;
      case "rfp_parser": return <RFPParser grants={grants} onUpdate={updateGrant} tasks={tasks} setTasks={setTasks} />;
      case "match_scorer": return <MatchScorer grants={grants} />;
      case "preflight": return <PreFlightCheck grants={grants} vaultDocs={vaultDocs} />;
      case "ai_drafter": return <AIDrafter grants={grants} vaultDocs={vaultDocs} snapshots={draftSnapshots} setSnapshots={setDraftSnapshots} voicePersona={voicePersona} setVoicePersona={setVoicePersona} sections={sections} setSections={setSections} />;
      case "narrative_scorer": return <NarrativeScorer grants={grants} history={scoreHistory} setHistory={setScoreHistory} />;
      case "submission_assembler": return <SubmissionAssembler grants={grants} vaultDocs={vaultDocs} sections={sections} />;
      case "scenario_modeler": return <ScenarioModeler grants={grants} />;
      case "section_library": return <SectionLibrary vaultDocs={vaultDocs} setVaultDocs={setVaultDocs} grants={grants} sections={sections} setSections={setSections} />;
      case "budget": return <BudgetBuilder grants={grants} updateGrant={updateGrant} budgets={budgets} setBudgets={setBudgets} />;
      case "vault": return <DocumentVault vaultDocs={vaultDocs} setVaultDocs={setVaultDocs} grants={grants} />;
      case "compliance_tracker": return <ComplianceTracker grants={grants} updateGrant={updateGrant} />;
      case "tasks": return <ActionPlan grants={grants} tasks={tasks} setTasks={setTasks} />;
      case "action_plan": return <ActionPlan grants={grants} tasks={tasks} setTasks={setTasks} />;
      case "awards": return <AwardManagement grants={grants} updateGrant={updateGrant} sections={sections} setSections={setSections} />;
      case "outcomes": return <OutcomeTracker grants={grants} updateGrant={updateGrant} />;
      case "closeout": return <CloseoutWizard grants={grants} updateGrant={updateGrant} />;
      case "projector": return <FinancialProjector grants={grants} />;
      case "forecast": return <LegislativeTracker />;
      case "sentinel": return <GrantSentinel onAdd={addGrant} grants={grants} />;
      case "advisor": return <StrategicAdvisor grants={grants} vaultDocs={vaultDocs} contacts={contacts} />;
      case "network": return <RelationshipMap grants={grants} contacts={contacts} setContacts={setContacts} />;
      case "funder_research": return <FunderResearch savedFunders={savedFunders} setSavedFunders={setSavedFunders} vaultDocs={vaultDocs} grants={grants} setGrants={setGrants} />;
      case "optimizer": return <PortfolioOptimizer grants={grants} />;
      case "portfolio_optimizer": return <PortfolioOptimizer grants={grants} />;
      case "executive_summary": return <ExecutiveSummary grants={grants} tasks={tasks} budgets={budgets} />;
      case "win_prob": return <WinProbabilityDashboard grant={grants.find(g => ["drafting", "reviewing", "submitting"].includes(g.stage)) || grants[0]} vaultDocs={vaultDocs} />;
      case "winloss": return <WinLossAnalysis grants={grants} />;
      case "impact": return <ImpactPortfolio grants={grants} />;
      case "impact_predict": return <ImpactPredictor grants={grants} vaultDocs={vaultDocs} />;
      case "advisory": return <AdvisoryBoard grants={grants} />;
      case "funding_stacker": return <FundingStacker grants={grants} />;
      case "policy_modeler": return <PolicyModeler grants={grants} />;
      case "impact_mapper": return <ImpactMapper grants={grants} />;
      case "compliance_wizard": return <ComplianceWizard grants={grants} />;
      case "settings": return <Settings showToast={showToast} />;
      case "settings": return <Settings showToast={showToast} />;
      // Org Specific
      case "org_profile": return <OrgProfile />;
      default: return <Dashboard grants={grants} docs={vaultDocs} contacts={contacts} vaultDocs={vaultDocs} events={events} navigate={setPage} />;
    }
  };

  const getNavItems = () => {
      if (isPersonal) return NAV;
      
      // Filter NAV for Organizations
      const orgAllowed = ["dashboard", "exec_dash", "calendar", "budget", "vault", "compliance_tracker", "tasks", "awards", "closeout", "outcomes", "network", "impact_mapper", "compliance_wizard", "org_profile"];
      
      // Add Org specific items
      const ORG_NAV = [
          { id: "org_profile", icon: "🏢", label: "Organization Profile", group: "system" },
          ...NAV.filter(n => orgAllowed.includes(n.id))
      ];
      return ORG_NAV;
  };

  const currentNavItems = getNavItems();
  const currentNav = currentNavItems.find(n => n.id === page) || NAV[0];

  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [currencyMenuOpen, setCurrencyMenuOpen] = useState(false);

  // Close menus when clicking outside
  useEffect(() => {
    const closeMenus = () => { setLangMenuOpen(false); setCurrencyMenuOpen(false); };
    if (langMenuOpen || currencyMenuOpen) window.addEventListener("click", closeMenus);
    return () => window.removeEventListener("click", closeMenus);
  }, [langMenuOpen, currencyMenuOpen]);

  return (
    <div style={{ display: "flex", height: "100vh", background: T.bg, color: T.text, fontFamily: "'Inter', sans-serif" }}>
      <div style={{ width: sidebarOpen ? 240 : 66, background: T.panel, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", transition: "width 0.3s", overflow: "hidden", flexShrink: 0 }}>
        
        {/* Context Switcher / Brand Header */}
        <div style={{ padding: "16px 12px", borderBottom: `1px solid ${T.border}` }}>
             {sidebarOpen ? (
                 <ContextSwitcher />
             ) : (
                 <div onClick={() => setSidebarOpen(true)} style={{ cursor: "pointer", textAlign: "center", fontSize: 24 }}>
                     {isPersonal ? "👤" : "🏢"}
                 </div>
             )}
        </div>

        {/* Sidebar Navigation */}
        <div style={{ flex:1, padding:"8px 4px", overflow:"auto" }}>
          {["core", "hyper_local", "analysis", "writing", "docs", "management", "intelligence", "system"].map(group => {
            const items = currentNavItems.filter(n => n.group === group);
            if (items.length === 0) return null;
            const label = group === "core" ? "" : group.toUpperCase();
            const isCollapsed = collapsedGroups[group];
            return (
              <div key={group}>
                {sidebarOpen && label && (
                  <div onClick={() => setCollapsedGroups({ ...collapsedGroups, [group]: !isCollapsed })} style={{ padding: "8px 12px 2px", fontSize: 9, fontWeight: 700, color: T.dim, letterSpacing: 1.5, cursor: "pointer", display: "flex", justifyContent: "space-between" }}>
                    <span>{label}</span>
                    <span>{isCollapsed ? "▶" : "▼"}</span>
                  </div>
                )}
                {(!isCollapsed || !sidebarOpen) && items.map(n => (
                  <button key={n.id} onClick={() => setPage(n.id)} style={{ width: "100%", padding: sidebarOpen ? "8px 12px" : "8px", border: "none", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, background: page === n.id ? T.amber + "15" : "transparent", color: page === n.id ? T.amber : T.sub, marginBottom: 1, textAlign: "left" }}>
                    <span style={{ fontSize:14 }}>{n.icon}</span>
                    {sidebarOpen && <span>{n.label}</span>}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
        
        {/* User Profile Footer */}
        {sidebarOpen && (
          <div style={{ padding: 12, borderTop: `1px solid ${T.border}`, fontSize: 10, color: T.dim }}>
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
            <div>v5.3 · {grants.length} grants</div>
            {user && (
              <div style={{ marginTop: 4, color: syncStatus === "error" ? T.red : T.green }}>
                {syncStatus === "syncing" ? "🔄 Syncing..." : syncStatus === "synced" ? "☁️ Cloud Saved" : "☁️ Connected"}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ padding: "12px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "none", border: "none", color: T.sub, cursor: "pointer", fontSize: 18 }}>{sidebarOpen ? "◀" : "▶"}</button>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: T.text }}>{currentNav?.icon} {currentNav?.label}</h2>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                 {/* Language Switcher */}
                <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                    <button 
                        onClick={() => { setLangMenuOpen(!langMenuOpen); setCurrencyMenuOpen(false); }}
                        style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", padding: 4, borderRadius: "50%", background: langMenuOpen ? T.dim : "transparent" }}
                        title="Change Language"
                    >
                        🌐
                    </button>
                    {langMenuOpen && (
                        <div style={{ 
                            position: "absolute", top: "120%", right: 0, width: 200, 
                            background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8, 
                            boxShadow: "0 4px 12px rgba(0,0,0,0.3)", zIndex: 100, overflow: "hidden"
                        }}>
                             <div style={{ padding: "8px 12px", fontSize: 11, fontWeight: 700, color: T.sub, background: T.dim }}>SELECT LANGUAGE</div>
                            {Object.entries(LANGS).map(([code, l]) => (
                                <div 
                                    key={code}
                                    onClick={() => { setLocale(code, LOCALE.currency); window.location.reload(); }}
                                    style={{ 
                                        padding: "8px 12px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
                                        background: LOCALE.lang === code ? `${T.blue}22` : "transparent",
                                        color: LOCALE.lang === code ? T.blue : T.text
                                    }}
                                >
                                    <span>{l.flag}</span>
                                    <span style={{ fontSize: 13 }}>{l.label}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Currency Switcher */}
                <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                    <button 
                        onClick={() => { setCurrencyMenuOpen(!currencyMenuOpen); setLangMenuOpen(false); }}
                        style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", padding: 4, borderRadius: "50%", background: currencyMenuOpen ? T.dim : "transparent" }}
                        title="Change Currency"
                    >
                        💲
                    </button>
                    {currencyMenuOpen && (
                        <div style={{ 
                            position: "absolute", top: "120%", right: 0, width: 220, 
                            background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8, 
                            boxShadow: "0 4px 12px rgba(0,0,0,0.3)", zIndex: 100, overflow: "hidden"
                        }}>
                             <div style={{ padding: "8px 12px", fontSize: 11, fontWeight: 700, color: T.sub, background: T.dim }}>SELECT CURRENCY</div>
                            {Object.entries(CURRENCIES).map(([code, c]) => (
                                <div 
                                    key={code}
                                    onClick={() => { setLocale(LOCALE.lang, code); window.location.reload(); }} // Corrected to just change currency
                                    style={{ 
                                        padding: "8px 12px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
                                        background: LOCALE.currency === code ? `${T.amber}22` : "transparent",
                                        color: LOCALE.currency === code ? T.amber : T.text
                                    }}
                                >
                                    <span style={{ fontWeight: 700, width: 24 }}>{code}</span>
                                    <span style={{ fontSize: 13 }}>{c.label}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ width: 1, height: 24, background: T.border, margin: "0 4px" }} />
                
                <div style={{ textAlign: "right", fontSize: 11, color: T.mute }}>
                    <div style={{ fontWeight: 600, color: T.text }}>{activeContext.name || "Personal"} View</div>
                    <div>{grants.length} grants</div>
                </div>
            </div>
        </div>
        <div style={{ flex:1, overflow:"auto", padding:20 }}>
          <ErrorBoundary name={currentNav?.label || page}>
            {renderPage()}
          </ErrorBoundary>
        </div>
      </div>

      {!onboardingComplete && <OnboardingWizard onComplete={(profile) => { saveProfile(profile); setOnboardingComplete(true); LS.set("onboarding_complete", true); }} />}
      <AIChatBar grants={grants} vaultDocs={vaultDocs} contacts={contacts} />
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default function App() {
    return (
        <OrganizationProvider>
            <AppContent />
        </OrganizationProvider>
    );
}
