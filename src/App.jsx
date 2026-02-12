import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { initFirebase, isFirebaseReady, onAuthChange, signInGoogle, signInEmail, signUpEmail, signInAnon, upgradeAnonymous, upgradeToGoogle, logOut, loadUserProfile, saveUserProfile, saveGrants, saveDocs, saveContacts, migrateFromLocalStorage, exportAllData, saveChatMessage, saveDraft, getSetupSQL } from "./firebase.js";

// GRANT LIFECYCLE PLATFORM v10.0 — AI-POWERED · FIREBASE MULTI-USER
// 22 modules + AI Intelligence + PocketBase Auth + SQLite Cloud Sync

const T = {
  // Backgrounds — deep obsidian layers with blue undertone
  bg: "#04070d", pn: "#080e1a", cd: "#0e1726", bd: "#192237",
  // Elevated surfaces — glassmorphism layers
  ev: "#111c30", hi: "#182640", sf: "#0c1420",
  // Text hierarchy — warm pearl scale
  tx: "#f0ebe3", sb: "#a8b5c8", mu: "#5c6f87", dm: "#283650",
  // Accent palette — refined, luminous
  am: "#e8b86d", gn: "#34d399", rd: "#f87171", bl: "#60a5fa",
  pu: "#a78bfa", yl: "#fbbf24", or: "#fb923c", cy: "#22d3ee",
  // Effects
  gl: "rgba(232,184,109,0.04)", 
  gs: "0 1px 2px rgba(0,0,0,.3), 0 4px 16px rgba(0,0,0,.2)",
  gi: "0 0 0 1px rgba(232,184,109,.12), 0 8px 32px rgba(232,184,109,.04)",
  // Premium shadows
  sh1: "0 1px 3px rgba(0,0,0,.4)",
  sh2: "0 4px 20px rgba(0,0,0,.3), 0 1px 3px rgba(0,0,0,.2)",
  sh3: "0 8px 40px rgba(0,0,0,.4), 0 2px 8px rgba(0,0,0,.2)",
};

// Census FIPS: Auto-derived from profile location
const CENSUS_API = "https://api.census.gov/data/2022/acs/acs5";

// State FIPS codes for Census API
const STATE_FIPS = {"Alabama":"01","Alaska":"02","Arizona":"04","Arkansas":"05","California":"06","Colorado":"08","Connecticut":"09","Delaware":"10","District of Columbia":"11","Florida":"12","Georgia":"13","Hawaii":"15","Idaho":"16","Illinois":"17","Indiana":"18","Iowa":"19","Kansas":"20","Kentucky":"21","Louisiana":"22","Maine":"23","Maryland":"24","Massachusetts":"25","Michigan":"26","Minnesota":"27","Mississippi":"28","Missouri":"29","Montana":"30","Nebraska":"31","Nevada":"32","New Hampshire":"33","New Jersey":"34","New Mexico":"35","New York":"36","North Carolina":"37","North Dakota":"38","Ohio":"39","Oklahoma":"40","Oregon":"41","Pennsylvania":"42","Rhode Island":"44","South Carolina":"45","South Dakota":"46","Tennessee":"47","Texas":"48","Utah":"49","Vermont":"50","Virginia":"51","Washington":"53","West Virginia":"54","Wisconsin":"55","Wyoming":"56","Puerto Rico":"72"};

// ELIGIBILITY TAG OPTIONS — users select which apply to them
const TAG_OPTIONS = [
  { id: "disabled", label: "Person with Disability", icon: "♿", cat: "eligibility" },
  { id: "below-poverty", label: "Below Poverty Line", icon: "💰", cat: "eligibility" },
  { id: "rural", label: "Rural Area", icon: "🌾", cat: "eligibility" },
  { id: "veteran", label: "Veteran / Military", icon: "🎖️", cat: "eligibility" },
  { id: "minority-owned", label: "Minority-Owned", icon: "🤝", cat: "eligibility" },
  { id: "women-owned", label: "Women-Owned", icon: "👩", cat: "eligibility" },
  { id: "economically-disadvantaged", label: "Economically Disadvantaged", icon: "📉", cat: "eligibility" },
  { id: "first-gen", label: "First-Generation Entrepreneur", icon: "🌱", cat: "eligibility" },
  { id: "self-employed", label: "Self-Employed / Sole Proprietor", icon: "🧑‍💼", cat: "eligibility" },
  { id: "for-profit", label: "For-Profit Small Business", icon: "🏢", cat: "entity" },
  { id: "nonprofit", label: "Nonprofit / 501(c)(3)", icon: "🏛️", cat: "entity" },
  { id: "tribal", label: "Tribal / Native American", icon: "🪶", cat: "eligibility" },
  { id: "senior", label: "Senior / Age 50+", icon: "🧓", cat: "eligibility" },
  { id: "youth", label: "Youth / Under 30", icon: "🧑", cat: "eligibility" },
  { id: "immigrant", label: "Immigrant / Refugee", icon: "🌍", cat: "eligibility" },
];

// SECTOR OPTIONS
const SECTOR_OPTIONS = [
  { id: "technology", label: "Technology / AI / Software" },
  { id: "agriculture", label: "Agriculture / Food" },
  { id: "healthcare", label: "Healthcare / Wellness" },
  { id: "education", label: "Education / Training" },
  { id: "manufacturing", label: "Manufacturing" },
  { id: "clean-energy", label: "Clean Energy / Environment" },
  { id: "ecommerce", label: "E-Commerce / Retail" },
  { id: "creative", label: "Creative / Arts / Media" },
  { id: "construction", label: "Construction / Infrastructure" },
  { id: "finance", label: "Finance / Fintech" },
  { id: "social-services", label: "Social Services / Community" },
  { id: "transportation", label: "Transportation / Logistics" },
];

// TAG → DISCOVERY KEYWORD MAPPING — auto-generates searches from profile tags
const TAG_KEYWORDS = {
  "disabled": ["disability employment rehabilitation self-employment", "assistive technology independent living", "Section 508 accessibility digital inclusion"],
  "below-poverty": ["disadvantaged entrepreneur economic development", "microenterprise small business capital minority", "community development financial empowerment underserved"],
  "rural": ["rural business development economic", "broadband rural digital equity access", "rural community development technology"],
  "veteran": ["veteran small business entrepreneurship", "veteran owned business development", "service disabled veteran owned business"],
  "minority-owned": ["minority business enterprise development", "disadvantaged business enterprise program", "minority owned small business innovation"],
  "women-owned": ["women owned small business federal", "women entrepreneur business development grant"],
  "self-employed": ["self employment workforce development training", "sole proprietor small business startup grant"],
  "nonprofit": ["nonprofit capacity building grant program", "community organization development funding"],
  "economically-disadvantaged": ["economically disadvantaged small business", "low income community development grant"],
  "tribal": ["tribal economic development grant", "native american business enterprise funding"],
  "senior": ["senior entrepreneur small business grant", "encore entrepreneur program funding"],
  "youth": ["young entrepreneur startup grant", "youth innovation small business program"],
  "immigrant": ["immigrant entrepreneur business program", "refugee small business development grant"],
};

// SECTOR → KEYWORD MAPPING
const SECTOR_KEYWORDS = {
  "technology": ["SBIR artificial intelligence automation", "small business innovation research Phase I", "technology transfer commercialization innovation", "data science computing machine learning research"],
  "agriculture": ["agricultural technology food innovation sustainable", "USDA rural development beginning farmer", "sustainable agriculture local food system"],
  "healthcare": ["health innovation community wellness program", "healthcare technology small business", "public health workforce development grant"],
  "education": ["education technology innovation program", "workforce development training digital", "STEM education development grant"],
  "manufacturing": ["advanced manufacturing small business innovation", "domestic manufacturing supply chain technology"],
  "clean-energy": ["clean energy technology innovation grant", "renewable energy small business development"],
  "ecommerce": ["digital commerce small business innovation", "ecommerce technology marketplace development"],
  "creative": ["arts culture creative economy grant", "creative industry small business development"],
  "construction": ["construction technology sustainable infrastructure", "building innovation small business grant"],
  "finance": ["financial technology innovation small business", "fintech community development financial"],
  "social-services": ["social services community development grant", "human services innovation technology program"],
  "transportation": ["transportation technology innovation grant", "logistics supply chain small business"],
};

// TAG → SCORE WEIGHT MAPPING — auto-generates Matcher scoring from profile
function generateScoreWeights(tags, sectors) {
  const weights = [];
  const tagWeightMap = {
    "disabled": { kw: ["disab", "handicap", "impair", "ada ", "section 508", "accessible", "rehabilitation", "vocational rehab"], w: 18, cat: "Disability" },
    "below-poverty": { kw: ["disadvantaged", "underserved", "poverty", "low-income", "low income", "economically", "underrepresent"], w: 14, cat: "Econ Disadvantaged" },
    "rural": { kw: ["rural", "non-metropolitan", "non-metro", "usda", "agricultural"], w: 14, cat: "Rural" },
    "veteran": { kw: ["veteran", "military", "service-connected", "vets"], w: 16, cat: "Veteran" },
    "minority-owned": { kw: ["minority", "underrepresent", "diverse", "disadvantaged business"], w: 12, cat: "Minority" },
    "women-owned": { kw: ["women-owned", "women owned", "female founder", "women business"], w: 12, cat: "Women-Owned" },
    "self-employed": { kw: ["small business", "entrepreneur", "startup", "small firm", "micro-enterprise", "self-employ", "sole proprietor"], w: 14, cat: "Small Business" },
    "for-profit": { kw: ["small business", "for-profit", "commercial", "enterprise"], w: 10, cat: "For-Profit" },
    "nonprofit": { kw: ["nonprofit", "non-profit", "501(c)", "tax-exempt", "charitable"], w: 12, cat: "Nonprofit" },
    "tribal": { kw: ["tribal", "native american", "indigenous", "indian country"], w: 14, cat: "Tribal" },
    "economically-disadvantaged": { kw: ["disadvantaged", "underserved", "poverty", "low-income"], w: 12, cat: "Econ Disadvantaged" },
  };
  const sectorWeightMap = {
    "technology": { kw: ["technology", "ai ", "artificial intelligence", "software", "digital", "automation", "machine learning", "data", "computing", "cyber", "innovation"], w: 12, cat: "Technology" },
    "agriculture": { kw: ["agriculture", "farming", "food", "usda", "sustainable", "aquaculture"], w: 12, cat: "Agriculture" },
    "healthcare": { kw: ["health", "medical", "clinical", "wellness", "biomedical"], w: 12, cat: "Healthcare" },
    "education": { kw: ["education", "training", "workforce", "stem", "learning"], w: 10, cat: "Education" },
    "manufacturing": { kw: ["manufacturing", "production", "supply chain", "industrial"], w: 10, cat: "Manufacturing" },
    "clean-energy": { kw: ["clean energy", "renewable", "solar", "wind", "efficiency", "climate"], w: 12, cat: "Clean Energy" },
    "ecommerce": { kw: ["commerce", "retail", "marketplace", "online", "e-commerce"], w: 8, cat: "E-Commerce" },
    "creative": { kw: ["arts", "creative", "culture", "media", "film", "music"], w: 8, cat: "Creative" },
  };
  
  // Add weights for user's tags
  tags.forEach(t => { if (tagWeightMap[t]) weights.push({ ...tagWeightMap[t], type: "match" }); });
  // Add weights for user's sectors
  sectors.forEach(s => { if (sectorWeightMap[s]) weights.push({ ...sectorWeightMap[s], type: "match" }); });
  
  // Always add SBIR/STTR if any tech-related sector
  if (sectors.some(s => ["technology","manufacturing","healthcare","clean-energy"].includes(s))) {
    weights.push({ kw: ["sbir", "sttr", "seed fund", "phase i", "phase ii"], w: 10, cat: "SBIR/STTR", type: "match" });
  }
  
  // Add location weight if state is specified
  weights.push({ kw: ["workforce", "job creation", "employment", "training", "capacity building"], w: 8, cat: "Workforce/Jobs", type: "match" });
  
  // Negative weights — things that DON'T match (only if user is NOT that type)
  if (!tags.includes("nonprofit")) weights.push({ kw: ["nonprofit", "non-profit", "501(c)", "tax-exempt"], w: -12, cat: "Requires Nonprofit", type: "gap" });
  if (!tags.includes("women-owned")) weights.push({ kw: ["women-owned", "women owned", "female founder"], w: -8, cat: "Women-specific", type: "gap" });
  if (!tags.includes("veteran")) weights.push({ kw: ["veteran", "military", "service-connected"], w: -10, cat: "Veteran-specific", type: "gap" });
  weights.push({ kw: ["university", "higher education", "college", "academic institution", "post-secondary"], w: -10, cat: "Academic Only", type: "gap" });
  if (!tags.includes("tribal")) weights.push({ kw: ["tribal government", "county government", "municipal"], w: -8, cat: "Government Only", type: "gap" });
  
  return weights.length > 0 ? weights : [
    { kw: ["small business", "entrepreneur"], w: 14, cat: "Small Business", type: "match" },
    { kw: ["technology", "innovation"], w: 10, cat: "Technology", type: "match" },
  ];
}

// Generate Discovery searches from profile tags + sectors
function generateSearches(tags, sectors) {
  const searches = [];
  const seen = new Set();
  let tier = 1;
  
  // Core searches from tags (tier 1)
  tags.forEach(t => {
    (TAG_KEYWORDS[t] || []).forEach((kw, i) => {
      if (!seen.has(kw)) {
        seen.add(kw);
        const label = TAG_OPTIONS.find(o => o.id === t)?.label || t;
        searches.push({ keyword: kw, label: label + (i > 0 ? ` ${i+1}` : ""), tier: Math.min(3, tier) });
        if (searches.length % 6 === 0) tier++;
      }
    });
  });
  
  // Sector searches (tier 2-3)
  sectors.forEach(s => {
    (SECTOR_KEYWORDS[s] || []).forEach((kw, i) => {
      if (!seen.has(kw)) {
        seen.add(kw);
        const label = SECTOR_OPTIONS.find(o => o.id === s)?.label || s;
        searches.push({ keyword: kw, label: label + (i > 0 ? ` ${i+1}` : ""), tier: Math.min(3, Math.ceil(searches.length / 6)) });
      }
    });
  });
  
  // Always include general searches
  const general = [
    { keyword: "small business innovation grant program", label: "General SB", tier: 3 },
    { keyword: "economic development community grant", label: "General Econ", tier: 3 },
  ];
  general.forEach(g => { if (!seen.has(g.keyword)) searches.push(g); });
  
  return searches.length > 0 ? searches : [
    { keyword: "small business grant program", label: "General", tier: 1 },
    { keyword: "innovation technology development", label: "Innovation", tier: 1 },
    { keyword: "economic development community", label: "Community", tier: 2 },
  ];
}

// DEFAULT PROFILE — Blank slate for new users
const DEFAULT_PROFILE = {
  name: "", loc: "", state: "", county: "", countyFips: "",
  tags: [],
  sectors: [],
  biz: [],
  narr: {
    founder_full: "",
    founder_short: "",
    founder_tech: "",
    disability: "",
    disability_brief: "",
    impact: "",
    impact_quant: "",
    financial: "",
    tech: "",
    tech_sbir: "",
  },
  expenses: {},
  income: {},
  setupComplete: false,
  github: "", // GitHub username for repo scanning
};

// P is the active profile — initialized from default, updated by App() on render
let P = DEFAULT_PROFILE;

const CAT = { business: { l: "Business", c: T.gn, i: "🏢" }, technology: { l: "Technology", c: T.cy, i: "⚡" }, disability: { l: "Disability", c: T.pu, i: "♿" }, disadvantaged: { l: "Disadvantaged", c: T.yl, i: "🤝" }, rural: { l: "Rural", c: "#84cc16", i: "🌾" }, personal: { l: "Personal", c: T.rd, i: "❤️" } };
const STG = { identified: { l: "Identified", c: "#6b7a90", x: 0 }, qualifying: { l: "Qualifying", c: T.pu, x: 1 }, preparing: { l: "Preparing", c: T.yl, x: 2 }, drafting: { l: "Drafting", c: T.or, x: 3 }, review: { l: "Review", c: T.bl, x: 4 }, submitted: { l: "Submitted", c: T.cy, x: 5 }, pending: { l: "Pending", c: "#9ca3af", x: 6 }, awarded: { l: "Awarded", c: T.gn, x: 7 }, active: { l: "Active", c: "#10b981", x: 8 }, closeout: { l: "Closeout", c: T.am, x: 9 }, completed: { l: "Completed", c: "#6b7280", x: 10 }, rejected: { l: "Rejected", c: T.rd, x: 11 } };

const mk = (id, n, src, cat, amt, dl, url, fit, notes, elig, reqs, dlDate, tpl) => ({
  id, name: n, source: src, category: cat, stage: "identified", amount: amt, deadline: dl, url, fit, notes,
  eligibility: elig || [], requirements: reqs || [], deadlineDate: dlDate || null,
  template: tpl || null, expenses: [], reports: [], customNotes: "",
});

const IG = [];

const PROGS = [];

const INIT_DOCS = [];

const TEMPLATES = {};

const INIT_CONTACTS = [];

// ══════ CSS — Premium Design System v2 ══════
const css = `@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
:root{--s:'DM Sans',system-ui,sans-serif;--m:'JetBrains Mono',monospace;--d:'Sora',sans-serif;}
*{box-sizing:border-box;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;}
body{margin:0;background:${T.bg};color:${T.tx};overflow-x:hidden;font-size:13px;line-height:1.55;}
::selection{background:${T.am}30;color:${T.tx};}
::-webkit-scrollbar{width:5px;height:5px;}
::-webkit-scrollbar-track{background:transparent;}
::-webkit-scrollbar-thumb{background:${T.bd};border-radius:99px;}
::-webkit-scrollbar-thumb:hover{background:${T.mu};}
@keyframes fi{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes slideIn{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:none}}
@keyframes shimmer{0%{background-position:200% 50%}100%{background-position:-200% 50%}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes glow{0%,100%{box-shadow:0 0 8px ${T.am}12}50%{box-shadow:0 0 24px ${T.am}20}}
@keyframes countUp{from{opacity:0;transform:translateY(8px) scale(.92)}to{opacity:1;transform:none}}
@keyframes ripple{0%{transform:scale(0);opacity:.5}100%{transform:scale(2.5);opacity:0}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
@keyframes borderGlow{0%,100%{border-color:${T.am}15}50%{border-color:${T.am}35}}
@keyframes checkmark{0%{stroke-dashoffset:100}100%{stroke-dashoffset:0}}
@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-4px)}40%,80%{transform:translateX(4px)}}
.stagger>*{animation:slideUp .5s cubic-bezier(.16,1,.3,1) both;}
.stagger>*:nth-child(1){animation-delay:.03s}
.stagger>*:nth-child(2){animation-delay:.07s}
.stagger>*:nth-child(3){animation-delay:.11s}
.stagger>*:nth-child(4){animation-delay:.15s}
.stagger>*:nth-child(5){animation-delay:.19s}
.stagger>*:nth-child(6){animation-delay:.23s}
.stagger>*:nth-child(7){animation-delay:.27s}
.stagger>*:nth-child(8){animation-delay:.31s}
.stagger>*:nth-child(9){animation-delay:.35s}
.stagger>*:nth-child(10){animation-delay:.39s}
input:focus,textarea:focus,select:focus{border-color:${T.am}40 !important;box-shadow:0 0 0 3px ${T.am}08, 0 0 20px ${T.am}06 !important;outline:none;}
input,textarea,select{transition:border-color .2s, box-shadow .2s;}
button{transition:all .2s cubic-bezier(.16,1,.3,1);position:relative;overflow:hidden;}
button:hover:not(:disabled){filter:brightness(1.12);transform:translateY(-1px);}
button:active:not(:disabled){transform:translateY(0) scale(.97);filter:brightness(.95);}
a{transition:color .2s,opacity .2s;}
a:hover{opacity:.8;}
.nav-label{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.14em;color:${T.dm};padding:14px 16px 5px;font-family:var(--d);}
.card-hover{transition:transform .25s cubic-bezier(.16,1,.3,1), border-color .25s, box-shadow .25s;}
.card-hover:hover{transform:translateY(-2px);border-color:${T.am}20 !important;box-shadow:${T.sh3}, 0 0 40px ${T.am}04 !important;}
@media(max-width:900px){.sidebar-nav{display:none !important;}.main-area{margin-left:0 !important;}.mobile-nav{display:flex !important;}}
@media(min-width:901px){.mobile-nav{display:none !important;}}
.mobile-nav{position:fixed;bottom:0;left:0;right:0;z-index:50;padding:4px 8px 8px;display:flex;gap:2px;justify-content:space-around;align-items:center;border-top:1px solid ${T.bd}50;backdrop-filter:blur(20px) saturate(180%);}
.mobile-nav button{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 2px;border:none;border-radius:8px;font-size:8px;font-family:var(--s);cursor:pointer;transition:all .15s;}
.empty-hero{text-align:center;padding:40px 20px;animation:fi .5s ease;}
.empty-hero .icon{font-size:48px;margin-bottom:12px;filter:grayscale(.3);opacity:.7;}
.empty-hero .title{font-size:16px;font-weight:700;color:${T.tx};font-family:var(--d);margin-bottom:6px;}
.empty-hero .desc{font-size:12px;color:${T.mu};line-height:1.6;max-width:400px;margin:0 auto 16px;}
.quick-action{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:10px;font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;border:1px solid ${T.bd};background:${T.sf};}
.quick-action:hover{border-color:${T.am}40;transform:translateY(-1px);box-shadow:0 4px 12px ${T.am}10;}
.quick-action.primary{background:linear-gradient(135deg,${T.am}15,${T.am}08);border-color:${T.am}30;color:${T.am};}
.toast-container{position:fixed;top:20px;right:20px;z-index:100;display:flex;flex-direction:column;gap:8px;pointer-events:none;}
.toast{padding:10px 16px;border-radius:10px;font-size:12px;font-weight:600;animation:slideUp .3s ease;pointer-events:auto;backdrop-filter:blur(12px);border:1px solid ${T.bd}60;}
.toast.success{background:${T.gn}15;color:${T.gn};border-color:${T.gn}30;}
.toast.info{background:${T.bl}15;color:${T.bl};border-color:${T.bl}30;}
.toast.warn{background:${T.or}15;color:${T.or};border-color:${T.or}30;}
.kbd{display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:20px;padding:0 5px;border-radius:4px;background:${T.sf};border:1px solid ${T.bd};font-size:9px;font-family:var(--m);color:${T.dm};}
.tour-overlay{position:fixed;inset:0;z-index:300;background:rgba(0,0,0,.6);backdrop-filter:blur(2px);animation:fadeIn .2s;}
.tour-card{position:fixed;z-index:301;width:340px;padding:20px;border-radius:16px;background:${T.pn};border:1px solid ${T.am}30;box-shadow:0 20px 60px rgba(0,0,0,.5),0 0 40px ${T.am}08;animation:slideUp .3s cubic-bezier(.16,1,.3,1);}
.tour-card .step-dot{width:8px;height:8px;border-radius:50%;transition:all .2s;}
.help-tip{position:relative;display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:50%;background:${T.bd}60;color:${T.dm};font-size:9px;font-weight:700;cursor:help;transition:all .15s;margin-left:4px;}
.help-tip:hover{background:${T.am}20;color:${T.am};transform:scale(1.1);}
.help-tip .help-popup{display:none;position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%);width:220px;padding:10px 12px;border-radius:10px;background:${T.pn};border:1px solid ${T.bd};box-shadow:0 8px 32px rgba(0,0,0,.4);font-size:10px;font-weight:400;color:${T.mu};line-height:1.5;z-index:100;white-space:normal;text-align:left;}
.help-tip:hover .help-popup{display:block;animation:slideUp .15s ease;}
.help-tip .help-popup::after{content:'';position:absolute;top:100%;left:50%;transform:translateX(-50%);border:6px solid transparent;border-top-color:${T.bd};}
@keyframes pulseRing{0%{box-shadow:0 0 0 0 ${T.am}40}70%{box-shadow:0 0 0 8px ${T.am}00}100%{box-shadow:0 0 0 0 ${T.am}00}}
.pulse-ring{animation:pulseRing 1.5s infinite;}
`;

// ══════ INPUT STYLE — Glass morphism ══════
const inpS = { padding: "8px 12px", background: `${T.sf}`, border: `1px solid ${T.bd}`, borderRadius: 8, color: T.tx, fontSize: 12, fontFamily: "var(--s)", outline: "none", lineHeight: 1.4, width: "100%", backdropFilter: "blur(4px)" };

// ══════ UI PRIMITIVES — Premium Design System v2 ══════

// Badge — 3D pill with depth
const B = ({ children, c = T.am, glow }) => (
  <span style={{ background: `linear-gradient(135deg, ${c}14, ${c}08)`, color: c, border: `1px solid ${c}20`, borderRadius: 6, fontWeight: 600, fontFamily: "var(--m)", display: "inline-block", fontSize: 10, padding: "2px 8px", whiteSpace: "nowrap", letterSpacing: ".03em", boxShadow: glow ? `0 0 16px ${c}15, inset 0 1px 0 ${c}10` : `inset 0 1px 0 ${c}06` }}>{children}</span>
);

// Fit gauge — circular arc variant
const Fb = ({ v, wide }) => {
  const c = v >= 90 ? T.gn : v >= 75 ? T.yl : v >= 60 ? T.bl : v >= 40 ? T.or : T.dm;
  const w = wide ? 80 : 48;
  const r = 16, circ = 2 * Math.PI * r, offset = circ - (v / 100) * circ;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {wide ? (
        <div style={{ width: w, height: 6, background: `${T.bd}50`, borderRadius: 99, overflow: "hidden", position: "relative" }}>
          <div style={{ width: `${v}%`, height: "100%", background: `linear-gradient(90deg, ${c}90, ${c})`, borderRadius: 99, transition: "width .7s cubic-bezier(.16,1,.3,1)", boxShadow: v >= 70 ? `0 0 12px ${c}30` : "none" }}></div>
        </div>
      ) : (
        <svg width="36" height="36" viewBox="0 0 36 36" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="18" cy="18" r={r} fill="none" stroke={T.bd + "50"} strokeWidth="3" />
          <circle cx="18" cy="18" r={r} fill="none" stroke={c} strokeWidth="3" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: "stroke-dashoffset .8s cubic-bezier(.16,1,.3,1)", filter: v >= 70 ? `drop-shadow(0 0 4px ${c}50)` : "none" }} />
        </svg>
      )}
      <span style={{ fontSize: 11, fontWeight: 800, color: c, fontFamily: "var(--m)", minWidth: 20 }}>{v}</span>
    </div>
  );
};

// Button — refined with ripple-ready structure
const Btn = ({ children, onClick, primary, small, disabled: ds, danger, ghost }) => (
  <button onClick={onClick} disabled={ds} style={{
    padding: small ? "6px 12px" : "9px 18px", fontSize: small ? 11 : 12, fontWeight: 600,
    fontFamily: "var(--s)", borderRadius: 8, cursor: ds ? "not-allowed" : "pointer", opacity: ds ? .35 : 1,
    background: danger ? `linear-gradient(135deg, ${T.rd}ee, ${T.rd}bb)` : primary ? `linear-gradient(135deg, ${T.am}, ${T.am}cc)` : ghost ? "transparent" : `${T.cd}`,
    color: primary || danger ? "#0a0e16" : ghost ? T.sb : T.sb,
    border: primary || danger ? "1px solid transparent" : ghost ? `1px solid transparent` : `1px solid ${T.bd}`,
    boxShadow: primary ? `0 2px 16px ${T.am}18, 0 1px 3px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.15)` : danger ? `0 2px 12px ${T.rd}12` : ghost ? "none" : T.sh1,
    letterSpacing: ".02em", display: "inline-flex", alignItems: "center", gap: 6,
  }}>{children}</button>
);

// Card — glassmorphism with hover lift
const Cd = ({ children, hl, bc, onClick, sx, glass, accent, hero }) => (
  <div onClick={onClick} className="card-hover" style={{
    background: hero ? `linear-gradient(145deg, ${T.am}08, ${T.pn}ee, ${T.cd}80)` : glass ? `linear-gradient(145deg, ${T.pn}dd, ${T.cd}80)` : hl ? T.ev : T.pn,
    border: `1px solid ${hero ? T.am + "18" : bc || T.bd}`, borderRadius: 14, padding: 18,
    cursor: onClick ? "pointer" : "default",
    boxShadow: accent ? `inset 0 1px 0 ${T.am}05, ${T.sh2}` : hero ? `${T.sh3}, inset 0 1px 0 rgba(255,255,255,.03)` : T.sh1,
    backdropFilter: glass || hero ? "blur(12px)" : "none",
    ...sx
  }}>{children}</div>
);

// Section Header — dramatic with gradient text option
const Hd = ({ i, t, s, r, children, gradient }) => (
  <div style={{ marginBottom: 24, animation: "fi .45s cubic-bezier(.16,1,.3,1) both" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, fontFamily: "var(--d)", display: "flex", alignItems: "center", gap: 12, letterSpacing: "-.02em", lineHeight: 1.15, ...(gradient ? { background: `linear-gradient(135deg, ${T.tx}, ${T.am})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" } : { color: T.tx }) }}>
          <span style={{ fontSize: 26, filter: "drop-shadow(0 2px 8px rgba(0,0,0,.4))" }}>{i}</span>{t}
        </h2>
        {s && <p style={{ margin: "6px 0 0", fontSize: 12, color: T.mu, lineHeight: 1.6, maxWidth: 640, letterSpacing: ".01em" }}>{s}</p>}
      </div>
      {r}
    </div>
    <div className="stagger">{children}</div>
  </div>
);

// Stat Grid — hero metrics with glow accents
const SG = ({ items }) => (
  <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(items.length, 5)},1fr)`, gap: 10, marginBottom: 18 }}>
    {items.map(s => (
      <div key={s.l} style={{
        background: `linear-gradient(165deg, ${T.pn}, ${T.cd}60)`, border: `1px solid ${T.bd}`,
        borderRadius: 12, padding: "16px 14px 12px", textAlign: "center",
        boxShadow: `inset 0 1px 0 rgba(255,255,255,.02), ${T.sh2}`, position: "relative", overflow: "hidden",
      }}>
        {/* Ambient glow behind number */}
        <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%, -50%)", width: 60, height: 60, background: `radial-gradient(circle, ${s.c}10 0%, transparent 70%)`, borderRadius: "50%", pointerEvents: "none" }}></div>
        {/* Bottom accent line */}
        <div style={{ position: "absolute", bottom: 0, left: "15%", right: "15%", height: 2, background: `linear-gradient(90deg, transparent, ${s.c}40, transparent)`, borderRadius: 99 }}></div>
        <div style={{ fontSize: 30, fontWeight: 700, color: s.c, fontFamily: "var(--d)", letterSpacing: "-.03em", textShadow: `0 0 40px ${s.c}12`, animation: "countUp .6s cubic-bezier(.16,1,.3,1) both", position: "relative" }}>{s.v}</div>
        <div style={{ fontSize: 9, color: T.mu, textTransform: "uppercase", letterSpacing: ".12em", fontWeight: 600, marginTop: 4, fontFamily: "var(--m)" }}>{s.l}</div>
      </div>
    ))}
  </div>
);

// Pill Tabs — refined with smooth transitions
const Pl = ({ items, active: a, onSelect: os }) => (
  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", padding: "4px 0" }}>
    {items.map(i => (
      <button key={i.k} onClick={() => os(i.k)} style={{
        padding: "6px 14px", fontSize: 11, fontWeight: 600, borderRadius: 8, fontFamily: "var(--s)",
        cursor: "pointer", letterSpacing: ".02em",
        border: a === i.k ? `1px solid ${i.c || T.am}30` : `1px solid ${T.bd}60`,
        background: a === i.k ? `linear-gradient(135deg, ${(i.c || T.am)}14, ${(i.c || T.am)}06)` : "transparent",
        color: a === i.k ? (i.c || T.am) : T.mu,
        boxShadow: a === i.k ? `0 0 16px ${(i.c || T.am)}06, inset 0 1px 0 ${(i.c || T.am)}08` : "none",
      }}>{i.l}</button>
    ))}
  </div>
);

// Checkbox
const Ck = ({ ck, oc, lb, su }) => (
  <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "6px 0", cursor: "pointer" }} onClick={oc}>
    <div style={{
      width: 18, height: 18, borderRadius: 5, border: `2px solid ${ck ? T.gn : T.dm}`,
      background: ck ? `linear-gradient(135deg, ${T.gn}25, ${T.gn}08)` : "transparent",
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1,
      boxShadow: ck ? `0 0 8px ${T.gn}15` : "none", transition: "all .25s cubic-bezier(.22,1,.36,1)",
    }}>{ck && <span style={{ color: T.gn, fontSize: 10, fontWeight: 900 }}>✓</span>}</div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: ck ? T.mu : T.tx, textDecoration: ck ? "line-through" : "none", transition: "color .2s" }}>{lb}</div>
      {su && <div style={{ fontSize: 8, color: T.dm, marginTop: 1 }}>{su}</div>}
    </div>
  </div>
);

// ══════ TOAST NOTIFICATION SYSTEM ══════
let _toastSetter = null;
function showToast(msg, type = "success", duration = 3000) {
  if (_toastSetter) {
    const id = Date.now();
    _toastSetter(prev => [...prev, { id, msg, type }]);
    setTimeout(() => _toastSetter(prev => prev.filter(t => t.id !== id)), duration);
  }
}

function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  _toastSetter = setToasts;
  if (toasts.length === 0) return null;
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          {t.type === "success" ? "✓" : t.type === "warn" ? "⚠" : "ℹ"} {t.msg}
        </div>
      ))}
    </div>
  );
}

// ══════ EMPTY STATE — Beautiful zero-data views ══════
const EmptyState = ({ icon, title, desc, actions, children }) => (
  <div className="empty-hero">
    <div className="icon">{icon}</div>
    <div className="title">{title}</div>
    <div className="desc">{desc}</div>
    {actions && (
      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
        {actions.map((a, i) => (
          <div key={i} className={`quick-action ${a.primary ? "primary" : ""}`} onClick={a.onClick}>
            {a.icon && <span>{a.icon}</span>}
            {a.label}
          </div>
        ))}
      </div>
    )}
    {children}
  </div>
);

// ══════ MOBILE BOTTOM NAV ══════
function MobileNav({ tab, setTab }) {
  const items = [
    { k: "dash", ic: "📊", l: "Home" },
    { k: "discover", ic: "📡", l: "Discover" },
    { k: "pipe", ic: "📋", l: "Pipeline" },
    { k: "aidraft", ic: "✍️", l: "AI Draft" },
    { k: "profile", ic: "⚙️", l: "Profile" },
  ];
  return (
    <div className="mobile-nav" style={{ background: `${T.pn}f0` }}>
      {items.map(t => (
        <button key={t.k} onClick={() => setTab(t.k)} style={{
          background: tab === t.k ? `${T.am}12` : "transparent",
          color: tab === t.k ? T.am : T.dm,
        }}>
          <span style={{ fontSize: 18 }}>{t.ic}</span>
          <span>{t.l}</span>
        </button>
      ))}
    </div>
  );
}

// ══════ GLOBAL COMMAND PALETTE (⌘K) ══════
function CommandPalette({ open, onClose, onNav, grants }) {
  const [query, setQuery] = useState("");
  const ref = useRef(null);
  
  useEffect(() => { if (open && ref.current) { ref.current.focus(); setQuery(""); } }, [open]);
  
  if (!open) return null;
  
  const allItems = [
    { k: "dash", ic: "📊", l: "Dashboard", cat: "Navigate" },
    { k: "discover", ic: "📡", l: "Discovery", cat: "Navigate" },
    { k: "pipe", ic: "📋", l: "Pipeline", cat: "Navigate" },
    { k: "aidraft", ic: "✍️", l: "AI Drafter", cat: "Navigate" },
    { k: "rfpparse", ic: "📄", l: "RFP Parser", cat: "Navigate" },
    { k: "docbuild", ic: "📁", l: "Documents", cat: "Navigate" },
    { k: "analytics", ic: "📉", l: "Analytics", cat: "Navigate" },
    { k: "profile", ic: "⚙️", l: "Profile Settings", cat: "Navigate" },
    { k: "match", ic: "🎯", l: "Grant Matcher", cat: "Navigate" },
    { k: "funder", ic: "🔍", l: "Funder Research", cat: "Navigate" },
    { k: "census", ic: "🏘️", l: "Community Data", cat: "Navigate" },
    { k: "crm", ic: "👥", l: "Contacts CRM", cat: "Navigate" },
    { k: "finmodel", ic: "💰", l: "Financial Model", cat: "Navigate" },
    { k: "awards", ic: "🏆", l: "Awards Intel", cat: "Navigate" },
    { k: "strategy", ic: "🧠", l: "Strategy", cat: "Navigate" },
    { k: "comply", ic: "✅", l: "Compliance", cat: "Navigate" },
    { k: "reports", ic: "📈", l: "Reports", cat: "Navigate" },
    { k: "tpl", ic: "📑", l: "Templates", cat: "Navigate" },
    { k: "time", ic: "📅", l: "Timeline", cat: "Navigate" },
    ...(grants || []).slice(0, 20).map(g => ({ k: "pipe", ic: "🎯", l: g.name, cat: "Grant", sub: g.source })),
  ];
  
  const q = query.toLowerCase();
  const filtered = q ? allItems.filter(i => i.l.toLowerCase().includes(q) || (i.cat || "").toLowerCase().includes(q) || (i.sub || "").toLowerCase().includes(q)) : allItems.filter(i => i.cat === "Navigate");
  
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,.5)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", paddingTop: "15vh", animation: "fadeIn .15s" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 480, maxHeight: "50vh", background: T.pn, border: `1px solid ${T.bd}`, borderRadius: 16, overflow: "hidden", boxShadow: `0 24px 80px rgba(0,0,0,.4)`, animation: "slideUp .2s ease" }}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.bd}40`, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 14, color: T.dm }}>🔍</span>
          <input ref={ref} value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search modules, grants, actions..."
            style={{ flex: 1, border: "none", background: "transparent", color: T.tx, fontSize: 14, fontFamily: "var(--s)", outline: "none" }}
            onKeyDown={e => {
              if (e.key === "Escape") onClose();
              if (e.key === "Enter" && filtered.length > 0) { onNav(filtered[0].k); onClose(); }
            }}
          />
          <span className="kbd">ESC</span>
        </div>
        <div style={{ maxHeight: "40vh", overflowY: "auto", padding: 6 }}>
          {filtered.slice(0, 15).map((item, i) => (
            <div key={i} onClick={() => { onNav(item.k); onClose(); }} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, cursor: "pointer",
              background: i === 0 ? `${T.am}08` : "transparent",
              transition: "background .1s",
            }} onMouseEnter={e => e.currentTarget.style.background = `${T.am}08`} onMouseLeave={e => { if (i !== 0) e.currentTarget.style.background = "transparent"; }}>
              <span style={{ fontSize: 16, width: 24, textAlign: "center" }}>{item.ic}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.tx }}>{item.l}</div>
                {item.sub && <div style={{ fontSize: 9, color: T.dm }}>{item.sub}</div>}
              </div>
              <span style={{ fontSize: 9, color: T.dm, fontFamily: "var(--m)" }}>{item.cat}</span>
            </div>
          ))}
          {filtered.length === 0 && <div style={{ padding: 20, textAlign: "center", fontSize: 12, color: T.dm }}>No results for "{query}"</div>}
        </div>
      </div>
    </div>
  );
}

// ══════ GUIDED TOUR — First-time user walkthrough ══════
const TOUR_STEPS = [
  { title: "Welcome to GLP! 🎯", desc: "This quick tour shows you the key features. You can revisit this anytime from Profile." },
  { title: "Discovery Engine 📡", desc: "Scans Grants.gov with your profile-tuned keywords. Finds federal grants that match your eligibility, location, and sector.", nav: "discover" },
  { title: "Grant Pipeline 📋", desc: "Track grants from identification through award. Manage requirements, deadlines, and stage progression for every opportunity.", nav: "pipe" },
  { title: "AI Drafter ✍️", desc: "Generate professional proposal sections using your profile data. Select a section type, pick a grant, and AI writes grant-ready prose.", nav: "aidraft" },
  { title: "AI Chat Assistant 🧠", desc: "The floating chat button (bottom-right) gives you an AI advisor who knows your entire portfolio. Ask about strategy, priorities, or draft content." },
  { title: "Command Palette ⌘K", desc: "Press ⌘K (or Ctrl+K) anytime to quickly search and jump to any module, grant, or action. Power-user navigation." },
  { title: "Profile Settings ⚙️", desc: "Your profile drives everything — search keywords, fit scoring, and narrative auto-fill. Keep it updated for best results.", nav: "profile" },
  { title: "You're Ready! 🚀", desc: "Start by running a Discovery scan to find grants, or use the AI Drafter to begin your first application. Good luck!" },
];

function GuidedTour({ onClose, onNav }) {
  const [step, setStep] = useState(0);
  const s = TOUR_STEPS[step];
  
  const next = () => {
    if (step < TOUR_STEPS.length - 1) {
      const ns = TOUR_STEPS[step + 1];
      if (ns.nav) onNav(ns.nav);
      setStep(step + 1);
    } else {
      try { localStorage.setItem("glp_tour_done", "1"); } catch {}
      onClose();
    }
  };
  
  return (
    <>
      <div className="tour-overlay" onClick={onClose} />
      <div className="tour-card" style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: T.tx, fontFamily: "var(--d)", marginBottom: 8 }}>{s.title}</div>
        <div style={{ fontSize: 13, color: T.mu, lineHeight: 1.7, marginBottom: 20 }}>{s.desc}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 4 }}>
            {TOUR_STEPS.map((_, i) => (
              <div key={i} className="step-dot" style={{ background: i === step ? T.am : i < step ? T.gn : T.bd, width: i === step ? 20 : 8 }} />
            ))}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <Btn small ghost onClick={onClose}>Skip</Btn>
            <Btn small primary onClick={next}>{step < TOUR_STEPS.length - 1 ? "Next →" : "✅ Done"}</Btn>
          </div>
        </div>
      </div>
    </>
  );
}

// ══════ HELP TOOLTIP — Contextual hover tips ══════
const HelpTip = ({ text }) => (
  <span className="help-tip">?<div className="help-popup">{text}</div></span>
);

// ══════ ONE-CLICK APPLICATION PREP — AI auto-drafts all sections with intelligence data ══════
function AppPrepModal({ grant, onClose, profile, intel }) {
  const [status, setStatus] = useState("idle");
  const [sections, setSections] = useState([]);
  const [progress, setProgress] = useState(0);
  
  const intelCtx = buildIntelligenceContext(intel || {});
  const hasIntel = intelCtx.length > 50;

  const runPrep = async () => {
    if (!getAIKey()) { showToast("Add API key in Profile to use AI features", "warn"); return; }
    setStatus("checking");
    
    const sectionTypes = [
      { key: "executive_summary", label: "Executive Summary", prompt: "Write a compelling executive summary that references the community's demographics and the funding landscape" },
      { key: "project_description", label: "Project Description", prompt: "Describe the project goals, methods, and timeline with data-driven context" },
      { key: "need_statement", label: "Statement of Need", prompt: "Write a data-driven Statement of Need citing specific Census ACS demographics (poverty rate, disability rate, unemployment, broadband access) and local award context. Include parenthetical citations." },
      { key: "organizational_capacity", label: "Organizational Capacity", prompt: "Describe the applicant's qualifications and track record, referencing competitive landscape and relevant CFDA programs" },
      { key: "budget_narrative", label: "Budget Narrative", prompt: "Provide a detailed budget justification. Reference CFDA program funding levels and comparable awards to contextualize the budget request" },
      { key: "evaluation_plan", label: "Evaluation Plan", prompt: "Describe how success will be measured with quantifiable metrics tied to community demographics" },
      { key: "sustainability", label: "Sustainability Plan", prompt: "Explain how the project continues after funding, referencing the broader funding landscape and potential future grant programs" },
    ];
    
    setSections(sectionTypes.map(s => ({ ...s, status: "pending", text: "" })));
    setStatus("drafting");
    
    const ctx = buildPortfolioContext(profile, [], []);
    for (let i = 0; i < sectionTypes.length; i++) {
      const sec = sectionTypes[i];
      setProgress(Math.round((i / sectionTypes.length) * 100));
      setSections(prev => prev.map((s, j) => j === i ? { ...s, status: "generating" } : s));
      
      try {
        const text = await callAI(
          `You are an expert grant writer. Write the "${sec.label}" section for a grant application. Use the applicant's actual profile data AND the live intelligence data provided. CITE SPECIFIC STATISTICS with parenthetical sources (e.g., "(Source: U.S. Census Bureau, ACS 2022)"). Be specific, compelling, and professional. 2-3 paragraphs, ~250 words. First person where appropriate.`,
          `${sec.prompt} for this grant: ${grant.name} (from ${grant.source}). Amount: ${grant.amt}.\n\n${ctx}${intelCtx}\n\nGrant notes: ${grant.notes || "None"}`
        );
        setSections(prev => prev.map((s, j) => j === i ? { ...s, status: "done", text } : s));
      } catch (e) {
        setSections(prev => prev.map((s, j) => j === i ? { ...s, status: "error", text: "Failed: " + e.message } : s));
      }
    }
    setProgress(100);
    setStatus("done");
    showToast("Application draft ready!", "success");
  };
  
  const copyAll = () => {
    const full = sections.filter(s => s.text).map(s => `## ${s.label}\n\n${s.text}`).join("\n\n---\n\n");
    navigator.clipboard.writeText(full);
    showToast("Full application copied to clipboard");
  };
  
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,.6)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", paddingTop: "8vh", animation: "fadeIn .15s" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 560, maxHeight: "80vh", overflow: "auto", background: T.pn, border: `1px solid ${T.bd}`, borderRadius: 16, boxShadow: `0 24px 80px rgba(0,0,0,.4)`, animation: "slideUp .3s ease" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.bd}40`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.tx, fontFamily: "var(--d)" }}>🤖 One-Click Application Prep</div>
            <div style={{ fontSize: 10, color: T.mu, marginTop: 2 }}>{grant.name} — {grant.source}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: T.mu, cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>
        
        <div style={{ padding: 20 }}>
          {status === "idle" && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>✨</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.tx, marginBottom: 6 }}>AI will generate 7 application sections</div>
              <div style={{ fontSize: 11, color: T.mu, marginBottom: 12, lineHeight: 1.6 }}>
                Using your profile data{hasIntel ? " + live intelligence from 15 federal APIs" : ""}, the AI will draft a complete application with{hasIntel ? " real demographic data, funding context, and competitive positioning — all with citations." : " your profile narratives and grant details."}
              </div>
              {hasIntel && (
                <div style={{ marginBottom: 12, padding: "6px 10px", background: T.gn + "08", border: `1px solid ${T.gn}20`, borderRadius: 6, textAlign: "left" }}>
                  <div style={{ fontSize: 8, fontWeight: 700, color: T.gn, marginBottom: 2 }}>🧠 Intelligence sources active:</div>
                  <div style={{ fontSize: 7, color: T.mu }}>{[
                    intel?.censusData && `Census ACS (pop: ${intel.censusData.totalPop?.toLocaleString()}, poverty: ${intel.censusData.povertyPct}%)`,
                    intel?.localAwards?.length > 0 && `${intel.localAwards.length} local awards`,
                    intel?.cfdaPrograms?.length > 0 && `${intel.cfdaPrograms.length} CFDA programs`,
                    intel?.spendTrends?.length > 0 && "spending trends",
                    intel?.awardIntel?.length > 0 && `${intel.awardIntel.length} competitive awards`,
                    intel?.funderIntel?.details?.length > 0 && "nonprofit research",
                    intel?.facIntel?.length > 0 && "audit data",
                  ].filter(Boolean).join(" · ")}</div>
                </div>
              )}
              {!hasIntel && (
                <div style={{ marginBottom: 12, padding: "6px 10px", background: T.yl + "08", border: `1px solid ${T.yl}20`, borderRadius: 6, textAlign: "left" }}>
                  <div style={{ fontSize: 8, fontWeight: 700, color: T.yl }}>💡 Tip: Run Discovery → Full Scan first for data-rich applications with Census citations</div>
                </div>
              )}
              <Btn primary onClick={runPrep}>🚀 Generate Full Application</Btn>
            </div>
          )}
          
          {(status === "drafting" || status === "checking") && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: T.am }}>Generating sections...</span>
                <span style={{ fontSize: 10, color: T.mu, fontFamily: "var(--m)" }}>{progress}%</span>
              </div>
              <div style={{ height: 4, background: T.bd, borderRadius: 2, overflow: "hidden" }}>
                <div style={{ width: `${progress}%`, height: "100%", background: `linear-gradient(90deg, ${T.am}, ${T.gn})`, borderRadius: 2, transition: "width .3s" }} />
              </div>
            </div>
          )}
          
          {sections.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {sections.map((sec, i) => (
                <div key={i} style={{ padding: "10px 12px", background: sec.status === "done" ? `${T.gn}06` : sec.status === "generating" ? `${T.am}06` : T.sf, border: `1px solid ${sec.status === "done" ? T.gn + "20" : sec.status === "generating" ? T.am + "20" : T.bd}`, borderRadius: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: sec.text ? 6 : 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.tx }}>
                      {sec.status === "done" ? "✅" : sec.status === "generating" ? "⏳" : sec.status === "error" ? "❌" : "⬜"} {sec.label}
                    </div>
                    {sec.text && sec.status === "done" && (
                      <button onClick={() => { navigator.clipboard.writeText(sec.text); showToast(`${sec.label} copied`); }} style={{ background: "none", border: "none", color: T.am, fontSize: 9, cursor: "pointer", fontWeight: 600 }}>📋 Copy</button>
                    )}
                  </div>
                  {sec.text && <div style={{ fontSize: 10, color: T.sb, lineHeight: 1.6, whiteSpace: "pre-wrap", maxHeight: 120, overflow: "auto" }}>{sec.text}</div>}
                </div>
              ))}
            </div>
          )}
          
          {status === "done" && (
            <div style={{ marginTop: 12, display: "flex", gap: 8, justifyContent: "center" }}>
              <Btn primary onClick={copyAll}>📋 Copy Full Application</Btn>
              <Btn onClick={onClose}>Done</Btn>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════ AI DOCUMENT GAP ANALYSIS ══════
function DocGapAnalysis({ grants, docs }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const runAnalysis = async () => {
    if (!getAIKey()) { showToast("Add API key in Profile", "warn"); return; }
    setLoading(true);
    try {
      const ctx = buildPortfolioContext(P, grants, docs);
      const docList = docs.map(d => `${d.nm} (${d.cat}) — Status: ${d.st}`).join("\n");
      const grantList = grants.filter(g => !["rejected","completed"].includes(g.stage)).map(g => `${g.name} (${g.source}) — Stage: ${g.stage}, Fit: ${g.fit}%`).join("\n");
      
      const text = await callAI(
        "You are a grant compliance advisor. Analyze the applicant's document library against their active grants and identify gaps. Return ONLY valid JSON array, no markdown fences.",
        `Analyze document gaps. Return JSON array of objects with: { "priority": "critical"|"high"|"medium", "document": "name", "reason": "why needed", "grants": ["which grants need it"], "suggestion": "how to create/obtain it" }

ACTIVE GRANTS:
${grantList || "None yet — suggest core documents any grant applicant needs"}

EXISTING DOCUMENTS:
${docList || "None — all documents need to be created"}

PROFILE:
${ctx}

Identify 5-8 most important document gaps. Focus on documents commonly required for federal grants.`
      );
      
      const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      setAnalysis(JSON.parse(cleaned));
    } catch (e) {
      showToast("Analysis failed: " + e.message, "warn");
    }
    setLoading(false);
  };
  
  const priorityColors = { critical: T.rd, high: T.or, medium: T.yl };
  
  return (
    <Cd sx={{ marginTop: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: analysis ? 10 : 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 14 }}>🔍</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.tx, fontFamily: "var(--d)" }}>AI Document Gap Analysis</div>
            {!analysis && !loading && <div style={{ fontSize: 9, color: T.mu }}>AI reviews your documents against grant requirements</div>}
          </div>
        </div>
        <Btn small primary onClick={runAnalysis} disabled={loading}>{loading ? "⏳ Analyzing..." : analysis ? "🔄 Re-analyze" : "🤖 Analyze Gaps"}</Btn>
      </div>
      {loading && <div style={{ textAlign: "center", padding: 16 }}><div style={{ animation: "pulse 1.5s infinite", fontSize: 20 }}>🔍</div><div style={{ fontSize: 10, color: T.mu, marginTop: 6 }}>Scanning documents against grant requirements...</div></div>}
      {analysis && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {analysis.map((gap, i) => (
            <div key={i} style={{ padding: "8px 10px", background: (priorityColors[gap.priority] || T.yl) + "06", border: `1px solid ${(priorityColors[gap.priority] || T.yl)}20`, borderRadius: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.tx }}>{gap.document}</div>
                <B c={priorityColors[gap.priority] || T.yl}>{gap.priority}</B>
              </div>
              <div style={{ fontSize: 9, color: T.mu, marginTop: 2 }}>{gap.reason}</div>
              {gap.grants && gap.grants.length > 0 && <div style={{ fontSize: 8, color: T.am, marginTop: 2 }}>Needed for: {gap.grants.join(", ")}</div>}
              <div style={{ fontSize: 9, color: T.gn, marginTop: 3, fontStyle: "italic" }}>💡 {gap.suggestion}</div>
            </div>
          ))}
        </div>
      )}
    </Cd>
  );
}

// ══════ AI SERVICE LAYER — Claude API Integration ══════

const AI_MODEL = "claude-sonnet-4-20250514";

// Get stored API key
function getAIKey() {
  try { return localStorage.getItem("glp_ai_key") || ""; } catch { return ""; }
}
function getSimplerKey() {
  try { return localStorage.getItem("glp_simpler_key") || ""; } catch { return ""; }
}
function getSAMKey() {
  try { return localStorage.getItem("glp_sam_key") || ""; } catch { return ""; }
}
function getDataGovKey() {
  try { return localStorage.getItem("glp_datagov_key") || "DEMO_KEY"; } catch { return "DEMO_KEY"; }
}
function getCensusKey() {
  try { return localStorage.getItem("glp_census_key") || ""; } catch { return ""; }
}

// Core AI call — sends messages to Claude API, returns text response
async function callAI(system, messages, onChunk) {
  const apiKey = getAIKey();
  try {
    const headers = { "Content-Type": "application/json" };
    if (apiKey) {
      headers["x-api-key"] = apiKey;
      headers["anthropic-version"] = "2023-06-01";
      headers["anthropic-dangerous-direct-browser-access"] = "true";
    }
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: AI_MODEL, max_tokens: 4000,
        system,
        messages: Array.isArray(messages) ? messages : [{ role: "user", content: messages }],
      }),
    });
    if (!res.ok) { const err = await res.text(); throw new Error(`API ${res.status}: ${err}`); }
    const data = await res.json();
    return data.content.map(b => b.type === "text" ? b.text : "").join("");
  } catch (e) {
    console.error("AI call failed:", e);
    throw e;
  }
}

// Build full context string from user's portfolio
function buildPortfolioContext(profile, grants, docs) {
  const p = profile || P;
  const activeGrants = (grants || []).filter(g => !["rejected", "completed"].includes(g.stage));
  const submittedGrants = (grants || []).filter(g => g.stage === "submitted");
  const upcomingDeadlines = (grants || []).filter(g => g.deadlineDate).map(g => ({
    name: g.name, deadline: g.deadlineDate, stage: g.stage, fit: g.fit,
    daysLeft: Math.ceil((new Date(g.deadlineDate) - new Date()) / 86400000)
  })).filter(d => d.daysLeft > 0 && d.daysLeft <= 90).sort((a, b) => a.daysLeft - b.daysLeft);
  const missingDocs = (docs || []).filter(d => d.st === "needed");
  
  return `APPLICANT PROFILE:
Name: ${p.name || "Unknown"}
Location: ${p.loc || "Unknown"}
State: ${p.state || "Unknown"}, County: ${p.county || "Unknown"}
Eligibility Tags: ${(p.tags || []).join(", ") || "None set"}
Industry Sectors: ${(p.sectors || []).join(", ") || "None set"}
Businesses: ${(p.biz || []).map(b => `${b.n} — ${b.d}`).join("; ") || "None"}
Monthly Expenses: $${Object.values(p.expenses || {}).reduce((a, v) => a + v, 0)}
Monthly Income: $${(p.income || {}).disability || 0}

GRANT PORTFOLIO (${(grants || []).length} total, ${activeGrants.length} active):
${activeGrants.slice(0, 15).map(g => `• ${g.name} | Stage: ${g.stage} | Fit: ${g.fit}% | Amount: ${g.amt} | Deadline: ${g.deadlineDate || "TBD"}`).join("\n") || "No active grants"}

UPCOMING DEADLINES:
${upcomingDeadlines.slice(0, 10).map(d => `• ${d.name}: ${d.daysLeft} days (${d.deadline}) — Stage: ${d.stage}`).join("\n") || "None within 90 days"}

AWAITING RESPONSE: ${submittedGrants.length} grants submitted
MISSING DOCUMENTS: ${missingDocs.length} docs needed

FOUNDER NARRATIVE: ${(p.narr || {}).founder_short || "Not set"}
TECH DESCRIPTION: ${((p.narr || {}).tech || "").substring(0, 200) || "Not set"}
DISABILITY CONTEXT: ${((p.narr || {}).disability_brief || "Not set")}`;
}

// ── INTELLIGENCE CONTEXT BUILDER — packages all live API data for AI compound workflows ──
function buildIntelligenceContext(opts = {}) {
  const parts = [];

  // Census ACS Community Data
  if (opts.censusData) {
    const c = opts.censusData;
    parts.push(`COMMUNITY DATA (U.S. Census ACS 2022 — ${c.name || "County"}):
Population: ${(c.totalPop || 0).toLocaleString()}
Median Household Income: $${(c.medianIncome || 0).toLocaleString()}
Poverty Rate: ${c.povertyPct}%
Disability Rate: ${c.disabilityPct}%
Unemployment Rate: ${c.unemploymentPct || "N/A"}%
Bachelor's Degree or Higher: ${c.bachelorsPct || "N/A"}%
Broadband Access: ${c.broadbandPct || "N/A"}%
High School Graduates: ${c.hsGradPct || "N/A"}%
Median Home Value: $${(c.medianHomeValue || 0).toLocaleString()}
Hispanic/Latino: ${c.hispanicPct || "N/A"}% | White: ${c.whitePct || "N/A"}% | Black/African American: ${c.blackPct || "N/A"}%
Labor Force Participation: ${c.laborForcePct || "N/A"}%
Source: U.S. Census Bureau, American Community Survey 5-Year Estimates (2022). Verifiable at data.census.gov.`);
  }

  // Local Award Intelligence
  if (opts.localAwards && opts.localAwards.length > 0) {
    parts.push(`LOCAL GRANT AWARDS (recent federal awards in your county):
${opts.localAwards.slice(0, 6).map(a => `• ${a.recipient}: $${(a.amount || 0).toLocaleString()} from ${a.agency} — ${(a.description || "").slice(0, 80)} (${a.date?.split("T")[0] || "N/A"})`).join("\n")}
Source: USAspending.gov, Federal award data.`);
  }

  // Award Intelligence — who's winning nearby
  if (opts.awardIntel && opts.awardIntel.length > 0) {
    parts.push(`COMPETITIVE AWARD INTELLIGENCE (recent grants in your state):
${opts.awardIntel.slice(0, 6).map(a => `• ${a.recipient}: $${(a.amount || 0).toLocaleString()} — ${a.agency} — ${a.description?.slice(0, 60) || ""}`).join("\n")}
Source: USAspending.gov.`);
  }

  // CFDA Programs — which programs fund your area
  if (opts.cfdaPrograms && opts.cfdaPrograms.length > 0) {
    parts.push(`RELEVANT FEDERAL ASSISTANCE PROGRAMS (CFDA listings funding your area):
${opts.cfdaPrograms.slice(0, 8).map(p => `• ${p.code} — ${p.name}: $${p.amount >= 1e9 ? (p.amount / 1e9).toFixed(1) + "B" : p.amount >= 1e6 ? (p.amount / 1e6).toFixed(0) + "M" : (p.amount / 1e3).toFixed(0) + "K"} (FY2024)`).join("\n")}
Source: USAspending.gov CFDA data.`);
  }

  // Spending Trends
  if (opts.spendTrends && opts.spendTrends.length > 0) {
    parts.push(`GRANT FUNDING TRENDS (${opts.state || "IL"} by fiscal year):
${opts.spendTrends.map(t => `FY${t.year}: $${(t.amount / 1e9).toFixed(1)}B`).join(" | ")}
Source: USAspending.gov.`);
  }

  // Top Recipients
  if (opts.topRecipients && opts.topRecipients.length > 0) {
    parts.push(`TOP GRANT RECIPIENTS IN STATE (FY2024):
${opts.topRecipients.slice(0, 5).map((r, i) => `${i + 1}. ${r.name}: $${r.amount >= 1e9 ? (r.amount / 1e9).toFixed(1) + "B" : (r.amount / 1e6).toFixed(0) + "M"}`).join("\n")}
Source: USAspending.gov.`);
  }

  // County Spending
  if (opts.countySpending && opts.countySpending.length > 0) {
    parts.push(`COUNTY GRANT RANKINGS (${opts.state || "IL"}, FY2024):
${opts.countySpending.slice(0, 6).map((c, i) => `${i + 1}. ${c.name}: $${c.amount >= 1e9 ? (c.amount / 1e9).toFixed(1) + "B" : (c.amount / 1e6).toFixed(0) + "M"}`).join("\n")}
Source: USAspending.gov.`);
  }

  // SBIR Intelligence
  if (opts.sbirIntel && opts.sbirIntel.length > 0) {
    parts.push(`SBIR/STTR COMPETITIVE INTELLIGENCE:
${opts.sbirIntel.slice(0, 5).map(a => `• ${a.firm}: $${(a.amount || 0).toLocaleString()} — ${a.title?.slice(0, 60) || ""} (${a.agency})`).join("\n")}
Source: SBIR.gov.`);
  }

  // Funder Research — ProPublica nonprofit orgs
  if (opts.funderIntel?.details && opts.funderIntel.details.length > 0) {
    parts.push(`NONPROFIT PARTNER/COMPETITOR INTEL (IRS 990 data):
${opts.funderIntel.details.slice(0, 4).map(d => `• ${d.name} (${d.city}, ${d.state}) — Revenue: $${d.revenue >= 1e6 ? (d.revenue / 1e6).toFixed(1) + "M" : (d.revenue || 0).toLocaleString()} — EIN: ${d.ein}`).join("\n")}
Source: ProPublica Nonprofit Explorer, IRS 990 filings.`);
  }

  // FAC Audit Intelligence
  if (opts.facIntel && opts.facIntel.length > 0) {
    parts.push(`COMPLIANCE LANDSCAPE (recent federal single audits in state):
${opts.facIntel.slice(0, 4).map(a => `• ${a.name} (${a.city}): $${a.totalExpended >= 1e6 ? (a.totalExpended / 1e6).toFixed(1) + "M" : a.totalExpended.toLocaleString()} federal expenditures — ${a.auditType}${a.goingConcern === "Y" ? " ⚠ GOING CONCERN" : ""}`).join("\n")}
Source: Federal Audit Clearinghouse (FAC.gov).`);
  }

  // Federal Register Early Warning
  if (opts.fedRegResults && opts.fedRegResults.length > 0) {
    parts.push(`UPCOMING OPPORTUNITIES (Federal Register NOFOs, last 30 days):
${opts.fedRegResults.slice(0, 4).map(r => `• ${r.title} — ${r.agencies} (${r.date})`).join("\n")}
Source: FederalRegister.gov.`);
  }

  // Regulatory Notices
  if (opts.regsIntel && opts.regsIntel.length > 0) {
    parts.push(`REGULATORY CONTEXT (recent grant-related policy notices):
${opts.regsIntel.slice(0, 3).map(r => `• ${r.title} — ${r.agency} (${r.posted?.split("T")[0]})`).join("\n")}
Source: Regulations.gov.`);
  }

  if (parts.length === 0) return "";
  return "\n\n══ LIVE INTELLIGENCE DATA (from 15 federal APIs — cite these sources in your writing) ══\n\n" + parts.join("\n\n");
}

// AI-powered JSON extraction — asks Claude to return structured data
async function callAIJSON(system, prompt) {
  const text = await callAI(
    system + "\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown, no backticks, no preamble.",
    prompt
  );
  const clean = text.replace(/```json\s?|```/g, "").trim();
  return JSON.parse(clean);
}

// Reusable AI loading state hook
function useAI() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  const run = async (system, prompt) => {
    setLoading(true); setError(null); setResult(null);
    try {
      const text = await callAI(system, prompt);
      setResult(text); return text;
    } catch (e) {
      setError(e.message); return null;
    } finally { setLoading(false); }
  };
  
  const runJSON = async (system, prompt) => {
    setLoading(true); setError(null); setResult(null);
    try {
      const data = await callAIJSON(system, prompt);
      setResult(data); return data;
    } catch (e) {
      setError(e.message); return null;
    } finally { setLoading(false); }
  };
  
  return { loading, result, error, run, runJSON, setResult };
}

// ══════ INTELLIGENCE ENGINE ══════
function useIntelligence(grants, docs) {
  return useMemo(() => {
    const pa = s => { const m = s.match(/[\d,]+/g); return m ? Math.max(...m.map(n => parseInt(n.replace(/,/g, "")))) : 0; };
    const active = grants.filter(g => !["rejected", "completed"].includes(g.stage));

    const docUnlocks = docs.filter(d => d.st !== "ready").map(doc => {
      const byReq = active.filter(g => g.requirements.some(r => r.did === doc.id));
      const byGid = active.filter(g => (doc.gids || []).includes(g.id));
      const all = [...new Map([...byReq, ...byGid].map(g => [g.id, g])).values()];
      const value = all.reduce((a, g) => a + pa(g.amount), 0);
      return { doc, grants: all, value, count: all.length };
    }).filter(d => d.count > 0).sort((a, b) => b.value - a.value);

    const criticalPath = docUnlocks.slice(0, 8).map((du, i) => ({
      priority: i + 1, action: `Complete "${du.doc.nm}"`,
      unlocks: du.grants.map(g => g.name), value: du.value, status: du.doc.st,
    }));

    const totalNeed = 17940;
    const scored = active.filter(g => pa(g.amount) > 0).map(g => {
      const rem = g.requirements.filter(r => r.s !== "d").length;
      return { ...g, pAmt: pa(g.amount), eff: (pa(g.amount) * g.fit) / Math.max(1, rem), readiness: g.requirements.length > 0 ? Math.round(g.requirements.filter(r => r.s === "d").length / g.requirements.length * 100) : 0 };
    }).sort((a, b) => b.eff - a.eff);

    const mkScenario = (name, desc, list) => ({
      name, desc, grants: list, total: list.reduce((a, g) => a + g.pAmt, 0),
      coverage: Math.min(100, Math.round(list.reduce((a, g) => a + g.pAmt, 0) / totalNeed * 100)),
      effort: list.reduce((a, g) => a + g.requirements.filter(r => r.s !== "d").length, 0),
    });

    const scenarios = [
      mkScenario("Minimum Effort", "Top 3 by efficiency", scored.slice(0, 3)),
      mkScenario("High-Confidence", "All 85%+ fit", scored.filter(g => g.fit >= 85)),
      mkScenario("Full Portfolio", "Every quantifiable grant", scored),
    ];

    const readiness = active.map(g => {
      const tot = g.requirements.length;
      const dn = g.requirements.filter(r => r.s === "d").length;
      return { ...g, readiness: tot > 0 ? Math.round(dn / tot * 100) : 0, remaining: tot - dn };
    }).sort((a, b) => b.readiness - a.readiness || b.fit - a.fit);

    return { docUnlocks, criticalPath, scenarios, readiness, totalNeed };
  }, [grants, docs]);
}

// ══════ GRANT HEALTH SCORE — composite metric for autonomous prioritization ══════
function calcHealthScore(g) {
  const pa = s => { const m = (s||"").match(/[\d,]+/g); return m ? Math.max(...m.map(n => parseInt(n.replace(/,/g, "")))) : 0; };
  const tot = g.requirements.length;
  const done = g.requirements.filter(r => r.s === "d").length;
  const readiness = tot > 0 ? done / tot * 100 : 50;
  const fitScore = g.fit || 0;
  
  // Deadline urgency (0-100, higher = more urgent = needs attention)
  let deadlineUrgency = 0;
  if (g.deadlineDate) {
    const days = Math.ceil((new Date(g.deadlineDate) - new Date()) / 86400000);
    if (days < 0) deadlineUrgency = 0; // Past
    else if (days <= 7) deadlineUrgency = 100;
    else if (days <= 14) deadlineUrgency = 90;
    else if (days <= 30) deadlineUrgency = 70;
    else if (days <= 60) deadlineUrgency = 50;
    else if (days <= 90) deadlineUrgency = 30;
    else deadlineUrgency = 10;
  } else {
    deadlineUrgency = 20; // Rolling = low urgency
  }
  
  const amount = pa(g.amount);
  const amountScore = amount > 100000 ? 100 : amount > 25000 ? 80 : amount > 5000 ? 60 : amount > 0 ? 40 : 20;
  
  // Composite: weighted blend
  const health = Math.round(
    fitScore * 0.30 +
    readiness * 0.25 +
    deadlineUrgency * 0.25 +
    amountScore * 0.20
  );
  
  const daysLeft = g.deadlineDate ? Math.ceil((new Date(g.deadlineDate) - new Date()) / 86400000) : null;
  
  return { health: Math.max(0, Math.min(100, health)), readiness: Math.round(readiness), deadlineUrgency, daysLeft, amount, amountScore };
}

// ══════ WORKFLOW ENGINE — autonomous "what should I do next?" ══════
function useWorkflow(grants, docs) {
  return useMemo(() => {
    const now = new Date();
    const active = grants.filter(g => !["rejected", "completed"].includes(g.stage));
    const actions = [];
    
    // 1. URGENT DEADLINES — grants due soon with incomplete requirements
    active.filter(g => g.deadlineDate).forEach(g => {
      const days = Math.ceil((new Date(g.deadlineDate) - now) / 86400000);
      const incomplete = g.requirements.filter(r => r.s !== "d").length;
      if (days > 0 && days <= 30 && incomplete > 0) {
        actions.push({
          priority: days <= 7 ? 1 : days <= 14 ? 2 : 3,
          type: "deadline", icon: "🔥",
          title: `${g.name} — ${days} days left, ${incomplete} items incomplete`,
          action: `Complete ${incomplete} requirement${incomplete > 1 ? "s" : ""} before ${new Date(g.deadlineDate).toLocaleDateString()}`,
          nav: "pipe", grantId: g.id,
          color: days <= 7 ? T.rd : days <= 14 ? T.or : T.yl,
        });
      }
    });
    
    // 2. STAGE-BASED SUGGESTIONS — what each stage needs
    active.forEach(g => {
      const hs = calcHealthScore(g);
      if (g.stage === "identified" && g.fit >= 70) {
        actions.push({ priority: 4, type: "advance", icon: "➡️", title: `Advance "${g.name}" to Qualifying`, action: "High-fit grant sitting in Identified — review eligibility and move forward", nav: "pipe", grantId: g.id, color: T.bl });
      }
      if (g.stage === "qualifying") {
        const missingDocs = g.requirements.filter(r => r.s !== "d" && r.t === "d");
        if (missingDocs.length > 0) {
          actions.push({ priority: 4, type: "docs", icon: "📄", title: `"${g.name}" needs ${missingDocs.length} documents`, action: `Prepare: ${missingDocs.map(r => r.n).join(", ")}`, nav: "docbuild", grantId: g.id, color: T.pu });
        }
      }
      if (g.stage === "preparing" && hs.readiness >= 80) {
        actions.push({ priority: 3, type: "advance", icon: "✍️", title: `"${g.name}" is ${hs.readiness}% ready — start drafting`, action: "Requirements nearly complete. Move to Drafting and use AI Drafter.", nav: "aidraft", grantId: g.id, color: T.gn });
      }
      if (g.stage === "drafting" && g.template) {
        actions.push({ priority: 4, type: "template", icon: "📋", title: `Use template for "${g.name}"`, action: "Application template available — fill sections using auto-populated content", nav: "tpl", grantId: g.id, color: T.cy });
      }
    });
    
    // 3. DOCUMENT PRIORITIES — highest dollar-unlock value docs
    const missingDocs = docs.filter(d => d.st === "needed");
    missingDocs.forEach(doc => {
      const linkedGrants = active.filter(g => g.requirements.some(r => r.did === doc.id) || (doc.gids || []).includes(g.id));
      if (linkedGrants.length >= 2) {
        actions.push({ priority: 3, type: "doc_unlock", icon: "🔓", title: `"${doc.nm}" unlocks ${linkedGrants.length} grants`, action: `Completing this document advances: ${linkedGrants.map(g => g.name).join(", ")}`, nav: "docbuild", color: T.am });
      }
    });
    
    // 4. STALE GRANTS — high-fit grants not progressing
    active.filter(g => g.fit >= 80 && ["identified", "qualifying"].includes(g.stage)).forEach(g => {
      actions.push({ priority: 5, type: "stale", icon: "⏰", title: `"${g.name}" (${g.fit}% fit) needs attention`, action: "High-fit grant hasn't advanced — review and take next step", nav: "pipe", grantId: g.id, color: T.mu });
    });
    
    // 5. DISCOVERY SUGGESTION — if pipeline < 10 active grants
    if (active.length < 10) {
      actions.push({ priority: 6, type: "discover", icon: "🔍", title: "Expand your pipeline", action: `Only ${active.length} active grants. Search for new opportunities.`, nav: "discover", color: T.bl });
    }
    
    // 6. FUNDER RESEARCH — if no saved funders
    const savedFunders = (() => { try { return JSON.parse(localStorage.getItem("glp_v5_funders") || "[]"); } catch { return []; } })();
    if (savedFunders.length === 0) {
      actions.push({ priority: 6, type: "research", icon: "🔎", title: "Research potential funders", action: "No funders saved. Search ProPublica for foundations in your area.", nav: "funder", color: T.pu });
    }
    
    return actions.sort((a, b) => a.priority - b.priority).slice(0, 8);
  }, [grants, docs]);
}

// ══════ COMMUNITY DATA — Real Census API ══════
function CommunityData({ onNav, censusConfig }) {
  const cc = censusConfig || { state: "", county: "", name: "", city: "" };
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const loadCensus = async () => {
    setLoading(true); setError(null);
    try {
      const fields = "NAME,B01003_001E,B19013_001E,B23025_003E,B23025_005E,B17001_001E,B17001_002E,B18101_001E,B18101_004E,B18101_007E,B18101_010E,B18101_013E,B18101_016E,B18101_019E,B25077_001E,B15003_022E,B15003_023E,B15003_025E,B15003_001E";
      const resp = await fetch(`${CENSUS_API}?get=${fields}&for=county:${cc.county}&in=state:${cc.state}`);
      if (!resp.ok) throw new Error(`Census API returned ${resp.status}`);
      const raw = await resp.json();
      const h = raw[0], v = raw[1];
      const g = (key) => parseInt(v[h.indexOf(key)] || "0");
      const disTotal = g("B18101_004E")+g("B18101_007E")+g("B18101_010E")+g("B18101_013E")+g("B18101_016E")+g("B18101_019E");
      const bachelorsPlus = g("B15003_022E")+g("B15003_023E")+g("B15003_025E");
      setData({
        name: v[h.indexOf("NAME")],
        population: g("B01003_001E"),
        medianIncome: g("B19013_001E"),
        laborForce: g("B23025_003E"),
        unemployed: g("B23025_005E"),
        unemploymentRate: (g("B23025_005E") / Math.max(1, g("B23025_003E")) * 100).toFixed(1),
        povTotal: g("B17001_001E"),
        povBelow: g("B17001_002E"),
        povertyRate: (g("B17001_002E") / Math.max(1, g("B17001_001E")) * 100).toFixed(1),
        disUniverse: g("B18101_001E"),
        disTotal,
        disRate: (disTotal / Math.max(1, g("B18101_001E")) * 100).toFixed(1),
        medianHome: g("B25077_001E"),
        bachelorsPlus,
        educRate: (bachelorsPlus / Math.max(1, g("B15003_001E")) * 100).toFixed(1),
      });
    } catch (err) { setError("Census API error: " + err.message); }
    setLoading(false);
  };
  
  const copyNarrative = () => {
    if (!data) return;
    const text = `${cc.name} (population ${data.population.toLocaleString()}) faces significant economic challenges. The county's poverty rate of ${data.povertyRate}% and unemployment rate of ${data.unemploymentRate}% reflect limited economic opportunity. ${data.disRate}% of residents (${data.disTotal.toLocaleString()} individuals) live with a disability. Median household income is $${data.medianIncome.toLocaleString()}, and only ${data.educRate}% of adults hold a bachelor's degree or higher, indicating limited access to high-skilled employment. This project directly addresses these systemic barriers by creating economic activity in a community that needs it.`;
    navigator.clipboard.writeText(text);
  };
  
  return (
    <div style={{ animation: "fi .3s ease" }}>
      <Hd i="📊" t="Community Data" s="Real U.S. Census ACS data for grant narratives — auto-generated impact statements">
        <Cd glass sx={{ marginBottom: 10 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <Btn primary onClick={loadCensus} disabled={loading || !cc.state || !cc.county}>{loading ? "⏳ Loading Census..." : cc.state && cc.county ? `📊 Load ${cc.name || "County"} Data` : "⚠ Set State & County FIPS in Profile"}</Btn>
            {data && <Btn onClick={copyNarrative}>📋 Copy Impact Narrative</Btn>}
            {data && onNav && <Btn small onClick={() => onNav("aidraft")}>✍️ Use in AI Drafter →</Btn>}
          </div>
          <div style={{ fontSize: 8, color: T.dm, marginTop: 4 }}>Source: U.S. Census Bureau American Community Survey 5-Year Estimates (2022) · Free, no API key · Public domain</div>
        </Cd>
        
        {error && <div style={{ padding: "6px 10px", background: T.rd + "14", border: `1px solid ${T.rd}30`, borderRadius: 4, fontSize: 9, color: T.rd, marginBottom: 8 }}>⚠ {error}</div>}
        
        {!data && !loading && !error && (
          <Cd sx={{ textAlign: "center", padding: 20 }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>📊</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.tx }}>Census Data for Grant Narratives</div>
            <div style={{ fontSize: 9, color: T.mu, marginTop: 3 }}>Load real demographic data for your county to strengthen grant applications. Get population, poverty rate, disability rate, unemployment, income, and education statistics — all sourced from U.S. Census ACS data.</div>
            <div style={{ fontSize: 8, color: T.dm, marginTop: 6 }}>Click "Load" to fetch live data from the Census Bureau API</div>
          </Cd>
        )}
        
        {data && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.am, fontFamily: "var(--d)", marginBottom: 8 }}>{data.name}</div>
            <SG items={[
              { l: "Population", v: data.population.toLocaleString(), c: T.bl },
              { l: "Poverty Rate", v: data.povertyRate + "%", c: parseFloat(data.povertyRate) > 12 ? T.rd : T.yl },
              { l: "Disability Rate", v: data.disRate + "%", c: T.pu },
              { l: "Unemployment", v: data.unemploymentRate + "%", c: parseFloat(data.unemploymentRate) > 5 ? T.rd : T.yl },
            ]} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
              <Cd>
                <div style={{ fontSize: 10, fontWeight: 800, color: T.am, marginBottom: 6, fontFamily: "var(--d)" }}>Economic Profile</div>
                {[
                  ["Median Household Income", "$" + data.medianIncome.toLocaleString()],
                  ["Labor Force", data.laborForce.toLocaleString()],
                  ["Unemployed", data.unemployed.toLocaleString()],
                  ["Below Poverty Line", `${data.povBelow.toLocaleString()} of ${data.povTotal.toLocaleString()}`],
                  ["Median Home Value", "$" + data.medianHome.toLocaleString()],
                  ["Bachelor's Degree+", data.educRate + "%"],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: `1px solid ${T.bd}`, fontSize: 9 }}>
                    <span style={{ color: T.sb }}>{l}</span>
                    <span style={{ color: T.tx, fontWeight: 700, fontFamily: "var(--m)" }}>{v}</span>
                  </div>
                ))}
              </Cd>
              <Cd>
                <div style={{ fontSize: 10, fontWeight: 800, color: T.am, marginBottom: 6, fontFamily: "var(--d)" }}>Disability Profile</div>
                {[
                  ["Total with Disability", data.disTotal.toLocaleString()],
                  ["Disability Rate", data.disRate + "%"],
                  ["IL Average", "~12.4%"],
                  ["National Average", "~13.4%"],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: `1px solid ${T.bd}`, fontSize: 9 }}>
                    <span style={{ color: T.sb }}>{l}</span>
                    <span style={{ color: T.tx, fontWeight: 700, fontFamily: "var(--m)" }}>{v}</span>
                  </div>
                ))}
                <div style={{ marginTop: 6, padding: 6, background: T.bg, borderRadius: 3, fontSize: 8, color: T.mu, lineHeight: 1.5 }}>
                  💡 Use these stats in USDA RBDG, DCEO, and VR applications to demonstrate community need. The poverty and disability data strengthens eligibility arguments.
                </div>
              </Cd>
            </div>
            <Cd sx={{ marginTop: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: T.am, marginBottom: 4, fontFamily: "var(--d)" }}>📝 Auto-Generated Impact Narrative</div>
              <div style={{ fontSize: 9, color: T.tx, lineHeight: 1.6, padding: "8px 10px", background: T.bg, borderRadius: 4, border: `1px solid ${T.bd}` }}>
                {cc.name} (population {data.population.toLocaleString()}) faces significant economic challenges. The county's poverty rate of {data.povertyRate}% and unemployment rate of {data.unemploymentRate}% reflect limited economic opportunity. {data.disRate}% of residents ({data.disTotal.toLocaleString()} individuals) live with a disability. Median household income is ${data.medianIncome.toLocaleString()}, and only {data.educRate}% of adults hold a bachelor's degree or higher, indicating limited access to high-skilled employment. This project directly addresses these systemic barriers by creating economic activity in a community that needs it.
              </div>
              <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                <Btn small primary onClick={copyNarrative}>📋 Copy Narrative</Btn>
                {onNav && <Btn small onClick={() => onNav("aidraft")}>✍️ Use in AI Drafter</Btn>}
                {onNav && <Btn small onClick={() => onNav("tpl")}>📋 Paste into Template</Btn>}
              </div>
            </Cd>
          </div>
        )}
      </Hd>
    </div>
  );
}

// ══════ 1. DASHBOARD ══════
function Dash({ G, D, PR, intel, workflow, onNav, apiIntel }) {
  const [exp, setExp] = useState(null);
  const ai = useAI();
  const act = G.filter(g => !["rejected", "completed"].includes(g.stage));
  const hi = act.filter(g => g.fit >= 85);
  const cP = PR.filter(p => p.pr === "critical" && p.st !== "enrolled");
  const stF = ["identified", "qualifying", "preparing", "drafting", "review", "submitted", "pending", "awarded", "active", "closeout", "completed"];
  const mE = Object.values(P.expenses || {}).reduce((a, v) => a + v, 0), mI = Object.values(P.income || {}).reduce((a, v) => a + v, 0);

  const apiIntelCtx = buildIntelligenceContext(apiIntel || {});

  // Auto-trigger AI briefing on first dashboard load if user has grants + API key
  const briefingTriggered = useRef(false);
  useEffect(() => {
    if (!briefingTriggered.current && G.length > 0 && getAIKey() && !ai.result && !ai.loading) {
      briefingTriggered.current = true;
      ai.run(
        "You are a grant strategy advisor. Analyze the applicant's portfolio and provide a concise daily briefing. Format with clear sections using emoji headers. Be specific — reference actual grant names, deadlines, and amounts. If intelligence data is available, reference Census demographics, local awards, and funding trends. Focus on: 1) Top 3 priority actions today, 2) Risk alerts (upcoming deadlines, missing docs), 3) Strategic opportunities (reference funding landscape data if available), 4) Quick wins. Keep it actionable and under 500 words.",
        buildPortfolioContext(P, G, D) + apiIntelCtx
      );
    }
  }, [G.length]);

  // Smart alerts
  const now = new Date();
  const urgentDeadlines = G.filter(g => g.deadlineDate).map(g => ({ ...g, daysLeft: Math.ceil((new Date(g.deadlineDate) - now) / 86400000) })).filter(g => g.daysLeft > 0 && g.daysLeft <= 30).sort((a, b) => a.daysLeft - b.daysLeft);
  const missingDocs = D.filter(d => d.st === "needed");
  const staleGrants = G.filter(g => ["identified", "qualifying"].includes(g.stage) && g.fit >= 70);
  const submitted = G.filter(g => g.stage === "submitted");

  return (
    <div style={{ animation: "fi .3s ease" }}>
      {/* NEW USER WELCOME — shown when pipeline is empty */}
      {G.length === 0 && (
        <Cd hero sx={{ marginBottom: 14, textAlign: "center", padding: "32px 20px" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🚀</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.tx, fontFamily: "var(--d)", marginBottom: 8 }}>
            Welcome{P.name ? `, ${P.name}` : ""}!
          </div>
          <div style={{ fontSize: 13, color: T.mu, lineHeight: 1.7, maxWidth: 500, margin: "0 auto 20px" }}>
            Your grant command center is ready. Start by discovering opportunities that match your profile, or use the AI Drafter to begin your first application.
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            <div className="quick-action primary" onClick={() => onNav("discover")}>📡 Discover Grants</div>
            <div className="quick-action" onClick={() => onNav("aidraft")}>✍️ AI Drafter</div>
            <div className="quick-action" onClick={() => onNav("funder")}>🔍 Research Funders</div>
            <div className="quick-action" onClick={() => onNav("profile")}>⚙️ Edit Profile</div>
          </div>
          {!getAIKey() && (
            <div style={{ marginTop: 16, padding: "8px 14px", background: `${T.or}08`, border: `1px solid ${T.or}20`, borderRadius: 8, display: "inline-block" }}>
              <div style={{ fontSize: 10, color: T.or }}>💡 Add your Anthropic API key in <span style={{ fontWeight: 700, cursor: "pointer", textDecoration: "underline" }} onClick={() => onNav("profile")}>Profile → Identity</span> to unlock AI features</div>
            </div>
          )}
        </Cd>
      )}

      {/* SMART ALERTS BANNER */}
      {(urgentDeadlines.length > 0 || missingDocs.length >= 3 || submitted.length > 0) && (
        <Cd accent sx={{ marginBottom: 12, borderColor: urgentDeadlines.some(d => d.daysLeft <= 7) ? T.rd + "40" : T.yl + "30" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: T.rd, marginBottom: 6, fontFamily: "var(--d)" }}>🔔 Alerts</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {urgentDeadlines.slice(0, 3).map(g => (
              <div key={g.id} onClick={() => onNav("time")} style={{ padding: "4px 8px", background: g.daysLeft <= 7 ? T.rd + "15" : T.yl + "10", borderRadius: 5, cursor: "pointer", border: `1px solid ${g.daysLeft <= 7 ? T.rd + "30" : T.yl + "20"}`, flex: "1 1 200px" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: T.tx }}>{g.name}</div>
                <div style={{ fontSize: 8, color: g.daysLeft <= 7 ? T.rd : T.yl, fontWeight: 700 }}>⏰ {g.daysLeft} days left · {g.deadlineDate}</div>
              </div>
            ))}
            {missingDocs.length >= 3 && (
              <div onClick={() => onNav("docbuild")} style={{ padding: "4px 8px", background: T.or + "10", borderRadius: 5, cursor: "pointer", border: `1px solid ${T.or}20`, flex: "1 1 200px" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: T.or }}>📄 {missingDocs.length} documents needed</div>
                <div style={{ fontSize: 8, color: T.mu }}>Click to open Doc Builder →</div>
              </div>
            )}
            {submitted.length > 0 && (
              <div onClick={() => onNav("pipe")} style={{ padding: "4px 8px", background: T.bl + "10", borderRadius: 5, cursor: "pointer", border: `1px solid ${T.bl}20`, flex: "1 1 200px" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: T.bl }}>📤 {submitted.length} awaiting response</div>
                <div style={{ fontSize: 8, color: T.mu }}>Check pipeline for updates →</div>
              </div>
            )}
            {staleGrants.length > 3 && (
              <div onClick={() => onNav("pipe")} style={{ padding: "4px 8px", background: T.pu + "10", borderRadius: 5, cursor: "pointer", border: `1px solid ${T.pu}20`, flex: "1 1 200px" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: T.pu }}>⚡ {staleGrants.length} high-fit grants not started</div>
                <div style={{ fontSize: 8, color: T.mu }}>Move to qualifying or preparing →</div>
              </div>
            )}
          </div>
        </Cd>
      )}

      {/* WORKFLOW ENGINE — "What should I do next?" */}
      {workflow && workflow.length > 0 && (
        <Cd sx={{ marginBottom: 12, borderLeft: `3px solid ${T.am}` }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: T.am, marginBottom: 6, fontFamily: "var(--d)" }}>🧭 What Should I Do Next?</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {workflow.slice(0, 5).map((w, i) => (
              <div key={i} onClick={() => { if (w.nav) onNav(w.nav); }} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "6px 8px", background: w.color + "08", borderRadius: 5, cursor: w.nav ? "pointer" : "default", border: `1px solid ${w.color}18`, transition: "border-color .12s" }} onMouseEnter={e => e.currentTarget.style.borderColor = w.color + "40"} onMouseLeave={e => e.currentTarget.style.borderColor = w.color + "18"}>
                <div style={{ fontSize: 14, flexShrink: 0, width: 22, textAlign: "center" }}>{w.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.tx }}>{w.title}</div>
                  <div style={{ fontSize: 8, color: T.mu, marginTop: 1 }}>{w.action}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 900, color: w.color, fontFamily: "var(--d)", flexShrink: 0 }}>#{i + 1}</div>
              </div>
            ))}
          </div>
        </Cd>
      )}

      {/* AI BRIEFING — Claude-powered daily intelligence */}
      <Cd hero sx={{ marginBottom: 14, position: "relative", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: ai.result ? 10 : 0 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.am, fontFamily: "var(--d)", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>🧠</span> AI Intelligence Briefing
            </div>
            {!ai.result && !ai.loading && <div style={{ fontSize: 11, color: T.mu, marginTop: 4 }}>Get an AI-powered analysis of your grant portfolio, priorities, and recommended actions.</div>}
          </div>
          <Btn small primary onClick={() => ai.run(
            "You are a grant strategy advisor. Analyze the applicant's portfolio and provide a concise daily briefing. Format with clear sections using emoji headers. Be specific — reference actual grant names, deadlines, and amounts. If intelligence data is available, reference Census demographics, local awards, and funding trends. Focus on: 1) Top 3 priority actions today, 2) Risk alerts (upcoming deadlines, missing docs), 3) Strategic opportunities (reference funding landscape data if available), 4) Quick wins. Keep it actionable and under 500 words.",
            buildPortfolioContext(P, G, D) + apiIntelCtx
          )} disabled={ai.loading}>
            {ai.loading ? "⏳ Analyzing..." : ai.result ? "🔄 Refresh" : "⚡ Generate Briefing"}
          </Btn>
        </div>
        {ai.loading && (
          <div style={{ padding: "20px 0", textAlign: "center" }}>
            <div style={{ fontSize: 24, animation: "pulse 1.5s infinite" }}>🧠</div>
            <div style={{ fontSize: 11, color: T.mu, marginTop: 8 }}>Claude is analyzing your portfolio...</div>
          </div>
        )}
        {ai.error && <div style={{ padding: "8px 12px", background: T.rd + "12", border: `1px solid ${T.rd}25`, borderRadius: 8, fontSize: 11, color: T.rd, marginTop: 6 }}>⚠️ {ai.error}</div>}
        {ai.result && typeof ai.result === "string" && (
          <div style={{ fontSize: 12, color: T.sb, lineHeight: 1.7, whiteSpace: "pre-wrap", padding: "12px 0 4px", borderTop: `1px solid ${T.bd}30`, marginTop: 6 }}>
            {ai.result}
          </div>
        )}
      </Cd>

      <Hd i="🎛️" t="Command Center" s="Click any card to navigate — click items to expand">
        <SG items={[
          { l: "Opportunities", v: act.length, c: T.bl }, { l: "High-Fit", v: hi.length, c: T.gn },
          { l: "In Progress", v: G.filter(g => ["preparing", "drafting", "review", "submitted", "pending"].includes(g.stage)).length, c: T.yl },
          { l: "Docs Ready", v: D.filter(d => d.st === "ready").length, c: T.cy },
          { l: "Docs Needed", v: D.filter(d => d.st === "needed").length, c: T.rd },
        ]} />
      </Hd>

      {/* Pipeline Flow — clickable stages */}
      <Hd i="🔄" t="Pipeline Flow">
        <div style={{ overflowX: "auto" }}><div style={{ display: "flex", gap: 2, minWidth: stF.length * 66 }}>
          {stF.map(s => { const st = STG[s], cnt = G.filter(g => g.stage === s).length; return (
            <div key={s} onClick={() => cnt > 0 && onNav("pipe")} style={{ flex: 1, minWidth: 55, textAlign: "center", padding: "5px 2px", background: cnt > 0 ? st.c + "08" : "transparent", borderRadius: 3, cursor: cnt > 0 ? "pointer" : "default", transition: "background .15s" }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: cnt > 0 ? st.c : T.dm, fontFamily: "var(--d)" }}>{cnt}</div>
              <div style={{ fontSize: 6, color: cnt > 0 ? st.c : T.dm, textTransform: "uppercase", fontWeight: 700 }}>{st.l}</div>
            </div>
          ); })}
        </div></div>
      </Hd>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {/* Critical Path — clickable items, card navigates to Strategy */}
        <Cd onClick={() => setExp(exp === "cp" ? null : "cp")} sx={{ cursor: "pointer" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: T.cy, fontFamily: "var(--d)" }}>🧠 Critical Path</div>
            <Btn small onClick={e => { e.stopPropagation(); onNav("strategy"); }}>View All →</Btn>
          </div>
          <div style={{ fontSize: 8, color: T.mu, marginBottom: 4 }}>Documents ranked by value unlocked</div>
          {intel.criticalPath.slice(0, exp === "cp" ? 8 : 4).map((cp, i) => (
            <div key={i} onClick={e => { e.stopPropagation(); onNav("docbuild"); }} style={{ padding: "4px 6px", borderBottom: `1px solid ${T.bd}`, cursor: "pointer", borderRadius: 2, transition: "background .1s" }} onMouseEnter={e => e.currentTarget.style.background = T.cd} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: T.tx }}>{cp.priority}. {cp.action}</span>
                <span style={{ fontSize: 10, fontWeight: 800, color: T.gn, fontFamily: "var(--m)" }}>${cp.value > 0 ? cp.value.toLocaleString() : "—"}</span>
              </div>
              <div style={{ fontSize: 8, color: T.am }}>→ {cp.unlocks.join(", ")}</div>
            </div>
          ))}
          {exp !== "cp" && intel.criticalPath.length > 4 && <div style={{ fontSize: 8, color: T.dm, textAlign: "center", marginTop: 3 }}>Click to show {intel.criticalPath.length - 4} more</div>}
        </Cd>

        {/* Priority Actions — clickable items */}
        <Cd onClick={() => setExp(exp === "pa" ? null : "pa")} sx={{ cursor: "pointer" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: T.rd, fontFamily: "var(--d)" }}>🚨 Priority Actions</div>
            <Btn small onClick={e => { e.stopPropagation(); onNav("actions"); }}>Action Plan →</Btn>
          </div>
          {cP.slice(0, exp === "pa" ? 5 : 3).map(p => (
            <div key={p.id} onClick={e => { e.stopPropagation(); onNav("personal"); }} style={{ padding: "4px 6px", borderBottom: `1px solid ${T.bd}`, cursor: "pointer", borderRadius: 2 }} onMouseEnter={e => e.currentTarget.style.background = T.cd} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.tx }}>{p.n}</div>
              <div style={{ fontSize: 9, color: T.am }}>→ {p.act}</div>
            </div>
          ))}
          {hi.filter(g => g.stage === "identified").slice(0, 2).map(g => (
            <div key={g.id} onClick={e => { e.stopPropagation(); onNav("pipe"); }} style={{ padding: "4px 6px", borderBottom: `1px solid ${T.bd}`, cursor: "pointer", borderRadius: 2 }} onMouseEnter={e => e.currentTarget.style.background = T.cd} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.tx }}>{g.name} <B c={T.gn}>{g.fit}%</B></div>
            </div>
          ))}
        </Cd>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {/* Financial — click navigates to Modeler */}
        <Cd onClick={() => onNav("finmodel")} sx={{ cursor: "pointer" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: T.am, fontFamily: "var(--d)" }}>💰 Financial</div>
            <span style={{ fontSize: 8, color: T.dm }}>Click to model →</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div><div style={{ fontSize: 7, color: T.mu }}>Income</div><div style={{ fontSize: 14, fontWeight: 900, color: T.gn, fontFamily: "var(--m)" }}>${mI}</div></div>
            <div><div style={{ fontSize: 7, color: T.mu }}>Expenses</div><div style={{ fontSize: 14, fontWeight: 900, color: T.rd, fontFamily: "var(--m)" }}>${mE}</div></div>
            <div><div style={{ fontSize: 7, color: T.mu }}>Gap</div><div style={{ fontSize: 14, fontWeight: 900, color: T.rd, fontFamily: "var(--m)" }}>${mE - mI}</div></div>
          </div>
        </Cd>

        {/* Strategy — click navigates */}
        <Cd onClick={() => onNav("strategy")} sx={{ cursor: "pointer" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: T.pu, fontFamily: "var(--d)" }}>🎯 Best Strategy</div>
            <span style={{ fontSize: 8, color: T.dm }}>Click to explore →</span>
          </div>
          {intel.scenarios[1] && (<div><div style={{ fontSize: 10, fontWeight: 700, color: T.tx }}>{intel.scenarios[1].name}</div><div style={{ fontSize: 9, color: T.mu }}>{intel.scenarios[1].grants.length} apps → ${intel.scenarios[1].total.toLocaleString()}</div><div style={{ fontSize: 9, color: T.gn }}>{intel.scenarios[1].coverage}% coverage</div></div>)}
        </Cd>
      </div>
    </div>
  );
}

// ══════ 2. STRATEGY ENGINE ══════
function Strategy({ intel, onNav }) {
  const [sc, setSc] = useState(0);
  const [expDoc, setExpDoc] = useState(null);
  const [expG, setExpG] = useState(null);
  return (
    <div style={{ animation: "fi .3s ease" }}>
      <Hd i="🧠" t="Strategy Engine" s="Click documents to see linked grants · Click grants for details">
        <Cd sx={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.cy, fontFamily: "var(--d)" }}>📐 Critical Path — Document Priority</div>
            <Btn small onClick={() => onNav("docbuild")}>Open Doc Builder →</Btn>
          </div>
          {intel.docUnlocks.map((du, i) => (
            <div key={du.doc.id}>
              <div onClick={() => setExpDoc(expDoc === du.doc.id ? null : du.doc.id)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 7px", background: expDoc === du.doc.id ? T.cd : i === 0 ? T.gn + "08" : T.bg, borderRadius: 4, marginBottom: 2, borderLeft: `3px solid ${i < 3 ? T.gn : i < 6 ? T.yl : T.bl}`, cursor: "pointer", transition: "background .12s" }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: T.mu, fontFamily: "var(--m)", minWidth: 20 }}>#{i + 1}</div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 10, fontWeight: 700, color: T.tx }}>{du.doc.nm} <B c={du.doc.st === "needed" ? T.rd : T.yl}>{du.doc.st.toUpperCase()}</B></div><div style={{ fontSize: 8, color: T.mu }}>{du.count} grants · click to expand</div></div>
                <div style={{ textAlign: "right" }}><div style={{ fontSize: 11, fontWeight: 800, color: T.gn, fontFamily: "var(--m)" }}>${du.value.toLocaleString()}</div></div>
              </div>
              {expDoc === du.doc.id && (
                <div style={{ marginLeft: 28, padding: "4px 8px", marginBottom: 4, background: T.bg, borderRadius: 3, border: `1px solid ${T.bd}` }}>
                  <div style={{ fontSize: 8, color: T.am, textTransform: "uppercase", fontWeight: 700, marginBottom: 3 }}>Grants this document unlocks:</div>
                  {du.grants.map(g => (
                    <div key={g.id} onClick={() => onNav("pipe")} style={{ display: "flex", justifyContent: "space-between", padding: "3px 5px", borderRadius: 2, cursor: "pointer", marginBottom: 1 }} onMouseEnter={e => e.currentTarget.style.background = T.cd} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <div><span style={{ fontSize: 9, fontWeight: 700, color: T.tx }}>{g.name}</span> <Fb v={g.fit} /></div>
                      <span style={{ fontSize: 9, fontWeight: 700, color: T.gn, fontFamily: "var(--m)" }}>{g.amount}</span>
                    </div>
                  ))}
                  {du.doc.st !== "ready" && <Btn small primary onClick={() => onNav("docbuild")}>Build this document →</Btn>}
                </div>
              )}
            </div>
          ))}
        </Cd>
        <Cd sx={{ marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: T.pu, marginBottom: 8, fontFamily: "var(--d)" }}>🎯 Portfolio Scenarios</div>
          <div style={{ display: "flex", gap: 3, marginBottom: 8 }}>
            {intel.scenarios.map((s, i) => (<button key={i} onClick={() => setSc(i)} style={{ padding: "4px 9px", borderRadius: 4, fontSize: 10, fontWeight: 700, cursor: "pointer", border: sc === i ? `1px solid ${T.pu}` : `1px solid ${T.bd}`, background: sc === i ? T.pu + "16" : "transparent", color: sc === i ? T.pu : T.mu }}>{s.name}</button>))}
          </div>
          {intel.scenarios[sc] && (() => { const s = intel.scenarios[sc]; return (<div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 8 }}>
              <div style={{ textAlign: "center", padding: 8, background: T.bg, borderRadius: 4 }}><div style={{ fontSize: 18, fontWeight: 900, color: T.gn, fontFamily: "var(--d)" }}>${s.total.toLocaleString()}</div><div style={{ fontSize: 7, color: T.mu }}>POTENTIAL</div></div>
              <div style={{ textAlign: "center", padding: 8, background: T.bg, borderRadius: 4 }}><div style={{ fontSize: 18, fontWeight: 900, color: T.cy, fontFamily: "var(--d)" }}>{s.coverage}%</div><div style={{ fontSize: 7, color: T.mu }}>COVERAGE</div></div>
              <div style={{ textAlign: "center", padding: 8, background: T.bg, borderRadius: 4 }}><div style={{ fontSize: 18, fontWeight: 900, color: T.yl, fontFamily: "var(--d)" }}>{s.effort}</div><div style={{ fontSize: 7, color: T.mu }}>OPEN TASKS</div></div>
            </div>
            {s.grants.map(g => (
              <div key={g.id}>
                <div onClick={() => setExpG(expG === g.id ? null : g.id)} style={{ display: "flex", justifyContent: "space-between", padding: "4px 7px", background: expG === g.id ? T.cd : T.pn, borderRadius: 3, marginBottom: 2, borderLeft: `3px solid ${CAT[g.category].c}`, cursor: "pointer", transition: "background .12s" }}>
                  <div><div style={{ fontSize: 10, fontWeight: 700, color: T.tx }}>{g.name}</div><Fb v={g.fit} /></div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: T.gn, fontFamily: "var(--m)" }}>${g.pAmt.toLocaleString()}</div>
                </div>
                {expG === g.id && (
                  <div style={{ marginLeft: 6, padding: "4px 8px", marginBottom: 3, background: T.bg, borderRadius: 3, border: `1px solid ${T.bd}` }}>
                    <div style={{ fontSize: 9, color: T.sb, marginBottom: 3 }}>💡 {g.notes}</div>
                    <div style={{ fontSize: 8, color: T.mu, marginBottom: 2 }}>Requirements: {g.requirements.filter(r => r.s === "d").length}/{g.requirements.length} done</div>
                    {g.url && <a href={g.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 8, color: T.bl }}>🔗 Grant page →</a>}
                    <div style={{ marginTop: 3, display: "flex", gap: 3 }}>
                      <Btn small onClick={() => onNav("pipe")}>Pipeline</Btn>
                      {g.template && <Btn small primary onClick={() => onNav("tpl")}>Template</Btn>}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>); })()}
        </Cd>
        <Cd>
          <div style={{ fontSize: 12, fontWeight: 800, color: T.or, marginBottom: 8, fontFamily: "var(--d)" }}>📊 Readiness — click any to open in pipeline</div>
          {intel.readiness.slice(0, 10).map(g => (<div key={g.id} onClick={() => onNav("pipe")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 5px", borderBottom: `1px solid ${T.bd}`, cursor: "pointer", borderRadius: 2 }} onMouseEnter={e => e.currentTarget.style.background = T.cd} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <span style={{ fontSize: 11, fontWeight: 900, color: g.readiness >= 75 ? T.gn : g.readiness >= 50 ? T.yl : T.mu, fontFamily: "var(--m)", minWidth: 30, textAlign: "right" }}>{g.readiness}%</span>
            <div style={{ width: 40, height: 3, background: T.bd, borderRadius: 2, overflow: "hidden" }}><div style={{ width: `${g.readiness}%`, height: "100%", background: g.readiness >= 75 ? T.gn : T.bl }}></div></div>
            <span style={{ fontSize: 10, color: T.tx, flex: 1 }}>{g.name}</span><Fb v={g.fit} />
            <span style={{ fontSize: 7, color: T.dm }}>→</span>
          </div>))}
        </Cd>
      </Hd>
    </div>
  );
}

// ══════ 3. APP TEMPLATES ══════
function AppTpl({ G }) {
  const [sel, setSel] = useState(null);
  const [edits, setEdits] = useState(() => {
    try { return JSON.parse(localStorage.getItem("glp_v5_tpl_edits") || "{}"); } catch { return {}; }
  });
  const [cp, setCp] = useState(null);
  const copy = (t, k) => { navigator.clipboard.writeText(t).catch(() => {}); setCp(k); setTimeout(() => setCp(null), 2000); };
  const updEdit = (key, val) => { const next = { ...edits, [key]: val }; setEdits(next); try { localStorage.setItem("glp_v5_tpl_edits", JSON.stringify(next)); } catch {} };
  const tpl = sel ? TEMPLATES[sel] : null;

  return (
    <div style={{ animation: "fi .3s ease" }}>
      <Hd i="📋" t="Application Templates" s="Grant-specific drafts with auto-fill">
        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 10, minHeight: 300 }}>
          <div style={{ background: T.pn, borderRadius: 5, border: `1px solid ${T.bd}`, padding: 8, overflowY: "auto" }}>
            {Object.entries(TEMPLATES).map(([k, t]) => { const g = G.find(x => x.id === t.gid); return (
              <div key={k} onClick={() => setSel(k)} style={{ padding: "5px 7px", marginBottom: 2, borderRadius: 4, cursor: "pointer", background: sel === k ? T.am + "14" : T.bg, border: sel === k ? `1px solid ${T.am}30` : `1px solid ${T.bd}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: sel === k ? T.tx : T.mu }}>{t.name}</div>
                {g && <Fb v={g.fit} />}
              </div>
            ); })}
          </div>
          <div style={{ background: T.pn, borderRadius: 5, border: `1px solid ${T.bd}`, padding: 10, overflowY: "auto", maxHeight: 460 }}>
            {!tpl ? <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: T.dm, fontSize: 10 }}>← Select template</div> : (<div>
              <div style={{ fontSize: 13, fontWeight: 800, color: T.tx, fontFamily: "var(--d)", marginBottom: 8 }}>{tpl.name}</div>
              {tpl.sections.map((sec, si) => { const auto = sec.autoFn ? sec.autoFn(P) : (sec.auto || (sec.narr ? (P.narr||{})[sec.narr] : "") || ""); const ek = `${sel}-${si}`; const cur = edits[ek] !== undefined ? edits[ek] : auto; return (
                <div key={si} style={{ marginBottom: 8, padding: "7px 9px", background: T.bg, borderRadius: 4, border: `1px solid ${T.bd}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <div><div style={{ fontSize: 10, fontWeight: 700, color: T.am }}>{si + 1}. {sec.t}</div><div style={{ fontSize: 8, color: T.dm }}>{sec.h}</div></div>
                    <div style={{ display: "flex", gap: 2 }}>{sec.narr && <B c={T.bl}>AUTO</B>}<Btn small primary onClick={() => copy(cur, ek)}>{cp === ek ? "✓" : "📋"}</Btn></div>
                  </div>
                  <textarea value={cur} onChange={e => updEdit(ek, e.target.value)} style={{ width: "100%", minHeight: 50, padding: 5, background: T.cd, border: `1px solid ${T.bd}`, borderRadius: 3, color: T.tx, fontSize: 10, lineHeight: 1.5, fontFamily: "var(--s)", resize: "vertical", outline: "none", boxSizing: "border-box" }} />
                </div>
              ); })}
              <Btn primary onClick={() => { const full = tpl.sections.map((sec, si) => { const ek = `${sel}-${si}`; const t = edits[ek] !== undefined ? edits[ek] : (sec.autoFn ? sec.autoFn(P) : (sec.auto || (sec.narr ? (P.narr||{})[sec.narr] : "") || "")); return `## ${sec.t}\n\n${t}`; }).join("\n\n---\n\n"); copy(full, "full"); }}>{cp === "full" ? "✓ Copied" : "📋 Copy Full Application"}</Btn>
            </div>)}
          </div>
        </div>
      </Hd>
    </div>
  );
}

// ══════ 4. CRM ══════
function CRM({ contacts: C, setC, G }) {
  const [sel, setSel] = useState(null);
  const upd = (id, f, v) => setC(p => p.map(c => c.id === id ? { ...c, [f]: v } : c));
  const add = () => setC(p => [...p, { id: Date.now(), nm: "New Contact", org: "", role: "", email: "", ph: "", gids: [], last: null, next: null, notes: "" }]);
  const c = C.find(x => x.id === sel);

  return (
    <div style={{ animation: "fi .3s ease" }}>
      <Hd i="🤝" t="Relationships" s="Track contacts and follow-ups" r={<Btn primary onClick={add}>+ Contact</Btn>}>
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 10, minHeight: 260 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2, maxHeight: 360, overflowY: "auto" }}>
            {C.map(ct => (<div key={ct.id} onClick={() => setSel(ct.id)} style={{ padding: "5px 7px", borderRadius: 4, cursor: "pointer", background: sel === ct.id ? T.cd : T.pn, border: `1px solid ${sel === ct.id ? T.am + "40" : T.bd}`, borderLeft: `3px solid ${ct.next && new Date(ct.next) <= new Date(Date.now() + 7 * 864e5) ? T.yl : ct.last ? T.gn : T.dm}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.tx }}>{ct.nm}</div>
              <div style={{ fontSize: 8, color: T.mu }}>{ct.org}</div>
            </div>))}
          </div>
          <Cd>
            {!c ? <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 180, color: T.dm, fontSize: 10 }}>← Select contact</div> : (<div>
              <input value={c.nm} onChange={e => upd(c.id, "nm", e.target.value)} style={{ ...inpS, width: "100%", fontSize: 13, fontWeight: 800, marginBottom: 6 }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 6 }}>
                {[["org", "Organization"], ["role", "Role"], ["email", "Email"], ["ph", "Phone"]].map(([f, l]) => (<div key={f}><div style={{ fontSize: 7, color: T.dm, textTransform: "uppercase" }}>{l}</div><input value={c[f]} onChange={e => upd(c.id, f, e.target.value)} style={{ ...inpS, width: "100%" }} /></div>))}
                <div><div style={{ fontSize: 7, color: T.dm, textTransform: "uppercase" }}>Last Contact</div><input type="date" value={c.last || ""} onChange={e => upd(c.id, "last", e.target.value)} style={{ ...inpS, width: "100%" }} /></div>
                <div><div style={{ fontSize: 7, color: T.dm, textTransform: "uppercase" }}>Next Follow-up</div><input type="date" value={c.next || ""} onChange={e => upd(c.id, "next", e.target.value)} style={{ ...inpS, width: "100%" }} /></div>
              </div>
              <textarea value={c.notes} onChange={e => upd(c.id, "notes", e.target.value)} placeholder="Notes..." style={{ ...inpS, width: "100%", minHeight: 36, resize: "vertical", boxSizing: "border-box" }} />
              {G.filter(g => c.gids.includes(g.id)).length > 0 && (<div style={{ marginTop: 6 }}><div style={{ fontSize: 7, color: T.am, textTransform: "uppercase", fontWeight: 700 }}>Linked Grants</div>{G.filter(g => c.gids.includes(g.id)).map(g => (<div key={g.id} style={{ fontSize: 9, color: T.tx, padding: "1px 0" }}><B c={CAT[g.category].c}>{CAT[g.category].i}</B> {g.name}</div>))}</div>)}
            </div>)}
          </Cd>
        </div>
      </Hd>
    </div>
  );
}

// ══════ 5. PIPELINE ══════
function Pipe({ G, sG, onNav, onPrep }) {
  const [exp, sE] = useState(null); const [cf, sCf] = useState("all"); const [se, sSe] = useState("");
  const fl = G.filter(g => cf === "all" || g.category === cf).filter(g => !se || g.name.toLowerCase().includes(se.toLowerCase())).sort((a, b) => b.fit - a.fit);
  const ms = (id, s) => sG(p => p.map(g => {
    if (g.id !== id) return g;
    const updated = { ...g, stage: s };
    // AUTO-COMPLIANCE: When grant moves to Awarded, auto-generate report schedule
    if (s === "awarded" && g.stage !== "awarded" && g.reports.length === 0) {
      const awardDate = new Date();
      updated.reports = [
        { id: Date.now(), title: "Quarterly Progress Report #1", due: new Date(awardDate.getTime() + 90*86400000).toISOString().split("T")[0], status: "pending" },
        { id: Date.now()+1, title: "Quarterly Financial Report #1", due: new Date(awardDate.getTime() + 90*86400000).toISOString().split("T")[0], status: "pending" },
        { id: Date.now()+2, title: "Quarterly Progress Report #2", due: new Date(awardDate.getTime() + 180*86400000).toISOString().split("T")[0], status: "pending" },
        { id: Date.now()+3, title: "Quarterly Financial Report #2", due: new Date(awardDate.getTime() + 180*86400000).toISOString().split("T")[0], status: "pending" },
        { id: Date.now()+4, title: "Annual Performance Report", due: new Date(awardDate.getTime() + 365*86400000).toISOString().split("T")[0], status: "pending" },
        { id: Date.now()+5, title: "Final Closeout Report", due: "", status: "pending" },
        { id: Date.now()+6, title: "Equipment Inventory", due: "", status: "pending" },
      ];
      updated.customNotes = (g.customNotes || "") + `\n[Auto] Moved to Awarded ${awardDate.toLocaleDateString()} — compliance schedule generated`;
    }
    return updated;
  }));
  const tr = (gid, ri) => sG(p => p.map(g => { if (g.id !== gid) return g; const r = [...g.requirements]; r[ri] = { ...r[ri], s: r[ri].s === "d" ? "n" : "d" }; return { ...g, requirements: r }; }));
  const updNote = (id, v) => sG(p => p.map(g => g.id === id ? { ...g, customNotes: v } : g));

  return (
    <div style={{ animation: "fi .3s ease" }}>
      {G.length === 0 ? (
        <EmptyState
          icon="📋"
          title="Your Pipeline is Empty"
          desc="Grants you discover or add manually will appear here. Track progress, manage requirements, and move grants through stages from identification to award."
          actions={[
            { icon: "📡", label: "Discover Grants", primary: true, onClick: () => onNav("discover") },
            { icon: "🏆", label: "Browse Awards", onClick: () => onNav("awards") },
            { icon: "🔍", label: "Research Funders", onClick: () => onNav("funder") },
          ]}
        />
      ) : (
      <>
      <Hd i="🎯" t="Pipeline" s={`${G.length} tracked`}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
          <input placeholder="Search..." value={se} onChange={e => sSe(e.target.value)} style={{ ...inpS, maxWidth: 240 }} />
          <Pl active={cf} onSelect={sCf} items={[{ k: "all", l: "All" }, ...Object.entries(CAT).map(([k, v]) => ({ k, l: `${v.i}${v.l}`, c: v.c }))]} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {fl.map(g => { const cat = CAT[g.category], stg = STG[g.stage], isE = exp === g.id, rd = g.requirements.filter(r => r.s === "d").length, rt = g.requirements.length; const hs = calcHealthScore(g); return (
            <Cd key={g.id} onClick={() => sE(isE ? null : g.id)} hl={isE} bc={isE ? cat.c + "40" : undefined}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 2, marginBottom: 2, flexWrap: "wrap" }}>
                    <B c={cat.c}>{cat.i}{cat.l}</B><B c={stg.c}>{stg.l}</B>
                    {g.fit >= 90 && <B c={T.gn}>★</B>}
                    {rt > 0 && <B c={rd === rt ? T.gn : T.yl}>{rd}/{rt}</B>}
                    {g.template && <B c={T.cy}>TPL</B>}
                    {hs.daysLeft !== null && hs.daysLeft > 0 && <B c={hs.daysLeft <= 7 ? T.rd : hs.daysLeft <= 30 ? T.or : T.mu}>{hs.daysLeft}d</B>}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.tx }}>{g.name}</div>
                  <div style={{ fontSize: 9, color: T.mu }}>{g.source}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: T.gn, fontFamily: "var(--m)" }}>{g.amount}</div>
                  <Fb v={g.fit} />
                  <div style={{ fontSize: 7, fontWeight: 800, color: hs.health >= 60 ? T.gn : hs.health >= 40 ? T.yl : T.mu, marginTop: 2, fontFamily: "var(--m)" }}>⚡{hs.health}</div>
                </div>
              </div>
              {isE && (<div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${T.bd}` }} onClick={e => e.stopPropagation()}>
                <div style={{ fontSize: 10, color: T.sb, lineHeight: 1.4, padding: "5px 7px", background: T.bg, borderRadius: 3, borderLeft: `3px solid ${cat.c}`, marginBottom: 6 }}>💡 {g.notes}</div>
                {rt > 0 && <div style={{ marginBottom: 6 }}>{g.requirements.map((r, ri) => <Ck key={ri} ck={r.s === "d"} oc={() => tr(g.id, ri)} lb={`${r.t === "d" ? "📄" : "⚡"} ${r.n}`} />)}</div>}
                <textarea value={g.customNotes || ""} onChange={e => updNote(g.id, e.target.value)} placeholder="Your notes..." style={{ width: "100%", minHeight: 28, padding: 4, background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 3, color: T.tx, fontSize: 9, fontFamily: "var(--s)", resize: "vertical", outline: "none", boxSizing: "border-box", marginBottom: 4 }} />
                <div style={{ display: "flex", gap: 3, marginBottom: 5, flexWrap: "wrap" }}>
                  {g.url && <a href={g.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 9, color: T.bl, textDecoration: "none", padding: "2px 6px", background: T.bl + "10", borderRadius: 3, border: `1px solid ${T.bl}25` }}>🔗 Grant Page →</a>}
                  {g.template && <Btn small primary onClick={() => onNav("tpl")}>📋 Template</Btn>}
                  <Btn small onClick={() => onNav("docbuild")}>🔨 Docs</Btn>
                  {onPrep && <Btn small primary onClick={() => onPrep(g)}>🤖 Prepare Application</Btn>}
                </div>
                <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>{Object.entries(STG).map(([k, s]) => (<button key={k} onClick={() => ms(g.id, k)} style={{ padding: "1px 4px", fontSize: 7, borderRadius: 2, fontWeight: 700, border: g.stage === k ? `1px solid ${s.c}` : `1px solid ${T.bd}`, background: g.stage === k ? s.c + "20" : "transparent", color: g.stage === k ? s.c : T.dm, cursor: "pointer" }}>{s.l}</button>))}</div>
              </div>)}
            </Cd>
          ); })}
        </div>
      </Hd>
      </>
      )}
    </div>
  );
}

// ══════ 6. TIMELINE ══════
function TL({ G, onNav }) {
  const [sel, setSel] = useState(null);
  const now = new Date();
  const curMonth = now.getMonth(); // 0-indexed
  const curYear = now.getFullYear();
  const mos = Array.from({ length: 11 }, (_, i) => {
    const d = new Date(curYear, curMonth + i, 1);
    return d.toLocaleString("en", { month: "short" });
  });
  const mD = Array.from({ length: 11 }, (_, i) => new Date(curYear, curMonth + i, 1));
  const wD = G.filter(g => g.deadlineDate).map(g => { const d = new Date(g.deadlineDate); return { ...g, dObj: d, mi: mD.findIndex((md, i) => i < mD.length - 1 ? d >= md && d < mD[i + 1] : d >= md) }; }).filter(g => g.mi >= 0);
  const roll = G.filter(g => !g.deadlineDate && !["rejected", "completed"].includes(g.stage));
  const sg = sel ? G.find(g => g.id === sel) : null;
  return (
    <div style={{ animation: "fi .3s ease" }}>
      <Hd i="📅" t="Timeline" s="Click any grant for details">
        <div style={{ overflowX: "auto" }}><div style={{ display: "flex", gap: 4, minWidth: mos.length * 100 }}>
          {mos.map((m, mi) => { const mg = wD.filter(g => g.mi === mi); return (
            <div key={m} style={{ flex: 1, minWidth: 90 }}>
              <div style={{ padding: "3px 5px", background: mi === 0 ? T.am + "16" : T.pn, borderRadius: "3px 3px 0 0", border: `1px solid ${T.bd}`, borderBottom: "none", textAlign: "center", fontSize: 10, fontWeight: 800, color: mi === 0 ? T.am : T.tx }}>{m} 26</div>
              <div style={{ background: T.bg, border: `1px solid ${T.bd}`, borderRadius: "0 0 3px 3px", padding: 3, minHeight: 40 }}>
                {mg.length === 0 && <div style={{ fontSize: 8, color: T.dm, textAlign: "center", padding: 4 }}>—</div>}
                {mg.map(g => (<div key={g.id} onClick={() => setSel(sel === g.id ? null : g.id)} style={{ padding: "3px 5px", background: sel === g.id ? T.cd : T.pn, borderRadius: 2, borderLeft: `2px solid ${CAT[g.category].c}`, marginBottom: 1, cursor: "pointer", transition: "background .12s" }}><div style={{ fontSize: 8, fontWeight: 700, color: T.tx }}>{g.name.substring(0, 18)}</div><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><Fb v={g.fit} /><span style={{ fontSize: 7, color: T.mu }}>{g.deadlineDate}</span></div></div>))}
              </div>
            </div>
          ); })}
        </div></div>

        {/* Detail panel for selected grant */}
        {sg && (<Cd hl bc={CAT[sg.category]?.c + "40"} sx={{ marginTop: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div><div style={{ fontSize: 12, fontWeight: 800, color: T.tx, fontFamily: "var(--d)" }}>{sg.name}</div><div style={{ fontSize: 9, color: T.mu }}>{sg.source} · {sg.amount} · Deadline: {sg.deadlineDate || sg.deadline}</div></div>
            <button onClick={() => setSel(null)} style={{ background: "none", border: "none", color: T.mu, cursor: "pointer", fontSize: 12 }}>✕</button>
          </div>
          <div style={{ fontSize: 9, color: T.sb, lineHeight: 1.4, marginTop: 4, padding: "4px 6px", background: T.bg, borderRadius: 3 }}>💡 {sg.notes}</div>
          <div style={{ display: "flex", gap: 3, marginTop: 6, flexWrap: "wrap" }}>
            {sg.url && <a href={sg.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 9, color: T.bl, textDecoration: "none", padding: "2px 6px", background: T.bl + "10", borderRadius: 3 }}>🔗 Grant Page</a>}
            <Btn small onClick={() => onNav("pipe")}>Open in Pipeline</Btn>
            {sg.template && <Btn small primary onClick={() => onNav("tpl")}>📋 Template</Btn>}
          </div>
        </Cd>)}

        <div style={{ marginTop: 8, fontSize: 10, fontWeight: 700, color: T.am, marginBottom: 3 }}>🔄 Rolling ({roll.length}) — click to view</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 2 }}>
          {roll.sort((a, b) => b.fit - a.fit).map(g => (<div key={g.id} onClick={() => setSel(sel === g.id ? null : g.id)} style={{ padding: "4px 6px", background: sel === g.id ? T.cd : T.pn, borderRadius: 3, borderLeft: `2px solid ${CAT[g.category].c}`, cursor: "pointer", transition: "background .12s" }}><div style={{ fontSize: 9, fontWeight: 700, color: T.tx }}>{g.name}</div><div style={{ display: "flex", justifyContent: "space-between" }}><Fb v={g.fit} />{g.url && <span style={{ fontSize: 7, color: T.bl }}>🔗</span>}</div></div>))}
        </div>
      </Hd>
    </div>
  );
}

// ══════ 7. PERSONAL ══════
function Personal({ onNav }) {
  const [progs, sP] = useState(() => {
    try { return JSON.parse(localStorage.getItem("glp_v5_progs") || "null") || PROGS; } catch { return PROGS; }
  });
  const [exp, setExp] = useState(null);
  const [notes, setNotes] = useState(() => {
    try { return JSON.parse(localStorage.getItem("glp_v5_prog_notes") || "{}"); } catch { return {}; }
  });
  const cyc = id => sP(p => { const next = p.map(x => { if (x.id !== id) return x; const c = ["research", "apply", "verify", "enrolled"]; return { ...x, st: c[(c.indexOf(x.st) + 1) % c.length] }; }); try { localStorage.setItem("glp_v5_progs", JSON.stringify(next)); } catch {} return next; });
  const updNote = (id, v) => { const next = { ...notes, [id]: v }; setNotes(next); try { localStorage.setItem("glp_v5_prog_notes", JSON.stringify(next)); } catch {} };
  const pC = { critical: T.rd, high: T.yl, medium: T.bl }; const sC = { enrolled: T.gn, apply: T.yl, verify: T.bl, research: T.pu };
  const links = { vr: "https://www.dhs.state.il.us/page.aspx?item=29738", wipa: "https://www.ssa.gov/work/WIPA.html", ssi: "https://www.ssa.gov/ssi/", ssdi: "https://www.ssa.gov/disability/", medicaid: "https://www.illinois.gov/services/health-care", snap: "https://www.dhs.state.il.us/page.aspx?item=30357", liheap: "https://dceo.illinois.gov/communityservices/liheap.html", able: "https://www.illinoisable.com", pabss: "https://www.equipforequality.org", lifeline: "https://www.lifelinesupport.org" };
  return (
    <div style={{ animation: "fi .3s ease" }}>
      <Hd i="🛡️" t="Personal Programs" s="Click any program for details and links">
        <SG items={[{ l: "Programs", v: progs.length, c: T.bl }, { l: "Enrolled", v: progs.filter(p => p.st === "enrolled").length, c: T.gn }, { l: "Critical", v: progs.filter(p => p.pr === "critical" && p.st !== "enrolled").length, c: T.rd }]} />
        {progs.map(p => (
          <div key={p.id} style={{ marginBottom: 2 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 6, padding: "5px 7px", background: exp === p.id ? T.cd : T.pn, border: `1px solid ${exp === p.id ? pC[p.pr] + "40" : T.bd}`, borderRadius: 3, borderLeft: `3px solid ${pC[p.pr] || T.mu}`, cursor: "pointer" }} onClick={() => setExp(exp === p.id ? null : p.id)}>
              <button onClick={e => { e.stopPropagation(); cyc(p.id); }} style={{ width: 14, height: 14, borderRadius: 2, border: `2px solid ${sC[p.st]}`, background: p.st === "enrolled" ? T.gn + "25" : "transparent", cursor: "pointer", flexShrink: 0, fontSize: 8, fontWeight: 900, color: T.gn, display: "flex", alignItems: "center", justifyContent: "center" }}>{p.st === "enrolled" ? "✓" : ""}</button>
              <div style={{ flex: 1 }}><span style={{ fontSize: 10, fontWeight: 700, color: T.tx }}>{p.n}</span> <B c={sC[p.st]}>{p.st.toUpperCase()}</B> <B c={pC[p.pr]}>{p.pr}</B><div style={{ fontSize: 8, color: T.am }}>→ {p.act}</div></div>
              <div style={{ fontSize: 9, color: T.gn, fontFamily: "var(--m)", flexShrink: 0 }}>{p.amt}</div>
            </div>
            {exp === p.id && (
              <div style={{ margin: "0 0 2px 20px", padding: "5px 8px", background: T.bg, border: `1px solid ${T.bd}`, borderRadius: "0 0 3px 3px" }}>
                <div style={{ display: "flex", gap: 3, marginBottom: 4, flexWrap: "wrap" }}>
                  {links[p.id] && <a href={links[p.id]} target="_blank" rel="noopener noreferrer" style={{ fontSize: 8, color: T.bl, textDecoration: "none", padding: "2px 5px", background: T.bl + "10", borderRadius: 3 }}>🔗 Official Page →</a>}
                  <Btn small onClick={() => onNav("actions")}>Action Plan</Btn>
                  {["vr"].includes(p.id) && <Btn small primary onClick={() => onNav("pipe")}>Linked Grant</Btn>}
                </div>
                <textarea value={notes[p.id] || ""} onChange={e => updNote(p.id, e.target.value)} placeholder="Your notes on this program..." style={{ width: "100%", minHeight: 28, padding: 4, background: T.cd, border: `1px solid ${T.bd}`, borderRadius: 3, color: T.tx, fontSize: 9, fontFamily: "var(--s)", resize: "vertical", outline: "none", boxSizing: "border-box" }} />
              </div>
            )}
          </div>
        ))}
      </Hd>
    </div>
  );
}

// ══════ 8. ACTIONS ══════
function Actions({ onNav }) {
  const [done, sD] = useState(() => {
    try { return JSON.parse(localStorage.getItem("glp_v5_actions_done") || "{}"); } catch { return {}; }
  });
  const [notes, setN] = useState(() => {
    try { return JSON.parse(localStorage.getItem("glp_v5_actions_notes") || "{}"); } catch { return {}; }
  });
  const togDone = (id) => { const next = { ...done, [id]: !done[id] }; sD(next); try { localStorage.setItem("glp_v5_actions_done", JSON.stringify(next)); } catch {} };
  const updActNote = (id, v) => { const next = { ...notes, [id]: v }; setN(next); try { localStorage.setItem("glp_v5_actions_notes", JSON.stringify(next)); } catch {} };
  const ph = [
    { t: "PHASE 1 — This Week", c: T.rd, i: [["sbdc", "Contact IL SBDC", "https://dceo.illinois.gov/smallbizassistance/sbdc.html"], ["drs", "Call DRS for VR", "https://www.dhs.state.il.us/page.aspx?item=29738"], ["omee", "Email OMEE (CEO.OMEE@illinois.gov)", null], ["wipa", "Find WIPA counselor", "https://www.ssa.gov/work/WIPA.html"]] },
    { t: "PHASE 2 — Weeks 2-3", c: T.yl, i: [["liheap", "Apply LIHEAP", "https://dceo.illinois.gov/communityservices/liheap.html"], ["snap", "Verify SNAP enrollment", "https://www.dhs.state.il.us/page.aspx?item=30357"], ["able", "Open IL ABLE account", "https://www.illinoisable.com"], ["lifeline", "Enroll Lifeline discount", "https://www.lifelinesupport.org"]] },
    { t: "PHASE 3 — Month 1", c: T.bl, i: [["reg", "Register on Grants.gov", "https://www.grants.gov"], ["sba", "Begin SBA 8(a) app", "https://www.sba.gov/8a"], ["docs", "Complete core documents", null]] },
    { t: "PHASE 4 — Months 2-3", c: T.pu, i: [["usda", "Apply USDA RBDG", "https://www.rd.usda.gov/programs-services/business-programs/rural-business-development-grants"], ["sbir", "Prepare SBIR pitch", "https://seedfund.nsf.gov/"], ["dceo", "Apply DCEO Capital", "https://dceo.illinois.gov"]] },
  ];
  const doneCount = Object.values(done).filter(Boolean).length;
  const totalCount = ph.reduce((a, p) => a + p.i.length, 0);
  return (
    <div style={{ animation: "fi .3s ease" }}>
      <Hd i="⚡" t="Action Plan" s={`${doneCount}/${totalCount} completed`}>
        <SG items={[{ l: "Done", v: doneCount, c: T.gn }, { l: "Remaining", v: totalCount - doneCount, c: T.yl }, { l: "Phases", v: ph.length, c: T.bl }]} />
        {ph.map(p => (<div key={p.t} style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: p.c, fontFamily: "var(--d)", marginBottom: 3 }}>{p.t}</div>
          {p.i.map(([id, t, url]) => (<div key={id}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 6px", background: done[id] ? T.gn + "08" : T.pn, border: `1px solid ${done[id] ? T.gn + "25" : T.bd}`, borderRadius: 3, borderLeft: `3px solid ${done[id] ? T.gn : p.c}`, marginBottom: 1 }}>
              <button onClick={() => togDone(id)} style={{ width: 14, height: 14, borderRadius: 2, border: `2px solid ${done[id] ? T.gn : T.dm}`, background: done[id] ? T.gn + "25" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{done[id] && <span style={{ color: T.gn, fontSize: 8, fontWeight: 900 }}>✓</span>}</button>
              <div style={{ flex: 1, fontSize: 10, fontWeight: 600, color: done[id] ? T.mu : T.tx, textDecoration: done[id] ? "line-through" : "none" }}>{t}</div>
              <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                {url && <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 8, color: T.bl, textDecoration: "none" }}>🔗</a>}
                {id === "docs" && <Btn small onClick={() => onNav("docbuild")}>Build</Btn>}
              </div>
            </div>
            {done[id] && <div style={{ marginLeft: 20, marginBottom: 2 }}>
              <input value={notes[id] || ""} onChange={e => updActNote(id, e.target.value)} placeholder="Note (date completed, result...)" style={{ ...inpS, width: "100%", fontSize: 8 }} />
            </div>}
          </div>))}
        </div>))}
      </Hd>
    </div>
  );
}

// ══════ 9. RESOURCES ══════
function Res() {
  const [filter, setFilter] = useState("all");
  const gs = [
    { l: "🏛️ Federal", k: "federal", lk: [["Grants.gov", "https://www.grants.gov", "Federal grant search engine"], ["SBIR.gov", "https://www.sbir.gov", "Small business innovation research"], ["SAM.gov", "https://sam.gov", "System for Award Management"], ["Grants.gov Search", "https://www.grants.gov/search-grants.html", "Advanced search"], ["USASpending", "https://www.usaspending.gov", "Track federal spending"]] },
    { l: "🌽 Illinois", k: "illinois", lk: [["IL DCEO", "https://dceo.illinois.gov", "Commerce & Economic Opportunity"], ["IL SBDC", "https://dceo.illinois.gov/smallbizassistance/sbdc.html", "Free business consulting"], ["IL ABLE", "https://www.illinoisable.com", "Tax-advantaged savings"], ["IL SOS Business", "https://www.ilsos.gov/departments/business_services/", "LLC/Corp registration"], ["IL DHS", "https://www.dhs.state.il.us", "Disability services"]] },
    { l: "♿ Disability", k: "disability", lk: [["IL DRS/VR", "https://www.dhs.state.il.us/page.aspx?item=29738", "Vocational rehabilitation"], ["SSA Work", "https://www.ssa.gov/work/", "Work incentives"], ["WIPA Finder", "https://www.ssa.gov/work/WIPA.html", "Benefits counseling"], ["Equip for Equality", "https://www.equipforequality.org", "Disability legal aid"], ["JAN", "https://askjan.org", "Job accommodation network"]] },
    { l: "🔍 Discovery", k: "discovery", lk: [["GrantWatch", "https://www.grantwatch.com", "Grant alerts"], ["A4CB", "https://a4cb.org/services/grants/", "Association for Corporate Benefit"], ["SBA", "https://www.sba.gov", "Small Business Administration"], ["Foundation Directory", "https://fconline.foundationcenter.org", "Private foundations"], ["Instrumentl", "https://www.instrumentl.com", "Grant search platform"]] },
  ];
  const filtered = filter === "all" ? gs : gs.filter(g => g.k === filter);
  return (
    <div style={{ animation: "fi .3s ease" }}>
      <Hd i="🔗" t="Resources" s={`${gs.reduce((a, g) => a + g.lk.length, 0)} links across ${gs.length} categories`}>
        <Pl active={filter} onSelect={setFilter} items={[{ k: "all", l: "All" }, ...gs.map(g => ({ k: g.k, l: g.l }))]} />
        <div style={{ marginTop: 6 }}>
        {filtered.map(g => (<div key={g.l} style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.am, marginBottom: 3 }}>{g.l}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 3 }}>
            {g.lk.map(([n, u, desc]) => (<a key={n} href={u} target="_blank" rel="noopener noreferrer" style={{ padding: "6px 8px", background: T.pn, border: `1px solid ${T.bd}`, borderRadius: 4, textDecoration: "none", transition: "border-color .12s" }} onMouseEnter={e => e.currentTarget.style.borderColor = T.am + "40"} onMouseLeave={e => e.currentTarget.style.borderColor = T.bd}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.tx, marginBottom: 1 }}>{n} <span style={{ color: T.bl, fontSize: 8 }}>↗</span></div>
              {desc && <div style={{ fontSize: 7, color: T.mu, lineHeight: 1.3 }}>{desc}</div>}
              <div style={{ fontSize: 7, color: T.dm, marginTop: 1 }}>{u.replace(/https?:\/\/(www\.)?/, "").split("/")[0]}</div>
            </a>))}
          </div>
        </div>))}
        </div>
      </Hd>
    </div>
  );
}

// ══════ 10. MATCHER — Dynamic profile-based scoring ══════
// Score weights are generated from the user's profile tags + sectors
// scoreText reads from this; App component updates it via useEffect
let ACTIVE_SCORE_WEIGHTS = generateScoreWeights(DEFAULT_PROFILE.tags || [], DEFAULT_PROFILE.sectors || []);

function scoreText(text) {
  const t = text.toLowerCase();
  let score = 20;
  const matches = [], gaps = [], details = [];
  ACTIVE_SCORE_WEIGHTS.forEach(sw => {
    const found = sw.kw.filter(k => t.includes(k));
    if (found.length > 0) {
      const boost = Math.min(sw.w * (1 + found.length * 0.2), sw.w * 1.8);
      score += boost;
      const entry = { cat: sw.cat, kw: found, boost: Math.round(boost) };
      if (sw.type === "match") matches.push(entry); else gaps.push(entry);
      details.push(entry);
    }
  });
  const wordCount = t.split(/\s+/).length;
  const kwDensity = matches.reduce((a, m) => a + m.kw.length, 0) / Math.max(1, wordCount / 100);
  if (kwDensity > 2) score += 5;
  score = Math.max(5, Math.min(98, Math.round(score)));
  return { score, matches, gaps, details, rec: score >= 80 ? "EXCELLENT" : score >= 65 ? "STRONG" : score >= 50 ? "MODERATE" : score >= 35 ? "POSSIBLE" : "LOW" };
}

function Match({ onNav }) {
  const [inp, sI] = useState(""); const [res, sR] = useState(null);
  const ai = useAI();
  return (
    <div style={{ animation: "fi .3s ease" }}>
      <Hd i="🔍" t="Matcher" s="Paste any grant description for real fit analysis — keyword scoring + AI deep analysis">
        <Cd>
          <div style={{ fontSize: 9, color: T.mu, marginBottom: 4 }}>Your profile tags used for scoring:</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 2, marginBottom: 6 }}>{(P.tags||[]).map(t => (<span key={t} style={{ padding: "1px 4px", background: T.am + "12", border: `1px solid ${T.am}25`, borderRadius: 2, fontSize: 7, color: T.am }}>{t}</span>))}</div>
          <textarea value={inp} onChange={e => sI(e.target.value)} placeholder="Paste full grant description, eligibility criteria, or opportunity text..." rows={5} style={{ width: "100%", padding: 6, background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 3, color: T.tx, fontSize: 10, fontFamily: "var(--s)", resize: "vertical", outline: "none", boxSizing: "border-box" }} />
          <div style={{ marginTop: 4, display: "flex", gap: 4, flexWrap: "wrap" }}>
            <Btn primary onClick={() => { if (inp.trim()) sR(scoreText(inp)); }}>⚡ Quick Score</Btn>
            <Btn onClick={() => {
              if (!inp.trim()) return;
              ai.run(
                `You are a grant fit analyst. Analyze how well this grant opportunity fits the applicant's profile. Be specific and actionable.

${buildPortfolioContext(P, [], [])}

Provide your analysis in this format:
🎯 FIT SCORE: [0-100]%
📊 OVERALL: [1 sentence assessment]

✅ STRENGTHS (why this is a good fit):
• [specific strength 1]
• [specific strength 2]
• [etc]

⚠️ GAPS (potential issues):
• [specific gap 1]
• [specific gap 2]

🔧 RECOMMENDATIONS:
• [how to improve fit or what to prepare]
• [specific actions]

📝 APPLICATION STRATEGY:
[2-3 sentences on how to approach this application]`,
                `Analyze this grant opportunity for fit:\n\n${inp.substring(0, 4000)}`
              );
            }}>🧠 AI Deep Analysis</Btn>
            {res && <Btn onClick={() => { sI(""); sR(null); ai.setResult(null); }}>Clear</Btn>}
          </div>
          
          {/* Keyword score results */}
          {res && (<div style={{ marginTop: 8, padding: 8, background: T.bg, borderRadius: 5, border: `1px solid ${T.bd}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: res.score >= 65 ? T.gn : res.score >= 45 ? T.yl : T.rd, fontFamily: "var(--d)" }}>{res.score}%</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: res.score >= 65 ? T.gn : res.score >= 45 ? T.yl : T.rd }}>{res.rec} FIT</div>
                <div style={{ fontSize: 8, color: T.mu }}>{res.matches.length} positive signals, {res.gaps.length} concerns</div>
              </div>
            </div>
            {res.matches.length > 0 && <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 8, color: T.gn, textTransform: "uppercase", fontWeight: 700, marginBottom: 2 }}>Positive Signals</div>
              {res.matches.map((m, i) => (<div key={i} style={{ fontSize: 9, color: T.tx, padding: "2px 0", display: "flex", justifyContent: "space-between" }}><span>✓ {m.cat}</span><span style={{ color: T.gn, fontFamily: "var(--m)", fontSize: 8 }}>+{m.boost} ({m.kw.join(", ")})</span></div>))}
            </div>}
            {res.gaps.length > 0 && <div>
              <div style={{ fontSize: 8, color: T.rd, textTransform: "uppercase", fontWeight: 700, marginBottom: 2 }}>Concerns</div>
              {res.gaps.map((g, i) => (<div key={i} style={{ fontSize: 9, color: T.tx, padding: "2px 0", display: "flex", justifyContent: "space-between" }}><span>⚠ {g.cat}</span><span style={{ color: T.rd, fontFamily: "var(--m)", fontSize: 8 }}>{g.boost} ({g.kw.join(", ")})</span></div>))}
            </div>}
          </div>)}

          {/* AI Deep Analysis results */}
          {ai.loading && (
            <div style={{ marginTop: 10, padding: 16, textAlign: "center", background: `${T.pu}06`, borderRadius: 8, border: `1px solid ${T.pu}15` }}>
              <div style={{ fontSize: 20, animation: "pulse 1.5s infinite" }}>🧠</div>
              <div style={{ fontSize: 11, color: T.pu, marginTop: 6 }}>Claude is analyzing fit...</div>
            </div>
          )}
          {ai.error && <div style={{ marginTop: 8, padding: "8px 12px", background: T.rd + "12", borderRadius: 8, fontSize: 11, color: T.rd }}>⚠️ {ai.error}</div>}
          {ai.result && typeof ai.result === "string" && (
            <Cd hero sx={{ marginTop: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.pu, marginBottom: 8, fontFamily: "var(--d)", display: "flex", alignItems: "center", gap: 6 }}>
                <span>🧠</span> AI Deep Analysis
              </div>
              <div style={{ fontSize: 11, color: T.sb, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{ai.result}</div>
            </Cd>
          )}
        </Cd>
      </Hd>
    </div>
  );
}

// ══════ 11. DOCUMENT BUILDER ══════
function DocBuilder({ docs, setDocs, grants }) {
  const [sel, setSel] = useState(null);
  const [wiz, setWiz] = useState(() => {
    try { return JSON.parse(localStorage.getItem("glp_v5_docwiz") || "{}"); } catch { return {}; }
  });
  const updWiz = (key, val) => { const next = { ...wiz, [key]: val }; setWiz(next); try { localStorage.setItem("glp_v5_docwiz", JSON.stringify(next)); } catch {} };

  const builders = [
    { did: 14, nm: "Business Plan (AEGIS)", icon: "📊", steps: [
      { t: "Executive Summary", q: "One paragraph describing AEGIS and its market opportunity", def: "AEGIS is an autonomous business framework that enables small businesses to operate with enterprise-level capability through AI agent coordination. The platform addresses a $50B+ market of small businesses needing automation but lacking resources for enterprise software." },
      { t: "Problem Statement", q: "What problem does AEGIS solve?", def: "Small businesses cannot afford enterprise automation. Manual operations limit growth. Existing tools automate individual tasks but not complete business workflows." },
      { t: "Solution", q: "How does AEGIS solve it?", def: P.narr.tech },
      { t: "Market Analysis", q: "Target market and size", def: "Target: US small businesses (<50 employees) seeking automation. TAM: 32.5M small businesses. SAM: 3.2M tech-forward small businesses. SOM: 50,000 early adopters in Year 1-3." },
      { t: "Revenue Model", q: "How will AEGIS generate revenue?", def: "Tiered SaaS subscriptions ($49-499/mo), transaction fees on agent operations (2-5%), premium API access, and enterprise customization services." },
      { t: "Team", q: "Founder and team capabilities", def: P.narr.founder_tech },
      { t: "Financial Projections", q: "Revenue & expense projections", def: "Year 1: $50K revenue, $30K expenses (bootstrapped)\nYear 2: $250K revenue, $120K expenses\nYear 3: $1M revenue, $400K expenses\nBreak-even: Month 8 of Year 1 at 100 subscribers" },
      { t: "Funding Request", q: "What funding is needed and for what", def: P.narr.financial },
    ]},
    { did: 17, nm: "12-Month Budget", icon: "💰", steps: [
      { t: "Revenue Sources", q: "Expected income streams", def: "SSI Disability: $943/mo = $11,316/yr\nPlatform Revenue (projected): $500/mo avg = $6,000/yr\nGrant Funding (target): $15,000-50,000\nTotal Projected: $32,316-$67,316" },
      { t: "Fixed Monthly Costs", q: "Recurring expenses", def: `Hosting & Infrastructure: $${P.expenses.hosting}/mo = $${P.expenses.hosting * 12}/yr\nDomains & Services: $${P.expenses.domains}/mo = $${P.expenses.domains * 12}/yr\nSoftware Subscriptions: $${P.expenses.subs}/mo = $${P.expenses.subs * 12}/yr\nInternet: $60/mo = $720/yr\nTotal Fixed: $${(P.expenses.hosting + P.expenses.domains + P.expenses.subs + 60) * 12}/yr` },
      { t: "One-Time Costs", q: "Setup and equipment costs", def: "Business Formation (LLC): $500\nEIN Registration: $0\nEquipment Upgrade: $2,000\nProfessional Services: $1,500\nMarketing Launch: $1,000\nTotal One-Time: $5,000" },
      { t: "Month-by-Month Projection", q: "Monthly P&L", def: "Month 1-3: -$470/mo (expenses only, pre-revenue)\nMonth 4-6: -$270/mo (early platform revenue $200/mo)\nMonth 7-9: $0/mo (break-even at $470/mo revenue)\nMonth 10-12: +$530/mo ($1,000/mo revenue)\nAnnual Net: +$720 (excluding grant funding)" },
    ]},
    { did: 13, nm: "Personal Financial Statement", icon: "📋", steps: [
      { t: "Assets", q: "List all assets and values", def: "Cash/Checking: ~$200\nSavings: ~$100\nPersonal Property: ~$2,000\nComputer Equipment: ~$800\nVehicle: $0\nTotal Assets: ~$3,100" },
      { t: "Monthly Income", q: "All income sources", def: `SSI Disability Benefits: $${P.income.disability}/mo\nOther Income: $0\nTotal Monthly: $${P.income.disability}\nTotal Annual: $${P.income.disability * 12}` },
      { t: "Monthly Expenses", q: "All regular expenses", def: `Housing: $0 (owned property)\nUtilities: $150\nFood: $200\nTransportation: $50\nBusiness Hosting: $${P.expenses.hosting}\nBusiness Services: $${P.expenses.domains + P.expenses.subs}\nMedical: $0 (Medicaid)\nTotal: ~$${150 + 200 + 50 + P.expenses.hosting + P.expenses.domains + P.expenses.subs}` },
      { t: "Liabilities", q: "Any debts or obligations", def: "Student Loans: $0\nCredit Cards: $0\nMortgage: $0\nOther: $0\nTotal Liabilities: $0" },
      { t: "Net Worth", q: "Assets minus liabilities", def: "Total Assets: ~$3,100\nTotal Liabilities: $0\nNet Worth: ~$3,100\n\nNote: Below SBA 8(a) threshold of $850,000. Qualifies as economically disadvantaged." },
    ]},
  ];

  const active = builders.find(b => b.did === sel);
  const docObj = active ? docs.find(d => d.id === active.did) : null;

  const exportDoc = () => {
    if (!active) return;
    const text = active.steps.map((s, i) => {
      const key = `${active.did}-${i}`;
      return `## ${s.t}\n\n${wiz[key] !== undefined ? wiz[key] : s.def}`;
    }).join("\n\n---\n\n");
    navigator.clipboard.writeText(text).catch(() => {});
    if (docObj && docObj.st !== "ready") {
      setDocs(p => p.map(d => d.id === active.did ? { ...d, st: "draft", v: d.v + 1 } : d));
    }
  };

  return (
    <div style={{ animation: "fi .3s ease" }}>
      <Hd i="🔨" t="Document Builder" s="Guided wizards for critical documents">
        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 10, minHeight: 320 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {builders.map(b => {
              const d = docs.find(x => x.id === b.did);
              const stC = { ready: T.gn, draft: T.yl, needed: T.rd };
              return (
                <div key={b.did} onClick={() => setSel(b.did)} style={{
                  padding: "8px 10px", borderRadius: 5, cursor: "pointer",
                  background: sel === b.did ? T.am + "14" : T.pn,
                  border: sel === b.did ? `1px solid ${T.am}30` : `1px solid ${T.bd}`,
                }}>
                  <div style={{ fontSize: 12, marginBottom: 2 }}>{b.icon}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: sel === b.did ? T.tx : T.mu }}>{b.nm}</div>
                  {d && <B c={stC[d.st] || T.mu}>{d.st.toUpperCase()}</B>}
                </div>
              );
            })}
            <Cd sx={{ marginTop: 6 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: T.cy, marginBottom: 3 }}>How it works</div>
              <div style={{ fontSize: 8, color: T.mu, lineHeight: 1.5 }}>
                Each wizard walks through the sections needed for the document. Pre-filled with your profile data. Edit to customize, then export. Document status auto-updates to "draft" when exported.
              </div>
            </Cd>
          </div>
          <div style={{ background: T.pn, borderRadius: 5, border: `1px solid ${T.bd}`, padding: 10, overflowY: "auto", maxHeight: 500 }}>
            {!active ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: T.dm, fontSize: 10 }}>← Select a document to build</div>
            ) : (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: T.tx, fontFamily: "var(--d)" }}>{active.icon} {active.nm}</div>
                  <Btn primary onClick={exportDoc}>📋 Export & Copy</Btn>
                </div>
                {active.steps.map((step, si) => {
                  const key = `${active.did}-${si}`;
                  const val = wiz[key] !== undefined ? wiz[key] : step.def;
                  return (
                    <div key={si} style={{ marginBottom: 8, padding: "8px 10px", background: T.bg, borderRadius: 5, border: `1px solid ${T.bd}` }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.am, marginBottom: 2 }}>{si + 1}. {step.t}</div>
                      <div style={{ fontSize: 8, color: T.dm, marginBottom: 4 }}>{step.q}</div>
                      <textarea
                        value={val}
                        onChange={e => updWiz(key, e.target.value)}
                        style={{ width: "100%", minHeight: 60, padding: 6, background: T.cd, border: `1px solid ${T.bd}`, borderRadius: 3, color: T.tx, fontSize: 10, lineHeight: 1.5, fontFamily: "var(--s)", resize: "vertical", outline: "none", boxSizing: "border-box" }}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Hd>
    </div>
  );
}

// ══════ 12. DISCOVERY — REAL Grants.gov API v2 + USAspending + SBIR ══════

// ── API ENDPOINTS ──
const GRANTS_API = "https://api.grants.gov/v1/api/search2"; // NEW official REST API (no auth)
const GRANTS_DETAIL_API = "https://api.grants.gov/v1/api/fetchOpportunity";
const USASPEND_AWARD_API = "https://api.usaspending.gov/api/v2/search/spending_by_award/";
const USASPEND_AGENCY_API = "https://api.usaspending.gov/api/v2/search/spending_by_category/awarding_agency/";
const SBIR_AWARD_API = "https://api.www.sbir.gov/public/api/awards";

// ── GRANTS.GOV search2 wrapper ──
async function searchGrantsGov(keyword, status = "posted", rows = 25, opts = {}) {
  const body = { keyword, oppStatuses: status, rows };
  if (opts.agencies) body.agencies = opts.agencies;
  if (opts.fundingCategories) body.fundingCategories = opts.fundingCategories;
  if (opts.eligibilities) body.eligibilities = opts.eligibilities;
  if (opts.fundingInstruments) body.fundingInstruments = opts.fundingInstruments;
  if (opts.startRecordNum) body.startRecordNum = opts.startRecordNum;
  
  const resp = await fetch(GRANTS_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`Grants.gov API error: ${resp.status}`);
  const data = await resp.json();
  if (data.errorcode !== 0) throw new Error(data.msg || "API error");
  return {
    hits: data.data?.oppHits || [],
    totalCount: data.data?.hitCount || 0,
    statusCounts: data.data?.oppStatusOptions || [],
  };
}

// ── USAspending award search ──
async function searchUSAspendingAwards(keywords, state = "IL", limit = 10) {
  const resp = await fetch(USASPEND_AWARD_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filters: {
        keywords,
        award_type_codes: ["02", "03", "04", "05"], // Grants only
        time_period: [{ start_date: "2023-01-01", end_date: new Date().toISOString().split("T")[0] }],
        recipient_locations: state ? [{ country: "USA", state }] : undefined,
      },
      fields: ["Award ID", "Recipient Name", "Award Amount", "Awarding Agency", "Start Date", "Description"],
      limit,
      page: 1,
      sort: "Award Amount",
      order: "desc",
      subawards: false,
    }),
  });
  if (!resp.ok) throw new Error(`USAspending error: ${resp.status}`);
  const data = await resp.json();
  return (data.results || []).map(r => ({
    id: r["Award ID"],
    recipient: r["Recipient Name"],
    amount: r["Award Amount"],
    agency: r["Awarding Agency"],
    startDate: r["Start Date"],
    description: (r["Description"] || "").substring(0, 300),
    source: "USAspending",
  }));
}

// ── SBIR competitive intelligence ──
async function searchSBIRAwards(keyword, state, rows = 10) {
  let url = `${SBIR_AWARD_API}?keyword=${encodeURIComponent(keyword)}&rows=${rows}`;
  if (state) url += `&state=${encodeURIComponent(state)}`;
  const resp = await fetch(url);
  if (!resp.ok) return []; // SBIR may block some IPs
  const data = await resp.json();
  return (Array.isArray(data) ? data : []).map(a => ({
    firm: a.firm, title: a.award_title, agency: a.agency, phase: a.phase,
    amount: a.award_amount, year: a.award_year, city: a.city, state: a.state,
    abstract: (a.abstract || "").substring(0, 200), keywords: a.research_area_keywords,
    source: "SBIR.gov",
  }));
}

// ── FEDERAL REGISTER API — Early Warning for NOFOs (no auth) ──
const FED_REG_API = "https://www.federalregister.gov/api/v1/documents.json";
async function searchFederalRegister(term, opts = {}) {
  const params = new URLSearchParams();
  params.append("conditions[term]", term);
  params.append("conditions[type][]", "NOTICE");
  params.append("per_page", String(opts.perPage || 10));
  params.append("order", "newest");
  for (const f of ["title","publication_date","agencies","html_url","abstract","document_number","type"]) {
    params.append("fields[]", f);
  }
  if (opts.agency) params.append("conditions[agencies][]", opts.agency);
  if (opts.afterDate) params.append("conditions[publication_date][gte]", opts.afterDate);
  const resp = await fetch(`${FED_REG_API}?${params}`);
  if (!resp.ok) throw new Error(`Federal Register error: ${resp.status}`);
  const data = await resp.json();
  return {
    count: data.count || 0,
    results: (data.results || []).map(d => ({
      title: d.title, date: d.publication_date, url: d.html_url,
      abstract: d.abstract || "", docNumber: d.document_number,
      agencies: (d.agencies || []).map(a => a.name).join(", "),
      source: "Federal Register",
    })),
  };
}

// ── CENSUS ACS API — Community demographics for narratives (no auth for basic) ──
const CENSUS_ACS_API = "https://api.census.gov/data/2022/acs/acs5/profile";
// Key ACS variables for grant narratives
const ACS_VARS = {
  NAME: "name", DP03_0062E: "medianIncome", DP03_0119PE: "povertyPct",
  DP02_0072PE: "disabilityPct", DP02_0067PE: "bachelorsPct",
  DP02_0152PE: "broadbandPct", DP03_0009PE: "unemploymentPct",
  DP05_0001E: "totalPop", DP02_0059PE: "hsGradPct",
  DP03_0063E: "meanIncome", DP05_0071PE: "hispanicPct",
  DP05_0065PE: "whitePct", DP05_0066PE: "blackPct",
  DP04_0089E: "medianHomeValue", DP03_0004PE: "laborForcePct",
};
async function fetchCensusACS(stateFips, countyFips) {
  const vars = Object.keys(ACS_VARS).join(",");
  const censusKey = getCensusKey();
  let url = `${CENSUS_ACS_API}?get=${vars}&for=county:${countyFips}&in=state:${stateFips}`;
  if (censusKey) url += `&key=${censusKey}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Census API error: ${resp.status}`);
  const data = await resp.json();
  if (!data || data.length < 2) throw new Error("No Census data found");
  const headers = data[0];
  const values = data[1];
  const result = {};
  headers.forEach((h, i) => {
    const key = ACS_VARS[h] || h;
    const val = values[i];
    result[key] = isNaN(val) ? val : parseFloat(val);
  });
  return result;
}

// ── PROPUBLICA NONPROFIT EXPLORER — Org research (no auth) ──
const PROPUB_API = "https://projects.propublica.org/nonprofits/api/v2";
async function searchNonprofits(query, state) {
  let url = `${PROPUB_API}/search.json?q=${encodeURIComponent(query)}`;
  if (state) url += `&state%5Bid%5D=${state}`;
  const resp = await fetch(url);
  if (!resp.ok) return [];
  const data = await resp.json();
  return (data.organizations || []).map(o => ({
    ein: o.strein, name: o.name, city: o.city, state: o.state,
    ntee: o.ntee_code, score: o.score, source: "ProPublica",
  }));
}

async function getNonprofitDetails(ein) {
  const resp = await fetch(`${PROPUB_API}/organizations/${ein}.json`);
  if (!resp.ok) return null;
  const data = await resp.json();
  const org = data.organization || {};
  const filings = data.filings_with_data || [];
  return {
    name: org.name, ein: org.strein, city: org.city, state: org.state,
    ntee: org.ntee_code, subsection: org.subseccd,
    revenue: org.revenue_amount, assets: org.asset_amount,
    filings: filings.slice(0, 5).map(f => ({
      year: f.tax_prd_yr, revenue: f.totrevenue, expenses: f.totfuncexpns,
      assets: f.totassetsend, pdfUrl: f.pdf_url,
    })),
    source: "ProPublica",
  };
}

// ── FIPS CODE LOOKUP — extends existing STATE_FIPS to also work with abbreviations ──
const STATE_ABBR_FIPS = {AL:"01",AK:"02",AZ:"04",AR:"05",CA:"06",CO:"08",CT:"09",DE:"10",FL:"12",GA:"13",HI:"15",ID:"16",IL:"17",IN:"18",IA:"19",KS:"20",KY:"21",LA:"22",ME:"23",MD:"24",MA:"25",MI:"26",MN:"27",MS:"28",MO:"29",MT:"30",NE:"31",NV:"32",NH:"33",NJ:"34",NM:"35",NY:"36",NC:"37",ND:"38",OH:"39",OK:"40",OR:"41",PA:"42",RI:"44",SC:"45",SD:"46",TN:"47",TX:"48",UT:"49",VT:"50",VA:"51",WA:"53",WV:"54",WI:"55",WY:"56",DC:"11"};
// County FIPS for common locations (expandable)
const COUNTY_FIPS = {"jasper,il":"079","cook,il":"031","champaign,il":"019","sangamon,il":"167","madison,il":"119","st. clair,il":"163","peoria,il":"143","winnebago,il":"201","lake,il":"097","dupage,il":"043","will,il":"197","kane,il":"089","mclean,il":"113"};
function getCountyFips(county, state) {
  const key = (county + "," + state).toLowerCase().trim();
  return COUNTY_FIPS[key] || null;
}

// ── FEDERAL AUDIT CLEARINGHOUSE API — Compliance intelligence (free Data.gov key or DEMO_KEY) ──
const FAC_API = "https://api.fac.gov";
async function searchFAC(state, opts = {}) {
  const params = new URLSearchParams();
  if (state) params.append("auditee_state", `eq.${state.toUpperCase()}`);
  if (opts.year) params.append("audit_year", `eq.${opts.year}`);
  params.append("limit", String(opts.limit || 10));
  params.append("order", "fac_accepted_date.desc");
  params.append("select", "report_id,auditee_name,auditee_city,auditee_state,audit_year,fac_accepted_date,is_going_concern,total_amount_expended,number_months,type_audit_code");
  const resp = await fetch(`${FAC_API}/general?${params}`, {
    headers: { "X-Api-Key": getDataGovKey() }
  });
  if (!resp.ok) return [];
  const data = await resp.json();
  return (Array.isArray(data) ? data : []).map(a => ({
    id: a.report_id, name: a.auditee_name, city: a.auditee_city,
    state: a.auditee_state, year: a.audit_year,
    accepted: a.fac_accepted_date, goingConcern: a.is_going_concern,
    totalExpended: parseFloat(a.total_amount_expended || 0),
    auditType: a.type_audit_code === "UG" ? "Uniform Guidance" : a.type_audit_code === "SA" ? "Single Audit" : a.type_audit_code,
    source: "FAC.gov",
  }));
}

async function getFACFindings(reportId) {
  const resp = await fetch(`${FAC_API}/findings?report_id=eq.${reportId}&select=reference_number,type_requirement,modified_opinion,other_non_compliance,material_weakness,significant_deficiency,other_findings,repeat_prior_reference`, {
    headers: { "X-Api-Key": getDataGovKey() }
  });
  if (!resp.ok) return [];
  return resp.json();
}

// ── REGULATIONS.GOV API — Grant-related regulatory notices (free DEMO_KEY) ──
const REGS_API = "https://api.regulations.gov/v4/documents";
async function searchRegulations(term, opts = {}) {
  const params = new URLSearchParams({
    "filter[searchTerm]": term,
    "filter[documentType]": "Notice",
    "api_key": getDataGovKey(),
    "page[size]": String(opts.pageSize || 10),
    "sort": "-postedDate",
  });
  if (opts.agencyId) params.append("filter[agencyId]", opts.agencyId);
  const resp = await fetch(`${REGS_API}?${params}`);
  if (!resp.ok) return { results: [], total: 0 };
  const data = await resp.json();
  return {
    total: data.meta?.totalElements || 0,
    results: (data.data || []).map(d => ({
      id: d.id,
      title: d.attributes?.title || "",
      agency: d.attributes?.agencyId || "",
      posted: d.attributes?.postedDate || "",
      commentEnd: d.attributes?.commentEndDate,
      openForComment: d.attributes?.openForComment || false,
      docket: d.attributes?.docketId || "",
      frDocNum: d.attributes?.frDocNum || "",
      url: `https://www.regulations.gov/document/${d.id}`,
      source: "Regulations.gov",
    })),
  };
}

// ── SIMPLER.GRANTS.GOV API — Enhanced grant search (requires Login.gov key) ──
const SIMPLER_API = "https://api.simpler.grants.gov/v1/opportunities/search";
async function searchSimplerGrants(query, opts = {}) {
  const key = getSimplerKey();
  if (!key) return { results: [], total: 0, available: false };
  const resp = await fetch(SIMPLER_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Api-Key": key },
    body: JSON.stringify({
      pagination: {
        page_offset: opts.page || 1,
        page_size: opts.pageSize || 10,
        order_by: "opportunity_id",
        sort_direction: "descending",
      },
      query,
      ...(opts.status && { status: opts.status }),
      ...(opts.agency && { agency: opts.agency }),
      ...(opts.fundingCategory && { funding_category: opts.fundingCategory }),
    }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    if (err.status_code === 401) return { results: [], total: 0, available: false, error: "Invalid API key" };
    return { results: [], total: 0, available: true };
  }
  const data = await resp.json();
  const opps = data.data || [];
  return {
    total: data.pagination_info?.total_records || 0,
    available: true,
    results: (Array.isArray(opps) ? opps : []).map(o => ({
      id: o.opportunity_id, title: o.opportunity_title, number: o.opportunity_number,
      agency: o.agency_name || o.agency_code, status: o.opportunity_status,
      openDate: o.post_date, closeDate: o.close_date,
      summary: o.summary?.summary_description || "",
      category: o.category?.category_name || "",
      fundingInstrument: o.funding_instrument?.funding_instrument_description || "",
      source: "Simpler.Grants.gov",
    })),
  };
}

// ── SAM.GOV ENTITY API — Registration verification & UEI lookup (requires SAM key) ──
const SAM_ENTITY_API = "https://api.sam.gov/entity-information/v3/entities";
async function searchSAMEntities(opts = {}) {
  const key = getSAMKey();
  if (!key) return { results: [], available: false };
  const params = new URLSearchParams({ api_key: key });
  if (opts.uei) params.append("ueiSAM", opts.uei);
  if (opts.legalName) params.append("legalBusinessName", opts.legalName);
  if (opts.state) params.append("stateOrProvinceCode", opts.state);
  if (opts.ein) params.append("entityEINCode", opts.ein);
  params.append("registrationStatus", opts.status || "A"); // Active
  params.append("includeSections", opts.sections || "entityRegistration,coreData");
  params.append("page", String(opts.page || 0));
  params.append("size", String(opts.size || 10));
  const resp = await fetch(`${SAM_ENTITY_API}?${params}`);
  if (!resp.ok) {
    if (resp.status === 403 || resp.status === 401) return { results: [], available: false, error: "Invalid API key" };
    return { results: [], available: true };
  }
  const data = await resp.json();
  return {
    total: data.totalRecords || 0,
    available: true,
    results: (data.entityData || []).map(e => {
      const reg = e.entityRegistration || {};
      const core = e.coreData || {};
      const addr = core.physicalAddress || {};
      return {
        uei: reg.ueiSAM, legalName: reg.legalBusinessName, dba: reg.dbaName,
        status: reg.registrationStatus, expiration: reg.registrationExpirationDate,
        purpose: reg.purposeOfRegistrationDesc, entityType: reg.entityTypeDesc,
        cage: reg.cageCode, ein: core.entityInformation?.entityEINCode,
        state: addr.stateOrProvinceCode, city: addr.city, zip: addr.zipCode,
        country: addr.countryCode, naics: (core.entityInformation?.naicsList || []).map(n => n.naicsCode),
        source: "SAM.gov",
      };
    }),
  };
}

// Verify a specific UEI registration status
async function verifySAMRegistration(uei) {
  const result = await searchSAMEntities({ uei });
  if (!result.available) return { verified: false, available: false, error: result.error || "SAM.gov API key required" };
  if (result.results.length === 0) return { verified: false, available: true, error: "UEI not found in SAM.gov" };
  const entity = result.results[0];
  const isActive = entity.status === "Active";
  const expDate = entity.expiration ? new Date(entity.expiration) : null;
  const daysUntilExpiry = expDate ? Math.floor((expDate - new Date()) / 86400000) : null;
  return {
    verified: true, available: true, active: isActive,
    entity, daysUntilExpiry,
    warning: daysUntilExpiry !== null && daysUntilExpiry < 60 ? `SAM registration expires in ${daysUntilExpiry} days` : null,
  };
}

// ── USASPENDING RECIPIENT SEARCH — Find orgs receiving federal awards ──
async function searchUSAspendingRecipients(keyword, limit = 10) {
  const resp = await fetch("https://api.usaspending.gov/api/v2/recipient/", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keyword, limit }),
  });
  if (!resp.ok) return [];
  const data = await resp.json();
  return (data.results || []).map(r => ({
    id: r.id, name: r.name, uei: r.uei, duns: r.duns,
    amount: r.amount, level: r.recipient_level,
    source: "USAspending",
  }));
}

// ── USASPENDING SPENDING TRENDS — Grant funding by year for a state ──
async function fetchSpendingTrends(state, startYear = 2020) {
  const resp = await fetch("https://api.usaspending.gov/api/v2/search/spending_over_time/", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      group: "fiscal_year",
      filters: {
        time_period: [{ start_date: `${startYear}-01-01`, end_date: "2025-12-31" }],
        award_type_codes: ["02", "03", "04", "05"],
        recipient_locations: [{ country: "USA", state }],
      }
    }),
  });
  if (!resp.ok) return [];
  const data = await resp.json();
  return (data.results || []).map(r => ({
    year: r.time_period?.fiscal_year,
    amount: r.aggregated_amount || 0,
    grants: r.Grant_Obligations || 0,
  }));
}

// ── USASPENDING SPENDING BY CATEGORY — Top recipients in a state ──
async function fetchTopRecipients(state, limit = 8) {
  const resp = await fetch("https://api.usaspending.gov/api/v2/search/spending_by_category/recipient/", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filters: {
        time_period: [{ start_date: "2024-01-01", end_date: "2024-12-31" }],
        award_type_codes: ["02", "03", "04", "05"],
        recipient_locations: [{ country: "USA", state }],
      },
      limit, page: 1,
    }),
  });
  if (!resp.ok) return [];
  const data = await resp.json();
  return (data.results || []).map(r => ({
    name: r.name, uei: r.uei, amount: r.amount,
    id: r.recipient_id, source: "USAspending",
  }));
}

// ── CENSUS NARRATIVE AUTO-GENERATOR — builds Statement of Need from live data ──
function generateCensusNarrative(data, countyName) {
  if (!data) return "";
  const parts = [];
  parts.push(`${countyName || data.name} (population ${(data.totalPop || 0).toLocaleString()}) presents a compelling case for federal investment.`);
  if (data.povertyPct > 10) parts.push(`With a poverty rate of ${data.povertyPct}%, significantly above the national average, the community faces persistent economic hardship.`);
  else parts.push(`The county's poverty rate of ${data.povertyPct}% underscores pockets of economic vulnerability that targeted intervention can address.`);
  if (data.disabilityPct > 12) parts.push(`${data.disabilityPct}% of residents live with a disability, creating urgent demand for accessible services and assistive technology infrastructure.`);
  if (data.unemploymentPct > 4) parts.push(`Unemployment stands at ${data.unemploymentPct}%, reflecting limited employment pathways in the region.`);
  parts.push(`Median household income of $${(data.medianIncome || 0).toLocaleString()} constrains local capacity for self-funded development initiatives.`);
  if (data.broadbandPct && data.broadbandPct < 90) parts.push(`Only ${data.broadbandPct}% of households have broadband internet access, highlighting a digital divide that limits economic participation.`);
  if (data.bachelorsPct && data.bachelorsPct < 25) parts.push(`Just ${data.bachelorsPct}% of adults hold a bachelor's degree or higher, indicating a workforce development gap that this project addresses.`);
  parts.push(`This project directly targets these systemic barriers, leveraging federal investment to catalyze sustainable economic opportunity for the community's ${(data.totalPop || 0).toLocaleString()} residents. (Source: U.S. Census Bureau, American Community Survey 5-Year Estimates)`);
  return parts.join(" ");
}

// ── USASPENDING CFDA PROGRAM INTELLIGENCE — which federal programs fund your area ──
async function fetchCFDAPrograms(state, keywords = [], limit = 12) {
  const filters = {
    time_period: [{ start_date: "2024-01-01", end_date: "2024-12-31" }],
    award_type_codes: ["02", "03", "04", "05"],
  };
  if (state) filters.recipient_locations = [{ country: "USA", state }];
  if (keywords.length > 0) filters.keywords = keywords;
  const resp = await fetch("https://api.usaspending.gov/api/v2/search/spending_by_category/cfda/", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filters, limit, page: 1 }),
  });
  if (!resp.ok) return [];
  const data = await resp.json();
  return (data.results || []).map(r => ({
    id: r.id, code: r.code, name: r.name, amount: r.amount, source: "USAspending",
  }));
}

// ── USASPENDING COUNTY SPENDING — grant dollars by county ──
async function fetchCountySpending(state, limit = 12) {
  const resp = await fetch("https://api.usaspending.gov/api/v2/search/spending_by_category/county/", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filters: {
        time_period: [{ start_date: "2024-01-01", end_date: "2024-12-31" }],
        award_type_codes: ["02", "03", "04", "05"],
        recipient_locations: [{ country: "USA", state }],
      }, limit, page: 1,
    }),
  });
  if (!resp.ok) return [];
  const data = await resp.json();
  return (data.results || []).map(r => ({
    code: r.code, name: r.name, amount: r.amount, source: "USAspending",
  }));
}

// ── USASPENDING LOCAL AWARDS — actual grants in a specific county ──
async function fetchLocalAwards(state, countyFips, limit = 10) {
  const resp = await fetch("https://api.usaspending.gov/api/v2/search/spending_by_award/", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filters: {
        time_period: [{ start_date: "2022-01-01", end_date: "2025-12-31" }],
        award_type_codes: ["02", "03", "04", "05"],
        recipient_locations: [{ country: "USA", state, county: countyFips }],
      },
      fields: ["Award ID", "Recipient Name", "Award Amount", "Awarding Agency", "Description", "Start Date"],
      limit, page: 1, sort: "Award Amount", order: "desc",
    }),
  });
  if (!resp.ok) return [];
  const data = await resp.json();
  return (data.results || []).map(r => ({
    id: r["Award ID"], recipient: r["Recipient Name"], amount: r["Award Amount"],
    agency: r["Awarding Agency"], description: r["Description"], date: r["Start Date"],
    source: "USAspending",
  }));
}

// ── USASPENDING CFDA AUTOCOMPLETE — search federal assistance programs ──
async function autocompleteCFDA(searchText, limit = 8) {
  const resp = await fetch("https://api.usaspending.gov/api/v2/autocomplete/cfda/", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ search_text: searchText, limit }),
  });
  if (!resp.ok) return [];
  const data = await resp.json();
  return (data.results || []).map(r => ({
    code: r.program_number, title: r.program_title,
    popular: r.popular_name, source: "USAspending",
  }));
}

// DISCOVERY SEARCHES — Dynamic from profile, with generic fallbacks
const DISCOVERY_SEARCHES = [
  { keyword: "small business grant program federal", label: "General SB", tier: 1 },
  { keyword: "entrepreneur innovation development grant", label: "Innovation", tier: 1 },
  { keyword: "economic development community grant", label: "Econ Dev", tier: 2 },
  { keyword: "SBIR small business innovation research", label: "SBIR", tier: 2 },
  { keyword: "workforce development training grant", label: "Workforce", tier: 3 },
];

function categorizeGrant(title, agency) {
  const t = (title + " " + agency).toLowerCase();
  if (t.includes("disab") || t.includes("rehabilit") || t.includes("assistive") || t.includes("ada ") || t.includes("section 508")) return "disability";
  if (t.includes("rural") || t.includes("usda") || t.includes("agricultur") || t.includes("broadband")) return "rural";
  if (t.includes("sbir") || t.includes("sttr") || t.includes("technol") || t.includes("innovat") || t.includes("nsf") || t.includes("cyber") || t.includes("artificial") || t.includes("data sci") || t.includes("machine learn")) return "technology";
  if (t.includes("disadvant") || t.includes("underserved") || t.includes("minority") || t.includes("economic dev") || t.includes("poverty") || t.includes("low-income")) return "disadvantaged";
  return "business";
}

function Discovery({ G, sG, onNav, searches }) {
  const DISC_SEARCHES = searches && searches.length > 0 ? searches : DISCOVERY_SEARCHES;
  const [feed, setFeed] = useState([]);
  const [forecasted, setForecasted] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  const [filter, setFilter] = useState("all");
  const [added, setAdded] = useState({});
  const [customKw, setCustomKw] = useState("");
  const [sortBy, setSortBy] = useState("fit"); // fit, date, source
  const [minFit, setMinFit] = useState(0);
  const [showForecasted, setShowForecasted] = useState(false);
  const [agencyData, setAgencyData] = useState(null);
  const [scanProgress, setScanProgress] = useState(null);
  const [searchTier, setSearchTier] = useState("all"); // all, 1, 2, 3
  const [savedSearches, setSavedSearches] = useState(() => {
    try { return JSON.parse(localStorage.getItem("glp_v5_saved_searches") || "[]"); } catch { return []; }
  });

  const saveSearch = (kw) => {
    if (!kw.trim() || savedSearches.some(s => s.keyword === kw.trim())) return;
    const updated = [...savedSearches, { keyword: kw.trim(), savedAt: new Date().toISOString(), lastRun: null, resultCount: 0 }];
    setSavedSearches(updated);
    try { localStorage.setItem("glp_v5_saved_searches", JSON.stringify(updated)); } catch {}
  };

  const removeSearch = (kw) => {
    const updated = savedSearches.filter(s => s.keyword !== kw);
    setSavedSearches(updated);
    try { localStorage.setItem("glp_v5_saved_searches", JSON.stringify(updated)); } catch {}
  };

  const runSavedSearch = (kw) => {
    setCustomKw(kw);
    doSearch([{ keyword: kw, label: "Saved" }], "posted");
    const updated = savedSearches.map(s => s.keyword === kw ? { ...s, lastRun: new Date().toISOString() } : s);
    setSavedSearches(updated);
    try { localStorage.setItem("glp_v5_saved_searches", JSON.stringify(updated)); } catch {}
  };

  // Core search engine — uses official Grants.gov search2 API
  const doSearch = async (searches, statusFilter = "posted", appendMode = false) => {
    setLoading(true); setError(null);
    if (!appendMode) setScanProgress({ done: 0, total: searches.length, current: "" });
    const seen = new Set(G.map(g => g.name.toLowerCase()));
    const existingIds = new Set(appendMode ? feed.map(f => f.id) : []);
    const results = appendMode ? [...feed] : [];
    const seenIds = new Set(existingIds);
    let searchesDone = appendMode ? feed.length : 0;

    for (const q of searches) {
      setScanProgress(p => ({ ...(p || {}), done: searchesDone, current: q.label || q.keyword }));
      try {
        const { hits, totalCount } = await searchGrantsGov(
          q.keyword, statusFilter, 25,
          { agencies: q.agency, fundingCategories: q.category, eligibilities: q.eligibility }
        );
        for (const h of hits) {
          if (seenIds.has(h.id)) continue;
          seenIds.add(h.id);
          const name = (h.title || "").replace(/&[a-z]+;/g, " ").replace(/\s+/g, " ").trim();
          if (!name || seen.has(name.toLowerCase())) continue;
          const cat = categorizeGrant(name, h.agency || "");
          const fitResult = scoreText(name + " " + (h.agency || "") + " " + (h.number || "") + " " + cat);
          results.push({
            id: h.id, name, source: h.agency || "Federal", oppNum: h.number || "",
            cat, url: `https://www.grants.gov/search-results-detail/${h.id}`,
            openDate: h.openDate || "", closeDate: h.closeDate || "Rolling",
            fit: fitResult.score, matches: fitResult.matches, gaps: fitResult.gaps,
            searchTerm: q.label || q.keyword, status: h.oppStatus || statusFilter,
            docType: h.docType || "", cfda: (h.cfdaList || []).join(", "),
            isForecasted: statusFilter === "forecasted",
            apiSource: "grants.gov", totalInQuery: totalCount,
          });
        }
      } catch (e) {
        console.error("Grants.gov search2 error:", e);
        if (results.length === 0 && !appendMode) setError("Grants.gov API error: " + e.message + ". The API may be temporarily unavailable.");
      }
      searchesDone++;
    }
    if (results.length === 0 && !error) setError("No results found. Try broader keywords or different search tier.");
    results.sort((a, b) => b.fit - a.fit);
    
    if (statusFilter === "forecasted") {
      setForecasted(results.filter(r => r.isForecasted));
    } else {
      setFeed(results);
    }
    setLastFetch(new Date().toLocaleTimeString());
    setScanProgress(null);
    setLoading(false);
    return results;
  };

  // FULL SCAN — runs all tier-appropriate searches + award intelligence + SBIR intel
  const fullScan = async () => {
    const searches = searchTier === "all" 
      ? DISC_SEARCHES 
      : DISC_SEARCHES.filter(s => s.tier <= parseInt(searchTier));
    const customSearches = savedSearches.map(s => ({ keyword: s.keyword, label: "⭐ " + s.keyword }));
    const allSearches = [...searches, ...customSearches];
    
    // Phase 1: Posted grants via Grants.gov search2 API
    await doSearch(allSearches, "posted");
    
    // Phase 2: Forecasted grants
    await doSearch(searches.filter(s => s.tier <= 2), "forecasted");
    
    // Phase 3: Award Intelligence — who's winning grants in your area?
    loadAgencyIntel();
    loadAwardIntel();
    loadSBIRIntel();
    
    // Phase 4: Federal Register Early Warning + Census Community Data
    loadFedRegIntel();
    loadCensusData();
    
    // Phase 5: Funder Research + Compliance Intelligence
    loadFunderIntel();
    loadFACIntel();

    // Phase 6: Regulatory Notices + Spending Analysis
    loadRegsIntel();
    loadSpendTrends();
    loadTopRecipients();

    // Phase 7: Program Intelligence + Local Awards
    loadCFDAIntel();
    loadCountySpending();
    loadLocalAwards();

    // Phase 8: Premium APIs (if keys configured)
    loadSimplerIntel();
    loadSAMVerification();
    
    showToast(`Discovery scan complete — ${feed.length} opportunities found across 15+ APIs`, "success");
  };

  // Award Intelligence — recent grant awards near you
  const [awardIntel, setAwardIntel] = useState(null);
  const [sbirIntel, setSbirIntel] = useState(null);
  const [fedRegResults, setFedRegResults] = useState(null);
  const [censusData, setCensusData] = useState(null);
  const [funderIntel, setFunderIntel] = useState(null);
  const [facIntel, setFacIntel] = useState(null);
  const [regsIntel, setRegsIntel] = useState(null);
  const [spendTrends, setSpendTrends] = useState(null);
  const [topRecipients, setTopRecipients] = useState(null);
  const [censusNarrative, setCensusNarrative] = useState("");
  const [cfdaPrograms, setCfdaPrograms] = useState(null);
  const [countySpending, setCountySpending] = useState(null);
  const [localAwards, setLocalAwards] = useState(null);
  const [simplerResults, setSimplerResults] = useState(null);
  const [samVerification, setSamVerification] = useState(null);
  
  const loadAwardIntel = async () => {
    try {
      const state = P?.loc?.state || "IL";
      const kw = DISC_SEARCHES.slice(0, 3).map(s => s.keyword.split(" ")[0]);
      const results = await searchUSAspendingAwards(kw, state, 8);
      setAwardIntel(results);
    } catch (e) { console.error("Award intel error:", e); }
  };
  
  const loadSBIRIntel = async () => {
    try {
      const state = P?.loc?.state || "IL";
      const kw = DISC_SEARCHES[0]?.keyword?.split(" ")[0] || "technology";
      const results = await searchSBIRAwards(kw, state, 8);
      setSbirIntel(results);
    } catch (e) { console.error("SBIR intel error:", e); }
  };

  // Federal Register Early Warning — scan for new NOFOs
  const loadFedRegIntel = async () => {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
      const keywords = DISC_SEARCHES.slice(0, 3).map(s => s.keyword.split(" ").slice(0, 2).join(" "));
      const allResults = [];
      const seen = new Set();
      for (const kw of keywords) {
        try {
          const { results } = await searchFederalRegister(kw + " grant", { perPage: 5, afterDate: thirtyDaysAgo });
          for (const r of results) {
            if (!seen.has(r.docNumber)) { seen.add(r.docNumber); allResults.push(r); }
          }
        } catch {}
      }
      allResults.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      setFedRegResults(allResults);
      if (allResults.length > 0) showToast(`📰 ${allResults.length} new NOFOs from Federal Register`, "info");
    } catch (e) { console.error("Federal Register error:", e); setFedRegResults([]); }
  };

  // Census ACS Data — community demographics for narratives
  const loadCensusData = async () => {
    try {
      const stateAbbr = P?.loc?.state || "IL";
      const countyName = P?.loc?.county || P?.loc?.city || "jasper";
      const stateFips = STATE_ABBR_FIPS[stateAbbr.toUpperCase()];
      const countyFips = getCountyFips(countyName, stateAbbr) || "079"; // default Jasper IL
      if (!stateFips) { showToast("Set your state in Profile to load Census data", "warn"); return; }
      const data = await fetchCensusACS(stateFips, countyFips);
      setCensusData(data);
      showToast(`📊 Census data loaded for ${data.name || "your county"}`, "success");
    } catch (e) { console.error("Census ACS error:", e); showToast("Census data unavailable for this location", "warn"); }
  };

  // Funder Research — ProPublica nonprofit org intelligence
  const loadFunderIntel = async () => {
    try {
      const state = P?.loc?.state || "IL";
      const keywords = DISC_SEARCHES.slice(0, 2).map(s => s.keyword.split(" ")[0]);
      const allOrgs = [];
      const seen = new Set();
      for (const kw of keywords) {
        try {
          const orgs = await searchNonprofits(kw, state);
          for (const o of orgs) {
            if (!seen.has(o.ein)) { seen.add(o.ein); allOrgs.push(o); }
          }
        } catch {}
      }
      // Get details for top 4 orgs with revenue data
      const detailed = [];
      for (const org of allOrgs.slice(0, 4)) {
        try {
          const d = await getNonprofitDetails(org.ein.replace("-", ""));
          if (d) detailed.push(d);
        } catch {}
      }
      setFunderIntel({ orgs: allOrgs, details: detailed });
      if (allOrgs.length > 0) showToast(`🔍 ${allOrgs.length} nonprofits found for funder research`, "info");
    } catch (e) { console.error("Funder intel error:", e); }
  };

  // FAC Compliance Intel — single audit intelligence
  const loadFACIntel = async () => {
    try {
      const state = P?.loc?.state || "IL";
      const audits = await searchFAC(state, { year: "2024", limit: 8 });
      setFacIntel(audits);
      if (audits.length > 0) showToast(`🔒 ${audits.length} recent audits found in ${state}`, "info");
    } catch (e) { console.error("FAC error:", e); setFacIntel([]); }
  };

  // Regulations.gov — grant-related regulatory notices and comment periods
  const loadRegsIntel = async () => {
    try {
      const keywords = DISC_SEARCHES.slice(0, 2).map(s => s.keyword.split(" ").slice(0, 2).join(" "));
      const allResults = [];
      const seen = new Set();
      for (const kw of keywords) {
        try {
          const { results } = await searchRegulations(kw + " funding", { pageSize: 5 });
          for (const r of results) {
            if (!seen.has(r.id)) { seen.add(r.id); allResults.push(r); }
          }
        } catch {}
      }
      allResults.sort((a, b) => (b.posted || "").localeCompare(a.posted || ""));
      setRegsIntel(allResults);
      if (allResults.length > 0) showToast(`⚖️ ${allResults.length} regulatory notices found`, "info");
    } catch (e) { console.error("Regulations.gov error:", e); setRegsIntel([]); }
  };

  // Spending Trends — grant funding by year for your state
  const loadSpendTrends = async () => {
    try {
      const state = P?.loc?.state || "IL";
      const trends = await fetchSpendingTrends(state, 2020);
      setSpendTrends(trends);
    } catch (e) { console.error("Spending trends error:", e); }
  };

  // Top Recipients — largest grant recipients in your state
  const loadTopRecipients = async () => {
    try {
      const state = P?.loc?.state || "IL";
      const recipients = await fetchTopRecipients(state, 8);
      setTopRecipients(recipients);
    } catch (e) { console.error("Top recipients error:", e); }
  };

  // Auto-generate Census narrative when data loads
  const loadCensusAndNarrative = async () => {
    await loadCensusData();
  };

  // CFDA Program Intelligence — which federal programs fund your area
  const loadCFDAIntel = async () => {
    try {
      const state = P?.loc?.state || "IL";
      const kw = DISC_SEARCHES.slice(0, 3).map(s => s.keyword.split(" ").slice(0, 2).join(" "));
      // Get both state-level and keyword-level programs
      const [stateProgs, kwProgs] = await Promise.all([
        fetchCFDAPrograms(state, [], 10),
        fetchCFDAPrograms(null, kw, 10),
      ]);
      // Merge and deduplicate
      const seen = new Set();
      const merged = [];
      for (const p of [...stateProgs, ...kwProgs]) {
        if (!seen.has(p.code)) { seen.add(p.code); merged.push(p); }
      }
      merged.sort((a, b) => b.amount - a.amount);
      setCfdaPrograms(merged);
      if (merged.length > 0) showToast(`📋 ${merged.length} federal assistance programs identified`, "info");
    } catch (e) { console.error("CFDA error:", e); setCfdaPrograms([]); }
  };

  // County Spending Map — grant dollars flowing to each county
  const loadCountySpending = async () => {
    try {
      const state = P?.loc?.state || "IL";
      const counties = await fetchCountySpending(state, 12);
      setCountySpending(counties);
    } catch (e) { console.error("County spending error:", e); }
  };

  // Local Awards — actual grants awarded near you
  const loadLocalAwards = async () => {
    try {
      const state = P?.loc?.state || "IL";
      const countyFips = P?.loc?.county || "079";
      const awards = await fetchLocalAwards(state, countyFips, 10);
      setLocalAwards(awards);
      if (awards.length > 0) showToast(`📍 ${awards.length} grants awarded in your county`, "info");
    } catch (e) { console.error("Local awards error:", e); setLocalAwards([]); }
  };

  // Simpler.Grants.gov — Enhanced grant search (if key provided)
  const loadSimplerIntel = async () => {
    if (!getSimplerKey()) { setSimplerResults({ available: false }); return; }
    try {
      const keywords = DISC_SEARCHES.slice(0, 3).map(s => s.keyword);
      const allResults = [];
      const seen = new Set();
      for (const kw of keywords) {
        try {
          const { results, available } = await searchSimplerGrants(kw, { pageSize: 5, status: "posted" });
          if (!available) { setSimplerResults({ available: false }); return; }
          for (const r of results) {
            if (!seen.has(r.id)) { seen.add(r.id); allResults.push(r); }
          }
        } catch {}
      }
      setSimplerResults({ available: true, results: allResults });
      if (allResults.length > 0) showToast(`🏛️ ${allResults.length} results from Simpler.Grants.gov`, "info");
    } catch (e) { console.error("Simpler.Grants error:", e); setSimplerResults({ available: true, results: [] }); }
  };

  // SAM.gov — Entity registration verification (if key provided)
  const loadSAMVerification = async () => {
    if (!getSAMKey()) { setSamVerification({ available: false }); return; }
    try {
      // Check if user has a UEI in their profile
      const uei = P?.org?.uei;
      if (uei) {
        const result = await verifySAMRegistration(uei);
        setSamVerification(result);
        if (result.verified && result.active) showToast(`✅ SAM registration verified: ${result.entity.legalName}`, "success");
        else if (result.warning) showToast(`⚠️ ${result.warning}`, "warn");
        else if (!result.verified) showToast(`❌ UEI ${uei} not found in SAM.gov`, "warn");
      } else {
        // No UEI — search by org name or state
        const name = P?.org?.name;
        const state = P?.loc?.state || "IL";
        const result = await searchSAMEntities({ legalName: name, state, size: 5 });
        setSamVerification({ ...result, searchMode: true });
        if (result.results?.length > 0) showToast(`📋 ${result.results.length} SAM.gov entities found`, "info");
      }
    } catch (e) { console.error("SAM.gov error:", e); setSamVerification({ available: true, results: [], error: e.message }); }
  };

  // Agency Intelligence — which agencies fund your keywords in your state?
  const loadAgencyIntel = async () => {
    const state = P?.loc?.state || "IL";
    const profileKeywords = DISC_SEARCHES.slice(0, 4).map(s => s.keyword.split(" ")[0]);
    try {
      const resp = await fetch(USASPEND_AGENCY_API, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filters: {
            time_period: [{ start_date: "2024-01-01", end_date: "2024-12-31" }],
            award_type_codes: ["02", "03", "04", "05"],
            recipient_locations: [{ country: "USA", state }],
            keywords: profileKeywords.length > 0 ? profileKeywords : ["small business", "technology"],
          }, limit: 12
        })
      });
      const data = await resp.json();
      setAgencyData(data.results || []);
    } catch { setAgencyData([]); }
  };

  const searchCustom = () => {
    if (!customKw.trim()) return;
    doSearch([{ keyword: customKw, label: "Custom" }]);
  };

  const addToP = (f) => {
    if (added[f.id]) return;
    const newG = mk(1000 + G.length, f.name, f.source, f.cat, "See listing", f.closeDate || "See listing", f.url, f.fit, `CFDA: ${f.cfda || "N/A"} | Found via: ${f.searchTerm}${f.isForecasted ? " | ⚡ FORECASTED — not yet open" : ""}`, [], [], null, null);
    sG(prev => [...prev, newG]);
    setAdded(prev => ({ ...prev, [f.id]: true }));
  };

  // Bulk add all high-fit results
  const bulkAdd = (minScore) => {
    const toAdd = feed.filter(f => f.fit >= minScore && !added[f.id]);
    toAdd.forEach(f => addToP(f));
  };

  // Apply sorting and filtering
  const allResults = showForecasted ? [...feed, ...forecasted] : feed;
  const sorted = allResults
    .filter(f => filter === "all" || f.cat === filter)
    .filter(f => f.fit >= minFit)
    .sort((a, b) => {
      if (sortBy === "fit") return b.fit - a.fit;
      if (sortBy === "date") return (a.closeDate || "Z").localeCompare(b.closeDate || "Z");
      if (sortBy === "source") return a.source.localeCompare(b.source);
      return b.fit - a.fit;
    });

  const highFit = feed.filter(f => f.fit >= 65).length;
  const totalForecasted = forecasted.length;

  return (
    <div style={{ animation: "fi .3s ease" }}>
      <Hd i="📡" t="Discovery Engine" s={`${DISC_SEARCHES.length} searches · 15 live APIs · 7-phase intelligence pipeline`} r={
        <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
          {lastFetch && <span style={{ fontSize: 8, color: T.gn }}>Last: {lastFetch}</span>}
          <Btn primary onClick={fullScan} disabled={loading}>
            {loading ? "⏳ Scanning..." : "🔍 Full Scan"}
          </Btn>
        </div>
      }>
        <SG items={[
          { l: "Discovered", v: feed.length, c: T.bl },
          { l: "High-Fit (65%+)", v: highFit, c: T.gn },
          { l: "Forecasted", v: totalForecasted, c: T.pu },
          { l: "Added", v: Object.keys(added).length, c: T.cy },
        ]} />

        {/* SEARCH CONTROLS */}
        <Cd sx={{ marginBottom: 8 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: T.cy }}>Search Tier:</div>
            {[["all","All 17"], ["1","Core (6)"], ["2","Extended (11)"], ["3","Full (17)"]].map(([k, l]) => (
              <button key={k} onClick={() => setSearchTier(k)} style={{ padding: "2px 7px", borderRadius: 3, fontSize: 8, fontWeight: 700, cursor: "pointer", border: `1px solid ${searchTier === k ? T.am : T.bd}`, background: searchTier === k ? T.am + "20" : "transparent", color: searchTier === k ? T.am : T.mu }}>{l}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 2, flexWrap: "wrap", marginBottom: 6 }}>
            {DISC_SEARCHES.filter(q => searchTier === "all" || q.tier <= parseInt(searchTier)).map(q => (
              <Btn key={q.label} small onClick={() => doSearch([q])} style={{ opacity: q.tier === 1 ? 1 : q.tier === 2 ? 0.8 : 0.6 }}>
                {q.tier === 1 ? "🎯" : q.tier === 2 ? "🔸" : "🔹"}{q.label}
              </Btn>
            ))}
          </div>
          <div style={{ display: "flex", gap: 3 }}>
            <input value={customKw} onChange={e => setCustomKw(e.target.value)} placeholder="Custom search keywords..." style={{ ...inpS, flex: 1 }} onKeyDown={e => e.key === "Enter" && searchCustom()} />
            <Btn small primary onClick={searchCustom}>Search</Btn>
            {customKw.trim() && <Btn small onClick={() => saveSearch(customKw)}>💾 Save</Btn>}
            <Btn small onClick={() => doSearch([{ keyword: customKw || "small business", label: "Forecasted" }], "forecasted")}>🔮 Forecasted</Btn>
          </div>
          
          {savedSearches.length > 0 && (
            <div style={{ marginTop: 6 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: T.am, marginBottom: 3, textTransform: "uppercase", letterSpacing: ".05em" }}>⭐ Saved Searches</div>
              <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                {savedSearches.map(s => (
                  <div key={s.keyword} style={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <button onClick={() => runSavedSearch(s.keyword)} style={{ padding: "2px 7px", borderRadius: 3, fontSize: 8, fontWeight: 700, cursor: "pointer", border: `1px solid ${T.am}30`, background: T.am + "10", color: T.am }}>{s.keyword}</button>
                    <span onClick={() => removeSearch(s.keyword)} style={{ fontSize: 8, color: T.rd, cursor: "pointer", fontWeight: 700 }}>✕</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Cd>

        {/* SCAN PROGRESS */}
        {scanProgress && (
          <Cd sx={{ marginBottom: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.am }}>⏳ Scanning: {scanProgress.current}</div>
              <div style={{ fontSize: 9, color: T.sb }}>{scanProgress.done}/{scanProgress.total}</div>
            </div>
            <div style={{ height: 4, background: T.bd, borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(scanProgress.done / Math.max(1, scanProgress.total)) * 100}%`, background: `linear-gradient(90deg, ${T.am}, ${T.gn})`, borderRadius: 2, transition: "width .3s" }}></div>
            </div>
          </Cd>
        )}

        {/* AGENCY INTELLIGENCE */}
        {!agencyData && !loading && (
          <Cd sx={{ marginBottom: 6, cursor: "pointer" }} onClick={loadAgencyIntel}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.pu }}>🏛️ Agency Intelligence</div>
                <div style={{ fontSize: 8, color: T.mu }}>Click to see which federal agencies fund your profile keywords in {P?.loc?.state || "your state"}</div>
              </div>
              <div style={{ fontSize: 9, color: T.bl }}>Load →</div>
            </div>
          </Cd>
        )}
        {agencyData && agencyData.length > 0 && (
          <Cd sx={{ marginBottom: 6 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.pu, marginBottom: 4 }}>🏛️ Top Funding Agencies for Your Profile — {P?.loc?.state || "US"} (2024)</div>
            <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
              {agencyData.slice(0, 8).map((a, i) => (
                <div key={i} style={{ padding: "4px 8px", background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 4, flex: "1 1 160px" }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: T.tx }}>{a.name}</div>
                  <div style={{ fontSize: 12, fontWeight: 900, color: T.gn, fontFamily: "var(--d)" }}>${((a.amount || 0) / 1e6).toFixed(1)}M</div>
                  <div style={{ fontSize: 7, color: T.mu }}>awarded in IL (2024)</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 7, color: T.dm, marginTop: 3 }}>Source: USASpending.gov API · Focus Discovery on these agencies for highest success probability</div>
          </Cd>
        )}

        {/* AWARD INTELLIGENCE — Who's winning grants near you? */}
        {awardIntel && awardIntel.length > 0 && (
          <Cd sx={{ marginBottom: 6 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.gn, marginBottom: 4 }}>🏆 Recent Grant Awards Near You</div>
            <div style={{ fontSize: 8, color: T.mu, marginBottom: 6 }}>Recent federal grant awards in {P?.loc?.state || "IL"} matching your profile keywords — see what's funded and who's winning.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {awardIntel.slice(0, 6).map((a, i) => (
                <div key={i} style={{ padding: "6px 8px", background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: T.tx }}>{a.recipient}</div>
                      <div style={{ fontSize: 8, color: T.mu, marginTop: 1 }}>{a.agency} · {a.startDate}</div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 900, color: T.gn, fontFamily: "var(--d)" }}>${a.amount >= 1e6 ? (a.amount / 1e6).toFixed(1) + "M" : a.amount >= 1e3 ? (a.amount / 1e3).toFixed(0) + "K" : a.amount}</div>
                  </div>
                  {a.description && <div style={{ fontSize: 7, color: T.dm, marginTop: 3, lineHeight: 1.4, maxHeight: 30, overflow: "hidden" }}>{a.description.substring(0, 200)}...</div>}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 7, color: T.dm, marginTop: 3 }}>Source: USAspending.gov API · Awards since 2023</div>
          </Cd>
        )}

        {/* SBIR COMPETITIVE INTELLIGENCE */}
        {sbirIntel && sbirIntel.length > 0 && (
          <Cd sx={{ marginBottom: 6 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.cy, marginBottom: 4 }}>🔬 SBIR/STTR Competitive Intelligence</div>
            <div style={{ fontSize: 8, color: T.mu, marginBottom: 6 }}>Companies winning SBIR/STTR awards in your space — study their abstracts and identify collaboration opportunities.</div>
            <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
              {sbirIntel.slice(0, 6).map((a, i) => (
                <div key={i} style={{ padding: "6px 8px", background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 6, flex: "1 1 220px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: T.tx }}>{a.firm}</div>
                    <B c={a.phase === "Phase I" ? T.bl : a.phase === "Phase II" ? T.gn : T.pu}>{a.phase}</B>
                  </div>
                  <div style={{ fontSize: 8, color: T.mu, marginTop: 2 }}>{a.title}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                    <span style={{ fontSize: 7, color: T.dm }}>{a.agency} · {a.year}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: T.gn }}>${a.amount ? Number(a.amount).toLocaleString() : "N/A"}</span>
                  </div>
                  {a.keywords && <div style={{ fontSize: 6, color: T.am, marginTop: 2 }}>{a.keywords.substring(0, 80)}</div>}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 7, color: T.dm, marginTop: 3 }}>Source: SBIR.gov API · Awards database · Location: {P?.loc?.state || "IL"}</div>
          </Cd>
        )}

        {/* FEDERAL REGISTER EARLY WARNING — NOFOs before they hit Grants.gov */}
        {fedRegResults && fedRegResults.length > 0 && (
          <Cd sx={{ marginBottom: 6, borderLeft: `3px solid ${T.am}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.am, marginBottom: 4 }}>📰 Federal Register Early Warning</div>
            <div style={{ fontSize: 8, color: T.mu, marginBottom: 6 }}>New NOFOs published in the Federal Register — these may appear on Grants.gov in 1-7 days.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {fedRegResults.slice(0, 8).map((r, i) => (
                <div key={i} style={{ padding: "6px 8px", background: T.bg, border: `1px solid ${T.am}20`, borderRadius: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 9, fontWeight: 700, color: T.bl, textDecoration: "none" }}>{r.title}</a>
                      <div style={{ fontSize: 8, color: T.mu, marginTop: 2 }}>{r.agencies}</div>
                    </div>
                    <B c={T.am}>{r.date}</B>
                  </div>
                  {r.abstract && <div style={{ fontSize: 7, color: T.dm, marginTop: 3, lineHeight: 1.4, maxHeight: 36, overflow: "hidden" }}>{r.abstract.substring(0, 250)}...</div>}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 7, color: T.dm, marginTop: 3 }}>Source: FederalRegister.gov API · NOFOs published in last 30 days · {fedRegResults.length} results</div>
          </Cd>
        )}
        {!fedRegResults && !loading && (
          <Cd sx={{ marginBottom: 6, cursor: "pointer" }} onClick={loadFedRegIntel}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.am }}>📰 Federal Register Early Warning</div>
                <div style={{ fontSize: 8, color: T.mu }}>Click to scan for new NOFOs — grants appear here before Grants.gov</div>
              </div>
              <div style={{ fontSize: 9, color: T.bl }}>Scan →</div>
            </div>
          </Cd>
        )}

        {/* CENSUS COMMUNITY DATA — Demographics for narratives */}
        {censusData && (
          <Cd sx={{ marginBottom: 6, borderLeft: `3px solid ${T.cy}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.cy, marginBottom: 4 }}>📊 Community Data — {censusData.name}</div>
            <div style={{ fontSize: 8, color: T.mu, marginBottom: 6 }}>Live Census ACS data for your community. Use these statistics in your Statement of Need narratives.</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 4 }}>
              {[
                { l: "Population", v: censusData.totalPop?.toLocaleString(), c: T.bl },
                { l: "Median Income", v: "$" + (censusData.medianIncome?.toLocaleString() || "N/A"), c: T.gn },
                { l: "Poverty Rate", v: censusData.povertyPct + "%", c: T.rd },
                { l: "Disability Rate", v: censusData.disabilityPct + "%", c: T.pu },
                { l: "Unemployment", v: (censusData.unemploymentPct || "N/A") + "%", c: T.or },
                { l: "Bachelor's+", v: (censusData.bachelorsPct || "N/A") + "%", c: T.bl },
                { l: "Broadband Access", v: (censusData.broadbandPct || "N/A") + "%", c: T.cy },
                { l: "Labor Force", v: (censusData.laborForcePct || "N/A") + "%", c: T.gn },
              ].map((s, i) => (
                <div key={i} style={{ padding: "5px 7px", background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 5, textAlign: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: s.c, fontFamily: "var(--d)" }}>{s.v}</div>
                  <div style={{ fontSize: 7, color: T.mu, marginTop: 1 }}>{s.l}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 7, color: T.dm, marginTop: 4 }}>
              Source: U.S. Census Bureau ACS 5-Year Estimates (2022) · 
              <span style={{ color: T.bl, cursor: "pointer" }} onClick={() => {
                const txt = `Community Profile: ${censusData.name}\n• Population: ${censusData.totalPop?.toLocaleString()}\n• Median Household Income: $${censusData.medianIncome?.toLocaleString()}\n• Poverty Rate: ${censusData.povertyPct}%\n• Disability Rate: ${censusData.disabilityPct}%\n• Unemployment: ${censusData.unemploymentPct}%\n• Bachelor's Degree+: ${censusData.bachelorsPct}%\n• Broadband Access: ${censusData.broadbandPct}%\nSource: U.S. Census Bureau, ACS 5-Year Estimates (2022)`;
                navigator.clipboard?.writeText(txt); showToast("Census data copied to clipboard", "success");
              }}>📋 Copy for Narrative</span>
              {" · "}
              <span style={{ color: T.am, cursor: "pointer" }} onClick={() => {
                const c = censusData;
                const awardCtx = awardIntel && awardIntel.length > 0
                  ? `\nRecent Federal Award Context: The ${c.name} region has seen recent federal grant activity, including awards to organizations such as ${awardIntel.slice(0,2).map(a => a.recipient).join(" and ")}. Federal investment in this area demonstrates both need and opportunity for additional support.`
                  : "";
                const narrative = `STATEMENT OF NEED\n\n${c.name} (population ${(c.totalPop || 0).toLocaleString()}) represents a community facing significant and measurable challenges that this project is specifically designed to address.\n\nEconomic Context: The community's median household income of $${(c.medianIncome || 0).toLocaleString()} and poverty rate of ${c.povertyPct}% reflect limited economic mobility. With an unemployment rate of ${c.unemploymentPct}%, residents face constrained access to stable employment. Only ${c.bachelorsPct}% of adults hold a bachelor's degree or higher, indicating a workforce development gap that limits economic diversification.\n\nAccessibility & Inclusion: ${c.disabilityPct}% of the population — a substantial proportion — lives with a disability, underscoring the need for accessible services and inclusive program design. This figure exceeds national averages and directly informs the accessibility-first approach of this project.\n\n${c.broadbandPct ? `Digital Infrastructure: Broadband access in the county stands at ${c.broadbandPct}%, creating barriers to digital participation, remote work, and online education that this project will help bridge.\n\n` : ""}Data Sources: U.S. Census Bureau, American Community Survey 5-Year Estimates (2022). All statistics are publicly verifiable at data.census.gov.${awardCtx}`;
                navigator.clipboard?.writeText(narrative);
                showToast("📝 Full Statement of Need copied — paste into AI Drafter or application", "success");
              }}>📝 Generate Statement of Need</span>
            </div>
          </Cd>
        )}
        {!censusData && !loading && P?.loc?.state && (
          <Cd sx={{ marginBottom: 6, cursor: "pointer" }} onClick={loadCensusData}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.cy }}>📊 Census Community Data</div>
                <div style={{ fontSize: 8, color: T.mu }}>Click to pull live demographics for your county — poverty, income, disability, broadband</div>
              </div>
              <div style={{ fontSize: 9, color: T.bl }}>Load →</div>
            </div>
          </Cd>
        )}

        {/* FUNDER RESEARCH — ProPublica Nonprofit Intelligence */}
        {funderIntel && funderIntel.details && funderIntel.details.length > 0 && (
          <Cd sx={{ marginBottom: 6, borderLeft: `3px solid ${T.gn}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.gn, marginBottom: 4 }}>🔍 Funder & Partner Research</div>
            <div style={{ fontSize: 8, color: T.mu, marginBottom: 6 }}>Nonprofit organizations in your sector + state — potential partners, fiscal sponsors, or competitors.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {funderIntel.details.map((d, i) => (
                <div key={i} style={{ padding: "6px 8px", background: T.bg, border: `1px solid ${T.gn}15`, borderRadius: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: T.tx }}>{d.name}</div>
                      <div style={{ fontSize: 8, color: T.mu }}>{d.city}, {d.state} · EIN: {d.ein} · NTEE: {d.ntee || "N/A"}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      {d.revenue > 0 && <div style={{ fontSize: 10, fontWeight: 800, color: T.gn, fontFamily: "var(--d)" }}>${d.revenue >= 1e6 ? (d.revenue / 1e6).toFixed(1) + "M" : d.revenue >= 1e3 ? (d.revenue / 1e3).toFixed(0) + "K" : d.revenue.toLocaleString()}</div>}
                      <div style={{ fontSize: 7, color: T.dm }}>revenue</div>
                    </div>
                  </div>
                  {d.filings && d.filings.length > 0 && (
                    <div style={{ display: "flex", gap: 3, marginTop: 3 }}>
                      {d.filings.slice(0, 3).map((f, fi) => (
                        <span key={fi} style={{ fontSize: 7, color: T.dm, padding: "1px 4px", background: T.cd, borderRadius: 2 }}>
                          FY{f.year}: ${f.revenue >= 1e6 ? (f.revenue / 1e6).toFixed(1) + "M" : f.revenue >= 1e3 ? Math.round(f.revenue / 1e3) + "K" : (f.revenue || 0).toLocaleString()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 7, color: T.dm, marginTop: 3 }}>Source: ProPublica Nonprofit Explorer API · IRS 990 data · {funderIntel.orgs?.length || 0} total matches</div>
          </Cd>
        )}
        {!funderIntel && !loading && (
          <Cd sx={{ marginBottom: 6, cursor: "pointer" }} onClick={loadFunderIntel}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.gn }}>🔍 Funder & Partner Research</div>
                <div style={{ fontSize: 8, color: T.mu }}>Click to find nonprofits in your sector — IRS 990 data, revenue, filings</div>
              </div>
              <div style={{ fontSize: 9, color: T.bl }}>Research →</div>
            </div>
          </Cd>
        )}

        {/* FAC COMPLIANCE INTELLIGENCE — Single audit data */}
        {facIntel && facIntel.length > 0 && (
          <Cd sx={{ marginBottom: 6, borderLeft: `3px solid ${T.yl}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.yl, marginBottom: 4 }}>🔒 Compliance Intelligence — Recent Audits</div>
            <div style={{ fontSize: 8, color: T.mu, marginBottom: 6 }}>Federal single audit data for organizations in {P?.loc?.state || "your state"}. Use to vet partners or understand audit landscape.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {facIntel.slice(0, 6).map((a, i) => (
                <div key={i} style={{ padding: "5px 8px", background: T.bg, border: `1px solid ${T.yl}15`, borderRadius: 5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 8, fontWeight: 700, color: T.tx }}>{a.name}</div>
                    <div style={{ fontSize: 7, color: T.mu }}>{a.city}, {a.state} · {a.auditType} · FY{a.year}</div>
                  </div>
                  <div style={{ textAlign: "right", display: "flex", gap: 3, alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 800, color: T.bl, fontFamily: "var(--d)" }}>${a.totalExpended >= 1e6 ? (a.totalExpended / 1e6).toFixed(1) + "M" : a.totalExpended >= 1e3 ? Math.round(a.totalExpended / 1e3) + "K" : a.totalExpended.toLocaleString()}</div>
                      <div style={{ fontSize: 6, color: T.dm }}>federal $</div>
                    </div>
                    {a.goingConcern === "Y" && <B c={T.rd}>⚠ Concern</B>}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 7, color: T.dm, marginTop: 3 }}>Source: Federal Audit Clearinghouse API (fac.gov) · Single audit results · FY2024</div>
          </Cd>
        )}
        {!facIntel && !loading && (
          <Cd sx={{ marginBottom: 6, cursor: "pointer" }} onClick={loadFACIntel}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.yl }}>🔒 Compliance Intelligence</div>
                <div style={{ fontSize: 8, color: T.mu }}>Click to check federal audit data — vet partners, track compliance in your state</div>
              </div>
              <div style={{ fontSize: 9, color: T.bl }}>Check →</div>
            </div>
          </Cd>
        )}

        {/* REGULATIONS.GOV — Grant-related regulatory notices */}
        {regsIntel && regsIntel.length > 0 && (
          <Cd sx={{ marginBottom: 6, borderLeft: `3px solid ${T.or}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.or, marginBottom: 4 }}>⚖️ Regulatory Notices — Grant Policy</div>
            <div style={{ fontSize: 8, color: T.mu, marginBottom: 6 }}>Federal regulatory notices related to your keywords. Track policy changes that affect grant eligibility and program requirements.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {regsIntel.slice(0, 6).map((r, i) => (
                <div key={i} style={{ padding: "5px 8px", background: T.bg, border: `1px solid ${T.or}15`, borderRadius: 5 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                    <div style={{ flex: 1 }}>
                      <a href={r.url} target="_blank" rel="noreferrer" style={{ fontSize: 8, fontWeight: 700, color: T.bl, textDecoration: "none" }}>{r.title}</a>
                      <div style={{ fontSize: 7, color: T.mu, marginTop: 1 }}>{r.agency} · {r.posted?.split("T")[0]} · Docket: {r.docket}</div>
                    </div>
                    {r.openForComment && <B c={T.gn}>Open for Comment</B>}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 7, color: T.dm, marginTop: 3 }}>Source: Regulations.gov API · Grant-related notices · {regsIntel.length} matches</div>
          </Cd>
        )}
        {!regsIntel && !loading && (
          <Cd sx={{ marginBottom: 6, cursor: "pointer" }} onClick={loadRegsIntel}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.or }}>⚖️ Regulatory Intelligence</div>
                <div style={{ fontSize: 8, color: T.mu }}>Click to track grant-related regulatory notices and open comment periods</div>
              </div>
              <div style={{ fontSize: 9, color: T.bl }}>Monitor →</div>
            </div>
          </Cd>
        )}

        {/* SPENDING TRENDS + TOP RECIPIENTS — Grant funding landscape */}
        {(spendTrends || topRecipients) && (
          <Cd sx={{ marginBottom: 6, borderLeft: `3px solid ${T.cy}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.cy, marginBottom: 4 }}>📈 Grant Funding Landscape — {P?.loc?.state || "IL"}</div>
            <div style={{ fontSize: 8, color: T.mu, marginBottom: 6 }}>Federal grant spending trends and top recipients in your state. Context for positioning your applications.</div>
            {spendTrends && spendTrends.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: T.tx, marginBottom: 4 }}>Grant Funding by Fiscal Year</div>
                <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 50 }}>
                  {spendTrends.map((t, i) => {
                    const maxAmt = Math.max(...spendTrends.map(s => s.amount));
                    const pct = maxAmt > 0 ? (t.amount / maxAmt) * 100 : 0;
                    return (
                      <div key={i} style={{ flex: 1, textAlign: "center" }}>
                        <div style={{ background: `linear-gradient(180deg, ${T.cy}, ${T.bl})`, borderRadius: "3px 3px 0 0", height: Math.max(4, pct * 0.45), transition: "height 0.3s" }} />
                        <div style={{ fontSize: 7, color: T.dm, marginTop: 2 }}>FY{t.year}</div>
                        <div style={{ fontSize: 7, fontWeight: 700, color: T.cy }}>${(t.amount / 1e9).toFixed(1)}B</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {topRecipients && topRecipients.length > 0 && (
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: T.tx, marginBottom: 4 }}>Top Grant Recipients (FY2024)</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {topRecipients.slice(0, 6).map((r, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 6px", background: T.bg, borderRadius: 4, fontSize: 8 }}>
                      <span style={{ color: T.sb, flex: 1 }}>{i + 1}. {r.name}</span>
                      <span style={{ fontWeight: 800, color: T.cy, fontFamily: "var(--d)" }}>
                        ${r.amount >= 1e9 ? (r.amount / 1e9).toFixed(1) + "B" : r.amount >= 1e6 ? (r.amount / 1e6).toFixed(0) + "M" : (r.amount / 1e3).toFixed(0) + "K"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ fontSize: 7, color: T.dm, marginTop: 3 }}>Source: USAspending.gov API · Federal grant awards · {P?.loc?.state || "IL"}</div>
          </Cd>
        )}
        {!spendTrends && !topRecipients && !loading && (
          <Cd sx={{ marginBottom: 6, cursor: "pointer" }} onClick={() => { loadSpendTrends(); loadTopRecipients(); }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.cy }}>📈 Grant Funding Landscape</div>
                <div style={{ fontSize: 8, color: T.mu }}>Click to analyze grant spending trends and top recipients in {P?.loc?.state || "your state"}</div>
              </div>
              <div style={{ fontSize: 9, color: T.bl }}>Analyze →</div>
            </div>
          </Cd>
        )}

        {/* CENSUS NARRATIVE — Auto-generated Statement of Need */}
        {censusData && (
          <Cd sx={{ marginBottom: 6, borderLeft: `3px solid ${T.pu}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.pu }}>📝 Auto-Generated Statement of Need</div>
                <div style={{ fontSize: 8, color: T.mu }}>AI-composed narrative from live Census data — ready to paste into grant applications.</div>
              </div>
              <Btn small onClick={() => { const n = generateCensusNarrative(censusData, censusData.name); setCensusNarrative(n); navigator.clipboard.writeText(n); showToast("📋 Narrative copied to clipboard!", "success"); }}>📋 Copy</Btn>
            </div>
            <div style={{ fontSize: 8, color: T.sb, lineHeight: 1.5, padding: "6px 8px", background: T.bg, borderRadius: 4, border: `1px solid ${T.pu}15` }}>
              {censusNarrative || generateCensusNarrative(censusData, censusData.name)}
            </div>
            <div style={{ fontSize: 7, color: T.dm, marginTop: 3 }}>Source: U.S. Census Bureau ACS 5-Year Estimates (2022) · Auto-generated · Edit as needed</div>
          </Cd>
        )}

        {/* CFDA PROGRAM INTELLIGENCE — which federal programs fund your area */}
        {cfdaPrograms && cfdaPrograms.length > 0 && (
          <Cd sx={{ marginBottom: 6, borderLeft: `3px solid ${T.bl}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.bl, marginBottom: 4 }}>📋 Federal Assistance Programs</div>
            <div style={{ fontSize: 8, color: T.mu, marginBottom: 6 }}>Active CFDA/Assistance Listing programs funding your state and keywords. These are the programs behind the grants — target your applications accordingly.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {cfdaPrograms.slice(0, 10).map((p, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 8px", background: T.bg, borderRadius: 4 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 8, fontWeight: 700, color: T.tx }}>{p.code} — {p.name}</div>
                  </div>
                  <div style={{ fontWeight: 800, color: T.bl, fontSize: 9, fontFamily: "var(--d)", whiteSpace: "nowrap", marginLeft: 8 }}>
                    ${p.amount >= 1e9 ? (p.amount / 1e9).toFixed(1) + "B" : p.amount >= 1e6 ? (p.amount / 1e6).toFixed(0) + "M" : (p.amount / 1e3).toFixed(0) + "K"}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 7, color: T.dm, marginTop: 3 }}>Source: USAspending CFDA API · FY2024 · {cfdaPrograms.length} programs</div>
          </Cd>
        )}
        {!cfdaPrograms && !loading && (
          <Cd sx={{ marginBottom: 6, cursor: "pointer" }} onClick={loadCFDAIntel}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.bl }}>📋 Federal Assistance Programs</div>
                <div style={{ fontSize: 8, color: T.mu }}>Click to discover which CFDA programs fund your state and keywords</div>
              </div>
              <div style={{ fontSize: 9, color: T.bl }}>Discover →</div>
            </div>
          </Cd>
        )}

        {/* COUNTY SPENDING + LOCAL AWARDS — hyper-local intelligence */}
        {(countySpending || localAwards) && (
          <Cd sx={{ marginBottom: 6, borderLeft: `3px solid ${T.am}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.am, marginBottom: 4 }}>📍 Hyper-Local Grant Intelligence</div>
            <div style={{ fontSize: 8, color: T.mu, marginBottom: 6 }}>Grant funding flowing to counties in {P?.loc?.state || "your state"}, plus actual awards in your area.</div>
            {countySpending && countySpending.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: T.tx, marginBottom: 4 }}>County Grant Rankings (FY2024)</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                  {countySpending.slice(0, 8).map((c, i) => {
                    const isLocal = P?.loc?.county && c.code === P.loc.county;
                    return (
                      <div key={i} style={{ padding: "3px 6px", background: isLocal ? T.am + "20" : T.bg, border: `1px solid ${isLocal ? T.am : T.br}30`, borderRadius: 4, fontSize: 7 }}>
                        <span style={{ fontWeight: isLocal ? 800 : 600, color: isLocal ? T.am : T.sb }}>{c.name}</span>
                        <span style={{ fontWeight: 800, color: T.am, fontFamily: "var(--d)", marginLeft: 4 }}>${c.amount >= 1e9 ? (c.amount / 1e9).toFixed(1) + "B" : (c.amount / 1e6).toFixed(0) + "M"}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {localAwards && localAwards.length > 0 && (
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: T.tx, marginBottom: 4 }}>Recent Awards in Your County</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {localAwards.slice(0, 6).map((a, i) => (
                    <div key={i} style={{ padding: "4px 8px", background: T.bg, borderRadius: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 8, fontWeight: 700, color: T.tx }}>{a.recipient}</div>
                        <div style={{ fontSize: 7, color: T.mu }}>{a.agency} · {a.date?.split("T")[0]} · {(a.description || "").slice(0, 60)}</div>
                      </div>
                      <div style={{ fontWeight: 800, color: T.gn, fontSize: 9, fontFamily: "var(--d)", whiteSpace: "nowrap", marginLeft: 6 }}>
                        ${a.amount >= 1e6 ? (a.amount / 1e6).toFixed(1) + "M" : a.amount >= 1e3 ? Math.round(a.amount / 1e3).toLocaleString() + "K" : a.amount?.toLocaleString() || "0"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ fontSize: 7, color: T.dm, marginTop: 3 }}>Source: USAspending.gov · County spending + local awards · FY2022-2024</div>
          </Cd>
        )}
        {!countySpending && !localAwards && !loading && (
          <Cd sx={{ marginBottom: 6, cursor: "pointer" }} onClick={() => { loadCountySpending(); loadLocalAwards(); }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.am }}>📍 Hyper-Local Intelligence</div>
                <div style={{ fontSize: 8, color: T.mu }}>Click to see grant funding by county and actual awards near you</div>
              </div>
              <div style={{ fontSize: 9, color: T.bl }}>Explore →</div>
            </div>
          </Cd>
        )}

        {/* SIMPLER.GRANTS.GOV — Enhanced search (if API key configured) */}
        {simplerResults && simplerResults.available && simplerResults.results?.length > 0 && (
          <Cd sx={{ marginBottom: 6, borderLeft: `3px solid ${T.gn}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.gn, marginBottom: 4 }}>🏛️ Simpler.Grants.gov — Enhanced Results</div>
            <div style={{ fontSize: 8, color: T.mu, marginBottom: 6 }}>Richer grant data from the new Simpler.Grants.gov API — faceted search with status, category, and funding instrument details.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {simplerResults.results.slice(0, 8).map((r, i) => (
                <div key={i} style={{ padding: "5px 8px", background: T.bg, borderRadius: 5, border: `1px solid ${T.gn}10` }}>
                  <div style={{ fontSize: 8, fontWeight: 700, color: T.tx }}>{r.title}</div>
                  <div style={{ fontSize: 7, color: T.mu, marginTop: 1 }}>
                    {r.agency} · {r.number} · {r.status} · {r.category}
                    {r.closeDate && ` · Closes: ${r.closeDate.split("T")[0]}`}
                  </div>
                  {r.summary && <div style={{ fontSize: 7, color: T.dm, marginTop: 2 }}>{r.summary.slice(0, 120)}...</div>}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 7, color: T.dm, marginTop: 3 }}>Source: Simpler.Grants.gov API · {simplerResults.results.length} results</div>
          </Cd>
        )}
        {simplerResults && !simplerResults.available && (
          <Cd sx={{ marginBottom: 6, opacity: 0.6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.dm }}>🏛️ Simpler.Grants.gov</div>
                <div style={{ fontSize: 8, color: T.dm }}>Add API key in Profile → API Keys to unlock enhanced search · Free via Login.gov</div>
              </div>
              <B c={T.dm}>🔑 Key Required</B>
            </div>
          </Cd>
        )}

        {/* SAM.GOV — Entity registration verification (if API key configured) */}
        {samVerification && samVerification.available !== false && (
          <Cd sx={{ marginBottom: 6, borderLeft: `3px solid ${samVerification.active ? T.gn : samVerification.warning ? T.yl : T.rd}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.gn, marginBottom: 4 }}>📋 SAM.gov Registration Status</div>
            {samVerification.verified && samVerification.entity && (
              <div style={{ padding: "6px 8px", background: T.bg, borderRadius: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: T.tx }}>{samVerification.entity.legalName}</div>
                  <B c={samVerification.active ? T.gn : T.rd}>{samVerification.active ? "✓ Active" : "✗ Inactive"}</B>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, fontSize: 7 }}>
                  <span style={{ color: T.mu }}>UEI: {samVerification.entity.uei}</span>
                  {samVerification.entity.cage && <span style={{ color: T.mu }}>CAGE: {samVerification.entity.cage}</span>}
                  {samVerification.entity.entityType && <span style={{ color: T.mu }}>Type: {samVerification.entity.entityType}</span>}
                  {samVerification.entity.expiration && <span style={{ color: samVerification.daysUntilExpiry < 60 ? T.or : T.mu }}>Expires: {samVerification.entity.expiration.split("T")[0]}{samVerification.daysUntilExpiry !== null ? ` (${samVerification.daysUntilExpiry}d)` : ""}</span>}
                </div>
                {samVerification.warning && <div style={{ fontSize: 8, color: T.or, fontWeight: 700, marginTop: 4 }}>⚠ {samVerification.warning}</div>}
              </div>
            )}
            {samVerification.searchMode && samVerification.results?.length > 0 && (
              <div>
                <div style={{ fontSize: 8, color: T.mu, marginBottom: 4 }}>No UEI in profile. Found these entities matching your org name:</div>
                {samVerification.results.slice(0, 4).map((e, i) => (
                  <div key={i} style={{ padding: "4px 8px", background: T.bg, borderRadius: 4, marginBottom: 2, display: "flex", justifyContent: "space-between", fontSize: 8 }}>
                    <span style={{ color: T.tx, fontWeight: 600 }}>{e.legalName}</span>
                    <span style={{ color: T.mu }}>UEI: {e.uei} · {e.city}, {e.state}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ fontSize: 7, color: T.dm, marginTop: 3 }}>Source: SAM.gov Entity Management API v3</div>
          </Cd>
        )}
        {samVerification && samVerification.available === false && (
          <Cd sx={{ marginBottom: 6, opacity: 0.6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.dm }}>📋 SAM.gov Registration Check</div>
                <div style={{ fontSize: 8, color: T.dm }}>Add API key in Profile → API Keys to verify your SAM registration, UEI, and CAGE code · Free</div>
              </div>
              <B c={T.dm}>🔑 Key Required</B>
            </div>
          </Cd>
        )}

        {error && <div style={{ padding: 6, background: T.rd + "14", border: `1px solid ${T.rd}30`, borderRadius: 3, fontSize: 9, color: T.rd, marginBottom: 6 }}>{error}</div>}
        {feed.length > 0 && (
          <div style={{ display: "flex", gap: 4, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
            <Pl active={filter} onSelect={setFilter} items={[{ k: "all", l: `All (${allResults.length})` }, ...Object.entries(CAT).map(([k, v]) => ({ k, l: `${v.i}${allResults.filter(f => f.cat === k).length}`, c: v.c }))]} />
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ ...inpS, padding: "2px 5px", fontSize: 8, width: "auto" }}>
              <option value="fit">Sort: Best Fit</option>
              <option value="date">Sort: Deadline</option>
              <option value="source">Sort: Agency</option>
            </select>
            <select value={minFit} onChange={e => setMinFit(parseInt(e.target.value))} style={{ ...inpS, padding: "2px 5px", fontSize: 8, width: "auto" }}>
              <option value={0}>Min Fit: Any</option>
              <option value={40}>Min Fit: 40%+</option>
              <option value={55}>Min Fit: 55%+</option>
              <option value={70}>Min Fit: 70%+</option>
            </select>
            <label style={{ fontSize: 8, color: T.mu, display: "flex", alignItems: "center", gap: 2, cursor: "pointer" }}>
              <input type="checkbox" checked={showForecasted} onChange={e => setShowForecasted(e.target.checked)} style={{ width: 10, height: 10 }} />
              Show Forecasted ({totalForecasted})
            </label>
            {highFit > 0 && <Btn small onClick={() => bulkAdd(70)}>⚡ Bulk Add {feed.filter(f => f.fit >= 70 && !added[f.id]).length} High-Fit</Btn>}
          </div>
        )}

        {feed.length === 0 && !loading && !scanProgress && (
          <Cd sx={{ marginTop: 8, textAlign: "center", padding: 20 }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>📡</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.tx }}>Click "Full Scan" to search Grants.gov</div>
            <div style={{ fontSize: 9, color: T.mu, marginTop: 3 }}>7-phase intelligence pipeline across 15 live APIs: Grants.gov, USAspending (awards, agencies, recipients, trends, CFDA programs, county spending, local awards), SBIR, Federal Register, Census ACS + narrative generation, ProPublica nonprofits, FAC single audit, and Regulations.gov policy monitoring.</div>
            <div style={{ fontSize: 8, color: T.dm, marginTop: 4 }}>
              Live APIs: <span style={{ color: T.bl }}>Grants.gov</span> · <span style={{ color: T.gn }}>USAspending</span> · <span style={{ color: T.cy }}>SBIR.gov</span> · <span style={{ color: T.am }}>Federal Register</span> · <span style={{ color: T.pu }}>Census ACS</span> · <span style={{ color: T.gn }}>ProPublica</span> · <span style={{ color: T.yl }}>FAC.gov</span> · No auth required
            </div>
          </Cd>
        )}

        {/* RESULTS */}
        <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 3 }}>
          {sorted.map(f => {
            const cat = CAT[f.cat] || CAT.business;
            const isAdded = added[f.id];
            return (
              <Cd key={f.id} bc={f.fit >= 70 ? T.gn + "25" : f.isForecasted ? T.pu + "20" : undefined}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 2, marginBottom: 2, flexWrap: "wrap" }}>
                      <B c={cat.c}>{cat.i}{cat.l}</B>
                      {f.isForecasted ? <B c={T.pu}>🔮 UPCOMING</B> : <B c={T.bl}>LIVE</B>}
                      {f.fit >= 70 && <B c={T.gn}>★ MATCH</B>}
                      {isAdded && <B c={T.cy}>✓ ADDED</B>}
                      {f.searchTerm && <B c={T.dm}>{f.searchTerm}</B>}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.tx }}>{f.name}</div>
                    <div style={{ fontSize: 8, color: T.mu }}>{f.source}</div>
                    <div style={{ display: "flex", gap: 6, marginTop: 3, fontSize: 8, color: T.sb }}>
                      {f.oppNum && <span>#{f.oppNum}</span>}
                      {f.cfda && <span>CFDA: {f.cfda.substring(0, 20)}</span>}
                      <span>Open: {f.openDate || "TBD"}</span>
                      <span>Close: {f.closeDate || "Rolling"}</span>
                    </div>
                    {f.matches.length > 0 && (
                      <div style={{ marginTop: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
                        {f.matches.map((m, i) => <span key={i} style={{ fontSize: 7, padding: "1px 3px", background: T.gn + "14", borderRadius: 2, color: T.gn }}>✓{m.cat}</span>)}
                        {f.gaps.map((g, i) => <span key={`g${i}`} style={{ fontSize: 7, padding: "1px 3px", background: T.rd + "14", borderRadius: 2, color: T.rd }}>⚠{g.cat}</span>)}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0, display: "flex", flexDirection: "column", gap: 3, alignItems: "flex-end" }}>
                    <Fb v={f.fit} />
                    <a href={f.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 8, color: T.bl }}>View →</a>
                    <Btn small primary={!isAdded} disabled={isAdded} onClick={() => addToP(f)}>
                      {isAdded ? "✓ Added" : "+ Pipeline"}
                    </Btn>
                  </div>
                </div>
              </Cd>
            );
          })}
        </div>
        {onNav && feed.length > 0 && (
          <div style={{ marginTop: 8, padding: "8px 10px", background: T.pn, borderRadius: 4, border: `1px solid ${T.bd}` }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: T.am, marginBottom: 4 }}>🔀 Continue Your Research</div>
            <div style={{ display: "flex", gap: 6, fontSize: 8, flexWrap: "wrap" }}>
              <span style={{ color: T.bl, cursor: "pointer" }} onClick={() => onNav("awards")}>🏆 Federal award data →</span>
              <span style={{ color: T.pu, cursor: "pointer" }} onClick={() => onNav("funder")}>🔎 Research funders →</span>
              <span style={{ color: T.cy, cursor: "pointer" }} onClick={() => onNav("match")}>🔍 Score a specific grant →</span>
              <span style={{ color: T.gn, cursor: "pointer" }} onClick={() => onNav("census")}>🏘️ Community data for narratives →</span>
              <span style={{ color: T.or, cursor: "pointer" }} onClick={() => onNav("pipe")}>🎯 Manage pipeline →</span>
            </div>
          </div>
        )}
      </Hd>
      
      {/* AI Document Gap Analysis */}
      <DocGapAnalysis grants={grants || []} docs={docs} />
    </div>
  );
}


// ══════ 13. FINANCIAL MODELER ══════
function FinModel({ G, onNav }) {
  // Auto-pull pipeline amounts
  const pa = s => { const m = (s||"").match(/[\d,]+/g); return m ? Math.max(...m.map(n => parseInt(n.replace(/,/g, "")))) : 0; };
  const pipelineGrants = G.filter(g => ["preparing","drafting","review","submitted","pending","awarded","active"].includes(g.stage));
  const autoVR = G.find(g => g.name.includes("VR Self-Employment") && !["rejected","completed","identified"].includes(g.stage));
  const autoDCEO = G.find(g => g.name.includes("DCEO") && g.name.includes("Capital") && !["rejected","completed","identified"].includes(g.stage));
  const autoUSDA = G.find(g => g.name.includes("USDA") && g.name.includes("RBDG") && !["rejected","completed","identified"].includes(g.stage));
  
  const [vars, setVars] = useState({
    hosting: P?.expenses?.hosting || 0, domains: P?.expenses?.domains || 0, subs: P?.expenses?.subs || 0,
    rev: 0, grantVR: autoVR ? pa(autoVR.amount) : 0, grantDCEO: autoDCEO ? pa(autoDCEO.amount) : 0, grantUSDA: autoUSDA ? pa(autoUSDA.amount) : 0, grantOther: 0,
  });
  const v = (k, val) => setVars(p => ({ ...p, [k]: parseFloat(val) || 0 }));

  const mExp = vars.hosting + vars.domains + vars.subs + 60;
  const mInc = Object.values(P?.income || {}).reduce((a, v) => a + (v || 0), 0) + vars.rev;
  const mNet = mInc - mExp;
  const grants = vars.grantVR + vars.grantDCEO + vars.grantUSDA + vars.grantOther;
  const runway = grants > 0 ? Math.round(grants / Math.max(1, mExp)) : 0;
  const annualNet = (mNet * 12) + grants;

  const baseIncome = Object.values(P?.income || {}).reduce((a, v) => a + (v || 0), 0);
  const months = Array.from({ length: 12 }, (_, i) => {
    const grantPerMo = grants / 12;
    const revGrowth = vars.rev * (1 + i * 0.1);
    const inc = baseIncome + revGrowth + grantPerMo;
    const exp = mExp;
    return { mo: i + 1, inc: Math.round(inc), exp, net: Math.round(inc - exp) };
  });

  const sl = { ...inpS, width: "100%", textAlign: "right" };

  return (
    <div style={{ animation: "fi .3s ease" }}>
      <Hd i="📈" t="Financial Modeler" s="Adjust variables, see cascading impact">
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 10 }}>
          <Cd>
            <div style={{ fontSize: 11, fontWeight: 800, color: T.am, marginBottom: 8, fontFamily: "var(--d)" }}>⚙️ Variables</div>
            <div style={{ fontSize: 8, color: T.cy, textTransform: "uppercase", fontWeight: 700, marginBottom: 3 }}>Monthly Expenses</div>
            {[["hosting", "Hosting"], ["domains", "Domains"], ["subs", "Subscriptions"]].map(([k, l]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                <span style={{ fontSize: 9, color: T.tx }}>{l}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 2 }}><span style={{ fontSize: 8, color: T.mu }}>$</span><input value={vars[k]} onChange={e => v(k, e.target.value)} style={{ ...sl, width: 50 }} /></div>
              </div>
            ))}
            <div style={{ fontSize: 8, color: T.cy, textTransform: "uppercase", fontWeight: 700, marginTop: 8, marginBottom: 3 }}>Monthly Revenue</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
              <span style={{ fontSize: 9, color: T.tx }}>Platform Revenue</span>
              <div style={{ display: "flex", alignItems: "center", gap: 2 }}><span style={{ fontSize: 8, color: T.mu }}>$</span><input value={vars.rev} onChange={e => v("rev", e.target.value)} style={{ ...sl, width: 50 }} /></div>
            </div>
            <div style={{ fontSize: 8, color: T.cy, textTransform: "uppercase", fontWeight: 700, marginTop: 8, marginBottom: 3 }}>Grant Funding</div>
            {[["grantVR", "VR Self-Employment"], ["grantDCEO", "DCEO Capital"], ["grantUSDA", "USDA RBDG"], ["grantOther", "Other Grants"]].map(([k, l]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                <span style={{ fontSize: 9, color: T.tx }}>{l}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 2 }}><span style={{ fontSize: 8, color: T.mu }}>$</span><input value={vars[k]} onChange={e => v(k, e.target.value)} style={{ ...sl, width: 60 }} /></div>
              </div>
            ))}
          </Cd>
          <div>
            <SG items={[
              { l: "Monthly Net", v: (mNet >= 0 ? "+" : "") + "$" + mNet, c: mNet >= 0 ? T.gn : T.rd },
              { l: "Annual Net", v: (annualNet >= 0 ? "+" : "") + "$" + annualNet.toLocaleString(), c: annualNet >= 0 ? T.gn : T.rd },
              { l: "Grant Total", v: "$" + grants.toLocaleString(), c: T.cy },
              { l: "Runway", v: runway + " mo", c: T.yl },
            ]} />
            <Cd sx={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: T.am, marginBottom: 6, fontFamily: "var(--d)" }}>📊 12-Month Projection</div>
              <div style={{ display: "flex", gap: 1, alignItems: "flex-end", height: 100, padding: "0 4px" }}>
                {months.map(m => {
                  const maxV = Math.max(...months.map(x => Math.abs(x.net)), 1);
                  const h = Math.abs(m.net) / maxV * 80;
                  return (
                    <div key={m.mo} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end" }}>
                      <div style={{ width: "100%", height: h, background: m.net >= 0 ? T.gn + "60" : T.rd + "60", borderRadius: "2px 2px 0 0", minHeight: 2 }}></div>
                      <div style={{ fontSize: 6, color: T.mu, marginTop: 2 }}>M{m.mo}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <span style={{ fontSize: 8, color: T.gn }}>■ Positive</span>
                <span style={{ fontSize: 8, color: T.rd }}>■ Negative</span>
              </div>
            </Cd>
            <Cd>
              <div style={{ fontSize: 11, fontWeight: 800, color: T.gn, marginBottom: 4, fontFamily: "var(--d)" }}>🎯 Analysis</div>
              <div style={{ fontSize: 10, color: T.sb, lineHeight: 1.6 }}>
                {mNet < 0 && grants === 0 && <div style={{ color: T.rd, marginBottom: 4 }}>⚠ Operating at ${Math.abs(mNet)}/mo deficit. Grant funding or revenue needed to sustain operations.</div>}
                {mNet < 0 && grants > 0 && <div style={{ color: T.yl, marginBottom: 4 }}>Grant funding provides {runway}-month runway. Revenue growth to ${Math.abs(mNet)}/mo needed for sustainability.</div>}
                {mNet >= 0 && <div style={{ color: T.gn, marginBottom: 4 }}>✓ Positive monthly cash flow of ${mNet}. Sustainable without additional funding.</div>}
                {grants > 0 && <div>Grant funding of ${grants.toLocaleString()} enables: {grants >= 50000 ? "full business development, hiring, expansion" : grants >= 15000 ? "infrastructure + professional services + marketing" : grants >= 5000 ? "core infrastructure and initial launch" : "supplemental support"}.</div>}
              </div>
            </Cd>
          </div>
        </div>
      </Hd>
    </div>
  );
}

// ══════ 14. COMPLIANCE ENGINE ══════
function Compliance({ G, sG, onNav }) {
  const awarded = G.filter(g => ["awarded", "active", "closeout"].includes(g.stage));
  const [sel, setSel] = useState(null);
  const [ne, setNe] = useState({ d: "", a: "" });
  const [nr, setNr] = useState({ t: "", du: "" });

  const addE = (gid) => {
    if (!ne.d || !ne.a) return;
    sG(p => p.map(g => g.id === gid ? { ...g, expenses: [...g.expenses, { id: Date.now(), desc: ne.d, amount: parseFloat(ne.a), cat: "general", date: new Date().toISOString().split("T")[0] }] } : g));
    setNe({ d: "", a: "" });
  };
  const addR = (gid) => {
    if (!nr.t) return;
    sG(p => p.map(g => g.id === gid ? { ...g, reports: [...g.reports, { id: Date.now(), title: nr.t, due: nr.du, status: "pending" }] } : g));
    setNr({ t: "", du: "" });
  };
  const togR = (gid, rid) => sG(p => p.map(g => {
    if (g.id !== gid) return g;
    return { ...g, reports: g.reports.map(r => r.id === rid ? { ...r, status: r.status === "done" ? "pending" : "done" } : r) };
  }));

  const autoCompliance = [
    { title: "Quarterly Progress Report", freq: "Every 90 days", type: "progress" },
    { title: "Quarterly Financial Report", freq: "Every 90 days", type: "financial" },
    { title: "Annual Performance Report", freq: "Annually", type: "annual" },
    { title: "Final Closeout Report", freq: "90 days post-end", type: "closeout" },
    { title: "Equipment Inventory", freq: "As acquired", type: "inventory" },
  ];

  if (awarded.length === 0) {
    return (
      <div style={{ animation: "fi .3s ease" }}>
        <Hd i="✅" t="Compliance Engine" s="Award tracking, reporting, and expense management">
          <Cd>
            <div style={{ textAlign: "center", padding: 30, color: T.mu }}>
              <div style={{ fontSize: 32, marginBottom: 6 }}>✅</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.tx }}>Ready for Awards</div>
              <div style={{ fontSize: 10, marginTop: 4 }}>When grants are moved to "Awarded" in the Pipeline, compliance tracking, expense management, and reporting schedules will appear here automatically.</div>
              <div style={{ marginTop: 10, padding: 8, background: T.bg, borderRadius: 4, border: `1px solid ${T.bd}`, textAlign: "left" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: T.am, marginBottom: 4 }}>Auto-generated compliance includes:</div>
                {autoCompliance.map(c => (<div key={c.title} style={{ fontSize: 9, color: T.sb, padding: "2px 0" }}>📋 {c.title} — {c.freq}</div>))}
              </div>
            </div>
          </Cd>
        </Hd>
      </div>
    );
  }

  const g = awarded.find(x => x.id === (sel || awarded[0].id)) || awarded[0];
  const tE = g.expenses.reduce((a, e) => a + e.amount, 0);

  return (
    <div style={{ animation: "fi .3s ease" }}>
      <Hd i="✅" t="Compliance Engine" s="Award tracking and reporting">
        <div style={{ display: "flex", gap: 2, marginBottom: 8, flexWrap: "wrap" }}>
          {awarded.map(a => (<button key={a.id} onClick={() => setSel(a.id)} style={{ padding: "3px 8px", borderRadius: 3, fontSize: 9, fontWeight: 700, cursor: "pointer", border: (sel || awarded[0].id) === a.id ? `1px solid ${T.gn}` : `1px solid ${T.bd}`, background: (sel || awarded[0].id) === a.id ? T.gn + "16" : "transparent", color: (sel || awarded[0].id) === a.id ? T.gn : T.mu }}>{a.name}</button>))}
          <Btn small primary onClick={() => onNav("reports")}>📝 Generate Report →</Btn>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <Cd>
            <div style={{ fontSize: 11, fontWeight: 800, color: T.am, marginBottom: 5, fontFamily: "var(--d)" }}>💰 Expenses</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: T.gn, fontFamily: "var(--m)", marginBottom: 5 }}>${tE.toLocaleString()}</div>
            {g.expenses.map(e => (<div key={e.id} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", borderBottom: `1px solid ${T.bd}`, fontSize: 9 }}><span>{e.desc}</span><span style={{ color: T.gn, fontFamily: "var(--m)" }}>${e.amount}</span></div>))}
            <div style={{ marginTop: 5, display: "flex", gap: 2 }}>
              <input placeholder="Description" value={ne.d} onChange={e => setNe({ ...ne, d: e.target.value })} style={{ ...inpS, flex: 1 }} />
              <input placeholder="$" value={ne.a} onChange={e => setNe({ ...ne, a: e.target.value })} style={{ ...inpS, width: 45 }} />
              <Btn small primary onClick={() => addE(g.id)}>+</Btn>
            </div>
          </Cd>
          <Cd>
            <div style={{ fontSize: 11, fontWeight: 800, color: T.am, marginBottom: 5, fontFamily: "var(--d)" }}>📋 Reports & Compliance</div>
            {g.reports.map(r => (<Ck key={r.id} ck={r.status === "done"} oc={() => togR(g.id, r.id)} lb={r.title} su={r.due ? `Due: ${r.due}` : null} />))}
            {g.reports.length === 0 && (<div style={{ fontSize: 9, color: T.mu, marginBottom: 4 }}>
              <div style={{ marginBottom: 3 }}>Standard requirements:</div>
              {autoCompliance.map(c => (<div key={c.title} style={{ padding: "1px 0", color: T.dm }}>· {c.title}</div>))}
            </div>)}
            <div style={{ marginTop: 5, display: "flex", gap: 2 }}>
              <input placeholder="Report title" value={nr.t} onChange={e => setNr({ ...nr, t: e.target.value })} style={{ ...inpS, flex: 1 }} />
              <input placeholder="Due" value={nr.du} onChange={e => setNr({ ...nr, du: e.target.value })} style={{ ...inpS, width: 60 }} />
              <Btn small primary onClick={() => addR(g.id)}>+</Btn>
            </div>
          </Cd>
        </div>
      </Hd>
    </div>
  );
}

// ══════ 15. AI PROPOSAL DRAFTER — Closes CRITICAL gap vs Instrumentl ══════
function AIDrafter({ G, intel, onNav }) {
  const [grant, setGrant] = useState("");
  const [section, setSection] = useState("problem");
  const [rfpText, setRfpText] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [autoLoadIntel, setAutoLoadIntel] = useState(false);

  const sections = [
    { k: "problem", l: "Problem Statement", prompt: "Write a compelling Problem Statement section", intelPriority: ["census", "local", "spending", "county"] },
    { k: "program", l: "Program Description", prompt: "Write a detailed Program Description section", intelPriority: ["cfda", "sbir", "awards", "regs"] },
    { k: "impact", l: "Impact & Outcomes", prompt: "Write an Impact and Expected Outcomes section", intelPriority: ["census", "spending", "county", "local"] },
    { k: "budget_narr", l: "Budget Narrative", prompt: "Write a Budget Narrative justifying expenses", intelPriority: ["cfda", "awards", "topRecipients", "spending"] },
    { k: "capability", l: "Organizational Capability", prompt: "Write an Organizational Capability and Qualifications section", intelPriority: ["awards", "sbir", "funder", "fac"] },
    { k: "sustainability", l: "Sustainability Plan", prompt: "Write a Sustainability Plan section", intelPriority: ["spending", "cfda", "topRecipients", "funder"] },
    { k: "need", l: "Statement of Need", prompt: "Write a Statement of Need section with specific demographic data and citations", intelPriority: ["census", "county", "local", "spending"] },
    { k: "goals", l: "Goals & Objectives", prompt: "Write a Goals and Objectives section with measurable outcomes", intelPriority: ["census", "cfda", "local", "awards"] },
    { k: "eval", l: "Evaluation Plan", prompt: "Write an Evaluation Plan section", intelPriority: ["cfda", "fac", "awards", "funder"] },
    { k: "abstract", l: "Executive Summary/Abstract", prompt: "Write a concise Executive Summary / Project Abstract", intelPriority: ["census", "cfda", "awards", "local"] },
    { k: "letter", l: "Letter of Support Template", prompt: "Write a Letter of Support template that a community partner could sign", intelPriority: ["census", "funder", "local", "county"] },
    { k: "logic_model", l: "Logic Model Narrative", prompt: "Write a Logic Model narrative (inputs, activities, outputs, short-term outcomes, long-term impact)", intelPriority: ["census", "cfda", "awards", "spending"] },
  ];

  const selSec = sections.find(s => s.k === section);
  const selGrant = G.find(g => g.id === grant);

  // Build section-specific intelligence emphasis
  const buildSectionIntel = () => {
    if (!intel) return "";
    const priority = selSec?.intelPriority || [];
    const parts = [];
    
    // Always include Census if available — it's universally useful
    if (intel.censusData) {
      const c = intel.censusData;
      const isTopPriority = priority.includes("census");
      parts.push(`${isTopPriority ? "⭐ PRIMARY DATA SOURCE — " : ""}COMMUNITY DATA (U.S. Census ACS 2022 — ${c.name || "County"}):
Population: ${(c.totalPop || 0).toLocaleString()} | Median Income: $${(c.medianIncome || 0).toLocaleString()} | Poverty: ${c.povertyPct}% | Disability: ${c.disabilityPct}% | Unemployment: ${c.unemploymentPct || "N/A"}% | Bachelor's+: ${c.bachelorsPct || "N/A"}% | Broadband: ${c.broadbandPct || "N/A"}% | HS Grad: ${c.hsGradPct || "N/A"}% | Median Home: $${(c.medianHomeValue || 0).toLocaleString()} | Hispanic: ${c.hispanicPct || "N/A"}% | White: ${c.whitePct || "N/A"}% | Black: ${c.blackPct || "N/A"}% | Labor Force: ${c.laborForcePct || "N/A"}%
Source: U.S. Census Bureau, ACS 5-Year Estimates (2022).${isTopPriority ? "\nINSTRUCTION: This section MUST lead with and extensively reference this Census data. Cite specific statistics with source attribution." : ""}`);
    }

    // CFDA Programs — emphasize for Budget Narrative, Program Description
    if (intel.cfdaPrograms?.length > 0) {
      const isTop = priority.includes("cfda");
      parts.push(`${isTop ? "⭐ PRIMARY — " : ""}FEDERAL ASSISTANCE PROGRAMS (CFDA):
${intel.cfdaPrograms.slice(0, isTop ? 10 : 5).map(p => `• ${p.code} — ${p.name}: $${p.amount >= 1e9 ? (p.amount / 1e9).toFixed(1) + "B" : (p.amount / 1e6).toFixed(0) + "M"}`).join("\n")}
Source: USAspending.gov.${isTop ? "\nINSTRUCTION: Reference specific program numbers and funding levels to justify your budget and demonstrate alignment with federal priorities." : ""}`);
    }

    // Local Awards — emphasize for Need, Impact
    if (intel.localAwards?.length > 0) {
      const isTop = priority.includes("local");
      parts.push(`${isTop ? "⭐ PRIMARY — " : ""}LOCAL GRANT AWARDS IN COUNTY:
${intel.localAwards.slice(0, isTop ? 8 : 4).map(a => `• ${a.recipient}: $${(a.amount || 0).toLocaleString()} from ${a.agency} — ${(a.description || "").slice(0, 80)} (${a.date?.split("T")[0]})`).join("\n")}
Source: USAspending.gov.${isTop ? "\nINSTRUCTION: Use these to show the existing federal investment footprint and how your project complements or extends current funding." : ""}`);
    }

    // Award Intelligence — emphasize for Capability, Competition
    if (intel.awardIntel?.length > 0) {
      const isTop = priority.includes("awards");
      parts.push(`${isTop ? "⭐ PRIMARY — " : ""}COMPETITIVE AWARD LANDSCAPE:
${intel.awardIntel.slice(0, isTop ? 6 : 3).map(a => `• ${a.recipient}: $${(a.amount || 0).toLocaleString()} — ${a.agency}`).join("\n")}
Source: USAspending.gov.${isTop ? "\nINSTRUCTION: Use competitive context to position the applicant — show awareness of the funding landscape and how this project fills a gap." : ""}`);
    }

    // Spending Trends — emphasize for Sustainability, Budget
    if (intel.spendTrends?.length > 0) {
      const isTop = priority.includes("spending");
      parts.push(`${isTop ? "⭐ PRIMARY — " : ""}GRANT FUNDING TRENDS (${intel.state || "IL"}):
${intel.spendTrends.map(t => `FY${t.year}: $${(t.amount / 1e9).toFixed(1)}B`).join(" | ")}
Source: USAspending.gov.${isTop ? "\nINSTRUCTION: Use funding trend data to demonstrate growing/changing federal investment and justify why now is the right time for this project." : ""}`);
    }

    // County Spending
    if (intel.countySpending?.length > 0 && priority.includes("county")) {
      parts.push(`⭐ PRIMARY — COUNTY GRANT RANKINGS:
${intel.countySpending.slice(0, 6).map((c, i) => `${i + 1}. ${c.name}: $${c.amount >= 1e9 ? (c.amount / 1e9).toFixed(1) + "B" : (c.amount / 1e6).toFixed(0) + "M"}`).join("\n")}
INSTRUCTION: Use county data to contextualize the geographic need — show whether the applicant's county is underserved relative to other counties.`);
    }

    // Top Recipients
    if (intel.topRecipients?.length > 0 && priority.includes("topRecipients")) {
      parts.push(`TOP GRANT RECIPIENTS (FY2024):
${intel.topRecipients.slice(0, 5).map((r, i) => `${i + 1}. ${r.name}: $${r.amount >= 1e9 ? (r.amount / 1e9).toFixed(1) + "B" : (r.amount / 1e6).toFixed(0) + "M"}`).join("\n")}`);
    }

    // SBIR Intel — emphasize for Capability, Program Description
    if (intel.sbirIntel?.length > 0) {
      const isTop = priority.includes("sbir");
      parts.push(`${isTop ? "⭐ PRIMARY — " : ""}SBIR/STTR COMPETITIVE LANDSCAPE:
${intel.sbirIntel.slice(0, isTop ? 5 : 3).map(a => `• ${a.firm}: $${(a.amount || 0).toLocaleString()} — ${a.title?.slice(0, 60)} (${a.agency})`).join("\n")}
Source: SBIR.gov.`);
    }

    // Funder/Partner Research
    if (intel.funderIntel?.details?.length > 0 && priority.includes("funder")) {
      parts.push(`NONPROFIT PARTNER/COMPETITOR INTEL (IRS 990):
${intel.funderIntel.details.slice(0, 4).map(d => `• ${d.name} (${d.city}) — Revenue: $${d.revenue >= 1e6 ? (d.revenue / 1e6).toFixed(1) + "M" : (d.revenue || 0).toLocaleString()}`).join("\n")}
Source: ProPublica Nonprofit Explorer.`);
    }

    // FAC Audit — emphasize for Eval, Capability
    if (intel.facIntel?.length > 0 && priority.includes("fac")) {
      parts.push(`COMPLIANCE LANDSCAPE (single audits):
${intel.facIntel.slice(0, 4).map(a => `• ${a.name}: $${a.totalExpended >= 1e6 ? (a.totalExpended / 1e6).toFixed(1) + "M" : a.totalExpended.toLocaleString()} — ${a.auditType}${a.goingConcern === "Y" ? " ⚠ GOING CONCERN" : ""}`).join("\n")}
Source: FAC.gov.`);
    }

    // Fed Register + Regs
    if (intel.fedRegResults?.length > 0) {
      parts.push(`UPCOMING NOFOs (Federal Register, last 30 days):
${intel.fedRegResults.slice(0, 3).map(r => `• ${r.title} — ${r.agencies} (${r.date})`).join("\n")}`);
    }
    if (intel.regsIntel?.length > 0 && priority.includes("regs")) {
      parts.push(`REGULATORY CONTEXT:
${intel.regsIntel.slice(0, 3).map(r => `• ${r.title} — ${r.agency} (${r.posted?.split("T")[0]})`).join("\n")}`);
    }

    if (parts.length === 0) return "";
    return "\n\n══ LIVE INTELLIGENCE DATA — Section-Optimized for: " + (selSec?.l || "General") + " ══\n\n" + parts.join("\n\n");
  };

  // Build general intelligence context (for non-section-specific uses)
  const intelCtx = buildSectionIntel();
  const hasIntel = intelCtx.length > 50;
  const intelSources = [
    intel?.censusData && "Census ACS",
    intel?.awardIntel?.length > 0 && "Award Intel",
    intel?.cfdaPrograms?.length > 0 && "CFDA Programs",
    intel?.localAwards?.length > 0 && "Local Awards",
    intel?.spendTrends?.length > 0 && "Spending Trends",
    intel?.topRecipients?.length > 0 && "Top Recipients",
    intel?.sbirIntel?.length > 0 && "SBIR Intel",
    intel?.funderIntel?.details?.length > 0 && "Funder Research",
    intel?.facIntel?.length > 0 && "FAC Audits",
    intel?.fedRegResults?.length > 0 && "Fed Register",
    intel?.regsIntel?.length > 0 && "Regulations.gov",
    intel?.countySpending?.length > 0 && "County Spending",
  ].filter(Boolean);

  const generate = async () => {
    setLoading(true); setDraft("");
    const grantCtx = selGrant ? `\nGrant: ${selGrant.name}\nSource: ${selGrant.source}\nAmount: ${selGrant.amount}\nNotes: ${selGrant.notes}` : "";
    const rfpCtx = rfpText.trim() ? `\n\nRFP/NOFO REQUIREMENTS:\n${rfpText.trim()}` : "";
    const sysPrompt = `You are an expert grant writer for a disabled entrepreneur. Write professional, data-driven grant proposal sections.

SECTION TYPE: ${selSec.l}

CRITICAL INSTRUCTIONS FOR THIS SECTION:
${section === "need" || section === "problem" ? `- LEAD with Census ACS demographic data. Open with population, then layer poverty rate, disability rate, unemployment.
- Include at least 3 specific statistics with parenthetical citations: (Source: U.S. Census Bureau, ACS 2022)
- Compare local data to national averages when available. If poverty rate > 13.4% national average, say so.
- Reference county-level funding disparities if county spending data is available.
- End by connecting these data points to the specific problem your project solves.` :
section === "capability" ? `- Lead with the applicant's track record and qualifications.
- Reference competitive landscape data — who else is winning grants in this area and how the applicant is differentiated.
- If SBIR/STTR data is available, mention the innovation ecosystem.
- Reference any partner organizations from ProPublica/funder research.
- Use FAC audit data to demonstrate the applicant's compliance awareness.` :
section === "budget_narr" ? `- Reference specific CFDA program funding levels to justify your budget ask (e.g., "Program 10.868 has allocated $120M nationally").
- Use spending trends to show the federal investment trajectory in this area.
- Reference top recipients' award sizes to benchmark your budget against comparable projects.
- Every line item should be justified with a clear deliverable tied to project goals.` :
section === "impact" ? `- Quantify the affected population using Census ACS data.
- Define 3-5 measurable outcomes with specific targets derived from baseline community data.
- Reference local award data to show how your project builds on existing federal investments.
- Include both short-term (1 year) and long-term (3-5 year) impact projections.` :
section === "sustainability" ? `- Reference multi-year funding trends to show ongoing federal commitment to this area.
- Identify 2-3 diversification strategies beyond the initial grant.
- Use CFDA program data to identify continuation funding pathways.
- Mention partner organizations that provide in-kind or match resources.` :
section === "abstract" ? `- Keep under 250 words. Lead with the problem (1 sentence with key statistic).
- State the solution (2-3 sentences). Quantify expected impact. State the ask.
- Include one powerful Census statistic and one funding landscape data point.` :
`- Use SPECIFIC DATA from the intelligence section below. Cite exact statistics.
- Reference real dollar amounts from USAspending when discussing funding landscape.
- Include citations: (Source: U.S. Census Bureau, ACS 2022) or (Source: USAspending.gov).`}

APPLICANT PROFILE:
${P.narr.founder_full}

DISABILITY CONTEXT:
${P.narr.disability}

TECHNOLOGY/INNOVATION:
${P.narr.tech}

IMPACT:
${P.narr.impact_quant}

FINANCIAL SITUATION:
${P.narr.financial}

Businesses: ${P.biz.map(b => `${b.n} — ${b.d}`).join("; ")}
Location: ${P.loc}${grantCtx}${rfpCtx}${intelCtx}

Write in first person where appropriate. Be specific, cite real data from the intelligence section, and be compelling. Output ONLY the section text, no headers or meta-commentary.`;

    try {
      const aiHeaders = { "Content-Type": "application/json" };
      const ak = getAIKey();
      if (ak) { aiHeaders["x-api-key"] = ak; aiHeaders["anthropic-version"] = "2023-06-01"; aiHeaders["anthropic-dangerous-direct-browser-access"] = "true"; }
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: aiHeaders,
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          system: sysPrompt,
          messages: [{ role: "user", content: `${selSec.prompt} for a grant proposal.${selGrant ? ` This is for: ${selGrant.name} (${selGrant.source}).` : ""}${rfpCtx ? " Align to the RFP requirements provided." : ""} Write 2-4 strong paragraphs.` }],
        })
      });
      const data = await response.json();
      const text = data.content?.map(b => b.text || "").join("\n") || "Error: No response";
      setDraft(text);
      setHistory(prev => [{ section: selSec.l, grant: selGrant?.name || "General", text, ts: new Date().toLocaleString() }, ...prev].slice(0, 20));
    } catch (err) {
      setDraft("Error generating draft: " + err.message + (getAIKey() ? "" : "\n\nAdd your Anthropic API key in Profile → Identity to enable AI features."));
    }
    setLoading(false);
  };

  const copyDraft = () => { navigator.clipboard.writeText(draft); };

  return (
    <div style={{ animation: "fi .3s ease" }}>
      <Hd i="✍️" t="AI Proposal Drafter" s="Generate professional grant proposal sections powered by live intelligence data">
        <Cd glass sx={{ marginBottom: 12 }}>
          {hasIntel && (
            <div style={{ marginBottom: 8, padding: "6px 10px", background: T.gn + "08", border: `1px solid ${T.gn}20`, borderRadius: 6 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: T.gn, marginBottom: 2 }}>🧠 Intelligence Active — {intelSources.length} sources optimized for: {selSec?.l || "General"}</div>
              <div style={{ fontSize: 7, color: T.mu, display: "flex", flexWrap: "wrap", gap: 4 }}>
                {intelSources.map((s, i) => {
                  const isPrimary = selSec?.intelPriority?.some(p => 
                    (p === "census" && s === "Census ACS") || (p === "cfda" && s === "CFDA Programs") || 
                    (p === "local" && s === "Local Awards") || (p === "awards" && s === "Award Intel") ||
                    (p === "spending" && s === "Spending Trends") || (p === "county" && s === "County Spending") ||
                    (p === "sbir" && s === "SBIR Intel") || (p === "funder" && s === "Funder Research") ||
                    (p === "fac" && s === "FAC Audits") || (p === "regs" && s === "Regulations.gov") ||
                    (p === "topRecipients" && s === "Top Recipients")
                  );
                  return <span key={i} style={{ padding: "1px 5px", background: isPrimary ? T.gn + "25" : T.gn + "10", borderRadius: 3, color: isPrimary ? T.gn : T.mu, fontWeight: isPrimary ? 700 : 400 }}>{isPrimary ? "⭐ " : ""}{s}</span>;
                })}
              </div>
              <div style={{ fontSize: 7, color: T.dm, marginTop: 2 }}>⭐ = primary data sources for this section type. AI will emphasize these in the output.</div>
            </div>
          )}
          {!hasIntel && (
            <div style={{ marginBottom: 8, padding: "6px 10px", background: T.yl + "08", border: `1px solid ${T.yl}20`, borderRadius: 6 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: T.yl }}>⚠ No intelligence data loaded — run a Full Scan in Discovery first for data-rich drafts</div>
              <div style={{ fontSize: 7, color: T.mu }}>Drafts will use profile data only. For Census citations, funding landscape, and competitive intelligence, run Discovery → Full Scan first.</div>
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: T.am, marginBottom: 3, textTransform: "uppercase", letterSpacing: ".05em" }}>Target Grant</div>
              <select value={grant} onChange={e => setGrant(e.target.value)} style={{ ...inpS, width: "100%", padding: "6px 8px" }}>
                <option value="">General (no specific grant)</option>
                {G.filter(g => !["rejected","completed"].includes(g.stage)).map(g => (
                  <option key={g.id} value={g.id}>{g.name} ({g.fit}% fit)</option>
                ))}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: T.am, marginBottom: 3, textTransform: "uppercase", letterSpacing: ".05em" }}>Proposal Section</div>
              <select value={section} onChange={e => setSection(e.target.value)} style={{ ...inpS, width: "100%", padding: "6px 8px" }}>
                {sections.map(s => <option key={s.k} value={s.k}>{s.l}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: T.am, marginBottom: 3, textTransform: "uppercase", letterSpacing: ".05em" }}>RFP/NOFO Requirements (optional — paste relevant text for alignment)</div>
            <textarea value={rfpText} onChange={e => setRfpText(e.target.value)} placeholder="Paste RFP requirements, evaluation criteria, or NOFO guidance here for funder-aligned drafting..." style={{ ...inpS, width: "100%", minHeight: 50, resize: "vertical", boxSizing: "border-box" }} />
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <Btn primary onClick={generate} disabled={loading}>
              {loading ? "⏳ Generating..." : "✨ Generate Draft"}
            </Btn>
            {draft && <Btn small onClick={copyDraft}>📋 Copy</Btn>}
            {selGrant && <span style={{ fontSize: 8, color: T.mu }}>Targeting: {selGrant.name} · {selGrant.amount}</span>}
          </div>
        </Cd>

        {/* Loading indicator */}
        {loading && (
          <Cd sx={{ marginBottom: 10, textAlign: "center", padding: 20 }}>
            <div style={{ fontSize: 20, animation: "pulse 1.5s ease infinite", marginBottom: 6 }}>✍️</div>
            <div style={{ fontSize: 11, color: T.am, fontWeight: 700 }}>AI is drafting your {selSec.l}...</div>
            <div style={{ fontSize: 9, color: T.mu, marginTop: 3 }}>Using profile narratives{hasIntel ? `, ${intelSources.length} intelligence sources (Census, awards, CFDA, spending data)` : ""}{rfpText ? ", and RFP requirements" : ""}</div>
          </Cd>
        )}

        {/* Draft output */}
        {draft && !loading && (
          <Cd accent sx={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: T.am, fontFamily: "var(--d)" }}>
                📄 {selSec.l} {selGrant ? `— ${selGrant.name}` : "— General"}
              </div>
              <div style={{ display: "flex", gap: 3 }}>
                <Btn small onClick={copyDraft}>📋 Copy</Btn>
                <Btn small onClick={() => setDraft("")}>✕ Clear</Btn>
              </div>
            </div>
            <div style={{ fontSize: 10, color: T.tx, lineHeight: 1.65, whiteSpace: "pre-wrap", padding: "10px 12px", background: T.bg, borderRadius: 6, border: `1px solid ${T.bd}`, maxHeight: 400, overflowY: "auto", fontFamily: "var(--s)" }}>
              {draft}
            </div>
            <div style={{ fontSize: 8, color: T.dm, marginTop: 4 }}>⚠ AI-generated draft — review and customize before submission. Word count: ~{draft.split(/\s+/).length}</div>
            
            {/* AI Refinement — iterate on the draft */}
            <div style={{ marginTop: 10, padding: "10px 12px", background: `${T.cd}60`, borderRadius: 8, border: `1px solid ${T.bd}60` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.pu, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <span>💬</span> Refine This Draft
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  placeholder="e.g., 'Make it more technical', 'Add budget details', 'Shorten to 250 words'..."
                  style={{ ...inpS, flex: 1, fontSize: 11 }}
                  onKeyDown={async (e) => {
                    if (e.key === "Enter" && e.target.value.trim()) {
                      const refinement = e.target.value.trim();
                      e.target.value = "";
                      setLoading(true);
                      try {
                        const res = await callAI(
                          "You are an expert grant writer. You previously wrote a draft section. The user wants you to refine it. Apply their feedback and return ONLY the revised text.",
                          [
                            { role: "user", content: `Here is the current draft:\n\n${draft}` },
                            { role: "assistant", content: "I have the draft. What changes would you like?" },
                            { role: "user", content: refinement }
                          ]
                        );
                        setDraft(res);
                        setHistory(prev => [{ section: selSec.l + " (refined)", grant: selGrant?.name || "General", text: res, ts: new Date().toLocaleString() }, ...prev].slice(0, 20));
                      } catch (err) { setDraft(draft + "\n\n[Refinement error: " + err.message + "]"); }
                      setLoading(false);
                    }
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                {["Make more concise", "Add data/metrics", "More professional tone", "Add budget justification", "Strengthen impact claims"].map(q => (
                  <button key={q} onClick={async () => {
                    setLoading(true);
                    try {
                      const res = await callAI(
                        "You are an expert grant writer. Refine the draft below. Apply the requested change. Return ONLY the revised text.",
                        [
                          { role: "user", content: `Draft:\n\n${draft}\n\nPlease: ${q}` }
                        ]
                      );
                      setDraft(res);
                    } catch (err) { /* silent */ }
                    setLoading(false);
                  }} style={{ padding: "3px 8px", fontSize: 9, background: `${T.pu}10`, border: `1px solid ${T.pu}20`, borderRadius: 5, color: T.pu, cursor: "pointer", fontFamily: "var(--s)" }}>{q}</button>
                ))}
              </div>
            </div>
          </Cd>
        )}

        {/* History */}
        {history.length > 0 && (
          <Cd sx={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: T.pu, marginBottom: 6, fontFamily: "var(--d)" }}>📚 Draft History ({history.length})</div>
            {history.map((h, i) => (
              <div key={i} onClick={() => setDraft(h.text)} style={{ padding: "4px 8px", borderBottom: `1px solid ${T.bd}`, cursor: "pointer", borderRadius: 2 }} onMouseEnter={e => e.currentTarget.style.background = T.cd} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: T.tx }}>{h.section}</span>
                  <span style={{ fontSize: 8, color: T.mu }}>{h.ts}</span>
                </div>
                <div style={{ fontSize: 8, color: T.mu }}>{h.grant} · {h.text.substring(0, 80)}...</div>
              </div>
            ))}
          </Cd>
        )}

        {/* Profile data used */}
        <Cd>
          <div style={{ fontSize: 11, fontWeight: 800, color: T.cy, marginBottom: 6, fontFamily: "var(--d)" }}>🧬 Profile Data Used for Generation</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {[
              ["Founder Narrative", P.narr.founder_short],
              ["Disability Context", P.narr.disability_brief],
              ["Tech Innovation", P.narr.tech.substring(0, 120) + "..."],
              ["Impact Projections", P.narr.impact_quant.substring(0, 120) + "..."],
              ["Financial Situation", P.narr.financial.substring(0, 120) + "..."],
              ["Businesses", P.biz.map(b => b.n).join(", ")],
            ].map(([label, val]) => (
              <div key={label} style={{ padding: "5px 7px", background: T.bg, borderRadius: 4, border: `1px solid ${T.bd}` }}>
                <div style={{ fontSize: 8, fontWeight: 700, color: T.am, textTransform: "uppercase", letterSpacing: ".03em" }}>{label}</div>
                <div style={{ fontSize: 8, color: T.mu, lineHeight: 1.3, marginTop: 2 }}>{val}</div>
              </div>
            ))}
          </div>
        </Cd>
      </Hd>
    </div>
  );
}

// ══════ 16. ANALYTICS — Closes success rate + velocity gap ══════
function Analytics({ G }) {
  const total = G.length;
  const awarded = G.filter(g => ["awarded", "active", "completed"].includes(g.stage));
  const rejected = G.filter(g => g.stage === "rejected");
  const active = G.filter(g => !["rejected", "completed", "awarded", "active"].includes(g.stage));
  const submitted = G.filter(g => ["submitted", "pending", "awarded", "active", "completed", "rejected"].includes(g.stage));
  const pa = s => { const m = s.match(/[\d,]+/g); return m ? Math.max(...m.map(n => parseInt(n.replace(/,/g, "")))) : 0; };
  const totalPotential = active.reduce((a, g) => a + pa(g.amount), 0);
  const totalAwarded = awarded.reduce((a, g) => a + pa(g.amount), 0);
  const winRate = submitted.length > 0 ? Math.round(awarded.length / submitted.length * 100) : 0;
  const avgFit = G.length > 0 ? Math.round(G.reduce((a, g) => a + g.fit, 0) / G.length) : 0;
  const byCat = {};
  G.forEach(g => { if (!byCat[g.category]) byCat[g.category] = { count: 0, value: 0, fits: [] }; byCat[g.category].count++; byCat[g.category].value += pa(g.amount); byCat[g.category].fits.push(g.fit); });
  const byStage = {};
  G.forEach(g => { byStage[g.stage] = (byStage[g.stage] || 0) + 1; });

  // Deadline urgency
  const now = new Date();
  const urgent = G.filter(g => g.deadlineDate).map(g => ({ ...g, daysLeft: Math.ceil((new Date(g.deadlineDate) - now) / 86400000) })).filter(g => g.daysLeft > 0 && g.daysLeft <= 30).sort((a, b) => a.daysLeft - b.daysLeft);

  return (
    <div style={{ animation: "fi .3s ease" }}>
      <Hd i="📊" t="Analytics & Alerts" s="Portfolio performance metrics and deadline alerts">
        {/* Deadline Alerts */}
        {urgent.length > 0 && (
          <Cd accent sx={{ marginBottom: 12, borderColor: T.rd + "40" }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: T.rd, marginBottom: 6, fontFamily: "var(--d)" }}>🔔 Deadline Alerts</div>
            {urgent.map(g => (
              <div key={g.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 8px", background: g.daysLeft <= 7 ? T.rd + "12" : g.daysLeft <= 14 ? T.yl + "08" : T.bg, borderRadius: 4, marginBottom: 2, borderLeft: `3px solid ${g.daysLeft <= 7 ? T.rd : g.daysLeft <= 14 ? T.yl : T.bl}` }}>
                <div><div style={{ fontSize: 10, fontWeight: 700, color: T.tx }}>{g.name}</div><div style={{ fontSize: 8, color: T.mu }}>{g.deadlineDate}</div></div>
                <B c={g.daysLeft <= 7 ? T.rd : g.daysLeft <= 14 ? T.yl : T.bl} glow={g.daysLeft <= 7}>{g.daysLeft}d left</B>
              </div>
            ))}
          </Cd>
        )}

        <SG items={[
          { l: "Total Grants", v: total, c: T.bl },
          { l: "Active Pipeline", v: active.length, c: T.yl },
          { l: "Awarded", v: awarded.length, c: T.gn },
          { l: "Win Rate", v: winRate + "%", c: winRate >= 30 ? T.gn : T.yl },
          { l: "Avg Fit Score", v: avgFit, c: avgFit >= 75 ? T.gn : T.yl },
        ]} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <Cd>
            <div style={{ fontSize: 11, fontWeight: 800, color: T.gn, marginBottom: 8, fontFamily: "var(--d)" }}>💰 Financial Summary</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div style={{ textAlign: "center", padding: 8, background: T.bg, borderRadius: 5 }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: T.gn, fontFamily: "var(--d)" }}>${totalAwarded.toLocaleString()}</div>
                <div style={{ fontSize: 7, color: T.mu, textTransform: "uppercase" }}>Awarded</div>
              </div>
              <div style={{ textAlign: "center", padding: 8, background: T.bg, borderRadius: 5 }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: T.yl, fontFamily: "var(--d)" }}>${totalPotential.toLocaleString()}</div>
                <div style={{ fontSize: 7, color: T.mu, textTransform: "uppercase" }}>In Pipeline</div>
              </div>
            </div>
          </Cd>
          <Cd>
            <div style={{ fontSize: 11, fontWeight: 800, color: T.pu, marginBottom: 8, fontFamily: "var(--d)" }}>📂 By Category</div>
            {Object.entries(byCat).map(([cat, d]) => (
              <div key={cat} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 6px", borderBottom: `1px solid ${T.bd}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: CAT[cat]?.c || T.mu }}></div>
                  <span style={{ fontSize: 9, fontWeight: 700, color: T.tx }}>{CAT[cat]?.l || cat}</span>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 8, color: T.mu }}>{d.count} grants</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: T.gn, fontFamily: "var(--m)" }}>${d.value.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </Cd>
        </div>

        <Cd>
          <div style={{ fontSize: 11, fontWeight: 800, color: T.cy, marginBottom: 8, fontFamily: "var(--d)" }}>📈 Stage Distribution</div>
          <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
            {Object.entries(byStage).sort((a, b) => b[1] - a[1]).map(([stage, count]) => (
              <div key={stage} style={{ padding: "6px 10px", background: `${STG[stage]?.c || T.mu}12`, border: `1px solid ${STG[stage]?.c || T.mu}30`, borderRadius: 5, textAlign: "center", minWidth: 60 }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: STG[stage]?.c || T.mu, fontFamily: "var(--d)" }}>{count}</div>
                <div style={{ fontSize: 7, color: T.mu, textTransform: "uppercase" }}>{STG[stage]?.l || stage}</div>
              </div>
            ))}
          </div>
        </Cd>

        {/* CSV Export */}
        <div style={{ marginTop: 10, display: "flex", gap: 4 }}>
          <Btn small onClick={() => {
            const csvRows = [["Name","Stage","Category","Fit%","Amount","Deadline","Source","URL"].join(",")];
            G.forEach(g => csvRows.push([`"${g.name}"`, g.stage, g.category, g.fit, `"${g.amount}"`, g.deadlineDate || g.deadline || "", `"${g.source}"`, g.url || ""].join(",")));
            const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
            const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `grants-export-${new Date().toISOString().split("T")[0]}.csv`; a.click();
          }}>📊 Export CSV</Btn>
          <Btn small onClick={() => {
            const events = G.filter(g => g.deadlineDate).map(g => {
              const d = g.deadlineDate.replace(/-/g, "");
              return `BEGIN:VEVENT\nDTSTART;VALUE=DATE:${d}\nDTEND;VALUE=DATE:${d}\nSUMMARY:GRANT DEADLINE: ${g.name}\nDESCRIPTION:${g.source} · ${g.amount} · Fit: ${g.fit}%${g.url ? "\\nURL: " + g.url : ""}\nEND:VEVENT`;
            }).join("\n");
            const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//GLP//Grant Deadlines//EN\n${events}\nEND:VCALENDAR`;
            const blob = new Blob([ics], { type: "text/calendar" });
            const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "grant-deadlines.ics"; a.click();
          }}>📅 Export .ics Calendar</Btn>
        </div>
      </Hd>
    </div>
  );
}

// ══════ 17. FUNDER RESEARCH — Real ProPublica 990 API ══════
function FunderResearch({ onNav }) {
  const [query, setQuery] = useState("");
  const [state, setState] = useState("IL");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [savedFunders, setSavedFunders] = useState(() => {
    try { return JSON.parse(localStorage.getItem("glp_v5_funders") || "[]"); } catch { return []; }
  });

  const STATES = ["","AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"];
  const NTEE_CATS = { T: "Philanthropy/Grantmaking", S: "Community Development", U: "Science/Tech", B: "Education", E: "Health", J: "Employment", K: "Food/Agriculture", C: "Environment", P: "Human Services", W: "Public Affairs", X: "Religion", Y: "Mutual Benefit" };

  const searchFunders = async () => {
    if (!query.trim()) return;
    setLoading(true); setResults([]); setSelected(null); setDetail(null); setError(null);
    try {
      let url = `https://projects.propublica.org/nonprofits/api/v2/search.json?q=${encodeURIComponent(query)}`;
      if (state) url += `&state%5Bid%5D=${state}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`API returned ${resp.status}`);
      const data = await resp.json();
      setResults(data.organizations || []);
      if ((data.organizations || []).length === 0) setError("No organizations found. Try different keywords or remove the state filter.");
    } catch (err) { setResults([]); setError("Failed to reach ProPublica API. Check your connection and try again."); }
    setLoading(false);
  };

  const loadDetail = async (ein) => {
    setSelected(ein); setDetail(null); setDetailLoading(true);
    try {
      const resp = await fetch(`https://projects.propublica.org/nonprofits/api/v2/organizations/${ein}.json`);
      if (!resp.ok) throw new Error(`API returned ${resp.status}`);
      const data = await resp.json();
      setDetail(data);
    } catch (err) { setDetail(null); }
    setDetailLoading(false);
  };

  const saveFunder = (org) => {
    const entry = { ein: org.ein, name: org.name, city: org.city, state: org.state, revenue: org.revenue_amount || 0, ntee: org.ntee_code, savedAt: new Date().toISOString() };
    const updated = [...savedFunders.filter(f => f.ein !== org.ein), entry];
    setSavedFunders(updated);
    try { localStorage.setItem("glp_v5_funders", JSON.stringify(updated)); } catch {}
  };

  const removeFunder = (ein) => {
    const updated = savedFunders.filter(f => f.ein !== ein);
    setSavedFunders(updated);
    try { localStorage.setItem("glp_v5_funders", JSON.stringify(updated)); } catch {}
  };

  const org = detail?.organization;
  const filings = detail?.filings_with_data || [];

  return (
    <div style={{ animation: "fi .3s ease" }}>
      <Hd i="🔎" t="Funder Research" s="Real IRS 990 data via ProPublica Nonprofit Explorer — search 1.8M+ organizations">
        <Cd glass sx={{ marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && searchFunders()} placeholder="Search foundations, nonprofits, community orgs..." style={{ ...inpS, flex: 1, padding: "7px 10px" }} />
            <select value={state} onChange={e => setState(e.target.value)} style={{ ...inpS, width: 60 }}>
              <option value="">All</option>
              {STATES.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <Btn primary onClick={searchFunders} disabled={loading}>{loading ? "⏳" : "🔍 Search"}</Btn>
          </div>
          <div style={{ fontSize: 8, color: T.dm }}>Data source: IRS Form 990 via ProPublica Nonprofit Explorer API · Free, real-time, public domain data</div>
          {onNav && <div style={{ marginTop: 4, fontSize: 8 }}><span style={{ color: T.bl, cursor: "pointer" }} onClick={() => onNav("awards")}>🏆 See federal award data →</span></div>}
        </Cd>

        {error && <div style={{ padding: "6px 10px", background: T.rd + "14", border: `1px solid ${T.rd}30`, borderRadius: 4, fontSize: 9, color: T.rd, marginBottom: 8 }}>⚠ {error}</div>}

        {!loading && results.length === 0 && !error && !detail && (
          <Cd sx={{ textAlign: "center", padding: 20 }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>🔎</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.tx }}>Search 1.8M+ Nonprofit Organizations</div>
            <div style={{ fontSize: 9, color: T.mu, marginTop: 3 }}>Search by name to find foundations, community organizations, and nonprofits. View IRS 990 financial data including revenue, assets, and multi-year filing history.</div>
            <div style={{ fontSize: 8, color: T.dm, marginTop: 6 }}>Try: "community foundation", "disability services", "rural development"</div>
          </Cd>
        )}

        {/* Saved funders */}
        {savedFunders.length > 0 && (
          <Cd sx={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: T.am, marginBottom: 6, fontFamily: "var(--d)" }}>⭐ Saved Funders ({savedFunders.length})</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {savedFunders.map(f => (
                <div key={f.ein} onClick={() => loadDetail(f.ein)} style={{ padding: "4px 8px", background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 5, cursor: "pointer", fontSize: 9, display: "flex", gap: 4, alignItems: "center" }}>
                  <span style={{ fontWeight: 700, color: T.tx }}>{f.name}</span>
                  <span style={{ color: T.mu }}>{f.city}, {f.state}</span>
                  <span style={{ color: T.gn, fontFamily: "var(--m)", fontWeight: 700 }}>${(f.revenue || 0).toLocaleString()}</span>
                  <span onClick={e => { e.stopPropagation(); removeFunder(f.ein); }} style={{ color: T.rd, cursor: "pointer", fontWeight: 700 }}>✕</span>
                </div>
              ))}
            </div>
          </Cd>
        )}

        <div style={{ display: "grid", gridTemplateColumns: detail ? "1fr 1fr" : "1fr", gap: 10 }}>
          {/* Search results */}
          <div>
            {results.length > 0 && (
              <Cd sx={{ maxHeight: 500, overflowY: "auto" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.sb, marginBottom: 6 }}>{results.length} organizations found</div>
                {results.map(r => (
                  <div key={r.ein} onClick={() => loadDetail(r.ein)} style={{
                    padding: "6px 8px", borderBottom: `1px solid ${T.bd}`, cursor: "pointer",
                    background: selected === r.ein ? T.cd : "transparent", borderRadius: 3, marginBottom: 1,
                    borderLeft: selected === r.ein ? `3px solid ${T.am}` : "3px solid transparent",
                  }} onMouseEnter={e => { if (selected !== r.ein) e.currentTarget.style.background = T.bg; }} onMouseLeave={e => { if (selected !== r.ein) e.currentTarget.style.background = "transparent"; }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: T.tx }}>{r.name}</div>
                        <div style={{ fontSize: 8, color: T.mu }}>{r.city}, {r.state} · EIN: {r.strein} · {r.ntee_code ? `NTEE: ${r.ntee_code}` : ""}</div>
                      </div>
                      <B c={r.ntee_code?.startsWith("T") ? T.gn : T.bl}>{NTEE_CATS[r.ntee_code?.[0]] || r.ntee_code || "N/A"}</B>
                    </div>
                  </div>
                ))}
              </Cd>
            )}
          </div>

          {/* Detail panel */}
          {(detail || detailLoading) && (
            <div>
              {detailLoading && <Cd sx={{ textAlign: "center", padding: 20 }}><div style={{ animation: "pulse 1s infinite", fontSize: 14 }}>📊</div><div style={{ fontSize: 10, color: T.am }}>Loading 990 data...</div></Cd>}
              {org && (
                <Cd accent>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 900, color: T.tx, fontFamily: "var(--d)" }}>{org.name}</div>
                      <div style={{ fontSize: 9, color: T.mu }}>{org.city}, {org.state} · EIN: {org.strein}</div>
                    </div>
                    <Btn small primary onClick={() => saveFunder(org)}>⭐ Save</Btn>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
                    <div style={{ padding: "8px", background: T.bg, borderRadius: 5, textAlign: "center" }}>
                      <div style={{ fontSize: 16, fontWeight: 900, color: T.gn, fontFamily: "var(--d)" }}>${(org.revenue_amount || 0).toLocaleString()}</div>
                      <div style={{ fontSize: 7, color: T.mu, textTransform: "uppercase" }}>Revenue</div>
                    </div>
                    <div style={{ padding: "8px", background: T.bg, borderRadius: 5, textAlign: "center" }}>
                      <div style={{ fontSize: 16, fontWeight: 900, color: T.bl, fontFamily: "var(--d)" }}>${(org.asset_amount || 0).toLocaleString()}</div>
                      <div style={{ fontSize: 7, color: T.mu, textTransform: "uppercase" }}>Assets</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
                    {org.ntee_code && <B c={T.pu}>NTEE: {org.ntee_code}</B>}
                    <B c={T.cy}>Subsection: 501(c)({org.subsection_code})</B>
                    {org.tax_period && <B c={T.yl}>Tax Period: {org.tax_period}</B>}
                  </div>

                  {/* Filing history - REAL 990 DATA */}
                  {filings.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: T.am, marginBottom: 4, textTransform: "uppercase", letterSpacing: ".05em" }}>990 Filing History ({filings.length} years)</div>
                      <div style={{ maxHeight: 200, overflowY: "auto" }}>
                        {filings.slice(0, 10).map((f, i) => (
                          <div key={i} style={{ display: "grid", gridTemplateColumns: "40px 1fr 1fr 1fr", gap: 4, padding: "4px 6px", borderBottom: `1px solid ${T.bd}`, fontSize: 8, alignItems: "center" }}>
                            <span style={{ fontWeight: 800, color: T.tx, fontFamily: "var(--m)" }}>{f.tax_prd_yr}</span>
                            <div><div style={{ color: T.mu }}>Revenue</div><div style={{ fontWeight: 700, color: T.gn }}>${(f.totrevenue || 0).toLocaleString()}</div></div>
                            <div><div style={{ color: T.mu }}>Expenses</div><div style={{ fontWeight: 700, color: T.or }}>${(f.totfuncexpns || 0).toLocaleString()}</div></div>
                            <div><div style={{ color: T.mu }}>Assets</div><div style={{ fontWeight: 700, color: T.bl }}>${(f.totassetsend || 0).toLocaleString()}</div></div>
                          </div>
                        ))}
                      </div>
                      {/* Revenue trend */}
                      {filings.length >= 2 && (() => {
                        const sorted = [...filings].sort((a, b) => a.tax_prd_yr - b.tax_prd_yr);
                        const maxRev = Math.max(...sorted.map(f => f.totrevenue || 0));
                        return (
                          <div style={{ marginTop: 6 }}>
                            <div style={{ fontSize: 8, color: T.mu, marginBottom: 3 }}>Revenue Trend</div>
                            <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 40 }}>
                              {sorted.slice(-8).map((f, i) => {
                                const h = maxRev > 0 ? Math.max(2, ((f.totrevenue || 0) / maxRev) * 36) : 2;
                                return (
                                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                                    <div style={{ width: "100%", height: h, background: `linear-gradient(180deg, ${T.gn}, ${T.gn}60)`, borderRadius: "2px 2px 0 0", minHeight: 2 }}></div>
                                    <div style={{ fontSize: 6, color: T.dm, marginTop: 1 }}>{f.tax_prd_yr}</div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                  <div style={{ marginTop: 6, fontSize: 8, color: T.dm }}>
                    <a href={`https://projects.propublica.org/nonprofits/organizations/${org.ein}`} target="_blank" rel="noopener noreferrer" style={{ color: T.bl }}>View full profile on ProPublica →</a>
                  </div>
                </Cd>
              )}
            </div>
          )}
        </div>
      </Hd>
    </div>
  );
}

// ══════ 18. RFP PARSER — Real Claude API ══════
function RFPParser({ G, sG }) {
  const [rfpText, setRfpText] = useState("");
  const [parsed, setParsed] = useState(null);
  const [loading, setLoading] = useState(false);
  const [targetGrant, setTargetGrant] = useState("");

  const parseRFP = async () => {
    if (!rfpText.trim()) return;
    setLoading(true); setParsed(null);
    try {
      const aiHeaders2 = { "Content-Type": "application/json" };
      const ak2 = getAIKey();
      if (ak2) { aiHeaders2["x-api-key"] = ak2; aiHeaders2["anthropic-version"] = "2023-06-01"; aiHeaders2["anthropic-dangerous-direct-browser-access"] = "true"; }
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: aiHeaders2,
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          messages: [{ role: "user", content: `Analyze this RFP/NOFO text and extract structured data. Return ONLY valid JSON with no preamble or markdown, using this exact structure:
{
  "title": "grant title or program name",
  "agency": "issuing agency",
  "deadline": "deadline date if found or null",
  "amount_min": number or null,
  "amount_max": number or null,
  "eligibility": ["list of eligibility requirements"],
  "required_documents": ["list of required docs"],
  "evaluation_criteria": [{"criterion":"name","weight":"percentage or description"}],
  "key_dates": [{"date":"date","event":"description"}],
  "match_required": true/false or null,
  "match_percentage": "match % if applicable or null",
  "cfda_number": "CFDA/ALN number if found or null",
  "focus_areas": ["program focus areas"],
  "restrictions": ["any restrictions or exclusions"],
  "contact": {"name":"","email":"","phone":""},
  "summary": "2-3 sentence summary of the opportunity",
  "fit_assessment": "Brief assessment of how well a small business or entrepreneur might fit this opportunity"
}

RFP/NOFO TEXT:
${rfpText.substring(0, 6000)}` }],
        })
      });
      const data = await response.json();
      const text = data.content?.map(b => b.text || "").join("") || "";
      const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      setParsed(JSON.parse(cleaned));
    } catch (err) {
      setParsed({ error: "Failed to parse: " + err.message, raw: err.toString() });
    }
    setLoading(false);
  };

  const addToGrant = () => {
    if (!parsed || !targetGrant) return;
    const updated = G.map(g => {
      if (g.id !== targetGrant) return g;
      const newReqs = (parsed.required_documents || []).map((doc, i) => ({
        id: `rfp_${Date.now()}_${i}`, did: null, n: doc, s: "n"
      }));
      return { ...g, requirements: [...g.requirements, ...newReqs], notes: g.notes + `\n[RFP Parsed] ${parsed.summary || ""}` };
    });
    sG(updated);
  };

  return (
    <div style={{ animation: "fi .3s ease" }}>
      <Hd i="📄" t="RFP Parser" s="Paste NOFO/RFP text → AI extracts requirements, deadlines, eligibility, evaluation criteria">
        <Cd glass sx={{ marginBottom: 12 }}>
          <textarea value={rfpText} onChange={e => setRfpText(e.target.value)}
            placeholder="Paste RFP, NOFO, or grant solicitation text here...&#10;&#10;The AI will extract:&#10;• Eligibility requirements&#10;• Required documents&#10;• Evaluation criteria & weights&#10;• Key dates & deadlines&#10;• Funding amounts & match requirements&#10;• Fit assessment for your profile"
            style={{ ...inpS, width: "100%", minHeight: 120, resize: "vertical", boxSizing: "border-box", lineHeight: 1.5 }} />
          <div style={{ display: "flex", gap: 6, marginTop: 6, alignItems: "center" }}>
            <Btn primary onClick={parseRFP} disabled={loading || !rfpText.trim()}>
              {loading ? "⏳ Analyzing..." : "🔬 Parse RFP"}
            </Btn>
            <span style={{ fontSize: 8, color: T.mu }}>{rfpText.length.toLocaleString()} chars · Powered by Claude API</span>
          </div>
        </Cd>

        {loading && (
          <Cd sx={{ textAlign: "center", padding: 20, marginBottom: 10 }}>
            <div style={{ fontSize: 20, animation: "pulse 1.2s ease infinite" }}>🔬</div>
            <div style={{ fontSize: 11, color: T.am, fontWeight: 700 }}>Analyzing RFP text...</div>
            <div style={{ fontSize: 9, color: T.mu }}>Extracting requirements, criteria, deadlines...</div>
          </Cd>
        )}

        {parsed && !parsed.error && (
          <div className="stagger">
            {/* Header */}
            <Cd accent sx={{ marginBottom: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: T.tx, fontFamily: "var(--d)", marginBottom: 4 }}>{parsed.title || "Grant Opportunity"}</div>
              {parsed.agency && <div style={{ fontSize: 10, color: T.sb, marginBottom: 4 }}>Agency: {parsed.agency}</div>}
              {parsed.summary && <div style={{ fontSize: 10, color: T.tx, lineHeight: 1.5, padding: "6px 8px", background: T.bg, borderRadius: 4 }}>{parsed.summary}</div>}
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
                {parsed.deadline && <B c={T.rd} glow>Deadline: {parsed.deadline}</B>}
                {parsed.amount_max && <B c={T.gn}>Up to ${parsed.amount_max.toLocaleString()}</B>}
                {parsed.cfda_number && <B c={T.bl}>CFDA: {parsed.cfda_number}</B>}
                {parsed.match_required && <B c={T.yl}>Match: {parsed.match_percentage || "Required"}</B>}
              </div>
            </Cd>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              {/* Eligibility */}
              <Cd>
                <div style={{ fontSize: 11, fontWeight: 800, color: T.bl, marginBottom: 6, fontFamily: "var(--d)" }}>📋 Eligibility</div>
                {(parsed.eligibility || []).map((e, i) => (
                  <div key={i} style={{ fontSize: 9, padding: "3px 0", borderBottom: `1px solid ${T.bd}`, color: T.tx, display: "flex", gap: 4 }}>
                    <span style={{ color: T.gn }}>•</span> {e}
                  </div>
                ))}
              </Cd>

              {/* Required documents */}
              <Cd>
                <div style={{ fontSize: 11, fontWeight: 800, color: T.or, marginBottom: 6, fontFamily: "var(--d)" }}>📎 Required Documents</div>
                {(parsed.required_documents || []).map((d, i) => (
                  <div key={i} style={{ fontSize: 9, padding: "3px 0", borderBottom: `1px solid ${T.bd}`, color: T.tx, display: "flex", gap: 4 }}>
                    <span style={{ color: T.yl }}>☐</span> {d}
                  </div>
                ))}
              </Cd>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              {/* Evaluation criteria */}
              {(parsed.evaluation_criteria || []).length > 0 && (
                <Cd>
                  <div style={{ fontSize: 11, fontWeight: 800, color: T.pu, marginBottom: 6, fontFamily: "var(--d)" }}>⚖️ Evaluation Criteria</div>
                  {parsed.evaluation_criteria.map((c, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: `1px solid ${T.bd}` }}>
                      <span style={{ fontSize: 9, color: T.tx }}>{c.criterion}</span>
                      <B c={T.pu}>{c.weight}</B>
                    </div>
                  ))}
                </Cd>
              )}

              {/* Key dates */}
              {(parsed.key_dates || []).length > 0 && (
                <Cd>
                  <div style={{ fontSize: 11, fontWeight: 800, color: T.cy, marginBottom: 6, fontFamily: "var(--d)" }}>📅 Key Dates</div>
                  {parsed.key_dates.map((d, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: `1px solid ${T.bd}` }}>
                      <span style={{ fontSize: 9, color: T.tx }}>{d.event}</span>
                      <B c={T.cy}>{d.date}</B>
                    </div>
                  ))}
                </Cd>
              )}
            </div>

            {/* Fit assessment */}
            {parsed.fit_assessment && (
              <Cd sx={{ marginBottom: 10, borderColor: T.am + "30" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: T.am, marginBottom: 4, fontFamily: "var(--d)" }}>🎯 Fit Assessment for Your Profile</div>
                <div style={{ fontSize: 10, color: T.tx, lineHeight: 1.5 }}>{parsed.fit_assessment}</div>
              </Cd>
            )}

            {/* Add to pipeline */}
            <Cd>
              <div style={{ fontSize: 11, fontWeight: 800, color: T.gn, marginBottom: 6, fontFamily: "var(--d)" }}>➕ Add Requirements to Pipeline Grant</div>
              <div style={{ display: "flex", gap: 6 }}>
                <select value={targetGrant} onChange={e => setTargetGrant(e.target.value)} style={{ ...inpS, flex: 1, padding: "6px 8px" }}>
                  <option value="">Select grant to add requirements to...</option>
                  {G.filter(g => !["rejected","completed"].includes(g.stage)).map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
                <Btn primary onClick={addToGrant} disabled={!targetGrant || !parsed.required_documents?.length}>Add {parsed.required_documents?.length || 0} Requirements</Btn>
              </div>
            </Cd>
          </div>
        )}

        {parsed?.error && (
          <Cd sx={{ borderColor: T.rd + "40" }}>
            <div style={{ fontSize: 10, color: T.rd, fontWeight: 700 }}>Parse Error: {parsed.error}</div>
          </Cd>
        )}
      </Hd>
    </div>
  );
}

// ══════ 19. REPORT GENERATOR — Real progress reports ══════
function ReportGen({ G, D }) {
  const [grantId, setGrantId] = useState("");
  const [period, setPeriod] = useState("quarterly");
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);

  const grant = G.find(g => g.id === grantId);
  const pa = s => { const m = s.match(/[\d,]+/g); return m ? Math.max(...m.map(n => parseInt(n.replace(/,/g, "")))) : 0; };

  const generateReport = async () => {
    if (!grant) return;
    setLoading(true); setReport("");
    const reqsDone = grant.requirements.filter(r => r.s === "d").length;
    const reqsTotal = grant.requirements.length;
    const docsReady = D.filter(d => d.st === "ready").length;
    const docsTotal = D.length;

    try {
      const aiHeaders3 = { "Content-Type": "application/json" };
      const ak3 = getAIKey();
      if (ak3) { aiHeaders3["x-api-key"] = ak3; aiHeaders3["anthropic-version"] = "2023-06-01"; aiHeaders3["anthropic-dangerous-direct-browser-access"] = "true"; }
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: aiHeaders3,
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          messages: [{ role: "user", content: `Generate a ${period} progress report for a grant. Use professional grant reporting language.

GRANT DETAILS:
Name: ${grant.name}
Source: ${grant.source}
Amount: ${grant.amount}
Stage: ${grant.stage}
Category: ${grant.category}
Notes: ${grant.notes}

PROGRESS METRICS:
Requirements completed: ${reqsDone}/${reqsTotal} (${reqsTotal > 0 ? Math.round(reqsDone/reqsTotal*100) : 0}%)
Documents ready: ${docsReady}/${docsTotal}
Current stage: ${grant.stage}

ORGANIZATION:
${P.narr.founder_short}
Location: ${P.loc}
Monthly expenses: $${Object.values(P.expenses).reduce((a,b)=>a+b,0)}
Monthly income: $${Object.values(P.income || {}).reduce((a,b)=>a+b,0)}

Format the report with these sections:
1. Executive Summary
2. Project Activities & Milestones
3. Financial Status
4. Challenges & Solutions
5. Next Steps & Timeline
6. Compliance Status

Write the full report text. Be specific and professional.` }],
        })
      });
      const data = await response.json();
      setReport(data.content?.map(b => b.text || "").join("\n") || "Error generating report");
    } catch (err) {
      setReport("Error: " + err.message);
    }
    setLoading(false);
  };

  const downloadReport = () => {
    if (!report) return;
    const blob = new Blob([`PROGRESS REPORT\n${"=".repeat(50)}\nGrant: ${grant?.name || "N/A"}\nPeriod: ${period}\nDate: ${new Date().toLocaleDateString()}\nPrepared by: ${P.name}\n${"=".repeat(50)}\n\n${report}`], { type: "text/plain" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `progress-report-${grant?.name?.replace(/\s/g, "-") || "grant"}-${new Date().toISOString().split("T")[0]}.txt`; a.click();
  };

  return (
    <div style={{ animation: "fi .3s ease" }}>
      <Hd i="📝" t="Report Generator" s="Generate professional progress reports combining grant data + compliance records">
        <Cd glass sx={{ marginBottom: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8, marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: T.am, marginBottom: 3, textTransform: "uppercase" }}>Grant</div>
              <select value={grantId} onChange={e => setGrantId(e.target.value)} style={{ ...inpS, width: "100%", padding: "6px 8px" }}>
                <option value="">Select grant...</option>
                {G.filter(g => !["rejected"].includes(g.stage)).map(g => (
                  <option key={g.id} value={g.id}>{g.name} ({g.stage})</option>
                ))}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: T.am, marginBottom: 3, textTransform: "uppercase" }}>Period</div>
              <select value={period} onChange={e => setPeriod(e.target.value)} style={{ ...inpS, width: "100%", padding: "6px 8px" }}>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="semi-annual">Semi-Annual</option>
                <option value="annual">Annual</option>
                <option value="final">Final</option>
              </select>
            </div>
          </div>
          {grant && (
            <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
              <B c={T.gn}>{grant.amount}</B>
              <B c={T.bl}>{grant.source}</B>
              <B c={T.yl}>Reqs: {grant.requirements.filter(r => r.s === "d").length}/{grant.requirements.length}</B>
            </div>
          )}
          <Btn primary onClick={generateReport} disabled={loading || !grantId}>
            {loading ? "⏳ Generating..." : "📝 Generate Report"}
          </Btn>
        </Cd>

        {loading && (
          <Cd sx={{ textAlign: "center", padding: 20, marginBottom: 10 }}>
            <div style={{ fontSize: 20, animation: "pulse 1.2s ease infinite" }}>📝</div>
            <div style={{ fontSize: 11, color: T.am, fontWeight: 700 }}>Generating {period} report for {grant?.name}...</div>
          </Cd>
        )}

        {report && (
          <Cd accent>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: T.am, fontFamily: "var(--d)" }}>
                📄 {period.charAt(0).toUpperCase() + period.slice(1)} Report — {grant?.name}
              </div>
              <div style={{ display: "flex", gap: 3 }}>
                <Btn small onClick={() => navigator.clipboard.writeText(report)}>📋 Copy</Btn>
                <Btn small primary onClick={downloadReport}>💾 Download</Btn>
              </div>
            </div>
            <div style={{ fontSize: 10, color: T.tx, lineHeight: 1.7, whiteSpace: "pre-wrap", padding: "12px 14px", background: T.bg, borderRadius: 6, border: `1px solid ${T.bd}`, maxHeight: 500, overflowY: "auto" }}>{report}</div>
            <div style={{ fontSize: 8, color: T.dm, marginTop: 4 }}>AI-generated report draft · Review and customize before submission · {new Date().toLocaleDateString()}</div>
          </Cd>
        )}
      </Hd>
    </div>
  );
}

// ══════ 20. AWARD INTELLIGENCE — Real USASpending.gov API ══════
function AwardIntel({ G, sG, onNav }) {
  const [query, setQuery] = useState("disability small business");
  const [state, setState] = useState("IL");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stateData, setStateData] = useState(null);
  const [yearRange, setYearRange] = useState("2024");
  const [sortBy, setSortBy] = useState("Award Amount");
  const [added, setAdded] = useState({});
  const [cfdaResults, setCfdaResults] = useState([]);

  // CFDA program lookup — real USASpending autocomplete API
  const searchCFDA = async (term) => {
    if (!term || term.length < 3) return;
    try {
      const resp = await fetch("https://api.usaspending.gov/api/v2/autocomplete/cfda/", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ search_text: term }),
      });
      const data = await resp.json();
      setCfdaResults(data.results || []);
    } catch { setCfdaResults([]); }
  };

  const searchAwards = async () => {
    setLoading(true); setResults([]); setError(null);
    try {
      const resp = await fetch("https://api.usaspending.gov/api/v2/search/spending_by_award/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filters: {
            time_period: [{ start_date: `${yearRange}-01-01`, end_date: `${yearRange}-12-31` }],
            award_type_codes: ["02", "03", "04", "05"],
            recipient_locations: state ? [{ country: "USA", state }] : [],
            keywords: query.split(" ").filter(Boolean),
          },
          fields: ["Award ID", "Recipient Name", "Award Amount", "Awarding Agency", "Awarding Sub Agency", "Start Date", "End Date", "Description", "recipient_id", "Funding Agency", "CFDA Number"],
          limit: 25, page: 1, sort: sortBy, order: "desc",
        })
      });
      if (!resp.ok) throw new Error(`API returned ${resp.status}`);
      const data = await resp.json();
      setResults(data.results || []);
      if ((data.results || []).length === 0) setError("No awards found for these keywords. Try broader terms like 'education' or 'health'.");
    } catch (err) { setResults([]); setError("Failed to reach USASpending.gov API: " + err.message); }
    setLoading(false);
  };

  const loadStateData = async () => {
    const fips = { AL:"01",AK:"02",AZ:"04",AR:"05",CA:"06",CO:"08",CT:"09",DE:"10",FL:"12",GA:"13",HI:"15",ID:"16",IL:"17",IN:"18",IA:"19",KS:"20",KY:"21",LA:"22",ME:"23",MD:"24",MA:"25",MI:"26",MN:"27",MS:"28",MO:"29",MT:"30",NE:"31",NV:"32",NH:"33",NJ:"34",NM:"35",NY:"36",NC:"37",ND:"38",OH:"39",OK:"40",OR:"41",PA:"42",RI:"44",SC:"45",SD:"46",TN:"47",TX:"48",UT:"49",VT:"50",VA:"51",WA:"53",WV:"54",WI:"55",WY:"56",DC:"11" };
    const code = fips[state] || "17";
    try {
      const resp = await fetch(`https://api.usaspending.gov/api/v2/recipient/state/${code}/?year=latest`);
      setStateData(await resp.json());
    } catch { setStateData(null); }
  };

  const STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"];

  return (
    <div style={{ animation: "fi .3s ease" }}>
      <Hd i="🏆" t="Award Intelligence" s="Real federal award data via USASpending.gov — see who's getting grants near you">
        <Cd glass sx={{ marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
            <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && searchAwards()} placeholder="Search awards (disability, technology, rural...)" style={{ ...inpS, flex: 1, padding: "7px 10px" }} />
            <select value={state} onChange={e => setState(e.target.value)} style={{ ...inpS, width: 55 }}>
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={yearRange} onChange={e => setYearRange(e.target.value)} style={{ ...inpS, width: 70 }}>
              {["2025","2024","2023","2022","2021"].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <Btn primary onClick={searchAwards} disabled={loading}>{loading ? "⏳" : "🔍 Search"}</Btn>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <Btn small onClick={loadStateData}>📊 State Overview</Btn>
            <Btn small onClick={() => searchCFDA(query)}>📚 CFDA Lookup</Btn>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ ...inpS, padding: "3px 6px", fontSize: 8 }}>
              {["Award Amount","Start Date","Recipient Name"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <div style={{ fontSize: 8, color: T.dm }}>Source: USASpending.gov · U.S. Treasury DATA Act · No API key needed</div>
          </div>
        </Cd>

        {/* State overview */}
        {stateData && (
          <Cd accent sx={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.am, fontFamily: "var(--d)", marginBottom: 6 }}>📊 {stateData.name} Federal Funding Overview</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <div style={{ textAlign: "center", padding: 10, background: T.bg, borderRadius: 5 }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: T.gn, fontFamily: "var(--d)" }}>${((stateData.total_prime_amount || 0) / 1e9).toFixed(1)}B</div>
                <div style={{ fontSize: 7, color: T.mu, textTransform: "uppercase" }}>Total Federal Awards</div>
              </div>
              <div style={{ textAlign: "center", padding: 10, background: T.bg, borderRadius: 5 }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: T.bl, fontFamily: "var(--d)" }}>{(stateData.population || 0).toLocaleString()}</div>
                <div style={{ fontSize: 7, color: T.mu, textTransform: "uppercase" }}>Population</div>
              </div>
              <div style={{ textAlign: "center", padding: 10, background: T.bg, borderRadius: 5 }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: T.pu, fontFamily: "var(--d)" }}>${(stateData.award_amount_per_capita || 0).toLocaleString()}</div>
                <div style={{ fontSize: 7, color: T.mu, textTransform: "uppercase" }}>Per Capita</div>
              </div>
            </div>
          </Cd>
        )}

        {error && !loading && <div style={{ padding: "6px 10px", background: T.rd + "14", border: `1px solid ${T.rd}30`, borderRadius: 4, fontSize: 9, color: T.rd, marginBottom: 8 }}>⚠ {error}</div>}

        {!loading && results.length === 0 && !error && !stateData && cfdaResults.length === 0 && (
          <Cd sx={{ textAlign: "center", padding: 20 }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>🏆</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.tx }}>Federal Award Intelligence</div>
            <div style={{ fontSize: 9, color: T.mu, marginTop: 3 }}>Search real federal award data to see who's receiving grants in your area. Find peer organizations, understand funding patterns, and identify opportunities.</div>
            <div style={{ fontSize: 8, color: T.dm, marginTop: 6 }}>Try: "disability small business", "rural development", "technology innovation"</div>
          </Cd>
        )}

        {/* CFDA Programs */}
        {cfdaResults.length > 0 && (
          <Cd sx={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.pu, marginBottom: 4 }}>📚 Federal Assistance Programs matching "{query}"</div>
            {cfdaResults.map((c, i) => (
              <div key={i} style={{ padding: "4px 8px", borderBottom: `1px solid ${T.bd}`, display: "flex", justifyContent: "space-between" }}>
                <div><span style={{ fontSize: 10, fontWeight: 700, color: T.am, fontFamily: "var(--m)" }}>{c.program_number}</span><span style={{ fontSize: 9, color: T.tx, marginLeft: 6 }}>{c.program_title}</span></div>
                <a href={`https://sam.gov/fal/${c.program_number}/view`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 8, color: T.bl }}>SAM.gov →</a>
              </div>
            ))}
          </Cd>
        )}

        {/* Results */}
        {results.length > 0 && (
          <Cd>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.sb, marginBottom: 6 }}>
              {results.length} awards found · {state} · {yearRange}
            </div>
            <div style={{ maxHeight: 500, overflowY: "auto" }}>
              {results.map((r, i) => {
                const amt = r["Award Amount"] || 0;
                const isAdded = added[r["Award ID"]];
                return (
                  <div key={i} style={{ padding: "8px 10px", borderBottom: `1px solid ${T.bd}`, borderLeft: `3px solid ${amt > 1000000 ? T.gn : amt > 100000 ? T.yl : T.bl}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: T.tx }}>{r["Recipient Name"] || "Unknown"}</div>
                        <div style={{ fontSize: 9, color: T.sb, marginTop: 1 }}>{r["Awarding Agency"]}{r["Awarding Sub Agency"] ? ` → ${r["Awarding Sub Agency"]}` : ""}</div>
                        <div style={{ fontSize: 8, color: T.mu, marginTop: 2, lineHeight: 1.3 }}>{(r["Description"] || "").substring(0, 200)}{(r["Description"] || "").length > 200 ? "..." : ""}</div>
                        <div style={{ display: "flex", gap: 4, marginTop: 3 }}>
                          {r["CFDA Number"] && <B c={T.cy}>CFDA: {r["CFDA Number"]}</B>}
                          {r["Start Date"] && <B c={T.mu}>{r["Start Date"]}</B>}
                          {isAdded && <B c={T.gn}>✓ In Pipeline</B>}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", minWidth: 90, display: "flex", flexDirection: "column", gap: 3, alignItems: "flex-end" }}>
                        <div style={{ fontSize: 14, fontWeight: 900, color: T.gn, fontFamily: "var(--d)" }}>${amt.toLocaleString()}</div>
                        <Btn small primary={!isAdded} disabled={isAdded} onClick={() => {
                          if (isAdded) return;
                          const newG = mk(2000 + G.length + i, r["Recipient Name"] ? `Similar to: ${r["Recipient Name"]}` : r["Awarding Agency"], r["Awarding Agency"] || "Federal", categorizeGrant(r["Description"] || "", r["Awarding Agency"] || ""), "$" + amt.toLocaleString(), "Research", "", 50, `Peer award found via USASpending. CFDA: ${r["CFDA Number"] || "N/A"}. Original recipient: ${r["Recipient Name"]}. ${(r["Description"] || "").substring(0, 150)}`, [], [], null, null);
                          sG(prev => [...prev, newG]);
                          setAdded(prev => ({ ...prev, [r["Award ID"]]: true }));
                        }}>{isAdded ? "✓ Added" : "+ Pipeline"}</Btn>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 6, fontSize: 8, color: T.dm }}>
              💡 Use this data to identify peer organizations receiving similar grants and understand funding patterns in your area.
              <span style={{ color: T.bl, cursor: "pointer", marginLeft: 4 }} onClick={() => onNav("funder")}>Research funders →</span>
            </div>
          </Cd>
        )}

        {loading && (
          <Cd sx={{ textAlign: "center", padding: 20 }}>
            <div style={{ fontSize: 20, animation: "pulse 1s infinite" }}>🏆</div>
            <div style={{ fontSize: 11, color: T.am, fontWeight: 700 }}>Querying USASpending.gov...</div>
            <div style={{ fontSize: 9, color: T.mu }}>Searching {state} federal awards for "{query}" in {yearRange}</div>
          </Cd>
        )}
      </Hd>
    </div>
  );
}
const STORAGE_KEY = "glp_v5_";
const save = (key, data) => { try { localStorage.setItem(STORAGE_KEY + key, JSON.stringify(data)); } catch (e) { console.warn("Save failed:", e); } };
const load = (key, fallback) => { try { const d = localStorage.getItem(STORAGE_KEY + key); return d ? JSON.parse(d) : fallback; } catch (e) { return fallback; } };

// ═══════════════════════════════════════
// ROOT APP v5.0 — REAL PERSISTENCE
// ═══════════════════════════════════════
// ══════ PROFILE EDITOR — Editable user profile with persistence ══════
function ProfileEditor({ P, setP, onNav }) {
  const [sec, setSec] = useState("identity"); // identity, tags, sectors, business, narratives, financials
  const [newBiz, setNewBiz] = useState({ n: "", d: "", sec: "" });
  const [newTag, setNewTag] = useState("");
  
  const upd = (key, val) => setP(prev => ({ ...prev, [key]: val }));
  const updNarr = (key, val) => setP(prev => ({ ...prev, narr: { ...prev.narr, [key]: val } }));
  const updExp = (key, val) => setP(prev => ({ ...prev, expenses: { ...prev.expenses, [key]: parseFloat(val) || 0 } }));
  const updInc = (key, val) => setP(prev => ({ ...prev, income: { ...prev.income, [key]: parseFloat(val) || 0 } }));
  
  const toggleTag = (id) => {
    const current = P.tags || [];
    upd("tags", current.includes(id) ? current.filter(t => t !== id) : [...current, id]);
  };
  const toggleSector = (id) => {
    const current = P.sectors || [];
    upd("sectors", current.includes(id) ? current.filter(s => s !== id) : [...current, id]);
  };
  const addBiz = () => {
    if (!newBiz.n.trim()) return;
    upd("biz", [...(P.biz || []), { ...newBiz }]);
    setNewBiz({ n: "", d: "", sec: "" });
  };
  const removeBiz = (i) => upd("biz", (P.biz || []).filter((_, j) => j !== i));
  const addCustomTag = () => {
    if (!newTag.trim() || (P.tags || []).includes(newTag.trim())) return;
    upd("tags", [...(P.tags || []), newTag.trim()]);
    setNewTag("");
  };
  
  const stateFips = STATE_FIPS[P.state] || "";
  const searchCount = generateSearches(P.tags || [], P.sectors || []).length;
  const weightCount = generateScoreWeights(P.tags || [], P.sectors || []).length;
  
  const sections = [
    { k: "identity", l: "👤 Identity" }, { k: "tags", l: "🏷️ Eligibility" },
    { k: "sectors", l: "🏭 Sectors" }, { k: "business", l: "🏢 Business" },
    { k: "narratives", l: "📝 Narratives" }, { k: "financials", l: "💰 Financials" },
  ];
  
  return (
    <div style={{ animation: "fi .3s ease" }}>
      <Hd i="⚙️" t="Profile Setup" s={`Your profile drives Discovery searches (${searchCount} generated), Matcher scoring (${weightCount} weights), and template auto-fill`}>
        <SG items={[
          { l: "Tags", v: (P.tags || []).length, c: T.pu },
          { l: "Sectors", v: (P.sectors || []).length, c: T.cy },
          { l: "Businesses", v: (P.biz || []).length, c: T.gn },
          { l: "Searches", v: searchCount, c: T.bl },
        ]} />
        
        <Pl active={sec} onSelect={setSec} items={sections} />
        
        {sec === "identity" && (
          <Cd sx={{ marginTop: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: T.am, marginBottom: 8, fontFamily: "var(--d)" }}>👤 Identity & Location</div>
            {[
              ["Name", P.name, v => upd("name", v), "Your name"],
              ["Location", P.loc, v => upd("loc", v), "City, State (e.g., Austin, Texas)"],
              ["State", P.state, v => { upd("state", v); upd("countyFips", ""); }, "Full state name"],
              ["County", P.county, v => upd("county", v), "County name (for Census data)"],
              ["County FIPS", P.countyFips, v => upd("countyFips", v), "3-digit FIPS code (e.g., 079)"],
            ].map(([label, val, setter, ph]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: T.sb, width: 80 }}>{label}</div>
                <input value={val || ""} onChange={e => setter(e.target.value)} placeholder={ph} style={{ ...inpS, flex: 1 }} />
              </div>
            ))}
            {stateFips && <div style={{ fontSize: 8, color: T.gn, marginTop: 4 }}>✓ State FIPS: {stateFips} — Census API ready{P.countyFips ? ` (County: ${P.countyFips})` : " — add County FIPS for community data"}</div>}
            {!stateFips && P.state && <div style={{ fontSize: 8, color: T.or, marginTop: 4 }}>⚠ State "{P.state}" not recognized. Use full name (e.g., "Illinois" not "IL")</div>}
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.bd}` }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: T.am, marginBottom: 6, fontFamily: "var(--d)" }}>🐙 GitHub Integration</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: T.sb, width: 80 }}>Username</div>
                <input value={P.github || ""} onChange={e => upd("github", e.target.value)} placeholder="GitHub username" style={{ ...inpS, flex: 1 }} />
              </div>
              <div style={{ fontSize: 8, color: T.dm }}>Connects your GitHub for tech stack analysis and project insights. Scanned during onboarding.</div>
            </div>
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.bd}` }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: T.am, marginBottom: 6, fontFamily: "var(--d)" }}>🔑 API Key Management</div>
              <div style={{ fontSize: 8, color: T.mu, marginBottom: 8 }}>All keys are stored locally in your browser only — never sent to our servers. Keys unlock enhanced features and higher rate limits.</div>
              
              {/* Claude AI Key */}
              <div style={{ padding: "6px 8px", background: T.bg, borderRadius: 6, marginBottom: 6, border: `1px solid ${T.bd}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: T.sb }}>🤖 Anthropic Claude API</div>
                  {(() => { try { return localStorage.getItem("glp_ai_key"); } catch { return ""; } })() ? 
                    <B c={T.gn}>✓ Active</B> : <B c={T.or}>Not Set</B>}
                </div>
                <input type="password" value={(() => { try { return localStorage.getItem("glp_ai_key") || ""; } catch { return ""; } })()} 
                  onChange={e => { try { if (e.target.value) localStorage.setItem("glp_ai_key", e.target.value); else localStorage.removeItem("glp_ai_key"); } catch {} }}
                  placeholder="sk-ant-..." style={{ ...inpS, width: "100%", fontFamily: "var(--m)", fontSize: 9, marginBottom: 3 }} />
                <div style={{ fontSize: 7, color: T.dm }}>Powers: AI Drafter, RFP Parser, Reports, Briefing, Narratives, Gap Analysis · <span style={{ color: T.bl }}>console.anthropic.com</span></div>
              </div>

              {/* Simpler.Grants.gov Key */}
              <div style={{ padding: "6px 8px", background: T.bg, borderRadius: 6, marginBottom: 6, border: `1px solid ${T.bd}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: T.sb }}>🏛️ Simpler.Grants.gov API</div>
                  {(() => { try { return localStorage.getItem("glp_simpler_key"); } catch { return ""; } })() ? 
                    <B c={T.gn}>✓ Active</B> : <B c={T.mu}>Optional</B>}
                </div>
                <input type="password" value={(() => { try { return localStorage.getItem("glp_simpler_key") || ""; } catch { return ""; } })()} 
                  onChange={e => { try { if (e.target.value) localStorage.setItem("glp_simpler_key", e.target.value); else localStorage.removeItem("glp_simpler_key"); } catch {} }}
                  placeholder="Simpler Grants API key..." style={{ ...inpS, width: "100%", fontFamily: "var(--m)", fontSize: 9, marginBottom: 3 }} />
                <div style={{ fontSize: 7, color: T.dm }}>Unlocks: Enhanced search with faceted filtering, status counts, bulk export · Free via Login.gov · <span style={{ color: T.bl }}>simpler.grants.gov/api</span></div>
              </div>

              {/* SAM.gov Key */}
              <div style={{ padding: "6px 8px", background: T.bg, borderRadius: 6, marginBottom: 6, border: `1px solid ${T.bd}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: T.sb }}>📋 SAM.gov Entity API</div>
                  {(() => { try { return localStorage.getItem("glp_sam_key"); } catch { return ""; } })() ? 
                    <B c={T.gn}>✓ Active</B> : <B c={T.mu}>Optional</B>}
                </div>
                <input type="password" value={(() => { try { return localStorage.getItem("glp_sam_key") || ""; } catch { return ""; } })()} 
                  onChange={e => { try { if (e.target.value) localStorage.setItem("glp_sam_key", e.target.value); else localStorage.removeItem("glp_sam_key"); } catch {} }}
                  placeholder="SAM.gov API key..." style={{ ...inpS, width: "100%", fontFamily: "var(--m)", fontSize: 9, marginBottom: 3 }} />
                <div style={{ fontSize: 7, color: T.dm }}>Unlocks: Entity registration verification, UEI lookup, exclusion checks, CAGE codes · Free · <span style={{ color: T.bl }}>sam.gov/data-services</span></div>
              </div>

              {/* Census API Key */}
              <div style={{ padding: "6px 8px", background: T.bg, borderRadius: 6, marginBottom: 6, border: `1px solid ${T.bd}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: T.sb }}>📊 Census Bureau API</div>
                  {(() => { try { return localStorage.getItem("glp_census_key"); } catch { return ""; } })() ? 
                    <B c={T.gn}>✓ Active</B> : <B c={T.mu}>Works without key</B>}
                </div>
                <input type="password" value={(() => { try { return localStorage.getItem("glp_census_key") || ""; } catch { return ""; } })()} 
                  onChange={e => { try { if (e.target.value) localStorage.setItem("glp_census_key", e.target.value); else localStorage.removeItem("glp_census_key"); } catch {} }}
                  placeholder="Census API key (optional)..." style={{ ...inpS, width: "100%", fontFamily: "var(--m)", fontSize: 9, marginBottom: 3 }} />
                <div style={{ fontSize: 7, color: T.dm }}>Higher rate limits for Census ACS queries. Works without key at lower limits. · Free · <span style={{ color: T.bl }}>api.census.gov/data/key_signup.html</span></div>
              </div>

              {/* Data.gov / FAC Key */}
              <div style={{ padding: "6px 8px", background: T.bg, borderRadius: 6, marginBottom: 6, border: `1px solid ${T.bd}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: T.sb }}>🔓 Data.gov API Key</div>
                  {(() => { try { return localStorage.getItem("glp_datagov_key"); } catch { return ""; } })() ? 
                    <B c={T.gn}>✓ Active</B> : <B c={T.mu}>Using DEMO_KEY</B>}
                </div>
                <input type="password" value={(() => { try { return localStorage.getItem("glp_datagov_key") || ""; } catch { return ""; } })()} 
                  onChange={e => { try { if (e.target.value) localStorage.setItem("glp_datagov_key", e.target.value); else localStorage.removeItem("glp_datagov_key"); } catch {} }}
                  placeholder="Data.gov API key (replaces DEMO_KEY)..." style={{ ...inpS, width: "100%", fontFamily: "var(--m)", fontSize: 9, marginBottom: 3 }} />
                <div style={{ fontSize: 7, color: T.dm }}>Used by: FAC Single Audit + Regulations.gov. Currently using DEMO_KEY (rate limited). · Free · <span style={{ color: T.bl }}>api.data.gov/signup</span></div>
              </div>

              {/* API Status Summary */}
              <div style={{ padding: "6px 8px", background: T.cd, borderRadius: 6, marginTop: 4 }}>
                <div style={{ fontSize: 8, fontWeight: 700, color: T.tx, marginBottom: 3 }}>API Status Summary</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, fontSize: 7 }}>
                  <span style={{ color: T.gn }}>✓ Grants.gov (no key)</span>
                  <span style={{ color: T.gn }}>✓ USAspending ×8 (no key)</span>
                  <span style={{ color: T.gn }}>✓ SBIR.gov (no key)</span>
                  <span style={{ color: T.gn }}>✓ Federal Register (no key)</span>
                  <span style={{ color: T.gn }}>✓ Census ACS (no key)</span>
                  <span style={{ color: T.gn }}>✓ ProPublica (no key)</span>
                  <span style={{ color: (() => { try { return localStorage.getItem("glp_datagov_key") ? T.gn : T.yl; } catch { return T.yl; } })() }}>{(() => { try { return localStorage.getItem("glp_datagov_key") ? "✓" : "⚡"; } catch { return "⚡"; } })()} FAC ({(() => { try { return localStorage.getItem("glp_datagov_key") ? "custom key" : "DEMO_KEY"; } catch { return "DEMO_KEY"; } })()})</span>
                  <span style={{ color: (() => { try { return localStorage.getItem("glp_datagov_key") ? T.gn : T.yl; } catch { return T.yl; } })() }}>{(() => { try { return localStorage.getItem("glp_datagov_key") ? "✓" : "⚡"; } catch { return "⚡"; } })()} Regulations.gov ({(() => { try { return localStorage.getItem("glp_datagov_key") ? "custom key" : "DEMO_KEY"; } catch { return "DEMO_KEY"; } })()})</span>
                  <span style={{ color: (() => { try { return localStorage.getItem("glp_simpler_key") ? T.gn : T.dm; } catch { return T.dm; } })() }}>{(() => { try { return localStorage.getItem("glp_simpler_key") ? "✓" : "○"; } catch { return "○"; } })()} Simpler.Grants.gov</span>
                  <span style={{ color: (() => { try { return localStorage.getItem("glp_sam_key") ? T.gn : T.dm; } catch { return T.dm; } })() }}>{(() => { try { return localStorage.getItem("glp_sam_key") ? "✓" : "○"; } catch { return "○"; } })()} SAM.gov Entity</span>
                </div>
              </div>
            </div>
          </Cd>
        )}
        
        {sec === "tags" && (
          <Cd sx={{ marginTop: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: T.am, marginBottom: 4, fontFamily: "var(--d)" }}>🏷️ Eligibility Tags</div>
            <div style={{ fontSize: 8, color: T.mu, marginBottom: 8 }}>Select all that apply. Each tag auto-generates Discovery keyword searches and Matcher scoring weights.</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
              {TAG_OPTIONS.map(opt => {
                const active = (P.tags || []).includes(opt.id);
                return (
                  <div key={opt.id} onClick={() => toggleTag(opt.id)} style={{ padding: "6px 8px", background: active ? T.gn + "12" : T.bg, border: `1px solid ${active ? T.gn + "40" : T.bd}`, borderRadius: 4, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all .12s" }}>
                    <span style={{ fontSize: 14 }}>{opt.icon}</span>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: active ? T.gn : T.tx }}>{opt.label}</div>
                      <div style={{ fontSize: 7, color: T.dm }}>{(TAG_KEYWORDS[opt.id] || []).length} search keywords</div>
                    </div>
                    {active && <span style={{ fontSize: 10, color: T.gn, marginLeft: "auto", fontWeight: 900 }}>✓</span>}
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 8, display: "flex", gap: 4 }}>
              <input value={newTag} onChange={e => setNewTag(e.target.value)} placeholder="Add custom tag..." style={{ ...inpS, flex: 1 }} onKeyDown={e => e.key === "Enter" && addCustomTag()} />
              <Btn small onClick={addCustomTag}>+ Add</Btn>
            </div>
            {(P.tags || []).filter(t => !TAG_OPTIONS.some(o => o.id === t)).length > 0 && (
              <div style={{ marginTop: 4, display: "flex", gap: 2, flexWrap: "wrap" }}>
                {(P.tags || []).filter(t => !TAG_OPTIONS.some(o => o.id === t)).map(t => (
                  <span key={t} style={{ padding: "2px 6px", background: T.am + "15", border: `1px solid ${T.am}30`, borderRadius: 3, fontSize: 8, color: T.am, display: "flex", alignItems: "center", gap: 3 }}>
                    {t} <span onClick={() => toggleTag(t)} style={{ cursor: "pointer", fontWeight: 900 }}>✕</span>
                  </span>
                ))}
              </div>
            )}
          </Cd>
        )}
        
        {sec === "sectors" && (
          <Cd sx={{ marginTop: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: T.am, marginBottom: 4, fontFamily: "var(--d)" }}>🏭 Industry Sectors</div>
            <div style={{ fontSize: 8, color: T.mu, marginBottom: 8 }}>Select your sectors. Each generates targeted Discovery searches and Matcher scoring for that industry.</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
              {SECTOR_OPTIONS.map(opt => {
                const active = (P.sectors || []).includes(opt.id);
                return (
                  <div key={opt.id} onClick={() => toggleSector(opt.id)} style={{ padding: "6px 8px", background: active ? T.cy + "12" : T.bg, border: `1px solid ${active ? T.cy + "40" : T.bd}`, borderRadius: 4, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all .12s" }}>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: active ? T.cy : T.tx }}>{opt.label}</div>
                      <div style={{ fontSize: 7, color: T.dm }}>{(SECTOR_KEYWORDS[opt.id] || []).length} search keywords</div>
                    </div>
                    {active && <span style={{ fontSize: 10, color: T.cy, marginLeft: "auto", fontWeight: 900 }}>✓</span>}
                  </div>
                );
              })}
            </div>
          </Cd>
        )}
        
        {sec === "business" && (
          <Cd sx={{ marginTop: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: T.am, marginBottom: 6, fontFamily: "var(--d)" }}>🏢 Businesses / Ventures</div>
            {(P.biz || []).map((b, i) => (
              <div key={i} style={{ display: "flex", gap: 4, padding: "4px 6px", background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 3, marginBottom: 3, alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.tx }}>{b.n}</div>
                  <div style={{ fontSize: 8, color: T.mu }}>{b.d}</div>
                </div>
                <B c={T.cy}>{b.sec}</B>
                <span onClick={() => removeBiz(i)} style={{ fontSize: 10, color: T.rd, cursor: "pointer", fontWeight: 900, padding: "0 4px" }}>✕</span>
              </div>
            ))}
            <div style={{ display: "flex", gap: 3, marginTop: 6 }}>
              <input value={newBiz.n} onChange={e => setNewBiz(p => ({ ...p, n: e.target.value }))} placeholder="Business name" style={{ ...inpS, flex: 1 }} />
              <input value={newBiz.d} onChange={e => setNewBiz(p => ({ ...p, d: e.target.value }))} placeholder="Description" style={{ ...inpS, flex: 2 }} />
              <input value={newBiz.sec} onChange={e => setNewBiz(p => ({ ...p, sec: e.target.value }))} placeholder="Sector" style={{ ...inpS, width: 80 }} />
              <Btn small primary onClick={addBiz}>+ Add</Btn>
            </div>
          </Cd>
        )}
        
        {sec === "narratives" && (
          <Cd sx={{ marginTop: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: T.am, marginBottom: 6, fontFamily: "var(--d)" }}>📝 Grant Narratives</div>
            <div style={{ fontSize: 8, color: T.mu, marginBottom: 8 }}>These pre-fill into Application Templates and the AI Drafter. Edit anytime.</div>
            {[
              ["Founder Story (Full)", "founder_full", 4],
              ["Founder Story (Short)", "founder_short", 2],
              ["Technical Background", "founder_tech", 2],
              ["Disability Statement", "disability", 3],
              ["Impact Statement", "impact", 2],
              ["Impact (Quantified)", "impact_quant", 2],
              ["Financial Need", "financial", 2],
              ["Technology Description", "tech", 2],
              ["SBIR Technical", "tech_sbir", 2],
            ].map(([label, key, rows]) => (
              <div key={key} style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: T.sb, marginBottom: 2 }}>{label}</div>
                <textarea value={(P.narr || {})[key] || ""} onChange={e => updNarr(key, e.target.value)} rows={rows} style={{ width: "100%", padding: 6, background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 3, color: T.tx, fontSize: 9, fontFamily: "var(--s)", resize: "vertical", outline: "none", boxSizing: "border-box" }} />
              </div>
            ))}
          </Cd>
        )}
        
        {sec === "financials" && (
          <Cd sx={{ marginTop: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: T.am, marginBottom: 6, fontFamily: "var(--d)" }}>💰 Financial Profile</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: T.sb, marginBottom: 4 }}>Monthly Expenses</div>
            {Object.entries(P.expenses || {}).map(([key, val]) => (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <div style={{ fontSize: 9, color: T.tx, width: 80, textTransform: "capitalize" }}>{key}</div>
                <div style={{ fontSize: 10, color: T.mu }}>$</div>
                <input type="number" value={val} onChange={e => updExp(key, e.target.value)} style={{ ...inpS, width: 80 }} />
              </div>
            ))}
            <div style={{ fontSize: 9, fontWeight: 700, color: T.sb, marginBottom: 4, marginTop: 8 }}>Monthly Income</div>
            {Object.entries(P.income || {}).map(([key, val]) => (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <div style={{ fontSize: 9, color: T.tx, width: 80, textTransform: "capitalize" }}>{key}</div>
                <div style={{ fontSize: 10, color: T.mu }}>$</div>
                <input type="number" value={val} onChange={e => updInc(key, e.target.value)} style={{ ...inpS, width: 80 }} />
              </div>
            ))}
          </Cd>
        )}
        
        {/* PROFILE IMPACT SUMMARY */}
        <Cd sx={{ marginTop: 8, borderLeft: `3px solid ${T.am}` }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: T.am, marginBottom: 4, fontFamily: "var(--d)" }}>📊 Profile Impact</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, fontSize: 9 }}>
            <div><span style={{ color: T.sb }}>Discovery Searches:</span> <span style={{ color: T.gn, fontWeight: 800 }}>{searchCount}</span></div>
            <div><span style={{ color: T.sb }}>Scorer Weights:</span> <span style={{ color: T.gn, fontWeight: 800 }}>{weightCount}</span></div>
            <div><span style={{ color: T.sb }}>Census Ready:</span> <span style={{ color: stateFips && P.countyFips ? T.gn : T.or, fontWeight: 800 }}>{stateFips && P.countyFips ? "✓ Yes" : "Needs FIPS"}</span></div>
          </div>
          <div style={{ fontSize: 8, color: T.mu, marginTop: 4 }}>Your tags and sectors automatically configure: which grants Discovery searches for, how the Matcher scores relevance, and what terms auto-fill in templates.</div>
        </Cd>
      </Hd>
    </div>
  );
}

// ══════ GITHUB SCANNER — Analyzes repos for tech/business insights ══════
async function scanGitHub(username) {
  if (!username) return null;
  try {
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`);
    if (!res.ok) throw new Error("GitHub user not found");
    const repos = await res.json();
    const languages = {}, topics = new Set();
    let totalStars = 0, totalForks = 0;
    const projects = [];
    
    for (const r of repos) {
      if (r.fork && !r.stargazers_count) continue; // skip unstarred forks
      if (r.language) languages[r.language] = (languages[r.language] || 0) + 1;
      totalStars += r.stargazers_count || 0;
      totalForks += r.forks_count || 0;
      (r.topics || []).forEach(t => topics.add(t));
      if (r.description || r.stargazers_count > 0) {
        projects.push({ n: r.name, d: r.description || "", stars: r.stargazers_count, lang: r.language, url: r.html_url, updated: r.updated_at });
      }
    }
    
    // Infer sectors from languages and topics
    const inferredSectors = new Set();
    const langKeys = Object.keys(languages);
    if (langKeys.some(l => ["Python","R","Jupyter Notebook"].includes(l))) inferredSectors.add("technology");
    if (langKeys.some(l => ["JavaScript","TypeScript","HTML","CSS","Vue","Svelte"].includes(l))) inferredSectors.add("technology");
    if (langKeys.some(l => ["Rust","Go","C","C++","Java","Kotlin","Swift"].includes(l))) inferredSectors.add("technology");
    if ([...topics].some(t => ["machine-learning","ai","deep-learning","nlp","data-science"].includes(t))) inferredSectors.add("technology");
    if ([...topics].some(t => ["healthcare","medical","health","biomedical"].includes(t))) inferredSectors.add("healthcare");
    if ([...topics].some(t => ["education","learning","edtech","tutorial"].includes(t))) inferredSectors.add("education");
    if ([...topics].some(t => ["agriculture","farming","food","agtech"].includes(t))) inferredSectors.add("agriculture");
    if ([...topics].some(t => ["energy","solar","climate","sustainability","green"].includes(t))) inferredSectors.add("clean-energy");
    if ([...topics].some(t => ["ecommerce","shop","marketplace","retail"].includes(t))) inferredSectors.add("ecommerce");
    if ([...topics].some(t => ["game","music","art","creative","media"].includes(t))) inferredSectors.add("creative");
    if ([...topics].some(t => ["manufacturing","iot","hardware","robotics","3d-printing"].includes(t))) inferredSectors.add("manufacturing");
    
    // Sort languages by frequency
    const topLangs = Object.entries(languages).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([l, c]) => l);
    // Top projects by stars then recency
    const topProjects = projects.sort((a, b) => (b.stars - a.stars) || (new Date(b.updated) - new Date(a.updated))).slice(0, 10);
    
    return {
      username, repoCount: repos.filter(r => !r.fork).length, totalStars, totalForks,
      topLanguages: topLangs, topics: [...topics].slice(0, 20),
      inferredSectors: [...inferredSectors],
      topProjects,
      techSummary: `${topLangs.slice(0, 5).join(", ")} developer with ${repos.filter(r => !r.fork).length} repositories. ${totalStars > 0 ? totalStars + " total stars. " : ""}${topProjects.length > 0 ? "Notable projects: " + topProjects.slice(0, 3).map(p => p.n).join(", ") + "." : ""}`,
    };
  } catch (e) {
    console.warn("GitHub scan failed:", e);
    return null;
  }
}

// ══════ ONBOARDING WIZARD — New user intake process ══════
function OnboardingWizard({ onComplete }) {
  const [step, setStep] = useState(0); // 0=welcome, 1=identity, 2=tags, 3=sectors, 4=business, 5=github, 6=review
  const [prof, setProf] = useState({ ...DEFAULT_PROFILE });
  const [ghUser, setGhUser] = useState("");
  const [ghData, setGhData] = useState(null);
  const [ghLoading, setGhLoading] = useState(false);
  const [ghError, setGhError] = useState("");
  const [newBiz, setNewBiz] = useState({ n: "", d: "", sec: "" });
  
  const upd = (k, v) => setProf(p => ({ ...p, [k]: v }));
  const toggleTag = (id) => {
    const cur = prof.tags || [];
    upd("tags", cur.includes(id) ? cur.filter(t => t !== id) : [...cur, id]);
  };
  const toggleSector = (id) => {
    const cur = prof.sectors || [];
    upd("sectors", cur.includes(id) ? cur.filter(s => s !== id) : [...cur, id]);
  };
  const addBiz = () => {
    if (!newBiz.n.trim()) return;
    upd("biz", [...(prof.biz || []), { ...newBiz }]);
    setNewBiz({ n: "", d: "", sec: "" });
  };
  
  const scanGH = async () => {
    if (!ghUser.trim()) return;
    setGhLoading(true); setGhError("");
    try {
      const data = await scanGitHub(ghUser.trim());
      if (data) {
        setGhData(data);
        upd("github", ghUser.trim());
        // Auto-apply inferred sectors
        const merged = new Set([...(prof.sectors || []), ...data.inferredSectors]);
        upd("sectors", [...merged]);
        // Auto-create business entries from top projects
        if (data.topProjects.length > 0 && (prof.biz || []).length === 0) {
          const autoBiz = data.topProjects.slice(0, 5).filter(p => p.d).map(p => ({
            n: p.n, d: p.d, sec: p.lang || "Technology"
          }));
          if (autoBiz.length > 0) upd("biz", [...(prof.biz || []), ...autoBiz]);
        }
        // Auto-fill tech narrative
        if (!prof.narr.founder_tech && data.techSummary) {
          setProf(p => ({ ...p, narr: { ...p.narr, founder_tech: data.techSummary } }));
        }
      } else {
        setGhError("Could not find that GitHub user");
      }
    } catch (e) { setGhError(e.message); }
    setGhLoading(false);
  };
  
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiNarratives, setAiNarratives] = useState(null);
  
  const generateNarratives = async (profile) => {
    const key = getAIKey();
    if (!key) return null;
    
    const context = `User Profile:
Name: ${profile.name || "Unknown"}
Location: ${profile.loc || "Unknown"}, ${profile.state || "Unknown"}
Eligibility Tags: ${(profile.tags || []).join(", ") || "None"}
Industry Sectors: ${(profile.sectors || []).join(", ") || "None"}
Businesses/Projects: ${(profile.biz || []).map(b => `${b.n}: ${b.d}`).join("; ") || "None"}
GitHub: ${profile.github || "Not connected"}
Tech Stack: ${profile.narr?.founder_tech || "Unknown"}`;
    
    try {
      const text = await callAI(
        `You are a professional grant writing consultant. Based on the user profile below, generate narratives that will be used to auto-fill grant applications. Write as if you ARE the applicant (first person where appropriate). Be specific, compelling, and data-conscious. Return ONLY valid JSON with no markdown fences.`,
        `${context}

Generate narratives as JSON with these exact keys. Each should be grant-ready prose. If a field isn't applicable based on their tags, set it to empty string "":

{
  "founder_full": "3-paragraph founder bio emphasizing unique qualifications, experience, and mission (200-300 words)",
  "founder_short": "2-3 sentence founder summary for quick applications (50-75 words)",
  "founder_tech": "Technical capabilities and stack description for SBIR/tech grants (100-150 words)",
  "disability": "Disability narrative for disability-related grants — ONLY if 'disabled' tag present, otherwise empty string (150-200 words)",
  "disability_brief": "One-paragraph disability summary — ONLY if 'disabled' tag present, otherwise empty string (50 words)",
  "impact": "Community/economic impact statement for grant applications (100-150 words)",
  "impact_quant": "Quantified projected impact with specific numbers and timeframes (100-150 words)",
  "financial": "Financial need narrative explaining why grant funding is essential (100-150 words)",
  "tech": "Technology/innovation description for tech-focused grants (100-150 words)",
  "tech_sbir": "SBIR-style technical abstract emphasizing novelty and commercialization — ONLY if technology sector, otherwise empty string (150-200 words)"
}`
      );
      
      const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      return JSON.parse(cleaned);
    } catch (e) {
      console.warn("AI narrative generation failed:", e);
      return null;
    }
  };
  
  const finish = async () => {
    const key = getAIKey();
    if (key && prof.name) {
      setAiGenerating(true);
      const narrs = await generateNarratives(prof);
      if (narrs) {
        const final = { ...prof, narr: { ...prof.narr, ...narrs }, setupComplete: true };
        setAiGenerating(false);
        onComplete(final);
        return;
      }
      setAiGenerating(false);
    }
    const final = { ...prof, setupComplete: true };
    onComplete(final);
  };
  
  const skip = () => onComplete({ ...DEFAULT_PROFILE, setupComplete: true });
  
  const steps = ["Welcome", "Identity", "Eligibility", "Sectors", "Business", "GitHub", "Review"];
  const canNext = step === 0 || step === 5 || step === 6 ||
    (step === 1 && prof.name) ||
    (step === 2 && (prof.tags || []).length > 0) ||
    (step === 3 && (prof.sectors || []).length > 0) ||
    (step === 4);
  
  const tagBtnS = (active) => ({
    padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid " + (active ? T.am : T.bd),
    background: active ? T.am + "18" : T.sf, color: active ? T.am : T.mu, transition: "all .15s",
  });
  
  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--s)", position: "relative" }}>
      <style>{css}</style>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "20%", left: "30%", width: 400, height: 400, background: `radial-gradient(ellipse, ${T.am}06 0%, transparent 60%)`, filter: "blur(60px)" }}></div>
        <div style={{ position: "absolute", bottom: "20%", right: "20%", width: 300, height: 300, background: `radial-gradient(ellipse, ${T.bl}04 0%, transparent 60%)`, filter: "blur(50px)" }}></div>
      </div>
      
      <div style={{ width: 520, maxHeight: "90vh", overflow: "auto", position: "relative", zIndex: 10, animation: "fi .5s cubic-bezier(.16,1,.3,1)" }}>
        {/* Progress bar */}
        <div style={{ display: "flex", gap: 3, marginBottom: 20 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? T.am : T.bd, transition: "background .3s" }} />
          ))}
        </div>
        
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg, ${T.am}, ${T.am}88)`, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 24, boxShadow: `0 6px 24px ${T.am}25`, marginBottom: 12 }}>🎯</div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, fontFamily: "var(--d)", color: T.tx }}>{steps[step]}</h2>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: T.mu }}>Step {step + 1} of {steps.length}</p>
        </div>
        
        <Cd glass sx={{ padding: 24 }}>
          {/* Step 0: Welcome */}
          {step === 0 && (
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 14, color: T.tx, lineHeight: 1.7, margin: "0 0 16px" }}>
                Welcome to the Grant Lifecycle Platform! This quick setup tailors grant discovery, scoring, and document generation to <strong>your</strong> specific situation.
              </p>
              <p style={{ fontSize: 12, color: T.mu, marginBottom: 16 }}>Takes about 2 minutes. You can always edit your profile later.</p>
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                <Btn primary onClick={() => setStep(1)}>🚀 Let's Get Started</Btn>
                <Btn onClick={skip}>Skip for now →</Btn>
              </div>
            </div>
          )}
          
          {/* Step 1: Identity */}
          {step === 1 && (
            <div>
              <p style={{ fontSize: 12, color: T.mu, marginBottom: 12 }}>Basic info used for location-based grant matching and document generation.</p>
              {[
                ["Your Name", prof.name, v => upd("name", v), "Full name"],
                ["Location", prof.loc, v => upd("loc", v), "City, State (e.g., Austin, Texas)"],
                ["State", prof.state, v => upd("state", v), "Full state name (e.g., Texas)"],
                ["County", prof.county, v => upd("county", v), "County name (optional)"],
              ].map(([label, val, setter, ph]) => (
                <div key={label} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.sb, marginBottom: 3 }}>{label}</div>
                  <input value={val || ""} onChange={e => setter(e.target.value)} placeholder={ph} style={{ ...inpS, width: "100%" }} />
                </div>
              ))}
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.bd}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.am, marginBottom: 4 }}>🤖 Anthropic API Key (optional)</div>
                <input type="password"
                  value={(() => { try { return localStorage.getItem("glp_ai_key") || ""; } catch { return ""; } })()}
                  onChange={e => { try { if (e.target.value) localStorage.setItem("glp_ai_key", e.target.value); else localStorage.removeItem("glp_ai_key"); } catch {} }}
                  placeholder="sk-ant-..." style={{ ...inpS, width: "100%", fontFamily: "var(--m)", fontSize: 10 }} />
                <div style={{ fontSize: 9, color: T.dm, marginTop: 4 }}>
                  Enables AI-powered narratives, grant analysis, and drafting. Get a key at <span style={{ color: T.bl }}>console.anthropic.com</span>. Stored locally only.
                </div>
              </div>
            </div>
          )}
          
          {/* Step 2: Eligibility Tags */}
          {step === 2 && (
            <div>
              <p style={{ fontSize: 12, color: T.mu, marginBottom: 12 }}>Select all that apply. These drive grant search keywords and fit scoring — the more accurate, the better your matches.</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {TAG_OPTIONS.map(opt => (
                  <div key={opt.id} onClick={() => toggleTag(opt.id)} style={tagBtnS((prof.tags || []).includes(opt.id))}>
                    {opt.icon} {opt.label}
                  </div>
                ))}
              </div>
              {(prof.tags || []).length > 0 && (
                <div style={{ marginTop: 12, fontSize: 10, color: T.gn }}>
                  ✓ {(prof.tags || []).length} tags selected — generates {generateSearches(prof.tags, prof.sectors || []).length} search keywords
                </div>
              )}
            </div>
          )}
          
          {/* Step 3: Sectors */}
          {step === 3 && (
            <div>
              <p style={{ fontSize: 12, color: T.mu, marginBottom: 12 }}>What industries or sectors does your work fall into?</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {SECTOR_OPTIONS.map(opt => (
                  <div key={opt.id} onClick={() => toggleSector(opt.id)} style={tagBtnS((prof.sectors || []).includes(opt.id))}>
                    {opt.icon} {opt.label}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Step 4: Business */}
          {step === 4 && (
            <div>
              <p style={{ fontSize: 12, color: T.mu, marginBottom: 12 }}>Add your businesses, projects, or ventures. This helps with grant matching and narrative generation. (Optional — you can add later.)</p>
              {(prof.biz || []).map((b, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, padding: "6px 8px", background: T.sf, borderRadius: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.tx }}>{b.n}</div>
                    <div style={{ fontSize: 9, color: T.mu }}>{b.d} {b.sec ? `• ${b.sec}` : ""}</div>
                  </div>
                  <div onClick={() => upd("biz", (prof.biz || []).filter((_, j) => j !== i))} style={{ cursor: "pointer", fontSize: 10, color: T.rd }}>✕</div>
                </div>
              ))}
              <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                <input value={newBiz.n} onChange={e => setNewBiz(p => ({ ...p, n: e.target.value }))} placeholder="Name" style={{ ...inpS, flex: 1 }} />
                <input value={newBiz.d} onChange={e => setNewBiz(p => ({ ...p, d: e.target.value }))} placeholder="Description" style={{ ...inpS, flex: 2 }} />
                <input value={newBiz.sec} onChange={e => setNewBiz(p => ({ ...p, sec: e.target.value }))} placeholder="Sector" style={{ ...inpS, flex: 1 }} />
                <Btn onClick={addBiz}>+</Btn>
              </div>
            </div>
          )}
          
          {/* Step 5: GitHub */}
          {step === 5 && (
            <div>
              <p style={{ fontSize: 12, color: T.mu, marginBottom: 12 }}>
                Optional: Enter your GitHub username and we'll scan your public repositories to identify your tech stack, project portfolio, and relevant industry sectors.
              </p>
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                <input value={ghUser} onChange={e => setGhUser(e.target.value)} placeholder="GitHub username" style={{ ...inpS, flex: 1 }}
                  onKeyDown={e => e.key === "Enter" && scanGH()} />
                <Btn primary onClick={scanGH} disabled={ghLoading}>{ghLoading ? "⏳ Scanning..." : "🔍 Scan Repos"}</Btn>
              </div>
              {ghError && <div style={{ fontSize: 10, color: T.rd, marginBottom: 8 }}>{ghError}</div>}
              {ghData && (
                <div style={{ animation: "fi .3s ease" }}>
                  <div style={{ padding: 12, background: T.sf, borderRadius: 10, marginBottom: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.gn, marginBottom: 6 }}>✅ Scanned {ghData.repoCount} repositories</div>
                    <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
                      <div style={{ fontSize: 10, color: T.mu }}>⭐ {ghData.totalStars} stars</div>
                      <div style={{ fontSize: 10, color: T.mu }}>🍴 {ghData.totalForks} forks</div>
                    </div>
                    {ghData.topLanguages.length > 0 && (
                      <div style={{ marginBottom: 6 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: T.sb, marginBottom: 3 }}>TOP LANGUAGES</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {ghData.topLanguages.map(l => (
                            <span key={l} style={{ padding: "2px 8px", background: T.am + "15", borderRadius: 6, fontSize: 10, color: T.am, fontWeight: 600 }}>{l}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {ghData.topics.length > 0 && (
                      <div style={{ marginBottom: 6 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: T.sb, marginBottom: 3 }}>TOPICS</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                          {ghData.topics.slice(0, 12).map(t => (
                            <span key={t} style={{ padding: "2px 6px", background: T.bd, borderRadius: 4, fontSize: 9, color: T.mu }}>{t}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {ghData.inferredSectors.length > 0 && (
                      <div style={{ fontSize: 10, color: T.cy, marginTop: 6 }}>
                        🏭 Auto-detected sectors: {ghData.inferredSectors.map(s => SECTOR_OPTIONS.find(o => o.id === s)?.label || s).join(", ")}
                      </div>
                    )}
                  </div>
                  {ghData.topProjects.length > 0 && (
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: T.sb, marginBottom: 4 }}>TOP PROJECTS (added as ventures)</div>
                      {ghData.topProjects.slice(0, 5).map(p => (
                        <div key={p.n} style={{ display: "flex", gap: 6, alignItems: "center", padding: "4px 0", borderBottom: `1px solid ${T.bd}` }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: T.tx, flex: 1 }}>{p.n}</div>
                          <div style={{ fontSize: 9, color: T.mu, flex: 2 }}>{(p.d || "").slice(0, 60)}</div>
                          {p.stars > 0 && <div style={{ fontSize: 9, color: T.am }}>⭐{p.stars}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {!ghData && !ghLoading && (
                <p style={{ fontSize: 11, color: T.dm, textAlign: "center", marginTop: 8 }}>No GitHub? No problem — skip this step.</p>
              )}
            </div>
          )}
          
          {/* Step 6: Review */}
          {step === 6 && (
            <div>
              <p style={{ fontSize: 12, color: T.mu, marginBottom: 12 }}>Here's your profile summary. You can always edit this later in Profile settings.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  ["👤 Name", prof.name || "Not set"],
                  ["📍 Location", prof.loc || "Not set"],
                  ["🏷️ Tags", (prof.tags || []).length + " selected"],
                  ["🏭 Sectors", (prof.sectors || []).length + " selected"],
                  ["🏢 Ventures", (prof.biz || []).length + " added"],
                  ["🔍 Search Keywords", generateSearches(prof.tags || [], prof.sectors || []).length + " generated"],
                  ["⚖️ Score Weights", generateScoreWeights(prof.tags || [], prof.sectors || []).length + " active"],
                  ["🐙 GitHub", prof.github || "Not connected"],
                ].map(([label, val]) => (
                  <div key={label} style={{ padding: 8, background: T.sf, borderRadius: 8 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: T.sb }}>{label}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.tx }}>{val}</div>
                  </div>
                ))}
              </div>
              {getAIKey() && prof.name && (
                <div style={{ marginTop: 12, padding: 10, background: `${T.am}08`, border: `1px solid ${T.am}20`, borderRadius: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.am, display: "flex", alignItems: "center", gap: 6 }}>
                    🤖 AI Auto-Generation
                  </div>
                  <div style={{ fontSize: 10, color: T.mu, marginTop: 4 }}>
                    On completion, AI will auto-generate all grant narratives from your profile — founder bio, impact statement, financial need, tech description, and more. This saves hours of writing.
                  </div>
                </div>
              )}
              {aiGenerating && (
                <div style={{ marginTop: 12, textAlign: "center", padding: 20 }}>
                  <div style={{ fontSize: 24, animation: "pulse 1.5s infinite", marginBottom: 8 }}>🤖</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.am }}>Generating grant narratives...</div>
                  <div style={{ fontSize: 10, color: T.mu, marginTop: 4 }}>AI is writing your founder bio, impact statement, financial need, and more from your profile data.</div>
                </div>
              )}
            </div>
          )}
          
          {/* Navigation */}
          {step > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, alignItems: "center" }}>
              <Btn onClick={() => setStep(s => s - 1)}>← Back</Btn>
              <div style={{ fontSize: 9, color: T.dm }}>{step < 6 ? "All steps optional" : ""}</div>
              {step < 6 ? (
                <Btn primary onClick={() => setStep(s => s + 1)}>{canNext ? "Next →" : "Skip →"}</Btn>
              ) : (
                <Btn primary onClick={finish} disabled={aiGenerating}>{aiGenerating ? "🤖 Generating..." : getAIKey() ? "✅ Complete & Generate Narratives" : "✅ Complete Setup"}</Btn>
              )}
            </div>
          )}
        </Cd>
      </div>
    </div>
  );
}

// ══════ AUTH GATE — Login/Signup Screen ══════
function AuthGate({ onAuth, onSkip }) {
  const [mode, setMode] = useState("login"); // login, signup, config
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fbConfig, setFbConfig] = useState(() => {
    try { return JSON.parse(localStorage.getItem("glp_pocketbase_config") || "{}"); } catch { return {}; }
  });

  const handleGoogle = async () => {
    setLoading(true); setError("");
    try { const user = await signInGoogle(); if (user) onAuth(user); } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const handleEmail = async () => {
    setLoading(true); setError("");
    try {
      let user;
      if (mode === "signup") user = await signUpEmail(email, pass);
      else user = await signInEmail(email, pass);
      if (user) onAuth(user);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const handleAnon = async () => {
    setLoading(true); setError("");
    try { const user = await signInAnon(); if (user) onAuth(user); } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const saveConfig = () => {
    try {
      localStorage.setItem("glp_pocketbase_config", JSON.stringify(fbConfig));
      if (initFirebase(fbConfig)) { setMode("login"); setError(""); }
      else setError("Invalid config — check your PocketBase URL");
    } catch (e) { setError(e.message); }
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--s)", position: "relative" }}>
      <style>{css}</style>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "20%", left: "30%", width: 400, height: 400, background: `radial-gradient(ellipse, ${T.am}06 0%, transparent 60%)`, filter: "blur(60px)" }}></div>
        <div style={{ position: "absolute", bottom: "20%", right: "20%", width: 300, height: 300, background: `radial-gradient(ellipse, ${T.bl}04 0%, transparent 60%)`, filter: "blur(50px)" }}></div>
      </div>

      <div style={{ width: 400, position: "relative", zIndex: 10, animation: "fi .5s cubic-bezier(.16,1,.3,1)" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: `linear-gradient(135deg, ${T.am}, ${T.am}88)`, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 28, boxShadow: `0 8px 32px ${T.am}25`, marginBottom: 16 }}>🎯</div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, fontFamily: "var(--d)", color: T.tx, letterSpacing: "-.03em" }}>Grant Lifecycle Platform</h1>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: T.mu }}>AI-powered grant discovery, drafting & management</p>
        </div>

        {mode !== "config" ? (
          <Cd glass sx={{ padding: 24 }}>
            {/* Connection Status */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: isFirebaseReady() ? T.gn : T.or, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: isFirebaseReady() ? T.gn : T.or, display: "inline-block" }}></span>
                {isFirebaseReady() ? "Cloud sync enabled" : "Offline mode (local storage)"}
              </div>
              <button onClick={() => setMode("config")} style={{ background: "none", border: "none", color: T.mu, fontSize: 10, cursor: "pointer", textDecoration: "underline" }}>Configure PocketBase</button>
            </div>

            {isFirebaseReady() ? (
              <>
                {/* Google Sign In */}
                <button onClick={handleGoogle} disabled={loading} style={{
                  width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid ${T.bd}`,
                  background: T.cd, color: T.tx, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  fontFamily: "var(--s)", marginBottom: 10,
                }}>
                  <span style={{ fontSize: 18 }}>🔵</span> Continue with Google
                </button>

                {/* Divider */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "14px 0" }}>
                  <div style={{ flex: 1, height: 1, background: T.bd }}></div>
                  <span style={{ fontSize: 10, color: T.mu }}>or</span>
                  <div style={{ flex: 1, height: 1, background: T.bd }}></div>
                </div>

                {/* Email/Password */}
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" style={{ ...inpS, marginBottom: 8 }} />
                <input value={pass} onChange={e => setPass(e.target.value)} placeholder="Password" type="password" style={{ ...inpS, marginBottom: 12 }} onKeyDown={e => e.key === "Enter" && handleEmail()} />
                <Btn primary onClick={handleEmail} disabled={loading || !email || !pass}>
                  {loading ? "⏳" : mode === "signup" ? "Create Account" : "Sign In"}
                </Btn>
                <button onClick={() => setMode(mode === "signup" ? "login" : "signup")} style={{ background: "none", border: "none", color: T.am, fontSize: 11, cursor: "pointer", marginLeft: 10 }}>
                  {mode === "signup" ? "Have an account? Sign in" : "Need an account? Sign up"}
                </button>

                {/* Anonymous */}
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T.bd}30` }}>
                  <button onClick={handleAnon} disabled={loading} style={{ background: "none", border: "none", color: T.mu, fontSize: 11, cursor: "pointer" }}>
                    Try anonymously (data synced, can upgrade later)
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 12, color: T.sb, marginBottom: 14, lineHeight: 1.6 }}>
                  PocketBase is not configured. You can either configure it for cloud sync & multi-user, or continue in local-only mode.
                </div>
                <Btn primary onClick={onSkip}>🚀 Continue Offline (localStorage)</Btn>
                <button onClick={() => setMode("config")} style={{ background: "none", border: "none", color: T.am, fontSize: 11, cursor: "pointer", marginLeft: 12 }}>
                  Setup PocketBase →
                </button>
              </>
            )}

            {error && <div style={{ marginTop: 10, padding: "8px 12px", background: T.rd + "12", border: `1px solid ${T.rd}25`, borderRadius: 8, fontSize: 11, color: T.rd }}>⚠️ {error}</div>}
          </Cd>
        ) : (
          <Cd glass sx={{ padding: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.tx, marginBottom: 4, fontFamily: "var(--d)" }}>🔧 PocketBase Configuration</div>
            <div style={{ fontSize: 11, color: T.mu, marginBottom: 14, lineHeight: 1.6 }}>
              1. Download PocketBase from <span style={{ color: T.gn }}>pocketbase.io</span> (single binary)<br/>
              2. Run: <code style={{ color: T.am, background: T.bg, padding: "1px 4px", borderRadius: 3 }}>./pocketbase serve</code><br/>
              3. Open Admin UI at <span style={{ color: T.bl }}>http://your-server:8090/_/</span><br/>
              4. Create collections using the setup guide below<br/>
              5. Paste your PocketBase URL here
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: T.am, fontFamily: "var(--m)", marginBottom: 3, fontWeight: 700 }}>PocketBase URL</div>
              <input value={fbConfig.url || ""} onChange={e => setFbConfig(prev => ({ ...prev, url: e.target.value }))} placeholder="https://pb.unlessrx.com" style={{ ...inpS, fontSize: 11 }} />
              <div style={{ fontSize: 9, color: T.dm, marginTop: 3 }}>No API key needed — PocketBase handles auth internally</div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <Btn primary onClick={saveConfig}>🔌 Connect to PocketBase</Btn>
              <Btn onClick={() => setMode("login")}>← Back</Btn>
            </div>
            {isFirebaseReady() && (
              <div style={{ marginTop: 14, padding: 12, background: `${T.gn}08`, border: `1px solid ${T.gn}20`, borderRadius: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.gn, marginBottom: 6 }}>✅ Connected! Create these collections in your PocketBase Admin UI:</div>
                <div style={{ position: "relative" }}>
                  <pre style={{ fontSize: 8, color: T.sb, background: T.bg, padding: 10, borderRadius: 6, maxHeight: 200, overflowY: "auto", lineHeight: 1.5, fontFamily: "var(--m)", border: `1px solid ${T.bd}`, whiteSpace: "pre-wrap" }}>{getSetupSQL()}</pre>
                  <button onClick={() => navigator.clipboard.writeText(getSetupSQL())} style={{ position: "absolute", top: 4, right: 4, padding: "2px 8px", fontSize: 9, background: T.cd, border: `1px solid ${T.bd}`, borderRadius: 4, color: T.am, cursor: "pointer" }}>📋 Copy</button>
                </div>
              </div>
            )}
            {error && <div style={{ marginTop: 10, padding: "8px 12px", background: T.rd + "12", borderRadius: 8, fontSize: 11, color: T.rd }}>⚠️ {error}</div>}
          </Cd>
        )}
      </div>
    </div>
  );
}

// ══════ APP WRAPPER — PocketBase auth or offline mode ══════
export default function App() {
  const [authState, setAuthState] = useState("loading"); // loading, auth, offline
  const [user, setUser] = useState(null);
  const [migrated, setMigrated] = useState(false);

  useEffect(() => {
    // Default PocketBase URL — pre-configured for your server
    const DEFAULT_PB_URL = "https://pb.unlessrx.com";
    
    // Try saved config first, then fall back to default
    try {
      const savedConfig = JSON.parse(localStorage.getItem("glp_pocketbase_config") || "{}");
      if (savedConfig.url) {
        initFirebase(savedConfig);
      } else {
        // Auto-connect to default server
        initFirebase({ url: DEFAULT_PB_URL });
      }
    } catch {
      initFirebase({ url: DEFAULT_PB_URL });
    }

    if (isFirebaseReady()) {
      const unsub = onAuthChange(async (u) => {
        if (u) {
          setUser(u);
          if (!migrated) {
            await migrateFromLocalStorage(u.id);
            setMigrated(true);
          }
          setAuthState("auth");
        } else {
          setUser(null);
          setAuthState("login");
        }
      });
      return unsub;
    } else {
      setAuthState("login");
    }
  }, []);

  if (authState === "loading") return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", animation: "fi .3s ease" }}>
        <div style={{ fontSize: 40, marginBottom: 12, animation: "pulse 1.5s infinite" }}>🎯</div>
        <div style={{ fontSize: 12, color: T.mu, fontFamily: "'DM Sans', sans-serif" }}>Loading...</div>
      </div>
    </div>
  );

  if (authState === "login") return <AuthGate onAuth={(u) => { setUser(u); setAuthState("auth"); }} onSkip={() => setAuthState("offline")} />;

  // Check if onboarding needed — look at current saved profile
  const savedProfile = (() => { try { return JSON.parse(localStorage.getItem("glp_v5_profile") || "null"); } catch { return null; } })();
  const needsOnboarding = !savedProfile || !savedProfile.setupComplete;
  
  if (needsOnboarding) {
    return <OnboardingWizard onComplete={(profile) => {
      try { localStorage.setItem("glp_v5_profile", JSON.stringify(profile)); } catch {}
      // Force re-render by updating a trivial state
      setAuthState(prev => prev === "auth" ? "auth" : prev);
      window.location.reload(); // cleanest way to reinit with new profile
    }} />;
  }

  return <AppCore user={user} mode={authState === "auth" ? "firebase" : "offline"} onLogout={async () => { await logOut(); setAuthState("login"); }} />;
}

// ══════ APP CORE — Main application (works in both Firebase and offline mode) ══════
function AppCore({ user, mode, onLogout }) {
  const uid = user?.id || user?.uid || "local";
  const isCloud = mode === "firebase" && isFirebaseReady() && uid !== "local";

  const [tab, sTab] = useState(load("tab", "dash"));
  // Profile is reactive state — loaded from localStorage, saved on every change
  // Profile: merge loaded data with defaults so new fields never crash
  const [profile, _setProfile] = useState(() => {
    const saved = load("profile", null);
    if (!saved) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...saved, narr: { ...DEFAULT_PROFILE.narr, ...(saved.narr || {}) }, expenses: { ...DEFAULT_PROFILE.expenses, ...(saved.expenses || {}) }, income: { ...DEFAULT_PROFILE.income, ...(saved.income || {}) } };
  });
  
  // P is module-level so all components can access it — synced with profile state
  P = profile;
  
  // Dynamic score weights — regenerate when profile changes
  useEffect(() => {
    const stateAbbr = P.state ? P.state.substring(0, 2).toLowerCase() : "";
    const weights = generateScoreWeights(P.tags || [], P.sectors || []);
    if (P.state) weights.push({ kw: [P.state.toLowerCase(), stateAbbr, P.loc ? P.loc.split(",")[0].toLowerCase() : ""], w: 10, cat: P.state, type: "match" });
    ACTIVE_SCORE_WEIGHTS = weights;
  }, [P.tags, P.sectors, P.state, P.loc]);
  
  // Dynamic Discovery searches — regenerate when profile changes
  const dynamicSearches = useMemo(() => generateSearches(P.tags || [], P.sectors || []), [P.tags, P.sectors]);
  
  // Dynamic Census config — derive from profile location
  const censusConfig = useMemo(() => ({
    state: STATE_FIPS[P.state] || "",
    county: P.countyFips || "",
    name: P.county || "",
    city: P.loc ? P.loc.split(",")[0].trim() : "",
  }), [P.state, P.countyFips, P.county, P.loc]);

  const [grants, _sG] = useState(() => load("grants", IG));
  const [docs, _sD] = useState(() => load("docs", INIT_DOCS));
  const [contacts, _sC] = useState(() => load("contacts", INIT_CONTACTS));
  const [saved, setSaved] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsgs, setChatMsgs] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(() => { try { return !localStorage.getItem("glp_tour_done"); } catch { return true; } });
  const [prepGrant, setPrepGrant] = useState(null); // grant object for One-Click Prep modal
  const intel = useIntelligence(grants, docs);
  const workflow = useWorkflow(grants, docs);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      // ⌘K or Ctrl+K — Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setCmdOpen(prev => !prev); }
      // Escape closes command palette
      if (e.key === "Escape" && cmdOpen) setCmdOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cmdOpen]);

  // Persistent setters — save to localStorage AND Firestore when in cloud mode
  const sG = (fn) => _sG(prev => { const next = typeof fn === "function" ? fn(prev) : fn; save("grants", next); if (isCloud) saveGrants(uid, next).catch(() => {}); return next; });
  const sD = (fn) => _sD(prev => { const next = typeof fn === "function" ? fn(prev) : fn; save("docs", next); if (isCloud) saveDocs(uid, next).catch(() => {}); return next; });
  const sC = (fn) => _sC(prev => { const next = typeof fn === "function" ? fn(prev) : fn; save("contacts", next); if (isCloud) saveContacts(uid, next).catch(() => {}); return next; });
  const setTab = (t) => { sTab(t); save("tab", t); };

  // Persistent profile setter — syncs to cloud
  const setProfile = (fn) => _setProfile(prev => { 
    const next = typeof fn === "function" ? fn(prev) : fn; 
    save("profile", next);
    if (isCloud) saveUserProfile(uid, next).catch(() => {});
    return next; 
  });

  // Load data from Firestore on first mount if in cloud mode
  useEffect(() => {
    if (!isCloud) return;
    loadUserProfile(uid).then(cloudProfile => {
      if (cloudProfile) {
        const merged = { ...DEFAULT_PROFILE, ...cloudProfile, narr: { ...DEFAULT_PROFILE.narr, ...(cloudProfile.narr || {}) }, expenses: { ...DEFAULT_PROFILE.expenses, ...(cloudProfile.expenses || {}) }, income: { ...DEFAULT_PROFILE.income, ...(cloudProfile.income || {}) } };
        _setProfile(merged);
        save("profile", merged);
      }
    }).catch(() => {});
  }, [isCloud, uid]);

  // Export all data as JSON — includes funders and saved searches
  const exportData = () => {
    let funders = [], savedSearches = [], progs = null, progNotes = {}, actionsDone = {}, actionsNotes = {}, docWiz = {}, tplEdits = {};
    try { funders = JSON.parse(localStorage.getItem("glp_v5_funders") || "[]"); } catch {}
    try { savedSearches = JSON.parse(localStorage.getItem("glp_v5_saved_searches") || "[]"); } catch {}
    try { progs = JSON.parse(localStorage.getItem("glp_v5_progs")); } catch {}
    try { progNotes = JSON.parse(localStorage.getItem("glp_v5_prog_notes") || "{}"); } catch {}
    try { actionsDone = JSON.parse(localStorage.getItem("glp_v5_actions_done") || "{}"); } catch {}
    try { actionsNotes = JSON.parse(localStorage.getItem("glp_v5_actions_notes") || "{}"); } catch {}
    try { docWiz = JSON.parse(localStorage.getItem("glp_v5_docwiz") || "{}"); } catch {}
    try { tplEdits = JSON.parse(localStorage.getItem("glp_v5_tpl_edits") || "{}"); } catch {}
    const data = { grants, docs, contacts, funders, savedSearches, progs, progNotes, actionsDone, actionsNotes, docWiz, tplEdits, profile, exportDate: new Date().toISOString(), version: "10.7", modules: 22, apis: ["grants.gov-search2","usaspending-awards","usaspending-agency","usaspending-recipients","usaspending-trends","usaspending-cfda-programs","usaspending-county-spending","usaspending-local-awards","usaspending-cfda-autocomplete","sbir-awards","federal-register","census-acs","census-narrative-gen","propublica-nonprofits","fac-single-audit","regulations-gov","simpler-grants-gov","sam-gov-entity","sam-gov-verify","claude-drafter","claude-rfp","claude-reports","claude-briefing","claude-narratives","claude-doc-gap"] };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `grant-platform-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click(); URL.revokeObjectURL(url);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
    showToast("Backup exported successfully");
  };

  // Import data from JSON — restores funders and saved searches too
  const importData = () => {
    const input = document.createElement("input"); input.type = "file"; input.accept = ".json";
    input.onchange = (e) => {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          if (data.grants) { _sG(data.grants); save("grants", data.grants); }
          if (data.docs) { _sD(data.docs); save("docs", data.docs); }
          if (data.contacts) { _sC(data.contacts); save("contacts", data.contacts); }
          if (data.funders) { try { localStorage.setItem("glp_v5_funders", JSON.stringify(data.funders)); } catch {} }
          if (data.savedSearches) { try { localStorage.setItem("glp_v5_saved_searches", JSON.stringify(data.savedSearches)); } catch {} }
          if (data.progs) { try { localStorage.setItem("glp_v5_progs", JSON.stringify(data.progs)); } catch {} }
          if (data.progNotes) { try { localStorage.setItem("glp_v5_prog_notes", JSON.stringify(data.progNotes)); } catch {} }
          if (data.actionsDone) { try { localStorage.setItem("glp_v5_actions_done", JSON.stringify(data.actionsDone)); } catch {} }
          if (data.actionsNotes) { try { localStorage.setItem("glp_v5_actions_notes", JSON.stringify(data.actionsNotes)); } catch {} }
          if (data.docWiz) { try { localStorage.setItem("glp_v5_docwiz", JSON.stringify(data.docWiz)); } catch {} }
          if (data.tplEdits) { try { localStorage.setItem("glp_v5_tpl_edits", JSON.stringify(data.tplEdits)); } catch {} }
          if (data.profile) { _setProfile(data.profile); save("profile", data.profile); }
          setSaved(true); setTimeout(() => setSaved(false), 2000);
          showToast("Data restored! Refresh to see all changes.", "success", 5000);
        } catch (err) { showToast("Invalid backup file", "warn"); }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Reset to defaults
  const resetData = () => {
    if (!confirm("Reset all data to defaults? This cannot be undone.")) return;
    _sG(IG); _sD(INIT_DOCS); _sC(INIT_CONTACTS); _setProfile(DEFAULT_PROFILE);
    save("grants", IG); save("docs", INIT_DOCS); save("contacts", INIT_CONTACTS); save("profile", DEFAULT_PROFILE);
  };

  // Tab groups for organized navigation
  const tabGroups = [
    { label: "Command", tabs: [
      { k: "dash", l: "Dashboard", ic: "📊" }, { k: "strategy", l: "Strategy", ic: "🧠" },
    ]},
    { label: "Discovery", tabs: [
      { k: "discover", l: "Discover", ic: "📡" }, { k: "awards", l: "Awards", ic: "🏆" },
      { k: "funder", l: "Funders", ic: "🔍" }, { k: "match", l: "Matcher", ic: "🎯" },
    ]},
    { label: "Build", tabs: [
      { k: "pipe", l: "Pipeline", ic: "📋" }, { k: "tpl", l: "Templates", ic: "📑" },
      { k: "aidraft", l: "AI Drafter", ic: "✍️" }, { k: "rfpparse", l: "RFP Parser", ic: "📄" },
    ]},
    { label: "Manage", tabs: [
      { k: "docbuild", l: "Documents", ic: "📁" }, { k: "comply", l: "Compliance", ic: "✅" },
      { k: "finmodel", l: "Financials", ic: "💰" }, { k: "reports", l: "Reports", ic: "📈" },
    ]},
    { label: "Analyze", tabs: [
      { k: "analytics", l: "Analytics", ic: "📉" }, { k: "census", l: "Community", ic: "🏘️" },
      { k: "crm", l: "Contacts", ic: "👥" }, { k: "time", l: "Timeline", ic: "📅" },
    ]},
    { label: "", tabs: [
      { k: "profile", l: "Profile", ic: "⚙️" }, { k: "personal", l: "Programs", ic: "🛡️" },
      { k: "actions", l: "Actions", ic: "⚡" }, { k: "res", l: "Resources", ic: "🔗" },
    ]},
  ];

  const initials = (P.name || "U").substring(0, 2).toUpperCase();
  const activeGroup = tabGroups.find(g => g.tabs.some(t => t.k === tab));
  const activeTab = tabGroups.flatMap(g => g.tabs).find(t => t.k === tab);

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "var(--s)", position: "relative" }}>
      <style>{css}</style>

      {/* Atmospheric background — gradient mesh */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-10%", left: "10%", width: 500, height: 500, background: `radial-gradient(ellipse, ${T.am}04 0%, transparent 60%)`, filter: "blur(60px)" }}></div>
        <div style={{ position: "absolute", top: "30%", right: "5%", width: 400, height: 400, background: `radial-gradient(ellipse, ${T.bl}03 0%, transparent 60%)`, filter: "blur(50px)" }}></div>
        <div style={{ position: "absolute", bottom: "10%", left: "30%", width: 300, height: 300, background: `radial-gradient(ellipse, ${T.pu}02 0%, transparent 60%)`, filter: "blur(40px)" }}></div>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${T.bd}06 1px, transparent 1px), linear-gradient(90deg, ${T.bd}06 1px, transparent 1px)`, backgroundSize: "60px 60px", opacity: .3 }}></div>
      </div>

      {/* ══ SIDEBAR NAVIGATION ══ */}
      <div className="sidebar-nav" style={{
        position: "fixed", top: 0, left: 0, bottom: 0, width: 220, zIndex: 40,
        background: `linear-gradient(180deg, ${T.pn}f8, ${T.bg}f8)`,
        backdropFilter: "blur(20px) saturate(180%)",
        borderRight: `1px solid ${T.bd}50`,
        display: "flex", flexDirection: "column",
        overflowY: "auto", overflowX: "hidden",
      }}>
        {/* Logo */}
        <div style={{ padding: "20px 16px 16px", borderBottom: `1px solid ${T.bd}30` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: `linear-gradient(135deg, ${T.am}, ${T.am}88)`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
              boxShadow: `0 4px 20px ${T.am}20, inset 0 1px 0 rgba(255,255,255,.15)`,
            }}>🎯</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--d)", color: T.tx, letterSpacing: "-.02em" }}>GLP</div>
              <div style={{ fontSize: 9, color: T.mu, fontFamily: "var(--m)", marginTop: 2 }}>v10 · {grants.length} grants</div>
            </div>
          </div>
        </div>

        {/* Nav groups */}
        <div style={{ flex: 1, padding: "4px 0" }}>
          {tabGroups.map((group, gi) => (
            <div key={gi}>
              {group.label && <div className="nav-label">{group.label}</div>}
              {group.tabs.map(t => {
                const active = tab === t.k;
                return (
                  <button key={t.k} onClick={() => setTab(t.k)} style={{
                    display: "flex", alignItems: "center", gap: 10, width: "calc(100% - 12px)",
                    margin: "1px 6px", padding: "8px 12px", border: "none", borderRadius: 8,
                    fontSize: 12, fontWeight: active ? 600 : 400, fontFamily: "var(--s)",
                    cursor: "pointer", textAlign: "left",
                    background: active ? `linear-gradient(135deg, ${T.am}12, ${T.am}06)` : "transparent",
                    color: active ? T.am : T.sb,
                    boxShadow: active ? `inset 0 0 0 1px ${T.am}15` : "none",
                    position: "relative",
                  }}>
                    {active && <div style={{ position: "absolute", left: 0, top: "20%", bottom: "20%", width: 3, borderRadius: 99, background: T.am, boxShadow: `0 0 8px ${T.am}40` }}></div>}
                    <span style={{ fontSize: 15, width: 22, textAlign: "center", filter: active ? "none" : "grayscale(.5) opacity(.7)" }}>{t.ic}</span>
                    <span>{t.l}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom user area */}
        <div style={{ padding: "12px 12px 16px", borderTop: `1px solid ${T.bd}30` }}>
          {/* Cloud sync status */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 8, padding: "4px 0" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: isCloud ? T.gn : T.or, display: "inline-block", boxShadow: isCloud ? `0 0 6px ${T.gn}` : "none" }}></span>
            <span style={{ fontSize: 9, color: isCloud ? T.gn : T.or, fontFamily: "var(--m)" }}>{isCloud ? "Cloud sync" : "Local mode"}</span>
          </div>
          <div style={{ display: "flex", gap: 4, marginBottom: 8, justifyContent: "center" }}>
            <Btn small ghost onClick={exportData}>💾</Btn>
            <Btn small ghost onClick={importData}>📂</Btn>
            <Btn small ghost onClick={() => setTourOpen(true)} title="Restart tour">🎓</Btn>
            <Btn small ghost onClick={resetData}>↺</Btn>
            {onLogout && <Btn small ghost onClick={onLogout}>🚪</Btn>}
          </div>
          <div onClick={() => setTab("profile")} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10,
            background: tab === "profile" ? `${T.am}08` : `${T.cd}60`, cursor: "pointer",
            border: `1px solid ${tab === "profile" ? T.am + "20" : T.bd}40`, transition: "all .2s",
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: `linear-gradient(135deg, ${T.pu}30, ${T.bl}20)`,
              border: `1px solid ${T.pu}20`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700, color: T.pu, fontFamily: "var(--m)",
            }}>{user?.photoURL ? <img src={user.photoURL} style={{ width: 28, height: 28, borderRadius: 7 }} /> : initials}</div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.tx }}>{user?.displayName || P.name || "User"}</div>
              <div style={{ fontSize: 9, color: T.mu }}>{user?.email || P.loc || "Set location"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ MAIN CONTENT AREA ══ */}
      <div className="main-area" style={{ marginLeft: 220, minHeight: "100vh", position: "relative" }}>
        {/* Top breadcrumb bar */}
        <div style={{
          position: "sticky", top: 0, zIndex: 30, padding: "12px 28px",
          background: `${T.bg}d8`, backdropFilter: "blur(20px) saturate(180%)",
          borderBottom: `1px solid ${T.bd}40`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {activeGroup?.label && <span style={{ fontSize: 10, color: T.dm, fontFamily: "var(--m)", textTransform: "uppercase", letterSpacing: ".1em" }}>{activeGroup.label}</span>}
            {activeGroup?.label && <span style={{ fontSize: 10, color: T.dm }}>›</span>}
            <span style={{ fontSize: 13, fontWeight: 600, color: T.tx, display: "flex", alignItems: "center", gap: 6 }}>
              <span>{activeTab?.ic}</span> {activeTab?.l || "Dashboard"}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {saved && <span style={{ fontSize: 10, color: T.gn, fontWeight: 600, animation: "fadeIn .2s" }}>✓ Saved</span>}
            <div onClick={() => setCmdOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 8, border: `1px solid ${T.bd}60`, cursor: "pointer", background: `${T.sf}80`, transition: "border-color .15s" }} title="Search (⌘K)">
              <span style={{ fontSize: 10, color: T.dm }}>🔍</span>
              <span style={{ fontSize: 10, color: T.dm, fontFamily: "var(--m)" }}>⌘K</span>
            </div>
            <div style={{ fontSize: 10, color: T.mu, fontFamily: "var(--m)" }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.gn, display: "inline-block", boxShadow: `0 0 6px ${T.gn}`, marginRight: 6 }}></span>22 modules
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ position: "relative", zIndex: 5, padding: "28px 28px 48px", maxWidth: 1100 }}>
          {tab === "dash" && <Dash G={grants} D={docs} PR={PROGS} intel={intel} workflow={workflow} onNav={setTab} apiIntel={{ censusData, awardIntel, cfdaPrograms, localAwards, spendTrends, topRecipients, sbirIntel, funderIntel, facIntel, fedRegResults, regsIntel, countySpending, state: P?.loc?.state || "IL" }} />}
          {tab === "strategy" && <Strategy intel={intel} onNav={setTab} />}
          {tab === "pipe" && <Pipe G={grants} sG={sG} onNav={setTab} onPrep={setPrepGrant} />}
          {tab === "discover" && <Discovery G={grants} sG={sG} onNav={setTab} searches={dynamicSearches} />}
          {tab === "awards" && <AwardIntel G={grants} sG={sG} onNav={setTab} />}
          {tab === "tpl" && <AppTpl G={grants} onNav={setTab} />}
          {tab === "aidraft" && <AIDrafter G={grants} onNav={setTab} intel={{ censusData, awardIntel, cfdaPrograms, localAwards, spendTrends, topRecipients, sbirIntel, funderIntel, facIntel, fedRegResults, regsIntel, countySpending, simplerResults, samVerification, state: P?.loc?.state || "IL" }} />}
          {tab === "rfpparse" && <RFPParser G={grants} sG={sG} onNav={setTab} />}
          {tab === "docbuild" && <DocBuilder docs={docs} setDocs={sD} onNav={setTab} grants={grants} />}
          {tab === "finmodel" && <FinModel G={grants} onNav={setTab} />}
          {tab === "comply" && <Compliance G={grants} sG={sG} onNav={setTab} />}
          {tab === "reports" && <ReportGen G={grants} D={docs} onNav={setTab} />}
          {tab === "analytics" && <Analytics G={grants} onNav={setTab} />}
          {tab === "funder" && <FunderResearch onNav={setTab} />}
          {tab === "census" && <CommunityData onNav={setTab} censusConfig={censusConfig} />}
          {tab === "crm" && <CRM contacts={contacts} setC={sC} G={grants} onNav={setTab} />}
          {tab === "time" && <TL G={grants} onNav={setTab} />}
          {tab === "profile" && <ProfileEditor P={P} setP={setProfile} onNav={setTab} />}
          {tab === "personal" && <Personal onNav={setTab} />}
          {tab === "match" && <Match onNav={setTab} />}
          {tab === "actions" && <Actions onNav={setTab} />}
          {tab === "res" && <Res onNav={setTab} />}
        </div>

        {/* Footer */}
        <div style={{ position: "relative", zIndex: 5, padding: "20px 28px", borderTop: `1px solid ${T.bd}30` }}>
          <div style={{ fontSize: 9, color: T.dm, fontFamily: "var(--m)", letterSpacing: ".08em", textAlign: "center" }}>
            GRANT LIFECYCLE PLATFORM v10.0 · 22 MODULES · AI-POWERED · {new Date().toLocaleDateString()}
          </div>
        </div>

        {/* ══ FLOATING AI CHAT BAR ══ */}
        <div style={{
          position: "fixed", bottom: chatOpen ? 0 : 0, right: 24, zIndex: 60,
          width: chatOpen ? 420 : "auto",
          transition: "all .3s cubic-bezier(.16,1,.3,1)",
        }}>
          {/* Chat panel */}
          {chatOpen && (
            <div style={{
              background: `${T.pn}f8`, backdropFilter: "blur(20px) saturate(180%)",
              border: `1px solid ${T.bd}60`, borderRadius: "16px 16px 0 0",
              boxShadow: `0 -8px 40px rgba(0,0,0,.4), 0 0 60px ${T.am}04`,
              animation: "slideUp .3s cubic-bezier(.16,1,.3,1)",
              maxHeight: "60vh", display: "flex", flexDirection: "column",
            }}>
              {/* Chat header */}
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.bd}40`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>🧠</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.tx, fontFamily: "var(--d)" }}>AI Assistant</div>
                    <div style={{ fontSize: 9, color: T.mu }}>Ask about grants, strategy, or get help with applications</div>
                  </div>
                </div>
                <button onClick={() => setChatOpen(false)} style={{ background: "none", border: "none", color: T.mu, cursor: "pointer", fontSize: 16 }}>✕</button>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", minHeight: 200, maxHeight: "40vh" }}>
                {chatMsgs.length === 0 && (
                  <div style={{ textAlign: "center", padding: "30px 10px" }}>
                    <div style={{ fontSize: 28, marginBottom: 10, opacity: .5 }}>🧠</div>
                    <div style={{ fontSize: 11, color: T.mu, marginBottom: 12 }}>Ask me anything about your grant portfolio</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {["What should I prioritize this week?", "Which grants am I most likely to win?", "Draft an executive summary for my top grant", "What documents am I missing?"].map(q => (
                        <button key={q} onClick={async () => {
                          setChatMsgs(prev => [...prev, { role: "user", text: q }]);
                          setChatLoading(true);
                          try {
                            const res = await callAI(
                              `You are an AI grant strategy assistant embedded in a Grant Lifecycle Platform. You have full context about the user's profile, grants, documents, and live intelligence data from 15 federal APIs (Census demographics, USAspending awards, CFDA programs, local awards, spending trends, SBIR data, ProPublica nonprofit research, FAC audits, Federal Register NOFOs, and Regulations.gov). Be concise, actionable, and reference specific grants by name. Use real data when available. Keep responses under 300 words.\n\n${buildPortfolioContext(P, grants, docs)}${buildIntelligenceContext({ censusData, awardIntel, cfdaPrograms, localAwards, spendTrends, topRecipients, sbirIntel, funderIntel, facIntel, fedRegResults, regsIntel, countySpending, state: P?.loc?.state || "IL" })}`,
                              q
                            );
                            setChatMsgs(prev => [...prev, { role: "ai", text: res }]);
                          } catch (e) { setChatMsgs(prev => [...prev, { role: "ai", text: "Error: " + e.message }]); }
                          setChatLoading(false);
                        }} style={{ padding: "6px 10px", background: `${T.am}08`, border: `1px solid ${T.am}15`, borderRadius: 8, color: T.am, fontSize: 10, cursor: "pointer", textAlign: "left", fontFamily: "var(--s)" }}>{q}</button>
                      ))}
                    </div>
                  </div>
                )}
                {chatMsgs.map((m, i) => (
                  <div key={i} style={{
                    marginBottom: 10, display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                  }}>
                    <div style={{
                      maxWidth: "85%", padding: "8px 12px", borderRadius: 12,
                      background: m.role === "user" ? `linear-gradient(135deg, ${T.am}20, ${T.am}10)` : `${T.cd}80`,
                      border: `1px solid ${m.role === "user" ? T.am + "20" : T.bd}`,
                      fontSize: 11, color: T.tx, lineHeight: 1.6, whiteSpace: "pre-wrap",
                    }}>{m.text}</div>
                  </div>
                ))}
                {chatLoading && (
                  <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 10 }}>
                    <div style={{ padding: "8px 16px", background: `${T.cd}80`, borderRadius: 12, border: `1px solid ${T.bd}` }}>
                      <span style={{ animation: "pulse 1s infinite", fontSize: 11, color: T.mu }}>Thinking...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div style={{ padding: "10px 16px 14px", borderTop: `1px solid ${T.bd}30` }}>
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    placeholder="Ask about grants, strategy, applications..."
                    style={{ ...inpS, flex: 1, borderRadius: 10, fontSize: 11 }}
                    onKeyDown={async (e) => {
                      if (e.key === "Enter" && e.target.value.trim() && !chatLoading) {
                        const q = e.target.value.trim(); e.target.value = "";
                        setChatMsgs(prev => [...prev, { role: "user", text: q }]);
                        setChatLoading(true);
                        try {
                          const history = chatMsgs.slice(-6).map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.text }));
                          const res = await callAI(
                            `You are an AI grant strategy assistant. You have full context about the user and live intelligence data from 15 federal APIs. Be concise and actionable. Reference specific grants by name and cite real data when relevant. Keep responses under 300 words.\n\n${buildPortfolioContext(P, grants, docs)}${buildIntelligenceContext({ censusData, awardIntel, cfdaPrograms, localAwards, spendTrends, topRecipients, sbirIntel, funderIntel, facIntel, fedRegResults, regsIntel, countySpending, state: P?.loc?.state || "IL" })}`,
                            [...history, { role: "user", content: q }]
                          );
                          setChatMsgs(prev => [...prev, { role: "ai", text: res }]);
                        } catch (e) { setChatMsgs(prev => [...prev, { role: "ai", text: "Error: " + e.message }]); }
                        setChatLoading(false);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Chat toggle button */}
          {!chatOpen && (
            <button onClick={() => setChatOpen(true)} style={{
              position: "fixed", bottom: 20, right: 24,
              width: 52, height: 52, borderRadius: 14,
              background: `linear-gradient(135deg, ${T.am}, ${T.am}cc)`,
              border: "none", cursor: "pointer", fontSize: 22,
              boxShadow: `0 4px 24px ${T.am}30, inset 0 1px 0 rgba(255,255,255,.15)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              animation: "glow 3s infinite",
            }}>🧠</button>
          )}
        </div>

        {/* ══ GLOBAL OVERLAYS ══ */}
        <ToastContainer />
        <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} onNav={(k) => setTab(k)} grants={grants} />
        <MobileNav tab={tab} setTab={setTab} />
        {tourOpen && <GuidedTour onClose={() => setTourOpen(false)} onNav={setTab} />}
        {prepGrant && <AppPrepModal grant={prepGrant} onClose={() => setPrepGrant(null)} profile={profile} intel={{ censusData, awardIntel, cfdaPrograms, localAwards, spendTrends, topRecipients, sbirIntel, funderIntel, facIntel, fedRegResults, regsIntel, countySpending, state: P?.loc?.state || "IL" }} />}
      </div>
    </div>
  );
}
