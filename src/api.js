import { LS, T, getProfileState, STAGES, fmt, fmtDate, daysUntil, PROFILE } from "./globals";


// ─── SIMPLE CACHE ───
const SimpleCache = {
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

// ─── API SERVICES ──────────────────────────────────────────────────────
export const API = {
    async searchGrants(query, params = {}) {
        const body = { keyword: query, oppStatuses: "forecasted|posted", rows: params.rows || 25, startRecord: params.startRecord || 0, ...params };
        try {
            const r = await fetch("https://apply07.grants.gov/grantsws/rest/opportunities/search", {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
            });
            if (!r.ok) throw new Error(`Grants.gov: ${r.status}`);
            const data = await r.json();
            return { oppHits: data.oppHits || [], totalCount: data.totalCount || data.hitCount || 0 };
        } catch (e) {
            console.warn("Grants.gov search failed:", e);
            return { oppHits: [], totalCount: 0, _error: `Grants.gov: ${e.message}` };
        }
    },

    async getGrantDetail(oppId) {
        // Grants.gov deprecated the detail REST endpoint. Use the search API with oppNum for enrichment.
        try {
            const r = await fetch("https://apply07.grants.gov/grantsws/rest/opportunities/search", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ oppNum: oppId, rows: 1 }),
            });
            if (!r.ok) return null;
            const data = await r.json();
            const hit = data.oppHits?.[0];
            return hit || null;
        } catch { return null; }
    },

    async searchFederalSpending(query, params = {}) {
        const cacheKey = `spending_${query}_${JSON.stringify(params)}`;
        const cached = SimpleCache.get(cacheKey);
        if (cached) return cached;
        try {
            const r = await fetch("https://api.usaspending.gov/api/v2/search/spending_by_award/", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    filters: { keywords: [query], award_type_codes: ["02", "03", "04", "05"] },
                    fields: ["Award ID", "Recipient Name", "Award Amount", "Awarding Agency", "Start Date"],
                    limit: params.limit || 15, page: 1,
                }),
            });
            if (!r.ok) return { results: [], _error: `USASpending: HTTP ${r.status}` };
            const data = await r.json();
            SimpleCache.set(cacheKey, data);
            return data;
        } catch (e) { return { results: [], _error: `USASpending: ${e.message}` }; }
    },

    async getSpendingByState(state, fy = 2024) {
        const st = state || getProfileState().abbr;
        const cacheKey = `spending_geo_${st}_${fy}`;
        const cached = SimpleCache.get(cacheKey);
        if (cached) return cached;
        try {
            const r = await fetch("https://api.usaspending.gov/api/v2/search/spending_by_geography/", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    scope: "place_of_performance", geo_layer: "state",
                    filters: { time_period: [{ start_date: `${fy}-10-01`, end_date: `${fy + 1}-09-30` }], award_type_codes: ["02", "03", "04", "05"] },
                }),
            });
            if (!r.ok) return { results: [], _error: `USASpending geo: HTTP ${r.status}` };
            const data = await r.json();
            SimpleCache.set(cacheKey, data);
            return data;
        } catch (e) { return { results: [], _error: `USASpending geo: ${e.message}` }; }
    },

    async searchRegulations(query) {
        const cacheKey = `regulations_${query}`;
        const cached = SimpleCache.get(cacheKey);
        if (cached) return cached;
        try {
            const r = await fetch(`https://api.regulations.gov/v4/documents?filter[searchTerm]=${encodeURIComponent(query)}&filter[documentType]=Rule&page[size]=10&sort=-postedDate&api_key=DEMO_KEY`);
            if (r.status === 429) return { data: [], _error: "Regulations.gov rate limit reached (DEMO_KEY: 30 req/hr). Try again later." };
            if (!r.ok) return { data: [], _error: `Regulations.gov: HTTP ${r.status}` };
            const data = await r.json();
            SimpleCache.set(cacheKey, data);
            return data;
        } catch (e) { return { data: [], _error: `Regulations.gov: ${e.message}` }; }
    },

    async getCensusData(state, fields = "NAME,S1701_C03_001E,S2301_C04_001E") {
        const fips = state || getProfileState().fips;
        const cacheKey = `census_${fips}_${fields}`;
        const cached = SimpleCache.get(cacheKey);
        if (cached) return cached;
        try {
            const r = await fetch(`https://api.census.gov/data/2022/acs/acs5/subject?get=${fields}&for=state:${fips}`);
            if (!r.ok) return { _error: `Census API: HTTP ${r.status}` };
            const data = await r.json();
            SimpleCache.set(cacheKey, data);
            return data;
        } catch (e) { return { _error: `Census API: ${e.message}` }; }
    },

    async searchSAMEntities(query) {
        const cacheKey = `sam_${query}`;
        const cached = SimpleCache.get(cacheKey);
        if (cached) return cached;
        try {
            const r = await fetch(`https://api.sam.gov/entity-information/v3/entities?api_key=DEMO_KEY&registrationStatus=A&legalBusinessName=${encodeURIComponent(query)}&includeSections=entityRegistration`);
            if (r.status === 429) return { entityData: [], _error: "SAM.gov rate limit reached (DEMO_KEY: 30 req/hr). Try again later." };
            if (!r.ok) return { entityData: [], _error: `SAM.gov: HTTP ${r.status}` };
            const data = await r.json();
            SimpleCache.set(cacheKey, data);
            return data;
        } catch (e) { return { entityData: [], _error: `SAM.gov: ${e.message}` }; }
    },

    async searchUSASpendingRecipients(query) {
        const cacheKey = `recipients_${query}`;
        const cached = SimpleCache.get(cacheKey);
        if (cached) return cached;
        try {
            const r = await fetch("https://api.usaspending.gov/api/v2/autocomplete/recipient/", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ search_text: query, limit: 10 }),
            });
            if (!r.ok) return { results: [], _error: `USASpending recipients: HTTP ${r.status}` };
            const data = await r.json();
            SimpleCache.set(cacheKey, data);
            return data;
        } catch (e) { return { results: [], _error: `USASpending recipients: ${e.message}` }; }
    },

    async getTopRecipients(state) {
        const st = state || getProfileState().abbr;
        const cacheKey = `top_recipients_${st}`;
        const cached = SimpleCache.get(cacheKey);
        if (cached) return cached;
        try {
            const r = await fetch("https://api.usaspending.gov/api/v2/search/spending_by_award/", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    filters: { recipient_locations: [{ country: "USA", state: st }], award_type_codes: ["02", "03", "04", "05"] },
                    fields: ["Recipient Name", "Award Amount", "Awarding Agency"], limit: 8, page: 1, order: "desc", sort: "Award Amount",
                }),
            });
            if (!r.ok) return { results: [], _error: `USASpending top recipients: HTTP ${r.status}` };
            const data = await r.json();
            SimpleCache.set(cacheKey, data);
            return data;
        } catch (e) { return { results: [], _error: `USASpending top recipients: ${e.message}` }; }
    },

    async callAI(messages, systemPrompt) {
        const apiKey = import.meta.env.VITE_ANTHROPIC_KEY || LS.get("anthropic_key");
        if (!apiKey) return { error: "No API key configured. Add VITE_ANTHROPIC_KEY in .env or Settings." };
        try {
            const r = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
                body: JSON.stringify({ model: "claude-sonnet-4-5-20250929", max_tokens: 4096, system: systemPrompt || "", messages }),
            });
            if (!r.ok) { const e = await r.json().catch(() => ({})); return { error: e.error?.message || `API ${r.status}` }; }
            const d = await r.json();
            return { text: d.content?.map(c => c.text).join("") || "" };
        } catch (e) { return { error: e.message }; }
    },
};

// ─── AI CONTEXT BUILDER ────────────────────────────────────────────────
export function buildPortfolioContext(grants, docs, contacts) {
    const active = (grants || []).filter(g => !["declined", "closeout"].includes(g.stage));
    const awarded = (grants || []).filter(g => ["awarded", "active"].includes(g.stage));
    const totalSought = active.reduce((s, g) => s + (g.amount || 0), 0);
    const totalAwarded = awarded.reduce((s, g) => s + (g.amount || 0), 0);
    return `PORTFOLIO CONTEXT:
- Active grants: ${active.length} seeking ${fmt(totalSought)}
- Awarded: ${awarded.length} totaling ${fmt(totalAwarded)}
- Pipeline stages: ${STAGES.map(s => `${s.label}: ${(grants || []).filter(g => g.stage === s.id).length}`).filter(x => !x.endsWith(": 0")).join(", ")}
- Documents: ${(docs || []).length} on file
- Contacts: ${(contacts || []).length} in CRM
- Profile: ${PROFILE.name}, ${PROFILE.loc} (rural: ${PROFILE.rural}, disabled: ${PROFILE.disabled})
- Businesses: ${PROFILE.businesses.map(b => `${b.n} (${b.sec})`).join(", ")}
- Top upcoming deadlines: ${active.filter(g => g.deadline).sort((a, b) => new Date(a.deadline) - new Date(b.deadline)).slice(0, 5).map(g => `${g.title}: ${fmtDate(g.deadline)} (${daysUntil(g.deadline)}d)`).join("; ")}
${PROFILE.narratives.founder}`;
}
