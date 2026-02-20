
import { LS, T, getProfileState, STAGES, fmt, fmtDate, daysUntil, PROFILE, uid } from "./globals";
import { AI_PROVIDERS, getActiveProvider } from "./ai-config";
import { FortunaAPI } from "./fortuna";
import { PhilanthropyAPI } from "./philanthropy";

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

export function buildGrantContext(grantId) {
    if (!grantId) return "";
    const grants = LS.get("grants", []);
    const g = grants.find(x => x.id === grantId);
    if (!g) return "";

    const tasks = LS.get("tasks", []).filter(t => t.grantId === grantId);
    const budget = LS.get("budgets", {})[grantId] || { items: [] };
    const library = LS.get("section_library", []);
    const vault = LS.get("vault_docs", []);

    // 🧠 PORTFOLIO INTELLIGENCE: Find same-agency successes
    const agencySuccesses = grants.filter(x =>
        x.id !== grantId &&
        x.agency === g.agency &&
        ["awarded", "active"].includes(x.stage)
    );

    // 🗄️ VAULT INTELLIGENCE: Find relevant, final, and recent documents
    const relevantVaultDocs = vault
        .filter(d => (g.agency && d.name?.includes(g.agency)) || (g.title && d.name?.includes(g.title.slice(0, 10))))
        .sort((a, b) => (b.status === "final" ? 1 : 0) - (a.status === "final" ? 1 : 0) || new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 3);

    // Also look for sections in the library that might be relevant to this grant or agency
    const relevantSections = library.filter(s =>
        (g.title && s.content.includes(g.title)) ||
        (g.agency && s.content.includes(g.agency)) ||
        s.useCount > 3 // High confidence sections
    ).slice(0, 5);

    return `SPECIFIC GRANT CONTEXT (${g.title}):
- Agency: ${g.agency} | Amount: ${fmt(g.amount)} | Stage: ${g.stage}
- Associated Tasks: ${tasks.map(t => `${t.title} (${t.status}): ${t.notes || "No notes"}`).join("; ")}
- Budget Items: ${budget.items.map(i => `${i.description} (${fmt(i.amount * i.quantity)}): ${i.justification || "No justification"}`).join("; ")}
- Agency Success Intelligence: ${agencySuccesses.length > 0 ? agencySuccesses.map(s => `${s.title} (${fmt(s.amount)})`).join("; ") : "No prior wins with this agency."}
- Relevant Vault Documents: ${relevantVaultDocs.map(d => `${d.name} (${d.type})`).join("; ")}
- Previously Drafted/Finalized Sections: ${relevantSections.map(s => `[${s.title}]: ${s.content.slice(0, 300)}...`).join("\n")}
- Grant Details: ${JSON.stringify(g)}`;
}

// ─── API SERVICES ──────────────────────────────────────────────────────
export const API = {
    fortuna: FortunaAPI,
    philanthropy: PhilanthropyAPI,

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

    async getCensusData(state, fields = "NAME,S1701_C03_001E,S2301_C04_001E,DP02_0066E,DP03_0062E") {
        const fips = state || getProfileState().fips;
        const cacheKey = `census_${fips}_${fields}`;
        const cached = SimpleCache.get(cacheKey);
        if (cached) return cached;
        try {
            // ACS 5-Year Subject Tables + Data Profile for Education (DP02) and Income (DP03)
            const r = await fetch(`https://api.census.gov/data/2022/acs/acs5/profile?get=${fields}&for=state:${fips}`);
            if (!r.ok) return { _error: `Census API: HTTP ${r.status}` };
            const data = await r.json();
            SimpleCache.set(cacheKey, data);
            return data;
        } catch (e) { return { _error: `Census API: ${e.message}` }; }
    },

    async getHUDFairMarketRents(zipCode = "60601") {
        const cacheKey = `hud_fmr_${zipCode}`;
        const cached = SimpleCache.get(cacheKey);
        if (cached) return cached;
        try {
            const token = import.meta.env.VITE_HUD_USER_TOKEN || "DEMO_TOKEN";
            const r = await fetch(`https://www.huduser.gov/portal/datasets/fmr/fmr2024/api/data/${zipCode}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!r.ok) return { results: [], _error: `HUD: ${r.status}` };
            const data = await r.json();
            SimpleCache.set(cacheKey, data);
            return data;
        } catch (e) { return { results: [], _error: `HUD: ${e.message}` }; }
    },

    async getSBASizeStandards(naicsCode = "541511") {
        const cacheKey = `sba_size_${naicsCode}`;
        const cached = SimpleCache.get(cacheKey);
        if (cached) return cached;
        try {
            const r = await fetch(`https://api.sba.gov/size-standards/v1/naics/${naicsCode}`);
            if (!r.ok) return { results: [], _error: `SBA: ${r.status}` };
            const data = await r.json();
            SimpleCache.set(cacheKey, data);
            return data;
        } catch (e) { return { results: [], _error: `SBA: ${e.message}` }; }
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
        const cacheKey = `bills_v2_${query}_${congress}`;
        const cached = SimpleCache.get(cacheKey);
        if (cached) return cached;
        try {
            const apiKey = import.meta.env.VITE_CONGRESS_KEY || "DEMO_KEY";
            const r = await fetch(`https://api.congress.gov/v3/bill/${congress}?api_key=${apiKey}&format=json&limit=10`);
            if (!r.ok) throw new Error(`Congress.gov: ${r.status}`);
            const data = await r.json();

            // Enriching with mock committee/cosponsor data for demo if not in basic list
            const enriched = (data.bills || []).map(b => ({
                ...b,
                committees: b.committees || ["House Appropriations", "Senate Finance"],
                cosponsors: b.cosponsorsCount || Math.floor(Math.random() * 50) + 5,
                momentum: Math.random() > 0.7 ? "High" : "Stable"
            })).filter(b =>
                b.title?.toLowerCase().includes(query.toLowerCase()) ||
                b.type?.toLowerCase().includes(query.toLowerCase())
            );

            const result = { bills: enriched, total: enriched.length };
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
            // Mocking different state portals based on selection
            if (state === "CA") {
                const r = await fetch(`https://data.ca.gov/api/3/action/datastore_search?resource_id=ca-grants-portal-grants&q=${encodeURIComponent(query)}`);
                if (!r.ok) throw new Error(`State API (${state}): ${r.status}`);
                const data = await r.json();
                const results = (data.result?.records || []).map(r => ({
                    ...r,
                    title: r.Grant_Title || r.title,
                    agency: r.Agency_Department_Name || r.agency,
                    amount: r.Estimated_Total_Funding || 0,
                    source: "CA Grants Portal",
                    type: "State"
                }));
                SimpleCache.set(cacheKey, results);
                return results;
            } else if (state === "IL") {
                // IL GATA Mock
                const results = [
                    { id: uid(), title: `IL-${query}-GATA-2026`, agency: "IL Dept of Commerce", amount: 500000, source: "Illinois GATA", type: "State", description: "Economic development pass-through via GATA framework." },
                    { id: uid(), title: `Chicago Regional Innovation Fund`, agency: "IL Innovation Bureau", amount: 250000, source: "Illinois GATA", type: "State", description: "Localized tech advancement funding." }
                ].filter(r => r.title.toLowerCase().includes(query.toLowerCase()));
                return results;
            }
            return [];
        } catch (e) {
            console.warn(`State API (${state}) failed:`, e);
            return { results: [], _error: `${state}: ${e.message}` };
        }
    },

    async searchLocalGrants(query, county = "Cook") {
        const cacheKey = `local_grants_${county}_${query}`;
        const cached = SimpleCache.get(cacheKey);
        if (cached) return cached;

        // Simulating municipality-level "Hyper-Local" results
        const mocks = {
            "Cook": [
                { id: uid(), title: "Chicago Neighborhood Grant Program", agency: "City of Chicago", amount: 25000, source: "Municipal Portal", type: "Local", description: "Funding for neighborhood-level infrastructure and beautification." },
                { id: uid(), title: "Cook County Small Biz Relief", agency: "Cook County Commissioners", amount: 10000, source: "County Portal", type: "Local", description: "Micro-grants for businesses affected by economic shifts." }
            ],
            "Los Angeles": [
                { id: uid(), title: "LA County Arts Commission Grant", agency: "LA County", amount: 45000, source: "County Arts", type: "Local", description: "Support for local digital media and arts initiatives." },
                { id: uid(), title: "Santa Monica Innovation Fund", agency: "City of Santa Monica", amount: 20000, source: "City Clerk", type: "Local", description: "Tech-focused grants for beach-local startups." }
            ]
        };

        const results = (mocks[county] || [
            { id: uid(), title: `${county} Community Reinvestment`, agency: `${county} Commissioners`, amount: 50000, source: "County Portal", type: "Local", description: `Specialized ${county} funding for local infrastructure.` },
            { id: uid(), title: `Municipal Workforce Bridge`, agency: "Local City Council", amount: 15000, source: "City Clerk", type: "Local", description: "Small-scale workforce grants for city residents." }
        ]).filter(r => r.title.toLowerCase().includes(query.toLowerCase()) || r.description.toLowerCase().includes(query.toLowerCase()));

        SimpleCache.set(cacheKey, results);
        return results;
    },

    async searchHyperLocalSignals(zip, tags = []) {
        const cacheKey = `signals_${zip}_${tags.join(",")}`;
        const cached = SimpleCache.get(cacheKey);
        if (cached) return cached;

        // Simulate "Whisper Feed" signals from local minutes/news
        const signals = [
            { id: uid(), type: "Signal", title: "City Council Agenda Item: New Small Biz Tech Fund", agency: "City Hall", probability: 0.75, timing: "Expected Q3-2026", description: "Discussion of a $2M allocation for local AI integration." },
            { id: uid(), type: "Direct", title: "Rotary Club Local Innovation Grant", agency: "Local Rotary", amount: 5000, timing: "Deadline: rolling", description: "Unpublished micro-grant for community impact projects." },
            { id: uid(), type: "Signal", title: "Mayor's Office Workforce Initiative", agency: "Mayor's Office", probability: 0.90, timing: "Drafting Phase", description: "Signal detected in recent municipal budget proposal." }
        ];

        SimpleCache.set(cacheKey, signals);
        return signals;
    },

    async searchSubGrantOpportunities() {
        const cacheKey = "sub_grants";
        const cached = SimpleCache.get(cacheKey);
        if (cached) return cached;

        // Simulate Prime Awards that need sub-recipients
        const data = [
            { id: uid(), prime: "State Dept. of Energy", recipient: "Large Global Corp", amount: 50000000, subGrantAlloc: 2500000, title: "Clean Energy Grid Expansion", requirement: "Requires 15% local community partnership", status: "Recent Award" },
            { id: uid(), prime: "Federal DOT", recipient: "University Consortium", amount: 15000000, subGrantAlloc: 1200000, title: "Next-Gen Mobility Lab", requirement: "Must sub-contract with 3 minority-led startups", status: "Planning Sub-awards" }
        ];

        SimpleCache.set(cacheKey, data);
        return data;
    },

    async getCrossSectorSynergies(tags = []) {
        const cacheKey = `synergies_${tags.join(",")}`;
        const cached = SimpleCache.get(cacheKey);
        if (cached) return cached;

        // Find "Adjacent" sector opportunities
        const mapping = {
            "technology": ["Workforce Education", "Digital Inclusion", "Civic Tech"],
            "rural": ["Agri-Tech", "Rural Health", "Broadband Access"],
            "education": ["Social-Emotional Learning", "STEAM", "Career Readiness"]
        };

        const synergies = [
            { id: uid(), sector: "Social Impact", title: "Digital Literacy for At-Risk Youth", matchingTags: ["Technology"], synergyScore: 92, amount: 75000, source: "Private Social Fund" },
            { id: uid(), sector: "Logistics", title: "Rural Supply Chain Innovation", matchingTags: ["Rural"], synergyScore: 85, amount: 200000, source: "Biz Alliance" }
        ];

        SimpleCache.set(cacheKey, synergies);
        return synergies;
    },

    async getSurplusSignals() {
        const cacheKey = "surplus_signals";
        const cached = SimpleCache.get(cacheKey);
        if (cached) return cached;

        // Simulate EOFY spend-down signals
        const signals = [
            { id: uid(), jurisdiction: "State of California", budgetPool: "Emergency Preparedness", surplus: 4500000, eofy: "2026-06-30", alert: "Rapid intake open for tech-enabled resilience." },
            { id: uid(), jurisdiction: "Cook County", budgetPool: "Workforce Training", surplus: 1200000, eofy: "2026-11-30", alert: "High priority for immediate Q4 spend on community pilot programs." }
        ];

        SimpleCache.set(cacheKey, signals);
        return signals;
    },

    async discoverUnsolicitedFunders() {
        const cacheKey = "unsolicited_prospector";
        const cached = SimpleCache.get(cacheKey);
        if (cached) return cached;

        // Simulate 990-PF behavioral analysis
        const funders = [
            { id: uid(), name: "Global Innovation Trust", inquiryPolicy: "Open Inquiries", medianAward: 120000, unsolicitedRate: "85%", logic: "No public RFPs, but 85% of funding goes to unsolicited tech pitches." },
            { id: uid(), name: "The Sanders Family Foundation", inquiryPolicy: "Intake Form", medianAward: 40000, unsolicitedRate: "60%", logic: "Focuses on 'Emerging Solutions' exclusively through direct inquiry." }
        ];

        SimpleCache.set(cacheKey, funders);
        return funders;
    },

    async getPRISignals() {
        const cacheKey = "pri_signals";
        const cached = SimpleCache.get(cacheKey);
        if (cached) return cached;

        // Simulate Program-Related Investment discovery
        const signals = [
            { id: uid(), foundation: "MacArthur-Linked Social Fund", amount: 25000000, rate: "1.5%", term: "7 years", focus: "Affordable Housing Tech", logic: "Seeking to deploy $25M in recoverable grants / low-interest loans for high-impact tech." },
            { id: uid(), foundation: "The Global Resilience Fund", amount: 10000000, rate: "0%", term: "5 years", focus: "Climate Adaptation", logic: "Zero-interest capital for non-profit infrastructure expansion." }
        ];

        SimpleCache.set(cacheKey, signals);
        return signals;
    },

    async searchCSRPartnerships() {
        const cacheKey = "csr_partnerships";
        const cached = SimpleCache.get(cacheKey);
        if (cached) return cached;

        // Simulate CSR Strategic Partnerships (Direct)
        const results = [
            { id: uid(), company: "ComputeCorp Systems", goal: "Expand Rural Digital Literacy", budget: 500000, status: "Seeking implementation partner", synergeticTags: ["Rural", "Technology"], description: "Direct CSR allocation for organizations that can scale their rural education module." },
            { id: uid(), company: "GreenGrid Energy", goal: "Urban Resilience Pilots", budget: 250000, status: "Open inquiry for pilots", synergeticTags: ["Infrastructure", "Sustainability"], description: "Strategic partnership funding for community-led energy pilots." }
        ];

        SimpleCache.set(cacheKey, results);
        return results;
    },

    async searchCharityConsortiums(query) {
        const cacheKey = `charity_consortium_${query}`;
        const cached = SimpleCache.get(cacheKey);
        if (cached) return cached;

    // Simulate specialized private foundation consortiums
        const results = [
            { id: uid(), title: "Family Foundation Tech Collective", agency: "Private Consortium", amount: 150000, type: "Private Grant", description: "A group of 5 private family foundations co-funding innovation." },
            { id: uid(), title: "Corporate Social Responsibility Pool", agency: "Regional Business Alliance", amount: 30000, type: "Corporate Grant", description: "CSR funds pooled from local enterprises for community growth." }
        ].filter(r => r.title.toLowerCase().includes(query.toLowerCase()));

        SimpleCache.set(cacheKey, results);
        return results;
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

    async generateMagicDraft(fieldName, context = {}, instructions = "") {
        const grantId = context.grantId || (context.grant && context.grant.id);
        const portfolioContext = buildPortfolioContext(LS.get("grants", []), LS.get("vault_docs", []), LS.get("contacts", []));
        const grantContext = buildGrantContext(grantId);
        const voicePersona = LS.get("org_voice_persona", "");

        const sys = `You are a professional grant writing assistant.
        ${portfolioContext}
        ${grantContext}
        ${voicePersona ? `ORGANIZATION PERSONA: ${voicePersona}` : ""}
        
        Task: Draft a professional ${fieldName}.
        Context: ${JSON.stringify(context)}
        Additional Instructions: ${instructions}
        
        CRITICAL: Ensure consistency with previously drafted/finalized items shown in the context.
        Use the same tone and build upon established data points.
        
        Provide only the drafted text. Be concise, compelling, and data-driven.`;

        const result = await this.callAI([{ role: "user", content: `Draft the ${fieldName} for me.` }], sys);
        return result.error ? `Error: ${result.error}` : result.text;
    },

    async auditSection(draft, sectionTitle, grantId) {
        const grantContext = buildGrantContext(grantId);
        const voicePersona = LS.get("org_voice_persona", "");

        const sys = `You are a Senior Grant Reviewer and Compliance Officer. 
        Your task is to perform a "Red Team" audit of a grant section draft.
        
        ${grantContext}
        ${voicePersona ? `ORGANIZATION PERSONA: ${voicePersona}` : ""}

        SCORING RUBRIC:
        - Compliance (0-40): Does it meet all RFP requirements and section-specific rules?
        - Persuasion (0-30): Is the case compelling and data-driven?
        - Tone & Voice (0-20): Does it match the organizational persona and professional standards?
        - Clarity (0-10): Is it concise and free of jargon?

        Return a JSON object with:
        - score: Total score (0-100)
        - breakdown: { compliance: number, persuasion: number, tone: number, clarity: number }
        - deficiencies: string[] (List specific missing requirements or weaknesses)
        - recommendations: string[] (Actionable steps to improve the score)
        - status: "pass" | "warn" | "fail" (status based on total score: pass > 85, warn 70-85, fail < 70)

        Provide ONLY the JSON.`;

        const prompt = `AUDIT REQUEST:
        Section: ${sectionTitle}
        Draft Content:
        ---
        ${draft}
        ---`;

        const result = await this.callAI([{ role: "user", content: prompt }], sys);
        if (result.error) return { error: result.error };
        try {
            return JSON.parse(result.text.replace(/```json\n?|```/g, "").trim());
        } catch (e) {
            return { error: "Failed to parse audit results", raw: result.text };
        }
    },

    async getFEMAActiveDeclarations() {
        if (this._cache["fema_active"]) return this._cache["fema_active"];
        try {
            // Real OpenFEMA endpoint (no key required for basic data)
            const r = await fetch(`https://openfema.fema.gov/api/open/v2/DisasterDeclarationsSummaries?$filter=declarationDate gt '2024-01-01'&$top=5&$orderby=declarationDate desc`);
            const data = await r.json();
            const result = data.DisasterDeclarationsSummaries || [];
            this._cache["fema_active"] = result;
            return result;
        } catch {
            // Fallback for demo stability
            const mock = [{ disasterNumber: 4756, state: "CA", declarationDate: new Date().toISOString(), incidentType: "Flood", declarationTitle: "Severe Winter Storms" }];
            return mock;
        }
    },

    async getPhilanthropicIntel(zipCode = "60601") {
        const cacheKey = `phil_v2_${zipCode}`;
        if (this._cache[cacheKey]) return this._cache[cacheKey];
        try {
            const loc = getProfileState().abbr;
            const r = await fetch(`https://projects.propublica.org/nonprofits/api/v2/search.json?q=foundation&state=${loc}`);
            const data = await r.json();

            const userTags = (PROFILE.tags || []).map(t => t.toLowerCase());

            const foundations = (data.organizations || []).slice(0, 5).map(org => {
                const ntee = (org.ntee_code || "General").toLowerCase();
                // Match score based on profile tags vs NTEE/description
                let affinity = 20; // base score
                if (userTags.some(t => ntee.includes(t) || org.name.toLowerCase().includes(t))) affinity += 60;

                return {
                    id: org.ein,
                    title: `${org.name} - Annual Giving`,
                    agency: org.name,
                    type: "Private Foundation",
                    description: `Private grantmaking foundation based in ${org.city}, ${org.state}. Focus: ${org.ntee_code || "General Philanthropy"}.`,
                    potential: affinity > 50 ? "High" : affinity > 30 ? "Medium" : "Low",
                    affinity,
                    amount: 50000 + (affinity * 1000)
                };
            }).sort((a, b) => b.affinity - a.affinity);

            this._cache[cacheKey] = foundations;
            return foundations;
        } catch (e) { return { _error: e.message }; }
    },

    async getDisasterRiskProfile(state) {
        const st = state || getProfileState().abbr;
        const cacheKey = `fema_risk_${st}`;
        if (this._cache[cacheKey]) return this._cache[cacheKey];
        try {
            // Aggregate historically (last 10 years) to find patterns
            const r = await fetch(`https://openfema.fema.gov/api/open/v2/DisasterDeclarationsSummaries?$filter=state eq '${st}' and declarationDate gt '2014-01-01'&$top=1000&$select=incidentType`);
            const data = await r.json();
            const raw = data.DisasterDeclarationsSummaries || [];

            const counts = {};
            raw.forEach(d => {
                counts[d.incidentType] = (counts[d.incidentType] || 0) + 1;
            });

            const sorted = Object.entries(counts)
                .map(([type, count]) => ({ type, count, risk: Math.min(100, count * 5) }))
                .sort((a, b) => b.count - a.count);

            this._cache[cacheKey] = sorted;
            return sorted;
        } catch (e) { return { _error: e.message }; }
    },

    async getRegionalIncentives(state) {
        const st = state || getProfileState().abbr;
        const cacheKey = `edc_${st}`;
        if (this._cache[cacheKey]) return this._cache[cacheKey];
        try {
            const incentives = {
                "IL": [
                    { id: "il-edge", title: "EDGE Tax Credit", agency: "DCEO", type: "EDC Incentive", description: "Economic Development for a Growing Economy tax credit for job creation." },
                    { id: "il-grit", title: "GRIT Grant Program", agency: "Illinois EDC", type: "Regional Grant", description: "Global Region Innovation and Technology grants for startups." }
                ],
                "CA": [
                    { id: "ca-competes", title: "California Competetes Tax Credit", agency: "GO-Biz", type: "EDC Incentive", description: "Income tax credit for businesses that want to stay in or grow in CA." }
                ]
            };
            const result = incentives[st] || [
                { id: "gen-edc", title: "Regional Opportunity Zone Credit", agency: "Local EDC", type: "EDC Incentive", description: "Federal/State hybrid incentive for investments in distressed communities." }
            ];
            this._cache[cacheKey] = result;
            return result;
        } catch (e) { return { _error: e.message }; }
    },

    // ─── PHASE 2: APPLICATION ENGINE ─────────────────────────────────────

    checkEligibilityFirewall(profile, opportunity) {
        const issues = [];
        const opp = opportunity || {};
        const p = profile || {};

        // 1. Geographic Check (Simple logic)
        if (opp.zip && p.zip && opp.zip !== p.zip && !opp.title.toLowerCase().includes("national")) {
            issues.push(`Geographic Mismatch: Funder targets ${opp.zip}, organization is in ${p.zip}.`);
        }

        // 2. Rural requirement
        if (opp.rural && !p.rural) {
            issues.push("Funder requires rural status. Your profile is marked as Urban/Suburban.");
        }

        // 3. Amount Floor
        if (opp.awardFloor > 1000000 && (p.revenue || 0) < 500000) {
            issues.push("Organization revenue is insufficient for this award size.");
        }

        return {
            eligible: issues.length === 0,
            issues,
            score: issues.length === 0 ? 95 : 20
        };
    },

    async autoMapToGrant(profile, opportunity) {
        // Simulate mapping logic
        const mappedFields = {
            "Applicant Name": profile.name || "Default Org",
            "EIN": "XX-XXXXXXX",
            "Primary Sector": (profile.businesses?.[0]?.sec) || "Non-Profit",
            "Project Location": profile.loc || "Chicago, IL",
            "Executive Director": "User Name",
            "Contact Email": "office@grantplatform.ai"
        };

        return {
            mappedFields,
            compatibility: 88,
            format: opportunity.docType || "Standard SF-424",
            missingFields: profile.naics ? [] : ["NAICS Code"]
        };
    },

    async generateApplicationNarratives(profile, opportunity) {
        const portfolioContext = buildPortfolioContext(LS.get("grants", []), LS.get("vault_docs", []), LS.get("contacts", []));
        const sys = `You are an expert Grant Writer.
        ${portfolioContext}
        Create a 3-paragraph compelling narrative for this grant.
        Opportunity: ${opportunity.title} (${opportunity.agency})
        Amount: ${fmt(opportunity.amount)}
        
        Structure:
        1. Problem Statement (Local Gap)
        2. Proposed Solution (The Innovation)
        3. Strategic Impact (The Result)
        `;

        const result = await this.callAI([{ role: "user", content: "Draft the full narrative for this application." }], sys);
        return result.text || "Drafting failed. Using local template...";
    },

    async submitApplication(application) {
        const grants = LS.get("grants", []);
        const newGrant = {
            ...application.opportunity,
            id: uid(),
            stage: "submitted",
            submissionDate: new Date().toISOString(),
            narrative: application.narrative,
            status: "Pending Review"
        };
        const updated = [...grants, newGrant];
        LS.set("grants", updated);

        logActivity("Application Submitted", `Triggered autonomous submission to ${newGrant.agency}`, {
            icon: "📤",
            color: T.green,
            amount: newGrant.amount
        });

        return { success: true, grantId: newGrant.id };
    },

    async getCuratedBriefing(profile) {
        // Simulate AI curation logic
        await new Promise(r => setTimeout(r, 1500)); // Simulate thinking
        return {
            topPicks: [
                {
                    sector: "Smart Search (Gov)",
                    title: "Regional Innovation Engines - Type II",
                    amount: 15000000,
                    matchScore: 98,
                    reasoning: "Perfect alignment with your recent circular economy pilot and rural manufacturing capacity.",
                    agency: "NSF"
                },
                {
                    sector: "DAF Signal",
                    title: "Sustainable Manufacturing Leadership Grant",
                    amount: 500000,
                    matchScore: 94,
                    info: "Advisor signal from Goldman Sachs DAF pool.",
                    reasoning: "Matches your focus on ESG-driven industrial automation. Highly responsive funder.",
                    agency: "GS Philanthropy"
                },
                {
                    sector: "Synergy Engine",
                    title: "Digital Twin Integration for Rural Hubs",
                    amount: 2500000,
                    matchScore: 91,
                    reasoning: "Leverages your existing IoT assets to qualify for infrastructure modernization funds.",
                    agency: "USDA / DoE"
                }
            ],
            insights: [
                { icon: "📉", label: "Market Shift", text: "Federal interest is pivoting from pure R&D to deployment-ready infrastructure. Your 'Ready-to-Scale' assets are gaining value." },
                { icon: "🛡️", label: "Compliance Watch", text: "New Build America Buy America (BABA) requirements are hitting the manufacturing sector. Review your supply chain docs." },
                { icon: "🤝", label: "Network Opportunity", text: "Two prime contractors reached out to the platform seeking sub-awardees in your NAICS code. Check Sub-Grant Radar." }
            ]
        };
    },

    // ─── FORTUNA FINTECH EXTENSION ─────────────────────────────────────────
    fortuna: FortunaAPI
};
