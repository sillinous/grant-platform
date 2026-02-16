import { LS, T, getProfileState, STAGES, fmt, fmtDate, daysUntil, PROFILE } from "./globals";


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
        const result = await this.callAI([{ role: "user", content: "Hello! Reply with just 'Connected.'" }], "Reply with exactly one word: Connected.");
        return result;
    },
};

// ─── AI PROVIDER DEFINITIONS ───────────────────────────────────────────
export const AI_PROVIDERS = {
    openrouter: {
        id: "openrouter", name: "OpenRouter", icon: "🌐", color: "#6366f1",
        envKey: "VITE_OPENROUTER_KEY", lsKey: "openrouter_key",
        description: "Meta-router with access to all major models. Recommended primary.",
        keyUrl: "https://openrouter.ai/keys",
        keyPrefix: "sk-or-",
        models: [
            { id: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet", tier: "flagship" },
            { id: "openai/gpt-4o", label: "GPT-4o", tier: "flagship" },
            { id: "google/gemini-pro-1.5", label: "Gemini 1.5 Pro", tier: "flagship" },
            { id: "openai/o1-mini", label: "OpenAI o1-mini", tier: "reasoning" },
            { id: "meta-llama/llama-3.1-405b-instruct", label: "Llama 3.1 405B", tier: "standard" },
            { id: "google/gemini-flash-1.5", label: "Gemini 1.5 Flash", tier: "fast" },
            { id: "openrouter/auto", label: "Auto-router", tier: "standard" },
        ],
        async call(apiKey, model, messages, systemPrompt) {
            const msgs = systemPrompt ? [{ role: "system", content: systemPrompt }, ...messages] : messages;
            const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}`, "HTTP-Referer": window.location.origin, "X-Title": "UNLESS Grant Platform" },
                body: JSON.stringify({ model, max_tokens: 4096, messages: msgs }),
            });
            if (!r.ok) { const e = await r.json().catch(() => ({})); return { error: e.error?.message || `OpenRouter API ${r.status}` }; }
            const d = await r.json();
            return { text: d.choices?.[0]?.message?.content || "", provider: "openrouter", model };
        },
    },

    anthropic: {
        id: "anthropic", name: "Anthropic", icon: "🟤", color: "#d4a574",
        envKey: "VITE_ANTHROPIC_KEY", lsKey: "anthropic_key",
        description: "Claude models — excellent for nuanced writing and analysis.",
        keyUrl: "https://console.anthropic.com/settings/keys",
        keyPrefix: "sk-ant-",
        models: [
            { id: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet", tier: "flagship" },
            { id: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku", tier: "fast" },
            { id: "claude-3-opus-20240229", label: "Claude 3 Opus", tier: "premium" },
        ],
        async call(apiKey, model, messages, systemPrompt) {
            const r = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
                body: JSON.stringify({ model, max_tokens: 4096, system: systemPrompt || "", messages }),
            });
            if (!r.ok) { const e = await r.json().catch(() => ({})); return { error: e.error?.message || `Anthropic API ${r.status}` }; }
            const d = await r.json();
            return { text: d.content?.map(c => c.text).join("") || "", provider: "anthropic", model };
        },
    },

    openai: {
        id: "openai", name: "OpenAI", icon: "🟢", color: "#10a37f",
        envKey: "VITE_OPENAI_KEY", lsKey: "openai_key",
        description: "GPT models — strong general-purpose reasoning and code.",
        keyUrl: "https://platform.openai.com/api-keys",
        keyPrefix: "sk-",
        models: [
            { id: "gpt-4o", label: "GPT-4o", tier: "flagship" },
            { id: "gpt-4o-mini", label: "GPT-4o Mini", tier: "fast" },
            { id: "o1-mini", label: "o1-mini (reasoning)", tier: "reasoning" },
            { id: "gpt-4-turbo", label: "GPT-4 Turbo", tier: "standard" },
        ],
        async call(apiKey, model, messages, systemPrompt) {
            const msgs = systemPrompt ? [{ role: "system", content: systemPrompt }, ...messages] : messages;
            const r = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
                body: JSON.stringify({ model, max_tokens: 4096, messages: msgs }),
            });
            if (!r.ok) { const e = await r.json().catch(() => ({})); return { error: e.error?.message || `OpenAI API ${r.status}` }; }
            const d = await r.json();
            return { text: d.choices?.[0]?.message?.content || "", provider: "openai", model };
        },
    },

    gemini: {
        id: "gemini", name: "Google Gemini", icon: "🔵", color: "#4285f4",
        envKey: "VITE_GEMINI_KEY", lsKey: "gemini_key",
        description: "Gemini models — multimodal with large context windows.",
        keyUrl: "https://aistudio.google.com/apikey",
        keyPrefix: "AIza",
        models: [
            { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro", tier: "flagship" },
            { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash", tier: "fast" },
            { id: "gemini-2.0-flash-exp", label: "Gemini 2.0 Flash (latest)", tier: "standard" },
        ],
        async call(apiKey, model, messages, systemPrompt) {
            const contents = messages.map(m => ({
                role: m.role === "assistant" ? "model" : "user",
                parts: [{ text: m.content }],
            }));
            const body = { contents, generationConfig: { maxOutputTokens: 4096 } };
            if (systemPrompt) body.systemInstruction = { parts: [{ text: systemPrompt }] };
            const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!r.ok) { const e = await r.json().catch(() => ({})); return { error: e.error?.message || `Gemini API ${r.status}` }; }
            const d = await r.json();
            return { text: d.candidates?.[0]?.content?.parts?.map(p => p.text).join("") || "", provider: "gemini", model };
        },
    },

    nvidia: {
        id: "nvidia", name: "NVIDIA NIM", icon: "🟩", color: "#76b900",
        envKey: "VITE_NVIDIA_KEY", lsKey: "nvidia_key",
        description: "NVIDIA-hosted open models — fast inference on enterprise GPUs.",
        keyUrl: "https://build.nvidia.com/explore/discover",
        keyPrefix: "nvapi-",
        models: [
            { id: "meta/llama-3.1-405b-instruct", label: "Llama 3.1 405B", tier: "flagship" },
            { id: "meta/llama-3.1-70b-instruct", label: "Llama 3.1 70B", tier: "standard" },
            { id: "nvidia/llama-3.1-nemotron-70b-instruct", label: "Nemotron 70B", tier: "custom" },
        ],
        async call(apiKey, model, messages, systemPrompt) {
            const msgs = systemPrompt ? [{ role: "system", content: systemPrompt }, ...messages] : messages;
            const r = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
                body: JSON.stringify({ model, max_tokens: 4096, messages: msgs }),
            });
            if (!r.ok) { const e = await r.json().catch(() => ({})); return { error: e.error?.message || `NVIDIA API ${r.status}` }; }
            const d = await r.json();
            return { text: d.choices?.[0]?.message?.content || "", provider: "nvidia", model };
        },
    },
};

// ─── PROVIDER HELPERS ──────────────────────────────────────────────────
export function getActiveProvider() {
    // OpenRouter is primary if its key exists
    const orKey = import.meta.env.VITE_OPENROUTER_KEY || LS.get("openrouter_key");
    const explicitProvider = LS.get("ai_provider");

    if (explicitProvider && AI_PROVIDERS[explicitProvider]) {
        return AI_PROVIDERS[explicitProvider];
    }
    // Auto-select: OpenRouter first, then whichever has a key
    if (orKey) return AI_PROVIDERS.openrouter;
    for (const id of ["anthropic", "openai", "gemini", "nvidia"]) {
        const p = AI_PROVIDERS[id];
        if (import.meta.env[p.envKey] || LS.get(p.lsKey)) return p;
    }
    return AI_PROVIDERS.openrouter; // default even without key (will show error prompting config)
}

export function getProviderKey(providerId) {
    const p = AI_PROVIDERS[providerId];
    if (!p) return null;
    return import.meta.env[p.envKey] || LS.get(p.lsKey) || null;
}

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
