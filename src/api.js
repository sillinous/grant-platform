
import { LS, T, getProfileState, STAGES, fmt, fmtDate, daysUntil, PROFILE } from "./globals";
import { AI_PROVIDERS, getActiveProvider } from "./ai-config";

// ─── SIMPLE CACHE ───
const SimpleCache = {
    data: {},
    get(key) {
        const item = this.data[key];
        if (item && item.exp > Date.now()) return item.val;
        if (item) delete this.data[key]; // Auto-evict expired
        return null;
    },
    set(key, val, ttl = 300000) { // 5 mins default
        this.data[key] = { val, exp: Date.now() + ttl };
    },
    clear() { this.data = {}; },
    clearExpired() {
        const now = Date.now();
        Object.keys(this.data).forEach(k => { if (this.data[k].exp <= now) delete this.data[k]; });
    },
    getStats() {
        const keys = Object.keys(this.data);
        const now = Date.now();
        return { total: keys.length, active: keys.filter(k => this.data[k].exp > now).length, expired: keys.filter(k => this.data[k].exp <= now).length };
    }
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
- Narratives: ${JSON.stringify(PROFILE.narratives)}`;
}

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
        try {
            const r = await fetch("https://apply07.grants.gov/grantsws/rest/opportunities/search", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ oppNum: oppId, rows: 1 }),
            });
            if (!r.ok) return null;
            const data = await r.json();
            return data.oppHits?.[0] || null;
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
            const apiKey = import.meta.env.VITE_REGULATIONS_KEY || "DEMO_KEY";
            const r = await fetch(`https://api.regulations.gov/v4/documents?filter[searchTerm]=${encodeURIComponent(query)}&filter[documentType]=Rule&page[size]=10&sort=-postedDate&api_key=${apiKey}`);
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
            const apiKey = import.meta.env.VITE_SAM_KEY || "DEMO_KEY";
            const r = await fetch(`https://api.sam.gov/entity-information/v3/entities?api_key=${apiKey}&registrationStatus=A&legalBusinessName=${encodeURIComponent(query)}&includeSections=entityRegistration`);
            if (r.status === 429) return { entityData: [], _error: "SAM.gov rate limit reached." };
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
            if (!r.ok) return { results: [], _error: `USASpending: HTTP ${r.status}` };
            const data = await r.json();
            SimpleCache.set(cacheKey, data);
            return data;
        } catch (e) { return { results: [], _error: `USASpending: ${e.message}` }; }
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
            if (!r.ok) return { results: [], _error: `USASpending: HTTP ${r.status}` };
            const data = await r.json();
            SimpleCache.set(cacheKey, data);
            return data;
        } catch (e) { return { results: [], _error: `USASpending: ${e.message}` }; }
    },

    async searchNonprofits(query) {
        const cacheKey = `nonprofits_${query}`;
        const cached = SimpleCache.get(cacheKey);
        if (cached) return cached;
        try {
            const r = await fetch(`https://projects.propublica.org/nonprofits/api/v2/search.json?q=${encodeURIComponent(query)}`);
            if (!r.ok) throw new Error(`ProPublica: ${r.status}`);
            const data = await r.json();
            SimpleCache.set(cacheKey, data);
            return data;
        } catch (e) {
            console.warn("ProPublica search failed:", e);
            return { organizations: [], _error: `ProPublica: ${e.message}` };
        }
    },

    async getNonprofitDetail(ein) {
        const cacheKey = `nonprofit_detail_${ein}`;
        const cached = SimpleCache.get(cacheKey);
        if (cached) return cached;
        try {
            const r = await fetch(`https://projects.propublica.org/nonprofits/api/v2/organizations/${ein}.json`);
            if (!r.ok) return null;
            const data = await r.json();
            SimpleCache.set(cacheKey, data);
            return data;
        } catch { return null; }
    },

    async searchBills(query, congress = 118) {
        const cacheKey = `bills_${query}_${congress}`;
        const cached = SimpleCache.get(cacheKey);
        if (cached) return cached;
        try {
            const apiKey = import.meta.env.VITE_CONGRESS_KEY || "DEMO_KEY";
            // Note: Congress.gov API doesn't have a direct "q" param in the list view, usually requires filters or specific bill searches.
            // Using a generic search parameter if supported or common keywords.
            const r = await fetch(`https://api.congress.gov/v3/bill/${congress}?api_key=${apiKey}&format=json&limit=20`);
            if (!r.ok) throw new Error(`Congress.gov: ${r.status}`);
            const data = await r.json();
            // Local filtering for demonstration if API doesn't support direct text search in this endpoint
            const filtered = (data.bills || []).filter(b =>
                b.title?.toLowerCase().includes(query.toLowerCase()) ||
                b.type?.toLowerCase().includes(query.toLowerCase())
            );
            const result = { bills: filtered, total: filtered.length };
            SimpleCache.set(cacheKey, result);
            return result;
        } catch (e) {
            console.warn("Congress.gov search failed:", e);
            return { bills: [], _error: `Congress.gov: ${e.message}` };
        }
    },

    async searchStateGrants(query, state = "CA") {
        const cacheKey = `state_grants_${state}_${query}`;
        const cached = SimpleCache.get(cacheKey);
        if (cached) return cached;
        try {
            const r = await fetch(`https://data.ca.gov/api/3/action/datastore_search?resource_id=ca-grants-portal-grants&q=${encodeURIComponent(query)}`);
            if (!r.ok) throw new Error(`State API (${state}): ${r.status}`);
            const data = await r.json();
            const results = data.result?.records || [];
            SimpleCache.set(cacheKey, results);
            return results;
        } catch (e) {
            console.warn(`State API (${state}) failed:`, e);
            return { results: [], _error: `${state}: ${e.message}` };
        }
    },

    async getEconomicData(seriesId = "UNRATE") {
        const cacheKey = `fred_${seriesId}`;
        const cached = SimpleCache.get(cacheKey);
        if (cached) return cached;
        try {
            const apiKey = import.meta.env.VITE_FRED_KEY || "DEMO_KEY";
            const r = await fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&limit=12&sort_order=desc`);
            if (!r.ok) return { observations: [], _error: `FRED: ${r.status}` };
            const data = await r.json();
            SimpleCache.set(cacheKey, data);
            return data;
        } catch (e) { return { observations: [], _error: `FRED: ${e.message}` }; }
    },

    async getClimateData(stationId = "GHCND:USW00094728") {
        const cacheKey = `noaa_${stationId}`;
        const cached = SimpleCache.get(cacheKey);
        if (cached) return cached;
        try {
            const token = import.meta.env.VITE_NOAA_TOKEN || "DEMO_TOKEN";
            // Getting recent daily summaries
            const r = await fetch(`https://www.ncei.noaa.gov/cdo-web/api/v2/data?datasetid=GHCND&stationid=${stationId}&limit=10&sortfield=date&sortorder=desc`, {
                headers: { token }
            });
            if (!r.ok) return { results: [], _error: `NOAA: ${r.status}` };
            const data = await r.json();
            SimpleCache.set(cacheKey, data);
            return data;
        } catch (e) { return { results: [], _error: `NOAA: ${e.message}` }; }
    },

    async callAI(messages, systemPrompt) {
        const provider = getActiveProvider();
        const providerConfig = AI_PROVIDERS[provider.id];
        if (!providerConfig) return { error: `Unknown AI provider: ${provider.id}` };

        const apiKey = import.meta.env[providerConfig.envKey] || LS.get(providerConfig.lsKey);
        if (!apiKey) return { error: `No ${providerConfig.name} API key configured. Add one in Settings → AI Config.` };

        const model = LS.get("ai_model") || providerConfig.models[0].id;

        try {
            return await providerConfig.call(apiKey, model, messages, systemPrompt);
        } catch (e) { return { error: e.message }; }
    },

    async testAIConnection() {
        return await this.callAI([{ role: "user", content: "Hello! Reply with just 'Connected.'" }], "Reply with exactly one word: Connected.");
    },
};
