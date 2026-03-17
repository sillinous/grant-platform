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
    const [activeTab, setActiveTab] = useState("overview");
    const drawerRef = useRef(null);

    const link = g?.link || g?.url || g?.sourceUrl;
    const daysLeft = g?.deadline && g?.deadline !== "Rolling"
        ? Math.ceil((new Date(g.deadline) - Date.now()) / 86400000)
        : null;
    const urgencyColor = daysLeft !== null ? (daysLeft <= 7 ? T.red : daysLeft <= 21 ? T.amber : T.green) : T.mute;

    // Close on Escape
    useEffect(() => {
        const handler = (e) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    // Click outside to close
    useEffect(() => {
        const handler = (e) => {
            if (drawerRef.current && !drawerRef.current.contains(e.target)) onClose();
        };
        setTimeout(() => window.addEventListener("mousedown", handler), 50);
        return () => window.removeEventListener("mousedown", handler);
    }, [onClose]);

    const runAIAnalysis = async () => {
        setAiLoading(true);
        const sys = `You are a grant eligibility analyst. Analyze this funding opportunity against the organization profile and return JSON:
{
  "eligibilityScore": 0-100,
  "verdict": "Strong Match" | "Good Match" | "Possible Match" | "Low Match",
  "strengths": ["...", "..."],
  "risks": ["...", "..."],
  "nextSteps": ["...", "..."],
  "competitionLevel": "Low" | "Medium" | "High" | "Very High",
  "estimatedEffort": "1-2 days" | "1 week" | "2-3 weeks" | "1+ month"
}`;
        const prompt = `Organization: ${PROFILE.name || "Unknown"}, Focus: ${(PROFILE.focus || []).join(", ")}, Tags: ${(PROFILE.tags || []).join(", ")}, Location: ${PROFILE.loc || "Unknown"}, NAICS: ${PROFILE.naics || "N/A"}.

Opportunity: "${g.title}"
Agency: ${g.agency || "Unknown"}
Amount: ${typeof g.amount === "number" ? "$" + g.amount.toLocaleString() : g.amount || "Unknown"}
Deadline: ${g.deadline || "Unknown"}
CFDA: ${g.cfda || "N/A"}
Type: ${g.awardType || "Grant"}
Set-Aside: ${g.setAside || "None"}
Description: ${g.description?.slice(0, 600) || "No description available"}`;

        try {
            const res = await API.callAI([{ role: "user", content: prompt }], sys);
            const json = JSON.parse((res.text || "{}").replace(/```json\n?|```/g, "").trim());
            setAiAnalysis(json);
        } catch {
            setAiAnalysis({ eligibilityScore: 0, verdict: "Analysis unavailable", strengths: [], risks: ["AI analysis failed — check API connection"], nextSteps: [], competitionLevel: "Unknown", estimatedEffort: "Unknown" });
        }
        setAiLoading(false);
    };

    if (!g) return null;

    const tabs = [
        { key: "overview", label: "Overview" },
        { key: "details", label: "Details" },
        { key: "ai", label: "AI Analysis" },
    ];

    const Row = ({ icon: Icon, label, value, mono, link: rowLink, color }) => value ? (
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 0", borderBottom: `1px solid ${T.glassBorder}` }}>
            <div style={{ color: T.mute, flexShrink: 0, marginTop: 1 }}>{Icon && <Icon size={14} />}</div>
            <div style={{ fontSize: 12, color: T.mute, minWidth: 110, flexShrink: 0 }}>{label}</div>
            <div style={{ fontSize: 13, color: color || T.text, fontFamily: mono ? "monospace" : undefined, flex: 1, wordBreak: "break-word" }}>
                {rowLink ? <a href={rowLink} target="_blank" rel="noopener noreferrer" style={{ color: T.blue, textDecoration: "none" }}>{value} ↗</a> : value}
            </div>
        </div>
    ) : null;

    return (
        <>
            {/* Backdrop */}
            <div style={{
                position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 999,
                animation: "fadeIn 0.15s",
            }} />

            {/* Drawer */}
            <div ref={drawerRef} style={{
                position: "fixed", top: 0, right: 0, bottom: 0,
                width: "min(640px, 100vw)",
                background: T.glass,
                backdropFilter: "blur(24px)",
                borderLeft: `1px solid ${T.glassBorder}`,
                zIndex: 1000,
                display: "flex", flexDirection: "column",
                animation: "slideInRight 0.25s cubic-bezier(0.4,0,0.2,1)",
                boxShadow: "-24px 0 80px rgba(0,0,0,0.4)",
            }}>
                {/* Header */}
                <div style={{
                    padding: "20px 24px 16px",
                    borderBottom: `1px solid ${T.glassBorder}`,
                    flexShrink: 0,
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            {/* Source + badges */}
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                                <Badge color={g._sourceColor || T.blue} style={{ fontSize: 9, fontWeight: 800 }}>{g._source || "Federal"}</Badge>
                                {g.cfda && <Badge color="#6366f1" style={{ fontSize: 9 }}>CFDA {g.cfda}</Badge>}
                                {g.awardType && <Badge color={T.mute} style={{ fontSize: 9 }}>{g.awardType}</Badge>}
                                {g.setAside && <Badge color="#0ea5e9" style={{ fontSize: 9 }}>{g.setAside}</Badge>}
                                {g.category && <Badge color="#a855f7" style={{ fontSize: 9 }}>{g.category}</Badge>}
                                {isTracked && <Badge color={T.green} style={{ fontSize: 9 }}>✓ Tracked</Badge>}
                            </div>
                            <h2 style={{ fontSize: 17, fontWeight: 800, color: T.text, margin: 0, lineHeight: 1.4, fontFamily: "Outfit" }}>{g.title}</h2>
                            <div style={{ fontSize: 12, color: T.sub, marginTop: 6 }}>{g.agency}</div>
                        </div>
                        <button onClick={onClose} style={{
                            background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 8,
                            padding: 8, cursor: "pointer", color: T.mute, flexShrink: 0,
                            display: "flex", alignItems: "center",
                        }}>
                            <X size={16} />
                        </button>
                    </div>

                    {/* Amount + deadline hero */}
                    <div style={{ display: "flex", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
                        <div style={{ background: `${T.green}15`, border: `1px solid ${T.green}33`, borderRadius: 10, padding: "10px 16px" }}>
                            <div style={{ fontSize: 10, color: T.mute, fontWeight: 800, letterSpacing: 1, marginBottom: 2 }}>AWARD AMOUNT</div>
                            <div style={{ fontSize: 22, fontWeight: 900, color: T.green, letterSpacing: "-0.03em" }}>
                                {typeof g.amount === "number" && g.amount > 0
                                    ? g.amount >= 1e6 ? `$${(g.amount / 1e6).toFixed(1)}M` : `$${g.amount.toLocaleString()}`
                                    : g.amount || "—"}
                            </div>
                            {g.amountFloor > 0 && <div style={{ fontSize: 10, color: T.mute }}>Floor: ${g.amountFloor?.toLocaleString()}</div>}
                        </div>
                        {(g.deadline || daysLeft !== null) && (
                            <div style={{ background: `${urgencyColor}15`, border: `1px solid ${urgencyColor}33`, borderRadius: 10, padding: "10px 16px" }}>
                                <div style={{ fontSize: 10, color: T.mute, fontWeight: 800, letterSpacing: 1, marginBottom: 2 }}>DEADLINE</div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: urgencyColor }}>
                                    {g.deadline === "Rolling" ? "Rolling" : String(g.deadline || "").slice(0, 10)}
                                </div>
                                {daysLeft !== null && <div style={{ fontSize: 11, color: urgencyColor }}>{daysLeft > 0 ? `${daysLeft} days left` : "Expired"}</div>}
                            </div>
                        )}
                        {link && (
                            <a href={link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "flex" }}>
                                <div style={{ background: `${T.blue}15`, border: `1px solid ${T.blue}33`, borderRadius: 10, padding: "10px 16px", cursor: "pointer", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 4 }}>
                                    <ExternalLink size={16} color={T.blue} />
                                    <div style={{ fontSize: 10, color: T.blue, fontWeight: 700 }}>Source</div>
                                </div>
                            </a>
                        )}
                    </div>

                    {/* Tab nav */}
                    <div style={{ display: "flex", gap: 4, marginTop: 16 }}>
                        {tabs.map(t => (
                            <button key={t.key} onClick={() => { setActiveTab(t.key); if (t.key === "ai" && !aiAnalysis && !aiLoading) runAIAnalysis(); }}
                                style={{
                                    background: activeTab === t.key ? `${T.blue}22` : "transparent",
                                    border: `1px solid ${activeTab === t.key ? T.blue + "66" : T.glassBorder}`,
                                    borderRadius: 8, padding: "6px 14px", cursor: "pointer",
                                    fontSize: 12, fontWeight: 700,
                                    color: activeTab === t.key ? T.blue : T.mute,
                                    transition: "all 0.15s",
                                }}>
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Body */}
                <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>

                    {/* ── OVERVIEW ── */}
                    {activeTab === "overview" && (
                        <div style={{ animation: "fadeIn 0.2s" }}>
                            {g.description && (
                                <div style={{ marginBottom: 24 }}>
                                    <div style={{ fontSize: 11, color: T.mute, fontWeight: 800, letterSpacing: 1, marginBottom: 8 }}>DESCRIPTION</div>
                                    <p style={{ fontSize: 14, color: T.sub, lineHeight: 1.7, margin: 0 }}>{g.description}</p>
                                </div>
                            )}

                            {/* Key facts grid */}
                            <div style={{ marginBottom: 20 }}>
                                <div style={{ fontSize: 11, color: T.mute, fontWeight: 800, letterSpacing: 1, marginBottom: 8 }}>KEY FACTS</div>
                                <Row icon={Building2} label="Agency" value={g.agency} />
                                <Row icon={Hash} label="Opp Number" value={g.oppNumber} mono />
                                <Row icon={Tag} label="CFDA" value={g.cfda} />
                                <Row icon={Tag} label="NAICS" value={g.naics} />
                                <Row icon={Tag} label="Award Type" value={g.awardType} />
                                <Row icon={Shield} label="Set-Aside" value={g.setAside} />
                                <Row icon={Tag} label="Category" value={g.category} />
                                <Row icon={CheckCircle} label="Status" value={g.status} color={g.status === "Open" || g.status === "Posted" ? T.green : undefined} />
                                <Row icon={Calendar} label="Award Start" value={g.awardStart ? String(g.awardStart).slice(0, 10) : null} />
                                <Row icon={Users} label="PI / Contact" value={g.pi} />
                                <Row icon={Building2} label="Recipient Org" value={g.org} />
                                <Row icon={FileText} label="Program" value={g.program} />
                                <Row icon={Hash} label="EIN" value={g.ein} mono />
                            </div>

                            {link && (
                                <a href={link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                                    <div style={{
                                        padding: "14px 18px", background: `${T.blue}10`, border: `1px solid ${T.blue}33`,
                                        borderRadius: 12, display: "flex", alignItems: "center", gap: 10,
                                        color: T.blue, fontSize: 14, fontWeight: 700,
                                    }}>
                                        <ExternalLink size={16} />
                                        View Full Opportunity at {g._source || "Source"}
                                    </div>
                                </a>
                            )}
                        </div>
                    )}

                    {/* ── DETAILS ── */}
                    {activeTab === "details" && (
                        <div style={{ animation: "fadeIn 0.2s" }}>
                            <div style={{ fontSize: 11, color: T.mute, fontWeight: 800, letterSpacing: 1, marginBottom: 8 }}>ALL AVAILABLE DATA</div>
                            {Object.entries(g)
                                .filter(([k, v]) => !k.startsWith("_") && v !== null && v !== undefined && v !== "" && v !== 0)
                                .map(([k, v]) => (
                                    <div key={k} style={{ display: "flex", gap: 12, padding: "8px 0", borderBottom: `1px solid ${T.glassBorder}` }}>
                                        <div style={{ fontSize: 11, color: T.mute, minWidth: 130, flexShrink: 0, fontFamily: "monospace" }}>{k}</div>
                                        <div style={{ fontSize: 12, color: T.sub, flex: 1, wordBreak: "break-all" }}>
                                            {typeof v === "string" && (v.startsWith("http://") || v.startsWith("https://"))
                                                ? <a href={v} target="_blank" rel="noopener noreferrer" style={{ color: T.blue, textDecoration: "none" }}>{v}</a>
                                                : typeof v === "number" && v > 1000 ? `$${v.toLocaleString()}`
                                                : typeof v === "object" ? JSON.stringify(v).slice(0, 200)
                                                : String(v).slice(0, 400)}
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    )}

                    {/* ── AI ANALYSIS ── */}
                    {activeTab === "ai" && (
                        <div style={{ animation: "fadeIn 0.2s" }}>
                            {aiLoading ? (
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "48px 0" }}>
                                    <div style={{ fontSize: 32 }}>🧠</div>
                                    <div style={{ fontSize: 14, color: T.sub }}>Analyzing eligibility against your profile…</div>
                                    <div style={{ width: "100%", height: 3, background: T.glassBorder, borderRadius: 2, overflow: "hidden" }}>
                                        <div style={{ height: "100%", width: "60%", background: T.blue, animation: "pulse 1.5s ease-in-out infinite", borderRadius: 2 }} />
                                    </div>
                                </div>
                            ) : aiAnalysis ? (
                                <div>
                                    {/* Score ring */}
                                    <div style={{ display: "flex", gap: 20, alignItems: "center", marginBottom: 24, padding: 20, background: "rgba(255,255,255,0.03)", borderRadius: 14, border: `1px solid ${T.glassBorder}` }}>
                                        <div style={{ position: "relative", width: 80, height: 80, flexShrink: 0 }}>
                                            <svg viewBox="0 0 80 80" style={{ transform: "rotate(-90deg)", width: 80, height: 80 }}>
                                                <circle cx={40} cy={40} r={32} fill="none" stroke={T.border} strokeWidth={7} />
                                                <circle cx={40} cy={40} r={32} fill="none"
                                                    stroke={aiAnalysis.eligibilityScore >= 80 ? T.green : aiAnalysis.eligibilityScore >= 60 ? T.amber : T.red}
                                                    strokeWidth={7}
                                                    strokeDasharray={`${(aiAnalysis.eligibilityScore / 100) * 201} 201`}
                                                    strokeLinecap="round" />
                                            </svg>
                                            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 900, color: T.text }}>
                                                {aiAnalysis.eligibilityScore}%
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 4 }}>{aiAnalysis.verdict}</div>
                                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                                {aiAnalysis.competitionLevel && <Badge color={T.mute} style={{ fontSize: 10 }}>Competition: {aiAnalysis.competitionLevel}</Badge>}
                                                {aiAnalysis.estimatedEffort && <Badge color={T.blue} style={{ fontSize: 10 }}>Effort: {aiAnalysis.estimatedEffort}</Badge>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Strengths */}
                                    {aiAnalysis.strengths?.length > 0 && (
                                        <div style={{ marginBottom: 20 }}>
                                            <div style={{ fontSize: 11, color: T.green, fontWeight: 800, letterSpacing: 1, marginBottom: 10 }}>✅ STRENGTHS</div>
                                            {aiAnalysis.strengths.map((s, i) => (
                                                <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: `1px solid ${T.glassBorder}` }}>
                                                    <div style={{ color: T.green, flexShrink: 0 }}>•</div>
                                                    <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.5 }}>{s}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Risks */}
                                    {aiAnalysis.risks?.length > 0 && (
                                        <div style={{ marginBottom: 20 }}>
                                            <div style={{ fontSize: 11, color: T.amber, fontWeight: 800, letterSpacing: 1, marginBottom: 10 }}>⚠️ RISKS / GAPS</div>
                                            {aiAnalysis.risks.map((r, i) => (
                                                <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: `1px solid ${T.glassBorder}` }}>
                                                    <div style={{ color: T.amber, flexShrink: 0 }}>•</div>
                                                    <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.5 }}>{r}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Next steps */}
                                    {aiAnalysis.nextSteps?.length > 0 && (
                                        <div style={{ marginBottom: 20 }}>
                                            <div style={{ fontSize: 11, color: T.blue, fontWeight: 800, letterSpacing: 1, marginBottom: 10 }}>🚀 NEXT STEPS</div>
                                            {aiAnalysis.nextSteps.map((s, i) => (
                                                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 0", borderBottom: `1px solid ${T.glassBorder}` }}>
                                                    <div style={{ background: T.blue, color: "#fff", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                                                    <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.5 }}>{s}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <Btn variant="ghost" size="sm" onClick={runAIAnalysis} style={{ width: "100%" }}>↺ Re-analyze</Btn>
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "48px 0", textAlign: "center" }}>
                                    <div style={{ fontSize: 40 }}>🧠</div>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>AI Eligibility Analysis</div>
                                    <div style={{ fontSize: 13, color: T.sub, maxWidth: 320 }}>Get an instant eligibility score, strengths, risk gaps, and next steps — tailored to your profile.</div>
                                    <Btn variant="primary" onClick={runAIAnalysis}>Run Analysis</Btn>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer actions */}
                <div style={{ padding: "16px 24px", borderTop: `1px solid ${T.glassBorder}`, flexShrink: 0, display: "flex", gap: 10 }}>
                    {link && (
                        <a href={link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                            <Btn variant="ghost" size="sm" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <ExternalLink size={13} /> Open
                            </Btn>
                        </a>
                    )}
                    <Btn variant="ghost" size="sm"
                        style={{ display: "flex", alignItems: "center", gap: 6 }}
                        onClick={() => { setActiveTab("ai"); if (!aiAnalysis && !aiLoading) runAIAnalysis(); }}>
                        <Sparkles size={13} /> AI Analysis
                    </Btn>
                    <Btn
                        variant={isTracked ? "ghost" : "primary"}
                        size="sm"
                        style={{ flex: 1 }}
                        onClick={() => !isTracked && onAdd(g)}
                        disabled={isTracked}
                    >
                        {isTracked ? "✓ Already Tracked" : "+ Track Opportunity"}
                    </Btn>
                </div>
            </div>

            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
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

export const Discovery = () => {
    const [tab, setTab] = useState("grants");
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [sources, setSources] = useState(null);
    const [identities, setIdentities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [sortBy, setSortBy] = useState("relevance"); // relevance | amount | deadline
    const [selectedGrant, setSelectedGrant] = useState(null);
    const [filterSource, setFilterSource] = useState("All");
    const [visibleCount, setVisibleCount] = useState(20);
    const [selectedState, setSelectedState] = useState(() => {
        const loc = PROFILE.loc || "";
        const abbr = loc.split(",").pop()?.trim().slice(0, 2).toUpperCase();
        return US_STATES.includes(abbr) ? abbr : "IL";
    });
    const { grants: trackedGrants, addGrant } = useStore();
    const trackedTitles = new Set((trackedGrants || []).map(g => (g.title || "").trim().toLowerCase()));

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
        setFilterSource("All");
        setVisibleCount(20);
    };

    // Sorted + filtered view of results
    const sortedResults = useCallback(() => {
        let r = filterSource === "All" ? results : results.filter(x => x._source === filterSource);
        if (sortBy === "amount") r = [...r].sort((a, b) => (b.amount || 0) - (a.amount || 0));
        else if (sortBy === "deadline") r = [...r].sort((a, b) => {
            if (!a.deadline || a.deadline === "Rolling") return 1;
            if (!b.deadline || b.deadline === "Rolling") return -1;
            return new Date(a.deadline) - new Date(b.deadline);
        });
        // default: relevance (_score already ranked)
        return r;
    }, [results, sortBy, filterSource]);

    const smartScan = async () => {
        setLoading(true);
        setResults([]);
        setSources(null);
        setVisibleCount(20);
        // Build an optimized query from the org profile using AI
        const profile = window.__PROFILE || PROFILE;
        const focus = (profile.focus || []).join(", ");
        const tags = (profile.tags || []).join(", ");
        const loc = profile.loc || "";
        const type = profile.type || "Non-Profit";
        const sys = `You are a grant discovery expert. Given this org profile, generate the single best 3-6 word search query to find the most relevant federal grants. Return ONLY the query string, nothing else.`;
        const msg = `Organization: ${profile.name || "Non-Profit"}, Type: ${type}, Focus: ${focus}, Tags: ${tags}, Location: ${loc}`;
        const result = await API.callAI([{ role: "user", content: msg }], sys);
        const smartQuery = result.error ? (focus.split(",")[0] || "community development") : result.text.trim().replace(/["\n]/g, "");
        setQuery(smartQuery);
        const data = await API.searchGrantsMultiSource(smartQuery);
        setResults(data.results || []);
        setSources(data.sources);
        setLoading(false);
    };

    const handleSearch = async () => {
        if (!query.trim()) return;
        setLoading(true);
        setResults([]);
        setSources(null);
        setVisibleCount(20);

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

            {/* ── Opportunity Detail Drawer ── */}
            {selectedGrant && (
                <OpportunityDrawer
                    grant={selectedGrant}
                    onClose={() => setSelectedGrant(null)}
                    onAdd={onAdd}
                    isTracked={trackedTitles.has((selectedGrant.title || "").trim().toLowerCase())}
                />
            )}

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
                    {tab === "grants" && (
                        <Btn variant="ghost" style={{ padding: "0 16px", height: 48, borderRadius: 12, flexShrink: 0, border: `1px solid ${T.amber}40`, color: T.amber, fontSize: 12 }} onClick={smartScan} disabled={loading} title="AI builds optimized query from your org profile">
                            ✨ Smart Scan
                        </Btn>
                    )}
                </div>
            )}

            {/* Source Status Bar */}
            {showSearchBar && (sources || loading) && (
                <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Database style={{ width: 12, height: 12, color: T.mute }} />
                    <span style={{ fontSize: 10, color: T.mute, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase' }}>Sources:</span>
                    {tab === 'grants' && <>
                        <SourcePill label="Grants.gov"    count={sources?.grantsGov?.count   ?? '…'} ok={sources?.grantsGov?.ok}    color="#22c55e" loading={loading} />
                        <SourcePill label="NIH Reporter"  count={sources?.nih?.count          ?? '…'} ok={sources?.nih?.ok}          color="#06b6d4" loading={loading} />
                        <SourcePill label="NSF Awards"    count={sources?.nsf?.count          ?? '…'} ok={sources?.nsf?.ok}          color="#ec4899" loading={loading} />
                        <SourcePill label="Challenge.gov" count={sources?.challenge?.count    ?? '…'} ok={sources?.challenge?.ok}    color="#f43f5e" loading={loading} />
                        <SourcePill label="SAM.gov"       count={sources?.sam?.count          ?? '…'} ok={sources?.sam?.ok}          color="#3b82f6" loading={loading} />
                        <SourcePill label="SBIR.gov"      count={sources?.sbir?.count         ?? '…'} ok={sources?.sbir?.ok}         color="#8b5cf6" loading={loading} />
                        <SourcePill label="USASpending"   count={sources?.usaSpending?.count  ?? '…'} ok={sources?.usaSpending?.ok}  color="#f59e0b" loading={loading} />
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
                        {results.length > 0 && !loading && (() => {
                            const sourceOptions = ['All', ...new Set(results.map(r => r._source).filter(Boolean))];
                            const displayed = sortedResults().slice(0, visibleCount);
                            return (
                                <>
                                    {/* Sort + Filter bar */}
                                    <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: 11, color: T.mute, fontWeight: 700, letterSpacing: 0.8 }}>SORT:</span>
                                        {[['relevance', '⭐ Relevance'], ['amount', '💰 Amount'], ['deadline', '⏰ Deadline']].map(([val, label]) => (
                                            <button key={val} onClick={() => setSortBy(val)} style={{
                                                padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                                                border: `1px solid ${sortBy === val ? T.amber + '60' : T.glassBorder}`,
                                                background: sortBy === val ? T.amber + '14' : 'transparent',
                                                color: sortBy === val ? T.amber : T.sub, transition: 'all 0.15s'
                                            }}>{label}</button>
                                        ))}
                                        <span style={{ fontSize: 11, color: T.mute, fontWeight: 700, letterSpacing: 0.8, marginLeft: 12 }}>SOURCE:</span>
                                        {sourceOptions.map(s => (
                                            <button key={s} onClick={() => setFilterSource(s)} style={{
                                                padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                                                border: `1px solid ${filterSource === s ? T.blue + '60' : T.glassBorder}`,
                                                background: filterSource === s ? T.blue + '14' : 'transparent',
                                                color: filterSource === s ? T.blue : T.sub, transition: 'all 0.15s'
                                            }}>{s}</button>
                                        ))}
                                        <span style={{ marginLeft: 'auto', fontSize: 11, color: T.mute }}>{sortedResults().length} results</span>
                                    </div>
                                    {displayed.map(g => (
                                        <GrantResultCard key={g.id} g={g} onAdd={onAdd} onOpen={setSelectedGrant}
                                            isTracked={trackedTitles.has((g.title || "").trim().toLowerCase())} />
                                    ))}
                                    {sortedResults().length > visibleCount && (
                                        <div style={{ textAlign: 'center', marginTop: 16 }}>
                                            <Btn variant="secondary" onClick={() => setVisibleCount(v => v + 20)}>
                                                Load more ({sortedResults().length - visibleCount} remaining)
                                            </Btn>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
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
                        {results.map(g => <GrantResultCard key={g.id} g={g} onAdd={onAdd} onOpen={setSelectedGrant} />)}
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
                        {results.map(g => <GrantResultCard key={g.id} g={g} onAdd={onAdd} onOpen={setSelectedGrant} />)}
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

                                {results.map(p => <GrantResultCard key={p.id} g={p} onAdd={onAdd} onOpen={setSelectedGrant} />)}
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
