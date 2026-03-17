import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Card, Badge, Btn, Tabs, Input, SkeletonCard } from '../ui';
import { T, uid, PROFILE, fmt } from '../globals';
import { API } from '../api';
import { useStore } from '../store';
import { Globe, Map, Target, Shield, Cpu, Zap, DollarSign, Bookmark, TrendingUp, Search, CheckCircle, AlertCircle, Loader, Database, ChevronDown, X, ExternalLink, FileText, Sparkles, Clock, Building2, Hash, Users, Calendar, Tag, ChevronRight } from 'lucide-react';

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
// ─── OPPORTUNITY DETAIL DRAWER ───────────────────────────────────────────────
const OpportunityDrawer = ({ grant: g, onClose, onAdd, isTracked }) => {
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiPhase, setAiPhase] = useState("");
    const [activeTab, setActiveTab] = useState("overview");
    const [copied, setCopied] = useState(null);
    const [drafting, setDrafting] = useState(false);
    const [draftText, setDraftText] = useState("");
    const [similar, setSimilar] = useState([]);
    const [similarLoading, setSimilarLoading] = useState(false);
    const drawerRef = useRef(null);
    const { contacts = [], addGrant: storeAdd } = useStore();

    const link = g?.link || g?.url || g?.sourceUrl;
    const daysLeft = g?.deadline && g?.deadline !== "Rolling"
        ? Math.ceil((new Date(g.deadline) - Date.now()) / 86400000) : null;
    const urgencyColor = daysLeft !== null
        ? (daysLeft <= 7 ? T.red : daysLeft <= 21 ? T.amber : T.green) : T.mute;
    const scoreColor = (s) => s >= 80 ? T.green : s >= 60 ? T.amber : T.red;

    // Relevant contacts from org book
    const relatedContacts = contacts.filter(c => {
        const hay = `${c.org || ""} ${c.role || ""} ${c.tags?.join(" ") || ""}`.toLowerCase();
        const needle = `${g.agency || ""} ${g.title || ""} ${g.category || ""}`.toLowerCase();
        return needle.split(" ").filter(w => w.length > 4).some(w => hay.includes(w));
    }).slice(0, 4);

    useEffect(() => {
        const h = (e) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [onClose]);

    useEffect(() => {
        const h = (e) => { if (drawerRef.current && !drawerRef.current.contains(e.target)) onClose(); };
        const t = setTimeout(() => window.addEventListener("mousedown", h), 80);
        return () => { clearTimeout(t); window.removeEventListener("mousedown", h); };
    }, [onClose]);

    // Auto-run AI when opening AI tab
    useEffect(() => {
        if (activeTab === "ai" && !aiAnalysis && !aiLoading) runAIAnalysis();
        if (activeTab === "similar" && similar.length === 0 && !similarLoading) loadSimilar();
    }, [activeTab]);

    const copy = (text, key) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(key);
            setTimeout(() => setCopied(null), 1800);
        });
    };

    const runAIAnalysis = async () => {
        setAiLoading(true);
        const phases = [
            "Scanning org profile & tags…",
            "Cross-referencing eligibility criteria…",
            "Assessing competition landscape…",
            "Generating strategic recommendations…"
        ];
        let i = 0;
        setAiPhase(phases[0]);
        const interval = setInterval(() => { i = Math.min(i + 1, phases.length - 1); setAiPhase(phases[i]); }, 1400);

        const sys = `You are a senior grant strategist. Analyze this opportunity against the org profile. Return ONLY valid JSON:
{
  "eligibilityScore": <0-100>,
  "verdict": "Strong Match"|"Good Match"|"Possible Match"|"Low Match",
  "headline": "<one-sentence strategic take>",
  "strengths": ["<strength>", ...],
  "risks": ["<risk or gap>", ...],
  "nextSteps": ["<actionable step>", ...],
  "competitionLevel": "Low"|"Medium"|"High"|"Very High",
  "estimatedEffort": "1-2 days"|"1 week"|"2-3 weeks"|"1+ month",
  "winRate": <estimated % win probability 0-100>,
  "keyRequirements": ["<requirement>", ...],
  "applicationTip": "<single most important tip for this specific funder>"
}`;
        const prompt = `Org: ${PROFILE.name || "Unknown"} | Focus: ${(PROFILE.focus||[]).join(", ")} | Tags: ${(PROFILE.tags||[]).join(", ")} | Location: ${PROFILE.loc||"Unknown"} | NAICS: ${PROFILE.naics||"N/A"} | Revenue: ${PROFILE.revenue ? "$"+PROFILE.revenue.toLocaleString() : "Unknown"}.

Opportunity: "${g.title}"
Agency: ${g.agency||"Unknown"} | Amount: ${typeof g.amount==="number"?"$"+g.amount.toLocaleString():g.amount||"Unknown"} | Deadline: ${g.deadline||"Unknown"}
CFDA: ${g.cfda||"N/A"} | Type: ${g.awardType||"Grant"} | Set-Aside: ${g.setAside||"None"} | Source: ${g._source||"Federal"}
Description: ${g.description?.slice(0, 800)||"No description"}`;

        try {
            const res = await API.callAI([{ role: "user", content: prompt }], sys);
            const raw = (res.text || "{}").replace(/```json\n?|```/g, "").trim();
            setAiAnalysis(JSON.parse(raw));
        } catch {
            setAiAnalysis({
                eligibilityScore: 0, verdict: "Analysis unavailable",
                headline: "Could not complete analysis — check AI connection.",
                strengths: [], risks: ["AI response parse error"], nextSteps: [],
                competitionLevel: "Unknown", estimatedEffort: "Unknown",
                winRate: 0, keyRequirements: [], applicationTip: ""
            });
        }
        clearInterval(interval);
        setAiPhase("");
        setAiLoading(false);
    };

    const loadSimilar = async () => {
        setSimilarLoading(true);
        try {
            const q = [g.agency, ...(PROFILE.focus||[])].filter(Boolean).slice(0,2).join(" ");
            const data = await API.searchGrantsMultiSource(q);
            setSimilar((data.results||[]).filter(r => r.id !== g.id).slice(0, 5));
        } catch { setSimilar([]); }
        setSimilarLoading(false);
    };

    const generateDraft = async () => {
        setDrafting(true);
        setDraftText("");
        const sys = "You are a grant writer. Write a concise 3-paragraph project narrative opening for this opportunity. Be specific and persuasive. Use the org's focus areas. Under 250 words.";
        const prompt = `Org: ${PROFILE.name||"Our Organization"}. Focus: ${(PROFILE.focus||[]).join(", ")}. Location: ${PROFILE.loc||""}.\nOpportunity: ${g.title} (${g.agency}). Amount: ${typeof g.amount==="number"?"$"+g.amount.toLocaleString():g.amount}.\nDescription: ${g.description?.slice(0,400)||""}`;
        try {
            const res = await API.callAI([{ role: "user", content: prompt }], sys);
            setDraftText(res.text || "Draft generation failed.");
        } catch { setDraftText("Draft generation failed — check AI connection."); }
        setDrafting(false);
    };

    if (!g) return null;

    const tabs = [
        { key: "overview", label: "Overview", icon: "📋" },
        { key: "ai",       label: "AI Match",  icon: "🧠" },
        { key: "apply",    label: "Apply",     icon: "✍️" },
        { key: "similar",  label: "Similar",   icon: "🔗" },
        { key: "raw",      label: "Raw Data",  icon: "⚙️" },
    ];

    const CopyBtn = ({ value, id, label = "" }) => (
        <button onClick={() => copy(value, id)} title="Copy" style={{
            background: copied === id ? `${T.green}22` : "rgba(255,255,255,0.06)",
            border: `1px solid ${copied === id ? T.green+"44" : T.glassBorder}`,
            borderRadius: 5, padding: "2px 7px", cursor: "pointer", fontSize: 10,
            color: copied === id ? T.green : T.mute, transition: "all 0.15s", marginLeft: 6
        }}>{copied === id ? "✓" : label || "copy"}</button>
    );

    const Row = ({ icon: Icon, label, value, mono, rowLink, color, copyId }) => value ? (
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "9px 0", borderBottom: `1px solid ${T.glassBorder}` }}>
            {Icon && <Icon size={13} style={{ color: T.mute, flexShrink: 0, marginTop: 2 }} />}
            <div style={{ fontSize: 11, color: T.mute, minWidth: 100, flexShrink: 0, paddingTop: 1 }}>{label}</div>
            <div style={{ fontSize: 13, color: color || T.text, fontFamily: mono ? "monospace" : undefined, flex: 1, wordBreak: "break-word", lineHeight: 1.5 }}>
                {rowLink
                    ? <a href={rowLink} target="_blank" rel="noopener noreferrer" style={{ color: T.blue, textDecoration: "none" }}>{value} <ExternalLink size={10} style={{ verticalAlign: "middle" }} /></a>
                    : value}
                {copyId && <CopyBtn value={String(value)} id={copyId} />}
            </div>
        </div>
    ) : null;

    const amtDisplay = typeof g.amount === "number" && g.amount > 0
        ? g.amount >= 1e6 ? `$${(g.amount / 1e6).toFixed(2)}M` : `$${g.amount.toLocaleString()}` : g.amount || "—";

    return (
        <>
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 999, animation: "fadeIn 0.15s" }} />
            <div ref={drawerRef} style={{
                position: "fixed", top: 0, right: 0, bottom: 0,
                width: "min(680px, 100vw)",
                background: "linear-gradient(180deg, #0f1117 0%, #0a0d14 100%)",
                backdropFilter: "blur(32px)",
                borderLeft: `1px solid ${g._sourceColor || T.blue}44`,
                zIndex: 1000, display: "flex", flexDirection: "column",
                animation: "slideInRight 0.28s cubic-bezier(0.22,1,0.36,1)",
                boxShadow: "-32px 0 100px rgba(0,0,0,0.6)",
                overflow: "hidden",
            }}>
                {/* ── Color accent bar ── */}
                <div style={{ height: 3, background: `linear-gradient(90deg, ${g._sourceColor || T.blue}, ${g._scoreColor || T.indigo || T.blue}88)`, flexShrink: 0 }} />

                {/* ── HEADER ── */}
                <div style={{ padding: "18px 24px 0", flexShrink: 0, background: `linear-gradient(180deg, ${g._sourceColor || T.blue}0d 0%, transparent 100%)` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 9 }}>
                                <Badge color={g._sourceColor || T.blue} style={{ fontSize: 9, fontWeight: 900, letterSpacing: 0.7 }}>{g._source || "Federal"}</Badge>
                                {g.cfda && <Badge color="#6366f1" style={{ fontSize: 9 }}>CFDA {g.cfda}</Badge>}
                                {g.awardType && <Badge color={T.mute} style={{ fontSize: 9 }}>{g.awardType}</Badge>}
                                {g.setAside && <Badge color="#0ea5e9" style={{ fontSize: 9 }}>{g.setAside}</Badge>}
                                {g.category && <Badge color="#a855f7" style={{ fontSize: 9 }}>{g.category}</Badge>}
                                {g.status && <Badge color={g.status==="Open"||g.status==="Posted" ? T.green : T.mute} style={{ fontSize: 9 }}>● {g.status}</Badge>}
                                {isTracked && <Badge color={T.green} style={{ fontSize: 9 }}>✓ Tracked</Badge>}
                            </div>
                            <h2 style={{ fontSize: 16, fontWeight: 800, color: T.text, margin: 0, lineHeight: 1.4, fontFamily: "Outfit" }}>{g.title}</h2>
                            <div style={{ fontSize: 12, color: T.sub, marginTop: 5, display: "flex", alignItems: "center", gap: 8 }}>
                                {g.agency}
                                {g.oppNumber && <><span style={{ color: T.glassBorder }}>·</span><span style={{ fontFamily: "monospace", fontSize: 10, color: T.mute }}>#{g.oppNumber}</span><CopyBtn value={g.oppNumber} id="oppnum" /></>}
                            </div>
                        </div>
                        <button onClick={onClose} style={{
                            background: "rgba(255,255,255,0.07)", border: `1px solid ${T.glassBorder}`,
                            borderRadius: 8, padding: 8, cursor: "pointer", color: T.mute, flexShrink: 0,
                            display: "flex", alignItems: "center", transition: "background 0.15s",
                        }} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.12)"}
                           onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.07)"}>
                            <X size={15} />
                        </button>
                    </div>

                    {/* ── Hero stats row ── */}
                    <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                        {/* Amount */}
                        <div style={{ background: `${T.green}12`, border: `1px solid ${T.green}2a`, borderRadius: 10, padding: "10px 14px", minWidth: 120 }}>
                            <div style={{ fontSize: 9, color: T.mute, fontWeight: 800, letterSpacing: 1, marginBottom: 3 }}>AWARD</div>
                            <div style={{ fontSize: 20, fontWeight: 900, color: T.green, letterSpacing: "-0.03em" }}>{amtDisplay}</div>
                            {g.amountFloor > 0 && <div style={{ fontSize: 10, color: T.mute }}>min ${g.amountFloor.toLocaleString()}</div>}
                        </div>
                        {/* Deadline */}
                        {g.deadline && (
                            <div style={{ background: `${urgencyColor}12`, border: `1px solid ${urgencyColor}2a`, borderRadius: 10, padding: "10px 14px", minWidth: 100 }}>
                                <div style={{ fontSize: 9, color: T.mute, fontWeight: 800, letterSpacing: 1, marginBottom: 3 }}>DEADLINE</div>
                                <div style={{ fontSize: 15, fontWeight: 800, color: urgencyColor }}>
                                    {g.deadline === "Rolling" ? "Rolling" : String(g.deadline).slice(0, 10)}
                                </div>
                                {daysLeft !== null && <div style={{ fontSize: 10, color: urgencyColor, fontWeight: 700 }}>{daysLeft > 0 ? `${daysLeft}d left` : "Expired"}</div>}
                            </div>
                        )}
                        {/* AI score if available */}
                        {aiAnalysis && (
                            <div style={{ background: `${scoreColor(aiAnalysis.eligibilityScore)}12`, border: `1px solid ${scoreColor(aiAnalysis.eligibilityScore)}2a`, borderRadius: 10, padding: "10px 14px", cursor: "pointer" }} onClick={() => setActiveTab("ai")}>
                                <div style={{ fontSize: 9, color: T.mute, fontWeight: 800, letterSpacing: 1, marginBottom: 3 }}>AI MATCH</div>
                                <div style={{ fontSize: 20, fontWeight: 900, color: scoreColor(aiAnalysis.eligibilityScore) }}>{aiAnalysis.eligibilityScore}%</div>
                                <div style={{ fontSize: 10, color: T.mute }}>{aiAnalysis.verdict}</div>
                            </div>
                        )}
                        {/* Source link */}
                        {link && (
                            <a href={link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                                <div style={{ background: `${T.blue}12`, border: `1px solid ${T.blue}2a`, borderRadius: 10, padding: "10px 14px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, minWidth: 60 }}>
                                    <ExternalLink size={15} color={T.blue} />
                                    <div style={{ fontSize: 9, color: T.blue, fontWeight: 700 }}>Source</div>
                                </div>
                            </a>
                        )}
                    </div>

                    {/* ── Tab bar ── */}
                    <div style={{ display: "flex", gap: 2, borderBottom: `1px solid ${T.glassBorder}`, marginLeft: -24, marginRight: -24, paddingLeft: 24, paddingRight: 24 }}>
                        {tabs.map(t => (
                            <button key={t.key}
                                onClick={() => setActiveTab(t.key)}
                                style={{
                                    background: "none", border: "none",
                                    borderBottom: activeTab === t.key ? `2px solid ${g._sourceColor || T.blue}` : "2px solid transparent",
                                    padding: "8px 14px 10px", cursor: "pointer",
                                    fontSize: 12, fontWeight: activeTab === t.key ? 800 : 500,
                                    color: activeTab === t.key ? T.text : T.mute,
                                    transition: "all 0.15s", whiteSpace: "nowrap",
                                    display: "flex", alignItems: "center", gap: 5,
                                }}>
                                <span>{t.icon}</span>{t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── BODY ── */}
                <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>

                    {/* ═══ OVERVIEW ═══ */}
                    {activeTab === "overview" && (
                        <div style={{ animation: "fadeIn 0.2s" }}>
                            {g.description && (
                                <div style={{ marginBottom: 22 }}>
                                    <div style={{ fontSize: 10, color: T.mute, fontWeight: 800, letterSpacing: 1, marginBottom: 8 }}>DESCRIPTION</div>
                                    <p style={{ fontSize: 14, color: T.sub, lineHeight: 1.75, margin: 0, whiteSpace: "pre-wrap" }}>{g.description}</p>
                                </div>
                            )}

                            {/* Key facts */}
                            <div style={{ marginBottom: 22 }}>
                                <div style={{ fontSize: 10, color: T.mute, fontWeight: 800, letterSpacing: 1, marginBottom: 4 }}>FUNDING DETAILS</div>
                                <Row icon={Building2} label="Agency" value={g.agency} />
                                <Row icon={DollarSign} label="Award Ceiling" value={typeof g.amount==="number"&&g.amount>0 ? `$${g.amount.toLocaleString()}` : g.amount} color={T.green} />
                                {g.amountFloor > 0 && <Row icon={DollarSign} label="Award Floor" value={`$${g.amountFloor.toLocaleString()}`} />}
                                <Row icon={Calendar} label="Deadline" value={g.deadline} color={urgencyColor} />
                                <Row icon={Calendar} label="Award Start" value={g.awardStart ? String(g.awardStart).slice(0,10) : null} />
                                <Row icon={CheckCircle} label="Status" value={g.status} color={g.status==="Open"||g.status==="Posted" ? T.green : undefined} />
                                <Row icon={Tag} label="CFDA" value={g.cfda} copyId="cfda" />
                                <Row icon={Tag} label="NAICS" value={g.naics} copyId="naics" />
                                <Row icon={Tag} label="Award Type" value={g.awardType} />
                                <Row icon={Shield} label="Set-Aside" value={g.setAside} />
                                <Row icon={Tag} label="Category" value={g.category} />
                                <Row icon={Hash} label="Opp Number" value={g.oppNumber} mono copyId="oppnum2" />
                            </div>

                            <div style={{ marginBottom: 22 }}>
                                <div style={{ fontSize: 10, color: T.mute, fontWeight: 800, letterSpacing: 1, marginBottom: 4 }}>RECIPIENT & PROGRAM</div>
                                <Row icon={Users} label="PI / Contact" value={g.pi} />
                                <Row icon={Building2} label="Recipient Org" value={g.org} />
                                <Row icon={FileText} label="Program" value={g.program} />
                                <Row icon={Hash} label="EIN" value={g.ein} mono copyId="ein" />
                            </div>

                            {/* Related contacts */}
                            {relatedContacts.length > 0 && (
                                <div style={{ marginBottom: 22 }}>
                                    <div style={{ fontSize: 10, color: T.amber, fontWeight: 800, letterSpacing: 1, marginBottom: 10 }}>⚡ RELEVANT CONTACTS IN YOUR NETWORK</div>
                                    {relatedContacts.map(c => (
                                        <div key={c.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 12px", background: `${T.amber}0a`, border: `1px solid ${T.amber}22`, borderRadius: 8, marginBottom: 6 }}>
                                            <div style={{ width: 30, height: 30, borderRadius: "50%", background: `${T.amber}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: T.amber, flexShrink: 0 }}>
                                                {(c.name || "?").charAt(0).toUpperCase()}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{c.name}</div>
                                                <div style={{ fontSize: 11, color: T.mute }}>{c.role} · {c.org}</div>
                                            </div>
                                            <Badge color={T.amber} style={{ fontSize: 9 }}>Contact</Badge>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {link && (
                                <a href={link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                                    <div style={{
                                        padding: "14px 18px", background: `${g._sourceColor || T.blue}10`,
                                        border: `1px solid ${g._sourceColor || T.blue}33`,
                                        borderRadius: 12, display: "flex", alignItems: "center", gap: 10,
                                        color: g._sourceColor || T.blue, fontSize: 13, fontWeight: 700,
                                    }}>
                                        <ExternalLink size={15} />
                                        View full opportunity at {g._source || "source"} ↗
                                    </div>
                                </a>
                            )}
                        </div>
                    )}

                    {/* ═══ AI MATCH ═══ */}
                    {activeTab === "ai" && (
                        <div style={{ animation: "fadeIn 0.2s" }}>
                            {aiLoading ? (
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "52px 0", textAlign: "center" }}>
                                    <div style={{ fontSize: 40, animation: "pulse 2s ease-in-out infinite" }}>🧠</div>
                                    <div style={{ fontSize: 14, color: T.sub, fontWeight: 600 }}>{aiPhase}</div>
                                    <div style={{ width: "100%", height: 4, background: T.glassBorder, borderRadius: 2, overflow: "hidden" }}>
                                        <div style={{ height: "100%", background: `linear-gradient(90deg, ${T.blue}, ${T.indigo||T.blue})`, borderRadius: 2, animation: "shimmer 1.8s ease-in-out infinite", backgroundSize: "200% 100%" }} />
                                    </div>
                                    <div style={{ fontSize: 12, color: T.mute }}>Analyzing against {PROFILE.name || "your profile"}…</div>
                                </div>
                            ) : aiAnalysis ? (
                                <div>
                                    {/* Score + verdict hero */}
                                    <div style={{ display: "flex", gap: 20, alignItems: "center", marginBottom: 24, padding: 20, background: "rgba(255,255,255,0.03)", borderRadius: 16, border: `1px solid ${scoreColor(aiAnalysis.eligibilityScore)}22` }}>
                                        <div style={{ position: "relative", width: 88, height: 88, flexShrink: 0 }}>
                                            <svg viewBox="0 0 88 88" style={{ transform: "rotate(-90deg)", width: 88, height: 88 }}>
                                                <circle cx={44} cy={44} r={36} fill="none" stroke={T.glassBorder} strokeWidth={8} />
                                                <circle cx={44} cy={44} r={36} fill="none"
                                                    stroke={scoreColor(aiAnalysis.eligibilityScore)}
                                                    strokeWidth={8}
                                                    strokeDasharray={`${(aiAnalysis.eligibilityScore/100)*226} 226`}
                                                    strokeLinecap="round"
                                                    style={{ transition: "stroke-dasharray 1s ease", filter: `drop-shadow(0 0 6px ${scoreColor(aiAnalysis.eligibilityScore)}88)` }} />
                                            </svg>
                                            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                                                <div style={{ fontSize: 18, fontWeight: 900, color: T.text, lineHeight: 1 }}>{aiAnalysis.eligibilityScore}%</div>
                                                <div style={{ fontSize: 9, color: T.mute, fontWeight: 700, marginTop: 2 }}>MATCH</div>
                                            </div>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 17, fontWeight: 800, color: T.text, marginBottom: 6 }}>{aiAnalysis.verdict}</div>
                                            {aiAnalysis.headline && <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.5, marginBottom: 10 }}>{aiAnalysis.headline}</div>}
                                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                                {aiAnalysis.winRate !== undefined && <Badge color={scoreColor(aiAnalysis.winRate)} style={{ fontSize: 10 }}>Win Est: {aiAnalysis.winRate}%</Badge>}
                                                {aiAnalysis.competitionLevel && <Badge color={T.mute} style={{ fontSize: 10 }}>Competition: {aiAnalysis.competitionLevel}</Badge>}
                                                {aiAnalysis.estimatedEffort && <Badge color={T.blue} style={{ fontSize: 10 }}>Effort: {aiAnalysis.estimatedEffort}</Badge>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Key requirements */}
                                    {aiAnalysis.keyRequirements?.length > 0 && (
                                        <div style={{ marginBottom: 20, padding: 14, background: `${T.indigo||T.blue}0a`, borderRadius: 12, border: `1px solid ${T.indigo||T.blue}22` }}>
                                            <div style={{ fontSize: 10, color: T.blue, fontWeight: 800, letterSpacing: 1, marginBottom: 10 }}>📋 KEY REQUIREMENTS</div>
                                            {aiAnalysis.keyRequirements.map((r, i) => (
                                                <div key={i} style={{ display: "flex", gap: 8, padding: "5px 0", fontSize: 13, color: T.sub, lineHeight: 1.5 }}>
                                                    <span style={{ color: T.blue, flexShrink: 0, marginTop: 1 }}>→</span>{r}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Strengths */}
                                    {aiAnalysis.strengths?.length > 0 && (
                                        <div style={{ marginBottom: 18 }}>
                                            <div style={{ fontSize: 10, color: T.green, fontWeight: 800, letterSpacing: 1, marginBottom: 8 }}>✅ STRENGTHS</div>
                                            {aiAnalysis.strengths.map((s, i) => (
                                                <div key={i} style={{ display: "flex", gap: 10, padding: "7px 0", borderBottom: `1px solid ${T.glassBorder}`, alignItems: "flex-start" }}>
                                                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.green, flexShrink: 0, marginTop: 5 }} />
                                                    <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.5 }}>{s}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Risks */}
                                    {aiAnalysis.risks?.length > 0 && (
                                        <div style={{ marginBottom: 18 }}>
                                            <div style={{ fontSize: 10, color: T.amber, fontWeight: 800, letterSpacing: 1, marginBottom: 8 }}>⚠️ RISKS & GAPS</div>
                                            {aiAnalysis.risks.map((r, i) => (
                                                <div key={i} style={{ display: "flex", gap: 10, padding: "7px 0", borderBottom: `1px solid ${T.glassBorder}`, alignItems: "flex-start" }}>
                                                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.amber, flexShrink: 0, marginTop: 5 }} />
                                                    <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.5 }}>{r}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Next steps */}
                                    {aiAnalysis.nextSteps?.length > 0 && (
                                        <div style={{ marginBottom: 18 }}>
                                            <div style={{ fontSize: 10, color: T.blue, fontWeight: 800, letterSpacing: 1, marginBottom: 8 }}>🚀 NEXT STEPS</div>
                                            {aiAnalysis.nextSteps.map((s, i) => (
                                                <div key={i} style={{ display: "flex", gap: 10, padding: "7px 0", borderBottom: `1px solid ${T.glassBorder}`, alignItems: "flex-start" }}>
                                                    <div style={{ background: T.blue, color: "#fff", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                                                    <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.5 }}>{s}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Application tip */}
                                    {aiAnalysis.applicationTip && (
                                        <div style={{ padding: 16, background: `${T.amber}0d`, border: `1px solid ${T.amber}33`, borderLeft: `4px solid ${T.amber}`, borderRadius: 12, marginBottom: 18 }}>
                                            <div style={{ fontSize: 10, color: T.amber, fontWeight: 800, letterSpacing: 1, marginBottom: 6 }}>💡 PRO TIP FOR THIS FUNDER</div>
                                            <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.6 }}>{aiAnalysis.applicationTip}</div>
                                        </div>
                                    )}

                                    <div style={{ display: "flex", gap: 8 }}>
                                        <Btn variant="ghost" size="sm" onClick={runAIAnalysis} style={{ flex: 1 }}>↺ Re-analyze</Btn>
                                        <Btn variant="primary" size="sm" onClick={() => setActiveTab("apply")} style={{ flex: 1 }}>✍️ Draft Application</Btn>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "48px 0", textAlign: "center" }}>
                                    <div style={{ fontSize: 48 }}>🧠</div>
                                    <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}>AI Eligibility Analysis</div>
                                    <div style={{ fontSize: 13, color: T.sub, maxWidth: 300, lineHeight: 1.6 }}>Get eligibility score, win probability, strengths, risks, and tailored next steps in seconds.</div>
                                    <Btn variant="primary" onClick={runAIAnalysis} style={{ minWidth: 180 }}>Run Analysis →</Btn>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ═══ APPLY ═══ */}
                    {activeTab === "apply" && (
                        <div style={{ animation: "fadeIn 0.2s" }}>
                            <div style={{ marginBottom: 20 }}>
                                <div style={{ fontSize: 10, color: T.mute, fontWeight: 800, letterSpacing: 1, marginBottom: 12 }}>QUICK APPLICATION TOOLS</div>

                                {/* Application checklist */}
                                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 14, border: `1px solid ${T.glassBorder}`, padding: 16, marginBottom: 16 }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 12 }}>📋 Application Checklist</div>
                                    {[
                                        { label: "Read full funding opportunity announcement (FOA)", done: !!link },
                                        { label: "Verify eligibility requirements", done: false },
                                        { label: "Register on SAM.gov (federal grants)", done: false },
                                        { label: "Obtain DUNS/UEI number", done: false },
                                        { label: "Prepare project narrative", done: false },
                                        { label: "Budget & budget justification", done: false },
                                        { label: "Letters of support / partnership docs", done: false },
                                        { label: "Submit via Grants.gov or agency portal", done: false },
                                    ].map((item, i) => (
                                        <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: "6px 0", borderBottom: i < 7 ? `1px solid ${T.glassBorder}` : "none" }}>
                                            <div style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${item.done ? T.green : T.mute}`, background: item.done ? T.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                {item.done && <span style={{ fontSize: 9, color: "#000", fontWeight: 900 }}>✓</span>}
                                            </div>
                                            <span style={{ fontSize: 13, color: item.done ? T.green : T.sub }}>{item.label}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* AI Draft */}
                                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 14, border: `1px solid ${T.glassBorder}`, padding: 16, marginBottom: 16 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>✍️ AI Narrative Draft</div>
                                        <Btn variant="primary" size="sm" onClick={generateDraft} disabled={drafting}>
                                            {drafting ? "Generating…" : draftText ? "Regenerate" : "Generate Draft"}
                                        </Btn>
                                    </div>
                                    {drafting && (
                                        <div style={{ fontSize: 13, color: T.mute, fontStyle: "italic", padding: "12px 0" }}>Writing your narrative opening…</div>
                                    )}
                                    {draftText && !drafting && (
                                        <div>
                                            <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.7, whiteSpace: "pre-wrap", padding: "12px 0", borderTop: `1px solid ${T.glassBorder}`, marginTop: 4 }}>{draftText}</div>
                                            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                                                <Btn variant="ghost" size="sm" onClick={() => copy(draftText, "draft")} style={{ flex: 1 }}>{copied==="draft" ? "✓ Copied!" : "Copy Draft"}</Btn>
                                            </div>
                                        </div>
                                    )}
                                    {!draftText && !drafting && (
                                        <div style={{ fontSize: 12, color: T.mute, lineHeight: 1.5 }}>AI will write a 3-paragraph project narrative opening tailored to this funder and your org's focus areas.</div>
                                    )}
                                </div>

                                {/* Key links */}
                                {link && (
                                    <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 14, border: `1px solid ${T.glassBorder}`, padding: 16 }}>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 12 }}>🔗 Application Links</div>
                                        <a href={link} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: `${T.blue}0d`, borderRadius: 8, textDecoration: "none", marginBottom: 8, border: `1px solid ${T.blue}22` }}>
                                            <ExternalLink size={13} color={T.blue} />
                                            <span style={{ fontSize: 13, color: T.blue, fontWeight: 600 }}>Official Opportunity Page</span>
                                        </a>
                                        <a href="https://www.grants.gov/applicants/registration.html" target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 8, textDecoration: "none", marginBottom: 8 }}>
                                            <ExternalLink size={13} color={T.mute} />
                                            <span style={{ fontSize: 13, color: T.sub }}>Grants.gov Registration</span>
                                        </a>
                                        <a href="https://sam.gov/content/entity-registration" target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 8, textDecoration: "none" }}>
                                            <ExternalLink size={13} color={T.mute} />
                                            <span style={{ fontSize: 13, color: T.sub }}>SAM.gov Entity Registration</span>
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ═══ SIMILAR ═══ */}
                    {activeTab === "similar" && (
                        <div style={{ animation: "fadeIn 0.2s" }}>
                            <div style={{ fontSize: 10, color: T.mute, fontWeight: 800, letterSpacing: 1, marginBottom: 14 }}>RELATED OPPORTUNITIES</div>
                            {similarLoading ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                    {[1,2,3].map(i => <div key={i} style={{ height: 80, background: "rgba(255,255,255,0.03)", borderRadius: 10, animation: "pulse 1.5s ease-in-out infinite" }} />)}
                                </div>
                            ) : similar.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "40px 0", color: T.mute, fontSize: 13 }}>No similar opportunities found.<br/>Try broadening your profile focus areas.</div>
                            ) : similar.map(s => {
                                const sLink = s.link || s.url;
                                return (
                                    <div key={s.id} style={{ padding: "14px 16px", background: "rgba(255,255,255,0.03)", borderRadius: 12, border: `1px solid ${T.glassBorder}`, marginBottom: 10, borderLeft: `3px solid ${s._sourceColor || T.blue}` }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: "flex", gap: 5, marginBottom: 5 }}>
                                                    <Badge color={s._sourceColor || T.blue} style={{ fontSize: 8 }}>{s._source}</Badge>
                                                    {s._score >= 85 && <Badge color={T.amber} style={{ fontSize: 8 }}>⭐ {s._score}%</Badge>}
                                                </div>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, lineHeight: 1.3, marginBottom: 4 }}>
                                                    {sLink ? <a href={sLink} target="_blank" rel="noopener noreferrer" style={{ color: T.text, textDecoration: "none" }}>{s.title}</a> : s.title}
                                                </div>
                                                <div style={{ fontSize: 11, color: T.mute }}>{s.agency}</div>
                                            </div>
                                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                                                <div style={{ fontSize: 14, fontWeight: 800, color: T.green }}>
                                                    {typeof s.amount==="number"&&s.amount>0 ? s.amount>=1e6 ? `$${(s.amount/1e6).toFixed(1)}M` : `$${s.amount.toLocaleString()}` : "—"}
                                                </div>
                                                {s.deadline && s.deadline !== "Rolling" && <div style={{ fontSize: 10, color: T.mute }}>{String(s.deadline).slice(0,10)}</div>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {similar.length > 0 && <Btn variant="ghost" size="sm" onClick={loadSimilar} style={{ width: "100%", marginTop: 8 }}>↺ Refresh</Btn>}
                        </div>
                    )}

                    {/* ═══ RAW DATA ═══ */}
                    {activeTab === "raw" && (
                        <div style={{ animation: "fadeIn 0.2s" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                <div style={{ fontSize: 10, color: T.mute, fontWeight: 800, letterSpacing: 1 }}>ALL FIELDS</div>
                                <Btn variant="ghost" size="sm" onClick={() => copy(JSON.stringify(g, null, 2), "json")}>{copied==="json" ? "✓ Copied" : "Copy JSON"}</Btn>
                            </div>
                            {Object.entries(g)
                                .filter(([k, v]) => v !== null && v !== undefined && v !== "" && v !== 0)
                                .sort(([a],[b]) => a.localeCompare(b))
                                .map(([k, v]) => (
                                    <div key={k} style={{ display: "flex", gap: 10, padding: "7px 0", borderBottom: `1px solid ${T.glassBorder}` }}>
                                        <div style={{ fontSize: 10, color: k.startsWith("_") ? T.blue : T.mute, minWidth: 130, flexShrink: 0, fontFamily: "monospace" }}>{k}</div>
                                        <div style={{ fontSize: 12, color: T.sub, flex: 1, wordBreak: "break-all" }}>
                                            {typeof v === "string" && (v.startsWith("http://") || v.startsWith("https://"))
                                                ? <a href={v} target="_blank" rel="noopener noreferrer" style={{ color: T.blue, textDecoration: "none" }}>{v}</a>
                                                : typeof v === "number" && k !== "id" && v > 100 ? `$${v.toLocaleString()} (${v})`
                                                : typeof v === "object" ? <span style={{ fontFamily: "monospace", fontSize: 10 }}>{JSON.stringify(v).slice(0, 200)}</span>
                                                : String(v).slice(0, 500)}
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    )}
                </div>

                {/* ── FOOTER ── */}
                <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.glassBorder}`, flexShrink: 0, display: "flex", gap: 8, background: "rgba(0,0,0,0.2)" }}>
                    {link && (
                        <a href={link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                            <Btn variant="ghost" size="sm" style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                <ExternalLink size={12} /> Open ↗
                            </Btn>
                        </a>
                    )}
                    <Btn variant="ghost" size="sm" style={{ display: "flex", alignItems: "center", gap: 5 }}
                        onClick={() => setActiveTab("ai")}>
                        <Sparkles size={12} /> AI Match
                    </Btn>
                    <Btn variant="ghost" size="sm" style={{ display: "flex", alignItems: "center", gap: 5 }}
                        onClick={() => setActiveTab("apply")}>
                        <FileText size={12} /> Apply
                    </Btn>
                    <Btn
                        variant={isTracked ? "ghost" : "primary"}
                        size="sm"
                        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
                        onClick={() => { if (!isTracked) { onAdd(g); } }}
                        disabled={isTracked}
                    >
                        {isTracked ? "✓ Tracked" : <><Bookmark size={12} /> Track Opportunity</>}
                    </Btn>
                </div>
            </div>

            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes shimmer {
                    0% { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }
            `}</style>
        </>
    );
};

// ─── GRANT RESULT CARD ────────────────────────────────────────────────────────
const GrantResultCard = ({ g, onAdd, isTracked, onOpen }) => {
    const daysLeft = g.deadline && g.deadline !== "Rolling" ? Math.ceil((new Date(g.deadline) - Date.now()) / 86400000) : null;
    const urgency = daysLeft !== null ? (daysLeft <= 7 ? T.red : daysLeft <= 21 ? T.amber : null) : null;
    const desc = g.description || "";
    const link = g.link || g.url || g.sourceUrl || g._url;

    return (
        <Card key={g.id} glow style={{
            marginBottom: 10,
            borderLeft: `4px solid ${isTracked ? T.mute : (g._sourceColor || T.blue)}`,
            cursor: "pointer",
            transition: "background 0.15s, transform 0.15s",
            opacity: isTracked ? 0.75 : 1,
        }}
            onClick={() => onOpen(g)}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.transform = "translateX(2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = ""; e.currentTarget.style.transform = ""; }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Badge row */}
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 7, flexWrap: "wrap" }}>
                        <Badge color={g._sourceColor || T.blue} style={{ fontSize: 9, fontWeight: 800, letterSpacing: 0.5 }}>
                            {g._source || "Federal"}
                        </Badge>
                        {g.agency && <Badge color={T.mute} style={{ fontSize: 9, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.agency}</Badge>}
                        {g.cfda && <Badge color="#6366f1" style={{ fontSize: 9 }}>CFDA {g.cfda}</Badge>}
                        {g.awardType && <Badge color={T.mute} style={{ fontSize: 9 }}>{g.awardType}</Badge>}
                        {g.setAside && <Badge color="#0ea5e9" style={{ fontSize: 9 }}>{g.setAside}</Badge>}
                        {g._score >= 85 && <Badge color={T.amber} style={{ fontSize: 9, fontWeight: 800 }}>⭐ {g._score}%</Badge>}
                        {isTracked && <Badge color={T.green} style={{ fontSize: 9 }}>✓ Tracked</Badge>}
                        {urgency && daysLeft !== null && <Badge color={urgency} style={{ fontSize: 9, fontWeight: 800 }}>⏰ {daysLeft}d</Badge>}
                    </div>

                    {/* Title */}
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 5, lineHeight: 1.4, fontFamily: "Outfit" }}>
                        {g.title}
                        {link && <span style={{ fontSize: 10, color: T.blue, marginLeft: 5, fontWeight: 400 }}>↗</span>}
                    </div>

                    {/* Description preview */}
                    {desc && (
                        <p style={{ color: T.mute, fontSize: 12, margin: 0, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                            {desc}
                        </p>
                    )}

                    {/* Meta pills */}
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: 11, color: T.mute, marginTop: 6 }}>
                        {g.oppNumber && <span style={{ fontFamily: "monospace" }}>#{g.oppNumber}</span>}
                        {g.status && <span style={{ color: g.status === "Open" || g.status === "Posted" ? T.green : T.mute }}>● {g.status}</span>}
                        {g.naics && <span>NAICS {g.naics}</span>}
                        {g.pi && <span>PI: {g.pi}</span>}
                    </div>
                </div>

                {/* Right column */}
                <div style={{ textAlign: "right", minWidth: 110, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                    <div style={{ fontSize: 17, fontWeight: 800, color: T.green, letterSpacing: "-0.03em", lineHeight: 1 }}>
                        {typeof g.amount === "number" && g.amount > 0
                            ? g.amount >= 1e6 ? `$${(g.amount / 1e6).toFixed(1)}M` : `$${g.amount.toLocaleString()}`
                            : g.amount || "—"}
                    </div>
                    {g.deadline && g.deadline !== "Rolling" && (
                        <div style={{ color: urgency || T.mute, fontSize: 10 }}>
                            {urgency ? `${daysLeft}d left` : `Due ${String(g.deadline).slice(0, 10)}`}
                        </div>
                    )}
                    {g.deadline === "Rolling" && <div style={{ color: T.mute, fontSize: 10 }}>Rolling</div>}
                    <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                        <Btn variant="ghost" size="sm" style={{ fontSize: 10, padding: "3px 8px" }}
                            onClick={e => { e.stopPropagation(); onOpen(g); }}>
                            Details
                        </Btn>
                        <Btn
                            variant={isTracked ? "ghost" : "primary"}
                            size="sm"
                            style={{ fontSize: 10, padding: "3px 10px" }}
                            onClick={e => { e.stopPropagation(); if (!isTracked) onAdd(g); }}
                            disabled={isTracked}
                        >
                            {isTracked ? "✓" : "+ Track"}
                        </Btn>
                    </div>
                </div>
            </div>
        </Card>
    );
};

// ─── STATE SELECTOR ───────────────────────────────────────────────────────────
const US_STATES = ["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"];

// ─── SEARCH HISTORY (localStorage) ──────────────────────────────────────────
const HISTORY_KEY = "discovery_search_history";
const getHistory = () => { try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; } };
const pushHistory = (q, tab) => {
    const h = getHistory().filter(x => x.q !== q).slice(0, 9);
    localStorage.setItem(HISTORY_KEY, JSON.stringify([{ q, tab, ts: Date.now() }, ...h]));
};

// ─── RESULTS STATS BAR ───────────────────────────────────────────────────────
const ResultsStats = ({ results, sources }) => {
    if (!results?.length) return null;
    const totalFunding = results.reduce((s, r) => s + (typeof r.amount === "number" ? r.amount : 0), 0);
    const withDeadlines = results.filter(r => r.deadline && r.deadline !== "Rolling" && new Date(r.deadline) > new Date());
    const urgent = withDeadlines.filter(r => Math.ceil((new Date(r.deadline) - Date.now()) / 86400000) <= 21);
    const avgAmt = results.filter(r => typeof r.amount === "number" && r.amount > 0);
    const avg = avgAmt.length ? avgAmt.reduce((s, r) => s + r.amount, 0) / avgAmt.length : 0;
    return (
        <div style={{ display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
            {[
                { label: "TOTAL FUNDING", value: totalFunding >= 1e9 ? `$${(totalFunding/1e9).toFixed(1)}B` : totalFunding >= 1e6 ? `$${(totalFunding/1e6).toFixed(0)}M` : `$${totalFunding.toLocaleString()}`, color: T.green },
                { label: "RESULTS", value: results.length, color: T.blue },
                { label: "AVG AWARD", value: avg > 0 ? avg >= 1e6 ? `$${(avg/1e6).toFixed(1)}M` : `$${Math.round(avg).toLocaleString()}` : "—", color: T.text },
                urgent.length > 0 && { label: "CLOSING SOON", value: `${urgent.length} within 21d`, color: T.amber },
            ].filter(Boolean).map(stat => (
                <div key={stat.label} style={{ padding: "6px 12px", background: `${stat.color}0f`, border: `1px solid ${stat.color}22`, borderRadius: 8 }}>
                    <div style={{ fontSize: 9, color: T.mute, fontWeight: 800, letterSpacing: 1 }}>{stat.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                </div>
            ))}
        </div>
    );
};

// ─── AMOUNT RANGE FILTER ─────────────────────────────────────────────────────
const AMOUNT_RANGES = [
    { label: "Any", min: 0, max: Infinity },
    { label: "< $25k", min: 0, max: 25000 },
    { label: "$25k–$100k", min: 25000, max: 100000 },
    { label: "$100k–$500k", min: 100000, max: 500000 },
    { label: "$500k–$2M", min: 500000, max: 2000000 },
    { label: "> $2M", min: 2000000, max: Infinity },
];

export const Discovery = () => {
    const [tab, setTab] = useState("grants");
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [sources, setSources] = useState(null);
    const [identities, setIdentities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [sortBy, setSortBy] = useState("relevance");
    const [selectedGrant, setSelectedGrant] = useState(null);
    const [filterSource, setFilterSource] = useState("All");
    const [filterAmount, setFilterAmount] = useState(0); // index into AMOUNT_RANGES
    const [filterDeadline, setFilterDeadline] = useState("all"); // all | open | urgent | rolling
    const [visibleCount, setVisibleCount] = useState(20);
    const [searchHistory, setSearchHistory] = useState(getHistory);
    const [showHistory, setShowHistory] = useState(false);
    const [savedSearches, setSavedSearches] = useState(() => { try { return JSON.parse(localStorage.getItem("discovery_saved") || "[]"); } catch { return []; } });
    const [selectedState, setSelectedState] = useState(() => {
        const loc = PROFILE.loc || "";
        const abbr = loc.split(",").pop()?.trim().slice(0, 2).toUpperCase();
        return US_STATES.includes(abbr) ? abbr : "IL";
    });
    const searchInputRef = useRef(null);
    const { grants: trackedGrants, addGrant } = useStore();
    const trackedTitles = new Set((trackedGrants || []).map(g => (g.title || "").trim().toLowerCase()));

    const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };
    const onAdd = (grant) => { addGrant({ ...grant, id: grant.id || uid() }); showToast(`✅ Tracked: ${grant.title?.slice(0, 42) || "Opportunity"}`); };

    // Auto-search on mount
    useEffect(() => {
        if (results.length > 0 || loading) return;
        const focusAreas = PROFILE.focus || [];
        if (focusAreas.length > 0) {
            const autoQuery = focusAreas.slice(0, 2).join(" ");
            setQuery(autoQuery);
            setTimeout(() => {
                setLoading(true);
                API.searchGrantsMultiSource(autoQuery).then(data => {
                    setResults(data.results || []);
                    setSources(data.sources);
                    setLoading(false);
                });
            }, 300);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleTabChange = (newTab) => {
        setTab(newTab);
        setResults([]); setSources(null); setIdentities([]);
        setFilterSource("All"); setFilterAmount(0); setFilterDeadline("all");
        setVisibleCount(20); setShowHistory(false);
    };

    // Sorted + filtered results
    const sortedResults = useCallback(() => {
        const amtRange = AMOUNT_RANGES[filterAmount];
        let r = results
            .filter(x => filterSource === "All" || x._source === filterSource)
            .filter(x => {
                const amt = typeof x.amount === "number" ? x.amount : 0;
                return amt === 0 || (amt >= amtRange.min && amt <= amtRange.max);
            })
            .filter(x => {
                if (filterDeadline === "all") return true;
                if (filterDeadline === "rolling") return x.deadline === "Rolling" || !x.deadline;
                if (filterDeadline === "open") return x.deadline && x.deadline !== "Rolling" && new Date(x.deadline) > new Date();
                if (filterDeadline === "urgent") {
                    const d = Math.ceil((new Date(x.deadline) - Date.now()) / 86400000);
                    return d >= 0 && d <= 21;
                }
                return true;
            });
        if (sortBy === "amount") r = [...r].sort((a, b) => (b.amount || 0) - (a.amount || 0));
        else if (sortBy === "deadline") r = [...r].sort((a, b) => {
            if (!a.deadline || a.deadline === "Rolling") return 1;
            if (!b.deadline || b.deadline === "Rolling") return -1;
            return new Date(a.deadline) - new Date(b.deadline);
        });
        return r;
    }, [results, sortBy, filterSource, filterAmount, filterDeadline]);

    const smartScan = async (targetTab = tab) => {
        setLoading(true); setResults([]); setSources(null); setVisibleCount(20);
        const profile = window.__PROFILE || PROFILE;
        const sys = `You are a grant discovery expert. Given this org profile, generate the single best 3-6 word search query to find the most relevant funding. Return ONLY the query string.`;
        const msg = `Org: ${profile.name||"Non-Profit"}, Type: ${profile.type||"Non-Profit"}, Focus: ${(profile.focus||[]).join(", ")}, Tags: ${(profile.tags||[]).join(", ")}, Location: ${profile.loc||""}`;
        const result = await API.callAI([{ role: "user", content: msg }], sys);
        const smartQuery = result.error ? ((profile.focus||[])[0] || "community development") : result.text.trim().replace(/["\n]/g, "");
        setQuery(smartQuery);
        await execSearch(smartQuery, targetTab);
    };

    const execSearch = async (q, searchTab = tab) => {
        setLoading(true); setResults([]); setSources(null); setVisibleCount(20);
        pushHistory(q, searchTab);
        setSearchHistory(getHistory());
        try {
            if (searchTab === "grants") {
                const data = await API.searchGrantsMultiSource(q);
                setResults(data.results || []); setSources(data.sources);
            } else if (searchTab === "philanthropy") {
                const [data, candid] = await Promise.all([API.searchPhilanthropyMultiSource(q), API.searchCandidProBono(q)]);
                setResults([...(data.results || []), ...candid]); setSources(data.sources); setIdentities(data.identities || []);
            } else if (searchTab === "international") {
                const data = await API.searchInternationalMultiSource(q);
                setResults(data.results || []); setSources(data.sources);
            } else if (searchTab === "state") {
                const [data, municipal] = await Promise.all([API.searchStateGrants(q, selectedState), API.searchMunicipalPulse(q, selectedState)]);
                const base = Array.isArray(data) ? data : (data.results || []);
                setResults([...base, ...municipal]);
                if (!Array.isArray(data)) setSources(data.sources);
            }
        } catch {}
        setLoading(false);
    };

    const handleSearch = () => { if (query.trim()) execSearch(query); };

    const saveSearch = () => {
        if (!query.trim()) return;
        const saved = [{ q: query, tab, ts: Date.now() }, ...savedSearches.filter(s => s.q !== query)].slice(0, 10);
        setSavedSearches(saved);
        localStorage.setItem("discovery_saved", JSON.stringify(saved));
        showToast("🔖 Search saved");
    };

    const TABS = [
        { id: "grants",      label: "Federal",       icon: "🏛️", color: "#22c55e" },
        { id: "state",       label: "State & Local",  icon: "🗺️", color: "#8b5cf6" },
        { id: "philanthropy",label: "Philanthropy",   icon: "🤝", color: "#3b82f6" },
        { id: "international",label: "International", icon: "🌎", color: "#059669" },
        { id: "regional",    label: "Regional",       icon: "📍", color: "#f59e0b" },
        { id: "contracts",   label: "Contracts",      icon: "📄", color: "#0ea5e9" },
        { id: "tax_credits", label: "Tax Credits",    icon: "💰", color: "#10b981" },
        { id: "earmarks",    label: "Earmarks",       icon: "🏷️", color: "#a855f7" },
        { id: "foresight",   label: "Foresight",      icon: "🔭", color: "#6366f1" },
        { id: "alerts",      label: "Alerts",         icon: "⚡", color: "#f43f5e" },
    ];

    const QUICK_CHIPS = [
        "rural broadband", "workforce development", "affordable housing", "climate resilience",
        "STEM education", "small business", "mental health", "food security", "clean energy", "economic development"
    ];

    const showSearchBar = ["grants", "state", "philanthropy", "international"].includes(tab);

    // ─── UNIFIED RESULTS PANEL ───────────────────────────────────────────────
    const ResultsPanel = () => {
        const displayed = sortedResults().slice(0, visibleCount);
        const total = sortedResults().length;
        const sourceOptions = ["All", ...new Set(results.map(r => r._source).filter(Boolean))];

        if (loading) return <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{[1,2,3,4].map(i => <SkeletonCard key={i} lines={3} />)}</div>;
        if (results.length === 0) return null;

        return (
            <div>
                <ResultsStats results={results} sources={sources} />

                {/* ── Filter + Sort bar ── */}
                <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center", padding: "10px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 12, border: `1px solid ${T.glassBorder}` }}>
                    {/* Sort */}
                    <span style={{ fontSize: 10, color: T.mute, fontWeight: 800, letterSpacing: 0.8 }}>SORT</span>
                    {[["relevance", "⭐ Relevance"], ["amount", "💰 Amount"], ["deadline", "⏰ Deadline"]].map(([val, label]) => (
                        <button key={val} onClick={() => setSortBy(val)} style={{
                            padding: "3px 10px", borderRadius: 16, fontSize: 11, fontWeight: 700, cursor: "pointer", border: `1px solid ${sortBy === val ? T.amber+"60" : T.glassBorder}`,
                            background: sortBy === val ? T.amber+"14" : "transparent", color: sortBy === val ? T.amber : T.sub, transition: "all 0.15s",
                        }}>{label}</button>
                    ))}

                    <span style={{ fontSize: 10, color: T.mute, fontWeight: 800, letterSpacing: 0.8, marginLeft: 8 }}>AMOUNT</span>
                    {AMOUNT_RANGES.map((r, i) => (
                        <button key={i} onClick={() => setFilterAmount(i)} style={{
                            padding: "3px 10px", borderRadius: 16, fontSize: 11, fontWeight: 700, cursor: "pointer", border: `1px solid ${filterAmount === i ? T.green+"60" : T.glassBorder}`,
                            background: filterAmount === i ? T.green+"14" : "transparent", color: filterAmount === i ? T.green : T.sub, transition: "all 0.15s",
                        }}>{r.label}</button>
                    ))}

                    <span style={{ fontSize: 10, color: T.mute, fontWeight: 800, letterSpacing: 0.8, marginLeft: 8 }}>DEADLINE</span>
                    {[["all","All"],["open","Open"],["urgent","Urgent ≤21d"],["rolling","Rolling"]].map(([val, label]) => (
                        <button key={val} onClick={() => setFilterDeadline(val)} style={{
                            padding: "3px 10px", borderRadius: 16, fontSize: 11, fontWeight: 700, cursor: "pointer", border: `1px solid ${filterDeadline === val ? T.blue+"60" : T.glassBorder}`,
                            background: filterDeadline === val ? T.blue+"14" : "transparent", color: filterDeadline === val ? T.blue : T.sub, transition: "all 0.15s",
                        }}>{label}</button>
                    ))}

                    <span style={{ fontSize: 10, color: T.mute, fontWeight: 800, letterSpacing: 0.8, marginLeft: 8 }}>SOURCE</span>
                    {sourceOptions.map(s => (
                        <button key={s} onClick={() => setFilterSource(s)} style={{
                            padding: "3px 10px", borderRadius: 16, fontSize: 11, fontWeight: 700, cursor: "pointer", border: `1px solid ${filterSource === s ? "#6366f160" : T.glassBorder}`,
                            background: filterSource === s ? "#6366f114" : "transparent", color: filterSource === s ? "#818cf8" : T.sub, transition: "all 0.15s",
                        }}>{s}</button>
                    ))}

                    <span style={{ marginLeft: "auto", fontSize: 11, color: T.mute, fontWeight: 600 }}>{total} results</span>
                </div>

                {/* Results */}
                {displayed.map(g => (
                    <GrantResultCard key={g.id} g={g} onAdd={onAdd} onOpen={setSelectedGrant}
                        isTracked={trackedTitles.has((g.title || "").trim().toLowerCase())} />
                ))}

                {total > visibleCount && (
                    <div style={{ textAlign: "center", marginTop: 16, display: "flex", gap: 10, justifyContent: "center" }}>
                        <Btn variant="secondary" onClick={() => setVisibleCount(v => v + 20)}>
                            Load 20 more ({total - visibleCount} remaining)
                        </Btn>
                        <Btn variant="ghost" onClick={() => setVisibleCount(total)} style={{ fontSize: 12 }}>
                            Show all {total}
                        </Btn>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div style={{ position: "relative" }}>

            {selectedGrant && (
                <OpportunityDrawer grant={selectedGrant} onClose={() => setSelectedGrant(null)}
                    onAdd={onAdd} isTracked={trackedTitles.has((selectedGrant.title || "").trim().toLowerCase())} />
            )}

            {toast && (
                <div style={{
                    position: "fixed", bottom: 28, right: 28, zIndex: 9999,
                    background: `linear-gradient(135deg, ${T.green}22, ${T.panel})`,
                    border: `1px solid ${T.green}44`, borderRadius: 14, padding: "14px 20px",
                    display: "flex", alignItems: "center", gap: 10,
                    boxShadow: `0 8px 32px ${T.green}22`, backdropFilter: "blur(12px)",
                    fontSize: 13, fontWeight: 700, color: T.text, animation: "fadeIn 0.3s ease"
                }}>
                    <CheckCircle style={{ width: 18, height: 18, color: T.green }} />{toast}
                </div>
            )}

            {/* ── HEADER ── */}
            <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 30, fontWeight: 900, color: T.text, margin: 0, letterSpacing: "-0.04em", fontFamily: "Outfit" }}>Discovery Hub</h1>
                    <p style={{ color: T.sub, marginTop: 3, fontSize: 13 }}>Global funding intelligence · {trackedGrants?.length || 0} opportunities tracked</p>
                </div>
                <div style={{ display: "flex", gap: 8, position: "relative" }}>
                    <Btn variant="ghost" size="sm" onClick={() => setShowHistory(h => !h)}
                        style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}>
                        🕐 History {searchHistory.length > 0 && `(${searchHistory.length})`}
                    </Btn>
                    {savedSearches.length > 0 && (
                        <Btn variant="ghost" size="sm" onClick={() => setShowHistory(h => !h)}
                            style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, border: `1px solid ${T.amber}40`, color: T.amber }}>
                            🔖 Saved ({savedSearches.length})
                        </Btn>
                    )}
                    {showHistory && (
                        <div style={{ position: "absolute", top: "110%", right: 0, minWidth: 280, background: T.panel, border: `1px solid ${T.glassBorder}`, borderRadius: 12, zIndex: 300, padding: 8, boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
                            {searchHistory.length > 0 && <>
                                <div style={{ fontSize: 10, color: T.mute, fontWeight: 800, letterSpacing: 1, padding: "4px 8px 6px" }}>RECENT SEARCHES</div>
                                {searchHistory.slice(0, 5).map((s, i) => (
                                    <div key={i} onClick={() => { setQuery(s.q); execSearch(s.q, s.tab || "grants"); setShowHistory(false); }}
                                        style={{ padding: "7px 10px", borderRadius: 8, cursor: "pointer", display: "flex", gap: 8, alignItems: "center", fontSize: 12, color: T.sub }}
                                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                        <Clock size={11} style={{ color: T.mute }} />
                                        <span style={{ flex: 1 }}>{s.q}</span>
                                        <span style={{ fontSize: 10, color: T.mute }}>{new Date(s.ts).toLocaleDateString()}</span>
                                    </div>
                                ))}
                            </>}
                            {savedSearches.length > 0 && <>
                                <div style={{ fontSize: 10, color: T.amber, fontWeight: 800, letterSpacing: 1, padding: "8px 8px 6px" }}>🔖 SAVED SEARCHES</div>
                                {savedSearches.map((s, i) => (
                                    <div key={i} onClick={() => { setQuery(s.q); handleTabChange(s.tab); execSearch(s.q, s.tab); setShowHistory(false); }}
                                        style={{ padding: "7px 10px", borderRadius: 8, cursor: "pointer", display: "flex", gap: 8, alignItems: "center", fontSize: 12, color: T.sub }}
                                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                        <span>{TABS.find(t => t.id === s.tab)?.icon || "🔍"}</span>
                                        <span style={{ flex: 1 }}>{s.q}</span>
                                        <button onClick={e => { e.stopPropagation(); const f = savedSearches.filter((_, j) => j !== i); setSavedSearches(f); localStorage.setItem("discovery_saved", JSON.stringify(f)); }}
                                            style={{ background: "none", border: "none", cursor: "pointer", color: T.mute, fontSize: 14 }}>×</button>
                                    </div>
                                ))}
                            </>}
                        </div>
                    )}
                </div>
            </div>

            {/* ── TAB BAR ── */}
            <div style={{ display: "flex", gap: 1, overflowX: "auto", borderBottom: `1px solid ${T.glassBorder}`, marginBottom: 20 }}>
                {TABS.map(t => (
                    <button key={t.id} onClick={() => handleTabChange(t.id)} style={{
                        background: tab === t.id ? `${t.color}0f` : "none", border: "none",
                        borderBottom: tab === t.id ? `2px solid ${t.color}` : "2px solid transparent",
                        padding: "8px 14px 10px", cursor: "pointer", whiteSpace: "nowrap",
                        fontSize: 12, fontWeight: tab === t.id ? 800 : 500,
                        color: tab === t.id ? t.color : T.mute,
                        display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s", borderRadius: "4px 4px 0 0",
                    }}>
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {/* ── SEARCH BAR ── */}
            {showSearchBar && (
                <div style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                        {tab === "state" && (
                            <div style={{ position: "relative", flexShrink: 0 }}>
                                <select value={selectedState} onChange={e => setSelectedState(e.target.value)}
                                    style={{ appearance: "none", padding: "0 32px 0 12px", height: 44, borderRadius: 10, border: `1px solid ${T.glassBorder}`, background: T.glassLg, color: T.text, fontSize: 13, fontWeight: 700, cursor: "pointer", outline: "none" }}>
                                    {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <ChevronDown style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", width: 13, height: 13, color: T.mute, pointerEvents: "none" }} />
                            </div>
                        )}
                        <div style={{ flex: 1, position: "relative" }}>
                            <Search style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: T.mute }} />
                            <input ref={searchInputRef} value={query}
                                onChange={e => setQuery(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleSearch()}
                                placeholder={
                                    tab === "grants" ? "Search Grants.gov · NIH · NSF · Challenge · SAM · SBIR · USASpending…" :
                                    tab === "philanthropy" ? "Search IRS 990-PF · SEC EDGAR · OpenAlex · News…" :
                                    tab === "international" ? "Search World Bank projects · IATI aid data…" :
                                    `Search ${selectedState} portal · Grants.gov · USASpending…`
                                }
                                style={{ width: "100%", paddingLeft: 40, height: 44, borderRadius: 10, border: `1px solid ${T.glassBorder}`, background: T.glassLg, color: T.text, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                        </div>
                        <Btn variant="primary" style={{ padding: "0 22px", height: 44, borderRadius: 10, flexShrink: 0 }} onClick={handleSearch} disabled={loading}>
                            {loading ? <><Loader style={{ width: 13, height: 13, display: "inline", marginRight: 5, animation: "spin 1s linear infinite" }} />Scanning</> : "🔍 Search"}
                        </Btn>
                        <Btn variant="ghost" style={{ padding: "0 14px", height: 44, borderRadius: 10, flexShrink: 0, border: `1px solid ${T.amber}40`, color: T.amber, fontSize: 11 }}
                            onClick={() => smartScan(tab)} disabled={loading} title="AI-generated query from your org profile">
                            ✨ Smart
                        </Btn>
                        {query.trim() && <Btn variant="ghost" size="sm" onClick={saveSearch} style={{ flexShrink: 0, fontSize: 11 }}>🔖</Btn>}
                    </div>

                    {/* Quick topic chips */}
                    {!loading && results.length === 0 && (
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 6 }}>
                            <span style={{ fontSize: 10, color: T.mute, fontWeight: 700, alignSelf: "center", marginRight: 2 }}>Quick:</span>
                            {QUICK_CHIPS.map(chip => (
                                <button key={chip} onClick={() => { setQuery(chip); execSearch(chip); }}
                                    style={{ padding: "2px 10px", borderRadius: 14, fontSize: 11, fontWeight: 600, cursor: "pointer", background: "rgba(255,255,255,0.04)", border: `1px solid ${T.glassBorder}`, color: T.sub, transition: "all 0.15s" }}
                                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = T.text; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = T.sub; }}>
                                    {chip}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Source status pills */}
                    {(sources || loading) && (
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
                            <Database style={{ width: 11, height: 11, color: T.mute }} />
                            {tab === "grants" && <>
                                <SourcePill label="Grants.gov"  count={sources?.grantsGov?.count  ?? "…"} ok={sources?.grantsGov?.ok}   color="#22c55e" loading={loading} />
                                <SourcePill label="NIH"         count={sources?.nih?.count         ?? "…"} ok={sources?.nih?.ok}         color="#06b6d4" loading={loading} />
                                <SourcePill label="NSF"         count={sources?.nsf?.count         ?? "…"} ok={sources?.nsf?.ok}         color="#ec4899" loading={loading} />
                                <SourcePill label="Challenge"   count={sources?.challenge?.count   ?? "…"} ok={sources?.challenge?.ok}   color="#f43f5e" loading={loading} />
                                <SourcePill label="SAM.gov"     count={sources?.sam?.count         ?? "…"} ok={sources?.sam?.ok}         color="#3b82f6" loading={loading} />
                                <SourcePill label="SBIR"        count={sources?.sbir?.count        ?? "…"} ok={sources?.sbir?.ok}        color="#8b5cf6" loading={loading} />
                                <SourcePill label="USASpending" count={sources?.usaSpending?.count ?? "…"} ok={sources?.usaSpending?.ok} color="#f59e0b" loading={loading} />
                            </>}
                            {tab === "state" && <>
                                <SourcePill label={`${selectedState} Portal`} count={sources?.statePortal?.count ?? "…"} ok={sources?.statePortal?.ok} color="#8b5cf6" loading={loading} />
                                <SourcePill label="Grants.gov"  count={sources?.grantsGov?.count ?? "…"} ok={sources?.grantsGov?.ok}  color="#22c55e" loading={loading} />
                                <SourcePill label="USASpending" count={sources?.usaSpending?.count ?? "…"} ok={sources?.usaSpending?.ok} color="#f59e0b" loading={loading} />
                            </>}
                            {tab === "philanthropy" && <>
                                <SourcePill label="IRS 990-PF"  count={sources?.pf?.count   ?? "…"} ok={sources?.pf?.ok}   color="#8b5cf6" loading={loading} />
                                <SourcePill label="SEC EDGAR"   count={sources?.sec?.count  ?? "…"} ok={sources?.sec?.ok}  color="#1e40af" loading={loading} />
                                <SourcePill label="OpenAlex"    count={sources?.alex?.count ?? "…"} ok={sources?.alex?.ok} color="#06b6d4" loading={loading} />
                                <SourcePill label="Phil News"   count={sources?.news?.count ?? "…"} ok={sources?.news?.ok} color="#3b82f6" loading={loading} />
                                <SourcePill label="IRS Identity" count={sources?.eos?.count ?? "…"} ok={sources?.eos?.ok}  color="#22c55e" loading={loading} />
                            </>}
                            {tab === "international" && <>
                                <SourcePill label="World Bank" count={sources?.wb?.count   ?? "…"} ok={sources?.wb?.ok}   color="#059669" loading={loading} />
                                <SourcePill label="IATI"       count={sources?.iati?.count ?? "…"} ok={sources?.iati?.ok} color="#1e40af" loading={loading} />
                            </>}
                        </div>
                    )}
                </div>
            )}

            {/* ── CONTENT AREA ── */}
            <div>
                {["grants","state","international"].includes(tab) && (
                    <div>
                        {results.length === 0 && !loading && (
                            <Card style={{ textAlign: "center", padding: "44px 32px", borderTop: `3px solid ${TABS.find(t => t.id === tab)?.color || T.blue}`, marginBottom: 16 }}>
                                <div style={{ fontSize: 32, marginBottom: 10 }}>{TABS.find(t => t.id === tab)?.icon}</div>
                                <div style={{ fontWeight: 800, color: T.text, marginBottom: 6, fontSize: 16, fontFamily: "Outfit" }}>
                                    {{ grants: "7-Source Federal Search", state: `${selectedState} State & Local`, international: "International Development" }[tab]}
                                </div>
                                <p style={{ color: T.mute, fontSize: 13, maxWidth: 440, margin: "0 auto 18px", lineHeight: 1.6 }}>
                                    {{ grants: "Grants.gov · NIH Reporter · NSF · Challenge.gov · SAM.gov · SBIR.gov · USASpending — deduplicated and ranked.", state: `${selectedState} state portal + federal Grants.gov + USASpending awards in ${selectedState}.`, international: "World Bank Open Data + IATI Standard international aid data." }[tab]}
                                </p>
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
                                    {QUICK_CHIPS.slice(0,6).map(c => (
                                        <button key={c} onClick={() => { setQuery(c); execSearch(c); }}
                                            style={{ padding: "4px 12px", borderRadius: 16, fontSize: 11, fontWeight: 600, cursor: "pointer", background: "rgba(255,255,255,0.04)", border: `1px solid ${T.glassBorder}`, color: T.sub }}>
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </Card>
                        )}
                        <ResultsPanel />
                    </div>
                )}

                {tab === "philanthropy" && (
                    <div>
                        {(results.length > 0 || loading) ? (
                            <div>
                                {identities.length > 0 && (
                                    <div style={{ marginBottom: 16, padding: 12, background: `${T.green}08`, borderRadius: 12, border: `1px solid ${T.green}22` }}>
                                        <div style={{ fontSize: 10, fontWeight: 800, color: T.green, letterSpacing: 0.5, marginBottom: 8 }}>✅ IRS IDENTITY VERIFICATION — 501(c)(3) STATUS</div>
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 8 }}>
                                            {identities.map(id => (
                                                <div key={id.id} style={{ padding: 10, borderRadius: 8, border: `1px solid ${T.glassBorder}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <div>
                                                        <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{id.title}</div>
                                                        <div style={{ fontSize: 10, color: T.mute }}>EIN: {id.id} · {id.status}</div>
                                                    </div>
                                                    <Badge color={T.green}>VERIFIED</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <ResultsPanel />
                                <div style={{ textAlign: "center", paddingTop: 12 }}>
                                    <Btn variant="ghost" onClick={() => { setResults([]); setIdentities([]); setSources(null); setQuery(""); }}>← Clear</Btn>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <Card style={{ textAlign: "center", padding: "36px 32px", borderTop: `3px solid ${T.blue}`, marginBottom: 20 }}>
                                    <div style={{ fontSize: 28, marginBottom: 8 }}>🤝</div>
                                    <div style={{ fontWeight: 800, color: T.text, marginBottom: 6, fontSize: 16 }}>Philanthropy Multi-Source Search</div>
                                    <p style={{ color: T.mute, fontSize: 12, maxWidth: 420, margin: "0 auto 14px", lineHeight: 1.6 }}>IRS 990-PF · SEC EDGAR · OpenAlex Research · Philanthropy News · IRS Identity Verification</p>
                                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap", justifyContent: "center" }}>
                                        {["education foundation","health equity","community development","environment","arts & culture"].map(c => (
                                            <button key={c} onClick={() => { setQuery(c); execSearch(c); }}
                                                style={{ padding: "3px 10px", borderRadius: 14, fontSize: 11, fontWeight: 600, cursor: "pointer", background: "rgba(255,255,255,0.04)", border: `1px solid ${T.glassBorder}`, color: T.sub }}>
                                                {c}
                                            </button>
                                        ))}
                                    </div>
                                </Card>
                                <PhilanthropyPulse onAdd={onAdd} />
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 18, marginTop: 18 }}>
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
                            </div>
                        )}
                    </div>
                )}

                {tab === "regional" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        <RegionalPulse onAdd={onAdd} />
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 18 }}>
                            <ChamberPulse onAdd={onAdd} />
                            <FaithFunder onAdd={onAdd} />
                            <CBALedger onAdd={onAdd} />
                            <InKindVault onAdd={onAdd} />
                            <SurplusSentinel onAdd={onAdd} />
                        </div>
                    </div>
                )}

                {tab === "contracts"   && <GovContractRadar onAdd={onAdd} />}
                {tab === "tax_credits" && <TaxCreditNavigator onAdd={onAdd} />}
                {tab === "earmarks"    && <EarmarkScout onAdd={onAdd} />}
                {tab === "alerts"      && <MatchAlerts onAdd={onAdd} />}

                {tab === "foresight" && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 18 }}>
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