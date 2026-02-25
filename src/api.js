import { LS, T, getProfileState, STAGES, fmt, fmtDate, daysUntil, PROFILE, uid, logActivity } from "./globals";
import { AI_PROVIDERS, getActiveProvider } from "./ai-config";
import { FortunaAPI } from "./fortuna";
import { PhilanthropyAPI } from "./philanthropy";

const SimpleCache = {
    data: {},
    get(key) {
        const item = this.data[key];
        if (!item) return null;
        if (Date.now() > item.expires) {
            delete this.data[key];
            return null;
        }
        return item.val;
    },
    set(key, val, ttl = 300000) {
        this.data[key] = { val, expires: Date.now() + ttl };
    },
    clear() { this.data = {}; }
};

export const API = {
    _cache: {},
    fortuna: FortunaAPI,
    philanthropy: PhilanthropyAPI,

    async searchGrants(query, params = {}) {
        return { oppHits: [], totalCount: 0 };
    },

    async searchFederalSpending(query, params = {}) {
        return { results: [] };
    },

    async searchStateGrants(query, state = "CA") {
        const cacheKey = `state_grants_${state}_${query}`;
        const cached = SimpleCache.get(cacheKey);
        if (cached) return cached;
        try {
            if (state === "CA") {
                const r = await fetch(`https://data.ca.gov/api/3/action/datastore_search?resource_id=ca-grants-portal-grants&q=${encodeURIComponent(query)}`);
                const data = await r.json();
                const results = (data.result?.records || []).map(r => ({
                    ...r,
                    id: r.id || r._id || uid(), 
                    title: r.Grant_Title || r.title,
                    agency: r.Agency_Department_Name || r.agency, 
                    amount: r.Estimated_Total_Funding || 0,
                    source: "CA Grants Portal", type: "State"
                }));
                SimpleCache.set(cacheKey, results);
                return results;
            } else {
                return [
                    { id: uid(), title: `${state} Community Development Block Grant`, agency: `${state} Dept of Commerce`, amount: 750000, source: `${state} Portal`, type: "State" }
                ].filter(r => r.title.toLowerCase().includes(query.toLowerCase()) || query === "");
            }
        } catch (e) { return []; }
    },

    async searchLocalGrants(query, county = "Cook") {
        return [
            { id: uid(), title: `${county} Neighborhood Grant`, agency: "Local City Council", amount: 15000, source: "City Clerk", type: "Local" }
        ].filter(r => r.title.toLowerCase().includes(query.toLowerCase()) || query === "");
    },

    async getPhilanthropicIntel(zipCode = "60601") {
        return [
            { id: uid(), title: "Urban Health Initiative", donor: "Pritzker Foundation", amount: 250000, focus: "Healthcare Access", match: 0.88, deadline: "2026-05-30" },
            { id: uid(), title: "STEM in Schools", donor: "Polk Bros Foundation", amount: 50000, focus: "Education", match: 0.72, deadline: "Rolling" }
        ];
    },
    async getDisasterRiskProfile(state) { return []; },
    async getRegionalIncentives(state) { return []; },
    async getChamberGrants() {
        return [
            { id: uid(), title: "Business Expansion Grant", org: "Local Chamber", amount: 10000, deadline: "Rolling", description: "Incentives for local hiring and facility upgrades.", type: "Local Incentive" },
            { id: uid(), title: "Digital Transformation Fund", org: "Metro Chamber", amount: 5000, deadline: "Q4", description: "Technology transition grants for established SMBs.", type: "Innovation" }
        ];
    },
    async getFaithGrants() { return [{ id: uid(), title: "Community Service Fund", agency: "Faith Foundation", amount: 12000, status: "Open" }]; },
    async getCyPresAwards() { return [{ id: uid(), title: "Settlement Fund A-12", agency: "District Court", amount: 85000, caseType: "Consumer Protection" }]; },
    async getDAOTreasuries() {
        return [
            { id: uid(), name: "Nouns DAO", token: "NOUN", focus: "Public Goods", aum: "$42M", activeProp: "Prop 124", GrantSize: "2-50 ETH" },
            { id: uid(), name: "Gitcoin DAO", token: "GTC", focus: "Open Source", aum: "$18M", activeProp: "Round 19", GrantSize: "$5k - $50k" }
        ];
    },
    async getDAFSignals() {
        return [
            { id: uid(), advisorFirm: "Goldman Philanthropy", clientFocus: "Climate Tech", note: "Client looking to deploy $2M to emerging circular economy ventures.", grantRange: "$100k - $500k", deadline: "Rolling" },
            { id: uid(), advisorFirm: "Fidelity Charitable", clientFocus: "Urban Education", note: "Interest in private-public partnerships for STEM.", grantRange: "$50k - $250k", deadline: "Q3" }
        ];
    },
    async getCBALedger() { return [{ id: uid(), title: "Transit Corridor Incentive", agency: "Developer Alliance", amount: 100000, req: "local hiring" }]; },
    async searchGivingCircles() {
        return [
            { id: uid(), name: "Sustainable Future Circle", pool: 25000, focus: "Environment", members: 120, votingDate: "2026-06-15", cycle: "Q2 Round" },
            { id: uid(), name: "Local Impact Group", pool: 12000, focus: "Youth Sports", members: 45, votingDate: "2026-04-01", cycle: "Special Fund" }
        ];
    },
    async getInKindScale() {
        return [
            { id: uid(), provider: "Amazon Web Services", type: "Cloud Credits", value: 10000, impact: "Offset 100% of compute and hosting costs for 12 months.", claimDifficulty: "Moderate" },
            { id: uid(), provider: "Salesforce", type: "CRM Licenses", value: 15000, impact: "Full enterprise stack for up to 10 users, including training.", claimDifficulty: "Easy" }
        ];
    },
    async getPolicySignals() { return [{ id: uid(), title: "FCC Broadband Expansion", weight: 0.8, status: "Proposed" }]; },
    async searchHyperLocalSignals() { return []; },
    async searchSubGrantOpportunities() { return []; },
    async getCrossSectorSynergies() { return []; },
    async getSurplusSignals() { return []; },
    async discoverUnsolicitedFunders() {
        return [
            { id: uid(), name: "The Vanguard Fund", thesis: "Disruptive Social Enterprise", minGrant: 100000, preferences: "Early stage, tech-enabled", responseTime: "4-6 Weeks" },
            { id: uid(), name: "Impact Labs", thesis: "Climate Adaptation", minGrant: 50000, preferences: "Community-led, quantifiable metrics", responseTime: "2 Weeks" }
        ];
    },
    async getPRISignals() {
        return [
            { id: uid(), investor: "Calvert Impact", instrument: "Low-interest Loan", rate: "2%", amount: 500000, term: "7 Years", focus: "Affordable Housing" }
        ];
    },
    async searchCharityConsortiums() {
        return [
            { id: uid(), company: "Salesforce", program: "1-1-1 Model", benefit: "Employee Volunteering + Licenses", focus: "Non-profit Efficiency", status: "Open" },
            { id: uid(), company: "Patagonia", program: "1% for the Planet", benefit: "Direct Grants", focus: "Environmental Advocacy", status: "Rolling" }
        ];
    },
    async getCyPresAwards() {
        return [
            { id: uid(), caseName: "Consumer Privacy vs. MegaCorp", docket: "24-CV-8821", cause: "Digital Equity", status: "Final Approval", residualFund: 1250000, description: "Unclaimed settlement funds directed to organizations bridging the digital divide in underserved communities." },
            { id: uid(), caseName: "Clean Water Act Settlement", docket: "23-CV-1102", cause: "Environmental Justice", status: "Preliminary", residualFund: 450000, description: "Residual funds intended for local water quality monitoring and community advocacy groups." }
        ];
    },
    async searchCharityConsortiums() { return []; },
    async getFEMAActiveDeclarations() { return []; },
    async callAI() { return { text: "AI Response" }; },
    async auditSection() { return { audit: "Audit" }; },
    async getCuratedBriefing() { return { brief: "Brief" }; },
    async searchBills() {
        return {
            bills: [
                { title: "Infrastructure Investment and Jobs Act", number: "H.R.3684", type: "Public Law", latestAction: { text: "Became Law", actionDate: "2021-11-15" } }
            ]
        };
    }
};

export const buildPortfolioContext = async () => {
    return "Consolidated portfolio intelligence: [Mock Context]";
};

export const auditActivityLog = async (log) => {
    return { score: 0.95, anomalies: [] };
};
