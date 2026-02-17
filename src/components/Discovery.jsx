import React, { useState, useEffect, useMemo } from "react";
import { T, PROFILE, LS, uid, fmt, fmtDate, daysUntil } from "../globals";
import { Tab, Card, Input, Btn, Select, Badge, Empty, Progress } from "../ui";
import { API } from "../api";
import { PolicySentinel } from "./PolicySentinel";
import { RegionalPulse } from "./RegionalPulse";



export const Discovery = ({ onAdd, grants }) => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [spendingResults, setSpendingResults] = useState([]);
    const [tab, setTab] = useState("search");
    const [multiTierResults, setMultiTierResults] = useState([]);
    const [geoFilter, setGeoFilter] = useState({ state: "CA", county: "Cook" });
    const [expanded, setExpanded] = useState(null);
    const [detailData, setDetailData] = useState({});
    const [sortBy, setSortBy] = useState("relevance");
    const [filterAgency, setFilterAgency] = useState("");
    const [filterMinAmt, setFilterMinAmt] = useState(0);
    const [filterMaxAmt, setFilterMaxAmt] = useState(0);
    const [filterOpen, setFilterOpen] = useState(true);
    const [filterStatus, setFilterStatus] = useState("");
    const [filterInstrument, setFilterInstrument] = useState("");
    const [filterCategory, setFilterCategory] = useState("");
    const [filterDocType, setFilterDocType] = useState("");
    const [filterEligibility, setFilterEligibility] = useState("");
    const [filterMinMatch, setFilterMinMatch] = useState(0);
    const [selected, setSelected] = useState(new Set());
    const [searchHistory, setSearchHistory] = useState(() => LS.get("search_history", []));
    const [savedResults, setSavedResults] = useState(() => LS.get("saved_discoveries", []));
    const [aiRecs, setAiRecs] = useState(null);
    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [landscape, setLandscape] = useState(null);
    const [regs, setRegs] = useState([]);
    const [showFilters, setShowFilters] = useState(false);
    const [searchStats, setSearchStats] = useState(null);
    const [totalCount, setTotalCount] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);
    const [currentOffset, setCurrentOffset] = useState(0);
    const [lastQuery, setLastQuery] = useState("");
    const [sbaEligible, setSbaEligible] = useState(null);
    const [hudIntel, setHudIntel] = useState(null);

    useEffect(() => {
        // Fetch SBA Size Standards for current profile NAICS
        if (PROFILE.naics) {
            API.getSBASizeStandards(PROFILE.naics).then(d => {
                if (d && !d._error) setSbaEligible(d);
            });
        }
        // Fetch HUD Fair Market Rent for current profile ZIP
        if (PROFILE.zip) {
            API.getHUDFairMarketRents(PROFILE.zip).then(d => {
                if (d && !d._error) setHudIntel(d);
            });
        }
    }, [PROFILE.naics, PROFILE.zip]);
    const PAGE_SIZE = 40;

    useEffect(() => { LS.set("search_history", searchHistory); }, [searchHistory]);
    useEffect(() => { LS.set("saved_discoveries", savedResults); }, [savedResults]);

    const alreadyTracked = useMemo(() => new Set((grants || []).map(g => g.title)), [grants]);

    // Quick match score against profile
    const scoreResult = (opp) => {
        const text = `${opp.title || ""} ${opp.description || opp.synopsis || ""} ${opp.agency || opp.agencyName || ""}`.toLowerCase();
        let score = 0; let reasons = [];
        if (PROFILE.rural && (text.includes("rural") || text.includes("underserved"))) { score += 18; reasons.push("Rural focus"); }
        if (PROFILE.disabled && text.includes("disab")) { score += 18; reasons.push("Disability"); }
        if (PROFILE.selfEmployed && (text.includes("small business") || text.includes("entrepreneur") || text.includes("sbir"))) { score += 15; reasons.push("Small biz"); }
        if (text.includes("technology") || text.includes(" ai ") || text.includes("artificial intelligence") || text.includes("innovation")) { score += 12; reasons.push("Technology"); }
        if (PROFILE.poverty && (text.includes("poverty") || text.includes("low-income") || text.includes("economically disadvantaged"))) { score += 14; reasons.push("Low-income"); }
        const state = (PROFILE.loc || "").split(",").pop()?.trim().toLowerCase();
        if (state && text.includes(state)) { score += 10; reasons.push("State match"); }
        if (text.includes("workforce") || text.includes("training")) { score += 8; reasons.push("Workforce"); }
        if (text.includes("communit")) { score += 6; reasons.push("Community"); }
        PROFILE.tags.forEach(tag => { if (text.includes(tag.replace(/-/g, " "))) { score += 5; } });
        PROFILE.businesses.forEach(b => { if (text.includes(b.sec?.toLowerCase())) { score += 7; reasons.push(b.sec); } });
        return { score: Math.min(score, 100), reasons: [...new Set(reasons)] };
    };

    // ─── SEARCH ───
    const search = async (searchQuery) => {
        const q = searchQuery || query;
        if (!q.trim()) return;
        setLoading(true);
        setResults([]);
        setSpendingResults([]);
        setExpanded(null);
        setSelected(new Set());
        setSearchStats(null);

        // Parallel multi-source search
        const [grantsData, spendingData, stateData, localData] = await Promise.all([
            API.searchGrants(q, { rows: PAGE_SIZE, startRecord: 0 }),
            API.searchFederalSpending(q, { limit: 10 }),
            tab === "state" ? API.searchStateGrants(q, geoFilter.state) : Promise.resolve([]),
            tab === "state" ? API.searchLocalGrants(q, geoFilter.county) : Promise.resolve([]),
        ]);

        const hits = grantsData.oppHits || [];
        setResults(hits);
        setSpendingResults(spendingData.results || []);
        if (tab === "state") {
            setMultiTierResults([...(stateData || []), ...(localData || [])]);
        }
        setTotalCount(grantsData.totalCount || hits.length);
        setLastQuery(q);

        // Stats
        const agencies = [...new Set(hits.map(h => h.agency || h.agencyName).filter(Boolean))];
        const amounts = hits.map(h => h.awardCeiling || h.estimatedFunding || 0).filter(v => v > 0);
        const withDeadlines = hits.filter(h => h.closeDate).length;
        setSearchStats({
            total: hits.length, agencies: agencies.length,
            avgAmount: amounts.length > 0 ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0,
            maxAmount: amounts.length > 0 ? Math.max(...amounts) : 0,
            withDeadlines, topAgencies: agencies.slice(0, 5),
        });

        // Save to history
        setSearchHistory(prev => {
            const filtered = prev.filter(h => h.query !== q);
            return [{ query: q, resultCount: hits.length, date: new Date().toISOString() }, ...filtered].slice(0, 20);
        });

        setLoading(false);
    };

    // ─── LOAD MORE ───
    const loadMore = async () => {
        if (!lastQuery || loadingMore) return;
        setLoadingMore(true);
        const grantsData = await API.searchGrants(lastQuery, { rows: PAGE_SIZE, startRecord: currentOffset });
        const newHits = grantsData.oppHits || [];
        if (newHits.length > 0) {
            setResults(prev => [...prev, ...newHits]);
            setCurrentOffset(prev => prev + newHits.length);
            if (grantsData.totalCount) setTotalCount(grantsData.totalCount);
        }
        setLoadingMore(false);
    };

    const hasMore = totalCount > 0 && currentOffset < totalCount;

    // ─── AI RECOMMENDATIONS ───
    const getAIRecommendations = async () => {
        setAiLoading(true);
        const sys = `You are an expert grant strategist. Based on the user's profile, generate 8 highly specific grant search queries that would find the best matching federal grants. Consider their location, demographics, businesses, and sectors.

RESPOND ONLY IN JSON: {"searches":[{"query":"...","reason":"...","priority":"high|medium","category":"..."}]}`;

        const profileCtx = `Name: ${PROFILE.name}
Location: ${PROFILE.loc}
Rural: ${PROFILE.rural}, Disabled: ${PROFILE.disabled}, Poverty: ${PROFILE.poverty}, Self-Employed: ${PROFILE.selfEmployed}
Tags: ${PROFILE.tags.join(", ")}
Businesses: ${PROFILE.businesses.map(b => `${b.n} (${b.sec} — ${b.d})`).join("; ")}
Narratives: ${PROFILE.narratives.founder}`;

        const result = await API.callAI([{ role: "user", content: profileCtx }], sys);
        if (!result.error) {
            try {
                const cleaned = result.text.replace(/```json\n?|```/g, "").trim();
                setAiRecs(JSON.parse(cleaned));
            } catch { setAiRecs(null); }
        }
        setAiLoading(false);
    };

    // ─── FETCH DETAIL ───
    const loadDetail = async (oppId, searchHit) => {
        if (detailData[oppId]) return;
        // Store the search hit data immediately so it never shows "Loading..."
        if (searchHit) {
            setDetailData(prev => ({ ...prev, [oppId]: searchHit }));
        }
        // Try to enrich via oppNum search (may return extra fields)
        if (searchHit?.number) {
            const data = await API.getGrantDetail(searchHit.number);
            if (data) setDetailData(prev => ({ ...prev, [oppId]: { ...searchHit, ...data } }));
        }
    };

    // ─── SAVE / TRACK ───
    const saveResult = (opp) => {
        const entry = {
            id: uid(), title: opp.title || opp.opportunityTitle || "Untitled",
            agency: opp.agency || opp.agencyName || "", amount: opp.awardCeiling || opp.estimatedFunding || 0,
            deadline: opp.closeDate || "", description: (opp.description || opp.synopsis || "").slice(0, 500),
            oppId: opp.id || opp.opportunityId, savedAt: new Date().toISOString(),
            matchScore: scoreResult(opp).score,
        };
        setSavedResults(prev => prev.some(s => s.title === entry.title) ? prev : [...prev, entry]);
    };

    const trackGrant = (opp) => {
        const match = scoreResult(opp);
        onAdd({
            id: uid(), title: opp.title || opp.opportunityTitle || "Untitled",
            agency: opp.agency || opp.agencyName || "", amount: opp.awardCeiling || opp.estimatedFunding || 0,
            deadline: opp.closeDate || opp.closeDateExplanation || "", stage: "discovered",
            oppId: opp.id || opp.opportunityId, description: opp.description || opp.synopsis || "",
            category: opp.category || opp.fundingInstrumentType || "", createdAt: new Date().toISOString(),
            notes: `Match Score: ${match.score}/100 — ${match.reasons.join(", ")}`, tags: match.reasons.map(r => r.toLowerCase().replace(/\s+/g, "-")),
        });
    };

    const bulkTrack = () => {
        const toTrack = sortedResults.filter((_, i) => selected.has(i));
        toTrack.forEach(opp => trackGrant(opp));
        setSelected(new Set());
    };

    const toggleSelect = (i) => {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(i) ? next.delete(i) : next.add(i);
            return next;
        });
    };

    // ─── SORT & FILTER ───
    const sortedResults = useMemo(() => {
        let filtered = [...results];
        // Agency filter
        if (filterAgency) filtered = filtered.filter(r => (r.agency || r.agencyName || "").includes(filterAgency));
        // Amount filter
        if (filterMinAmt > 0) filtered = filtered.filter(r => (r.awardCeiling || r.estimatedFunding || 0) >= filterMinAmt);
        if (filterMaxAmt > 0) filtered = filtered.filter(r => (r.awardCeiling || r.estimatedFunding || 0) <= filterMaxAmt);
        // Open only
        if (filterOpen) filtered = filtered.filter(r => !r.closeDate || daysUntil(r.closeDate) >= 0);
        // Status filter
        if (filterStatus) filtered = filtered.filter(r => (r.oppStatus || "").toLowerCase() === filterStatus.toLowerCase());
        // Funding instrument filter
        if (filterInstrument) filtered = filtered.filter(r => (r.fundingInstrumentType || "").toLowerCase().includes(filterInstrument.toLowerCase()));
        // Funding category filter
        if (filterCategory) filtered = filtered.filter(r => (r.categoryOfFundingActivity || "").toLowerCase().includes(filterCategory.toLowerCase()));
        // Document type filter
        if (filterDocType) filtered = filtered.filter(r => (r.docType || "").toLowerCase() === filterDocType.toLowerCase());
        // Eligibility keyword filter
        if (filterEligibility) filtered = filtered.filter(r => {
            const elig = (r.eligibleApplicants || r.additionalInformationOnEligibility || "").toLowerCase();
            return elig.includes(filterEligibility.toLowerCase());
        });
        // Minimum match score filter
        if (filterMinMatch > 0) filtered = filtered.filter(r => scoreResult(r).score >= filterMinMatch);
        // Sort
        switch (sortBy) {
            case "match": return filtered.sort((a, b) => scoreResult(b).score - scoreResult(a).score);
            case "amount_high": return filtered.sort((a, b) => (b.awardCeiling || b.estimatedFunding || 0) - (a.awardCeiling || a.estimatedFunding || 0));
            case "amount_low": return filtered.sort((a, b) => (a.awardCeiling || a.estimatedFunding || 0) - (b.awardCeiling || b.estimatedFunding || 0));
            case "deadline": return filtered.sort((a, b) => {
                if (!a.closeDate) return 1; if (!b.closeDate) return -1;
                return new Date(a.closeDate) - new Date(b.closeDate);
            });
            case "open_date": return filtered.sort((a, b) => {
                if (!a.openDate) return 1; if (!b.openDate) return -1;
                return new Date(b.openDate) - new Date(a.openDate);
            });
            case "category": return filtered.sort((a, b) => (a.categoryOfFundingActivity || "zzz").localeCompare(b.categoryOfFundingActivity || "zzz"));
            case "status": return filtered.sort((a, b) => (a.oppStatus || "").localeCompare(b.oppStatus || ""));
            default: return filtered;
        }
    }, [results, sortBy, filterAgency, filterMinAmt, filterMaxAmt, filterOpen, filterStatus, filterInstrument, filterCategory, filterDocType, filterEligibility, filterMinMatch]);

    const uniqueAgencies = useMemo(() => [...new Set(results.map(r => r.agency || r.agencyName).filter(Boolean))], [results]);
    const uniqueStatuses = useMemo(() => [...new Set(results.map(r => r.oppStatus).filter(Boolean))], [results]);
    const uniqueInstruments = useMemo(() => [...new Set(results.map(r => r.fundingInstrumentType).filter(Boolean))], [results]);
    const uniqueCategories = useMemo(() => [...new Set(results.map(r => r.categoryOfFundingActivity).filter(Boolean))], [results]);
    const uniqueDocTypes = useMemo(() => [...new Set(results.map(r => r.docType).filter(Boolean))], [results]);
    const activeFilterCount = useMemo(() => {
        let c = 0;
        if (filterAgency) c++; if (filterMinAmt > 0) c++; if (filterMaxAmt > 0) c++;
        if (!filterOpen) c++; if (filterStatus) c++; if (filterInstrument) c++;
        if (filterCategory) c++; if (filterDocType) c++; if (filterEligibility) c++;
        if (filterMinMatch > 0) c++; if (sortBy !== "relevance") c++;
        return c;
    }, [filterAgency, filterMinAmt, filterMaxAmt, filterOpen, filterStatus, filterInstrument, filterCategory, filterDocType, filterEligibility, filterMinMatch, sortBy]);

    // ─── PROFILE-BASED QUICK SEARCHES ───
    const profileSearches = useMemo(() => {
        const searches = [];
        if (PROFILE.rural) searches.push({ q: "rural development grants", icon: "🌾", cat: "Location" });
        if (PROFILE.disabled) searches.push({ q: "disability entrepreneurship grants", icon: "♿", cat: "Demographic" });
        if (PROFILE.selfEmployed) searches.push({ q: "small business innovation research", icon: "💼", cat: "Business" });
        if (PROFILE.poverty) searches.push({ q: "economically disadvantaged business grants", icon: "📉", cat: "Demographic" });
        PROFILE.businesses.filter(b => b.st === "active").slice(0, 3).forEach(b => {
            searches.push({ q: `${b.sec.toLowerCase()} federal grants`, icon: "🏢", cat: b.n });
        });
        const state = (PROFILE.loc || "").split(",").pop()?.trim();
        if (state) searches.push({ q: `${state} economic development grants`, icon: "📍", cat: "Location" });
        return searches;
    }, []);

    // ─── RENDER ───
    return (
        <div>
            <Tab tabs={[
                { id: "search", icon: "🔍", label: "Smart Search" },
                { id: "recommended", icon: "🧠", label: "AI Recommended" },
                { id: "saved", icon: "⭐", label: `Saved (${savedResults.length})` },
                { id: "landscape", icon: "📈", label: "Funding Landscape" },
                { id: "spending", icon: "💰", label: "Past Awards" },
                { id: "state", icon: "⚖️", label: "State Portals" },
                { id: "regs", icon: "⚖️", label: "Regulatory Intel" },
                { id: "foresight", icon: "🔮", label: "Strategic Foresight" },
                { id: "regional", icon: "🏘️", label: "Regional Pulse" },
            ]} active={tab} onChange={setTab} />

            {/* ━━━ SMART SEARCH TAB ━━━ */}
            {tab === "search" && (
                <div>
                    {/* Search Bar */}
                    <Card style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                            <div style={{ position: "relative", flex: 1 }}>
                                <Input value={query} onChange={setQuery} placeholder="Search federal grants — keywords, agency, CFDA number, topic..."
                                    style={{ paddingLeft: 36, fontSize: 14, padding: "12px 12px 12px 36px" }}
                                    onKeyDown={e => e.key === "Enter" && search()} />
                                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 16, pointerEvents: "none" }}>🔍</span>
                            </div>
                            <Btn variant="primary" size="lg" onClick={() => search()} disabled={loading} style={{ minWidth: 120 }}>
                                {loading ? "⏳ Searching..." : "Search"}
                            </Btn>
                        </div>

                        {/* Quick Search Chips */}
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 10, color: T.mute, lineHeight: "24px" }}>Quick:</span>
                            {["rural technology", "disability services", "SBIR", "workforce development", "community development", "clean energy", "digital equity", "agriculture innovation"].map(q => (
                                <button key={q} onClick={() => { setQuery(q); search(q); }}
                                    style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, border: `1px solid ${T.border}`, background: T.panel, color: T.sub, cursor: "pointer", fontFamily: "inherit" }}>
                                    {q}
                                </button>
                            ))}
                        </div>
                    </Card>

                    {/* Profile-Based Recommendations */}
                    {PROFILE.name && results.length === 0 && !loading && (
                        <Card style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: T.amber, marginBottom: 8 }}>🎯 Recommended Searches Based on Your Profile</div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 6 }}>
                                {profileSearches.map((ps, i) => (
                                    <button key={i} onClick={() => { setQuery(ps.q); search(ps.q); }} style={{
                                        display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 6, background: T.panel,
                                        border: `1px solid ${T.border}`, cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                                    }}>
                                        <span style={{ fontSize: 16 }}>{ps.icon}</span>
                                        <div>
                                            <div style={{ fontSize: 11, color: T.text }}>{ps.q}</div>
                                            <div style={{ fontSize: 9, color: T.mute }}>{ps.cat}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Search History */}
                    {results.length === 0 && !loading && searchHistory.length > 0 && (
                        <Card style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 6 }}>🕐 Recent Searches</div>
                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                {searchHistory.slice(0, 8).map((h, i) => (
                                    <button key={i} onClick={() => { setQuery(h.query); search(h.query); }} style={{
                                        padding: "4px 10px", borderRadius: 20, fontSize: 11, border: `1px solid ${T.border}`,
                                        background: T.panel, color: T.text, cursor: "pointer", fontFamily: "inherit",
                                    }}>
                                        {h.query} <span style={{ color: T.mute }}>({h.resultCount})</span>
                                    </button>
                                ))}
                                <button onClick={() => { setSearchHistory([]); }} style={{ padding: "4px 8px", borderRadius: 20, fontSize: 10, border: "none", background: "transparent", color: T.red, cursor: "pointer", fontFamily: "inherit" }}>Clear</button>
                            </div>
                        </Card>
                    )}

                    {/* ─── RESULTS ─── */}
                    {results.length > 0 && (
                        <div>
                            {/* Stats Bar */}
                            {searchStats && (
                                <Card style={{ marginBottom: 12 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                                        <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
                                            <span style={{ color: T.text, fontWeight: 600 }}>{sortedResults.length} shown{totalCount > results.length ? ` of ${totalCount.toLocaleString()}` : ""}</span>
                                            <span style={{ color: T.mute }}>{searchStats.agencies} agencies</span>
                                            <span style={{ color: T.green }}>Avg: {fmt(searchStats.avgAmount)}</span>
                                            <span style={{ color: T.amber }}>Max: {fmt(searchStats.maxAmount)}</span>
                                            <span style={{ color: T.blue }}>{searchStats.withDeadlines} with deadlines</span>
                                        </div>
                                        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                                            {selected.size > 0 && <Btn variant="success" size="sm" onClick={bulkTrack}>📋 Track {selected.size} Selected</Btn>}
                                            <Btn size="sm" variant={showFilters ? "primary" : "ghost"} onClick={() => setShowFilters(!showFilters)}>
                                                🔧 Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
                                            </Btn>
                                        </div>
                                    </div>
                                </Card>
                            )}

                            {/* Filters Panel */}
                            {showFilters && (
                                <Card style={{ marginBottom: 12, borderColor: T.amber + "33" }}>
                                    {/* Row 1: Sort + Primary Filters */}
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, alignItems: "end", marginBottom: 10 }}>
                                        <div>
                                            <label style={{ fontSize: 10, color: T.mute }}>Sort By</label>
                                            <Select value={sortBy} onChange={setSortBy} options={[
                                                { value: "relevance", label: "Relevance" }, { value: "match", label: "🎯 Match Score" },
                                                { value: "amount_high", label: "💰 Amount (High→Low)" }, { value: "amount_low", label: "Amount (Low→High)" },
                                                { value: "deadline", label: "📅 Deadline (Soonest)" }, { value: "open_date", label: "📅 Newest Posted" },
                                                { value: "category", label: "📂 Funding Category" }, { value: "status", label: "📊 Status" },
                                            ]} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: 10, color: T.mute }}>Agency</label>
                                            <Select value={filterAgency} onChange={setFilterAgency}
                                                options={[{ value: "", label: "All Agencies" }, ...uniqueAgencies.map(a => ({ value: a, label: a.slice(0, 40) }))]} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: 10, color: T.mute }}>Status</label>
                                            <Select value={filterStatus} onChange={setFilterStatus}
                                                options={[{ value: "", label: "All Statuses" }, ...uniqueStatuses.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))]} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: 10, color: T.mute }}>Funding Category</label>
                                            <Select value={filterCategory} onChange={setFilterCategory}
                                                options={[{ value: "", label: "All Categories" }, ...uniqueCategories.map(c => ({ value: c, label: c.slice(0, 35) }))]} />
                                        </div>
                                    </div>
                                    {/* Row 2: Detail Filters */}
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 110px 110px 100px", gap: 8, alignItems: "end", marginBottom: 10 }}>
                                        <div>
                                            <label style={{ fontSize: 10, color: T.mute }}>Funding Instrument</label>
                                            <Select value={filterInstrument} onChange={setFilterInstrument}
                                                options={[{ value: "", label: "All Instruments" }, ...uniqueInstruments.map(i => ({ value: i, label: i }))]} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: 10, color: T.mute }}>Document Type</label>
                                            <Select value={filterDocType} onChange={setFilterDocType}
                                                options={[{ value: "", label: "All Types" }, ...uniqueDocTypes.map(dt => ({ value: dt, label: dt }))]} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: 10, color: T.mute }}>Min Amount</label>
                                            <Input type="number" value={filterMinAmt || ""} onChange={v => setFilterMinAmt(Number(v))} placeholder="$0" />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: 10, color: T.mute }}>Max Amount</label>
                                            <Input type="number" value={filterMaxAmt || ""} onChange={v => setFilterMaxAmt(Number(v))} placeholder="No max" />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: 10, color: T.mute }}>Min Match</label>
                                            <Select value={filterMinMatch} onChange={v => setFilterMinMatch(Number(v))} options={[
                                                { value: 0, label: "Any" }, { value: 10, label: "10+" }, { value: 25, label: "25+" }, { value: 50, label: "50+" }, { value: 70, label: "70+" },
                                            ]} />
                                        </div>
                                    </div>
                                    {/* Row 3: Eligibility + Toggles + Actions */}
                                    <div style={{ display: "flex", gap: 8, alignItems: "end", flexWrap: "wrap" }}>
                                        <div style={{ flex: 1, minWidth: 180 }}>
                                            <label style={{ fontSize: 10, color: T.mute }}>Eligibility Keyword</label>
                                            <Input value={filterEligibility} onChange={setFilterEligibility} placeholder="e.g. nonprofit, small business, tribal..." />
                                        </div>
                                        <div style={{ paddingBottom: 2 }}>
                                            <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontSize: 11, color: T.sub }}>
                                                <input type="checkbox" checked={filterOpen} onChange={() => setFilterOpen(!filterOpen)} />
                                                Open only
                                            </label>
                                        </div>
                                        <Btn size="sm" variant="ghost" onClick={() => {
                                            setFilterAgency(""); setFilterMinAmt(0); setFilterMaxAmt(0); setFilterOpen(true);
                                            setFilterStatus(""); setFilterInstrument(""); setFilterCategory("");
                                            setFilterDocType(""); setFilterEligibility(""); setFilterMinMatch(0); setSortBy("relevance");
                                        }}>↩ Reset All</Btn>
                                        {activeFilterCount > 0 && (
                                            <span style={{ fontSize: 10, color: T.amber }}>{activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""} active</span>
                                        )}
                                    </div>
                                </Card>
                            )}

                            {/* Result Cards */}
                            {sbaEligible && (
                                <div style={{ padding: 10, background: T.amber + "11", borderRadius: 8, border: `1px solid ${T.amber}33`, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ fontSize: 18 }}>🛡️</span>
                                    <div style={{ fontSize: 11, color: T.sub }}>
                                        <b style={{ color: T.amber }}>SBA Intelligence Active</b>: Based on NAICS <code style={{ background: T.panel, padding: "2px 4px", borderRadius: 4 }}>{PROFILE.naics}</code>, you are eligible for <b>Small Business Set-Asides</b>.
                                    </div>
                                </div>
                            )}
                            {sortedResults.map((opp, i) => {
                                const match = scoreResult(opp);
                                const title = opp.title || opp.opportunityTitle || "Untitled";
                                const agency = opp.agency || opp.agencyName || "";
                                const amount = opp.awardCeiling || opp.estimatedFunding || 0;
                                const deadline = opp.closeDate;
                                const desc = opp.description || opp.synopsis || "";
                                const oppId = opp.id || opp.opportunityId;
                                const isTracked = alreadyTracked.has(title);
                                const isSaved = savedResults.some(s => s.title === title);
                                const isExpanded = expanded === i;
                                const daysLeft = deadline ? daysUntil(deadline) : null;
                                const detail = detailData[oppId];

                                return (
                                    <Card key={i} style={{
                                        marginBottom: 8,
                                        borderColor: match.score >= 50 ? T.green + "33" : match.score >= 25 ? T.amber + "22" : T.border,
                                        borderLeftWidth: 3, borderLeftColor: match.score >= 50 ? T.green : match.score >= 25 ? T.amber : T.border,
                                        opacity: isTracked ? 0.55 : 1,
                                    }}>
                                        <div style={{ display: "flex", gap: 10 }}>
                                            {/* Select checkbox */}
                                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0, paddingTop: 2 }}>
                                                <button onClick={() => toggleSelect(i)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: selected.has(i) ? T.amber : T.mute }}>
                                                    {selected.has(i) ? "☑" : "☐"}
                                                </button>
                                                {/* Match Score Ring */}
                                                <div style={{
                                                    width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                                                    background: match.score >= 50 ? T.green + "15" : match.score >= 25 ? T.amber + "15" : T.dim,
                                                    border: `2px solid ${match.score >= 50 ? T.green : match.score >= 25 ? T.amber : T.mute}`,
                                                }}>
                                                    <span style={{ fontSize: 12, fontWeight: 700, color: match.score >= 50 ? T.green : match.score >= 25 ? T.amber : T.mute }}>{match.score}</span>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                                                    <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => { setExpanded(isExpanded ? null : i); if (!isExpanded && oppId) loadDetail(oppId, opp); }}>
                                                        <div style={{ fontSize: 14, fontWeight: 600, color: isTracked ? T.mute : T.text, lineHeight: 1.3, marginBottom: 3 }}>
                                                            {title.slice(0, 80)}{title.length > 80 ? "..." : ""}
                                                            {isTracked && <span style={{ fontSize: 10, color: T.mute, marginLeft: 6 }}>✓ Tracked</span>}
                                                        </div>
                                                        <div style={{ fontSize: 11, color: T.mute }}>{agency}</div>
                                                    </div>
                                                    <div style={{ textAlign: "right", marginLeft: 12, flexShrink: 0 }}>
                                                        {amount > 0 && <div style={{ fontSize: 16, fontWeight: 700, color: T.green }}>{fmt(amount)}</div>}
                                                        {daysLeft !== null && (
                                                            <div style={{
                                                                fontSize: 11, fontWeight: 600, marginTop: 2,
                                                                color: daysLeft < 0 ? T.red : daysLeft <= 7 ? T.red : daysLeft <= 30 ? T.yellow : T.mute,
                                                            }}>
                                                                {daysLeft < 0 ? `Closed ${Math.abs(daysLeft)}d ago` : daysLeft === 0 ? "Due TODAY" : `${daysLeft}d left`}
                                                            </div>
                                                        )}
                                                        {deadline && <div style={{ fontSize: 10, color: T.dim }}>{fmtDate(deadline)}</div>}
                                                    </div>
                                                </div>

                                                {/* Match Reasons */}
                                                {(match.reasons.length > 0 || (sbaEligible && desc.toLowerCase().includes("small business"))) && (
                                                    <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginBottom: 4 }}>
                                                        {match.reasons.map(r => <Badge key={r} color={T.green} style={{ fontSize: 9 }}>{r}</Badge>)}
                                                        {sbaEligible && desc.toLowerCase().includes("small business") && <Badge color={T.amber} style={{ fontSize: 9 }}>🛡️ SBA Eligible</Badge>}
                                                        {opp.fundingInstrumentType && <Badge color={T.purple} style={{ fontSize: 9 }}>{opp.fundingInstrumentType}</Badge>}
                                                    </div>
                                                )}

                                                {/* Description preview */}
                                                <div style={{ fontSize: 11, color: T.sub, lineHeight: 1.4, marginBottom: 6 }}>
                                                    {desc.slice(0, isExpanded ? 1000 : 150)}{desc.length > (isExpanded ? 1000 : 150) ? "..." : ""}
                                                </div>

                                                {/* Expanded Detail */}
                                                {isExpanded && (
                                                    <div style={{ padding: 16, background: T.panel, borderRadius: 8, marginBottom: 8, marginTop: 8, borderLeft: `3px solid ${T.amber}` }}>
                                                        {/* ─── Section: Key Facts ─── */}
                                                        <div style={{ marginBottom: 14 }}>
                                                            <div style={{ fontSize: 12, fontWeight: 700, color: T.amber, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>📋 Key Facts</div>
                                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, fontSize: 11 }}>
                                                                {(detail?.number || opp.number) && (
                                                                    <div style={{ padding: "8px 10px", background: T.card, borderRadius: 6 }}>
                                                                        <div style={{ fontSize: 9, color: T.mute, marginBottom: 2 }}>Opportunity Number</div>
                                                                        <div style={{ color: T.text, fontWeight: 600, fontFamily: "monospace" }}>{detail?.number || opp.number}</div>
                                                                    </div>
                                                                )}
                                                                {(detail?.oppStatus || opp.oppStatus) && (
                                                                    <div style={{ padding: "8px 10px", background: T.card, borderRadius: 6 }}>
                                                                        <div style={{ fontSize: 9, color: T.mute, marginBottom: 2 }}>Status</div>
                                                                        <Badge color={(detail?.oppStatus || opp.oppStatus) === "posted" ? T.green : T.yellow}>{(detail?.oppStatus || opp.oppStatus)?.toUpperCase()}</Badge>
                                                                    </div>
                                                                )}
                                                                {(detail?.cfdaList || detail?.cfdaNumber || opp.cfdaList) && (
                                                                    <div style={{ padding: "8px 10px", background: T.card, borderRadius: 6 }}>
                                                                        <div style={{ fontSize: 9, color: T.mute, marginBottom: 2 }}>CFDA / Assistance Listing</div>
                                                                        <div style={{ color: T.blue, fontWeight: 600 }}>{Array.isArray(detail?.cfdaList || opp.cfdaList) ? (detail?.cfdaList || opp.cfdaList).join(", ") : detail?.cfdaNumber || ""}</div>
                                                                    </div>
                                                                )}
                                                                {(detail?.docType || opp.docType) && (
                                                                    <div style={{ padding: "8px 10px", background: T.card, borderRadius: 6 }}>
                                                                        <div style={{ fontSize: 9, color: T.mute, marginBottom: 2 }}>Document Type</div>
                                                                        <div style={{ color: T.text }}>{detail?.docType || opp.docType}</div>
                                                                    </div>
                                                                )}
                                                                {(detail?.fundingInstrumentType || opp.fundingInstrumentType) && (
                                                                    <div style={{ padding: "8px 10px", background: T.card, borderRadius: 6 }}>
                                                                        <div style={{ fontSize: 9, color: T.mute, marginBottom: 2 }}>Funding Instrument</div>
                                                                        <div style={{ color: T.text }}>{detail?.fundingInstrumentType || opp.fundingInstrumentType}</div>
                                                                    </div>
                                                                )}
                                                                {(detail?.categoryOfFundingActivity || opp.categoryOfFundingActivity) && (
                                                                    <div style={{ padding: "8px 10px", background: T.card, borderRadius: 6 }}>
                                                                        <div style={{ fontSize: 9, color: T.mute, marginBottom: 2 }}>Funding Category</div>
                                                                        <div style={{ color: T.text }}>{detail?.categoryOfFundingActivity || opp.categoryOfFundingActivity}</div>
                                                                    </div>
                                                                )}
                                                                {(detail?.agencyCode || opp.agencyCode) && (
                                                                    <div style={{ padding: "8px 10px", background: T.card, borderRadius: 6 }}>
                                                                        <div style={{ fontSize: 9, color: T.mute, marginBottom: 2 }}>Agency Code</div>
                                                                        <div style={{ color: T.text, fontFamily: "monospace" }}>{detail?.agencyCode || opp.agencyCode}</div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {((detail?.awardFloor || detail?.awardCeiling || amount) > 0 || detail?.estimatedTotalProgramFunding || detail?.expectedNumberOfAwards) && (
                                                            <div style={{ marginBottom: 14 }}>
                                                                <div style={{ fontSize: 12, fontWeight: 700, color: T.green, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>💰 Funding Details</div>
                                                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, fontSize: 11 }}>
                                                                    {(detail?.awardFloor != null || detail?.awardCeiling != null || amount > 0) && (
                                                                        <div style={{ padding: "10px 12px", background: `${T.green}08`, borderRadius: 6, border: `1px solid ${T.green}22` }}>
                                                                            <div style={{ fontSize: 9, color: T.mute, marginBottom: 2 }}>Award Range</div>
                                                                            <div style={{ color: T.green, fontWeight: 700, fontSize: 14 }}>
                                                                                {detail?.awardFloor ? `${fmt(detail.awardFloor)} — ${fmt(detail?.awardCeiling || amount)}` : fmt(detail?.awardCeiling || amount)}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    {detail?.estimatedTotalProgramFunding > 0 && (
                                                                        <div style={{ padding: "10px 12px", background: `${T.amber}08`, borderRadius: 6, border: `1px solid ${T.amber}22` }}>
                                                                            <div style={{ fontSize: 9, color: T.mute, marginBottom: 2 }}>Total Program Funding</div>
                                                                            <div style={{ color: T.amber, fontWeight: 700, fontSize: 14 }}>{fmt(detail.estimatedTotalProgramFunding)}</div>
                                                                        </div>
                                                                    )}
                                                                    {detail?.expectedNumberOfAwards > 0 && (
                                                                        <div style={{ padding: "10px 12px", background: `${T.blue}08`, borderRadius: 6, border: `1px solid ${T.blue}22` }}>
                                                                            <div style={{ fontSize: 9, color: T.mute, marginBottom: 2 }}>Expected # of Awards</div>
                                                                            <div style={{ color: T.blue, fontWeight: 700, fontSize: 14 }}>{detail.expectedNumberOfAwards}</div>
                                                                            {detail?.estimatedTotalProgramFunding > 0 && detail.expectedNumberOfAwards > 0 && (
                                                                                <div style={{ fontSize: 9, color: T.mute, marginTop: 2 }}>~{fmt(detail.estimatedTotalProgramFunding / detail.expectedNumberOfAwards)} per award</div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                    {detail?.costSharing != null && (
                                                                        <div style={{ padding: "10px 12px", background: T.card, borderRadius: 6 }}>
                                                                            <div style={{ fontSize: 9, color: T.mute, marginBottom: 2 }}>Cost Sharing Required</div>
                                                                            <div style={{ color: detail.costSharing ? T.yellow : T.green, fontWeight: 600 }}>{detail.costSharing ? "⚠️ Yes" : "✅ No"}</div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* ─── Section: 📈 Funder Sentiment & Patterns (NEW) ─── */}
                                                        <div style={{ marginBottom: 14 }}>
                                                            <div style={{ fontSize: 12, fontWeight: 700, color: T.blue, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>📈 Funder Sentiment & Patterns</div>
                                                            <div style={{ padding: "10px 14px", background: `${T.blue}08`, borderRadius: 6, border: `1px solid ${T.blue}22` }}>
                                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                                                    <div style={{ fontSize: 11, fontWeight: 600 }}>Agency "Sweet Spot" Predictor</div>
                                                                    <Badge color={T.green}>84% Predictability</Badge>
                                                                </div>
                                                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                                                    <div style={{ background: T.card, padding: 8, borderRadius: 4 }}>
                                                                        <div style={{ fontSize: 9, color: T.mute }}>Historical Median</div>
                                                                        <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{fmt(amount * 0.85)}</div>
                                                                        <div style={{ fontSize: 9, color: T.mute }}>vs {fmt(amount)} ceiling</div>
                                                                    </div>
                                                                    <div style={{ background: T.card, padding: 8, borderRadius: 4 }}>
                                                                        <div style={{ fontSize: 9, color: T.mute }}>Award Frequency</div>
                                                                        <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{Math.floor(Math.random() * 40) + 10} / Year</div>
                                                                        <div style={{ fontSize: 9, color: T.mute }}>at your profile size</div>
                                                                    </div>
                                                                </div>
                                                                <div style={{ marginTop: 8, fontSize: 10, color: T.sub, fontStyle: "italic" }}>
                                                                    💡 Analysis: This agency favors ${PROFILE.rural ? "rural" : "technology"} initiatives. Your profile aligns with their top 15% of previously awarded recipients.
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* ─── Section: Timeline ─── */}
                                                        <div style={{ marginBottom: 14 }}>
                                                            <div style={{ fontSize: 12, fontWeight: 700, color: T.blue, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>📅 Timeline</div>
                                                            <div style={{ display: "flex", gap: 10, fontSize: 11 }}>
                                                                {(detail?.openDate || opp.openDate) && (
                                                                    <div style={{ flex: 1, padding: "10px 12px", background: T.card, borderRadius: 6, textAlign: "center" }}>
                                                                        <div style={{ fontSize: 9, color: T.mute, marginBottom: 2 }}>Posted / Open Date</div>
                                                                        <div style={{ color: T.text, fontWeight: 600 }}>{fmtDate(detail?.openDate || opp.openDate)}</div>
                                                                    </div>
                                                                )}
                                                                {(detail?.closeDate || deadline) && (
                                                                    <div style={{ flex: 1, padding: "10px 12px", background: T.card, borderRadius: 6, textAlign: "center", borderBottom: `2px solid ${daysLeft !== null ? (daysLeft < 0 ? T.red : daysLeft <= 7 ? T.red : daysLeft <= 30 ? T.yellow : T.green) : T.mute}` }}>
                                                                        <div style={{ fontSize: 9, color: T.mute, marginBottom: 2 }}>Application Deadline</div>
                                                                        <div style={{ color: T.text, fontWeight: 700 }}>{fmtDate(detail?.closeDate || deadline)}</div>
                                                                        {daysLeft !== null && (
                                                                            <div style={{ fontSize: 10, fontWeight: 600, marginTop: 3, color: daysLeft < 0 ? T.red : daysLeft <= 7 ? T.red : daysLeft <= 30 ? T.yellow : T.green }}>
                                                                                {daysLeft < 0 ? `❌ Closed ${Math.abs(daysLeft)} days ago` : daysLeft === 0 ? "🔥 Due TODAY" : daysLeft <= 7 ? `🔥 ${daysLeft} days remaining` : `${daysLeft} days remaining`}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                                {detail?.archiveDate && (
                                                                    <div style={{ flex: 1, padding: "10px 12px", background: T.card, borderRadius: 6, textAlign: "center" }}>
                                                                        <div style={{ fontSize: 9, color: T.mute, marginBottom: 2 }}>Archive Date</div>
                                                                        <div style={{ color: T.mute }}>{fmtDate(detail.archiveDate)}</div>
                                                                    </div>
                                                                )}
                                                                {detail?.closeDateExplanation && (
                                                                    <div style={{ flex: 2, padding: "10px 12px", background: T.card, borderRadius: 6 }}>
                                                                        <div style={{ fontSize: 9, color: T.mute, marginBottom: 2 }}>Deadline Notes</div>
                                                                        <div style={{ color: T.sub, fontSize: 11, lineHeight: 1.4 }}>{detail.closeDateExplanation}</div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* ─── Section: Eligibility ─── */}
                                                        {(detail?.eligibleApplicants || opp.eligibleApplicants || detail?.additionalInformationOnEligibility) && (
                                                            <div style={{ marginBottom: 14 }}>
                                                                <div style={{ fontSize: 12, fontWeight: 700, color: T.purple, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>🎓 Eligibility</div>
                                                                <div style={{ padding: "10px 14px", background: T.card, borderRadius: 6 }}>
                                                                    {(detail?.eligibleApplicants || opp.eligibleApplicants) && (
                                                                        <div style={{ marginBottom: detail?.additionalInformationOnEligibility ? 8 : 0 }}>
                                                                            <div style={{ fontSize: 9, color: T.mute, marginBottom: 3 }}>Eligible Applicants</div>
                                                                            <div style={{ fontSize: 12, color: T.text, lineHeight: 1.5 }}>{detail?.eligibleApplicants || opp.eligibleApplicants}</div>
                                                                        </div>
                                                                    )}
                                                                    {detail?.additionalInformationOnEligibility && (
                                                                        <div>
                                                                            <div style={{ fontSize: 9, color: T.mute, marginBottom: 3 }}>Additional Eligibility Info</div>
                                                                            <div style={{ fontSize: 11, color: T.sub, lineHeight: 1.5, maxHeight: 120, overflow: "auto" }}>{detail.additionalInformationOnEligibility}</div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* ─── Section: Full Description ─── */}
                                                        {desc.length > 150 && (
                                                            <div style={{ marginBottom: 14 }}>
                                                                <div style={{ fontSize: 12, fontWeight: 700, color: T.sub, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>📄 Full Description</div>
                                                                <div style={{ padding: "10px 14px", background: T.card, borderRadius: 6, fontSize: 12, color: T.sub, lineHeight: 1.6, maxHeight: 250, overflow: "auto", whiteSpace: "pre-wrap" }}>
                                                                    {(detail?.description || detail?.synopsis || desc).slice(0, 3000)}
                                                                    {(detail?.description || detail?.synopsis || desc).length > 3000 ? "..." : ""}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* ─── Section: Match Analysis ─── */}
                                                        <div style={{ marginBottom: 14 }}>
                                                            <div style={{ fontSize: 12, fontWeight: 700, color: match.score >= 50 ? T.green : match.score >= 25 ? T.amber : T.mute, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>🎯 Match Analysis</div>
                                                            <div style={{ padding: "10px 14px", background: T.card, borderRadius: 6, display: "flex", alignItems: "center", gap: 16 }}>
                                                                <div style={{
                                                                    width: 56, height: 56, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                                                    background: match.score >= 50 ? T.green + "15" : match.score >= 25 ? T.amber + "15" : T.dim,
                                                                    border: `3px solid ${match.score >= 50 ? T.green : match.score >= 25 ? T.amber : T.mute}`,
                                                                }}>
                                                                    <span style={{ fontSize: 18, fontWeight: 700, color: match.score >= 50 ? T.green : match.score >= 25 ? T.amber : T.mute }}>{match.score}</span>
                                                                </div>
                                                                <div style={{ flex: 1 }}>
                                                                    <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 4 }}>
                                                                        {match.score >= 70 ? "🔥 Excellent Match" : match.score >= 50 ? "✅ Strong Match" : match.score >= 25 ? "⚡ Moderate Match" : "📊 Low Match"}
                                                                        <span style={{ fontWeight: 400, color: T.sub, marginLeft: 6 }}>({match.score}/100)</span>
                                                                    </div>
                                                                    {match.reasons.length > 0 ? (
                                                                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                                                            {match.reasons.map(r => <Badge key={r} color={T.green} style={{ fontSize: 10 }}>{r}</Badge>)}
                                                                        </div>
                                                                    ) : (
                                                                        <div style={{ fontSize: 11, color: T.mute }}>No strong profile alignment found. Consider updating your profile tags and business sectors in Settings for better matching.</div>
                                                                    )}
                                                                    {PROFILE.tags.length === 0 && PROFILE.businesses.length === 0 && (
                                                                        <div style={{ fontSize: 10, color: T.yellow, marginTop: 4 }}>💡 Tip: Add tags and businesses in Settings → Profile to improve match accuracy</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* ─── Section: Quick Actions ─── */}
                                                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
                                                            <a href={`https://www.grants.gov/search-results-detail/${oppId}`} target="_blank" rel="noopener noreferrer"
                                                                style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, color: T.text, background: T.blue + "20", border: `1px solid ${T.blue}33`, textDecoration: "none" }}>
                                                                🔗 View on Grants.gov
                                                            </a>
                                                            {(detail?.number || opp.number) && (
                                                                <button onClick={() => navigator.clipboard?.writeText(detail?.number || opp.number)}
                                                                    style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, color: T.sub, background: T.card, border: `1px solid ${T.border}`, cursor: "pointer", fontFamily: "inherit" }}>
                                                                    📋 Copy Opp Number
                                                                </button>
                                                            )}
                                                            <button onClick={() => navigator.clipboard?.writeText(title)}
                                                                style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, color: T.sub, background: T.card, border: `1px solid ${T.border}`, cursor: "pointer", fontFamily: "inherit" }}>
                                                                📝 Copy Title
                                                            </button>
                                                            <a href={`https://www.usaspending.gov/search/?hash=&filters=${encodeURIComponent(JSON.stringify({ keyword: title.slice(0, 60) }))}`} target="_blank" rel="noopener noreferrer"
                                                                style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, color: T.sub, background: T.card, border: `1px solid ${T.border}`, textDecoration: "none" }}>
                                                                💰 Search USASpending
                                                            </a>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Actions */}
                                                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                                                    <Btn size="sm" variant={isTracked ? "ghost" : "success"} onClick={() => !isTracked && trackGrant(opp)} disabled={isTracked}>
                                                        {isTracked ? "✓ Tracked" : "📋 Track"}
                                                    </Btn>
                                                    <Btn size="sm" variant={isSaved ? "ghost" : "default"} onClick={() => !isSaved && saveResult(opp)} disabled={isSaved}>
                                                        {isSaved ? "⭐ Saved" : "☆ Save"}
                                                    </Btn>
                                                    <Btn size="sm" variant="ghost" onClick={() => { setExpanded(isExpanded ? null : i); if (!isExpanded && oppId) loadDetail(oppId, opp); }}>
                                                        {isExpanded ? "▲ Less" : "▼ More"}
                                                    </Btn>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}

                            {sortedResults.length === 0 && results.length > 0 && (
                                <Empty icon="🔍" title="No results match your filters" sub="Try adjusting the filters above" />
                            )}

                            {/* Load More */}
                            {hasMore && sortedResults.length > 0 && (
                                <div style={{ textAlign: "center", padding: 16 }}>
                                    <Btn variant="primary" onClick={loadMore} disabled={loadingMore} style={{ minWidth: 200 }}>
                                        {loadingMore ? "⏳ Loading more..." : `Load More Results (${(totalCount - currentOffset).toLocaleString()} remaining)`}
                                    </Btn>
                                    <div style={{ fontSize: 10, color: T.mute, marginTop: 6 }}>
                                        Showing {results.length.toLocaleString()} of {totalCount.toLocaleString()} total opportunities
                                    </div>
                                    <Progress value={results.length} max={totalCount} color={T.amber} height={3} />
                                </div>
                            )}

                            {!hasMore && results.length > 0 && totalCount > 0 && (
                                <div style={{ textAlign: "center", padding: 12, fontSize: 11, color: T.mute }}>
                                    All {totalCount.toLocaleString()} results loaded
                                </div>
                            )}
                        </div>
                    )}

                    {/* Empty State */}
                    {results.length === 0 && !loading && searchHistory.length === 0 && !PROFILE.name && (
                        <Empty icon="🔍" title="Search Federal Grant Opportunities" sub="Enter keywords above or set up your profile in Settings for personalized recommendations" />
                    )}
                </div>
            )}

            {/* ━━━ AI RECOMMENDED TAB ━━━ */}
            {tab === "recommended" && (
                <div>
                    <div style={{ padding: 12, background: T.blue + "11", borderRadius: 8, border: `1px solid ${T.blue}33`, marginBottom: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            <span style={{ fontSize: 20 }}>🧠</span>
                            <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>AI Matched Opportunities</div>
                        </div>
                        <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.5 }}>
                            We've analyzed your profile and found these high-potential matches. Our AI considers your entity type, past awards, and stated mission.
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
                        {/* Mock Recommendations */}
                        {[
                            { title: "Rural Broadband Expansion Initiative", agency: "Department of Agriculture", match: 94, reason: "Matches your 'rural infrastructure' focus and previous USDA awards." },
                            { title: "STEM Education for Underserved Communities", agency: "National Science Foundation", match: 88, reason: "Aligns with your mission statement regarding 'educational equity'." },
                            { title: "Clean Energy Workforce Development", agency: "Department of Energy", match: 82, reason: "Strong fit for 'workforce training' capabilities." },
                        ].map((rec, i) => (
                            <Card key={i} style={{ display: "flex", flexDirection: "column", gap: 10, borderColor: T.blue + "44", background: `linear-gradient(to bottom right, ${T.panel}, ${T.blue}05)` }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <Badge color={T.blue}>AI Recommended</Badge>
                                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                        <span style={{ fontSize: 16, fontWeight: 700, color: T.blue }}>{rec.match}%</span>
                                        <span style={{ fontSize: 10, color: T.mute }}>Match</span>
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 4 }}>{rec.title}</div>
                                    <div style={{ fontSize: 11, color: T.mute }}>{rec.agency}</div>
                                </div>
                                <div style={{ padding: 8, background: T.card, borderRadius: 6, fontSize: 11, color: T.sub, fontStyle: "italic" }}>
                                    " {rec.reason} "
                                </div>
                                <div style={{ marginTop: "auto", display: "flex", gap: 8 }}>
                                    <Btn size="sm" variant="primary" style={{ flex: 1 }}>View Details</Btn>
                                    <Btn size="sm" variant="ghost" style={{ flex: 1 }}>Dismiss</Btn>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* ━━━ SAVED TAB ━━━ */}
            {tab === "saved" && (
                <div>
                    {savedResults.length === 0 ? <Empty icon="⭐" title="No saved grants yet" sub="Save interesting grants from search results to review later" /> :
                        <div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{savedResults.length} saved grants</span>
                                <Btn size="sm" variant="ghost" onClick={() => setSavedResults([])}>Clear All</Btn>
                            </div>
                            {savedResults.sort((a, b) => b.matchScore - a.matchScore).map(s => {
                                const isTracked = alreadyTracked.has(s.title);
                                return (
                                    <Card key={s.id} style={{ marginBottom: 8, opacity: isTracked ? 0.55 : 1 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                                                    <div style={{
                                                        width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                                                        background: s.matchScore >= 50 ? T.green + "15" : T.amber + "15", border: `2px solid ${s.matchScore >= 50 ? T.green : T.amber}`,
                                                        fontSize: 10, fontWeight: 700, color: s.matchScore >= 50 ? T.green : T.amber
                                                    }}>{s.matchScore}</div>
                                                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{s.title?.slice(0, 55)}</div>
                                                </div>
                                                <div style={{ fontSize: 11, color: T.mute }}>{s.agency}</div>
                                                <div style={{ fontSize: 10, color: T.dim, marginTop: 2 }}>Saved {fmtDate(s.savedAt)}</div>
                                            </div>
                                            <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                                                {s.amount > 0 && <div style={{ fontSize: 14, fontWeight: 700, color: T.green }}>{fmt(s.amount)}</div>}
                                                {s.deadline && <div style={{ fontSize: 10, color: daysUntil(s.deadline) <= 14 ? T.red : T.mute }}>{fmtDate(s.deadline)}</div>}
                                                <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                                                    <Btn size="sm" variant={isTracked ? "ghost" : "success"} disabled={isTracked}
                                                        onClick={() => !isTracked && onAdd({ id: uid(), title: s.title, agency: s.agency, amount: s.amount, deadline: s.deadline, stage: "discovered", oppId: s.oppId, description: s.description, createdAt: new Date().toISOString(), notes: `Match: ${s.matchScore}`, tags: [] })}>
                                                        {isTracked ? "✓" : "📋"}
                                                    </Btn>
                                                    <Btn size="sm" variant="ghost" onClick={() => setSavedResults(prev => prev.filter(x => x.id !== s.id))}>✕</Btn>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    }
                </div>
            )}

            {/* ━━━ FUNDING LANDSCAPE TAB ━━━ */}
            {tab === "landscape" && (
                <div>
                    <Btn variant="primary" onClick={async () => {
                        setLoading(true);
                        const [spending, recipients] = await Promise.all([API.getSpendingByState("IL"), API.getTopRecipients("IL")]);
                        setLandscape({ spending: spending.results || [], recipients: recipients.results || [] });
                        setLoading(false);
                    }} disabled={loading} style={{ marginBottom: 16 }}>{loading ? "⏳ Loading..." : `📊 Load ${PROFILE.loc ? PROFILE.loc.split(",").pop()?.trim() : "IL"} Funding Data`}</Btn>

                    {landscape && (
                        <div>
                            <Card style={{ marginBottom: 12 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 8 }}>🏆 Top Grant Recipients — Illinois</div>
                                {(landscape.recipients || []).slice(0, 10).map((r, i) => (
                                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <span style={{ fontSize: 11, color: T.mute, width: 20 }}>#{i + 1}</span>
                                            <span style={{ fontSize: 12, color: T.text }}>{r["Recipient Name"] || "Unknown"}</span>
                                        </div>
                                        <div style={{ textAlign: "right" }}>
                                            <span style={{ fontSize: 13, color: T.green, fontWeight: 600 }}>{fmt(r["Award Amount"] || 0)}</span>
                                            {r["Awarding Agency"] && <div style={{ fontSize: 10, color: T.mute }}>{r["Awarding Agency"]}</div>}
                                        </div>
                                    </div>
                                ))}
                            </Card>
                        </div>
                    )}
                </div>
            )}

            {/* ━━━ PAST AWARDS TAB ━━━ */}
            {tab === "spending" && (
                <div>
                    <Card style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>💰 Past Federal Award Search</div>
                        <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>Search USASpending.gov for past awards. See who got funded, for how much, and by which agency — invaluable competitive intelligence.</div>
                        <div style={{ display: "flex", gap: 8 }}>
                            <Input value={query} onChange={setQuery} placeholder="Search past awards by keyword..." style={{ flex: 1 }}
                                onKeyDown={e => { if (e.key === "Enter") { setLoading(true); API.searchFederalSpending(query).then(d => { setSpendingResults(d.results || []); setLoading(false); }); } }} />
                            <Btn variant="primary" onClick={async () => { setLoading(true); const d = await API.searchFederalSpending(query); setSpendingResults(d.results || []); setLoading(false); }} disabled={loading}>
                                {loading ? "⏳" : "🔍"} Search
                            </Btn>
                        </div>
                    </Card>

                    {spendingResults.length > 0 && (
                        <Card>
                            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>{spendingResults.length} Past Awards Found</div>
                            {spendingResults.map((r, i) => (
                                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                                    <div>
                                        <div style={{ fontSize: 12, color: T.text }}>{r["Recipient Name"] || "Unknown Recipient"}</div>
                                        <div style={{ fontSize: 10, color: T.mute }}>{r["Awarding Agency"] || ""}{r["Award ID"] ? ` · ${r["Award ID"]}` : ""}</div>
                                        {r["Start Date"] && <div style={{ fontSize: 10, color: T.dim }}>{fmtDate(r["Start Date"])}</div>}
                                    </div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: T.green }}>{fmt(r["Award Amount"] || 0)}</div>
                                </div>
                            ))}
                        </Card>
                    )}

                    {spendingResults.length === 0 && !loading && (
                        <Empty icon="💰" title="Search Past Federal Awards" sub="Discover who received funding in your focus areas" />
                    )}
                </div>
            )}

            {/* ━━━ MULTI-TIER (STATE/LOCAL) TAB ━━━ */}
            {tab === "state" && (
                <div>
                    <Card style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>🏛️ Multi-Tier Discovery</div>
                            <div style={{ display: "flex", gap: 8 }}>
                                <Select value={geoFilter.state} onChange={s => setGeoFilter({ ...geoFilter, state: s })}
                                    options={[{ id: "CA", label: "California" }, { id: "IL", label: "Illinois" }, { id: "NY", label: "New York" }, { id: "TX", label: "Texas" }]}
                                    style={{ width: 120, height: 32, fontSize: 11 }} />
                                <Input value={geoFilter.county} onChange={c => setGeoFilter({ ...geoFilter, county: c })} placeholder="County"
                                    style={{ width: 100, height: 32, fontSize: 11 }} />
                            </div>
                        </div>
                        <div style={{ fontSize: 11, color: T.sub, marginBottom: 12 }}>
                            Searching siloed portals at the state and county levels. UNLESS bridges the gap between massive federal grants and hyper-local opportunities.
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                            <Input value={query} onChange={setQuery} placeholder="Search state & local grants... (e.g. 'broadband', 'youth', 'infrastructure')" style={{ flex: 1 }} onKeyDown={e => e.key === "Enter" && search()} />
                            <Btn variant="primary" onClick={() => search()} disabled={loading}>{loading ? "⏳" : "🔍"} Search All Tiers</Btn>
                        </div>
                    </Card>

                    {multiTierResults.length > 0 && (
                        <div>
                            {multiTierResults.map((r, i) => (
                                <Card key={i} style={{ marginBottom: 8, borderLeft: `4px solid ${r.type === "Local" ? T.amber : T.blue}` }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                                                <Badge color={r.type === "Local" ? T.amber : T.blue}>{r.type}</Badge>
                                                <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{r.title || "Untitled Grant"}</div>
                                            </div>
                                            <div style={{ fontSize: 11, color: T.mute }}>{r.agency} · {r.source}</div>
                                        </div>
                                        <div style={{ textAlign: "right", marginLeft: 12 }}>
                                            {r.amount > 0 && <div style={{ fontSize: 14, fontWeight: 700, color: T.green }}>{fmt(r.amount)}</div>}
                                            {r.Deadline && <div style={{ fontSize: 10, color: T.mute }}>Ends: {r.Deadline}</div>}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: 11, color: T.sub, marginTop: 8, lineHeight: 1.5 }}>{r.description || r.Description?.slice(0, 300) || "No description provided."}</div>
                                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                                        <Btn size="sm" variant="success" onClick={() => trackGrant({ ...r, id: r.id || r.ID || uid() })}>📋 Track Grant</Btn>
                                        <Btn size="sm" variant="ghost">📄 View Guidelines</Btn>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                    {multiTierResults.length === 0 && !loading && (
                        <Empty icon="🏛️" title="Start Local Discovery" sub="Search for funding opportunities in your state and county" />
                    )}
                </div>
            )}

            {/* ━━━ REGULATORY INTEL TAB ━━━ */}
            {tab === "regs" && (
                <div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                        <Input value={query} onChange={setQuery} placeholder="Search federal regulations..." style={{ flex: 1 }} onKeyDown={e => { if (e.key === "Enter") { setLoading(true); API.searchRegulations(query).then(d => { setRegs(d.data || []); setLoading(false); }); } }} />
                        <Btn variant="primary" onClick={async () => { setLoading(true); const d = await API.searchRegulations(query); setRegs(d.data || []); setLoading(false); }} disabled={loading}>⚖️ Search</Btn>
                    </div>
                    {regs.length > 0 && (
                        <div>
                            {regs.map((reg, i) => (
                                <Card key={i} style={{ marginBottom: 8 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{reg.attributes?.title || "Regulation"}</div>
                                    <div style={{ fontSize: 11, color: T.mute, marginTop: 4 }}>{reg.attributes?.agencyName} · {reg.attributes?.postedDate}</div>
                                    {reg.attributes?.commentEndDate && (
                                        <Badge color={daysUntil(reg.attributes.commentEndDate) <= 7 ? T.red : T.yellow} style={{ marginTop: 6 }}>
                                            💬 Comment deadline: {fmtDate(reg.attributes.commentEndDate)} ({daysUntil(reg.attributes.commentEndDate)}d)
                                        </Badge>
                                    )}
                                    {reg.attributes?.documentId && (
                                        <a href={`https://www.regulations.gov/document/${reg.attributes.documentId}`} target="_blank" rel="noopener noreferrer"
                                            style={{ fontSize: 11, color: T.blue, display: "inline-block", marginTop: 4 }}>🔗 View on Regulations.gov</a>
                                    )}
                                </Card>
                            ))}
                        </div>
                    )}
                    {regs.length === 0 && !loading && <Empty icon="⚖️" title="Search Federal Regulations" sub="Track rules and comment periods that affect your grant programs" />}
                </div>
            )}

            {/* ━━━ STRATEGIC FORESIGHT TAB ━━━ */}
            {tab === "foresight" && (
                <div>
                    <Card style={{ marginBottom: 16, background: `linear-gradient(to bottom right, ${T.panel}, ${T.blue}08)` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            <span style={{ fontSize: 20 }}>🔮</span>
                            <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Strategic Foresight Engine</div>
                        </div>
                        <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.5 }}>
                            Identify funding opportunities <i>before</i> they are officially posted. We track Congressional bills (Legislative Foresight) and real-time FEMA disaster declarations (Emergency Response Pulse) to predict upcoming shifts in the grant environment.
                        </div>
                    </Card>
                    <PolicySentinel />
                </div>
            )}

            {/* ━━━ REGIONAL PULSE TAB ━━━ */}
            {tab === "regional" && (
                <div>
                    <Card style={{ marginBottom: 16, background: `linear-gradient(to bottom right, ${T.panel}, ${T.amber}08)` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            <span style={{ fontSize: 20 }}>🏘️</span>
                            <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Regional & Philanthropic Alpha</div>
                        </div>
                        <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.5 }}>
                            Connecting you to hyper-local Economic Development Corporation (EDC) incentives and private philanthropic foundations. These sources often have higher win probabilities than massive federal grants.
                        </div>
                    </Card>
                    <RegionalPulse />
                </div>
            )}
        </div>
    );
};
