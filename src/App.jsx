import { useState, useEffect, useCallback, useMemo, useRef } from "react";

// ════════════════════════════════════════════════════════════════════════
// GRANT LIFECYCLE PLATFORM v3.0 — UNLESS
// ════════════════════════════════════════════════════════════════════════
// 48 modules · 23+ APIs · 22 cross-module data flows · AI-powered
// NEW: Timeline Calendar, Document Vault, Financial Impact Projector,
//      Grant Relationship Map, Enhanced Intelligence Engine
// ════════════════════════════════════════════════════════════════════════

// ─── THEME ─────────────────────────────────────────────────────────────
const T = {
  bg:"#060910", panel:"#0b1018", card:"#0e1420", border:"#182030",
  borderHi:"#283548", text:"#ddd5c8", sub:"#9aa0ae", mute:"#5a6880",
  dim:"#354058", amber:"#c49355", amberDim:"#8b6b3d", green:"#3dba7a",
  red:"#e05555", blue:"#5b9cf5", purple:"#9b7ef5", yellow:"#e0b84a",
  orange:"#e08c3a", cyan:"#4ab8c2", amberGlow:"rgba(196,147,85,0.08)",
  glass:"rgba(11,16,24,0.85)", gradient:"linear-gradient(135deg,#c49355,#e0b84a)",
};

// ─── PROFILE ───────────────────────────────────────────────────────────
const PROFILE = {
  name: "Travis", loc: "Newton, Illinois", rural: true, disabled: true,
  poverty: true, selfEmployed: true,
  tags: ["disabled","below-poverty","rural-il","tech-entrepreneur","economically-disadvantaged",
    "il-resident","self-employed","ai-technology","multiple-ventures"],
  businesses: [
    { n:"AEGIS", d:"Autonomous business framework — DAO governance + AI agent economies", st:"active", sec:"AI/Automation", monthly:0 },
    { n:"ToyVault", d:"Business OS for toy collecting — auctions, live sales, membership", st:"active", sec:"E-commerce", monthly:0 },
    { n:"Synthetic Records", d:"AI music label using SUNO + RESONANCE viral marketing", st:"active", sec:"Music/Entertainment", monthly:0 },
    { n:"IdeaForge", d:"AI-powered ideation pipeline — concept to business plan", st:"active", sec:"AI/SaaS", monthly:0 },
    { n:"RESONANCE", d:"Viral marketing engine for automated content distribution", st:"active", sec:"MarTech", monthly:0 },
    { n:"LaunchFlow", d:"AI-enhanced service marketplace", st:"dev", sec:"SaaS", monthly:0 },
    { n:"Shrimp Farming", d:"Tech-augmented aquaculture venture", st:"research", sec:"AgTech", monthly:0 },
  ],
  narratives: {
    founder: `Travis is an entrepreneur and technologist based in rural Newton, Illinois, building autonomous business systems and AI-powered platforms that create economic opportunity in underserved communities.`,
    need: `Operating from a rural community with limited economic infrastructure, Travis faces the compounding challenges of disability, poverty, and geographic isolation that restrict access to capital, mentorship, and market opportunities.`,
    impact: `Each venture is designed to demonstrate that AI-augmented entrepreneurship can thrive anywhere — creating templates for rural economic development that don't require proximity to tech hubs.`,
  },
};

// ─── UTILITIES ─────────────────────────────────────────────────────────
const LS = {
  get: (k, d = null) => { try { const v = localStorage.getItem(`gp_${k}`); return v ? JSON.parse(v) : d; } catch { return d; }},
  set: (k, v) => { try { localStorage.setItem(`gp_${k}`, JSON.stringify(v)); } catch {} },
  del: (k) => { try { localStorage.removeItem(`gp_${k}`); } catch {} },
};

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,8);
const fmt = (n) => new Intl.NumberFormat("en-US", { style:"currency", currency:"USD", maximumFractionDigits:0 }).format(n);
const fmtDate = (d) => new Date(d).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
const daysUntil = (d) => Math.ceil((new Date(d) - new Date()) / 86400000);
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const pct = (v) => `${Math.round(v)}%`;

// ─── LIFECYCLE STAGES ──────────────────────────────────────────────────
const STAGES = [
  { id:"discovered", label:"Discovered", icon:"🔍", color:T.blue },
  { id:"researching", label:"Researching", icon:"📚", color:T.cyan },
  { id:"qualifying", label:"Qualifying", icon:"🎯", color:T.purple },
  { id:"preparing", label:"Preparing", icon:"📋", color:T.yellow },
  { id:"drafting", label:"Drafting", icon:"✍️", color:T.orange },
  { id:"reviewing", label:"Reviewing", icon:"👁️", color:T.amber },
  { id:"submitted", label:"Submitted", icon:"📤", color:T.green },
  { id:"under_review", label:"Under Review", icon:"⏳", color:T.amberDim },
  { id:"awarded", label:"Awarded", icon:"🏆", color:T.green },
  { id:"active", label:"Active", icon:"⚡", color:T.green },
  { id:"closeout", label:"Closeout", icon:"📦", color:T.yellow },
  { id:"declined", label:"Declined", icon:"❌", color:T.red },
];

const STAGE_MAP = Object.fromEntries(STAGES.map(s => [s.id, s]));

// ─── API SERVICES ──────────────────────────────────────────────────────
const API = {
  async searchGrants(query, params = {}) {
    const url = new URL("https://www.grants.gov/api/v2/opportunities/search");
    const body = { keyword: query, oppStatuses: "forecasted|posted", rows: params.rows || 25, ...params };
    try {
      const r = await fetch("https://apply07.grants.gov/grantsws/rest/opportunities/search", {
        method: "POST", headers: { "Content-Type":"application/json" }, body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(`Grants.gov: ${r.status}`);
      return await r.json();
    } catch (e) {
      console.warn("Grants.gov search failed, using fallback:", e);
      return { oppHits: [] };
    }
  },

  async getGrantDetail(oppId) {
    try {
      const r = await fetch(`https://apply07.grants.gov/grantsws/rest/opportunity/details?oppId=${oppId}`);
      return r.ok ? await r.json() : null;
    } catch { return null; }
  },

  async searchFederalSpending(query, params = {}) {
    try {
      const r = await fetch("https://api.usaspending.gov/api/v2/search/spending_by_award/", {
        method: "POST", headers: { "Content-Type":"application/json" },
        body: JSON.stringify({
          filters: { keywords: [query], award_type_codes: ["02","03","04","05"] },
          fields: ["Award ID","Recipient Name","Award Amount","Awarding Agency","Start Date"],
          limit: params.limit || 15, page: 1,
        }),
      });
      return r.ok ? await r.json() : { results: [] };
    } catch { return { results: [] }; }
  },

  async getSpendingByState(state = "IL", fy = 2024) {
    try {
      const r = await fetch("https://api.usaspending.gov/api/v2/search/spending_by_geography/", {
        method: "POST", headers: { "Content-Type":"application/json" },
        body: JSON.stringify({
          scope: "place_of_performance", geo_layer: "state",
          filters: { time_period: [{ start_date:`${fy}-10-01`, end_date:`${fy+1}-09-30` }], award_type_codes:["02","03","04","05"] },
        }),
      });
      return r.ok ? await r.json() : { results: [] };
    } catch { return { results: [] }; }
  },

  async searchRegulations(query) {
    try {
      const r = await fetch(`https://api.regulations.gov/v4/documents?filter[searchTerm]=${encodeURIComponent(query)}&filter[documentType]=Rule&page[size]=10&sort=-postedDate&api_key=DEMO_KEY`);
      return r.ok ? await r.json() : { data: [] };
    } catch { return { data: [] }; }
  },

  async getCensusData(state = "17", fields = "NAME,S1701_C03_001E,S2301_C04_001E") {
    try {
      const r = await fetch(`https://api.census.gov/data/2022/acs/acs5/subject?get=${fields}&for=state:${state}`);
      return r.ok ? await r.json() : [];
    } catch { return []; }
  },

  async searchSAMEntities(query) {
    try {
      const r = await fetch(`https://api.sam.gov/entity-information/v3/entities?api_key=DEMO_KEY&registrationStatus=A&legalBusinessName=${encodeURIComponent(query)}&includeSections=entityRegistration`);
      return r.ok ? await r.json() : { entityData: [] };
    } catch { return { entityData: [] }; }
  },

  async searchUSASpendingRecipients(query) {
    try {
      const r = await fetch("https://api.usaspending.gov/api/v2/autocomplete/recipient/", {
        method: "POST", headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ search_text: query, limit: 10 }),
      });
      return r.ok ? await r.json() : { results: [] };
    } catch { return { results: [] }; }
  },

  async getTopRecipients(state = "IL") {
    try {
      const r = await fetch("https://api.usaspending.gov/api/v2/search/spending_by_award/", {
        method: "POST", headers: { "Content-Type":"application/json" },
        body: JSON.stringify({
          filters: { recipient_locations: [{ country:"USA", state }], award_type_codes:["02","03","04","05"] },
          fields: ["Recipient Name","Award Amount","Awarding Agency"], limit: 8, page: 1, order: "desc", sort: "Award Amount",
        }),
      });
      return r.ok ? await r.json() : { results: [] };
    } catch { return { results: [] }; }
  },

  async callAI(messages, systemPrompt) {
    const apiKey = LS.get("anthropic_key");
    if (!apiKey) return { error: "No API key configured. Add your Anthropic key in Settings." };
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type":"application/json", "x-api-key": apiKey, "anthropic-version":"2023-06-01", "anthropic-dangerous-direct-browser-access":"true" },
        body: JSON.stringify({ model:"claude-sonnet-4-5-20250929", max_tokens:4096, system: systemPrompt || "", messages }),
      });
      if (!r.ok) { const e = await r.json().catch(() => ({})); return { error: e.error?.message || `API ${r.status}` }; }
      const d = await r.json();
      return { text: d.content?.map(c => c.text).join("") || "" };
    } catch (e) { return { error: e.message }; }
  },
};

// ─── AI CONTEXT BUILDER ────────────────────────────────────────────────
function buildPortfolioContext(grants, docs, contacts) {
  const active = (grants || []).filter(g => !["declined","closeout"].includes(g.stage));
  const awarded = (grants || []).filter(g => ["awarded","active"].includes(g.stage));
  const totalSought = active.reduce((s, g) => s + (g.amount || 0), 0);
  const totalAwarded = awarded.reduce((s, g) => s + (g.amount || 0), 0);
  return `PORTFOLIO CONTEXT:
- Active grants: ${active.length} seeking ${fmt(totalSought)}
- Awarded: ${awarded.length} totaling ${fmt(totalAwarded)}
- Pipeline stages: ${STAGES.map(s => `${s.label}: ${(grants||[]).filter(g=>g.stage===s.id).length}`).filter(x=>!x.endsWith(": 0")).join(", ")}
- Documents: ${(docs||[]).length} on file
- Contacts: ${(contacts||[]).length} in CRM
- Profile: ${PROFILE.name}, ${PROFILE.loc} (rural: ${PROFILE.rural}, disabled: ${PROFILE.disabled})
- Businesses: ${PROFILE.businesses.map(b=>`${b.n} (${b.sec})`).join(", ")}
- Top upcoming deadlines: ${active.filter(g=>g.deadline).sort((a,b)=>new Date(a.deadline)-new Date(b.deadline)).slice(0,5).map(g=>`${g.title}: ${fmtDate(g.deadline)} (${daysUntil(g.deadline)}d)`).join("; ")}
${PROFILE.narratives.founder}`;
}

// ─── ICON COMPONENTS ───────────────────────────────────────────────────
const Icon = ({ name, size = 16, color = T.sub }) => {
  const icons = {
    search: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
    plus: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>,
    check: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M20 6 9 17l-5-5"/></svg>,
    x: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>,
    chevRight: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>,
    chevDown: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>,
    calendar: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
    folder: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
    dollar: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    network: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><circle cx="12" cy="5" r="3"/><circle cx="5" cy="19" r="3"/><circle cx="19" cy="19" r="3"/><path d="M12 8v4M8.5 17 11 14M15.5 17 13 14"/></svg>,
    ai: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4zM6 12h12M8 20h8M12 12v8"/></svg>,
    chart: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>,
    file: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>,
    settings: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>,
    alert: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>,
    trophy: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>,
    download: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>,
    refresh: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
    copy: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
    trash: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
    edit: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  };
  return icons[name] || null;
};

// ─── SHARED UI COMPONENTS ──────────────────────────────────────────────
const Btn = ({ children, onClick, variant = "default", size = "md", icon, disabled, style }) => {
  const base = { border:"none", borderRadius:6, cursor: disabled ? "not-allowed" : "pointer", display:"inline-flex", alignItems:"center", gap:6, fontFamily:"inherit", transition:"all 0.2s", opacity: disabled ? 0.5 : 1 };
  const variants = {
    default: { ...base, background:T.card, color:T.text, border:`1px solid ${T.border}` },
    primary: { ...base, background:T.amber, color:"#0a0e14", fontWeight:600 },
    ghost: { ...base, background:"transparent", color:T.sub },
    danger: { ...base, background:"transparent", color:T.red, border:`1px solid ${T.red}33` },
    success: { ...base, background:T.green+"22", color:T.green, border:`1px solid ${T.green}33` },
  };
  const sizes = { sm: { padding:"4px 10px", fontSize:12 }, md: { padding:"8px 16px", fontSize:13 }, lg: { padding:"10px 20px", fontSize:14 } };
  return <button onClick={disabled ? undefined : onClick} style={{ ...variants[variant], ...sizes[size], ...style }}>{icon}{children}</button>;
};

const Card = ({ children, style, onClick, glow }) => (
  <div onClick={onClick} style={{
    background: T.card, border: `1px solid ${glow ? T.amber+"44" : T.border}`,
    borderRadius: 10, padding: 16, transition: "all 0.2s",
    cursor: onClick ? "pointer" : "default",
    boxShadow: glow ? `0 0 20px ${T.amber}11` : "none", ...style,
  }}>{children}</div>
);

const Badge = ({ children, color = T.amber, style }) => (
  <span style={{ display:"inline-flex", alignItems:"center", padding:"2px 8px", borderRadius:20, fontSize:11, fontWeight:600, background:color+"22", color, ...style }}>{children}</span>
);

const Input = ({ value, onChange, placeholder, style, type = "text", ...props }) => (
  <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    style={{ width:"100%", padding:"8px 12px", background:T.panel, border:`1px solid ${T.border}`, borderRadius:6, color:T.text, fontSize:13, fontFamily:"inherit", outline:"none", ...style }} {...props} />
);

const TextArea = ({ value, onChange, placeholder, rows = 4, style }) => (
  <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
    style={{ width:"100%", padding:"8px 12px", background:T.panel, border:`1px solid ${T.border}`, borderRadius:6, color:T.text, fontSize:13, fontFamily:"inherit", outline:"none", resize:"vertical", ...style }} />
);

const Select = ({ value, onChange, options, style }) => (
  <select value={value} onChange={e => onChange(e.target.value)}
    style={{ padding:"8px 12px", background:T.panel, border:`1px solid ${T.border}`, borderRadius:6, color:T.text, fontSize:13, fontFamily:"inherit", ...style }}>
    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);

const Tab = ({ tabs, active, onChange }) => (
  <div style={{ display:"flex", gap:2, background:T.panel, padding:3, borderRadius:8, marginBottom:16 }}>
    {tabs.map(t => (
      <button key={t.id} onClick={() => onChange(t.id)} style={{
        flex:1, padding:"8px 12px", border:"none", borderRadius:6, cursor:"pointer", fontSize:12, fontWeight:500, fontFamily:"inherit",
        background: active === t.id ? T.card : "transparent", color: active === t.id ? T.amber : T.mute, transition:"all 0.2s",
      }}>{t.icon} {t.label}</button>
    ))}
  </div>
);

const Progress = ({ value, max = 100, color = T.amber, height = 6 }) => (
  <div style={{ width:"100%", height, background:T.dim, borderRadius:height/2, overflow:"hidden" }}>
    <div style={{ width:`${clamp((value/max)*100,0,100)}%`, height:"100%", background:color, borderRadius:height/2, transition:"width 0.5s ease" }} />
  </div>
);

const Empty = ({ icon = "📭", title, sub: subtitle, action }) => (
  <div style={{ textAlign:"center", padding:48, color:T.mute }}>
    <div style={{ fontSize:40, marginBottom:12 }}>{icon}</div>
    <div style={{ fontSize:15, color:T.sub, marginBottom:4 }}>{title}</div>
    {subtitle && <div style={{ fontSize:12, marginBottom:16 }}>{subtitle}</div>}
    {action}
  </div>
);

const Modal = ({ open, onClose, title, children, width = 600 }) => {
  if (!open) return null;
  return (
    <div style={{ position:"fixed", inset:0, zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.7)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background:T.panel, border:`1px solid ${T.border}`, borderRadius:12, width:"90%", maxWidth:width, maxHeight:"85vh", overflow:"auto", padding:24 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <h3 style={{ color:T.text, margin:0, fontSize:16 }}>{title}</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", color:T.mute, cursor:"pointer", fontSize:18 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
};

const Stat = ({ label, value, color = T.amber, sub: subtitle }) => (
  <div style={{ textAlign:"center" }}>
    <div style={{ fontSize:22, fontWeight:700, color, lineHeight:1.2 }}>{value}</div>
    <div style={{ fontSize:11, color:T.mute, marginTop:2 }}>{label}</div>
    {subtitle && <div style={{ fontSize:10, color:T.dim }}>{subtitle}</div>}
  </div>
);

// ─── MINI BAR CHART ────────────────────────────────────────────────────
const MiniBar = ({ data, height = 120, color = T.amber }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:4, height, padding:"8px 0" }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
          <div style={{ fontSize:9, color:T.mute }}>{d.value > 999999 ? `$${(d.value/1e6).toFixed(0)}M` : d.value > 999 ? `$${(d.value/1e3).toFixed(0)}K` : d.value}</div>
          <div style={{ width:"100%", height:`${(d.value/max)*80}%`, minHeight:2, background:color, borderRadius:3, transition:"height 0.5s" }} />
          <div style={{ fontSize:9, color:T.mute }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════
// MODULE: DASHBOARD
// ════════════════════════════════════════════════════════════════════════
const Dashboard = ({ grants, docs, contacts, vaultDocs, events, navigate }) => {
  const active = grants.filter(g => !["declined","closeout"].includes(g.stage));
  const awarded = grants.filter(g => ["awarded","active"].includes(g.stage));
  const urgent = active.filter(g => g.deadline && daysUntil(g.deadline) <= 14 && daysUntil(g.deadline) >= 0).sort((a,b) => new Date(a.deadline) - new Date(b.deadline));
  const recentDocs = (vaultDocs || []).slice(-5).reverse();
  const upcomingEvents = (events || []).filter(e => new Date(e.date) >= new Date()).sort((a,b) => new Date(a.date) - new Date(b.date)).slice(0, 5);
  const totalSought = active.reduce((s, g) => s + (g.amount || 0), 0);
  const totalAwarded = awarded.reduce((s, g) => s + (g.amount || 0), 0);
  const winRate = grants.filter(g=>["awarded","active","closeout"].includes(g.stage)).length / Math.max(grants.filter(g=>["awarded","active","closeout","declined"].includes(g.stage)).length, 1) * 100;

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(140px, 1fr))", gap:12, marginBottom:20 }}>
        <Card><Stat label="Active Grants" value={active.length} color={T.blue} /></Card>
        <Card><Stat label="Total Sought" value={fmt(totalSought)} color={T.amber} /></Card>
        <Card><Stat label="Awarded" value={fmt(totalAwarded)} color={T.green} /></Card>
        <Card><Stat label="Win Rate" value={pct(winRate)} color={winRate > 50 ? T.green : T.yellow} /></Card>
        <Card><Stat label="Documents" value={(vaultDocs||[]).length} color={T.purple} /></Card>
        <Card><Stat label="Contacts" value={(contacts||[]).length} color={T.cyan} /></Card>
      </div>

      {/* Pipeline Overview */}
      <Card style={{ marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>📊 Pipeline Overview</div>
        <div style={{ display:"flex", gap:2, flexWrap:"wrap" }}>
          {STAGES.map(s => {
            const count = grants.filter(g => g.stage === s.id).length;
            return count > 0 ? (
              <div key={s.id} style={{ padding:"6px 10px", background:s.color+"15", borderRadius:6, fontSize:11, color:s.color, display:"flex", alignItems:"center", gap:4 }}>
                <span>{s.icon}</span> {s.label} <strong>{count}</strong>
              </div>
            ) : null;
          })}
          {grants.length === 0 && <div style={{ color:T.mute, fontSize:12 }}>No grants in pipeline yet. Start by discovering opportunities.</div>}
        </div>
      </Card>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        {/* Urgent Deadlines */}
        <Card>
          <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>🚨 Urgent Deadlines</div>
          {urgent.length === 0 ? <div style={{ color:T.mute, fontSize:12 }}>No deadlines in the next 14 days</div> :
            urgent.map(g => (
              <div key={g.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:`1px solid ${T.border}` }}>
                <div style={{ fontSize:12, color:T.text }}>{g.title?.slice(0,40)}</div>
                <Badge color={daysUntil(g.deadline) <= 3 ? T.red : T.yellow}>{daysUntil(g.deadline)}d</Badge>
              </div>
            ))
          }
        </Card>

        {/* Recent Activity */}
        <Card>
          <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>📅 Upcoming Events</div>
          {upcomingEvents.length === 0 ? <div style={{ color:T.mute, fontSize:12 }}>No upcoming events</div> :
            upcomingEvents.map(e => (
              <div key={e.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:`1px solid ${T.border}` }}>
                <div style={{ fontSize:12, color:T.text }}>{e.title?.slice(0,35)}</div>
                <div style={{ fontSize:11, color:T.mute }}>{fmtDate(e.date)}</div>
              </div>
            ))
          }
        </Card>
      </div>

      {/* Quick Actions */}
      <Card style={{ marginTop:16 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>⚡ Quick Actions</div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <Btn variant="primary" size="sm" onClick={() => navigate("discovery")}>🔍 Find Grants</Btn>
          <Btn size="sm" onClick={() => navigate("pipeline")}>📋 Pipeline</Btn>
          <Btn size="sm" onClick={() => navigate("calendar")}>📅 Calendar</Btn>
          <Btn size="sm" onClick={() => navigate("rfp_parser")}>📑 Parse RFP</Btn>
          <Btn size="sm" onClick={() => navigate("ai_drafter")}>✍️ AI Drafter</Btn>
          <Btn size="sm" onClick={() => navigate("vault")}>🗄️ Doc Vault</Btn>
          <Btn size="sm" onClick={() => navigate("tasks")}>📝 Tasks</Btn>
          <Btn size="sm" onClick={() => navigate("reports")}>📄 Reports</Btn>
          <Btn size="sm" onClick={() => navigate("projector")}>💰 Projector</Btn>
        </div>
      </Card>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════
// MODULE: GRANT DISCOVERY
// ════════════════════════════════════════════════════════════════════════
const Discovery = ({ onAdd }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [landscape, setLandscape] = useState(null);
  const [regs, setRegs] = useState([]);
  const [tab, setTab] = useState("search");

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const data = await API.searchGrants(query);
      setResults(data.oppHits || []);
    } catch { setResults([]); }
    setLoading(false);
  };

  const loadLandscape = async () => {
    setLoading(true);
    const [spending, recipients] = await Promise.all([API.getSpendingByState("IL"), API.getTopRecipients("IL")]);
    setLandscape({ spending: spending.results || [], recipients: recipients.results || [] });
    setLoading(false);
  };

  const searchRegs = async () => {
    if (!query.trim()) return;
    setLoading(true);
    const data = await API.searchRegulations(query);
    setRegs(data.data || []);
    setLoading(false);
  };

  return (
    <div>
      <Tab tabs={[
        { id:"search", icon:"🔍", label:"Grant Search" },
        { id:"landscape", icon:"📈", label:"Funding Landscape" },
        { id:"regs", icon:"⚖️", label:"Regulatory Intel" },
      ]} active={tab} onChange={setTab} />

      {tab === "search" && (
        <div>
          <div style={{ display:"flex", gap:8, marginBottom:16 }}>
            <Input value={query} onChange={setQuery} placeholder="Search federal grants... (e.g., rural technology, disability services, small business)" style={{ flex:1 }} onKeyDown={e => e.key === "Enter" && search()} />
            <Btn variant="primary" onClick={search} disabled={loading}>{loading ? "⏳" : "🔍"} Search</Btn>
          </div>
          <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
            {["rural technology", "disability entrepreneurship", "small business innovation", "AI research", "workforce development", "community development"].map(q => (
              <Btn key={q} size="sm" variant="ghost" onClick={() => { setQuery(q); }}>{q}</Btn>
            ))}
          </div>
          {results.length === 0 && !loading && <Empty icon="🔍" title="Search for Grant Opportunities" sub="Try keywords related to your business, location, or demographic" />}
          {results.map((opp, i) => (
            <Card key={i} style={{ marginBottom:8, cursor:"pointer" }} onClick={() => onAdd({
              id: uid(), title: opp.title || opp.opportunityTitle || "Untitled",
              agency: opp.agency || opp.agencyName || "", amount: opp.awardCeiling || opp.estimatedFunding || 0,
              deadline: opp.closeDate || opp.closeDateExplanation || "", stage: "discovered",
              oppId: opp.id || opp.opportunityId, description: opp.description || opp.synopsis || "",
              category: opp.category || "", createdAt: new Date().toISOString(), notes: "", tags: [],
            })}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:4 }}>{opp.title || opp.opportunityTitle}</div>
                  <div style={{ fontSize:11, color:T.mute, marginBottom:4 }}>{opp.agency || opp.agencyName}</div>
                  <div style={{ fontSize:11, color:T.sub, lineHeight:1.4 }}>{(opp.description || opp.synopsis || "").slice(0, 200)}...</div>
                </div>
                <div style={{ textAlign:"right", marginLeft:12, flexShrink:0 }}>
                  {(opp.awardCeiling || opp.estimatedFunding) && <div style={{ fontSize:14, fontWeight:700, color:T.green }}>{fmt(opp.awardCeiling || opp.estimatedFunding)}</div>}
                  {(opp.closeDate) && <div style={{ fontSize:11, color: daysUntil(opp.closeDate) <= 14 ? T.red : T.mute }}>{fmtDate(opp.closeDate)}</div>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === "landscape" && (
        <div>
          <Btn variant="primary" onClick={loadLandscape} disabled={loading} style={{ marginBottom:16 }}>{loading ? "⏳ Loading..." : "📊 Load IL Funding Data"}</Btn>
          {landscape && (
            <div>
              <Card style={{ marginBottom:12 }}>
                <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:8 }}>Top Grant Recipients — Illinois</div>
                {(landscape.recipients || []).slice(0, 8).map((r, i) => (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:`1px solid ${T.border}` }}>
                    <span style={{ fontSize:12, color:T.text }}>{r["Recipient Name"] || "Unknown"}</span>
                    <span style={{ fontSize:12, color:T.green, fontWeight:600 }}>{fmt(r["Award Amount"] || 0)}</span>
                  </div>
                ))}
              </Card>
            </div>
          )}
        </div>
      )}

      {tab === "regs" && (
        <div>
          <div style={{ display:"flex", gap:8, marginBottom:16 }}>
            <Input value={query} onChange={setQuery} placeholder="Search regulations..." style={{ flex:1 }} />
            <Btn variant="primary" onClick={searchRegs} disabled={loading}>⚖️ Search</Btn>
          </div>
          {regs.map((reg, i) => (
            <Card key={i} style={{ marginBottom:8 }}>
              <div style={{ fontSize:13, fontWeight:600, color:T.text }}>{reg.attributes?.title || "Regulation"}</div>
              <div style={{ fontSize:11, color:T.mute, marginTop:4 }}>{reg.attributes?.agencyName} · {reg.attributes?.postedDate}</div>
              {reg.attributes?.commentEndDate && <Badge color={T.yellow} style={{ marginTop:4 }}>Open for Comment until {reg.attributes.commentEndDate}</Badge>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════
// MODULE: GRANT PIPELINE
// ════════════════════════════════════════════════════════════════════════
const Pipeline = ({ grants, updateGrant, deleteGrant }) => {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? grants : grants.filter(g => g.stage === filter);

  return (
    <div>
      <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
        <Btn size="sm" variant={filter === "all" ? "primary" : "ghost"} onClick={() => setFilter("all")}>All ({grants.length})</Btn>
        {STAGES.map(s => {
          const count = grants.filter(g => g.stage === s.id).length;
          return count > 0 ? <Btn key={s.id} size="sm" variant={filter === s.id ? "primary" : "ghost"} onClick={() => setFilter(s.id)}>{s.icon} {s.label} ({count})</Btn> : null;
        })}
      </div>

      {filtered.length === 0 ? <Empty icon="📋" title="No grants in pipeline" sub="Discover and add grants to start tracking" /> :
        filtered.map(g => (
          <Card key={g.id} style={{ marginBottom:8, cursor:"pointer" }} onClick={() => setSelected(g)}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:16 }}>{STAGE_MAP[g.stage]?.icon}</span>
                  <span style={{ fontSize:13, fontWeight:600, color:T.text }}>{g.title?.slice(0, 50)}</span>
                </div>
                <div style={{ fontSize:11, color:T.mute, marginTop:4 }}>{g.agency} · {STAGE_MAP[g.stage]?.label}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                {g.amount > 0 && <div style={{ fontSize:14, fontWeight:600, color:T.green }}>{fmt(g.amount)}</div>}
                {g.deadline && <div style={{ fontSize:11, color: daysUntil(g.deadline) <= 7 ? T.red : T.mute }}>{fmtDate(g.deadline)}</div>}
              </div>
            </div>
            {g.tags?.length > 0 && <div style={{ display:"flex", gap:4, marginTop:8, flexWrap:"wrap" }}>{g.tags.map(t => <Badge key={t} color={T.blue}>{t}</Badge>)}</div>}
          </Card>
        ))
      }

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Grant Details" width={700}>
        {selected && (
          <div>
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:16, fontWeight:600, color:T.text, marginBottom:4 }}>{selected.title}</div>
              <div style={{ fontSize:12, color:T.mute }}>{selected.agency}</div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
              <div>
                <label style={{ fontSize:11, color:T.mute, display:"block", marginBottom:4 }}>Stage</label>
                <Select value={selected.stage} onChange={v => { updateGrant(selected.id, { stage: v }); setSelected({...selected, stage:v}); }}
                  options={STAGES.map(s => ({ value:s.id, label:`${s.icon} ${s.label}` }))} style={{ width:"100%" }} />
              </div>
              <div>
                <label style={{ fontSize:11, color:T.mute, display:"block", marginBottom:4 }}>Amount</label>
                <Input type="number" value={selected.amount || ""} onChange={v => { updateGrant(selected.id, { amount:Number(v) }); setSelected({...selected, amount:Number(v)}); }} placeholder="Award amount" />
              </div>
              <div>
                <label style={{ fontSize:11, color:T.mute, display:"block", marginBottom:4 }}>Deadline</label>
                <Input type="date" value={selected.deadline?.split("T")[0] || ""} onChange={v => { updateGrant(selected.id, { deadline:v }); setSelected({...selected, deadline:v}); }} />
              </div>
              <div>
                <label style={{ fontSize:11, color:T.mute, display:"block", marginBottom:4 }}>Category</label>
                <Input value={selected.category || ""} onChange={v => { updateGrant(selected.id, { category:v }); setSelected({...selected, category:v}); }} placeholder="e.g., SBIR, Community Development" />
              </div>
            </div>
            <label style={{ fontSize:11, color:T.mute, display:"block", marginBottom:4 }}>Notes</label>
            <TextArea value={selected.notes || ""} onChange={v => { updateGrant(selected.id, { notes:v }); setSelected({...selected, notes:v}); }} placeholder="Add notes..." rows={4} />
            <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:16 }}>
              <Btn variant="danger" size="sm" onClick={() => { deleteGrant(selected.id); setSelected(null); }}>🗑️ Delete</Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════
// MODULE: TIMELINE CALENDAR (NEW v3.0)
// ════════════════════════════════════════════════════════════════════════
const TimelineCalendar = ({ grants, events, setEvents }) => {
  const [view, setView] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAdd, setShowAdd] = useState(false);
  const [newEvent, setNewEvent] = useState({ title:"", date:"", type:"deadline", grantId:"", color:T.amber, notes:"" });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  // Merge grant deadlines + custom events
  const allEvents = useMemo(() => {
    const grantEvents = grants.filter(g => g.deadline).map(g => ({
      id: `g_${g.id}`, title: g.title, date: g.deadline, type: "deadline",
      color: STAGE_MAP[g.stage]?.color || T.amber, grantId: g.id, stage: g.stage,
    }));
    return [...grantEvents, ...(events || [])];
  }, [grants, events]);

  const getEventsForDay = (day) => {
    const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    return allEvents.filter(e => e.date?.startsWith(dateStr));
  };

  const addEvent = () => {
    if (!newEvent.title || !newEvent.date) return;
    setEvents([...(events || []), { ...newEvent, id: uid() }]);
    setNewEvent({ title:"", date:"", type:"milestone", grantId:"", color:T.amber, notes:"" });
    setShowAdd(false);
  };

  const navMonth = (dir) => setCurrentDate(new Date(year, month + dir, 1));

  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const today = new Date();
  const isToday = (day) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  // Timeline view: next 90 days
  const timelineEvents = useMemo(() => {
    const now = new Date();
    const end = new Date(now.getTime() + 90 * 86400000);
    return allEvents.filter(e => {
      const d = new Date(e.date);
      return d >= now && d <= end;
    }).sort((a,b) => new Date(a.date) - new Date(b.date));
  }, [allEvents]);

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <Tab tabs={[{ id:"month", icon:"📅", label:"Month" }, { id:"timeline", icon:"📊", label:"Timeline" }, { id:"agenda", icon:"📋", label:"Agenda" }]} active={view} onChange={setView} />
        <Btn variant="primary" size="sm" onClick={() => setShowAdd(true)}>+ Add Event</Btn>
      </div>

      {view === "month" && (
        <Card>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <Btn variant="ghost" size="sm" onClick={() => navMonth(-1)}>◀</Btn>
            <div style={{ fontSize:16, fontWeight:600, color:T.text }}>{monthNames[month]} {year}</div>
            <Btn variant="ghost" size="sm" onClick={() => navMonth(1)}>▶</Btn>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7, 1fr)", gap:2 }}>
            {dayNames.map(d => <div key={d} style={{ textAlign:"center", fontSize:10, color:T.mute, padding:4, fontWeight:600 }}>{d}</div>)}
            {Array.from({ length: firstDay }).map((_, i) => <div key={`empty_${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEvents = getEventsForDay(day);
              return (
                <div key={day} style={{
                  padding:4, minHeight:60, borderRadius:6, cursor:"pointer",
                  background: isToday(day) ? T.amber+"15" : dayEvents.length > 0 ? T.card : "transparent",
                  border: isToday(day) ? `1px solid ${T.amber}44` : `1px solid ${T.border}`,
                }}>
                  <div style={{ fontSize:11, fontWeight: isToday(day) ? 700 : 400, color: isToday(day) ? T.amber : T.sub, marginBottom:2 }}>{day}</div>
                  {dayEvents.slice(0, 3).map(e => (
                    <div key={e.id} style={{ fontSize:8, padding:"1px 3px", borderRadius:3, marginBottom:1, background:e.color+"22", color:e.color, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {e.type === "deadline" ? "⏰" : "📌"} {e.title?.slice(0, 15)}
                    </div>
                  ))}
                  {dayEvents.length > 3 && <div style={{ fontSize:8, color:T.mute }}>+{dayEvents.length - 3} more</div>}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {view === "timeline" && (
        <Card>
          <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>📊 Next 90 Days</div>
          {timelineEvents.length === 0 ? <div style={{ color:T.mute, fontSize:12 }}>No events in the next 90 days</div> :
            timelineEvents.map(e => {
              const days = daysUntil(e.date);
              return (
                <div key={e.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"8px 0", borderBottom:`1px solid ${T.border}` }}>
                  <div style={{ width:4, height:32, borderRadius:2, background:e.color, flexShrink:0 }} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, color:T.text }}>{e.title?.slice(0,50)}</div>
                    <div style={{ fontSize:10, color:T.mute }}>{fmtDate(e.date)} · {e.type}</div>
                  </div>
                  <Badge color={days <= 7 ? T.red : days <= 30 ? T.yellow : T.green}>{days}d</Badge>
                </div>
              );
            })
          }
        </Card>
      )}

      {view === "agenda" && (
        <Card>
          <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>📋 All Events by Date</div>
          {allEvents.sort((a,b) => new Date(a.date) - new Date(b.date)).map(e => (
            <div key={e.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:`1px solid ${T.border}` }}>
              <div>
                <div style={{ fontSize:12, color:T.text }}>{e.title}</div>
                <div style={{ fontSize:10, color:T.mute }}>{fmtDate(e.date)} · {e.type}{e.stage ? ` · ${STAGE_MAP[e.stage]?.label}` : ""}</div>
              </div>
              <Badge color={e.color}>{e.type}</Badge>
            </div>
          ))}
          {allEvents.length === 0 && <div style={{ color:T.mute, fontSize:12 }}>No events yet</div>}
        </Card>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Calendar Event">
        <div style={{ display:"grid", gap:12 }}>
          <Input value={newEvent.title} onChange={v => setNewEvent({...newEvent, title:v})} placeholder="Event title" />
          <Input type="date" value={newEvent.date} onChange={v => setNewEvent({...newEvent, date:v})} />
          <Select value={newEvent.type} onChange={v => setNewEvent({...newEvent, type:v})} options={[
            { value:"milestone", label:"📌 Milestone" }, { value:"meeting", label:"🤝 Meeting" },
            { value:"report_due", label:"📝 Report Due" }, { value:"review", label:"👁️ Review" },
            { value:"other", label:"📎 Other" },
          ]} />
          <TextArea value={newEvent.notes} onChange={v => setNewEvent({...newEvent, notes:v})} placeholder="Notes..." rows={2} />
          <Btn variant="primary" onClick={addEvent}>Add Event</Btn>
        </div>
      </Modal>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════
// MODULE: DOCUMENT VAULT (NEW v3.0)
// ════════════════════════════════════════════════════════════════════════
const DocumentVault = ({ vaultDocs, setVaultDocs, grants }) => {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");
  const [newDoc, setNewDoc] = useState({ title:"", category:"narrative", content:"", tags:[], grantIds:[], version:1, status:"draft" });

  const CATEGORIES = [
    { id:"narrative", label:"📝 Narratives", color:T.amber },
    { id:"budget", label:"💰 Budgets", color:T.green },
    { id:"letter", label:"✉️ Letters of Support", color:T.blue },
    { id:"bio", label:"👤 Bios & Resumes", color:T.purple },
    { id:"data", label:"📊 Data & Evidence", color:T.cyan },
    { id:"compliance", label:"✅ Compliance", color:T.yellow },
    { id:"template", label:"📋 Templates", color:T.orange },
    { id:"other", label:"📎 Other", color:T.mute },
  ];

  const docs = vaultDocs || [];
  const filtered = docs.filter(d => {
    if (filter !== "all" && d.category !== filter) return false;
    if (search && !d.title.toLowerCase().includes(search.toLowerCase()) && !d.content?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const addDoc = () => {
    if (!newDoc.title) return;
    const doc = { ...newDoc, id: uid(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), versions: [{ version:1, content:newDoc.content, date:new Date().toISOString() }] };
    setVaultDocs([...docs, doc]);
    setNewDoc({ title:"", category:"narrative", content:"", tags:[], grantIds:[], version:1, status:"draft" });
    setShowAdd(false);
  };

  const updateDoc = (id, updates) => {
    setVaultDocs(docs.map(d => {
      if (d.id !== id) return d;
      const updated = { ...d, ...updates, updatedAt: new Date().toISOString() };
      if (updates.content && updates.content !== d.content) {
        updated.version = (d.version || 1) + 1;
        updated.versions = [...(d.versions || []), { version: updated.version, content: updates.content, date: new Date().toISOString() }];
      }
      return updated;
    }));
  };

  const deleteDoc = (id) => {
    setVaultDocs(docs.filter(d => d.id !== id));
    setSelected(null);
  };

  const duplicateDoc = (doc) => {
    const newD = { ...doc, id: uid(), title: `${doc.title} (Copy)`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    setVaultDocs([...docs, newD]);
  };

  const catMap = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

  return (
    <div>
      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        <Input value={search} onChange={setSearch} placeholder="Search documents..." style={{ flex:1 }} />
        <Btn variant="primary" onClick={() => setShowAdd(true)}>+ New Document</Btn>
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
        <Btn size="sm" variant={filter === "all" ? "primary" : "ghost"} onClick={() => setFilter("all")}>All ({docs.length})</Btn>
        {CATEGORIES.map(c => {
          const count = docs.filter(d => d.category === c.id).length;
          return count > 0 ? <Btn key={c.id} size="sm" variant={filter === c.id ? "primary" : "ghost"} onClick={() => setFilter(c.id)}>{c.label} ({count})</Btn> : null;
        })}
      </div>

      {/* Document Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:8, marginBottom:16 }}>
        <Card><Stat label="Total Docs" value={docs.length} color={T.amber} /></Card>
        <Card><Stat label="Drafts" value={docs.filter(d => d.status === "draft").length} color={T.yellow} /></Card>
        <Card><Stat label="Final" value={docs.filter(d => d.status === "final").length} color={T.green} /></Card>
        <Card><Stat label="Linked to Grants" value={docs.filter(d => d.grantIds?.length > 0).length} color={T.blue} /></Card>
      </div>

      {filtered.length === 0 ? <Empty icon="🗄️" title="No documents yet" sub="Create reusable documents for your grant applications" action={<Btn variant="primary" size="sm" onClick={() => setShowAdd(true)}>+ Create First Document</Btn>} /> :
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:8 }}>
          {filtered.map(d => (
            <Card key={d.id} onClick={() => setSelected(d)} style={{ cursor:"pointer" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                <Badge color={catMap[d.category]?.color || T.mute}>{catMap[d.category]?.label || d.category}</Badge>
                <Badge color={d.status === "final" ? T.green : T.yellow}>{d.status || "draft"}</Badge>
              </div>
              <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:4 }}>{d.title}</div>
              <div style={{ fontSize:11, color:T.mute }}>{d.content?.slice(0, 80)}...</div>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:8, fontSize:10, color:T.dim }}>
                <span>v{d.version || 1}</span>
                <span>{fmtDate(d.updatedAt)}</span>
              </div>
              {d.grantIds?.length > 0 && <div style={{ fontSize:10, color:T.blue, marginTop:4 }}>🔗 Linked to {d.grantIds.length} grant{d.grantIds.length > 1 ? "s" : ""}</div>}
            </Card>
          ))}
        </div>
      }

      {/* Document Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Document Editor" width={800}>
        {selected && (
          <div>
            <Input value={selected.title} onChange={v => { updateDoc(selected.id, { title:v }); setSelected({...selected, title:v}); }} style={{ fontSize:16, fontWeight:600, marginBottom:12 }} />
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:12 }}>
              <Select value={selected.category} onChange={v => { updateDoc(selected.id, { category:v }); setSelected({...selected, category:v}); }}
                options={CATEGORIES.map(c => ({ value:c.id, label:c.label }))} />
              <Select value={selected.status || "draft"} onChange={v => { updateDoc(selected.id, { status:v }); setSelected({...selected, status:v}); }}
                options={[{ value:"draft", label:"📝 Draft" }, { value:"review", label:"👁️ In Review" }, { value:"final", label:"✅ Final" }]} />
              <div style={{ fontSize:11, color:T.mute, display:"flex", alignItems:"center" }}>Version {selected.version || 1} · {(selected.versions || []).length} revisions</div>
            </div>
            <TextArea value={selected.content || ""} onChange={v => { updateDoc(selected.id, { content:v }); setSelected({...selected, content:v}); }} rows={16} placeholder="Document content..." />
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:12 }}>
              <div style={{ display:"flex", gap:8 }}>
                <Btn size="sm" onClick={() => duplicateDoc(selected)}>📋 Duplicate</Btn>
                <Btn size="sm" onClick={() => navigator.clipboard?.writeText(selected.content || "")}>📎 Copy</Btn>
              </div>
              <Btn variant="danger" size="sm" onClick={() => deleteDoc(selected.id)}>🗑️ Delete</Btn>
            </div>
            {/* Version History */}
            {(selected.versions || []).length > 1 && (
              <div style={{ marginTop:16 }}>
                <div style={{ fontSize:12, fontWeight:600, color:T.sub, marginBottom:8 }}>Version History</div>
                {[...(selected.versions || [])].reverse().map((v, i) => (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom:`1px solid ${T.border}`, fontSize:11, color:T.mute }}>
                    <span>v{v.version}</span>
                    <span>{fmtDate(v.date)}</span>
                    <Btn size="sm" variant="ghost" onClick={() => { updateDoc(selected.id, { content:v.content }); setSelected({...selected, content:v.content}); }}>Restore</Btn>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Add Document Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="New Document">
        <div style={{ display:"grid", gap:12 }}>
          <Input value={newDoc.title} onChange={v => setNewDoc({...newDoc, title:v})} placeholder="Document title" />
          <Select value={newDoc.category} onChange={v => setNewDoc({...newDoc, category:v})} options={CATEGORIES.map(c => ({ value:c.id, label:c.label }))} />
          <TextArea value={newDoc.content} onChange={v => setNewDoc({...newDoc, content:v})} rows={8} placeholder="Document content..." />
          <Btn variant="primary" onClick={addDoc}>Create Document</Btn>
        </div>
      </Modal>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════
// MODULE: FINANCIAL IMPACT PROJECTOR (NEW v3.0)
// ════════════════════════════════════════════════════════════════════════
const FinancialProjector = ({ grants }) => {
  const [runway, setRunway] = useState({ monthly_expenses: 3000, current_savings: 500, other_income: 0 });
  const [scenario, setScenario] = useState("expected");

  const awarded = grants.filter(g => ["awarded", "active"].includes(g.stage));
  const pending = grants.filter(g => ["submitted", "under_review"].includes(g.stage));
  const pipeline = grants.filter(g => ["discovered", "researching", "qualifying", "preparing", "drafting", "reviewing"].includes(g.stage));

  const totalAwarded = awarded.reduce((s, g) => s + (g.amount || 0), 0);
  const totalPending = pending.reduce((s, g) => s + (g.amount || 0), 0);
  const totalPipeline = pipeline.reduce((s, g) => s + (g.amount || 0), 0);

  // Scenario modeling
  const scenarios = {
    conservative: { winRate: 0.15, label: "Conservative (15% win rate)", color: T.red },
    expected: { winRate: 0.30, label: "Expected (30% win rate)", color: T.yellow },
    optimistic: { winRate: 0.50, label: "Optimistic (50% win rate)", color: T.green },
  };

  const sc = scenarios[scenario];
  const projectedFromPending = totalPending * sc.winRate;
  const projectedFromPipeline = totalPipeline * sc.winRate * 0.5; // pipeline is less certain
  const totalProjected = totalAwarded + projectedFromPending + projectedFromPipeline;
  const monthlyBurn = runway.monthly_expenses - runway.other_income;
  const currentRunway = monthlyBurn > 0 ? runway.current_savings / monthlyBurn : Infinity;
  const projectedRunway = monthlyBurn > 0 ? (runway.current_savings + totalProjected) / monthlyBurn : Infinity;

  // 12-month projection
  const monthlyProjection = useMemo(() => {
    const months = [];
    let balance = runway.current_savings;
    const monthlyGrant = totalProjected / 12;
    for (let i = 0; i < 12; i++) {
      balance = balance - monthlyBurn + monthlyGrant;
      months.push({ month: i + 1, label: `M${i + 1}`, balance: Math.max(balance, 0), value: Math.max(balance, 0) });
    }
    return months;
  }, [runway, totalProjected, monthlyBurn]);

  // Business allocation
  const bizAllocation = PROFILE.businesses.filter(b => b.st === "active").map(b => ({
    name: b.n, sector: b.sec,
    suggestedAllocation: totalProjected / PROFILE.businesses.filter(b2 => b2.st === "active").length,
  }));

  return (
    <div>
      {/* Summary Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(140px, 1fr))", gap:8, marginBottom:16 }}>
        <Card glow><Stat label="Awarded" value={fmt(totalAwarded)} color={T.green} /></Card>
        <Card><Stat label="Pending" value={fmt(totalPending)} color={T.yellow} sub={`${pending.length} applications`} /></Card>
        <Card><Stat label="Pipeline" value={fmt(totalPipeline)} color={T.blue} sub={`${pipeline.length} opportunities`} /></Card>
        <Card><Stat label="Projected Total" value={fmt(totalProjected)} color={T.amber} sub={sc.label} /></Card>
      </div>

      {/* Scenario Selector */}
      <Card style={{ marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>🎲 Scenario Modeling</div>
        <div style={{ display:"flex", gap:8, marginBottom:12 }}>
          {Object.entries(scenarios).map(([key, s]) => (
            <Btn key={key} size="sm" variant={scenario === key ? "primary" : "default"} onClick={() => setScenario(key)} style={{ borderColor: s.color+"44" }}>{s.label}</Btn>
          ))}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
          <div>
            <label style={{ fontSize:10, color:T.mute, display:"block", marginBottom:4 }}>Monthly Expenses</label>
            <Input type="number" value={runway.monthly_expenses} onChange={v => setRunway({...runway, monthly_expenses:Number(v)})} />
          </div>
          <div>
            <label style={{ fontSize:10, color:T.mute, display:"block", marginBottom:4 }}>Current Savings</label>
            <Input type="number" value={runway.current_savings} onChange={v => setRunway({...runway, current_savings:Number(v)})} />
          </div>
          <div>
            <label style={{ fontSize:10, color:T.mute, display:"block", marginBottom:4 }}>Other Monthly Income</label>
            <Input type="number" value={runway.other_income} onChange={v => setRunway({...runway, other_income:Number(v)})} />
          </div>
        </div>
      </Card>

      {/* Runway Analysis */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
        <Card>
          <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>🛤️ Runway Analysis</div>
          <div style={{ marginBottom:8 }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}>
              <span style={{ color:T.sub }}>Current Runway</span>
              <span style={{ color: currentRunway < 3 ? T.red : T.green, fontWeight:600 }}>{currentRunway === Infinity ? "∞" : `${currentRunway.toFixed(1)} months`}</span>
            </div>
            <Progress value={Math.min(currentRunway, 24)} max={24} color={currentRunway < 3 ? T.red : currentRunway < 6 ? T.yellow : T.green} />
          </div>
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}>
              <span style={{ color:T.sub }}>Projected Runway</span>
              <span style={{ color:T.green, fontWeight:600 }}>{projectedRunway === Infinity ? "∞" : `${projectedRunway.toFixed(1)} months`}</span>
            </div>
            <Progress value={Math.min(projectedRunway, 24)} max={24} color={T.green} />
          </div>
          <div style={{ fontSize:11, color:T.mute, marginTop:8 }}>Monthly burn: {fmt(monthlyBurn)}/mo</div>
        </Card>

        <Card>
          <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:8 }}>📊 12-Month Cash Flow</div>
          <MiniBar data={monthlyProjection} height={100} color={T.amber} />
        </Card>
      </div>

      {/* Business Allocation */}
      <Card style={{ marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>🏢 Suggested Business Allocation</div>
        {bizAllocation.map((b, i) => (
          <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:`1px solid ${T.border}` }}>
            <div>
              <div style={{ fontSize:12, color:T.text }}>{b.name}</div>
              <div style={{ fontSize:10, color:T.mute }}>{b.sector}</div>
            </div>
            <div style={{ fontSize:14, fontWeight:600, color:T.amber }}>{fmt(b.suggestedAllocation)}</div>
          </div>
        ))}
      </Card>

      {/* Grant-Level Projections */}
      <Card>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>📋 Grant-Level Projections</div>
        {[...awarded, ...pending, ...pipeline].map(g => {
          const probability = awarded.some(a => a.id === g.id) ? 1 : pending.some(p => p.id === g.id) ? sc.winRate : sc.winRate * 0.5;
          return (
            <div key={g.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:`1px solid ${T.border}` }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, color:T.text }}>{g.title?.slice(0, 40)}</div>
                <div style={{ fontSize:10, color:T.mute }}>{STAGE_MAP[g.stage]?.label}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:12, fontWeight:600, color:T.green }}>{fmt(g.amount || 0)}</div>
                <div style={{ fontSize:10, color: probability === 1 ? T.green : T.mute }}>{pct(probability * 100)} likely → {fmt((g.amount || 0) * probability)}</div>
              </div>
            </div>
          );
        })}
        {grants.length === 0 && <div style={{ color:T.mute, fontSize:12 }}>Add grants to see financial projections</div>}
      </Card>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════
// MODULE: GRANT RELATIONSHIP MAP (NEW v3.0)
// ════════════════════════════════════════════════════════════════════════
const RelationshipMap = ({ grants, contacts, setContacts }) => {
  const [view, setView] = useState("network");
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({ name:"", org:"", role:"", email:"", type:"funder", notes:"", grantIds:[] });

  const contactList = contacts || [];

  // Build relationship data
  const agencies = useMemo(() => {
    const map = {};
    grants.forEach(g => {
      const agency = g.agency || "Unknown";
      if (!map[agency]) map[agency] = { name: agency, grants: [], totalAmount: 0, contacts: [] };
      map[agency].grants.push(g);
      map[agency].totalAmount += g.amount || 0;
    });
    contactList.forEach(c => {
      if (c.org && map[c.org]) map[c.org].contacts.push(c);
    });
    return Object.values(map).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [grants, contactList]);

  const addContact = () => {
    if (!newContact.name) return;
    setContacts([...contactList, { ...newContact, id: uid(), createdAt: new Date().toISOString() }]);
    setNewContact({ name:"", org:"", role:"", email:"", type:"funder", notes:"", grantIds:[] });
    setShowAddContact(false);
  };

  const deleteContact = (id) => setContacts(contactList.filter(c => c.id !== id));

  const CONTACT_TYPES = [
    { id:"funder", label:"💰 Funder", color:T.green },
    { id:"program_officer", label:"👤 Program Officer", color:T.blue },
    { id:"partner", label:"🤝 Partner", color:T.purple },
    { id:"reviewer", label:"👁️ Reviewer", color:T.yellow },
    { id:"mentor", label:"🎓 Mentor", color:T.amber },
    { id:"other", label:"📎 Other", color:T.mute },
  ];
  const typeMap = Object.fromEntries(CONTACT_TYPES.map(t => [t.id, t]));

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <Tab tabs={[
          { id:"network", icon:"🕸️", label:"Agency Network" },
          { id:"contacts", icon:"👥", label:"Contacts CRM" },
          { id:"insights", icon:"💡", label:"Insights" },
        ]} active={view} onChange={setView} />
        <Btn variant="primary" size="sm" onClick={() => setShowAddContact(true)}>+ Add Contact</Btn>
      </div>

      {view === "network" && (
        <div>
          {agencies.length === 0 ? <Empty icon="🕸️" title="No agency data yet" sub="Add grants to build your funder network" /> :
            agencies.map(a => (
              <Card key={a.name} style={{ marginBottom:8 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:600, color:T.text }}>{a.name}</div>
                    <div style={{ fontSize:11, color:T.mute, marginTop:2 }}>{a.grants.length} grant{a.grants.length > 1 ? "s" : ""} · {a.contacts.length} contact{a.contacts.length > 1 ? "s" : ""}</div>
                  </div>
                  <div style={{ fontSize:16, fontWeight:700, color:T.green }}>{fmt(a.totalAmount)}</div>
                </div>
                <div style={{ display:"flex", gap:4, marginTop:8, flexWrap:"wrap" }}>
                  {a.grants.map(g => (
                    <Badge key={g.id} color={STAGE_MAP[g.stage]?.color || T.mute}>{STAGE_MAP[g.stage]?.icon} {g.title?.slice(0, 25)}</Badge>
                  ))}
                </div>
                {a.contacts.length > 0 && (
                  <div style={{ marginTop:8 }}>
                    {a.contacts.map(c => (
                      <div key={c.id} style={{ fontSize:11, color:T.sub, padding:2 }}>👤 {c.name} — {c.role}</div>
                    ))}
                  </div>
                )}
              </Card>
            ))
          }
        </div>
      )}

      {view === "contacts" && (
        <div>
          {contactList.length === 0 ? <Empty icon="👥" title="No contacts yet" sub="Add program officers, partners, and mentors" action={<Btn variant="primary" size="sm" onClick={() => setShowAddContact(true)}>+ Add Contact</Btn>} /> :
            contactList.map(c => (
              <Card key={c.id} style={{ marginBottom:8 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:T.text }}>{c.name}</div>
                    <div style={{ fontSize:11, color:T.mute }}>{c.org}{c.role ? ` · ${c.role}` : ""}</div>
                    {c.email && <div style={{ fontSize:11, color:T.blue, marginTop:2 }}>{c.email}</div>}
                    {c.notes && <div style={{ fontSize:11, color:T.sub, marginTop:4 }}>{c.notes}</div>}
                  </div>
                  <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                    <Badge color={typeMap[c.type]?.color || T.mute}>{typeMap[c.type]?.label || c.type}</Badge>
                    <button onClick={() => deleteContact(c.id)} style={{ background:"none", border:"none", color:T.red, cursor:"pointer", fontSize:14 }}>✕</button>
                  </div>
                </div>
              </Card>
            ))
          }
        </div>
      )}

      {view === "insights" && (
        <div>
          <Card style={{ marginBottom:12 }}>
            <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>🔑 Funder Diversity</div>
            <div style={{ fontSize:12, color:T.sub, marginBottom:8 }}>
              You're connected to <strong style={{ color:T.amber }}>{agencies.length}</strong> unique agencies. 
              {agencies.length < 5 ? " Consider diversifying your funder base to reduce risk." : " Good funder diversification."}
            </div>
            <Progress value={Math.min(agencies.length, 10)} max={10} color={agencies.length >= 5 ? T.green : T.yellow} />
          </Card>
          <Card style={{ marginBottom:12 }}>
            <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>📊 Relationship Strength</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:20, fontWeight:700, color:T.blue }}>{contactList.filter(c => c.type === "program_officer").length}</div>
                <div style={{ fontSize:11, color:T.mute }}>Program Officers</div>
              </div>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:20, fontWeight:700, color:T.purple }}>{contactList.filter(c => c.type === "partner").length}</div>
                <div style={{ fontSize:11, color:T.mute }}>Partners</div>
              </div>
            </div>
          </Card>
          <Card>
            <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>💡 Recommendations</div>
            <div style={{ fontSize:12, color:T.sub, lineHeight:1.6 }}>
              {contactList.length < 3 && <div>• Build your contact network — aim for at least 3 program officers</div>}
              {agencies.filter(a => a.contacts.length === 0).length > 0 && <div>• Add contacts for: {agencies.filter(a => a.contacts.length === 0).map(a => a.name).join(", ")}</div>}
              {grants.filter(g => g.stage === "declined").length > 0 && <div>• Review declined grants and reach out to program officers for feedback</div>}
              {contactList.length >= 5 && <div>• Strong network! Consider nurturing existing relationships with regular check-ins</div>}
            </div>
          </Card>
        </div>
      )}

      <Modal open={showAddContact} onClose={() => setShowAddContact(false)} title="Add Contact">
        <div style={{ display:"grid", gap:12 }}>
          <Input value={newContact.name} onChange={v => setNewContact({...newContact, name:v})} placeholder="Full name" />
          <Input value={newContact.org} onChange={v => setNewContact({...newContact, org:v})} placeholder="Organization" />
          <Input value={newContact.role} onChange={v => setNewContact({...newContact, role:v})} placeholder="Role / Title" />
          <Input value={newContact.email} onChange={v => setNewContact({...newContact, email:v})} placeholder="Email" />
          <Select value={newContact.type} onChange={v => setNewContact({...newContact, type:v})} options={CONTACT_TYPES.map(t => ({ value:t.id, label:t.label }))} />
          <TextArea value={newContact.notes} onChange={v => setNewContact({...newContact, notes:v})} rows={2} placeholder="Notes..." />
          <Btn variant="primary" onClick={addContact}>Add Contact</Btn>
        </div>
      </Modal>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════
// MODULE: AI DRAFTER
// ════════════════════════════════════════════════════════════════════════
const AIDrafter = ({ grants, vaultDocs }) => {
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [docType, setDocType] = useState("narrative");
  const [selectedGrant, setSelectedGrant] = useState("");
  const [refinements, setRefinements] = useState([]);

  const draft = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    const grant = grants.find(g => g.id === selectedGrant);
    const context = buildPortfolioContext(grants, vaultDocs, []);
    const sys = `You are an expert grant writer. ${context}\n\nWrite in a professional, compelling tone. Use specific data and evidence. Make claims measurable.`;
    const userMsg = `Draft a ${docType} section${grant ? ` for "${grant.title}"` : ""}:\n\n${prompt}`;
    const result = await API.callAI([{ role:"user", content: userMsg }], sys);
    if (result.error) setOutput(`Error: ${result.error}`);
    else setOutput(result.text);
    setLoading(false);
  };

  const refine = async (instruction) => {
    if (!output) return;
    setLoading(true);
    const sys = `You are an expert grant writer. Refine the following draft based on the instruction given.`;
    const result = await API.callAI([
      { role:"user", content: `Current draft:\n\n${output}\n\nRefinement instruction: ${instruction}` },
    ], sys);
    if (!result.error) {
      setRefinements([...refinements, { instruction, before: output, after: result.text }]);
      setOutput(result.text);
    }
    setLoading(false);
  };

  return (
    <div>
      <Card style={{ marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>✍️ AI Grant Drafter</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
          <Select value={docType} onChange={setDocType} options={[
            { value:"narrative", label:"📝 Project Narrative" }, { value:"need", label:"📊 Statement of Need" },
            { value:"budget", label:"💰 Budget Justification" }, { value:"abstract", label:"📋 Abstract" },
            { value:"evaluation", label:"📈 Evaluation Plan" }, { value:"sustainability", label:"🔄 Sustainability Plan" },
            { value:"letter", label:"✉️ Letter of Support" }, { value:"cover", label:"📄 Cover Letter" },
          ]} />
          <Select value={selectedGrant} onChange={setSelectedGrant}
            options={[{ value:"", label:"No specific grant" }, ...grants.map(g => ({ value:g.id, label:g.title?.slice(0,40) }))]} />
        </div>
        <TextArea value={prompt} onChange={setPrompt} rows={4} placeholder="Describe what you need drafted. Be specific about the audience, requirements, and key points to include..." />
        <Btn variant="primary" onClick={draft} disabled={loading} style={{ marginTop:8 }}>{loading ? "⏳ Drafting..." : "✨ Generate Draft"}</Btn>
      </Card>

      {output && (
        <Card>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div style={{ fontSize:13, fontWeight:600, color:T.text }}>📄 Draft Output</div>
            <div style={{ display:"flex", gap:4 }}>
              <Btn size="sm" variant="ghost" onClick={() => navigator.clipboard?.writeText(output)}>📋 Copy</Btn>
              <Btn size="sm" variant="ghost" onClick={() => setOutput("")}>✕ Clear</Btn>
            </div>
          </div>
          <div style={{ fontSize:13, color:T.text, lineHeight:1.7, whiteSpace:"pre-wrap", padding:12, background:T.panel, borderRadius:6, maxHeight:400, overflow:"auto" }}>{output}</div>
          <div style={{ marginTop:12 }}>
            <div style={{ fontSize:11, color:T.mute, marginBottom:6 }}>Quick Refinements</div>
            <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
              {["Make more concise", "Add data/metrics", "More professional tone", "Add budget justification", "Strengthen impact claims", "Add evaluation criteria"].map(r => (
                <Btn key={r} size="sm" variant="ghost" onClick={() => refine(r)} disabled={loading}>{r}</Btn>
              ))}
            </div>
          </div>
          {refinements.length > 0 && (
            <div style={{ marginTop:12, fontSize:10, color:T.dim }}>
              {refinements.length} refinement{refinements.length > 1 ? "s" : ""} applied
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════
// MODULE: SETTINGS
// ════════════════════════════════════════════════════════════════════════
const Settings = () => {
  const [apiKey, setApiKey] = useState(LS.get("anthropic_key", ""));
  const [saved, setSaved] = useState(false);

  const save = () => {
    LS.set("anthropic_key", apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const clearData = () => {
    if (confirm("⚠️ This will delete ALL your grant data, documents, and contacts. Are you sure?")) {
      ["grants","vault_docs","contacts","events","runway"].forEach(k => LS.del(k));
      location.reload();
    }
  };

  return (
    <div>
      <Card style={{ marginBottom:16 }}>
        <div style={{ fontSize:14, fontWeight:600, color:T.text, marginBottom:12 }}>🔑 AI Configuration</div>
        <div style={{ fontSize:12, color:T.sub, marginBottom:8 }}>Enter your Anthropic API key to enable AI-powered features (drafter, analysis, chat).</div>
        <div style={{ display:"flex", gap:8 }}>
          <Input type="password" value={apiKey} onChange={setApiKey} placeholder="sk-ant-..." style={{ flex:1 }} />
          <Btn variant="primary" onClick={save}>{saved ? "✅ Saved!" : "💾 Save"}</Btn>
        </div>
        <div style={{ fontSize:11, color:T.mute, marginTop:8 }}>Your key is stored locally in your browser only. Never sent to any server.</div>
      </Card>

      <Card style={{ marginBottom:16 }}>
        <div style={{ fontSize:14, fontWeight:600, color:T.text, marginBottom:12 }}>👤 Profile</div>
        <div style={{ fontSize:12, color:T.sub }}>
          <div>Name: {PROFILE.name}</div>
          <div>Location: {PROFILE.loc}</div>
          <div>Tags: {PROFILE.tags.join(", ")}</div>
          <div>Businesses: {PROFILE.businesses.length}</div>
        </div>
      </Card>

      <Card style={{ marginBottom:16 }}>
        <div style={{ fontSize:14, fontWeight:600, color:T.text, marginBottom:12 }}>📊 Data Management</div>
        <div style={{ display:"flex", gap:8 }}>
          <Btn size="sm" onClick={() => {
            const data = { grants: LS.get("grants",[]), vault_docs: LS.get("vault_docs",[]), contacts: LS.get("contacts",[]), events: LS.get("events",[]) };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type:"application/json" });
            const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `grant-platform-backup-${new Date().toISOString().split("T")[0]}.json`; a.click();
          }}>📥 Export All Data</Btn>
          <Btn size="sm" variant="danger" onClick={clearData}>🗑️ Clear All Data</Btn>
        </div>
      </Card>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════
// MODULE: AI CHAT BAR
// ════════════════════════════════════════════════════════════════════════
const AIChatBar = ({ grants, vaultDocs, contacts }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role:"user", content:userMsg }]);
    setLoading(true);

    const context = buildPortfolioContext(grants, vaultDocs, contacts);
    const sys = `You are the UNLESS Grant Platform AI assistant. ${context}\n\nHelp the user with grant strategy, writing, analysis, and planning. Be specific, actionable, and reference their actual portfolio data.`;
    const history = [...messages.slice(-10), { role:"user", content:userMsg }];
    const result = await API.callAI(history, sys);

    setMessages(prev => [...prev, { role:"assistant", content: result.error ? `Error: ${result.error}` : result.text }]);
    setLoading(false);
  };

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  if (!open) return (
    <button onClick={() => setOpen(true)} style={{
      position:"fixed", bottom:20, right:20, width:52, height:52, borderRadius:"50%",
      background:T.amber, border:"none", cursor:"pointer", fontSize:22, display:"flex",
      alignItems:"center", justifyContent:"center", boxShadow:`0 4px 20px ${T.amber}44`, zIndex:999,
    }}>🧠</button>
  );

  return (
    <div style={{
      position:"fixed", bottom:20, right:20, width:380, height:500, background:T.panel,
      border:`1px solid ${T.border}`, borderRadius:12, display:"flex", flexDirection:"column",
      boxShadow:`0 8px 40px rgba(0,0,0,0.5)`, zIndex:999,
    }}>
      <div style={{ padding:"12px 16px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:13, fontWeight:600, color:T.text }}>🧠 AI Assistant</span>
        <button onClick={() => setOpen(false)} style={{ background:"none", border:"none", color:T.mute, cursor:"pointer" }}>✕</button>
      </div>
      <div ref={chatRef} style={{ flex:1, overflow:"auto", padding:12 }}>
        {messages.length === 0 && (
          <div style={{ padding:16, textAlign:"center" }}>
            <div style={{ fontSize:14, color:T.sub, marginBottom:12 }}>What can I help with?</div>
            {["What should I prioritize?", "Which grants am I most likely to win?", "Draft an executive summary", "What documents am I missing?"].map(s => (
              <Btn key={s} size="sm" variant="ghost" onClick={() => { setInput(s); }} style={{ margin:2 }}>{s}</Btn>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom:8, textAlign: m.role === "user" ? "right" : "left" }}>
            <div style={{
              display:"inline-block", maxWidth:"85%", padding:"8px 12px", borderRadius:10,
              background: m.role === "user" ? T.amber+"22" : T.card,
              color: T.text, fontSize:12, lineHeight:1.5, whiteSpace:"pre-wrap",
            }}>{m.content}</div>
          </div>
        ))}
        {loading && <div style={{ fontSize:12, color:T.mute, textAlign:"center" }}>⏳ Thinking...</div>}
      </div>
      <div style={{ padding:8, borderTop:`1px solid ${T.border}`, display:"flex", gap:8 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Ask about your grants..." style={{ flex:1, padding:"8px 12px", background:T.card, border:`1px solid ${T.border}`, borderRadius:6, color:T.text, fontSize:12, outline:"none" }} />
        <button onClick={send} disabled={loading} style={{ background:T.amber, border:"none", borderRadius:6, padding:"8px 12px", cursor:"pointer", color:"#0a0e14", fontWeight:600, fontSize:12 }}>→</button>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════
// MODULE: WIN/LOSS ANALYSIS
// ════════════════════════════════════════════════════════════════════════
const WinLossAnalysis = ({ grants }) => {
  const awarded = grants.filter(g => ["awarded","active","closeout"].includes(g.stage));
  const declined = grants.filter(g => g.stage === "declined");
  const total = awarded.length + declined.length;
  const winRate = total > 0 ? (awarded.length / total) * 100 : 0;

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:8, marginBottom:16 }}>
        <Card><Stat label="Won" value={awarded.length} color={T.green} /></Card>
        <Card><Stat label="Lost" value={declined.length} color={T.red} /></Card>
        <Card><Stat label="Win Rate" value={pct(winRate)} color={winRate > 50 ? T.green : T.yellow} /></Card>
        <Card><Stat label="Total Decided" value={total} color={T.amber} /></Card>
      </div>

      <Card style={{ marginBottom:12 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>🏆 Awarded Grants</div>
        {awarded.length === 0 ? <div style={{ color:T.mute, fontSize:12 }}>No awards yet — keep applying!</div> :
          awarded.map(g => (
            <div key={g.id} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:`1px solid ${T.border}` }}>
              <span style={{ fontSize:12, color:T.text }}>{g.title?.slice(0, 40)}</span>
              <span style={{ fontSize:12, fontWeight:600, color:T.green }}>{fmt(g.amount || 0)}</span>
            </div>
          ))
        }
      </Card>

      <Card>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>❌ Declined Grants</div>
        {declined.length === 0 ? <div style={{ color:T.mute, fontSize:12 }}>No declined grants on record</div> :
          declined.map(g => (
            <div key={g.id} style={{ padding:"8px 0", borderBottom:`1px solid ${T.border}` }}>
              <div style={{ fontSize:12, color:T.text }}>{g.title?.slice(0, 50)}</div>
              <div style={{ fontSize:11, color:T.mute, marginTop:2 }}>{g.agency} · {fmt(g.amount || 0)}</div>
              {g.notes && <div style={{ fontSize:11, color:T.sub, marginTop:4, fontStyle:"italic" }}>Notes: {g.notes}</div>}
            </div>
          ))
        }
      </Card>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════
// MODULE: IMPACT PORTFOLIO
// ════════════════════════════════════════════════════════════════════════
const ImpactPortfolio = ({ grants }) => {
  const awarded = grants.filter(g => ["awarded", "active"].includes(g.stage));
  const totalFunded = awarded.reduce((s, g) => s + (g.amount || 0), 0);

  return (
    <div>
      <Card style={{ marginBottom:16 }}>
        <div style={{ fontSize:14, fontWeight:600, color:T.text, marginBottom:12 }}>📊 Impact Summary</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:12 }}>
          <Stat label="Grants Active" value={awarded.length} color={T.green} />
          <Stat label="Total Funded" value={fmt(totalFunded)} color={T.amber} />
          <Stat label="Businesses Served" value={PROFILE.businesses.filter(b => b.st === "active").length} color={T.blue} />
        </div>
      </Card>

      <Card style={{ marginBottom:12 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>🎯 By Business Sector</div>
        {PROFILE.businesses.filter(b => b.st === "active").map(b => (
          <div key={b.n} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:`1px solid ${T.border}` }}>
            <div>
              <div style={{ fontSize:12, color:T.text }}>{b.n}</div>
              <div style={{ fontSize:10, color:T.mute }}>{b.sec} · {b.d.slice(0, 50)}</div>
            </div>
            <Badge color={T.green}>{b.st}</Badge>
          </div>
        ))}
      </Card>

      <Card>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>📝 Founder Narrative</div>
        <div style={{ fontSize:12, color:T.sub, lineHeight:1.7 }}>{PROFILE.narratives.founder}</div>
        <div style={{ fontSize:12, color:T.sub, lineHeight:1.7, marginTop:8 }}>{PROFILE.narratives.need}</div>
        <div style={{ fontSize:12, color:T.sub, lineHeight:1.7, marginTop:8 }}>{PROFILE.narratives.impact}</div>
        <Btn size="sm" variant="ghost" style={{ marginTop:8 }} onClick={() => navigator.clipboard?.writeText(`${PROFILE.narratives.founder}\n\n${PROFILE.narratives.need}\n\n${PROFILE.narratives.impact}`)}>📋 Copy All Narratives</Btn>
      </Card>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════
// MODULE: RFP PARSER (AI-Powered)
// ════════════════════════════════════════════════════════════════════════
const RFPParser = ({ grants, onUpdate }) => {
  const [rawText, setRawText] = useState("");
  const [parsed, setParsed] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedGrant, setSelectedGrant] = useState("");

  const parse = async () => {
    if (!rawText.trim()) return;
    setLoading(true);
    const sys = `You are an expert at parsing grant RFPs (Requests for Proposals). Extract structured information from the RFP text provided. Return a JSON object with these fields:
    - title: string
    - agency: string
    - deadline: string (ISO date if found)
    - amount_min: number
    - amount_max: number
    - eligibility: string[] (list of eligibility requirements)
    - required_docs: string[] (list of required documents)
    - evaluation_criteria: {criterion: string, weight: number}[] (scoring criteria with weights)
    - key_dates: {event: string, date: string}[] (important dates)
    - sections_required: string[] (required proposal sections)
    - match_areas: string[] (subject/focus areas)
    - page_limits: {section: string, pages: number}[] (page limits if specified)
    - contacts: {name: string, email: string, role: string}[] (contact info)
    - cfda_number: string (if applicable)
    - special_notes: string[] (anything else important)
    Respond with ONLY the JSON, no markdown formatting.`;
    const result = await API.callAI([{ role:"user", content: `Parse this RFP:\n\n${rawText}` }], sys);
    if (result.error) { setParsed({ error: result.error }); }
    else {
      try {
        const cleaned = result.text.replace(/```json\n?|```/g, "").trim();
        setParsed(JSON.parse(cleaned));
      } catch { setParsed({ raw: result.text }); }
    }
    setLoading(false);
  };

  const applyToGrant = () => {
    if (!parsed || !selectedGrant) return;
    const updates = {};
    if (parsed.title) updates.title = parsed.title;
    if (parsed.agency) updates.agency = parsed.agency;
    if (parsed.deadline) updates.deadline = parsed.deadline;
    if (parsed.amount_max) updates.amount = parsed.amount_max;
    if (parsed.required_docs) updates.requiredDocs = parsed.required_docs;
    if (parsed.evaluation_criteria) updates.evalCriteria = parsed.evaluation_criteria;
    if (parsed.sections_required) updates.sections = parsed.sections_required;
    onUpdate(selectedGrant, updates);
  };

  return (
    <div>
      <Card style={{ marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>📑 AI-Powered RFP Parser</div>
        <div style={{ fontSize:12, color:T.sub, marginBottom:8 }}>Paste an RFP, NOFO, or grant announcement below. The AI will extract structured requirements, deadlines, scoring criteria, and required documents.</div>
        <TextArea value={rawText} onChange={setRawText} rows={10} placeholder="Paste the full RFP/NOFO text here..." />
        <div style={{ display:"flex", gap:8, marginTop:8 }}>
          <Btn variant="primary" onClick={parse} disabled={loading}>{loading ? "⏳ Parsing..." : "🔍 Parse RFP"}</Btn>
          <Btn variant="ghost" onClick={() => { setRawText(""); setParsed(null); }}>Clear</Btn>
        </div>
      </Card>

      {parsed && !parsed.error && !parsed.raw && (
        <div>
          {/* Overview */}
          <Card style={{ marginBottom:12 }}>
            <div style={{ fontSize:14, fontWeight:600, color:T.text, marginBottom:8 }}>{parsed.title || "Parsed RFP"}</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
              <div><span style={{ fontSize:10, color:T.mute }}>Agency</span><div style={{ fontSize:12, color:T.text }}>{parsed.agency || "—"}</div></div>
              <div><span style={{ fontSize:10, color:T.mute }}>Deadline</span><div style={{ fontSize:12, color: parsed.deadline ? T.red : T.mute }}>{parsed.deadline ? fmtDate(parsed.deadline) : "—"}</div></div>
              <div><span style={{ fontSize:10, color:T.mute }}>Funding Range</span><div style={{ fontSize:12, color:T.green }}>{parsed.amount_min ? `${fmt(parsed.amount_min)} – ${fmt(parsed.amount_max)}` : parsed.amount_max ? fmt(parsed.amount_max) : "—"}</div></div>
            </div>
            {parsed.cfda_number && <div style={{ fontSize:11, color:T.blue, marginTop:8 }}>CFDA: {parsed.cfda_number}</div>}
          </Card>

          {/* Eligibility */}
          {parsed.eligibility?.length > 0 && (
            <Card style={{ marginBottom:12 }}>
              <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:8 }}>✅ Eligibility Requirements</div>
              {parsed.eligibility.map((e, i) => {
                const profileMatch = PROFILE.tags.some(t => e.toLowerCase().includes(t.replace(/-/g," ")));
                return (
                  <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:8, padding:"4px 0", borderBottom:`1px solid ${T.border}` }}>
                    <span style={{ color: profileMatch ? T.green : T.yellow, fontSize:14 }}>{profileMatch ? "✅" : "⚠️"}</span>
                    <span style={{ fontSize:12, color:T.text }}>{e}</span>
                  </div>
                );
              })}
            </Card>
          )}

          {/* Required Documents */}
          {parsed.required_docs?.length > 0 && (
            <Card style={{ marginBottom:12 }}>
              <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:8 }}>📄 Required Documents</div>
              {parsed.required_docs.map((d, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:8, padding:"4px 0", fontSize:12, color:T.text, borderBottom:`1px solid ${T.border}` }}>
                  <span style={{ color:T.mute }}>☐</span> {d}
                </div>
              ))}
            </Card>
          )}

          {/* Evaluation Criteria */}
          {parsed.evaluation_criteria?.length > 0 && (
            <Card style={{ marginBottom:12 }}>
              <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:8 }}>📊 Evaluation Criteria</div>
              {parsed.evaluation_criteria.map((c, i) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:`1px solid ${T.border}` }}>
                  <span style={{ fontSize:12, color:T.text }}>{c.criterion}</span>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <Progress value={c.weight} max={100} color={T.amber} height={4} />
                    <Badge color={T.amber}>{c.weight}pts</Badge>
                  </div>
                </div>
              ))}
            </Card>
          )}

          {/* Sections Required */}
          {parsed.sections_required?.length > 0 && (
            <Card style={{ marginBottom:12 }}>
              <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:8 }}>📋 Required Sections</div>
              <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                {parsed.sections_required.map((s, i) => <Badge key={i} color={T.blue}>{s}</Badge>)}
              </div>
              {parsed.page_limits?.length > 0 && (
                <div style={{ marginTop:8 }}>
                  {parsed.page_limits.map((p, i) => <div key={i} style={{ fontSize:11, color:T.mute }}>{p.section}: {p.pages} pages max</div>)}
                </div>
              )}
            </Card>
          )}

          {/* Key Dates */}
          {parsed.key_dates?.length > 0 && (
            <Card style={{ marginBottom:12 }}>
              <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:8 }}>📅 Key Dates</div>
              {parsed.key_dates.map((d, i) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", fontSize:12, borderBottom:`1px solid ${T.border}` }}>
                  <span style={{ color:T.text }}>{d.event}</span>
                  <span style={{ color:T.amber }}>{d.date}</span>
                </div>
              ))}
            </Card>
          )}

          {/* Apply to Grant */}
          <Card>
            <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:8 }}>🔗 Apply to Existing Grant</div>
            <div style={{ display:"flex", gap:8 }}>
              <Select value={selectedGrant} onChange={setSelectedGrant}
                options={[{ value:"", label:"Select a grant..." }, ...grants.map(g => ({ value:g.id, label:g.title?.slice(0,50) }))]} style={{ flex:1 }} />
              <Btn variant="primary" size="sm" onClick={applyToGrant} disabled={!selectedGrant}>Apply Data</Btn>
            </div>
          </Card>
        </div>
      )}

      {parsed?.error && <Card><div style={{ color:T.red, fontSize:12 }}>Error: {parsed.error}</div></Card>}
      {parsed?.raw && <Card><div style={{ fontSize:12, color:T.sub, whiteSpace:"pre-wrap" }}>{parsed.raw}</div></Card>}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════
// MODULE: MATCH SCORER & AI DEEP ANALYSIS
// ════════════════════════════════════════════════════════════════════════
const MatchScorer = ({ grants }) => {
  const [analyses, setAnalyses] = useState(() => LS.get("match_analyses", {}));
  const [loading, setLoading] = useState(null);

  const quickScore = (grant) => {
    let score = 0;
    const text = `${grant.title} ${grant.description} ${grant.category} ${grant.agency}`.toLowerCase();
    const boosts = [
      { terms:["rural","underserved"], pts:15 }, { terms:["disability","disabled","ada"], pts:15 },
      { terms:["small business","entrepreneur","sbir","sttr"], pts:12 }, { terms:["technology","ai","innovation","tech"], pts:10 },
      { terms:["poverty","low-income","economically disadvantaged"], pts:12 }, { terms:["illinois","midwest"], pts:8 },
      { terms:["workforce","employment","training"], pts:8 }, { terms:["community development","capacity building"], pts:8 },
      { terms:["agriculture","aquaculture","farming"], pts:6 }, { terms:["music","arts","creative"], pts:5 },
    ];
    boosts.forEach(b => { if (b.terms.some(t => text.includes(t))) score += b.pts; });
    return Math.min(score, 100);
  };

  const deepAnalysis = async (grant) => {
    setLoading(grant.id);
    const context = `APPLICANT PROFILE:
- Name: ${PROFILE.name}, Location: ${PROFILE.loc}
- Demographics: Rural (${PROFILE.rural}), Disabled (${PROFILE.disabled}), Below Poverty (${PROFILE.poverty})
- Tags: ${PROFILE.tags.join(", ")}
- Businesses: ${PROFILE.businesses.map(b => `${b.n} (${b.sec}: ${b.d})`).join("; ")}`;

    const sys = `You are a grant strategy expert. Analyze how well this grant opportunity matches the applicant profile. Provide:
1. Overall match score (0-100)
2. 3-5 key strengths (why this is a good fit)
3. 2-3 gaps or concerns
4. Specific recommendations for the application
5. Suggested angle/narrative approach
Be specific and actionable. Reference the applicant's actual profile data.`;

    const result = await API.callAI([{ role:"user", content: `${context}\n\nGRANT OPPORTUNITY:\nTitle: ${grant.title}\nAgency: ${grant.agency}\nAmount: ${fmt(grant.amount || 0)}\nDescription: ${grant.description || "No description"}\nCategory: ${grant.category || "General"}\n\nAnalyze the fit.` }], sys);

    const newAnalyses = { ...analyses, [grant.id]: { text: result.error || result.text, date: new Date().toISOString() } };
    setAnalyses(newAnalyses);
    LS.set("match_analyses", newAnalyses);
    setLoading(null);
  };

  const scored = grants.map(g => ({ ...g, quickScore: quickScore(g) })).sort((a,b) => b.quickScore - a.quickScore);

  return (
    <div>
      <Card style={{ marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:4 }}>🎯 Grant-Profile Match Analysis</div>
        <div style={{ fontSize:11, color:T.sub }}>Quick scores are keyword-based. Deep Analysis uses AI to evaluate semantic fit against your full profile.</div>
      </Card>

      {scored.length === 0 ? <Empty icon="🎯" title="No grants to analyze" sub="Add grants from Discovery to see match scores" /> :
        scored.map(g => (
          <Card key={g.id} style={{ marginBottom:8 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color:T.text }}>{g.title?.slice(0,55)}</div>
                <div style={{ fontSize:11, color:T.mute, marginTop:2 }}>{g.agency} · {STAGE_MAP[g.stage]?.label}</div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:18, fontWeight:700, color: g.quickScore >= 60 ? T.green : g.quickScore >= 30 ? T.yellow : T.red }}>{g.quickScore}</div>
                  <div style={{ fontSize:9, color:T.mute }}>Quick</div>
                </div>
                <Btn size="sm" variant="default" onClick={() => deepAnalysis(g)} disabled={loading === g.id}>
                  {loading === g.id ? "⏳" : "🧠"} Deep
                </Btn>
              </div>
            </div>
            <Progress value={g.quickScore} max={100} color={g.quickScore >= 60 ? T.green : g.quickScore >= 30 ? T.yellow : T.red} height={4} />
            {analyses[g.id] && (
              <div style={{ marginTop:12, padding:12, background:T.panel, borderRadius:6, fontSize:12, color:T.sub, lineHeight:1.6, whiteSpace:"pre-wrap", maxHeight:300, overflow:"auto" }}>
                {analyses[g.id].text}
                <div style={{ fontSize:10, color:T.dim, marginTop:8 }}>Analyzed {fmtDate(analyses[g.id].date)}</div>
              </div>
            )}
          </Card>
        ))
      }
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════
// MODULE: COMPLIANCE TRACKER
// ════════════════════════════════════════════════════════════════════════
const ComplianceTracker = ({ grants, updateGrant }) => {
  const [selectedId, setSelectedId] = useState(null);

  const activeGrants = grants.filter(g => ["awarded","active","preparing","drafting","submitted"].includes(g.stage));

  const DEFAULT_CHECKLIST = [
    { id:"sam", label:"SAM.gov Registration Active", category:"registration", critical:true },
    { id:"uei", label:"UEI Number Obtained", category:"registration", critical:true },
    { id:"duns", label:"DUNS Number (if applicable)", category:"registration", critical:false },
    { id:"sf424", label:"SF-424 Application Form", category:"forms", critical:true },
    { id:"sf424a", label:"SF-424A Budget Form", category:"forms", critical:true },
    { id:"narrative", label:"Project Narrative Complete", category:"content", critical:true },
    { id:"budget", label:"Budget & Justification", category:"content", critical:true },
    { id:"need", label:"Statement of Need", category:"content", critical:true },
    { id:"eval", label:"Evaluation Plan", category:"content", critical:false },
    { id:"sustain", label:"Sustainability Plan", category:"content", critical:false },
    { id:"timeline", label:"Project Timeline / Milestones", category:"content", critical:true },
    { id:"letters", label:"Letters of Support/Commitment", category:"support", critical:false },
    { id:"resume", label:"Key Personnel Resumes", category:"support", critical:true },
    { id:"org_chart", label:"Organizational Chart", category:"support", critical:false },
    { id:"financial", label:"Financial Statements / Audit", category:"compliance", critical:false },
    { id:"assurances", label:"Certifications & Assurances", category:"compliance", critical:true },
    { id:"conflict", label:"Conflict of Interest Policy", category:"compliance", critical:false },
    { id:"indirect", label:"Indirect Cost Rate Agreement", category:"compliance", critical:false },
    { id:"review", label:"Internal Review Complete", category:"qa", critical:true },
    { id:"proofread", label:"Proofread & Formatted", category:"qa", critical:true },
  ];

  const getChecklist = (grant) => grant.checklist || DEFAULT_CHECKLIST.map(c => ({ ...c, done:false }));
  const getProgress = (grant) => {
    const cl = getChecklist(grant);
    return cl.length > 0 ? (cl.filter(c => c.done).length / cl.length) * 100 : 0;
  };
  const getCriticalProgress = (grant) => {
    const cl = getChecklist(grant).filter(c => c.critical);
    return cl.length > 0 ? (cl.filter(c => c.done).length / cl.length) * 100 : 0;
  };

  const toggleItem = (grantId, itemId) => {
    const grant = grants.find(g => g.id === grantId);
    if (!grant) return;
    const cl = getChecklist(grant);
    const updated = cl.map(c => c.id === itemId ? { ...c, done: !c.done } : c);
    updateGrant(grantId, { checklist: updated });
  };

  const selected = selectedId ? grants.find(g => g.id === selectedId) : null;
  const CATEGORIES = { registration:"🏛️ Registration", forms:"📝 Forms", content:"📄 Content", support:"🤝 Support", compliance:"✅ Compliance", qa:"🔍 Quality" };

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(140px, 1fr))", gap:8, marginBottom:16 }}>
        <Card><Stat label="Active Grants" value={activeGrants.length} color={T.blue} /></Card>
        <Card><Stat label="Fully Compliant" value={activeGrants.filter(g => getProgress(g) === 100).length} color={T.green} /></Card>
        <Card><Stat label="Need Attention" value={activeGrants.filter(g => getCriticalProgress(g) < 100).length} color={T.yellow} /></Card>
      </div>

      {activeGrants.length === 0 ? <Empty icon="✅" title="No active grants to track" sub="Compliance tracking begins when grants enter preparation" /> :
        <div style={{ display:"grid", gridTemplateColumns:"300px 1fr", gap:16 }}>
          {/* Grant List */}
          <div>
            {activeGrants.map(g => {
              const prog = getProgress(g);
              const critProg = getCriticalProgress(g);
              return (
                <Card key={g.id} onClick={() => setSelectedId(g.id)} style={{ marginBottom:8, cursor:"pointer", borderColor: selectedId === g.id ? T.amber+"66" : T.border }}>
                  <div style={{ fontSize:12, fontWeight:600, color:T.text, marginBottom:4 }}>{g.title?.slice(0,35)}</div>
                  <div style={{ fontSize:10, color:T.mute, marginBottom:6 }}>{STAGE_MAP[g.stage]?.icon} {STAGE_MAP[g.stage]?.label}</div>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:T.sub, marginBottom:3 }}>
                    <span>Overall</span><span style={{ color: prog === 100 ? T.green : T.yellow }}>{pct(prog)}</span>
                  </div>
                  <Progress value={prog} max={100} color={prog === 100 ? T.green : T.amber} height={4} />
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:T.sub, marginBottom:3, marginTop:4 }}>
                    <span>Critical</span><span style={{ color: critProg === 100 ? T.green : T.red }}>{pct(critProg)}</span>
                  </div>
                  <Progress value={critProg} max={100} color={critProg === 100 ? T.green : T.red} height={4} />
                </Card>
              );
            })}
          </div>

          {/* Checklist Detail */}
          <Card>
            {!selected ? <div style={{ color:T.mute, fontSize:12, textAlign:"center", padding:40 }}>Select a grant to view checklist</div> :
              <div>
                <div style={{ fontSize:14, fontWeight:600, color:T.text, marginBottom:12 }}>{selected.title?.slice(0,50)}</div>
                {Object.entries(CATEGORIES).map(([catId, catLabel]) => {
                  const items = getChecklist(selected).filter(c => c.category === catId);
                  if (items.length === 0) return null;
                  return (
                    <div key={catId} style={{ marginBottom:16 }}>
                      <div style={{ fontSize:12, fontWeight:600, color:T.amber, marginBottom:6 }}>{catLabel}</div>
                      {items.map(item => (
                        <div key={item.id} onClick={() => toggleItem(selected.id, item.id)} style={{
                          display:"flex", alignItems:"center", gap:8, padding:"6px 8px", borderRadius:4, cursor:"pointer",
                          background: item.done ? T.green+"08" : "transparent", marginBottom:2,
                        }}>
                          <span style={{ fontSize:14, color: item.done ? T.green : T.mute }}>{item.done ? "☑" : "☐"}</span>
                          <span style={{ fontSize:12, color: item.done ? T.sub : T.text, textDecoration: item.done ? "line-through" : "none", flex:1 }}>{item.label}</span>
                          {item.critical && <Badge color={T.red} style={{ fontSize:9 }}>CRITICAL</Badge>}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            }
          </Card>
        </div>
      }
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════
// MODULE: AWARD MANAGEMENT
// ════════════════════════════════════════════════════════════════════════
const AwardManagement = ({ grants, updateGrant }) => {
  const awarded = grants.filter(g => ["awarded","active","closeout"].includes(g.stage));
  const [selectedId, setSelectedId] = useState(null);
  const selected = selectedId ? grants.find(g => g.id === selectedId) : null;

  const getAwardData = (grant) => grant.awardData || {
    awardDate: "", awardNumber: "", totalAmount: grant.amount || 0,
    spentToDate: 0, reportsDue: [], milestones: [], modifications: [],
    period: { start:"", end:"" }, drawdowns: [],
  };

  const updateAwardData = (grantId, updates) => {
    const grant = grants.find(g => g.id === grantId);
    if (!grant) return;
    updateGrant(grantId, { awardData: { ...getAwardData(grant), ...updates } });
  };

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(140px, 1fr))", gap:8, marginBottom:16 }}>
        <Card><Stat label="Active Awards" value={awarded.length} color={T.green} /></Card>
        <Card><Stat label="Total Awarded" value={fmt(awarded.reduce((s,g) => s + (g.amount||0), 0))} color={T.amber} /></Card>
        <Card><Stat label="Total Spent" value={fmt(awarded.reduce((s,g) => s + (getAwardData(g).spentToDate||0), 0))} color={T.blue} /></Card>
        <Card><Stat label="Remaining" value={fmt(awarded.reduce((s,g) => s + ((g.amount||0) - (getAwardData(g).spentToDate||0)), 0))} color={T.purple} /></Card>
      </div>

      {awarded.length === 0 ? <Empty icon="🏆" title="No awards yet" sub="Awards will appear here when grants are marked as awarded" /> :
        <div>
          {awarded.map(g => {
            const ad = getAwardData(g);
            const burnRate = ad.totalAmount > 0 ? (ad.spentToDate / ad.totalAmount) * 100 : 0;
            return (
              <Card key={g.id} style={{ marginBottom:12, cursor:"pointer" }} onClick={() => setSelectedId(g.id === selectedId ? null : g.id)}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:T.text }}>{g.title?.slice(0,45)}</div>
                    <div style={{ fontSize:11, color:T.mute }}>{g.agency} · {STAGE_MAP[g.stage]?.label}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:14, fontWeight:600, color:T.green }}>{fmt(g.amount || 0)}</div>
                    <div style={{ fontSize:10, color:T.mute }}>{pct(burnRate)} spent</div>
                  </div>
                </div>
                <div style={{ marginTop:8 }}>
                  <Progress value={burnRate} max={100} color={burnRate > 90 ? T.red : burnRate > 70 ? T.yellow : T.green} />
                </div>

                {selectedId === g.id && (
                  <div style={{ marginTop:16, borderTop:`1px solid ${T.border}`, paddingTop:12 }}>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:12 }}>
                      <div>
                        <label style={{ fontSize:10, color:T.mute, display:"block", marginBottom:4 }}>Award Number</label>
                        <Input value={ad.awardNumber} onChange={v => updateAwardData(g.id, { awardNumber:v })} placeholder="e.g., 2024-SBIR-001" />
                      </div>
                      <div>
                        <label style={{ fontSize:10, color:T.mute, display:"block", marginBottom:4 }}>Period Start</label>
                        <Input type="date" value={ad.period?.start || ""} onChange={v => updateAwardData(g.id, { period:{...ad.period, start:v} })} />
                      </div>
                      <div>
                        <label style={{ fontSize:10, color:T.mute, display:"block", marginBottom:4 }}>Period End</label>
                        <Input type="date" value={ad.period?.end || ""} onChange={v => updateAwardData(g.id, { period:{...ad.period, end:v} })} />
                      </div>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                      <div>
                        <label style={{ fontSize:10, color:T.mute, display:"block", marginBottom:4 }}>Total Award Amount</label>
                        <Input type="number" value={ad.totalAmount} onChange={v => updateAwardData(g.id, { totalAmount:Number(v) })} />
                      </div>
                      <div>
                        <label style={{ fontSize:10, color:T.mute, display:"block", marginBottom:4 }}>Spent to Date</label>
                        <Input type="number" value={ad.spentToDate} onChange={v => updateAwardData(g.id, { spentToDate:Number(v) })} />
                      </div>
                    </div>
                    <div style={{ marginTop:8, fontSize:11, color:T.sub }}>
                      Remaining: <strong style={{ color:T.green }}>{fmt(ad.totalAmount - ad.spentToDate)}</strong>
                      {ad.period?.end && ` · ${daysUntil(ad.period.end)} days left in period`}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      }
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════
// MODULE: ACTION PLAN / TASK MANAGER
// ════════════════════════════════════════════════════════════════════════
const ActionPlan = ({ grants }) => {
  const [tasks, setTasks] = useState(() => LS.get("tasks", []));
  const [showAdd, setShowAdd] = useState(false);
  const [newTask, setNewTask] = useState({ title:"", grantId:"", priority:"medium", dueDate:"", status:"todo", notes:"" });
  const [filter, setFilter] = useState("all");

  useEffect(() => { LS.set("tasks", tasks); }, [tasks]);

  const addTask = () => {
    if (!newTask.title) return;
    setTasks(prev => [...prev, { ...newTask, id: uid(), createdAt: new Date().toISOString() }]);
    setNewTask({ title:"", grantId:"", priority:"medium", dueDate:"", status:"todo", notes:"" });
    setShowAdd(false);
  };

  const updateTask = (id, updates) => setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  const deleteTask = (id) => setTasks(prev => prev.filter(t => t.id !== id));

  const PRIORITIES = { high:{ color:T.red, label:"🔴 High" }, medium:{ color:T.yellow, label:"🟡 Medium" }, low:{ color:T.green, label:"🟢 Low" } };
  const STATUSES = { todo:{ color:T.mute, label:"To Do" }, inprogress:{ color:T.blue, label:"In Progress" }, blocked:{ color:T.red, label:"Blocked" }, done:{ color:T.green, label:"Done" } };

  const filtered = tasks.filter(t => {
    if (filter === "all") return true;
    if (filter === "active") return t.status !== "done";
    if (filter === "done") return t.status === "done";
    if (filter === "overdue") return t.dueDate && daysUntil(t.dueDate) < 0 && t.status !== "done";
    return true;
  }).sort((a,b) => {
    const pOrder = { high:0, medium:1, low:2 };
    if (a.status === "done" !== (b.status === "done")) return a.status === "done" ? 1 : -1;
    if (pOrder[a.priority] !== pOrder[b.priority]) return pOrder[a.priority] - pOrder[b.priority];
    if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
    return 0;
  });

  const overdue = tasks.filter(t => t.dueDate && daysUntil(t.dueDate) < 0 && t.status !== "done").length;
  const completed = tasks.filter(t => t.status === "done").length;

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
        <div style={{ display:"flex", gap:8 }}>
          {[{ id:"all", label:`All (${tasks.length})` }, { id:"active", label:"Active" }, { id:"overdue", label:`Overdue (${overdue})` }, { id:"done", label:`Done (${completed})` }].map(f => (
            <Btn key={f.id} size="sm" variant={filter === f.id ? "primary" : "ghost"} onClick={() => setFilter(f.id)}>{f.label}</Btn>
          ))}
        </div>
        <Btn variant="primary" size="sm" onClick={() => setShowAdd(true)}>+ Add Task</Btn>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:8, marginBottom:16 }}>
        <Card><Stat label="Total Tasks" value={tasks.length} color={T.amber} /></Card>
        <Card><Stat label="Completed" value={completed} color={T.green} /></Card>
        <Card><Stat label="In Progress" value={tasks.filter(t=>t.status==="inprogress").length} color={T.blue} /></Card>
        <Card><Stat label="Overdue" value={overdue} color={T.red} /></Card>
      </div>

      {filtered.length === 0 ? <Empty icon="📋" title="No tasks" sub="Create tasks to track your grant workflow" action={<Btn variant="primary" size="sm" onClick={() => setShowAdd(true)}>+ Create Task</Btn>} /> :
        filtered.map(t => {
          const grant = grants.find(g => g.id === t.grantId);
          const isOverdue = t.dueDate && daysUntil(t.dueDate) < 0 && t.status !== "done";
          return (
            <Card key={t.id} style={{ marginBottom:6, borderColor: isOverdue ? T.red+"44" : T.border }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <button onClick={() => updateTask(t.id, { status: t.status === "done" ? "todo" : "done" })}
                  style={{ background:"none", border:"none", cursor:"pointer", fontSize:16, color: t.status === "done" ? T.green : T.mute }}>
                  {t.status === "done" ? "☑" : "☐"}
                </button>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, color: t.status === "done" ? T.mute : T.text, textDecoration: t.status === "done" ? "line-through" : "none" }}>{t.title}</div>
                  <div style={{ display:"flex", gap:6, marginTop:3 }}>
                    {grant && <Badge color={T.blue}>{grant.title?.slice(0,20)}</Badge>}
                    <Badge color={PRIORITIES[t.priority]?.color || T.mute}>{t.priority}</Badge>
                    {t.status !== "todo" && t.status !== "done" && <Badge color={STATUSES[t.status]?.color}>{STATUSES[t.status]?.label}</Badge>}
                  </div>
                </div>
                <div style={{ display:"flex", gap:4, alignItems:"center" }}>
                  {t.dueDate && (
                    <span style={{ fontSize:11, color: isOverdue ? T.red : daysUntil(t.dueDate) <= 3 ? T.yellow : T.mute }}>
                      {isOverdue ? `${Math.abs(daysUntil(t.dueDate))}d overdue` : `${daysUntil(t.dueDate)}d`}
                    </span>
                  )}
                  <Select value={t.status} onChange={v => updateTask(t.id, { status:v })} style={{ fontSize:10, padding:"2px 4px" }}
                    options={Object.entries(STATUSES).map(([k,v]) => ({ value:k, label:v.label }))} />
                  <button onClick={() => deleteTask(t.id)} style={{ background:"none", border:"none", color:T.red, cursor:"pointer", fontSize:12 }}>✕</button>
                </div>
              </div>
            </Card>
          );
        })
      }

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Task">
        <div style={{ display:"grid", gap:12 }}>
          <Input value={newTask.title} onChange={v => setNewTask({...newTask, title:v})} placeholder="Task description" />
          <Select value={newTask.grantId} onChange={v => setNewTask({...newTask, grantId:v})}
            options={[{ value:"", label:"No specific grant" }, ...grants.map(g => ({ value:g.id, label:g.title?.slice(0,50) }))]} />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            <Select value={newTask.priority} onChange={v => setNewTask({...newTask, priority:v})}
              options={[{ value:"high", label:"🔴 High" }, { value:"medium", label:"🟡 Medium" }, { value:"low", label:"🟢 Low" }]} />
            <Input type="date" value={newTask.dueDate} onChange={v => setNewTask({...newTask, dueDate:v})} />
          </div>
          <TextArea value={newTask.notes} onChange={v => setNewTask({...newTask, notes:v})} rows={2} placeholder="Notes..." />
          <Btn variant="primary" onClick={addTask}>Add Task</Btn>
        </div>
      </Modal>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════
// MODULE: CENSUS NARRATIVE GENERATOR
// ════════════════════════════════════════════════════════════════════════
const CensusNarrative = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [narrative, setNarrative] = useState("");
  const [customArea, setCustomArea] = useState("17"); // Illinois FIPS

  const STATES = [
    { fips:"17", name:"Illinois" }, { fips:"06", name:"California" }, { fips:"48", name:"Texas" },
    { fips:"36", name:"New York" }, { fips:"12", name:"Florida" }, { fips:"39", name:"Ohio" },
    { fips:"42", name:"Pennsylvania" }, { fips:"18", name:"Indiana" }, { fips:"29", name:"Missouri" },
  ];

  const loadCensusData = async () => {
    setLoading(true);
    try {
      const fields = "NAME,S1701_C03_001E,S2301_C04_001E,S2801_C01_001E,S1501_C02_019E";
      const result = await API.getCensusData(customArea, fields);
      if (result.length >= 2) {
        const headers = result[0];
        const values = result[1];
        const parsed = {};
        headers.forEach((h, i) => { parsed[h] = values[i]; });
        setData(parsed);
        generateNarrative(parsed);
      }
    } catch (e) { setData({ error: e.message }); }
    setLoading(false);
  };

  const generateNarrative = (censusData) => {
    const state = censusData.NAME || "the target area";
    const poverty = parseFloat(censusData.S1701_C03_001E) || 0;
    const unemployment = parseFloat(censusData.S2301_C04_001E) || 0;
    const broadband = parseFloat(censusData.S2801_C01_001E) || 0;
    const bachelors = parseFloat(censusData.S1501_C02_019E) || 0;

    const povertyStatus = poverty > 15 ? "significantly above" : poverty > 12 ? "above" : "near";
    const unempStatus = unemployment > 6 ? "elevated" : unemployment > 4 ? "moderate" : "relatively stable";
    const broadbandStatus = broadband < 80 ? "limited" : broadband < 90 ? "moderate" : "adequate";

    const text = `STATEMENT OF NEED — ${state}

${state} faces persistent socioeconomic challenges that underscore the critical need for this project. The poverty rate stands at ${poverty.toFixed(1)}%, ${povertyStatus} the national average, indicating that a substantial portion of the population lacks adequate financial resources to meet basic needs. This economic hardship is compounded by an ${unempStatus} unemployment rate of ${unemployment.toFixed(1)}%, reflecting limited employment opportunities particularly in rural and underserved communities.

Digital infrastructure remains a significant barrier, with ${broadbandStatus} broadband access at ${broadband.toFixed(1)}% household penetration. In rural areas like Newton, Illinois — the project's base of operations — this digital divide is even more pronounced, limiting residents' ability to participate in the modern economy, access remote work opportunities, and utilize digital services that urban populations take for granted.

Educational attainment data shows ${bachelors.toFixed(1)}% of the population holds a bachelor's degree or higher, indicating both a workforce development opportunity and the need for innovative approaches to skill-building that don't require traditional four-year pathways.

These intersecting challenges — poverty, unemployment, digital exclusion, and limited educational pathways — create a compounding effect that disproportionately impacts rural communities, disabled individuals, and economically disadvantaged entrepreneurs. The proposed project directly addresses these barriers through technology-enabled solutions that bridge geographic and economic divides, creating sustainable pathways to economic self-sufficiency.

[Data Source: U.S. Census Bureau, American Community Survey 5-Year Estimates, 2022]`;

    setNarrative(text);
  };

  return (
    <div>
      <Card style={{ marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:8 }}>📊 Census-Powered Narrative Generator</div>
        <div style={{ fontSize:12, color:T.sub, marginBottom:12 }}>Generates a data-backed Statement of Need using live Census ACS data. Ready to paste into grant applications.</div>
        <div style={{ display:"flex", gap:8 }}>
          <Select value={customArea} onChange={setCustomArea} options={STATES.map(s => ({ value:s.fips, label:s.name }))} style={{ flex:1 }} />
          <Btn variant="primary" onClick={loadCensusData} disabled={loading}>{loading ? "⏳ Loading..." : "📊 Generate Narrative"}</Btn>
        </div>
      </Card>

      {data && !data.error && (
        <Card style={{ marginBottom:16 }}>
          <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:8 }}>📈 Census Data — {data.NAME}</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:8 }}>
            <div style={{ textAlign:"center", padding:8, background:T.panel, borderRadius:6 }}>
              <div style={{ fontSize:20, fontWeight:700, color: parseFloat(data.S1701_C03_001E) > 15 ? T.red : T.yellow }}>{data.S1701_C03_001E}%</div>
              <div style={{ fontSize:10, color:T.mute }}>Poverty Rate</div>
            </div>
            <div style={{ textAlign:"center", padding:8, background:T.panel, borderRadius:6 }}>
              <div style={{ fontSize:20, fontWeight:700, color: parseFloat(data.S2301_C04_001E) > 6 ? T.red : T.yellow }}>{data.S2301_C04_001E}%</div>
              <div style={{ fontSize:10, color:T.mute }}>Unemployment</div>
            </div>
            <div style={{ textAlign:"center", padding:8, background:T.panel, borderRadius:6 }}>
              <div style={{ fontSize:20, fontWeight:700, color: parseFloat(data.S2801_C01_001E) < 85 ? T.red : T.green }}>{data.S2801_C01_001E}%</div>
              <div style={{ fontSize:10, color:T.mute }}>Broadband Access</div>
            </div>
            <div style={{ textAlign:"center", padding:8, background:T.panel, borderRadius:6 }}>
              <div style={{ fontSize:20, fontWeight:700, color:T.blue }}>{data.S1501_C02_019E}%</div>
              <div style={{ fontSize:10, color:T.mute }}>Bachelor's+</div>
            </div>
          </div>
        </Card>
      )}

      {narrative && (
        <Card>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <div style={{ fontSize:13, fontWeight:600, color:T.text }}>📝 Generated Statement of Need</div>
            <Btn size="sm" variant="ghost" onClick={() => navigator.clipboard?.writeText(narrative)}>📋 Copy</Btn>
          </div>
          <div style={{ fontSize:12, color:T.sub, lineHeight:1.7, whiteSpace:"pre-wrap", padding:12, background:T.panel, borderRadius:6, maxHeight:500, overflow:"auto" }}>{narrative}</div>
        </Card>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════
// MODULE: PEER PROSPECTING
// ════════════════════════════════════════════════════════════════════════
const PeerProspecting = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedPeers, setSavedPeers] = useState(() => LS.get("peers", []));

  useEffect(() => { LS.set("peers", savedPeers); }, [savedPeers]);

  const searchRecipients = async () => {
    if (!query.trim()) return;
    setLoading(true);
    const data = await API.searchUSASpendingRecipients(query);
    setResults(data.results || []);
    setLoading(false);
  };

  const searchSpending = async () => {
    if (!query.trim()) return;
    setLoading(true);
    const data = await API.searchFederalSpending(query);
    setResults((data.results || []).map(r => ({
      recipient_name: r["Recipient Name"] || "Unknown",
      amount: r["Award Amount"] || 0,
      agency: r["Awarding Agency"] || "",
      award_id: r["Award ID"] || "",
      start_date: r["Start Date"] || "",
    })));
    setLoading(false);
  };

  const savePeer = (peer) => {
    if (savedPeers.some(p => p.name === peer.recipient_name)) return;
    setSavedPeers(prev => [...prev, {
      id: uid(), name: peer.recipient_name, amount: peer.amount || 0,
      agency: peer.agency || "", notes: "", savedAt: new Date().toISOString(),
    }]);
  };

  return (
    <div>
      <Card style={{ marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:8 }}>🔎 Peer Prospecting</div>
        <div style={{ fontSize:12, color:T.sub, marginBottom:12 }}>Find organizations similar to yours that have received federal funding. Learn from their strategies and identify potential partners or competitors.</div>
        <div style={{ display:"flex", gap:8, marginBottom:8 }}>
          <Input value={query} onChange={setQuery} placeholder="Search recipients... (e.g., technology, disability services, Newton IL)" style={{ flex:1 }} />
          <Btn variant="primary" onClick={searchRecipients} disabled={loading}>🔍 Recipients</Btn>
          <Btn onClick={searchSpending} disabled={loading}>💰 Awards</Btn>
        </div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {["rural technology", "disability services Illinois", "small business innovation", "workforce development", "community development block"].map(q => (
            <Btn key={q} size="sm" variant="ghost" onClick={() => setQuery(q)}>{q}</Btn>
          ))}
        </div>
      </Card>

      {results.length > 0 && (
        <Card style={{ marginBottom:16 }}>
          <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:8 }}>📋 Search Results ({results.length})</div>
          {results.map((r, i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:`1px solid ${T.border}` }}>
              <div>
                <div style={{ fontSize:12, color:T.text }}>{r.recipient_name}</div>
                <div style={{ fontSize:10, color:T.mute }}>{r.agency || r.uei || ""}{r.amount ? ` · ${fmt(r.amount)}` : ""}</div>
              </div>
              <Btn size="sm" variant="ghost" onClick={() => savePeer(r)}>💾 Save</Btn>
            </div>
          ))}
        </Card>
      )}

      {savedPeers.length > 0 && (
        <Card>
          <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:8 }}>⭐ Saved Peers ({savedPeers.length})</div>
          {savedPeers.map(p => (
            <div key={p.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:`1px solid ${T.border}` }}>
              <div>
                <div style={{ fontSize:12, color:T.text }}>{p.name}</div>
                <div style={{ fontSize:10, color:T.mute }}>{p.agency}{p.amount ? ` · ${fmt(p.amount)}` : ""}</div>
              </div>
              <button onClick={() => setSavedPeers(prev => prev.filter(x => x.id !== p.id))} style={{ background:"none", border:"none", color:T.red, cursor:"pointer" }}>✕</button>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════
// MODULE: REUSABLE SECTION LIBRARY
// ════════════════════════════════════════════════════════════════════════
const SectionLibrary = ({ vaultDocs }) => {
  const [sections, setSections] = useState(() => LS.get("section_library", []));
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [newSection, setNewSection] = useState({ title:"", category:"need", content:"", tags:[], useCount:0 });

  useEffect(() => { LS.set("section_library", sections); }, [sections]);

  const SECTION_TYPES = [
    { id:"need", label:"Statement of Need", icon:"📊" }, { id:"methodology", label:"Methodology", icon:"🔬" },
    { id:"evaluation", label:"Evaluation Plan", icon:"📈" }, { id:"sustainability", label:"Sustainability", icon:"🔄" },
    { id:"capacity", label:"Organizational Capacity", icon:"🏢" }, { id:"timeline", label:"Project Timeline", icon:"📅" },
    { id:"budget_just", label:"Budget Justification", icon:"💰" }, { id:"abstract", label:"Abstract/Summary", icon:"📋" },
    { id:"impact", label:"Impact Statement", icon:"🎯" }, { id:"bio", label:"Key Personnel", icon:"👤" },
    { id:"partnership", label:"Partnerships", icon:"🤝" }, { id:"dissemination", label:"Dissemination Plan", icon:"📢" },
  ];

  const addSection = () => {
    if (!newSection.title || !newSection.content) return;
    setSections(prev => [...prev, { ...newSection, id: uid(), createdAt: new Date().toISOString() }]);
    setNewSection({ title:"", category:"need", content:"", tags:[], useCount:0 });
    setShowAdd(false);
  };

  const useSection = (section) => {
    navigator.clipboard?.writeText(section.content);
    setSections(prev => prev.map(s => s.id === section.id ? { ...s, useCount: (s.useCount||0) + 1 } : s));
  };

  const deleteSection = (id) => setSections(prev => prev.filter(s => s.id !== id));

  const filtered = sections.filter(s => !search || s.title.toLowerCase().includes(search.toLowerCase()) || s.content.toLowerCase().includes(search.toLowerCase()));
  const typeMap = Object.fromEntries(SECTION_TYPES.map(t => [t.id, t]));

  return (
    <div>
      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        <Input value={search} onChange={setSearch} placeholder="Search library..." style={{ flex:1 }} />
        <Btn variant="primary" onClick={() => setShowAdd(true)}>+ Add Section</Btn>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(140px, 1fr))", gap:8, marginBottom:16 }}>
        <Card><Stat label="Total Sections" value={sections.length} color={T.amber} /></Card>
        <Card><Stat label="Times Used" value={sections.reduce((s,x) => s + (x.useCount||0), 0)} color={T.green} /></Card>
        <Card><Stat label="Categories" value={new Set(sections.map(s=>s.category)).size} color={T.blue} /></Card>
      </div>

      {filtered.length === 0 ? <Empty icon="📚" title="Section library empty" sub="Add reusable sections you commonly include in grant applications" action={<Btn variant="primary" size="sm" onClick={() => setShowAdd(true)}>+ Add First Section</Btn>} /> :
        filtered.map(s => (
          <Card key={s.id} style={{ marginBottom:8 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                  <Badge color={T.blue}>{typeMap[s.category]?.icon} {typeMap[s.category]?.label || s.category}</Badge>
                  {s.useCount > 0 && <Badge color={T.green}>Used {s.useCount}x</Badge>}
                </div>
                <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:4 }}>{s.title}</div>
                <div style={{ fontSize:11, color:T.sub, lineHeight:1.5 }}>{s.content.slice(0, 150)}...</div>
              </div>
              <div style={{ display:"flex", gap:4 }}>
                <Btn size="sm" variant="success" onClick={() => useSection(s)}>📋 Copy</Btn>
                <button onClick={() => deleteSection(s.id)} style={{ background:"none", border:"none", color:T.red, cursor:"pointer" }}>✕</button>
              </div>
            </div>
          </Card>
        ))
      }

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Reusable Section" width={700}>
        <div style={{ display:"grid", gap:12 }}>
          <Input value={newSection.title} onChange={v => setNewSection({...newSection, title:v})} placeholder="Section title (e.g., 'Standard Org Capacity')" />
          <Select value={newSection.category} onChange={v => setNewSection({...newSection, category:v})} options={SECTION_TYPES.map(t => ({ value:t.id, label:`${t.icon} ${t.label}` }))} />
          <TextArea value={newSection.content} onChange={v => setNewSection({...newSection, content:v})} rows={10} placeholder="Paste or write your reusable section content..." />
          <Btn variant="primary" onClick={addSection}>Save to Library</Btn>
        </div>
      </Modal>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════
// MODULE: REPORT GENERATOR
// ════════════════════════════════════════════════════════════════════════
const ReportGenerator = ({ grants, vaultDocs, contacts }) => {
  const [reportType, setReportType] = useState("portfolio");
  const [generated, setGenerated] = useState("");
  const [loading, setLoading] = useState(false);

  const REPORT_TYPES = [
    { id:"portfolio", label:"📊 Portfolio Summary", desc:"Overview of all grants, pipeline status, and financial projections" },
    { id:"progress", label:"📈 Progress Report", desc:"Status updates on active grants with milestones and achievements" },
    { id:"pipeline", label:"📋 Pipeline Report", desc:"Detailed view of grants in each stage with recommendations" },
    { id:"financial", label:"💰 Financial Summary", desc:"Award amounts, burn rates, and projections across all grants" },
    { id:"impact", label:"🎯 Impact Report", desc:"Outcomes, metrics, and community impact from awarded grants" },
    { id:"funder", label:"🏛️ Funder Analysis", desc:"Breakdown of funding sources, success rates, and relationship strength" },
  ];

  const generateReport = async () => {
    setLoading(true);
    const context = buildPortfolioContext(grants, vaultDocs, contacts);
    const grantDetails = grants.map(g => `- ${g.title} | ${STAGE_MAP[g.stage]?.label} | ${fmt(g.amount||0)} | ${g.agency} | ${g.deadline ? fmtDate(g.deadline) : 'No deadline'}`).join("\n");

    const prompts = {
      portfolio: `Generate a comprehensive Portfolio Summary Report including: executive summary, pipeline overview by stage, total funding sought vs awarded, key deadlines in the next 30 days, risk areas, and strategic recommendations.`,
      progress: `Generate a Progress Report for all active and awarded grants. Include: current status, recent milestones, upcoming deliverables, any blockers or concerns, and next steps for each grant.`,
      pipeline: `Generate a Pipeline Report showing: grants in each lifecycle stage, conversion rates between stages, bottlenecks, recommended priorities, and suggested actions for stalled grants.`,
      financial: `Generate a Financial Summary Report including: total funding awarded, total pending, total in pipeline, burn rate on active awards, projected cash flow, and budget utilization analysis.`,
      impact: `Generate an Impact Report covering: communities served, outcomes achieved, jobs created or supported, innovations developed, and how the portfolio aligns with broader economic development goals.`,
      funder: `Generate a Funder Analysis Report including: funding sources breakdown, success rate by agency, relationship strength assessment, diversification analysis, and recommendations for new funder targets.`,
    };

    const sys = `You are an expert grant management consultant generating a professional report. ${context}\n\nGRANT DETAILS:\n${grantDetails}\n\nFormat the report with clear sections, headers, and actionable insights. Use specific numbers from the data provided.`;
    const result = await API.callAI([{ role:"user", content: prompts[reportType] }], sys);
    setGenerated(result.error ? `Error: ${result.error}` : result.text);
    setLoading(false);
  };

  const generateLocal = () => {
    const awarded = grants.filter(g => ["awarded","active"].includes(g.stage));
    const pending = grants.filter(g => ["submitted","under_review"].includes(g.stage));
    const pipeline = grants.filter(g => ["discovered","researching","qualifying","preparing","drafting","reviewing"].includes(g.stage));
    const declined = grants.filter(g => g.stage === "declined");

    const report = `═══════════════════════════════════════════
UNLESS GRANT PORTFOLIO — SUMMARY REPORT
Generated: ${new Date().toLocaleDateString()}
═══════════════════════════════════════════

EXECUTIVE SUMMARY
─────────────────
Total Grants: ${grants.length}
Total Sought: ${fmt(grants.reduce((s,g) => s + (g.amount||0), 0))}
Total Awarded: ${fmt(awarded.reduce((s,g) => s + (g.amount||0), 0))}
Win Rate: ${grants.filter(g=>["awarded","active","closeout"].includes(g.stage)).length}/${grants.filter(g=>["awarded","active","closeout","declined"].includes(g.stage)).length || 1} (${((grants.filter(g=>["awarded","active","closeout"].includes(g.stage)).length / Math.max(grants.filter(g=>["awarded","active","closeout","declined"].includes(g.stage)).length, 1)) * 100).toFixed(0)}%)

PIPELINE BREAKDOWN
──────────────────
${STAGES.map(s => {
  const ct = grants.filter(g => g.stage === s.id);
  return ct.length > 0 ? `${s.icon} ${s.label}: ${ct.length} grants — ${fmt(ct.reduce((sum,g)=>sum+(g.amount||0),0))}` : null;
}).filter(Boolean).join("\n")}

AWARDED GRANTS
──────────────
${awarded.length === 0 ? "No awards yet" : awarded.map(g => `• ${g.title} — ${fmt(g.amount||0)} (${g.agency})`).join("\n")}

PENDING DECISIONS
─────────────────
${pending.length === 0 ? "No pending applications" : pending.map(g => `• ${g.title} — ${fmt(g.amount||0)} (${g.agency})`).join("\n")}

ACTIVE PIPELINE
───────────────
${pipeline.length === 0 ? "Pipeline empty" : pipeline.map(g => `• [${STAGE_MAP[g.stage]?.label}] ${g.title} — ${fmt(g.amount||0)}`).join("\n")}

UPCOMING DEADLINES (Next 30 Days)
─────────────────────────────────
${grants.filter(g => g.deadline && daysUntil(g.deadline) >= 0 && daysUntil(g.deadline) <= 30).sort((a,b) => new Date(a.deadline) - new Date(b.deadline)).map(g => `• ${fmtDate(g.deadline)} (${daysUntil(g.deadline)}d) — ${g.title}`).join("\n") || "No upcoming deadlines"}

PROFILE: ${PROFILE.name} | ${PROFILE.loc}
BUSINESSES: ${PROFILE.businesses.filter(b=>b.st==="active").map(b=>b.n).join(", ")}`;

    setGenerated(report);
  };

  return (
    <div>
      <Card style={{ marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>📊 Report Generator</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:8, marginBottom:12 }}>
          {REPORT_TYPES.map(r => (
            <div key={r.id} onClick={() => setReportType(r.id)} style={{
              padding:12, borderRadius:6, cursor:"pointer", border:`1px solid ${reportType === r.id ? T.amber+"66" : T.border}`,
              background: reportType === r.id ? T.amber+"08" : T.panel,
            }}>
              <div style={{ fontSize:12, fontWeight:600, color: reportType === r.id ? T.amber : T.text }}>{r.label}</div>
              <div style={{ fontSize:10, color:T.mute, marginTop:4 }}>{r.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <Btn variant="primary" onClick={generateReport} disabled={loading}>{loading ? "⏳ Generating..." : "🧠 AI Report"}</Btn>
          <Btn onClick={generateLocal}>📊 Quick Report (No AI)</Btn>
        </div>
      </Card>

      {generated && (
        <Card>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <div style={{ fontSize:13, fontWeight:600, color:T.text }}>📄 Generated Report</div>
            <div style={{ display:"flex", gap:4 }}>
              <Btn size="sm" variant="ghost" onClick={() => navigator.clipboard?.writeText(generated)}>📋 Copy</Btn>
              <Btn size="sm" variant="ghost" onClick={() => setGenerated("")}>✕ Clear</Btn>
            </div>
          </div>
          <div style={{ fontSize:12, color:T.sub, lineHeight:1.7, whiteSpace:"pre-wrap", padding:12, background:T.panel, borderRadius:6, maxHeight:600, overflow:"auto" }}>{generated}</div>
        </Card>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════
// MODULE: FUNDER RESEARCH (990 Analysis)
// ════════════════════════════════════════════════════════════════════════
const FunderResearch = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedFunders, setSavedFunders] = useState(() => LS.get("saved_funders", []));

  useEffect(() => { LS.set("saved_funders", savedFunders); }, [savedFunders]);

  const searchSAM = async () => {
    if (!query.trim()) return;
    setLoading(true);
    const data = await API.searchSAMEntities(query);
    setResults((data.entityData || []).map(e => ({
      name: e.entityRegistration?.legalBusinessName || "Unknown",
      uei: e.entityRegistration?.ueiSAM || "",
      status: e.entityRegistration?.registrationStatus || "",
      type: e.entityRegistration?.businessTypes?.join(", ") || "",
      expiration: e.entityRegistration?.registrationExpirationDate || "",
      cage: e.entityRegistration?.cageCode || "",
    })));
    setLoading(false);
  };

  const saveFunder = (funder) => {
    if (savedFunders.some(f => f.name === funder.name)) return;
    setSavedFunders(prev => [...prev, { ...funder, id: uid(), savedAt: new Date().toISOString(), notes:"", priority:"medium" }]);
  };

  return (
    <div>
      <Card style={{ marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:8 }}>🏛️ Funder & Entity Research</div>
        <div style={{ fontSize:12, color:T.sub, marginBottom:12 }}>Search SAM.gov to research federal entities, verify registrations, and identify potential funding sources.</div>
        <div style={{ display:"flex", gap:8 }}>
          <Input value={query} onChange={setQuery} placeholder="Search entities... (e.g., Illinois Housing Authority)" style={{ flex:1 }} onKeyDown={e => e.key === "Enter" && searchSAM()} />
          <Btn variant="primary" onClick={searchSAM} disabled={loading}>{loading ? "⏳" : "🔍"} Search</Btn>
        </div>
      </Card>

      {results.length > 0 && (
        <Card style={{ marginBottom:16 }}>
          <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:8 }}>📋 SAM.gov Results ({results.length})</div>
          {results.map((r, i) => (
            <div key={i} style={{ padding:"10px 0", borderBottom:`1px solid ${T.border}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:T.text }}>{r.name}</div>
                  <div style={{ fontSize:11, color:T.mute, marginTop:2 }}>UEI: {r.uei || "N/A"} · CAGE: {r.cage || "N/A"}</div>
                  {r.type && <div style={{ fontSize:10, color:T.sub, marginTop:2 }}>{r.type}</div>}
                  <div style={{ display:"flex", gap:4, marginTop:4 }}>
                    <Badge color={r.status === "Active" ? T.green : T.yellow}>{r.status || "Unknown"}</Badge>
                    {r.expiration && <Badge color={T.mute}>Expires: {r.expiration}</Badge>}
                  </div>
                </div>
                <Btn size="sm" variant="ghost" onClick={() => saveFunder(r)}>💾 Save</Btn>
              </div>
            </div>
          ))}
        </Card>
      )}

      {savedFunders.length > 0 && (
        <Card>
          <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:8 }}>⭐ Saved Funders ({savedFunders.length})</div>
          {savedFunders.map(f => (
            <div key={f.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:`1px solid ${T.border}` }}>
              <div>
                <div style={{ fontSize:12, color:T.text }}>{f.name}</div>
                <div style={{ fontSize:10, color:T.mute }}>UEI: {f.uei || "N/A"}</div>
              </div>
              <button onClick={() => setSavedFunders(prev => prev.filter(x => x.id !== f.id))} style={{ background:"none", border:"none", color:T.red, cursor:"pointer" }}>✕</button>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════
// MODULE: PORTFOLIO OPTIMIZER
// ════════════════════════════════════════════════════════════════════════
const PortfolioOptimizer = ({ grants }) => {
  const active = grants.filter(g => !["declined","closeout"].includes(g.stage));
  const byStage = STAGES.map(s => ({ stage: s, grants: grants.filter(g => g.stage === s.id), total: grants.filter(g => g.stage === s.id).reduce((sum,g)=>sum+(g.amount||0),0) })).filter(x => x.grants.length > 0);
  const byAgency = {};
  grants.forEach(g => { const a = g.agency || "Unknown"; byAgency[a] = (byAgency[a]||0) + 1; });
  const agencyEntries = Object.entries(byAgency).sort((a,b) => b[1] - a[1]);

  // Risk analysis
  const risks = [];
  if (active.filter(g => g.deadline && daysUntil(g.deadline) <= 7 && daysUntil(g.deadline) >= 0).length > 2) risks.push({ level:"high", msg:"3+ deadlines in the next 7 days — risk of quality issues" });
  if (agencyEntries.length === 1 && grants.length > 2) risks.push({ level:"medium", msg:"All grants from one agency — diversify funding sources" });
  if (grants.filter(g => g.stage === "discovered").length > 10) risks.push({ level:"low", msg:"10+ discovered grants not progressing — consider qualifying or removing" });
  if (active.filter(g => !g.deadline).length > 3) risks.push({ level:"medium", msg:"Multiple grants without deadlines — add dates for better planning" });
  const awarded = grants.filter(g=>["awarded","active","closeout"].includes(g.stage));
  const declined = grants.filter(g=>g.stage==="declined");
  if (declined.length > awarded.length * 3 && declined.length > 5) risks.push({ level:"high", msg:"High decline rate — review targeting strategy" });

  // Recommendations
  const recs = [];
  if (grants.filter(g => g.stage === "drafting").length > 3) recs.push("You have 3+ grants in drafting — consider focusing to improve quality");
  if (grants.filter(g => g.stage === "preparing").length > 5) recs.push("5+ grants preparing — some may stall. Prioritize by deadline and fit score");
  if (awarded.length === 0 && grants.length > 5) recs.push("No awards yet with 5+ grants tracked — review match quality and narrative strength");
  if (agencyEntries.length >= 3) recs.push("Good agency diversification! Continue building multi-source pipeline");

  return (
    <div>
      {/* Risk Dashboard */}
      <Card style={{ marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>⚠️ Risk Analysis</div>
        {risks.length === 0 ? <div style={{ color:T.green, fontSize:12 }}>✅ No significant risks detected</div> :
          risks.map((r, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 0", borderBottom:`1px solid ${T.border}` }}>
              <Badge color={r.level === "high" ? T.red : r.level === "medium" ? T.yellow : T.green}>{r.level}</Badge>
              <span style={{ fontSize:12, color:T.text }}>{r.msg}</span>
            </div>
          ))
        }
      </Card>

      {/* Stage Distribution */}
      <Card style={{ marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>📊 Pipeline Distribution</div>
        <MiniBar data={byStage.map(x => ({ label:x.stage.label.slice(0,6), value:x.grants.length }))} height={100} color={T.amber} />
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(150px, 1fr))", gap:6, marginTop:8 }}>
          {byStage.map(x => (
            <div key={x.stage.id} style={{ display:"flex", justifyContent:"space-between", padding:4, fontSize:11 }}>
              <span style={{ color:x.stage.color }}>{x.stage.icon} {x.stage.label}</span>
              <span style={{ color:T.text }}>{x.grants.length} · {fmt(x.total)}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Agency Concentration */}
      <Card style={{ marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>🏛️ Agency Concentration</div>
        {agencyEntries.map(([agency, count]) => (
          <div key={agency} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"4px 0", borderBottom:`1px solid ${T.border}` }}>
            <span style={{ fontSize:12, color:T.text }}>{agency}</span>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <Progress value={count} max={Math.max(...agencyEntries.map(x=>x[1]))} color={T.blue} height={4} />
              <Badge color={T.blue}>{count}</Badge>
            </div>
          </div>
        ))}
      </Card>

      {/* Recommendations */}
      <Card>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>💡 Recommendations</div>
        {recs.length === 0 ? <div style={{ color:T.mute, fontSize:12 }}>Add more grants to see portfolio optimization recommendations</div> :
          recs.map((r, i) => (
            <div key={i} style={{ padding:"6px 0", borderBottom:`1px solid ${T.border}`, fontSize:12, color:T.sub }}>💡 {r}</div>
          ))
        }
      </Card>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════
// MODULE: BUDGET BUILDER
// ════════════════════════════════════════════════════════════════════════
const BudgetBuilder = ({ grants }) => {
  const [budgets, setBudgets] = useState(() => LS.get("budgets", {}));
  const [selectedGrant, setSelectedGrant] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ category:"personnel", description:"", amount:0, quantity:1, unit:"year", justification:"", costShare:0 });

  useEffect(() => { LS.set("budgets", budgets); }, [budgets]);

  const CATEGORIES = [
    { id:"personnel", label:"👤 Personnel", color:T.blue },
    { id:"fringe", label:"🏥 Fringe Benefits", color:T.cyan },
    { id:"travel", label:"✈️ Travel", color:T.purple },
    { id:"equipment", label:"🖥️ Equipment", color:T.orange },
    { id:"supplies", label:"📦 Supplies", color:T.yellow },
    { id:"contractual", label:"📋 Contractual", color:T.amber },
    { id:"construction", label:"🏗️ Construction", color:T.green },
    { id:"other", label:"📎 Other Direct Costs", color:T.mute },
    { id:"indirect", label:"🏢 Indirect Costs", color:T.dim },
  ];
  const catMap = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

  const getBudget = () => budgets[selectedGrant] || { items:[], indirectRate:10, notes:"" };
  const items = getBudget().items || [];
  const indirectRate = getBudget().indirectRate || 10;

  const addItem = () => {
    if (!selectedGrant || !newItem.description) return;
    const b = getBudget();
    const updated = { ...b, items:[...b.items, { ...newItem, id:uid(), total: newItem.amount * newItem.quantity }] };
    setBudgets({ ...budgets, [selectedGrant]:updated });
    setNewItem({ category:"personnel", description:"", amount:0, quantity:1, unit:"year", justification:"", costShare:0 });
    setShowAdd(false);
  };

  const removeItem = (itemId) => {
    const b = getBudget();
    setBudgets({ ...budgets, [selectedGrant]:{ ...b, items:b.items.filter(i => i.id !== itemId) } });
  };

  const setIndirectRate = (rate) => {
    const b = getBudget();
    setBudgets({ ...budgets, [selectedGrant]:{ ...b, indirectRate: Number(rate) } });
  };

  const directTotal = items.filter(i => i.category !== "indirect").reduce((s,i) => s + (i.amount * i.quantity), 0);
  const indirectTotal = directTotal * (indirectRate / 100);
  const grandTotal = directTotal + indirectTotal;
  const costShareTotal = items.reduce((s,i) => s + (i.costShare || 0), 0);
  const federalShare = grandTotal - costShareTotal;

  const byCat = CATEGORIES.map(c => ({
    ...c, items: items.filter(i => i.category === c.id),
    total: items.filter(i => i.category === c.id).reduce((s,i) => s + i.amount * i.quantity, 0),
  })).filter(c => c.items.length > 0 || c.id === "indirect");

  const generateJustification = async () => {
    if (!selectedGrant || items.length === 0) return;
    const grant = grants.find(g => g.id === selectedGrant);
    const itemList = items.map(i => `${catMap[i.category]?.label}: ${i.description} — ${fmt(i.amount * i.quantity)} (${i.justification || "no justification"})`).join("\n");
    const text = `BUDGET JUSTIFICATION\nGrant: ${grant?.title || "Unknown"}\n\n${CATEGORIES.map(c => {
      const catItems = items.filter(i => i.category === c.id);
      if (catItems.length === 0) return null;
      return `${c.label}\n${catItems.map(i => `  ${i.description}: ${fmt(i.amount * i.quantity)} — ${i.justification || `${i.quantity} ${i.unit}(s) at ${fmt(i.amount)} each. Required for project implementation.`}`).join("\n")}`;
    }).filter(Boolean).join("\n\n")}\n\nIndirect Costs: ${indirectRate}% of direct costs = ${fmt(indirectTotal)}\n\nTOTAL PROJECT COST: ${fmt(grandTotal)}\nFederal Share: ${fmt(federalShare)}\nCost Share: ${fmt(costShareTotal)}`;
    navigator.clipboard?.writeText(text);
  };

  return (
    <div>
      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        <Select value={selectedGrant} onChange={setSelectedGrant} style={{ flex:1 }}
          options={[{ value:"", label:"Select a grant..." }, ...grants.map(g => ({ value:g.id, label:`${g.title?.slice(0,50)} (${fmt(g.amount||0)})` }))]} />
        <Btn variant="primary" size="sm" onClick={() => setShowAdd(true)} disabled={!selectedGrant}>+ Line Item</Btn>
      </div>

      {!selectedGrant ? <Empty icon="💰" title="Select a grant to build a budget" sub="Choose a grant from the dropdown above" /> : (
        <div>
          {/* Budget Summary */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(5, 1fr)", gap:8, marginBottom:16 }}>
            <Card><Stat label="Direct Costs" value={fmt(directTotal)} color={T.blue} /></Card>
            <Card><Stat label={`Indirect (${indirectRate}%)`} value={fmt(indirectTotal)} color={T.purple} /></Card>
            <Card glow><Stat label="Grand Total" value={fmt(grandTotal)} color={T.amber} /></Card>
            <Card><Stat label="Cost Share" value={fmt(costShareTotal)} color={T.green} /></Card>
            <Card><Stat label="Federal Ask" value={fmt(federalShare)} color={T.cyan} /></Card>
          </div>

          {/* Budget vs Award comparison */}
          {(() => {
            const grant = grants.find(g => g.id === selectedGrant);
            const awardAmt = grant?.amount || 0;
            const diff = awardAmt - grandTotal;
            return awardAmt > 0 ? (
              <Card style={{ marginBottom:12 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:12, color:T.sub }}>Budget vs Award Ceiling</span>
                  <span style={{ fontSize:13, fontWeight:600, color: diff >= 0 ? T.green : T.red }}>
                    {diff >= 0 ? `${fmt(diff)} under ceiling ✅` : `${fmt(Math.abs(diff))} OVER ceiling ⚠️`}
                  </span>
                </div>
                <Progress value={grandTotal} max={awardAmt} color={diff >= 0 ? T.green : T.red} height={6} />
              </Card>
            ) : null;
          })()}

          {/* Category Breakdown */}
          {byCat.map(c => (
            <Card key={c.id} style={{ marginBottom:8 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: c.items.length > 0 ? 8 : 0 }}>
                <span style={{ fontSize:12, fontWeight:600, color:c.color }}>{c.label}</span>
                <span style={{ fontSize:13, fontWeight:600, color:T.text }}>{c.id === "indirect" ? fmt(indirectTotal) : fmt(c.total)}</span>
              </div>
              {c.id === "indirect" ? (
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:11, color:T.mute }}>Rate:</span>
                  <Input type="number" value={indirectRate} onChange={setIndirectRate} style={{ width:80 }} />
                  <span style={{ fontSize:11, color:T.mute }}>% of direct costs ({fmt(directTotal)})</span>
                </div>
              ) : c.items.map(item => (
                <div key={item.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"4px 0", borderBottom:`1px solid ${T.border}` }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, color:T.text }}>{item.description}</div>
                    <div style={{ fontSize:10, color:T.mute }}>{item.quantity} {item.unit}(s) × {fmt(item.amount)}{item.costShare > 0 ? ` · Cost Share: ${fmt(item.costShare)}` : ""}</div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:12, fontWeight:600, color:T.text }}>{fmt(item.amount * item.quantity)}</span>
                    <button onClick={() => removeItem(item.id)} style={{ background:"none", border:"none", color:T.red, cursor:"pointer", fontSize:11 }}>✕</button>
                  </div>
                </div>
              ))}
            </Card>
          ))}

          {/* Actions */}
          <div style={{ display:"flex", gap:8, marginTop:12 }}>
            <Btn size="sm" onClick={generateJustification}>📋 Copy Budget Justification</Btn>
            <Btn size="sm" variant="ghost" onClick={() => {
              const csv = "Category,Description,Quantity,Unit,Unit Cost,Total,Cost Share,Justification\n" +
                items.map(i => `"${catMap[i.category]?.label}","${i.description}",${i.quantity},"${i.unit}",${i.amount},${i.amount*i.quantity},${i.costShare||0},"${i.justification||""}"`).join("\n") +
                `\n"Indirect","${indirectRate}% of direct",1,"lump",${indirectTotal},${indirectTotal},0,"Negotiated rate"` +
                `\n"TOTAL","",,,${grandTotal},${grandTotal},${costShareTotal},""`;
              navigator.clipboard?.writeText(csv);
            }}>📊 Copy as CSV</Btn>
          </div>
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Budget Line Item">
        <div style={{ display:"grid", gap:12 }}>
          <Select value={newItem.category} onChange={v => setNewItem({...newItem, category:v})} options={CATEGORIES.filter(c=>c.id!=="indirect").map(c => ({ value:c.id, label:c.label }))} />
          <Input value={newItem.description} onChange={v => setNewItem({...newItem, description:v})} placeholder="Description (e.g., Project Director salary)" />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
            <div><label style={{ fontSize:10, color:T.mute }}>Unit Cost</label><Input type="number" value={newItem.amount} onChange={v => setNewItem({...newItem, amount:Number(v)})} /></div>
            <div><label style={{ fontSize:10, color:T.mute }}>Quantity</label><Input type="number" value={newItem.quantity} onChange={v => setNewItem({...newItem, quantity:Number(v)})} /></div>
            <div><label style={{ fontSize:10, color:T.mute }}>Unit</label>
              <Select value={newItem.unit} onChange={v => setNewItem({...newItem, unit:v})} options={[
                {value:"year",label:"Year"},{value:"month",label:"Month"},{value:"hour",label:"Hour"},
                {value:"trip",label:"Trip"},{value:"unit",label:"Unit"},{value:"lump",label:"Lump Sum"},
              ]} />
            </div>
          </div>
          <div><label style={{ fontSize:10, color:T.mute }}>Cost Share (if any)</label><Input type="number" value={newItem.costShare} onChange={v => setNewItem({...newItem, costShare:Number(v)})} /></div>
          <TextArea value={newItem.justification} onChange={v => setNewItem({...newItem, justification:v})} rows={2} placeholder="Budget justification for this item..." />
          <div style={{ fontSize:12, color:T.amber, fontWeight:600 }}>Line Total: {fmt(newItem.amount * newItem.quantity)}</div>
          <Btn variant="primary" onClick={addItem}>Add Line Item</Btn>
        </div>
      </Modal>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════
// MODULE: MATCH ALERTS & MONITORING
// ════════════════════════════════════════════════════════════════════════
const MatchAlerts = ({ grants, addGrant }) => {
  const [alerts, setAlerts] = useState(() => LS.get("match_alerts", []));
  const [watchTerms, setWatchTerms] = useState(() => LS.get("watch_terms", ["rural technology","disability entrepreneurship","small business innovation","AI research","workforce development"]));
  const [newTerm, setNewTerm] = useState("");
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState(() => LS.get("last_scan", null));

  useEffect(() => { LS.set("match_alerts", alerts); }, [alerts]);
  useEffect(() => { LS.set("watch_terms", watchTerms); }, [watchTerms]);

  const addWatch = () => {
    if (!newTerm.trim() || watchTerms.includes(newTerm.trim())) return;
    setWatchTerms(prev => [...prev, newTerm.trim()]);
    setNewTerm("");
  };

  const removeWatch = (term) => setWatchTerms(prev => prev.filter(t => t !== term));

  const scanAll = async () => {
    setScanning(true);
    const newAlerts = [];
    for (const term of watchTerms.slice(0, 5)) {
      try {
        const data = await API.searchGrants(term, { rows: 5 });
        const hits = data.oppHits || [];
        hits.forEach(opp => {
          const title = opp.title || opp.opportunityTitle || "";
          const alreadyTracked = grants.some(g => g.title === title);
          const alreadyAlerted = alerts.some(a => a.title === title);
          if (!alreadyTracked && !alreadyAlerted) {
            // Quick match score
            const text = `${title} ${opp.description || opp.synopsis || ""}`.toLowerCase();
            let score = 0;
            if (text.includes("rural") || text.includes("underserved")) score += 15;
            if (text.includes("disab")) score += 15;
            if (text.includes("small business") || text.includes("sbir")) score += 12;
            if (text.includes("technology") || text.includes("ai") || text.includes("innovation")) score += 10;
            if (text.includes("poverty") || text.includes("low-income")) score += 12;
            if (text.includes("illinois")) score += 8;
            if (score >= 10) {
              newAlerts.push({
                id: uid(), title, agency: opp.agency || opp.agencyName || "",
                amount: opp.awardCeiling || opp.estimatedFunding || 0,
                deadline: opp.closeDate || "", description: (opp.description || opp.synopsis || "").slice(0, 300),
                matchScore: Math.min(score, 100), matchTerm: term,
                discoveredAt: new Date().toISOString(), dismissed: false, oppId: opp.id || opp.opportunityId,
              });
            }
          }
        });
      } catch {}
      await new Promise(r => setTimeout(r, 500)); // Rate limit
    }
    setAlerts(prev => [...newAlerts, ...prev].slice(0, 50));
    setLastScan(new Date().toISOString());
    LS.set("last_scan", new Date().toISOString());
    setScanning(false);
  };

  const dismissAlert = (id) => setAlerts(prev => prev.map(a => a.id === id ? { ...a, dismissed:true } : a));
  const trackAlert = (alert) => {
    addGrant({
      id: uid(), title: alert.title, agency: alert.agency, amount: alert.amount,
      deadline: alert.deadline, stage: "discovered", description: alert.description,
      oppId: alert.oppId, createdAt: new Date().toISOString(), notes: `Discovered via Match Alert (${alert.matchTerm})`, tags: [alert.matchTerm],
    });
    dismissAlert(alert.id);
  };

  const activeAlerts = alerts.filter(a => !a.dismissed);
  const dismissed = alerts.filter(a => a.dismissed);

  return (
    <div>
      {/* Watch Terms */}
      <Card style={{ marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:8 }}>🔔 Grant Watch List</div>
        <div style={{ fontSize:11, color:T.sub, marginBottom:8 }}>Monitor for new grants matching these keywords. Scan runs against Grants.gov and scores matches against your profile.</div>
        <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:8 }}>
          {watchTerms.map(t => (
            <Badge key={t} color={T.blue} style={{ cursor:"pointer" }} onClick={() => removeWatch(t)}>{t} ✕</Badge>
          ))}
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <Input value={newTerm} onChange={setNewTerm} placeholder="Add watch keyword..." style={{ flex:1 }} onKeyDown={e => e.key === "Enter" && addWatch()} />
          <Btn size="sm" onClick={addWatch}>+ Add</Btn>
          <Btn variant="primary" onClick={scanAll} disabled={scanning}>{scanning ? "⏳ Scanning..." : "🔍 Scan Now"}</Btn>
        </div>
        {lastScan && <div style={{ fontSize:10, color:T.dim, marginTop:6 }}>Last scan: {fmtDate(lastScan)}</div>}
      </Card>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:8, marginBottom:16 }}>
        <Card><Stat label="Active Alerts" value={activeAlerts.length} color={T.amber} /></Card>
        <Card><Stat label="Watch Terms" value={watchTerms.length} color={T.blue} /></Card>
        <Card><Stat label="Tracked" value={alerts.filter(a => a.dismissed).length} color={T.green} /></Card>
        <Card><Stat label="Avg Match" value={activeAlerts.length > 0 ? `${Math.round(activeAlerts.reduce((s,a)=>s+a.matchScore,0)/activeAlerts.length)}` : "—"} color={T.purple} /></Card>
      </div>

      {/* Active Alerts */}
      {activeAlerts.length === 0 ? <Empty icon="🔔" title="No new alerts" sub="Click 'Scan Now' to check for new matching grants" /> :
        activeAlerts.sort((a,b) => b.matchScore - a.matchScore).map(a => (
          <Card key={a.id} style={{ marginBottom:8, borderColor: a.matchScore >= 50 ? T.green+"44" : T.border }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                  <Badge color={a.matchScore >= 50 ? T.green : a.matchScore >= 25 ? T.yellow : T.mute}>Match: {a.matchScore}</Badge>
                  <Badge color={T.blue}>{a.matchTerm}</Badge>
                </div>
                <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:2 }}>{a.title?.slice(0,60)}</div>
                <div style={{ fontSize:11, color:T.mute }}>{a.agency}</div>
                <div style={{ fontSize:11, color:T.sub, marginTop:4, lineHeight:1.4 }}>{a.description?.slice(0,150)}...</div>
              </div>
              <div style={{ textAlign:"right", marginLeft:12, flexShrink:0 }}>
                {a.amount > 0 && <div style={{ fontSize:14, fontWeight:700, color:T.green }}>{fmt(a.amount)}</div>}
                {a.deadline && <div style={{ fontSize:11, color:T.mute }}>{fmtDate(a.deadline)}</div>}
                <div style={{ display:"flex", gap:4, marginTop:8 }}>
                  <Btn size="sm" variant="success" onClick={() => trackAlert(a)}>📋 Track</Btn>
                  <Btn size="sm" variant="ghost" onClick={() => dismissAlert(a.id)}>✕</Btn>
                </div>
              </div>
            </div>
          </Card>
        ))
      }
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════
// MODULE: AI NARRATIVE SCORER
// ════════════════════════════════════════════════════════════════════════
const NarrativeScorer = ({ grants }) => {
  const [text, setText] = useState("");
  const [grantId, setGrantId] = useState("");
  const [scoreResult, setScoreResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState(() => LS.get("score_history", []));

  useEffect(() => { LS.set("score_history", history); }, [history]);

  const score = async () => {
    if (!text.trim()) return;
    setLoading(true);
    const grant = grants.find(g => g.id === grantId);
    const sys = `You are an expert grant reviewer. Score this narrative section on the following criteria (0-100 each):
1. CLARITY: Is the writing clear, concise, and well-organized?
2. EVIDENCE: Does it use specific data, statistics, and evidence?
3. IMPACT: Does it clearly articulate measurable impact and outcomes?
4. ALIGNMENT: Does it align with typical federal grant reviewer expectations?
5. COMPELLING: Is the narrative persuasive and engaging?
6. SPECIFICITY: Are goals, methods, and timelines specific rather than vague?
7. FEASIBILITY: Does the plan seem achievable and realistic?

Respond ONLY in JSON format:
{"scores":{"clarity":N,"evidence":N,"impact":N,"alignment":N,"compelling":N,"specificity":N,"feasibility":N},"overall":N,"strengths":["..."],"weaknesses":["..."],"suggestions":["..."]}`;

    const content = `${grant ? `Grant: ${grant.title}\nAgency: ${grant.agency}\n\n` : ""}Score this narrative:\n\n${text}`;
    const result = await API.callAI([{ role:"user", content }], sys);
    if (result.error) { setScoreResult({ error: result.error }); }
    else {
      try {
        const cleaned = result.text.replace(/```json\n?|```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        setScoreResult(parsed);
        setHistory(prev => [{ id:uid(), date:new Date().toISOString(), overall:parsed.overall, grant:grant?.title || "General", preview:text.slice(0,80) }, ...prev].slice(0, 20));
      } catch { setScoreResult({ raw: result.text }); }
    }
    setLoading(false);
  };

  const CRITERIA = ["clarity","evidence","impact","alignment","compelling","specificity","feasibility"];
  const CRITERIA_LABELS = { clarity:"Clarity",evidence:"Evidence",impact:"Impact",alignment:"Alignment",compelling:"Compelling",specificity:"Specificity",feasibility:"Feasibility" };

  return (
    <div>
      <Card style={{ marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:8 }}>📝 AI Narrative Scorer</div>
        <div style={{ fontSize:11, color:T.sub, marginBottom:12 }}>Paste a draft narrative section. The AI will score it across 7 criteria that federal reviewers use, and provide specific improvement suggestions.</div>
        <Select value={grantId} onChange={setGrantId} style={{ marginBottom:8 }}
          options={[{ value:"", label:"General (no specific grant)" }, ...grants.map(g => ({ value:g.id, label:g.title?.slice(0,50) }))]} />
        <TextArea value={text} onChange={setText} rows={8} placeholder="Paste your narrative draft here..." />
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
          <Btn variant="primary" onClick={score} disabled={loading}>{loading ? "⏳ Scoring..." : "📊 Score Narrative"}</Btn>
          <div style={{ fontSize:11, color:T.mute }}>{text.split(/\s+/).filter(Boolean).length} words</div>
        </div>
      </Card>

      {scoreResult && !scoreResult.error && !scoreResult.raw && (
        <div>
          {/* Overall Score */}
          <Card style={{ marginBottom:12, borderColor: scoreResult.overall >= 70 ? T.green+"44" : T.border }} glow={scoreResult.overall >= 80}>
            <div style={{ display:"flex", alignItems:"center", gap:16 }}>
              <div style={{ fontSize:48, fontWeight:700, color: scoreResult.overall >= 80 ? T.green : scoreResult.overall >= 60 ? T.yellow : T.red }}>{scoreResult.overall}</div>
              <div>
                <div style={{ fontSize:14, fontWeight:600, color:T.text }}>Overall Score</div>
                <div style={{ fontSize:12, color:T.sub }}>
                  {scoreResult.overall >= 80 ? "Excellent — competitive quality" : scoreResult.overall >= 60 ? "Good — needs some refinement" : "Needs significant improvement"}
                </div>
              </div>
            </div>
          </Card>

          {/* Criteria Breakdown */}
          <Card style={{ marginBottom:12 }}>
            <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>📊 Criteria Breakdown</div>
            {CRITERIA.map(c => {
              const val = scoreResult.scores?.[c] || 0;
              return (
                <div key={c} style={{ marginBottom:8 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:3 }}>
                    <span style={{ color:T.sub }}>{CRITERIA_LABELS[c]}</span>
                    <span style={{ color: val >= 80 ? T.green : val >= 60 ? T.yellow : T.red, fontWeight:600 }}>{val}/100</span>
                  </div>
                  <Progress value={val} max={100} color={val >= 80 ? T.green : val >= 60 ? T.yellow : T.red} height={6} />
                </div>
              );
            })}
          </Card>

          {/* Strengths & Weaknesses */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
            <Card>
              <div style={{ fontSize:12, fontWeight:600, color:T.green, marginBottom:8 }}>✅ Strengths</div>
              {(scoreResult.strengths || []).map((s, i) => <div key={i} style={{ fontSize:11, color:T.sub, padding:"3px 0", borderBottom:`1px solid ${T.border}` }}>{s}</div>)}
            </Card>
            <Card>
              <div style={{ fontSize:12, fontWeight:600, color:T.red, marginBottom:8 }}>⚠️ Weaknesses</div>
              {(scoreResult.weaknesses || []).map((w, i) => <div key={i} style={{ fontSize:11, color:T.sub, padding:"3px 0", borderBottom:`1px solid ${T.border}` }}>{w}</div>)}
            </Card>
          </div>

          {/* Suggestions */}
          <Card>
            <div style={{ fontSize:12, fontWeight:600, color:T.amber, marginBottom:8 }}>💡 Improvement Suggestions</div>
            {(scoreResult.suggestions || []).map((s, i) => <div key={i} style={{ fontSize:11, color:T.sub, padding:"4px 0", borderBottom:`1px solid ${T.border}` }}>→ {s}</div>)}
          </Card>
        </div>
      )}

      {scoreResult?.error && <Card><div style={{ color:T.red, fontSize:12 }}>Error: {scoreResult.error}</div></Card>}
      {scoreResult?.raw && <Card><div style={{ fontSize:12, color:T.sub, whiteSpace:"pre-wrap" }}>{scoreResult.raw}</div></Card>}

      {/* Score History */}
      {history.length > 0 && (
        <Card style={{ marginTop:16 }}>
          <div style={{ fontSize:12, fontWeight:600, color:T.sub, marginBottom:8 }}>📈 Score History</div>
          {history.slice(0, 10).map(h => (
            <div key={h.id} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom:`1px solid ${T.border}`, fontSize:11 }}>
              <span style={{ color:T.mute }}>{fmtDate(h.date)}</span>
              <span style={{ color:T.text }}>{h.grant?.slice(0,25)}</span>
              <span style={{ color: h.overall >= 70 ? T.green : T.yellow, fontWeight:600 }}>{h.overall}/100</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════
// MODULE: LETTER OF SUPPORT GENERATOR
// ════════════════════════════════════════════════════════════════════════
const LetterGenerator = ({ grants, contacts }) => {
  const [config, setConfig] = useState({ grantId:"", contactId:"", type:"support", points:[], customPoints:"" });
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const LETTER_TYPES = [
    { id:"support", label:"Letter of Support", desc:"Shows community backing" },
    { id:"commitment", label:"Letter of Commitment", desc:"Pledges resources/partnership" },
    { id:"intent", label:"Letter of Intent", desc:"States plan to apply/collaborate" },
    { id:"match", label:"Match Certification", desc:"Confirms cost-share commitment" },
    { id:"mou", label:"MOU Draft", desc:"Memorandum of Understanding" },
  ];

  const generate = async () => {
    if (!config.grantId) return;
    setLoading(true);
    const grant = grants.find(g => g.id === config.grantId);
    const contact = (contacts || []).find(c => c.id === config.contactId);
    const sys = `You are an expert at drafting formal grant support letters. Write a professional ${LETTER_TYPES.find(t=>t.id===config.type)?.label || "Letter of Support"}.`;
    const prompt = `Draft a ${config.type} letter for:
Grant: ${grant?.title || "Unknown"}
Agency: ${grant?.agency || "Unknown"}  
Amount: ${fmt(grant?.amount || 0)}
${contact ? `From: ${contact.name}, ${contact.role} at ${contact.org}` : "From: [Organization Name]"}
Applicant: ${PROFILE.name}, ${PROFILE.loc}
Applicant businesses: ${PROFILE.businesses.filter(b=>b.st==="active").map(b=>`${b.n} (${b.d})`).join("; ")}
${config.customPoints ? `Key points to include: ${config.customPoints}` : ""}

Make it formal, specific to the project, and include a signature block.`;

    const result = await API.callAI([{ role:"user", content:prompt }], sys);
    setOutput(result.error ? `Error: ${result.error}` : result.text);
    setLoading(false);
  };

  return (
    <div>
      <Card style={{ marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>✉️ Letter of Support Generator</div>
        <div style={{ display:"grid", gap:12 }}>
          <Select value={config.grantId} onChange={v => setConfig({...config, grantId:v})}
            options={[{ value:"", label:"Select grant..." }, ...grants.map(g => ({ value:g.id, label:g.title?.slice(0,50) }))]} />
          <Select value={config.contactId} onChange={v => setConfig({...config, contactId:v})}
            options={[{ value:"", label:"Select signer (or leave blank)..." }, ...(contacts||[]).map(c => ({ value:c.id, label:`${c.name} — ${c.org}` }))]} />
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {LETTER_TYPES.map(t => (
              <Btn key={t.id} size="sm" variant={config.type === t.id ? "primary" : "default"} onClick={() => setConfig({...config, type:t.id})}>{t.label}</Btn>
            ))}
          </div>
          <TextArea value={config.customPoints} onChange={v => setConfig({...config, customPoints:v})} rows={2} placeholder="Key points to include (optional)..." />
          <Btn variant="primary" onClick={generate} disabled={loading || !config.grantId}>{loading ? "⏳ Generating..." : "✨ Generate Letter"}</Btn>
        </div>
      </Card>

      {output && (
        <Card>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <div style={{ fontSize:13, fontWeight:600, color:T.text }}>📄 Generated Letter</div>
            <div style={{ display:"flex", gap:4 }}>
              <Btn size="sm" variant="ghost" onClick={() => navigator.clipboard?.writeText(output)}>📋 Copy</Btn>
              <Btn size="sm" variant="ghost" onClick={() => setOutput("")}>✕</Btn>
            </div>
          </div>
          <div style={{ fontSize:12, color:T.sub, lineHeight:1.7, whiteSpace:"pre-wrap", padding:12, background:T.panel, borderRadius:6, maxHeight:500, overflow:"auto" }}>{output}</div>
        </Card>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════
// MODULE: FUNDING FORECAST
// ════════════════════════════════════════════════════════════════════════
const FundingForecast = ({ grants }) => {
  const [forecastMonths, setForecastMonths] = useState(12);
  const [loading, setLoading] = useState(false);
  const [trendData, setTrendData] = useState(null);

  const loadTrends = async () => {
    setLoading(true);
    try {
      const years = [2020, 2021, 2022, 2023, 2024];
      const promises = years.map(fy => API.getSpendingByState("IL", fy));
      const results = await Promise.all(promises);
      const trends = years.map((y, i) => {
        const total = (results[i].results || []).reduce((s, r) => s + (r.aggregated_amount || 0), 0);
        return { year: y, label: `FY${y}`, value: total, total };
      });
      setTrendData(trends);
    } catch { setTrendData([]); }
    setLoading(false);
  };

  // Pipeline forecast
  const awarded = grants.filter(g => ["awarded","active"].includes(g.stage));
  const pending = grants.filter(g => ["submitted","under_review"].includes(g.stage));
  const pipeline = grants.filter(g => !["awarded","active","closeout","declined","submitted","under_review"].includes(g.stage));

  const monthlyForecast = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < forecastMonths; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthLabel = d.toLocaleDateString("en-US", { month:"short", year:"2-digit" });
      // Awarded grants contribute monthly
      let monthRevenue = awarded.reduce((s,g) => s + ((g.amount||0) / 12), 0);
      // Pending grants might convert
      const pendingContrib = pending.reduce((s,g) => s + ((g.amount||0) * 0.3 / 12), 0);
      if (i >= 2) monthRevenue += pendingContrib; // Assume 2-month decision lag
      // Pipeline conversions later
      const pipeContrib = pipeline.reduce((s,g) => s + ((g.amount||0) * 0.1 / 12), 0);
      if (i >= 6) monthRevenue += pipeContrib;
      months.push({ label: monthLabel, value: Math.round(monthRevenue), month: i + 1 });
    }
    return months;
  }, [grants, forecastMonths]);

  const cumulative = monthlyForecast.reduce((acc, m) => {
    const prev = acc.length > 0 ? acc[acc.length - 1].value : 0;
    acc.push({ ...m, value: prev + m.value });
    return acc;
  }, []);

  const projectedAnnual = monthlyForecast.reduce((s,m) => s + m.value, 0);

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:8, marginBottom:16 }}>
        <Card glow><Stat label="Projected Annual" value={fmt(projectedAnnual)} color={T.amber} /></Card>
        <Card><Stat label="Monthly Avg" value={fmt(projectedAnnual / forecastMonths)} color={T.blue} /></Card>
        <Card><Stat label="Confidence" value={awarded.length > 0 ? "Medium" : "Low"} color={awarded.length > 0 ? T.yellow : T.red} /></Card>
        <Card><Stat label="Data Points" value={grants.length} color={T.purple} /></Card>
      </div>

      {/* Forecast Controls */}
      <Card style={{ marginBottom:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div style={{ fontSize:13, fontWeight:600, color:T.text }}>📈 Revenue Forecast</div>
          <div style={{ display:"flex", gap:4 }}>
            {[6,12,18,24].map(m => (
              <Btn key={m} size="sm" variant={forecastMonths === m ? "primary" : "ghost"} onClick={() => setForecastMonths(m)}>{m}mo</Btn>
            ))}
          </div>
        </div>
        <MiniBar data={monthlyForecast.slice(0,12)} height={120} color={T.green} />
        <div style={{ fontSize:10, color:T.mute, marginTop:4 }}>Monthly projected inflow based on: awarded (100%), pending (30% × 2-month lag), pipeline (10% × 6-month lag)</div>
      </Card>

      {/* Cumulative */}
      <Card style={{ marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:8 }}>📊 Cumulative Revenue</div>
        <MiniBar data={cumulative.slice(0,12)} height={120} color={T.amber} />
      </Card>

      {/* IL Funding Trends */}
      <Card style={{ marginBottom:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div style={{ fontSize:13, fontWeight:600, color:T.text }}>🏛️ Illinois Federal Grant Trends</div>
          <Btn variant="primary" size="sm" onClick={loadTrends} disabled={loading}>{loading ? "⏳ Loading..." : "📊 Load Trends"}</Btn>
        </div>
        {trendData && <MiniBar data={trendData} height={100} color={T.blue} />}
        {trendData && (
          <div style={{ fontSize:11, color:T.sub, marginTop:8 }}>
            {(() => {
              const latest = trendData[trendData.length - 1]?.total || 0;
              const prev = trendData[trendData.length - 2]?.total || 1;
              const change = ((latest - prev) / prev) * 100;
              return `Latest year: ${fmt(latest)} (${change >= 0 ? "+" : ""}${change.toFixed(1)}% vs prior year)`;
            })()}
          </div>
        )}
      </Card>

      {/* Assumptions */}
      <Card>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:8 }}>📋 Forecast Assumptions</div>
        <div style={{ fontSize:12, color:T.sub, lineHeight:1.7 }}>
          <div>Awarded grants: 100% certainty, distributed evenly across 12 months</div>
          <div>Pending applications: 30% conversion rate, 2-month decision lag</div>
          <div>Pipeline grants: 10% ultimate conversion, 6-month development cycle</div>
          <div>Model does not account for: multi-year awards, seasonal patterns, or agency-specific timing</div>
          <div style={{ color:T.mute, marginTop:8, fontStyle:"italic" }}>Confidence increases as you add more awarded and pending grants.</div>
        </div>
      </Card>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════
// MODULE: ACTIVITY LOG / AUDIT TRAIL
// ════════════════════════════════════════════════════════════════════════
const ActivityLog = ({ grants }) => {
  const [logs, setLogs] = useState(() => LS.get("activity_log", []));
  const [filter, setFilter] = useState("all");

  // Auto-generate recent activity from grants data
  const autoLogs = useMemo(() => {
    const entries = [];
    grants.forEach(g => {
      if (g.createdAt) entries.push({ id:`c_${g.id}`, type:"created", title:`Added "${g.title?.slice(0,40)}" to pipeline`, date:g.createdAt, icon:"➕", color:T.blue });
      if (g.stage === "submitted") entries.push({ id:`s_${g.id}`, type:"submitted", title:`Submitted "${g.title?.slice(0,40)}"`, date:g.createdAt, icon:"📤", color:T.green });
      if (g.stage === "awarded") entries.push({ id:`a_${g.id}`, type:"awarded", title:`Awarded "${g.title?.slice(0,40)}" — ${fmt(g.amount||0)}`, date:g.createdAt, icon:"🏆", color:T.amber });
      if (g.stage === "declined") entries.push({ id:`d_${g.id}`, type:"declined", title:`Declined: "${g.title?.slice(0,40)}"`, date:g.createdAt, icon:"❌", color:T.red });
    });
    return entries.sort((a,b) => new Date(b.date) - new Date(a.date));
  }, [grants]);

  const allLogs = [...autoLogs, ...logs].sort((a,b) => new Date(b.date) - new Date(a.date));
  const filtered = filter === "all" ? allLogs : allLogs.filter(l => l.type === filter);

  return (
    <div>
      <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
        {[{ id:"all", label:"All" }, { id:"created", label:"➕ Added" }, { id:"submitted", label:"📤 Submitted" }, { id:"awarded", label:"🏆 Awarded" }, { id:"declined", label:"❌ Declined" }].map(f => (
          <Btn key={f.id} size="sm" variant={filter === f.id ? "primary" : "ghost"} onClick={() => setFilter(f.id)}>{f.label}</Btn>
        ))}
      </div>

      <Card>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>📜 Activity Timeline</div>
        {filtered.length === 0 ? <div style={{ color:T.mute, fontSize:12 }}>No activity recorded yet</div> :
          filtered.slice(0, 50).map((log, i) => (
            <div key={log.id || i} style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"10px 0", borderBottom:`1px solid ${T.border}` }}>
              <div style={{ width:32, height:32, borderRadius:"50%", background:log.color+"15", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>{log.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, color:T.text }}>{log.title}</div>
                <div style={{ fontSize:10, color:T.mute, marginTop:2 }}>{log.date ? fmtDate(log.date) : ""}</div>
              </div>
            </div>
          ))
        }
      </Card>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════
// MODULE: DEADLINE WATCHDOG
// ════════════════════════════════════════════════════════════════════════
const DeadlineWatchdog = ({ grants, events }) => {
  const allDeadlines = useMemo(() => {
    const items = [];
    // Grant deadlines
    grants.filter(g => g.deadline && !["declined","closeout","awarded","active"].includes(g.stage)).forEach(g => {
      items.push({ id:g.id, title:g.title, date:g.deadline, type:"grant_deadline", stage:g.stage, amount:g.amount, agency:g.agency, source:"grant" });
    });
    // Custom events
    (events || []).forEach(e => {
      items.push({ id:e.id, title:e.title, date:e.date, type:e.type, source:"event" });
    });
    // Award period ends
    grants.filter(g => g.awardData?.period?.end && ["awarded","active"].includes(g.stage)).forEach(g => {
      items.push({ id:`end_${g.id}`, title:`Award period ends: ${g.title?.slice(0,30)}`, date:g.awardData.period.end, type:"period_end", source:"award" });
    });
    return items.sort((a,b) => new Date(a.date) - new Date(b.date));
  }, [grants, events]);

  const overdue = allDeadlines.filter(d => daysUntil(d.date) < 0);
  const critical = allDeadlines.filter(d => daysUntil(d.date) >= 0 && daysUntil(d.date) <= 3);
  const urgent = allDeadlines.filter(d => daysUntil(d.date) > 3 && daysUntil(d.date) <= 7);
  const upcoming = allDeadlines.filter(d => daysUntil(d.date) > 7 && daysUntil(d.date) <= 30);
  const later = allDeadlines.filter(d => daysUntil(d.date) > 30);

  const renderSection = (title, items, icon, color) => {
    if (items.length === 0) return null;
    return (
      <Card style={{ marginBottom:12, borderColor: color+"33" }}>
        <div style={{ fontSize:13, fontWeight:600, color, marginBottom:8 }}>{icon} {title} ({items.length})</div>
        {items.map(d => (
          <div key={d.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:`1px solid ${T.border}` }}>
            <div>
              <div style={{ fontSize:12, color:T.text }}>{d.title?.slice(0,45)}</div>
              <div style={{ fontSize:10, color:T.mute }}>{d.agency || d.type}{d.stage ? ` · ${STAGE_MAP[d.stage]?.label}` : ""}</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:12, fontWeight:600, color }}>{daysUntil(d.date) < 0 ? `${Math.abs(daysUntil(d.date))}d overdue` : `${daysUntil(d.date)}d`}</div>
              <div style={{ fontSize:10, color:T.mute }}>{fmtDate(d.date)}</div>
            </div>
          </div>
        ))}
      </Card>
    );
  };

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5, 1fr)", gap:8, marginBottom:16 }}>
        <Card><Stat label="Overdue" value={overdue.length} color={T.red} /></Card>
        <Card><Stat label="Critical (≤3d)" value={critical.length} color={T.orange} /></Card>
        <Card><Stat label="Urgent (≤7d)" value={urgent.length} color={T.yellow} /></Card>
        <Card><Stat label="Upcoming (≤30d)" value={upcoming.length} color={T.blue} /></Card>
        <Card><Stat label="Later" value={later.length} color={T.green} /></Card>
      </div>

      {allDeadlines.length === 0 ? <Empty icon="⏰" title="No deadlines tracked" sub="Add deadlines to your grants to see them here" /> : (
        <div>
          {renderSection("OVERDUE", overdue, "🚨", T.red)}
          {renderSection("CRITICAL — Due within 3 days", critical, "🔴", T.orange)}
          {renderSection("URGENT — Due within 7 days", urgent, "🟡", T.yellow)}
          {renderSection("UPCOMING — Due within 30 days", upcoming, "🔵", T.blue)}
          {renderSection("LATER — 30+ days", later, "🟢", T.green)}
        </div>
      )}

      {/* Weekly View */}
      <Card style={{ marginTop:16 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>📅 This Week</div>
        {(() => {
          const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
          const today = new Date();
          const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay());
          return (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7, 1fr)", gap:4 }}>
              {days.map((day, i) => {
                const d = new Date(weekStart); d.setDate(weekStart.getDate() + i);
                const dateStr = d.toISOString().split("T")[0];
                const dayDeadlines = allDeadlines.filter(dl => dl.date?.startsWith(dateStr));
                const isToday = d.toDateString() === today.toDateString();
                return (
                  <div key={i} style={{ padding:8, borderRadius:6, background: isToday ? T.amber+"10" : T.panel, border:`1px solid ${isToday ? T.amber+"44" : T.border}`, minHeight:60 }}>
                    <div style={{ fontSize:10, fontWeight:600, color: isToday ? T.amber : T.mute, marginBottom:4 }}>{day} {d.getDate()}</div>
                    {dayDeadlines.map(dl => (
                      <div key={dl.id} style={{ fontSize:8, padding:"2px 4px", borderRadius:3, background:T.red+"15", color:T.red, marginBottom:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        ⏰ {dl.title?.slice(0,12)}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          );
        })()}
      </Card>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════
// MODULE: COLLABORATION HUB
// ════════════════════════════════════════════════════════════════════════
const CollaborationHub = ({ grants }) => {
  const [notes, setNotes] = useState(() => LS.get("collab_notes", []));
  const [showAdd, setShowAdd] = useState(false);
  const [newNote, setNewNote] = useState({ grantId:"", content:"", type:"note", priority:"normal" });
  const [filter, setFilter] = useState("all");

  useEffect(() => { LS.set("collab_notes", notes); }, [notes]);

  const addNote = () => {
    if (!newNote.content) return;
    setNotes(prev => [{ ...newNote, id:uid(), createdAt:new Date().toISOString(), resolved:false }, ...prev]);
    setNewNote({ grantId:"", content:"", type:"note", priority:"normal" });
    setShowAdd(false);
  };

  const toggleResolve = (id) => setNotes(prev => prev.map(n => n.id === id ? { ...n, resolved:!n.resolved } : n));
  const deleteNote = (id) => setNotes(prev => prev.filter(n => n.id !== id));

  const TYPES = { note:{ icon:"📝", color:T.blue, label:"Note" }, question:{ icon:"❓", color:T.yellow, label:"Question" }, decision:{ icon:"✅", color:T.green, label:"Decision" }, blocker:{ icon:"🚫", color:T.red, label:"Blocker" }, idea:{ icon:"💡", color:T.amber, label:"Idea" } };

  const filtered = notes.filter(n => {
    if (filter === "all") return true;
    if (filter === "active") return !n.resolved;
    if (filter === "resolved") return n.resolved;
    return n.type === filter;
  });

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
          {[{ id:"all", label:"All" },{ id:"active", label:"Active" },{ id:"resolved", label:"Resolved" },...Object.entries(TYPES).map(([k,v]) => ({ id:k, label:`${v.icon} ${v.label}` }))].map(f => (
            <Btn key={f.id} size="sm" variant={filter === f.id ? "primary" : "ghost"} onClick={() => setFilter(f.id)}>{f.label}</Btn>
          ))}
        </div>
        <Btn variant="primary" size="sm" onClick={() => setShowAdd(true)}>+ Add Note</Btn>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:8, marginBottom:16 }}>
        <Card><Stat label="Total Notes" value={notes.length} color={T.amber} /></Card>
        <Card><Stat label="Open" value={notes.filter(n=>!n.resolved).length} color={T.blue} /></Card>
        <Card><Stat label="Blockers" value={notes.filter(n=>n.type==="blocker"&&!n.resolved).length} color={T.red} /></Card>
        <Card><Stat label="Decisions" value={notes.filter(n=>n.type==="decision").length} color={T.green} /></Card>
      </div>

      {filtered.length === 0 ? <Empty icon="💬" title="No notes yet" sub="Track decisions, questions, blockers, and ideas" action={<Btn variant="primary" size="sm" onClick={() => setShowAdd(true)}>+ Add Note</Btn>} /> :
        filtered.map(n => {
          const grant = grants.find(g => g.id === n.grantId);
          const type = TYPES[n.type] || TYPES.note;
          return (
            <Card key={n.id} style={{ marginBottom:6, opacity: n.resolved ? 0.6 : 1 }}>
              <div style={{ display:"flex", alignItems:"flex-start", gap:8 }}>
                <button onClick={() => toggleResolve(n.id)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:16, color: n.resolved ? T.green : T.mute, flexShrink:0, marginTop:2 }}>
                  {n.resolved ? "☑" : "☐"}
                </button>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", gap:4, marginBottom:4 }}>
                    <Badge color={type.color}>{type.icon} {type.label}</Badge>
                    {grant && <Badge color={T.blue}>{grant.title?.slice(0,20)}</Badge>}
                    {n.priority === "high" && <Badge color={T.red}>High</Badge>}
                  </div>
                  <div style={{ fontSize:12, color: n.resolved ? T.mute : T.text, textDecoration: n.resolved ? "line-through" : "none", lineHeight:1.5 }}>{n.content}</div>
                  <div style={{ fontSize:10, color:T.dim, marginTop:4 }}>{fmtDate(n.createdAt)}</div>
                </div>
                <button onClick={() => deleteNote(n.id)} style={{ background:"none", border:"none", color:T.red, cursor:"pointer", fontSize:11 }}>✕</button>
              </div>
            </Card>
          );
        })
      }

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Note">
        <div style={{ display:"grid", gap:12 }}>
          <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
            {Object.entries(TYPES).map(([k,v]) => (
              <Btn key={k} size="sm" variant={newNote.type === k ? "primary" : "default"} onClick={() => setNewNote({...newNote, type:k})}>{v.icon} {v.label}</Btn>
            ))}
          </div>
          <Select value={newNote.grantId} onChange={v => setNewNote({...newNote, grantId:v})}
            options={[{ value:"", label:"General (no grant)" }, ...grants.map(g => ({ value:g.id, label:g.title?.slice(0,50) }))]} />
          <TextArea value={newNote.content} onChange={v => setNewNote({...newNote, content:v})} rows={4} placeholder="Your note, question, decision, or idea..." />
          <Select value={newNote.priority} onChange={v => setNewNote({...newNote, priority:v})}
            options={[{ value:"normal", label:"Normal priority" }, { value:"high", label:"🔴 High priority" }]} />
          <Btn variant="primary" onClick={addNote}>Add Note</Btn>
        </div>
      </Modal>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════
// MAIN APPLICATION
// ════════════════════════════════════════════════════════════════════════
export default function App() {
  const [page, setPage] = useState("dashboard");
  const [grants, setGrants] = useState(() => LS.get("grants", []));
  const [vaultDocs, setVaultDocs] = useState(() => LS.get("vault_docs", []));
  const [contacts, setContacts] = useState(() => LS.get("contacts", []));
  const [events, setEvents] = useState(() => LS.get("events", []));
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Persist
  useEffect(() => { LS.set("grants", grants); }, [grants]);
  useEffect(() => { LS.set("vault_docs", vaultDocs); }, [vaultDocs]);
  useEffect(() => { LS.set("contacts", contacts); }, [contacts]);
  useEffect(() => { LS.set("events", events); }, [events]);

  const addGrant = (grant) => {
    if (grants.some(g => g.title === grant.title)) return;
    setGrants(prev => [...prev, grant]);
  };
  const updateGrant = (id, updates) => setGrants(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  const deleteGrant = (id) => setGrants(prev => prev.filter(g => g.id !== id));

  const NAV = [
    { id:"dashboard", icon:"📊", label:"Dashboard", group:"core" },
    { id:"discovery", icon:"🔍", label:"Discovery", group:"core" },
    { id:"pipeline", icon:"📋", label:"Pipeline", group:"core" },
    { id:"calendar", icon:"📅", label:"Calendar", group:"core" },
    { id:"watchdog", icon:"⏰", label:"Deadline Watchdog", group:"core" },
    { id:"rfp_parser", icon:"📑", label:"RFP Parser", group:"analysis" },
    { id:"match_scorer", icon:"🎯", label:"Match Scorer", group:"analysis" },
    { id:"match_alerts", icon:"🔔", label:"Match Alerts", group:"analysis" },
    { id:"ai_drafter", icon:"✍️", label:"AI Drafter", group:"writing" },
    { id:"narrative_scorer", icon:"📝", label:"Narrative Scorer", group:"writing" },
    { id:"section_library", icon:"📚", label:"Section Library", group:"writing" },
    { id:"letter_gen", icon:"✉️", label:"Letter Generator", group:"writing" },
    { id:"census", icon:"📊", label:"Census Narratives", group:"writing" },
    { id:"budget", icon:"💵", label:"Budget Builder", group:"docs" },
    { id:"vault", icon:"🗄️", label:"Document Vault", group:"docs" },
    { id:"compliance", icon:"✅", label:"Compliance", group:"management" },
    { id:"tasks", icon:"📝", label:"Action Plan", group:"management" },
    { id:"awards", icon:"🏆", label:"Award Mgmt", group:"management" },
    { id:"collab", icon:"💬", label:"Collaboration", group:"management" },
    { id:"projector", icon:"💰", label:"Financial Projector", group:"intelligence" },
    { id:"forecast", icon:"📈", label:"Funding Forecast", group:"intelligence" },
    { id:"network", icon:"🕸️", label:"Relationship Map", group:"intelligence" },
    { id:"peers", icon:"🔎", label:"Peer Prospecting", group:"intelligence" },
    { id:"funder_research", icon:"🏛️", label:"Funder Research", group:"intelligence" },
    { id:"optimizer", icon:"⚡", label:"Portfolio Optimizer", group:"intelligence" },
    { id:"winloss", icon:"📉", label:"Win/Loss Analysis", group:"intelligence" },
    { id:"impact", icon:"📈", label:"Impact Portfolio", group:"intelligence" },
    { id:"reports", icon:"📄", label:"Report Generator", group:"output" },
    { id:"activity", icon:"📜", label:"Activity Log", group:"output" },
    { id:"settings", icon:"⚙️", label:"Settings", group:"system" },
  ];

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <Dashboard grants={grants} docs={vaultDocs} contacts={contacts} vaultDocs={vaultDocs} events={events} navigate={setPage} />;
      case "discovery": return <Discovery onAdd={addGrant} />;
      case "pipeline": return <Pipeline grants={grants} updateGrant={updateGrant} deleteGrant={deleteGrant} />;
      case "calendar": return <TimelineCalendar grants={grants} events={events} setEvents={setEvents} />;
      case "watchdog": return <DeadlineWatchdog grants={grants} events={events} />;
      case "rfp_parser": return <RFPParser grants={grants} onUpdate={updateGrant} />;
      case "match_scorer": return <MatchScorer grants={grants} />;
      case "match_alerts": return <MatchAlerts grants={grants} addGrant={addGrant} />;
      case "ai_drafter": return <AIDrafter grants={grants} vaultDocs={vaultDocs} />;
      case "narrative_scorer": return <NarrativeScorer grants={grants} />;
      case "section_library": return <SectionLibrary vaultDocs={vaultDocs} />;
      case "letter_gen": return <LetterGenerator grants={grants} contacts={contacts} />;
      case "census": return <CensusNarrative />;
      case "budget": return <BudgetBuilder grants={grants} />;
      case "vault": return <DocumentVault vaultDocs={vaultDocs} setVaultDocs={setVaultDocs} grants={grants} />;
      case "compliance": return <ComplianceTracker grants={grants} updateGrant={updateGrant} />;
      case "tasks": return <ActionPlan grants={grants} />;
      case "awards": return <AwardManagement grants={grants} updateGrant={updateGrant} />;
      case "collab": return <CollaborationHub grants={grants} />;
      case "projector": return <FinancialProjector grants={grants} />;
      case "forecast": return <FundingForecast grants={grants} />;
      case "network": return <RelationshipMap grants={grants} contacts={contacts} setContacts={setContacts} />;
      case "peers": return <PeerProspecting />;
      case "funder_research": return <FunderResearch />;
      case "optimizer": return <PortfolioOptimizer grants={grants} />;
      case "winloss": return <WinLossAnalysis grants={grants} />;
      case "impact": return <ImpactPortfolio grants={grants} />;
      case "reports": return <ReportGenerator grants={grants} vaultDocs={vaultDocs} contacts={contacts} />;
      case "activity": return <ActivityLog grants={grants} />;
      case "settings": return <Settings />;
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
            return (
              <div key={group}>
                {sidebarOpen && groupLabels[group] && <div style={{ padding:"8px 12px 2px", fontSize:9, fontWeight:700, color:T.dim, letterSpacing:1.5 }}>{groupLabels[group]}</div>}
                {!sidebarOpen && groupLabels[group] && <div style={{ height:1, background:T.border, margin:"6px 8px" }} />}
                {items.map(n => (
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
            v4.0 · {grants.length} grants · {(vaultDocs||[]).length} docs · 30 modules
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
            <div style={{ fontSize:11, color:T.mute }}>{grants.length} grants · {fmt(grants.filter(g => ["awarded","active"].includes(g.stage)).reduce((s,g) => s + (g.amount||0), 0))} awarded</div>
          </div>
        </div>
        <div style={{ flex:1, overflow:"auto", padding:20 }}>
          {renderPage()}
        </div>
      </div>

      {/* Floating AI Chat */}
      <AIChatBar grants={grants} vaultDocs={vaultDocs} contacts={contacts} />
    </div>
  );
}
