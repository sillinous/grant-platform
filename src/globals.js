export const T = {
    bg: "#08080c",
    panel: "#12121a",
    border: "#1e1e2e",
    text: "#ffffff",
    sub: "#94a3b8",
    dim: "#475569",
    mute: "#334155",
    gold: "#fbbf24",
    orange: "#f97316",
    amber: "#f59e0b",
    green: "#10b981",
    red: "#ef4444",
    crimson: "#dc2626",
    purple: "#8b5cf6",
    pink: "#ec4899",
    indigo: "#6366f1",
    teal: "#14b8a6",
    cyan: "#06b6d4",
    yellow: "#eab308",
    gold: "#d4af37",
    orange: "#f97316",
    shade: "rgba(255,255,255,0.05)",
    glass: "rgba(15, 23, 42, 0.8)",
    glassLg: "rgba(2, 6, 23, 0.7)",
    glassBorder: "rgba(255, 255, 255, 0.08)",
    borderHi: "rgba(255, 255, 255, 0.15)",
    gradient: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
    glow: "0 0 20px rgba(245, 158, 11, 0.15)"
};

export const CURRENCY = { code: "USD", symbol: "$" };
export const LOCALE = "en-US";

export const LS = {
    get: (k, d = null) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { console.error("LS Error:", e); } },
    rm: (k) => localStorage.removeItem(k)
};

export const uid = () => Math.random().toString(36).substring(2, 11) + Date.now().toString(36);

export const fmt = (n) =>
    new Intl.NumberFormat(LOCALE, { style: "currency", currency: CURRENCY.code, maximumFractionDigits: 0 }).format(n || 0);

export const fmtDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString(LOCALE, { month: "short", day: "numeric", year: "numeric" });
};

export const daysUntil = (d) => {
    if (!d) return null;
    const diff = new Date(d) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const DEFAULT_PROFILE = {
    name: "",
    type: "Non-Profit",
    zip: "",
    ein: "",
    loc: "",
    focus: [],
    tags: [],
    businesses: [],
    narratives: { founder: "", need: "", impact: "" }
};

export const PROFILE = LS.get("org_profile", {
    name: "New Horizon Center",
    type: "Non-Profit",
    zip: "60614",
    ein: "12-3456789",
    loc: "Chicago, IL",
    focus: ["Rural Development", "Education", "Technology Access"],
    tags: ["non-profit", "rural-dev"],
    entities: [
        { id: "e1", name: "Horizon Foundation", type: "501c3", focus: "Global" },
        { id: "e2", name: "NJ Horizon Ops", type: "LLC", focus: "State" }
    ],
    businesses: [],
    narratives: { founder: "", need: "", impact: "" }
});

export const getProfileState = () => PROFILE;

export const saveProfile = (p) => {
    LS.set("org_profile", p);
    window.dispatchEvent(new Event("profile_update"));
};

export const STAGE_MAP = {
    researching: { label: "Researching", color: T.blue, level: 1 },
    discovered: { label: "Discovered", color: T.blue, level: 1 },
    drafting: { label: "Drafting", color: T.amber, level: 2 },
    review: { label: "Review", color: T.purple, level: 3 },
    submitted: { label: "Submitted", color: T.indigo, level: 4 },
    awarded: { label: "Awarded", color: T.green, level: 5 },
    active: { label: "Active", color: T.green, level: 6 },
    closeout: { label: "Closeout", color: T.teal, level: 7 },
    rejected: { label: "Rejected", color: T.red, level: 0 },
    declined: { label: "Declined", color: T.red, level: 0 }
};

export const STAGES = Object.entries(STAGE_MAP).map(([id, info]) => ({ id, ...info }));

export const sanitizeInput = (str) => {
    if (typeof str !== 'string') return '';
    return str.replace(/[<>]/g, '').trim();
};

export const logActivity = (action, details) => {
    const logs = LS.get("activity_logs", []);
    logs.unshift({ id: uid(), ts: new Date().toISOString(), action, details });
    LS.set("activity_logs", logs.slice(0, 100));
};
