import React, { useState, useCallback, useEffect } from 'react';
import { Card, Badge, Btn, Tabs, Input, SkeletonCard } from '../ui';
import { T, uid, PROFILE } from '../globals';
import { API } from '../api';
import { useStore } from '../store';
import { Globe, Map, Target, Shield, Cpu, Zap, DollarSign, Bookmark, TrendingUp, Search, CheckCircle, AlertCircle, Loader, Database, ChevronDown } from 'lucide-react';

// Sub-components
import { GovContractRadar } from "./GovContractRadar";
import { TaxCreditNavigator } from "./TaxCreditNavigator";
import { EarmarkScout } from "./EarmarkScout";
import { PhilanthropyPulse } from "./PhilanthropyPulse";
import { SynergyEngine } from "./SynergyEngine";
import { PolicySentinel } from "./PolicySentinel";
import { SurplusSentinel } from "./SurplusSentinel";
import { SubGrantRadar } from "./SubGrantRadar";
import { FoundationScout990 } from "./FoundationScout990";
import { DAFSignal } from "./DAFSignal";
import { PRINavigator } from "./PRINavigator";
import { CyPresScout } from "./CyPresScout";
import { DAOMap } from "./DAOMap";
import { CSRAllianceMapper } from "./CSRAllianceMapper";
import { GivingCircleScout } from "./GivingCircleScout";
import { UnsolicitedProspector } from "./UnsolicitedProspector";
import { ChamberPulse } from "./ChamberPulse";
import { FaithFunder } from "./FaithFunder";
import { CBALedger } from "./CBALedger";
import { InKindVault } from "./InKindVault";
import { RegionalPulse } from "./RegionalPulse";
import { FamilyOfficeProspector } from "./FamilyOfficeProspector";
import { PeerProspecting } from "./PeerProspecting";
import { LegislativeTracker } from "./LegislativeTracker";
import { MatchAlerts } from "./MatchAlerts";

// ─── SOURCE STATUS PILL ───────────────────────────────────────────────────────
const SourcePill = ({ label, count, ok, color, loading }) => (
    <div style={{
        display: "flex", alignItems: "center", gap: 6, padding: "5px 12px",
        borderRadius: 20, background: ok ? `${color}18` : "rgba(255,255,255,0.04)",
        border: `1px solid ${ok ? color + "44" : "rgba(255,255,255,0.08)"}`,
        fontSize: 11, fontWeight: 700, color: ok ? color : T.mute,
        transition: "all 0.3s ease"
    }}>
        {loading ? <Loader style={{ width: 10, height: 10, animation: "spin 1s linear infinite" }} />
            : ok ? <CheckCircle style={{ width: 10, height: 10 }} />
                : <AlertCircle style={{ width: 10, height: 10 }} />}
        {label}
        {!loading && <span style={{ background: ok ? `${color}33` : "rgba(255,255,255,0.08)", borderRadius: 10, padding: "1px 6px" }}>{count}</span>}
    </div>
);

// ─── RESULT CARD ─────────────────────────────────────────────────────────────
const GrantResultCard = ({ g, onAdd }) => (
    <Card key={g.id} glow style={{ marginBottom: 12, borderLeft: `4px solid ${g._sourceColor || T.blue}`, transition: "transform 0.2s" }}
        onMouseEnter={e => e.currentTarget.style.transform = "translateX(3px)"}
        onMouseLeave={e => e.currentTarget.style.transform = "translateX(0)"}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1, paddingRight: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                    <Badge color={g._sourceColor || T.blue} style={{ fontSize: 9, fontWeight: 800, letterSpacing: 0.5 }}>
                        {g._source || "Unknown"}
                    </Badge>
                    {g.agency && <Badge color={T.mute} style={{ fontSize: 9 }}>{g.agency}</Badge>}
                    {g.cfda && <Badge color={T.indigo} style={{ fontSize: 9 }}>CFDA: {g.cfda}</Badge>}
                    {g.meta?.gs_verified && <Badge color={T.green} style={{ fontSize: 9 }}>✅ GuideStar Verified</Badge>}
                    {(g._score > 90 || g._source === "SEC EDGAR" || g._source === "IATI Standard") && <Badge color={T.amber} style={{ fontSize: 9, fontWeight: 800 }}>🔥 High Probability</Badge>}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: "0 0 6px", lineHeight: 1.4, fontFamily: "Outfit" }}>{g.title}</h3>
                {g.description && <p style={{ color: T.sub, fontSize: 13, margin: 0, lineHeight: 1.5 }}>{g.description?.slice(0, 200)}{g.description?.length > 200 ? "…" : ""}</p>}
            </div>
            <div style={{ textAlign: "right", minWidth: 140, flexShrink: 0 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: T.green, letterSpacing: "-0.03em" }}>
                    {typeof g.amount === "number" && g.amount > 0 ? `$${g.amount.toLocaleString()}` : g.amount || "—"}
                </div>
                {g.deadline && g.deadline !== "Rolling" && (
                    <div style={{ color: T.mute, fontSize: 11, marginTop: 2 }}>⏰ {typeof g.deadline === "string" ? g.deadline.slice(0, 10) : g.deadline}</div>
                )}
                {g.oppNumber && <div style={{ color: T.mute, fontSize: 10, marginTop: 2, fontFamily: "monospace" }}>{g.oppNumber}</div>}
                <Btn variant="primary" size="sm" style={{ marginTop: 10, width: "100%" }} onClick={() => onAdd(g)}>+ Track</Btn>
            </div>
        </div>
    </Card>
);

// ─── STATE SELECTOR ───────────────────────────────────────────────────────────
const US_STATES = ["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"];

export const Discovery = () => {
    const [tab, setTab] = useState("grants");
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [sources, setSources] = useState(null);
    const [identities, setIdentities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [selectedState, setSelectedState] = useState(() => {
        // Default to user's profile state
        const loc = PROFILE.loc || "";
        const abbr = loc.split(",").pop()?.trim().slice(0, 2).toUpperCase();
        return US_STATES.includes(abbr) ? abbr : "IL";
    });
    const { addGrant } = useStore();

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    const onAdd = (grant) => {
        addGrant({ ...grant, id: grant.id || uid() });
        showToast(`✅ Tracked: ${grant.title?.slice(0, 42) || "Opportunity"}`);
    };

    // Auto-search on mount if org profile has focus areas
    useEffect(() => {
        if (results.length > 0 || loading) return;
        const focusAreas = PROFILE.focus || [];
        const orgName = PROFILE.name || "";
        if (focusAreas.length > 0) {
            const autoQuery = focusAreas.slice(0, 2).join(" ") + (orgName ? ` ${orgName}` : "");
            setQuery(autoQuery);
            // Slight delay so UI renders first
            setTimeout(() => {
                setLoading(true);
                setResults([]);
                setSources(null);
                API.searchGrantsMultiSource(autoQuery).then(data => {
                    setResults(data.results || []);
                    setSources(data.sources);
                    setLoading(false);
                });
            }, 400);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleTabChange = (newTab) => {
        setTab(newTab);
        setResults([]);
        setSources(null);
        setIdentities([]);
    };

    const handleSearch = async () => {
        if (!query.trim()) return;
        setLoading(true);
        setResults([]);
        setSources(null);

        if (tab === "grants") {
            const data = await API.searchGrantsMultiSource(query);
            setResults(data.results || []);
            setSources(data.sources);
        } else if (tab === "philanthropy") {
            const [data, candid] = await Promise.all([
                API.searchPhilanthropyMultiSource(query),
                API.searchCandidProBono(query)
            ]);
            setResults([...(data.results || []), ...candid]);
            setSources(data.sources);
            setIdentities(data.identities || []);
        } else if (tab === "international") {
            const data = await API.searchInternationalMultiSource(query);
            setResults(data.results || []);
            setSources(data.sources);
        } else if (tab === "state") {
            const [data, municipal] = await Promise.all([
                API.searchStateGrants(query, selectedState),
                API.searchMunicipalPulse(query, selectedState)
            ]);
            const baseResults = Array.isArray(data) ? data : (data.results || []);
            setResults([...baseResults, ...municipal]);
            if (!Array.isArray(data)) setSources(data.sources);
        }
        setLoading(false);
    };

    const TABS = [
        { id: "grants", label: "Federal Grants", icon: <Globe className="w-4 h-4" /> },
        { id: "international", label: "International", icon: <Globe className="w-4 h-4" /> },
        { id: "state", label: "State & Local", icon: <Map className="w-4 h-4" /> },
        { id: "philanthropy", label: "Philanthropy", icon: <DollarSign className="w-4 h-4" /> },
        { id: "regional", label: "Regional/Local", icon: <Target className="w-4 h-4" /> },
        { id: "contracts", label: "Contracts", icon: <Shield className="w-4 h-4" /> },
        { id: "tax_credits", label: "Tax Credits", icon: <TrendingUp className="w-4 h-4" /> },
        { id: "earmarks", label: "Earmarks", icon: <Bookmark className="w-4 h-4" /> },
        { id: "foresight", label: "Strategic Foresight", icon: <Cpu className="w-4 h-4" /> },
        { id: "alerts", label: "Match Alerts", icon: <Zap className="w-4 h-4" /> },
    ];

    const showSearchBar = tab === "grants" || tab === "state" || tab === "philanthropy" || tab === "international";

    return (
        <div className="discovery-hub animate-in" style={{ position: "relative" }}>
            {/* Toast Notification */}
            {toast && (
                <div style={{
                    position: "fixed", bottom: 28, right: 28, zIndex: 9999,
                    background: `linear-gradient(135deg, ${T.green}22, ${T.panel})`,
                    border: `1px solid ${T.green}44`, borderRadius: 14,
                    padding: "14px 20px", display: "flex", alignItems: "center", gap: 10,
                    boxShadow: `0 8px 32px ${T.green}22`, backdropFilter: "blur(12px)",
                    fontSize: 13, fontWeight: 700, color: T.text, animation: "fadeIn 0.3s ease"
                }}>
                    <CheckCircle style={{ width: 18, height: 18, color: T.green }} />
                    {toast}
                </div>
            )}

            <header style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 32, fontWeight: 900, color: T.text, margin: 0, letterSpacing: "-0.04em", fontFamily: "Outfit" }}>Discovery Hub</h1>
                <p style={{ color: T.sub, marginTop: 4, fontSize: 15 }}>Global funding intelligence & strategic opportunity mapping.</p>
            </header>

            {/* Search bar — only for tabs that support it */}
            {showSearchBar && (
                <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
                    {/* State Selector (State tab only) */}
                    {tab === "state" && (
                        <div style={{ position: "relative", flexShrink: 0 }}>
                            <select
                                value={selectedState}
                                onChange={e => setSelectedState(e.target.value)}
                                style={{
                                    appearance: "none", padding: "0 36px 0 12px", height: 48, borderRadius: 12,
                                    border: `1px solid ${T.glassBorder}`, background: T.glassLg, color: T.text,
                                    fontSize: 13, fontWeight: 700, cursor: "pointer", outline: "none"
                                }}>
                                {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <ChevronDown style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: T.mute, pointerEvents: "none" }} />
                        </div>
                    )}
                    <div style={{ flex: 1, position: "relative" }}>
                        <Search style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 17, height: 17, color: T.mute }} />
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target ? e.target.value : e)}
                            placeholder={tab === 'grants'
                                ? 'Search 7 sources: Grants.gov · NIH · NSF · Challenge · SAM · SBIR · USASpending…'
                                : tab === 'philanthropy'
                                    ? 'Search 5 sources: IRS 990-PF · SEC EDGAR · OpenAlex · News · Identity…'
                                    : tab === 'international'
                                        ? 'Search International: World Bank Open Data · Projects & Operations…'
                                        : `Search ${selectedState} portal · Grants.gov · USASpending…`}
                            style={{ paddingLeft: 44, height: 48, borderRadius: 12, border: `1px solid ${T.glassBorder}`, background: T.glassLg }}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>
                    <Btn variant="primary" style={{ padding: "0 24px", height: 48, borderRadius: 12, flexShrink: 0 }} onClick={handleSearch} disabled={loading}>
                        {loading ? <><Loader style={{ width: 14, height: 14, display: "inline-block", marginRight: 6, animation: "spin 1s linear infinite" }} />Scanning…</> : "🔍 Search"}
                    </Btn>
                </div>
            )}

            {/* Source Status Bar */}
            {showSearchBar && (sources || loading) && (
                <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Database style={{ width: 12, height: 12, color: T.mute }} />
                    <span style={{ fontSize: 10, color: T.mute, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase' }}>Sources:</span>
                    {tab === 'grants' && <>
                        <SourcePill label="Grants.gov" count={sources?.grantsGov?.count ?? '…'} ok={sources?.grantsGov?.ok} color="#22c55e" loading={loading} />
                        <SourcePill label="NIH Reporter" count={sources?.nih?.count ?? '…'} ok={sources?.nih?.ok} color="#06b6d4" loading={loading} />
                        <SourcePill label="NSF Awards" count={sources?.nsf?.count ?? '…'} ok={sources?.nsf?.ok} color="#ec4899" loading={loading} />
                        <SourcePill label="Challenge.gov" count={sources?.challenge?.count ?? '…'} ok={sources?.challenge?.ok} color="#f43f5e" loading={loading} />
                        <SourcePill label="SAM.gov" count={sources?.sam?.count ?? '…'} ok={sources?.sam?.ok} color="#3b82f6" loading={loading} />
                        <SourcePill label="SBIR.gov" count={sources?.sbir?.count ?? '…'} ok={sources?.sbir?.ok} color="#8b5cf6" loading={loading} />
                        <SourcePill label="USASpending" count={sources?.usaSpending?.count ?? '…'} ok={sources?.usaSpending?.ok} color="#f59e0b" loading={loading} />
                    </>}
                    {tab === 'state' && <>
                        <SourcePill label={`${selectedState} Portal`} count={sources?.statePortal?.count ?? '…'} ok={sources?.statePortal?.ok} color="#8b5cf6" loading={loading} />
                        <SourcePill label="Grants.gov" count={sources?.grantsGov?.count ?? '…'} ok={sources?.grantsGov?.ok} color="#22c55e" loading={loading} />
                        <SourcePill label="USASpending" count={sources?.usaSpending?.count ?? '…'} ok={sources?.usaSpending?.ok} color="#f59e0b" loading={loading} />
                    </>}
                    {tab === 'philanthropy' && <>
                        <SourcePill label="IRS 990-PF" count={sources?.pf?.count ?? '…'} ok={sources?.pf?.ok} color="#8b5cf6" loading={loading} />
                        <SourcePill label="SEC EDGAR" count={sources?.sec?.count ?? '…'} ok={sources?.sec?.ok} color="#1e40af" loading={loading} />
                        <SourcePill label="OpenAlex" count={sources?.alex?.count ?? '…'} ok={sources?.alex?.ok} color="#06b6d4" loading={loading} />
                        <SourcePill label="Phil News" count={sources?.news?.count ?? '…'} ok={sources?.news?.ok} color="#3b82f6" loading={loading} />
                        <SourcePill label="IRS Identity" count={sources?.eos?.count ?? '…'} ok={sources?.eos?.ok} color="#22c55e" loading={loading} />
                    </>}
                    {tab === 'international' && <>
                        <SourcePill label="World Bank" count={sources?.wb?.count ?? '…'} ok={sources?.wb?.ok} color="#059669" loading={loading} />
                    </>}
                    {!loading && results.length > 0 && (
                        <span style={{ marginLeft: 'auto', fontSize: 11, color: T.mute, fontWeight: 700 }}>
                            {results.length} results · deduplicated &amp; ranked
                        </span>
                    )}
                </div>
            )}

            {/* Tab Navigation */}
            <div className="flex overflow-x-auto pb-2 gap-1 border-b border-white/5 scrollbar-hide" style={{ marginBottom: 0 }}>
                {TABS.map(t => (
                    <button
                        key={t.id}
                        onClick={() => handleTabChange(t.id)}
                        style={{ transition: "all 0.2s" }}
                        className={`px-4 py-3 flex items-center gap-2 whitespace-nowrap text-sm border-b-2 ${tab === t.id ? "border-amber-500 text-amber-500 bg-white/5" : "border-transparent text-gray-500 hover:text-gray-300"}`}
                    >
                        {t.icon}
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div style={{ marginTop: 28 }}>

                {/* ── FEDERAL GRANTS ── */}
                {tab === "grants" && (
                    <div>
                        {results.length === 0 && !loading && (
                            <Card style={{ textAlign: 'center', padding: '56px 40px', borderTop: `3px solid ${T.amber}` }}>
                                <div style={{ fontSize: 40, marginBottom: 14 }}>🔍</div>
                                <div style={{ fontWeight: 800, color: T.text, marginBottom: 8, fontSize: 18, fontFamily: 'Outfit' }}>7-Source Federal Search</div>
                                <p style={{ color: T.mute, fontSize: 13, maxWidth: 500, margin: '0 auto 24px', lineHeight: 1.7 }}>
                                    Simultaneously scans all major federal funding databases — deduplicates and ranks results in a single unified view.
                                </p>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                                    {[['Grants.gov', '#22c55e'], ['NIH Reporter', '#06b6d4'], ['NSF Awards', '#ec4899'], ['Challenge.gov', '#f43f5e'], ['SAM.gov', '#3b82f6'], ['SBIR.gov', '#8b5cf6'], ['USASpending', '#f59e0b']].map(([label, color]) => (
                                        <span key={label} style={{ padding: '5px 12px', borderRadius: 20, background: color + '18', border: `1px solid ${color}44`, fontSize: 11, fontWeight: 700, color }}>{label}</span>
                                    ))}
                                </div>
                            </Card>
                        )}
                        {loading && [1, 2, 3, 4].map(i => <SkeletonCard key={i} lines={3} style={{ marginBottom: 12 }} />)}
                        {results.map(g => <GrantResultCard key={g.id} g={g} onAdd={onAdd} />)}
                    </div>
                )}

                {/* ── INTERNATIONAL GRANTS ── */}
                {tab === "international" && (
                    <div>
                        {results.length === 0 && !loading && (
                            <Card style={{ textAlign: 'center', padding: '56px 40px', borderTop: `3px solid ${T.green}` }}>
                                <div style={{ fontSize: 40, marginBottom: 14 }}>🌎</div>
                                <div style={{ fontWeight: 800, color: T.text, marginBottom: 8, fontSize: 18, fontFamily: 'Outfit' }}>International Development Search</div>
                                <p style={{ color: T.mute, fontSize: 13, maxWidth: 500, margin: '0 auto 24px', lineHeight: 1.7 }}>
                                    Scans Global Development projects via the <strong style={{ color: T.green }}>World Bank Open Data</strong> API. Tracks IBRD and IDA projects across all regions.
                                </p>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                                    {[['World Bank IBRD', '#059669'], ['World Bank IDA', '#10b981'], ['Projects & Ops', '#34d399']].map(([label, color]) => (
                                        <span key={label} style={{ padding: '5px 12px', borderRadius: 20, background: color + '18', border: `1px solid ${color}44`, fontSize: 11, fontWeight: 700, color }}>{label}</span>
                                    ))}
                                </div>
                            </Card>
                        )}
                        {loading && [1, 2, 3].map(i => <SkeletonCard key={i} lines={3} style={{ marginBottom: 12 }} />)}
                        {results.map(g => <GrantResultCard key={g.id} g={g} onAdd={onAdd} />)}
                    </div>
                )}

                {/* ── STATE & LOCAL ── */}
                {tab === "state" && (
                    <div>
                        {results.length === 0 && !loading && (
                            <Card style={{ textAlign: "center", padding: 60 }}>
                                <div style={{ fontSize: 32, marginBottom: 12 }}>🗺️</div>
                                <div style={{ fontWeight: 700, color: T.text, marginBottom: 6 }}>State & Local Multi-Source Search</div>
                                <p style={{ color: T.mute, fontSize: 13, maxWidth: 420, margin: "0 auto" }}>
                                    Select your state, then search. Pulls from the <strong style={{ color: "#8b5cf6" }}>state's own portal</strong>, federal <strong style={{ color: "#22c55e" }}>Grants.gov</strong>, and <strong style={{ color: "#f59e0b" }}>USASpending</strong> awards placed in that state.
                                </p>
                            </Card>
                        )}
                        {loading && [1, 2].map(i => (
                            <Card key={i} style={{ marginBottom: 12, padding: 24, opacity: 0.5 }}>
                                <div style={{ height: 12, background: "rgba(255,255,255,0.08)", borderRadius: 6, width: "55%", marginBottom: 10 }} />
                                <div style={{ height: 10, background: "rgba(255,255,255,0.05)", borderRadius: 6, width: "75%" }} />
                            </Card>
                        ))}
                        {results.map(g => <GrantResultCard key={g.id} g={g} onAdd={onAdd} />)}
                    </div>
                )}

                {/* ── REGIONAL/LOCAL ── */}
                {tab === "regional" && (
                    <div className="space-y-8">
                        <RegionalPulse onAdd={onAdd} />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <ChamberPulse onAdd={onAdd} />
                            <FaithFunder onAdd={onAdd} />
                            <CBALedger onAdd={onAdd} />
                            <InKindVault onAdd={onAdd} />
                            <SurplusSentinel onAdd={onAdd} />
                        </div>
                    </div>
                )}

                {tab === "contracts" && <GovContractRadar onAdd={onAdd} />}
                {tab === "tax_credits" && <TaxCreditNavigator onAdd={onAdd} />}
                {tab === "earmarks" && <EarmarkScout onAdd={onAdd} />}

                {/* ── PHILANTHROPY ── */}
                {tab === "philanthropy" && (
                    <div className="space-y-8">
                        {/* Search Results View */}
                        {(results.length > 0 || loading) && (
                            <div>
                                {results.length === 0 && loading && [1, 2].map(i => <SkeletonCard key={i} lines={3} style={{ marginBottom: 12 }} />)}

                                {/* Identity Results (IRS EOS) */}
                                {identities.length > 0 && (
                                    <div style={{ marginBottom: 24, padding: 16, background: `${T.green}08`, borderRadius: 16, border: `1px solid ${T.green}22` }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                            <CheckCircle style={{ width: 14, height: 14, color: T.green }} />
                                            <span style={{ fontSize: 11, fontWeight: 800, color: T.green, letterSpacing: 0.5 }}>IRS IDENTITY VERIFICATION (501c3 STATUS)</span>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                                            {identities.map(id => (
                                                <div key={id.id} style={{ padding: 12, borderRadius: 12, border: `1px solid ${T.glassBorder}`, background: T.glassLg, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div>
                                                        <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{id.title}</div>
                                                        <div style={{ fontSize: 11, color: T.mute }}>EIN: {id.id} · {id.status}</div>
                                                    </div>
                                                    <Badge color={T.green}>VERIFIED</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {results.map(p => <GrantResultCard key={p.id} g={p} onAdd={onAdd} />)}
                                <div style={{ textAlign: "center", padding: "20px 0" }}>
                                    <Btn variant="secondary" onClick={() => { setResults([]); setIdentities([]); setSources(null); setQuery(""); }}>Clear Search Results</Btn>
                                </div>
                            </div>
                        )}

                        {/* Default Landing View (if no search active) */}
                        {results.length === 0 && !loading && (
                            <>
                                <Card style={{ textAlign: 'center', padding: '40px', borderTop: `3px solid ${T.blue}` }}>
                                    <div style={{ fontSize: 32, marginBottom: 12 }}>🏛️</div>
                                    <div style={{ fontWeight: 800, color: T.text, marginBottom: 8, fontSize: 18, fontFamily: 'Outfit' }}>Philanthropy Multi-Source Search</div>
                                    <p style={{ color: T.mute, fontSize: 13, maxWidth: 500, margin: '0 auto 24px', lineHeight: 1.7 }}>
                                        Scans private foundations, academic funding research, and real-time news signals. Includes automated 501(c)(3) identity verification via the IRS.
                                    </p>
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                                        {[['IRS 990-PF', '#8b5cf6'], ['SEC EDGAR', '#1e40af'], ['OpenAlex Research', '#06b6d4'], ['Inside Philanthropy', '#3b82f6'], ['IRS Identity Check', '#22c55e']].map(([label, color]) => (
                                            <span key={label} style={{ padding: '4px 12px', borderRadius: 20, background: color + '15', border: `1px solid ${color}33`, fontSize: 10, fontWeight: 700, color }}>{label}</span>
                                        ))}
                                    </div>
                                </Card>

                                <PhilanthropyPulse onAdd={onAdd} />
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <FoundationScout990 onAdd={onAdd} />
                                    <FamilyOfficeProspector onAdd={onAdd} />
                                    <PeerProspecting onAdd={onAdd} />
                                    <DAFSignal onAdd={onAdd} />
                                    <PRINavigator onAdd={onAdd} />
                                    <CyPresScout onAdd={onAdd} />
                                    <GivingCircleScout onAdd={onAdd} />
                                    <DAOMap onAdd={onAdd} />
                                    <CSRAllianceMapper onAdd={onAdd} />
                                    <UnsolicitedProspector onAdd={onAdd} />
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ── MATCH ALERTS ── */}
                {tab === "alerts" && <MatchAlerts onAdd={onAdd} />}

                {/* ── STRATEGIC FORESIGHT ── */}
                {tab === "foresight" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <LegislativeTracker onAdd={onAdd} />
                        <PolicySentinel onAdd={onAdd} />
                        <SynergyEngine onAdd={onAdd} />
                        <SubGrantRadar onAdd={onAdd} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Discovery;
