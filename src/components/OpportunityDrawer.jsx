/**
 * OpportunityDrawer — shared detail panel used across all Discovery sub-components.
 * Usage:
 *   const [selected, setSelected] = useState(null);
 *   <OpportunityDrawer grant={selected} onClose={() => setSelected(null)} onAdd={onAdd} isTracked={...} />
 *   <Card onClick={() => setSelected(item)}>...</Card>
 */
import React, { useState, useEffect, useRef } from 'react';
import { Badge, Btn } from '../ui';
import { T, PROFILE, uid, fmt } from '../globals';
import { API } from '../api';
import { useStore } from '../store';
import { X, ExternalLink, FileText, Sparkles, Building2, Hash, Users, Calendar, Tag, Shield, DollarSign, CheckCircle, Clock, Loader, Bookmark } from 'lucide-react';

export const OpportunityDrawer = ({ grant: g, onClose, onAdd, isTracked }) => {
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiPhase, setAiPhase] = useState("");
    const [activeTab, setActiveTab] = useState("overview");
    const [copied, setCopied] = useState(null);
    const [drafting, setDrafting] = useState(false);
    const [draftText, setDraftText] = useState("");
    const [similar, setSimilar] = useState([]);
    const [similarLoading, setSimilarLoading] = useState(false);
    const [detail, setDetail] = useState(null);       // enriched data from source API
    const [detailLoading, setDetailLoading] = useState(false);
    const drawerRef = useRef(null);
    const { contacts = [] } = useStore();

    const link = g?.link || g?.url || g?.sourceUrl;
    const daysLeft = g?.deadline && g?.deadline !== "Rolling"
        ? Math.ceil((new Date(g.deadline) - Date.now()) / 86400000) : null;
    const urgencyColor = daysLeft !== null
        ? (daysLeft <= 7 ? T.red : daysLeft <= 21 ? T.amber : T.green) : T.mute;
    const scoreColor = (s) => s >= 80 ? T.green : s >= 60 ? T.amber : T.red;

    const relatedContacts = contacts.filter(c => {
        const hay = `${c.org || ""} ${c.role || ""} ${c.tags?.join(" ") || ""}`.toLowerCase();
        const needle = `${g?.agency || ""} ${g?.title || ""} ${g?.category || ""}`.toLowerCase();
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

    useEffect(() => {
        if (activeTab === "ai" && !aiAnalysis && !aiLoading) runAIAnalysis();
        if (activeTab === "similar" && similar.length === 0 && !similarLoading) loadSimilar();
    }, [activeTab]);

    // Reset + load detail when grant changes
    useEffect(() => {
        setAiAnalysis(null); setAiLoading(false); setDraftText("");
        setSimilar([]); setActiveTab("overview"); setDetail(null);
        if (g) loadDetail();
    }, [g?.id]);

    // Load enriched detail from source API
    const loadDetail = async () => {
        if (!g) return;
        setDetailLoading(true);
        try {
            const src = g._source || "";
            let enriched = {};

            if (src === "Grants.gov" && g.oppNumber) {
                const d = await API.getGrantDetail(g.oppNumber).catch(() => null);
                if (d) enriched = {
                    fullDescription: d.synopsisDesc || d.description || "",
                    eligibleApplicants: d.applicantTypes || d.eligibleApplicants || d.eligApplicantTypes || "",
                    costSharing: d.costSharingOrMatchingRequirement,
                    fundingInstrument: d.fundingInstrumentType,
                    estimatedAwards: d.estimatedNumberOfAwards,
                    postDate: d.postDate || d.postedDate,
                    archiveDate: d.archiveDate,
                    additionalInfo: d.additionalInfoDesc || d.additionalInformationUrl,
                    contactEmail: d.grantor?.email || d.contactInfo?.email,
                    contactName: d.grantor?.name || d.contactInfo?.name,
                    contactPhone: d.grantor?.phone || d.contactInfo?.phone,
                    cfdaDescription: d.cfdaDesc || "",
                    programDescription: d.programDesc || "",
                    version: d.version,
                    attachments: d.synopsis?.attachments || [],
                    _enriched: true,
                };
            } else if (src === "NIH Reporter" && g.oppNumber) {
                const d = await fetch(`https://api.reporter.nih.gov/v2/projects/search`, {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ criteria: { project_nums: [g.oppNumber] }, include_fields: ["AbstractText","ProjectTitle","AgencyCode","TotalCost","ProjectStartDate","ProjectEndDate","OrgName","OrgCity","OrgState","PdPiName","Terms","SubProjectId","ActivityCode","FundingMechanism","ProgramOfficerName","ApplicationId"], offset: 0, limit: 1 }),
                    signal: AbortSignal.timeout(8000)
                }).then(r => r.ok ? r.json() : null).catch(() => null);
                const p = d?.results?.[0];
                if (p) enriched = {
                    fullDescription: p.abstract_text || "",
                    contactName: p.contact_pi_name || "",
                    programOfficer: p.program_officer_name || "",
                    activityCode: p.activity_code || "",
                    fundingMechanism: p.funding_mechanism || "",
                    applicationId: p.application_id || "",
                    subProjectId: p.sub_project_id || "",
                    terms: p.terms || "",
                    orgCity: p.org_city || "",
                    orgState: p.org_state || "",
                    _enriched: true,
                };
            } else if (src === "NSF Awards" && g.id) {
                const d = await fetch(`https://api.nsf.gov/services/v1/awards/${g.id}.json?printFields=id,title,abstractText,fundsObligatedAmt,date,expDate,awardeeName,awardeeCity,awardeeStateCode,pdPIName,copdPIName,perfCity,perfStateCode,primaryProgram,transType,publicationResearch,fundProgramName`)
                    .then(r => r.ok ? r.json() : null).catch(() => null);
                const a = d?.response?.award?.[0];
                if (a) enriched = {
                    fullDescription: a.abstractText || "",
                    awardeeCity: a.awardeeCity || "",
                    awardeeState: a.awardeeStateCode || "",
                    perfCity: a.perfCity || "",
                    perfState: a.perfStateCode || "",
                    coPIs: a.copdPIName || "",
                    transType: a.transType || "",
                    fundProgramName: a.fundProgramName || "",
                    primaryProgram: a.primaryProgram || "",
                    publicationResearch: a.publicationResearch || "",
                    _enriched: true,
                };
            } else if (src === "USASpending" && g.id) {
                const d = await fetch(`https://api.usaspending.gov/api/v2/awards/${encodeURIComponent(g.id)}/`)
                    .then(r => r.ok ? r.json() : null).catch(() => null);
                if (d) enriched = {
                    fullDescription: d.description || d.award_description || "",
                    recipientAddress: d.recipient?.location ? `${d.recipient.location.address_line1 || ""}, ${d.recipient.location.city_name || ""}, ${d.recipient.location.state_code || ""}`.trim().replace(/^,\s*/, "") : "",
                    recipientUEI: d.recipient?.uei || "",
                    recipientDUNS: d.recipient?.duns || "",
                    awardingOffice: d.awarding_agency?.subtier_agency?.name || "",
                    fundingAgency: d.funding_agency?.subtier_agency?.name || "",
                    periodOfPerformance: d.period_of_performance ? `${d.period_of_performance.start_date || ""} → ${d.period_of_performance.end_date || ""}` : "",
                    obligatedAmount: d.total_obligation || 0,
                    baseExercisedAmount: d.base_and_exercised_options_value || 0,
                    placeOfPerformance: d.place_of_performance ? `${d.place_of_performance.city_name || ""}, ${d.place_of_performance.state_code || ""}`.trim().replace(/^,/, "") : "",
                    subawardCount: d.subaward_count || 0,
                    subawardAmount: d.total_subaward_amount || 0,
                    executiveCompensation: d.executive_details?.officers?.slice(0,3).map(o => `${o.name}: $${(o.amount||0).toLocaleString()}`).join(" · ") || "",
                    _enriched: true,
                };
            } else if (src === "SBIR.gov" && g.oppNumber) {
                const d = await fetch(`https://api.sbir.gov/public/api/awards?award=${encodeURIComponent(g.oppNumber)}&rows=1`)
                    .then(r => r.ok ? r.json() : null).catch(() => null);
                const a = (d?.results || d?.data || [])[0];
                if (a) enriched = {
                    fullDescription: a.abstract || a.project_description || "",
                    phase: a.phase || a.award_type || "",
                    solicitation: a.solicitation_number || "",
                    contractNumber: a.contract || "",
                    sbirTopicCode: a.topic_code || a.sbc_firm_name || "",
                    hubzoneOwned: a.hubzone_owned || "",
                    womanOwned: a.woman_owned || "",
                    veteranOwned: a.veteran_owned || "",
                    _enriched: true,
                };
            }

            setDetail(enriched);
        } catch { setDetail({}); }
        setDetailLoading(false);
    };

    const copy = (text, key) => {
        navigator.clipboard.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(null), 1800); });
    };

    const runAIAnalysis = async () => {
        setAiLoading(true);
        const phases = ["Scanning org profile…", "Cross-referencing eligibility…", "Assessing competition…", "Generating recommendations…"];
        let i = 0; setAiPhase(phases[0]);
        const iv = setInterval(() => { i = Math.min(i + 1, phases.length - 1); setAiPhase(phases[i]); }, 1400);
        const sys = `You are a senior grant strategist. Analyze this funding opportunity. Return ONLY valid JSON:
{"eligibilityScore":<0-100>,"verdict":"Strong Match"|"Good Match"|"Possible Match"|"Low Match","headline":"<one sentence>","strengths":["..."],"risks":["..."],"nextSteps":["..."],"competitionLevel":"Low"|"Medium"|"High"|"Very High","estimatedEffort":"1-2 days"|"1 week"|"2-3 weeks"|"1+ month","winRate":<0-100>,"keyRequirements":["..."],"applicationTip":"<tip>"}`;
        const prompt = `Org: ${PROFILE.name||"Unknown"} | Focus: ${(PROFILE.focus||[]).join(", ")} | Tags: ${(PROFILE.tags||[]).join(", ")} | Location: ${PROFILE.loc||"Unknown"} | NAICS: ${PROFILE.naics||"N/A"}.
Opportunity: "${g.title}" | Agency: ${g.agency||"Unknown"} | Amount: ${typeof g.amount==="number"?"$"+g.amount.toLocaleString():g.amount||"Unknown"} | Deadline: ${g.deadline||"Unknown"}
CFDA: ${g.cfda||"N/A"} | Type: ${g.awardType||g.type||"Grant"} | Set-Aside: ${g.setAside||"None"} | Source: ${g._source||"Unknown"}
Description: ${(g.description||g.synopsis||"").slice(0,800)}`;
        try {
            const res = await API.callAI([{ role: "user", content: prompt }], sys);
            setAiAnalysis(JSON.parse((res.text || "{}").replace(/```json\n?|```/g, "").trim()));
        } catch {
            setAiAnalysis({ eligibilityScore: 0, verdict: "Unavailable", headline: "AI analysis failed.", strengths: [], risks: ["Check AI connection"], nextSteps: [], competitionLevel: "Unknown", estimatedEffort: "Unknown", winRate: 0, keyRequirements: [], applicationTip: "" });
        }
        clearInterval(iv); setAiPhase(""); setAiLoading(false);
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
        setDrafting(true); setDraftText("");
        const sys = "You are a grant writer. Write a concise 3-paragraph project narrative opening for this opportunity. Be specific and persuasive. Under 250 words.";
        const prompt = `Org: ${PROFILE.name||"Our Organization"}. Focus: ${(PROFILE.focus||[]).join(", ")}. Location: ${PROFILE.loc||""}.\nOpportunity: ${g.title} (${g.agency}). Amount: ${typeof g.amount==="number"?"$"+g.amount.toLocaleString():g.amount}.\nDescription: ${(g.description||"").slice(0,400)}`;
        try { const res = await API.callAI([{ role: "user", content: prompt }], sys); setDraftText(res.text || "Draft failed."); }
        catch { setDraftText("Draft generation failed."); }
        setDrafting(false);
    };

    if (!g) return null;

    const amtDisplay = typeof g.amount === "number" && g.amount > 0
        ? g.amount >= 1e6 ? `$${(g.amount / 1e6).toFixed(2)}M` : `$${g.amount.toLocaleString()}`
        : (g.amount && g.amount !== "0") ? g.amount : "—";

    const CopyBtn = ({ value, id, label = "copy" }) => (
        <button onClick={() => copy(value, id)} style={{
            background: copied === id ? `${T.green}22` : "rgba(255,255,255,0.06)", border: `1px solid ${copied===id?T.green+"44":T.glassBorder}`,
            borderRadius: 5, padding: "2px 7px", cursor: "pointer", fontSize: 10, color: copied===id ? T.green : T.mute, marginLeft: 6
        }}>{copied === id ? "✓" : label}</button>
    );

    const Row = ({ icon: Icon, label, value, mono, rowLink, color, copyId }) => value ? (
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 0", borderBottom: `1px solid ${T.glassBorder}` }}>
            {Icon && <Icon size={13} style={{ color: T.mute, flexShrink: 0, marginTop: 2 }} />}
            <div style={{ fontSize: 11, color: T.mute, minWidth: 100, flexShrink: 0, paddingTop: 1 }}>{label}</div>
            <div style={{ fontSize: 13, color: color || T.text, fontFamily: mono ? "monospace" : undefined, flex: 1, wordBreak: "break-word", lineHeight: 1.5 }}>
                {rowLink ? <a href={rowLink} target="_blank" rel="noopener noreferrer" style={{ color: T.blue, textDecoration: "none" }}>{value} <ExternalLink size={10} style={{ verticalAlign: "middle" }} /></a> : value}
                {copyId && <CopyBtn value={String(value)} id={copyId} />}
            </div>
        </div>
    ) : null;

    const tabs = [
        { key: "overview", label: "Overview",   icon: "📋" },
        { key: "ai",       label: "AI Match",   icon: "🧠" },
        { key: "apply",    label: "Apply",      icon: "✍️" },
        { key: "similar",  label: "Similar",    icon: "🔗" },
        { key: "raw",      label: "Raw Data",   icon: "⚙️" },
    ];

    return (
        <>
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 999, animation: "fadeIn 0.15s" }} />
            <div ref={drawerRef} style={{
                position: "fixed", top: 0, right: 0, bottom: 0, width: "min(680px, 100vw)",
                background: "linear-gradient(180deg, #0f1117 0%, #0a0d14 100%)",
                backdropFilter: "blur(32px)",
                borderLeft: `1px solid ${g._sourceColor || T.blue}44`,
                zIndex: 1000, display: "flex", flexDirection: "column",
                animation: "slideInRight 0.28s cubic-bezier(0.22,1,0.36,1)",
                boxShadow: "-32px 0 100px rgba(0,0,0,0.6)",
            }}>
                {/* Color bar */}
                <div style={{ height: 3, background: `linear-gradient(90deg, ${g._sourceColor||T.blue}, ${T.blue}66)`, flexShrink: 0 }} />

                {/* HEADER */}
                <div style={{ padding: "18px 24px 0", flexShrink: 0, background: `linear-gradient(180deg, ${g._sourceColor||T.blue}0d 0%, transparent 100%)` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
                                <Badge color={g._sourceColor||T.blue} style={{ fontSize: 9, fontWeight: 900 }}>{g._source||"Unknown"}</Badge>
                                {g.cfda && <Badge color="#6366f1" style={{ fontSize: 9 }}>CFDA {g.cfda}</Badge>}
                                {(g.awardType||g.type) && <Badge color={T.mute} style={{ fontSize: 9 }}>{g.awardType||g.type}</Badge>}
                                {g.setAside && <Badge color="#0ea5e9" style={{ fontSize: 9 }}>{g.setAside}</Badge>}
                                {g.category && <Badge color="#a855f7" style={{ fontSize: 9 }}>{g.category}</Badge>}
                                {g.status && <Badge color={g.status==="Open"||g.status==="Posted"?T.green:T.mute} style={{ fontSize: 9 }}>● {g.status}</Badge>}
                                {isTracked && <Badge color={T.green} style={{ fontSize: 9 }}>✓ Tracked</Badge>}
                            </div>
                            <h2 style={{ fontSize: 15, fontWeight: 800, color: T.text, margin: 0, lineHeight: 1.4, fontFamily: "Outfit" }}>{g.title}</h2>
                            <div style={{ fontSize: 12, color: T.sub, marginTop: 4, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                {g.agency && <span>{g.agency}</span>}
                                {g.oppNumber && <><span style={{ color: T.glassBorder }}>·</span><span style={{ fontFamily: "monospace", fontSize: 10, color: T.mute }}>#{g.oppNumber}</span><CopyBtn value={g.oppNumber} id="oppnum" /></>}
                            </div>
                        </div>
                        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.07)", border: `1px solid ${T.glassBorder}`, borderRadius: 8, padding: 8, cursor: "pointer", color: T.mute, flexShrink: 0, display: "flex" }}>
                            <X size={15} />
                        </button>
                    </div>

                    {/* Hero stats */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                        <div style={{ background: `${T.green}12`, border: `1px solid ${T.green}2a`, borderRadius: 10, padding: "9px 14px", minWidth: 110 }}>
                            <div style={{ fontSize: 9, color: T.mute, fontWeight: 800, letterSpacing: 1, marginBottom: 2 }}>AWARD</div>
                            <div style={{ fontSize: 18, fontWeight: 900, color: T.green, letterSpacing: "-0.03em" }}>{amtDisplay}</div>
                            {g.amountFloor > 0 && <div style={{ fontSize: 9, color: T.mute }}>min ${g.amountFloor.toLocaleString()}</div>}
                        </div>
                        {g.deadline && (
                            <div style={{ background: `${urgencyColor}12`, border: `1px solid ${urgencyColor}2a`, borderRadius: 10, padding: "9px 14px", minWidth: 90 }}>
                                <div style={{ fontSize: 9, color: T.mute, fontWeight: 800, letterSpacing: 1, marginBottom: 2 }}>DEADLINE</div>
                                <div style={{ fontSize: 13, fontWeight: 800, color: urgencyColor }}>{g.deadline === "Rolling" ? "Rolling" : String(g.deadline).slice(0,10)}</div>
                                {daysLeft !== null && <div style={{ fontSize: 9, color: urgencyColor, fontWeight: 700 }}>{daysLeft > 0 ? `${daysLeft}d left` : "Expired"}</div>}
                            </div>
                        )}
                        {aiAnalysis && (
                            <div style={{ background: `${scoreColor(aiAnalysis.eligibilityScore)}12`, border: `1px solid ${scoreColor(aiAnalysis.eligibilityScore)}2a`, borderRadius: 10, padding: "9px 14px", cursor: "pointer" }} onClick={() => setActiveTab("ai")}>
                                <div style={{ fontSize: 9, color: T.mute, fontWeight: 800, letterSpacing: 1, marginBottom: 2 }}>AI MATCH</div>
                                <div style={{ fontSize: 18, fontWeight: 900, color: scoreColor(aiAnalysis.eligibilityScore) }}>{aiAnalysis.eligibilityScore}%</div>
                                <div style={{ fontSize: 9, color: T.mute }}>{aiAnalysis.verdict}</div>
                            </div>
                        )}
                        {link && (
                            <a href={link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                                <div style={{ background: `${T.blue}12`, border: `1px solid ${T.blue}2a`, borderRadius: 10, padding: "9px 14px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, minWidth: 56 }}>
                                    <ExternalLink size={14} color={T.blue} />
                                    <div style={{ fontSize: 9, color: T.blue, fontWeight: 700 }}>Source</div>
                                </div>
                            </a>
                        )}
                    </div>

                    {/* Tab bar */}
                    <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${T.glassBorder}`, marginLeft: -24, marginRight: -24, paddingLeft: 24 }}>
                        {tabs.map(t => (
                            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                                background: "none", border: "none",
                                borderBottom: activeTab === t.key ? `2px solid ${g._sourceColor||T.blue}` : "2px solid transparent",
                                padding: "7px 12px 9px", cursor: "pointer", fontSize: 11,
                                fontWeight: activeTab === t.key ? 800 : 500,
                                color: activeTab === t.key ? T.text : T.mute,
                                display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap",
                            }}>
                                {t.icon} {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* BODY */}
                <div style={{ flex: 1, overflowY: "auto", padding: "18px 24px" }}>

                    {/* OVERVIEW */}
                    {activeTab === "overview" && (
                        <div style={{ animation: "fadeIn 0.2s" }}>

                            {/* Detail loading indicator */}
                            {detailLoading && (
                                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: `${T.blue}0a`, border: `1px solid ${T.blue}22`, borderRadius: 8, marginBottom: 14, fontSize: 12, color: T.blue }}>
                                    <Loader size={12} style={{ animation: "spin 1s linear infinite" }} />
                                    Fetching full details from {g._source}…
                                </div>
                            )}

                            {/* Description — prefer enriched full description */}
                            {(detail?.fullDescription || g.description || g.synopsis) && (
                                <div style={{ marginBottom: 20 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                        <div style={{ fontSize: 10, color: T.mute, fontWeight: 800, letterSpacing: 1 }}>DESCRIPTION</div>
                                        {detail?._enriched && <span style={{ fontSize: 9, color: T.green, fontWeight: 700, background: `${T.green}15`, padding: "1px 6px", borderRadius: 4 }}>Full detail loaded</span>}
                                    </div>
                                    <p style={{ fontSize: 13, color: T.sub, lineHeight: 1.75, margin: 0, whiteSpace: "pre-wrap" }}>
                                        {detail?.fullDescription || g.description || g.synopsis}
                                    </p>
                                </div>
                            )}

                            {/* Funding Details */}
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: 10, color: T.mute, fontWeight: 800, letterSpacing: 1, marginBottom: 4 }}>FUNDING DETAILS</div>
                                <Row icon={Building2}  label="Agency"            value={g.agency} />
                                <Row icon={DollarSign} label="Award Ceiling"     value={amtDisplay !== "—" ? amtDisplay : null} color={T.green} />
                                {g.amountFloor > 0 && <Row icon={DollarSign} label="Award Floor" value={`$${g.amountFloor.toLocaleString()}`} />}
                                {detail?.obligatedAmount > 0 && <Row icon={DollarSign} label="Obligated" value={`$${detail.obligatedAmount.toLocaleString()}`} color={T.green} />}
                                {detail?.baseExercisedAmount > 0 && <Row icon={DollarSign} label="Base + Options" value={`$${detail.baseExercisedAmount.toLocaleString()}`} />}
                                {detail?.estimatedAwards && <Row icon={Hash} label="Est. Awards" value={String(detail.estimatedAwards)} />}
                                <Row icon={Calendar}   label="Deadline"          value={g.deadline} color={urgencyColor} />
                                {detail?.postDate && <Row icon={Calendar} label="Posted" value={String(detail.postDate).slice(0,10)} />}
                                {detail?.archiveDate && <Row icon={Calendar} label="Archive Date" value={String(detail.archiveDate).slice(0,10)} />}
                                {detail?.periodOfPerformance && <Row icon={Calendar} label="Period of Perf." value={detail.periodOfPerformance} />}
                                <Row icon={Calendar}   label="Award Start"       value={g.awardStart ? String(g.awardStart).slice(0,10) : null} />
                                <Row icon={CheckCircle} label="Status"           value={g.status} color={g.status==="Open"||g.status==="Posted"?T.green:undefined} />
                                <Row icon={Tag}        label="CFDA"              value={g.cfda}      copyId="cfda" />
                                {detail?.cfdaDescription && <Row icon={Tag} label="CFDA Desc." value={detail.cfdaDescription} />}
                                <Row icon={Tag}        label="NAICS"             value={g.naics}     copyId="naics" />
                                <Row icon={Tag}        label="Award Type"        value={g.awardType || g.type || detail?.transType} />
                                {detail?.fundingInstrument && <Row icon={Tag} label="Funding Instrument" value={detail.fundingInstrument} />}
                                {detail?.fundingMechanism && <Row icon={Tag} label="Funding Mechanism" value={detail.fundingMechanism} />}
                                {detail?.fundProgramName && <Row icon={Tag} label="Fund Program" value={detail.fundProgramName} />}
                                {detail?.primaryProgram && <Row icon={Tag} label="Primary Program" value={detail.primaryProgram} />}
                                <Row icon={Shield}     label="Set-Aside"         value={g.setAside} />
                                <Row icon={Tag}        label="Category"          value={g.category} />
                                {detail?.costSharing !== undefined && <Row icon={CheckCircle} label="Cost Sharing" value={detail.costSharing ? "Required" : "Not Required"} color={detail.costSharing ? T.amber : T.mute} />}
                                <Row icon={Hash}       label="Opp Number"        value={g.oppNumber}     mono copyId="opp" />
                                <Row icon={Hash}       label="Bill Number"       value={g.billNumber}    mono />
                                {detail?.solicitation && <Row icon={Hash} label="Solicitation #" value={detail.solicitation} mono copyId="sol" />}
                                {detail?.contractNumber && <Row icon={Hash} label="Contract #" value={detail.contractNumber} mono copyId="contract" />}
                                {detail?.activityCode && <Row icon={Tag} label="Activity Code" value={detail.activityCode} />}
                                {detail?.applicationId && <Row icon={Hash} label="Application ID" value={String(detail.applicationId)} mono />}
                            </div>

                            {/* Recipient & Program */}
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: 10, color: T.mute, fontWeight: 800, letterSpacing: 1, marginBottom: 4 }}>RECIPIENT & PROGRAM</div>
                                <Row icon={Users}     label="PI / Contact"    value={g.pi || g.contactName || detail?.contactName} />
                                {detail?.programOfficer && <Row icon={Users} label="Program Officer" value={detail.programOfficer} />}
                                {detail?.coPIs && <Row icon={Users} label="Co-PIs" value={detail.coPIs} />}
                                <Row icon={Building2} label="Recipient"       value={g.org || g.firm || g.awardeeName} />
                                {detail?.recipientAddress && <Row icon={Building2} label="Recipient Addr." value={detail.recipientAddress} />}
                                {detail?.recipientUEI && <Row icon={Hash} label="UEI" value={detail.recipientUEI} mono copyId="uei" />}
                                {detail?.recipientDUNS && <Row icon={Hash} label="DUNS" value={detail.recipientDUNS} mono />}
                                {(detail?.awardeeCity || detail?.awardeeState) && <Row icon={Building2} label="Awardee Location" value={[detail.awardeeCity, detail.awardeeState].filter(Boolean).join(", ")} />}
                                {(detail?.placeOfPerformance || detail?.perfCity) && <Row icon={Building2} label="Place of Performance" value={detail.placeOfPerformance || [detail.perfCity, detail.perfState].filter(Boolean).join(", ")} />}
                                {detail?.awardingOffice && <Row icon={Building2} label="Awarding Office" value={detail.awardingOffice} />}
                                {detail?.fundingAgency && <Row icon={Building2} label="Funding Agency" value={detail.fundingAgency} />}
                                <Row icon={FileText}  label="Program"         value={g.program} />
                                {detail?.terms && <Row icon={Tag} label="Terms / Keywords" value={detail.terms.replace(/[<>]/g,"").slice(0,200)} />}
                                <Row icon={Hash}      label="EIN"             value={g.ein} mono copyId="ein" />
                                <Row icon={Tag}       label="Sponsor"         value={g.sponsor} />
                            </div>

                            {/* SBIR-specific */}
                            {(detail?.phase || detail?.hubzoneOwned !== undefined) && (
                                <div style={{ marginBottom: 16 }}>
                                    <div style={{ fontSize: 10, color: "#8b5cf6", fontWeight: 800, letterSpacing: 1, marginBottom: 4 }}>SBIR DETAILS</div>
                                    {detail?.phase && <Row icon={Tag} label="Phase" value={detail.phase} />}
                                    {detail?.sbirTopicCode && <Row icon={Hash} label="Topic Code" value={detail.sbirTopicCode} />}
                                    {detail?.hubzoneOwned && <Row icon={Shield} label="HUBZone Owned" value={detail.hubzoneOwned} />}
                                    {detail?.womanOwned && <Row icon={Shield} label="Woman Owned" value={detail.womanOwned} />}
                                    {detail?.veteranOwned && <Row icon={Shield} label="Veteran Owned" value={detail.veteranOwned} />}
                                </div>
                            )}

                            {/* Sub-awards */}
                            {(detail?.subawardCount > 0 || detail?.subawardAmount > 0) && (
                                <div style={{ marginBottom: 16 }}>
                                    <div style={{ fontSize: 10, color: T.mute, fontWeight: 800, letterSpacing: 1, marginBottom: 4 }}>SUB-AWARDS</div>
                                    {detail.subawardCount > 0 && <Row icon={Hash} label="Sub-award Count" value={String(detail.subawardCount)} />}
                                    {detail.subawardAmount > 0 && <Row icon={DollarSign} label="Sub-award Total" value={`$${detail.subawardAmount.toLocaleString()}`} />}
                                </div>
                            )}

                            {/* Executive compensation (USASpending) */}
                            {detail?.executiveCompensation && (
                                <div style={{ marginBottom: 16 }}>
                                    <div style={{ fontSize: 10, color: T.mute, fontWeight: 800, letterSpacing: 1, marginBottom: 4 }}>EXECUTIVE COMPENSATION (top 3)</div>
                                    <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.6 }}>{detail.executiveCompensation}</div>
                                </div>
                            )}

                            {/* Contact info */}
                            {(detail?.contactEmail || detail?.contactPhone) && (
                                <div style={{ marginBottom: 16, padding: 12, background: `${T.blue}08`, borderRadius: 10, border: `1px solid ${T.blue}22` }}>
                                    <div style={{ fontSize: 10, color: T.blue, fontWeight: 800, letterSpacing: 1, marginBottom: 8 }}>📞 CONTACT INFORMATION</div>
                                    {detail.contactName && <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4 }}>{detail.contactName}</div>}
                                    {detail.contactEmail && <a href={`mailto:${detail.contactEmail}`} style={{ display: "block", fontSize: 12, color: T.blue, textDecoration: "none", marginBottom: 3 }}>✉ {detail.contactEmail}</a>}
                                    {detail.contactPhone && <div style={{ fontSize: 12, color: T.sub }}>📞 {detail.contactPhone}</div>}
                                </div>
                            )}

                            {/* Eligible applicants */}
                            {detail?.eligibleApplicants && (
                                <div style={{ marginBottom: 16, padding: 12, background: `${T.green}08`, borderRadius: 10, border: `1px solid ${T.green}22` }}>
                                    <div style={{ fontSize: 10, color: T.green, fontWeight: 800, letterSpacing: 1, marginBottom: 6 }}>✅ ELIGIBLE APPLICANTS</div>
                                    <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.6 }}>{Array.isArray(detail.eligibleApplicants) ? detail.eligibleApplicants.join(", ") : String(detail.eligibleApplicants)}</div>
                                </div>
                            )}

                            {/* Additional information */}
                            {detail?.additionalInfo && (
                                <div style={{ marginBottom: 16 }}>
                                    <div style={{ fontSize: 10, color: T.mute, fontWeight: 800, letterSpacing: 1, marginBottom: 6 }}>ADDITIONAL INFORMATION</div>
                                    {typeof detail.additionalInfo === "string" && detail.additionalInfo.startsWith("http")
                                        ? <a href={detail.additionalInfo} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: T.blue, textDecoration: "none" }}>View additional info ↗</a>
                                        : <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.6 }}>{String(detail.additionalInfo).slice(0, 400)}</div>
                                    }
                                </div>
                            )}

                            {/* Relevant contacts from address book */}
                            {relatedContacts.length > 0 && (
                                <div style={{ marginBottom: 16 }}>
                                    <div style={{ fontSize: 10, color: T.amber, fontWeight: 800, letterSpacing: 1, marginBottom: 8 }}>⚡ RELEVANT CONTACTS IN YOUR NETWORK</div>
                                    {relatedContacts.map(c => (
                                        <div key={c.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "7px 10px", background: `${T.amber}0a`, border: `1px solid ${T.amber}22`, borderRadius: 8, marginBottom: 6 }}>
                                            <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${T.amber}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: T.amber, flexShrink: 0 }}>{(c.name||"?").charAt(0)}</div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{c.name}</div>
                                                <div style={{ fontSize: 10, color: T.mute }}>{c.role} · {c.org}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {link && (
                                <a href={link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                                    <div style={{ padding: "12px 16px", background: `${g._sourceColor||T.blue}10`, border: `1px solid ${g._sourceColor||T.blue}33`, borderRadius: 10, display: "flex", alignItems: "center", gap: 10, color: g._sourceColor||T.blue, fontSize: 13, fontWeight: 700 }}>
                                        <ExternalLink size={14} /> View full details at {g._source || "source"} ↗
                                    </div>
                                </a>
                            )}
                        </div>
                    )}

                    {/* AI MATCH */}
                    {activeTab === "ai" && (
                        <div style={{ animation: "fadeIn 0.2s" }}>
                            {aiLoading ? (
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "48px 0", textAlign: "center" }}>
                                    <div style={{ fontSize: 36, animation: "pulse 2s ease-in-out infinite" }}>🧠</div>
                                    <div style={{ fontSize: 13, color: T.sub, fontWeight: 600 }}>{aiPhase}</div>
                                    <div style={{ width: "100%", height: 3, background: T.glassBorder, borderRadius: 2, overflow: "hidden" }}>
                                        <div style={{ height: "100%", background: `linear-gradient(90deg, ${T.blue}, #818cf8)`, borderRadius: 2, animation: "shimmer 1.8s ease-in-out infinite", backgroundSize: "200% 100%" }} />
                                    </div>
                                </div>
                            ) : aiAnalysis ? (
                                <div>
                                    <div style={{ display: "flex", gap: 18, alignItems: "center", marginBottom: 20, padding: 18, background: "rgba(255,255,255,0.03)", borderRadius: 14, border: `1px solid ${scoreColor(aiAnalysis.eligibilityScore)}22` }}>
                                        <div style={{ position: "relative", width: 80, height: 80, flexShrink: 0 }}>
                                            <svg viewBox="0 0 80 80" style={{ transform: "rotate(-90deg)", width: 80, height: 80 }}>
                                                <circle cx={40} cy={40} r={32} fill="none" stroke={T.glassBorder} strokeWidth={7} />
                                                <circle cx={40} cy={40} r={32} fill="none" stroke={scoreColor(aiAnalysis.eligibilityScore)} strokeWidth={7}
                                                    strokeDasharray={`${(aiAnalysis.eligibilityScore/100)*201} 201`} strokeLinecap="round"
                                                    style={{ filter: `drop-shadow(0 0 5px ${scoreColor(aiAnalysis.eligibilityScore)}88)` }} />
                                            </svg>
                                            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                                                <div style={{ fontSize: 16, fontWeight: 900, color: T.text }}>{aiAnalysis.eligibilityScore}%</div>
                                                <div style={{ fontSize: 8, color: T.mute, fontWeight: 700 }}>MATCH</div>
                                            </div>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 15, fontWeight: 800, color: T.text, marginBottom: 5 }}>{aiAnalysis.verdict}</div>
                                            {aiAnalysis.headline && <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.5, marginBottom: 8 }}>{aiAnalysis.headline}</div>}
                                            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                                                {aiAnalysis.winRate !== undefined && <Badge color={scoreColor(aiAnalysis.winRate)} style={{ fontSize: 9 }}>Win Est: {aiAnalysis.winRate}%</Badge>}
                                                {aiAnalysis.competitionLevel && <Badge color={T.mute} style={{ fontSize: 9 }}>Competition: {aiAnalysis.competitionLevel}</Badge>}
                                                {aiAnalysis.estimatedEffort && <Badge color={T.blue} style={{ fontSize: 9 }}>Effort: {aiAnalysis.estimatedEffort}</Badge>}
                                            </div>
                                        </div>
                                    </div>
                                    {aiAnalysis.keyRequirements?.length > 0 && (
                                        <div style={{ marginBottom: 16, padding: 12, background: `${T.blue}0a`, borderRadius: 10, border: `1px solid ${T.blue}22` }}>
                                            <div style={{ fontSize: 10, color: T.blue, fontWeight: 800, letterSpacing: 1, marginBottom: 8 }}>📋 KEY REQUIREMENTS</div>
                                            {aiAnalysis.keyRequirements.map((r, i) => <div key={i} style={{ display: "flex", gap: 8, padding: "4px 0", fontSize: 12, color: T.sub }}><span style={{ color: T.blue }}>→</span>{r}</div>)}
                                        </div>
                                    )}
                                    {aiAnalysis.strengths?.length > 0 && (
                                        <div style={{ marginBottom: 14 }}>
                                            <div style={{ fontSize: 10, color: T.green, fontWeight: 800, letterSpacing: 1, marginBottom: 7 }}>✅ STRENGTHS</div>
                                            {aiAnalysis.strengths.map((s, i) => <div key={i} style={{ display: "flex", gap: 8, padding: "6px 0", borderBottom: `1px solid ${T.glassBorder}`, alignItems: "flex-start" }}><div style={{ width: 5, height: 5, borderRadius: "50%", background: T.green, flexShrink: 0, marginTop: 5 }} /><div style={{ fontSize: 12, color: T.sub, lineHeight: 1.5 }}>{s}</div></div>)}
                                        </div>
                                    )}
                                    {aiAnalysis.risks?.length > 0 && (
                                        <div style={{ marginBottom: 14 }}>
                                            <div style={{ fontSize: 10, color: T.amber, fontWeight: 800, letterSpacing: 1, marginBottom: 7 }}>⚠️ RISKS & GAPS</div>
                                            {aiAnalysis.risks.map((r, i) => <div key={i} style={{ display: "flex", gap: 8, padding: "6px 0", borderBottom: `1px solid ${T.glassBorder}`, alignItems: "flex-start" }}><div style={{ width: 5, height: 5, borderRadius: "50%", background: T.amber, flexShrink: 0, marginTop: 5 }} /><div style={{ fontSize: 12, color: T.sub, lineHeight: 1.5 }}>{r}</div></div>)}
                                        </div>
                                    )}
                                    {aiAnalysis.nextSteps?.length > 0 && (
                                        <div style={{ marginBottom: 14 }}>
                                            <div style={{ fontSize: 10, color: T.blue, fontWeight: 800, letterSpacing: 1, marginBottom: 7 }}>🚀 NEXT STEPS</div>
                                            {aiAnalysis.nextSteps.map((s, i) => <div key={i} style={{ display: "flex", gap: 8, padding: "6px 0", borderBottom: `1px solid ${T.glassBorder}`, alignItems: "flex-start" }}><div style={{ background: T.blue, color: "#fff", borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900, flexShrink: 0, marginTop: 2 }}>{i+1}</div><div style={{ fontSize: 12, color: T.sub, lineHeight: 1.5 }}>{s}</div></div>)}
                                        </div>
                                    )}
                                    {aiAnalysis.applicationTip && (
                                        <div style={{ padding: 14, background: `${T.amber}0d`, border: `1px solid ${T.amber}33`, borderLeft: `4px solid ${T.amber}`, borderRadius: 10, marginBottom: 14 }}>
                                            <div style={{ fontSize: 10, color: T.amber, fontWeight: 800, letterSpacing: 1, marginBottom: 5 }}>💡 PRO TIP</div>
                                            <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.6 }}>{aiAnalysis.applicationTip}</div>
                                        </div>
                                    )}
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <Btn variant="ghost" size="sm" onClick={runAIAnalysis} style={{ flex: 1 }}>↺ Re-analyze</Btn>
                                        <Btn variant="primary" size="sm" onClick={() => setActiveTab("apply")} style={{ flex: 1 }}>✍️ Draft</Btn>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "44px 0", textAlign: "center" }}>
                                    <div style={{ fontSize: 44 }}>🧠</div>
                                    <div style={{ fontSize: 15, fontWeight: 800, color: T.text }}>AI Eligibility Analysis</div>
                                    <div style={{ fontSize: 12, color: T.sub, maxWidth: 280, lineHeight: 1.6 }}>Score · win probability · strengths · risks · tailored next steps.</div>
                                    <Btn variant="primary" onClick={runAIAnalysis}>Run Analysis →</Btn>
                                </div>
                            )}
                        </div>
                    )}

                    {/* APPLY */}
                    {activeTab === "apply" && (
                        <div style={{ animation: "fadeIn 0.2s" }}>
                            <div style={{ padding: 14, background: "rgba(255,255,255,0.03)", borderRadius: 12, border: `1px solid ${T.glassBorder}`, marginBottom: 14 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: T.text, marginBottom: 10 }}>📋 Application Checklist</div>
                                {[["Read full opportunity announcement (FOA)", !!link],["Verify eligibility requirements",false],["Register on SAM.gov (federal)",false],["Obtain DUNS/UEI number",false],["Prepare project narrative",false],["Budget & budget justification",false],["Letters of support",false],["Submit via portal",false]].map(([label, done], i) => (
                                    <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", padding: "5px 0", borderBottom: i<7?`1px solid ${T.glassBorder}`:"none" }}>
                                        <div style={{ width: 15, height: 15, borderRadius: 3, border: `1.5px solid ${done?T.green:T.mute}`, background: done?T.green:"transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                            {done && <span style={{ fontSize: 8, color: "#000", fontWeight: 900 }}>✓</span>}
                                        </div>
                                        <span style={{ fontSize: 12, color: done?T.green:T.sub }}>{label}</span>
                                    </div>
                                ))}
                            </div>
                            <div style={{ padding: 14, background: "rgba(255,255,255,0.03)", borderRadius: 12, border: `1px solid ${T.glassBorder}`, marginBottom: 14 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: T.text }}>✍️ AI Narrative Draft</div>
                                    <Btn variant="primary" size="sm" onClick={generateDraft} disabled={drafting}>{drafting ? "Writing…" : draftText ? "Regenerate" : "Generate"}</Btn>
                                </div>
                                {drafting && <div style={{ fontSize: 12, color: T.mute, fontStyle: "italic" }}>Writing your narrative opening…</div>}
                                {draftText && !drafting && (
                                    <div>
                                        <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.7, whiteSpace: "pre-wrap", borderTop: `1px solid ${T.glassBorder}`, paddingTop: 10, marginTop: 6 }}>{draftText}</div>
                                        <Btn variant="ghost" size="sm" onClick={() => copy(draftText, "draft")} style={{ marginTop: 8, width: "100%" }}>{copied==="draft"?"✓ Copied":"Copy Draft"}</Btn>
                                    </div>
                                )}
                                {!draftText && !drafting && <div style={{ fontSize: 11, color: T.mute }}>3-paragraph opening tailored to this funder and your org's focus areas.</div>}
                            </div>
                            {link && (
                                <div style={{ padding: 14, background: "rgba(255,255,255,0.03)", borderRadius: 12, border: `1px solid ${T.glassBorder}` }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: T.text, marginBottom: 10 }}>🔗 Links</div>
                                    {[["Official Opportunity", link, T.blue], ["Grants.gov Registration", "https://www.grants.gov/applicants/registration.html", T.mute], ["SAM.gov Registration", "https://sam.gov/content/entity-registration", T.mute]].map(([label, href, color]) => (
                                        <a key={label} href={href} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 7, textDecoration: "none", marginBottom: 6, background: "rgba(255,255,255,0.02)" }}>
                                            <ExternalLink size={12} color={color} /><span style={{ fontSize: 12, color }}>{label}</span>
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* SIMILAR */}
                    {activeTab === "similar" && (
                        <div style={{ animation: "fadeIn 0.2s" }}>
                            <div style={{ fontSize: 10, color: T.mute, fontWeight: 800, letterSpacing: 1, marginBottom: 12 }}>RELATED OPPORTUNITIES</div>
                            {similarLoading ? [1,2,3].map(i => <div key={i} style={{ height: 70, background: "rgba(255,255,255,0.03)", borderRadius: 10, marginBottom: 10, animation: "pulse 1.5s ease-in-out infinite" }} />) :
                                similar.length === 0 ? <div style={{ textAlign: "center", padding: "36px 0", color: T.mute, fontSize: 12 }}>No similar opportunities found.</div> :
                                similar.map(s => {
                                    const sl = s.link||s.url;
                                    return (
                                        <div key={s.id} style={{ padding: "12px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 10, border: `1px solid ${T.glassBorder}`, marginBottom: 8, borderLeft: `3px solid ${s._sourceColor||T.blue}` }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                                                        <Badge color={s._sourceColor||T.blue} style={{ fontSize: 8 }}>{s._source}</Badge>
                                                        {s._score >= 85 && <Badge color={T.amber} style={{ fontSize: 8 }}>⭐{s._score}%</Badge>}
                                                    </div>
                                                    <div style={{ fontSize: 12, fontWeight: 700, color: T.text, lineHeight: 1.3, marginBottom: 3 }}>
                                                        {sl ? <a href={sl} target="_blank" rel="noopener noreferrer" style={{ color: T.text, textDecoration: "none" }}>{s.title}</a> : s.title}
                                                    </div>
                                                    <div style={{ fontSize: 10, color: T.mute }}>{s.agency}</div>
                                                </div>
                                                <div style={{ textAlign: "right", flexShrink: 0 }}>
                                                    <div style={{ fontSize: 13, fontWeight: 800, color: T.green }}>{typeof s.amount==="number"&&s.amount>0?s.amount>=1e6?`$${(s.amount/1e6).toFixed(1)}M`:`$${s.amount.toLocaleString()}`:"—"}</div>
                                                    {s.deadline&&s.deadline!=="Rolling"&&<div style={{ fontSize: 9, color: T.mute }}>{String(s.deadline).slice(0,10)}</div>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            }
                            {similar.length > 0 && <Btn variant="ghost" size="sm" onClick={loadSimilar} style={{ width: "100%", marginTop: 6 }}>↺ Refresh</Btn>}
                        </div>
                    )}

                    {/* RAW DATA */}
                    {activeTab === "raw" && (
                        <div style={{ animation: "fadeIn 0.2s" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                                <div style={{ fontSize: 10, color: T.mute, fontWeight: 800, letterSpacing: 1 }}>ALL FIELDS</div>
                                <Btn variant="ghost" size="sm" onClick={() => copy(JSON.stringify({ ...g, ...(detail||{}) }, null, 2), "json")}>{copied==="json"?"✓ Copied":"Copy JSON"}</Btn>
                            </div>
                            {/* Base grant fields */}
                            {Object.entries(g).filter(([,v]) => v !== null && v !== undefined && v !== "" && v !== 0)
                                .sort(([a],[b]) => a.localeCompare(b))
                                .map(([k, v]) => (
                                    <div key={k} style={{ display: "flex", gap: 10, padding: "6px 0", borderBottom: `1px solid ${T.glassBorder}` }}>
                                        <div style={{ fontSize: 10, color: k.startsWith("_")?T.blue:T.mute, minWidth: 120, flexShrink: 0, fontFamily: "monospace" }}>{k}</div>
                                        <div style={{ fontSize: 11, color: T.sub, flex: 1, wordBreak: "break-all" }}>
                                            {typeof v==="string"&&(v.startsWith("http://")||v.startsWith("https://"))
                                                ?<a href={v} target="_blank" rel="noopener noreferrer" style={{ color: T.blue, textDecoration: "none" }}>{v}</a>
                                                :typeof v==="number"&&k!=="id"&&v>100?`$${v.toLocaleString()} (${v})`
                                                :typeof v==="object"?<span style={{ fontFamily: "monospace", fontSize: 9 }}>{JSON.stringify(v).slice(0,200)}</span>
                                                :String(v).slice(0,400)}
                                        </div>
                                    </div>
                                ))
                            }
                            {/* Enriched detail fields */}
                            {detail && Object.entries(detail).filter(([k,v]) => !k.startsWith("_") && k !== "fullDescription" && v !== null && v !== undefined && v !== "" && v !== 0).length > 0 && (
                                <>
                                    <div style={{ fontSize: 10, color: T.green, fontWeight: 800, letterSpacing: 1, margin: "16px 0 6px" }}>ENRICHED FROM {g._source?.toUpperCase()}</div>
                                    {Object.entries(detail).filter(([k,v]) => !k.startsWith("_") && v !== null && v !== undefined && v !== "" && v !== 0)
                                        .sort(([a],[b]) => a.localeCompare(b))
                                        .map(([k, v]) => (
                                            <div key={`detail_${k}`} style={{ display: "flex", gap: 10, padding: "6px 0", borderBottom: `1px solid ${T.glassBorder}` }}>
                                                <div style={{ fontSize: 10, color: T.green, minWidth: 120, flexShrink: 0, fontFamily: "monospace" }}>{k}</div>
                                                <div style={{ fontSize: 11, color: T.sub, flex: 1, wordBreak: "break-all" }}>
                                                    {typeof v==="string"&&(v.startsWith("http://")||v.startsWith("https://"))
                                                        ?<a href={v} target="_blank" rel="noopener noreferrer" style={{ color: T.blue, textDecoration: "none" }}>{v}</a>
                                                        :typeof v==="number"&&v>100?`$${v.toLocaleString()}`
                                                        :typeof v==="boolean"?String(v)
                                                        :String(v).slice(0,400)}
                                                </div>
                                            </div>
                                        ))
                                    }
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <div style={{ padding: "12px 24px", borderTop: `1px solid ${T.glassBorder}`, flexShrink: 0, display: "flex", gap: 7, background: "rgba(0,0,0,0.2)" }}>
                    {link && <a href={link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}><Btn variant="ghost" size="sm" style={{ display: "flex", alignItems: "center", gap: 4 }}><ExternalLink size={11} /> Open</Btn></a>}
                    <Btn variant="ghost" size="sm" onClick={() => setActiveTab("ai")} style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ fontSize: 11 }}>🧠</span> AI</Btn>
                    <Btn variant="ghost" size="sm" onClick={() => setActiveTab("apply")} style={{ display: "flex", alignItems: "center", gap: 4 }}><FileText size={11} /> Apply</Btn>
                    <Btn variant={isTracked?"ghost":"primary"} size="sm" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }} onClick={() => !isTracked && onAdd(g)} disabled={isTracked}>
                        {isTracked ? "✓ Tracked" : <><Bookmark size={11} /> Track</>}
                    </Btn>
                </div>
            </div>
            <style>{`
                @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
            `}</style>
        </>
    );
};
