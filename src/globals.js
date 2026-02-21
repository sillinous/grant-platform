
// ════════════════════════════════════════════════════════════════════════
// GRANT LIFECYCLE PLATFORM v5.2 — GLOBALS & UTILITIES
// ════════════════════════════════════════════════════════════════════════

// ─── THEME ─────────────────────────────────────────────────────────────
export const T = {
    bg: "#020203", panel: "#0A0A0F", card: "#0A0A0F", border: "#1A1A25",
    borderHi: "#2A2A38", text: "#F1EFF0", sub: "#8F8F9A", mute: "#5a6880",
    dim: "#1E1E2A", amber: "#F3A319", amberDim: "#8b6b3d", green: "#17A16D",
    red: "#DA2C0C", blue: "#4526E4", purple: "#7C3AED", yellow: "#FBBF24",
    orange: "#F97316", cyan: "#06B6D4", amberGlow: "rgba(243,163,25,0.08)",
    glass: "rgba(10,10,15,0.75)", gradient: "linear-gradient(135deg,#4526E4,#7C3AED)",
};

// ─── UTILITIES ─────────────────────────────────────────────────────────
export const LS = {
    get: (k, d = null) => { try { const v = localStorage.getItem(`gp_${k}`); return v ? JSON.parse(v) : d; } catch { return d; } },
    set: (k, v) => { try { localStorage.setItem(`gp_${k}`, JSON.stringify(v)); } catch (e) { console.warn("LS set error", e); } },
    del: (k) => { try { localStorage.removeItem(`gp_${k}`); } catch (e) { console.warn("LS del error", e); } },
};

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

// ─── i18n & CURRENCY ──────────────────────────────────────────────────
export const CURRENCIES = {
    USD: { symbol: "$", label: "US Dollar", locale: "en-US" },
    EUR: { symbol: "€", label: "Euro", locale: "de-DE" },
    GBP: { symbol: "£", label: "British Pound", locale: "en-GB" },
    CAD: { symbol: "C$", label: "Canadian Dollar", locale: "en-CA" }
};

export const LANGS = {
    en: { label: "English", flag: "🇺🇸" },
    es: { label: "Español", flag: "🇪🇸" },
    fr: { label: "Français", flag: "🇫🇷" },
    de: { label: "Deutsch", flag: "🇩🇪" }
};

export const TRANSLATIONS = {
    en: {
        dashboard: "Dashboard", discovery: "Discovery", pipeline: "Pipeline",
        settings: "Settings", budget: "Budget Builder", vault: "Document Vault",
        active_grants: "Active Grants", awarded: "Awarded",
    },
    es: {
        dashboard: "Tablero", discovery: "Descubrimiento", pipeline: "Línea de Vida",
        settings: "Ajustes", budget: "Constructor de Presupuesto", vault: "Bóveda de Documentos",
        active_grants: "Subvenciones Activas", awarded: "Premiado",
    }
};

export let LOCALE = LS.get("locale", { lang: "en", currency: "USD" });

export const setLocale = (lang, currency) => {
    LOCALE = { lang, currency };
    LS.set("locale", LOCALE);
};

// ─── PROFILE ───────────────────────────────────────────────────────────
export const DEFAULT_PROFILE = {
    name: "", loc: "", zip: "", rural: false, disabled: false,
    poverty: false, selfEmployed: false,
    naics: "",
    tags: [],
    businesses: [], // e.g., { n: "Tech Corp", sec: "Software", naics: "541511", zip: "60601" }
    narratives: {
        founder: "",
        need: "",
        impact: "",
    },
};

// Dynamic profile — loads from localStorage, falls back to defaults
export let PROFILE = (() => {
    try {
        const saved = localStorage.getItem("gp_profile");
        if (saved) return { ...DEFAULT_PROFILE, ...JSON.parse(saved) };
    } catch (e) { console.warn("gp_profile load error", e); }
    return { ...DEFAULT_PROFILE };
})();

export const saveProfile = (updates) => {
    PROFILE = { ...PROFILE, ...updates };
    try { localStorage.setItem("gp_profile", JSON.stringify(PROFILE)); } catch (e) { console.warn("gp_profile save error", e); }
};

export const t = (key) => TRANSLATIONS[LOCALE.lang]?.[key] || TRANSLATIONS["en"][key] || key;
export const fmt = (n) => {
    const c = CURRENCIES[LOCALE.currency] || CURRENCIES.USD;
    return new Intl.NumberFormat(c.locale, { style: "currency", currency: LOCALE.currency, maximumFractionDigits: 0 }).format(n);
};
export const fmtDate = (d) => {
    const c = CURRENCIES[LOCALE.currency] || CURRENCIES.USD;
    return new Date(d).toLocaleDateString(c.locale, { month: "short", day: "numeric", year: "numeric" });
};
export const daysUntil = (d) => Math.ceil((new Date(d) - new Date()) / 86400000);
export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
export const pct = (v) => `${Math.round(v)}%`;

// ─── STATE FIPS LOOKUP ─────────────────────────────────────────────────
export const ALL_STATES = [
    { id: "AL", label: "Alabama" }, { id: "AK", label: "Alaska" }, { id: "AZ", label: "Arizona" }, { id: "AR", label: "Arkansas" },
    { id: "CA", label: "California" }, { id: "CO", label: "Colorado" }, { id: "CT", label: "Connecticut" }, { id: "DE", label: "Delaware" },
    { id: "FL", label: "Florida" }, { id: "GA", label: "Georgia" }, { id: "HI", label: "Hawaii" }, { id: "ID", label: "Idaho" },
    { id: "IL", label: "Illinois" }, { id: "IN", label: "Indiana" }, { id: "IA", label: "Iowa" }, { id: "KS", label: "Kansas" },
    { id: "KY", label: "Kentucky" }, { id: "LA", label: "Louisiana" }, { id: "ME", label: "Maine" }, { id: "MD", label: "Maryland" },
    { id: "MA", label: "Massachusetts" }, { id: "MI", label: "Michigan" }, { id: "MN", label: "Minnesota" }, { id: "MS", label: "Mississippi" },
    { id: "MO", label: "Missouri" }, { id: "MT", label: "Montana" }, { id: "NE", label: "Nebraska" }, { id: "NV", label: "Nevada" },
    { id: "NH", label: "New Hampshire" }, { id: "NJ", label: "New Jersey" }, { id: "NM", label: "New Mexico" }, { id: "NY", label: "New York" },
    { id: "NC", label: "North Carolina" }, { id: "ND", label: "North Dakota" }, { id: "OH", label: "Ohio" }, { id: "OK", label: "Oklahoma" },
    { id: "OR", label: "Oregon" }, { id: "PA", label: "Pennsylvania" }, { id: "RI", label: "Rhode Island" }, { id: "SC", label: "South Carolina" },
    { id: "SD", label: "South Dakota" }, { id: "TN", label: "Tennessee" }, { id: "TX", label: "Texas" }, { id: "UT", label: "Utah" },
    { id: "VT", label: "Vermont" }, { id: "VA", label: "Virginia" }, { id: "WA", label: "Washington" }, { id: "WV", label: "West Virginia" },
    { id: "WI", label: "Wisconsin" }, { id: "WY", label: "Wyoming" }
];

export const STATE_FIPS = { "alabama": "01", "alaska": "02", "arizona": "04", "arkansas": "05", "california": "06", "colorado": "08", "connecticut": "09", "delaware": "10", "florida": "12", "georgia": "13", "hawaii": "15", "idaho": "16", "illinois": "17", "indiana": "18", "iowa": "19", "kansas": "20", "kentucky": "21", "louisiana": "22", "maine": "23", "maryland": "24", "massachusetts": "25", "michigan": "26", "minnesota": "27", "mississippi": "28", "missouri": "29", "montana": "30", "nebraska": "31", "nevada": "32", "new hampshire": "33", "new jersey": "34", "new mexico": "35", "new york": "36", "north carolina": "37", "north dakota": "38", "ohio": "39", "oklahoma": "40", "oregon": "41", "pennsylvania": "42", "rhode island": "44", "south carolina": "45", "south dakota": "46", "tennessee": "47", "texas": "48", "utah": "49", "vermont": "50", "virginia": "51", "washington": "53", "west virginia": "54", "wisconsin": "55", "wyoming": "56", "al": "01", "ak": "02", "az": "04", "ar": "05", "ca": "06", "co": "08", "ct": "09", "de": "10", "fl": "12", "ga": "13", "hi": "15", "id": "16", "il": "17", "in": "18", "ia": "19", "ks": "20", "ky": "21", "la": "22", "me": "23", "md": "24", "ma": "25", "mi": "26", "mn": "27", "ms": "28", "mo": "29", "mt": "30", "ne": "31", "nv": "32", "nh": "33", "nj": "34", "nm": "35", "ny": "36", "nc": "37", "nd": "38", "oh": "39", "ok": "40", "or": "41", "pa": "42", "ri": "44", "sc": "45", "sd": "46", "tn": "47", "tx": "48", "ut": "49", "vt": "50", "va": "51", "wa": "53", "wv": "54", "wi": "55", "wy": "56" };
export const STATE_ABBR = { "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA", "08": "CO", "09": "CT", "10": "DE", "12": "FL", "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN", "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME", "24": "MD", "25": "MA", "26": "MI", "27": "MN", "28": "MS", "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH", "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND", "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI", "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT", "50": "VT", "51": "VA", "53": "WA", "54": "WV", "55": "WI", "56": "WY" };

export const getProfileState = () => {
    const loc = PROFILE.loc || "";
    const parts = loc.split(",").map(s => s.trim().toLowerCase());
    const last = parts[parts.length - 1];
    if (STATE_FIPS[last]) return { fips: STATE_FIPS[last], abbr: STATE_ABBR[STATE_FIPS[last]] || last.toUpperCase() };
    // Try second-to-last (City, State format)
    if (parts.length >= 2 && STATE_FIPS[parts[parts.length - 2]]) {
        const st = parts[parts.length - 2];
        return { fips: STATE_FIPS[st], abbr: STATE_ABBR[STATE_FIPS[st]] || st.toUpperCase() };
    }
    return { fips: "17", abbr: "IL" }; // fallback
};

// ─── LIFECYCLE STAGES ──────────────────────────────────────────────────
export const STAGES = [
    { id: "discovered", label: "Discovered", icon: "🔍", color: T.blue },
    { id: "researching", label: "Researching", icon: "📚", color: T.cyan },
    { id: "qualifying", label: "Qualifying", icon: "🎯", color: T.purple },
    { id: "preparing", label: "Preparing", icon: "📋", color: T.yellow },
    { id: "drafting", label: "Drafting", icon: "✍️", color: T.orange },
    { id: "reviewing", label: "Reviewing", icon: "👁️", color: T.amber },
    { id: "submitted", label: "Submitted", icon: "📤", color: T.green },
    { id: "under_review", label: "Under Review", icon: "⏳", color: T.amberDim },
    { id: "awarded", label: "Awarded", icon: "🏆", color: T.green },
    { id: "active", label: "Active", icon: "⚡", color: T.green },
    { id: "closeout", label: "Closeout", icon: "📦", color: T.yellow },
    { id: "declined", label: "Declined", icon: "❌", color: T.red },
    { id: "archived", label: "Archived", icon: "📁", color: T.mute },
];

export const STAGE_MAP = Object.fromEntries(STAGES.map(s => [s.id, s]));

// ─── SIMPLE CACHE ───
export const SimpleCache = {
    data: {},
    get(key) {
        const item = this.data[key];
        if (item && item.exp > Date.now()) return item.val;
        return null;
    },
    set(key, val, ttl = 300000) { // 5 mins default
        this.data[key] = { val, exp: Date.now() + ttl };
    }
};

// ─── LOCAL STORAGE QUOTA MONITOR ───────────────────────────────────────
export const getStorageUsage = () => {
    try {
        let total = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            total += (key.length + (localStorage.getItem(key)?.length || 0)) * 2; // UTF-16 = 2 bytes/char
        }
        const usedMB = total / (1024 * 1024);
        const quotaMB = 5; // Conservative estimate; most browsers allow 5-10MB
        return { usedMB: usedMB.toFixed(2), quotaMB, pct: Math.round((usedMB / quotaMB) * 100), warning: usedMB > quotaMB * 0.8 };
    } catch { return { usedMB: "?", quotaMB: 5, pct: 0, warning: false }; }
};

// ─── ACTIVITY LOGGER ───────────────────────────────────────────────────
export const logActivity = (type, title, meta = {}) => {
    try {
        const logs = LS.get("activity_log", []);
        logs.unshift({ id: uid(), type, title, date: new Date().toISOString(), icon: meta.icon || "📌", color: meta.color || T.blue, ...meta });
        // Keep last 200 entries
        LS.set("activity_log", logs.slice(0, 200));
    } catch (e) { console.warn("Log activity error", e); }
};
