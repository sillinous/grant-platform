import { uid } from "./globals";

/**
 * Philanthropy Intelligence Service
 * Sources: News Pulse, 990-PF Deep Analysis, and UHNW Signals.
 */

const MOCK_PHILANTHROPY_NEWS = [
    {
        id: "news_1",
        date: "2026-02-17",
        title: "Patrick J. McGovern Foundation Announces $50M AI for Science Initiative",
        source: "Philanthropy News Digest",
        summary: "New funding focused on accelerating scientific discovery through artificial intelligence and machine learning applications.",
        tags: ["AI", "Science", "Innovation"],
        impactScore: 95
    },
    {
        id: "news_2",
        date: "2026-02-15",
        title: "Rural Health Equity Fund Expands to Midwest Region",
        source: "Inside Philanthropy",
        summary: "A consortium of private foundations is pooling $25M to address healthcare disparities in rural communities across Illinois and Ohio.",
        tags: ["Rural", "Healthcare", "Equity"],
        impactScore: 88
    },
    {
        id: "news_3",
        date: "2026-02-12",
        title: "Climate Resilience Trust Launching Q3 RFP for Coastal Infrastructure",
        source: "The Chronicle of Philanthropy",
        summary: "Focus on community-led adaptation projects for vulnerable coastal and urban micro-climates.",
        tags: ["Climate", "Infrastructure", "Urban"],
        impactScore: 82
    }
];

const MOCK_FOUNDATION_ANALYSIS = {
    "Gates Foundation": {
        ein: "56-2311234",
        givingHistory: [
            { category: "Global Health", amount: "2.5B", percentage: 40 },
            { category: "Education", amount: "1.2B", percentage: 20 },
            { category: "Economic Dev", amount: "800M", percentage: 15 },
            { category: "Emergency Response", amount: "500M", percentage: 10 }
        ],
        trustees: ["Bill Gates", "Melinda French Gates", "Mark Suzman"],
        trusteeNetwork: [
            { name: "Mark Suzman", connections: ["Rockefeller Foundation", "WHO Advisor Board"] }
        ]
    }
};

export const PhilanthropyAPI = {
    async getNewsPulse(profileTags = []) {
        // Simulate AI matching news to profile tags
        return MOCK_PHILANTHROPY_NEWS.map(n => ({
            ...n,
            matchScore: profileTags.some(t => n.tags.includes(t)) ? 90 + Math.random() * 10 : 40 + Math.random() * 20
        })).sort((a, b) => b.matchScore - a.matchScore);
    },

    async analyzeFoundation990(einOrName) {
        // Simulate deep 990-PF parsing
        const data = MOCK_FOUNDATION_ANALYSIS[einOrName] || MOCK_FOUNDATION_ANALYSIS["Gates Foundation"];
        return {
            ...data,
            id: uid(),
            lastFiled: "2025-11-15",
            growthRate: "+5.2% in assets"
        };
    },

    async getUHNWSignals() {
        // Simulate Family Office / Trust signals
        return [
            {
                id: uid(),
                name: "The Sterling Family Office",
                intent: "Establishing a new $10M impact pool for rural STEM education.",
                source: "Advisor Signal",
                confidence: "High",
                outreachTip: "Focus on workforce legacy and multi-generational impact."
            },
            {
                id: uid(),
                name: "Patterson Private Trust",
                intent: "Quietly seeking local community-led housing resilience projects.",
                source: "Trustee Network",
                confidence: "Medium",
                outreachTip: "Inquiry via legal counsel 'Patterson & Assoc' recommended."
            }
        ];
    }
};
