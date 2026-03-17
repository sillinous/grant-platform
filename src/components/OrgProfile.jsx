import React, { useState } from 'react';
import { T, PROFILE, saveProfile, toast, uid } from '../globals';
import { Card, Btn, Input, TextArea, Badge, Progress } from '../ui';
import { useStore } from '../store';
import { CheckCircle, AlertCircle, Plus, X } from 'lucide-react';

const FOCUS_SUGGESTIONS = [
    "Rural Development","Education","Technology Access","Workforce Development",
    "Health Equity","Affordable Housing","Economic Development","Climate Resilience",
    "Arts & Culture","Food Security","Criminal Justice Reform","STEM","Mental Health",
    "Small Business","Veterans","Youth Services","Disability Services","Immigration",
];

const ORG_TYPES = [
    "Non-Profit 501(c)(3)","Non-Profit 501(c)(4)","LLC","S-Corp","C-Corp",
    "Government Entity","Tribal Organization","Cooperative","Fiscal Sponsor","Individual",
];

const NAICS_COMMON = [
    { code: "611710", label: "Educational Support Services" },
    { code: "624190", label: "Other Individual & Family Services" },
    { code: "621999", label: "All Other Health Services" },
    { code: "923120", label: "Administration of Public Health Programs" },
    { code: "541512", label: "Computer Systems Design Services" },
    { code: "813110", label: "Religious Organizations" },
    { code: "813212", label: "Voluntary Health Orgs" },
    { code: "813319", label: "Other Social Advocacy Orgs" },
    { code: "921190", label: "Other General Government Support" },
    { code: "722320", label: "Caterers (Food Programs)" },
];

const completeness = (p) => {
    const fields = [
        p.name, p.loc, p.ein, p.type,
        p.focus?.length > 0,
        p.tags?.length > 0,
        p.naics,
        p.mission,
        p.website,
        p.impactMetrics?.jobsCreated,
    ];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
};

export const OrgProfile = () => {
    const [profile, setProfile] = useState({ ...PROFILE });
    const [saved, setSaved] = useState(false);
    const [newFocus, setNewFocus] = useState("");
    const [newTag, setNewTag] = useState("");
    const [activeSection, setActiveSection] = useState("identity");
    const { alliances = [] } = useStore();

    const update = (field, value) => setProfile(prev => ({ ...prev, [field]: value }));
    const updateNested = (parent, field, value) =>
        setProfile(prev => ({ ...prev, [parent]: { ...(prev[parent] || {}), [field]: value } }));

    const addFocus = (f) => {
        if (!f.trim() || profile.focus?.includes(f.trim())) return;
        update("focus", [...(profile.focus || []), f.trim()]);
        setNewFocus("");
    };
    const removeFocus = (f) => update("focus", (profile.focus || []).filter(x => x !== f));

    const addTag = (t) => {
        const clean = t.trim().toLowerCase().replace(/\s+/g, "-");
        if (!clean || profile.tags?.includes(clean)) return;
        update("tags", [...(profile.tags || []), clean]);
        setNewTag("");
    };
    const removeTag = (t) => update("tags", (profile.tags || []).filter(x => x !== t));

    const handleSave = () => {
        // Auto-generate demographic tags
        const autoTags = [];
        if (profile.rural) autoTags.push("rural");
        if (profile.veteran) autoTags.push("veteran");
        if (profile.womanOwned) autoTags.push("woman-owned");
        if (profile.minority) autoTags.push("minority");
        if (profile.disabled) autoTags.push("disabled");
        if (profile.poverty) autoTags.push("below-poverty", "economically-disadvantaged");
        if (profile.loc) {
            const state = profile.loc.split(",").pop()?.trim().toLowerCase().replace(/\s+/g, "-");
            if (state) autoTags.push(state);
        }
        const manualTags = (profile.tags || []).filter(t => !autoTags.includes(t));
        const merged = { ...profile, tags: [...new Set([...autoTags, ...manualTags])] };
        saveProfile(merged);
        setProfile({ ...merged });
        setSaved(true);
        toast("✅ Organization profile saved — all AI features updated");
        setTimeout(() => setSaved(false), 3000);
    };

    const score = completeness(profile);
    const scoreColor = score >= 80 ? T.green : score >= 50 ? T.amber : T.red;

    const SECTIONS = [
        { id: "identity", label: "Identity", icon: "🏢" },
        { id: "focus", label: "Focus & Tags", icon: "🎯" },
        { id: "compliance", label: "Compliance", icon: "✅" },
        { id: "impact", label: "Impact", icon: "📈" },
        { id: "narratives", label: "Narratives", icon: "📝" },
    ];

    const Field = ({ label, children, required }) => (
        <div>
            <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: T.mute, letterSpacing: 0.8, marginBottom: 5 }}>
                {label.toUpperCase()}{required && <span style={{ color: T.red, marginLeft: 3 }}>*</span>}
            </label>
            {children}
        </div>
    );

    const Check = ({ field, label, nested }) => {
        const val = nested ? profile[nested]?.[field] : profile[field];
        return (
            <div onClick={() => nested ? updateNested(nested, field, !val) : update(field, !val)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, cursor: "pointer", background: val ? `${T.green}0d` : "rgba(255,255,255,0.02)", border: `1px solid ${val ? T.green + "33" : T.glassBorder}`, transition: "all 0.15s" }}>
                <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${val ? T.green : T.mute}`, background: val ? T.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
                    {val && <span style={{ fontSize: 9, color: "#000", fontWeight: 900 }}>✓</span>}
                </div>
                <span style={{ fontSize: 13, color: val ? T.text : T.sub }}>{label}</span>
            </div>
        );
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 40 }}>

            {/* ── Header ── */}
            <div style={{ background: `linear-gradient(135deg, ${T.panel}, ${T.bg})`, border: `1px solid ${T.border}`, borderRadius: 16, padding: "24px 28px", display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{ width: 72, height: 72, borderRadius: 18, background: `linear-gradient(135deg, ${T.blue}, ${T.indigo || T.blue})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, boxShadow: `0 8px 24px ${T.blue}44`, flexShrink: 0 }}>
                    🏢
                </div>
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: 24, fontWeight: 900, color: T.text, margin: "0 0 6px", fontFamily: "Outfit", letterSpacing: "-0.03em" }}>
                        {profile.name || "Your Organization"}
                    </h1>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        <span style={{ fontSize: 12, color: T.sub }}>{profile.type || "Organization"}</span>
                        {profile.loc && <><span style={{ color: T.glassBorder }}>·</span><span style={{ fontSize: 12, color: T.sub }}>📍 {profile.loc}</span></>}
                        {profile.ein && <><span style={{ color: T.glassBorder }}>·</span><span style={{ fontSize: 12, color: T.mute, fontFamily: "monospace" }}>EIN {profile.ein}</span></>}
                    </div>
                </div>
                {/* Completeness ring */}
                <div style={{ textAlign: "center", flexShrink: 0 }}>
                    <div style={{ position: "relative", width: 64, height: 64 }}>
                        <svg viewBox="0 0 64 64" style={{ transform: "rotate(-90deg)", width: 64, height: 64 }}>
                            <circle cx={32} cy={32} r={26} fill="none" stroke={T.glassBorder} strokeWidth={6} />
                            <circle cx={32} cy={32} r={26} fill="none" stroke={scoreColor} strokeWidth={6}
                                strokeDasharray={`${(score / 100) * 163} 163`} strokeLinecap="round" style={{ transition: "stroke-dasharray 0.6s" }} />
                        </svg>
                        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                            <div style={{ fontSize: 14, fontWeight: 900, color: T.text }}>{score}%</div>
                        </div>
                    </div>
                    <div style={{ fontSize: 9, color: T.mute, fontWeight: 700, marginTop: 2 }}>COMPLETE</div>
                </div>
            </div>

            {/* ── Section nav + content ── */}
            <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                {/* Section pills */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0, width: 160 }}>
                    {SECTIONS.map(s => (
                        <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
                            background: activeSection === s.id ? `${T.blue}18` : "transparent",
                            border: `1px solid ${activeSection === s.id ? T.blue + "44" : "transparent"}`,
                            borderRadius: 10, padding: "9px 14px", cursor: "pointer", textAlign: "left",
                            fontSize: 13, fontWeight: activeSection === s.id ? 700 : 400,
                            color: activeSection === s.id ? T.blue : T.sub,
                            display: "flex", alignItems: "center", gap: 8,
                        }}>
                            <span>{s.icon}</span> {s.label}
                        </button>
                    ))}
                    <div style={{ marginTop: 12 }}>
                        <Btn variant="primary" onClick={handleSave} style={{ width: "100%" }}>
                            {saved ? "✅ Saved!" : "💾 Save Profile"}
                        </Btn>
                    </div>
                </div>

                {/* Section content */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>

                    {/* ── IDENTITY ── */}
                    {activeSection === "identity" && (
                        <Card>
                            <div style={{ fontSize: 11, color: T.mute, fontWeight: 800, letterSpacing: 1, marginBottom: 16 }}>ORGANIZATION IDENTITY</div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                                <Field label="Organization Name" required>
                                    <Input value={profile.name || ""} onChange={v => update("name", v)} placeholder="e.g. New Horizon Center" />
                                </Field>
                                <Field label="Organization Type" required>
                                    <select value={profile.type || ""} onChange={e => update("type", e.target.value)}
                                        style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${T.glassBorder}`, background: T.glassLg, color: T.text, fontSize: 13, outline: "none" }}>
                                        <option value="">Select type…</option>
                                        {ORG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </Field>
                                <Field label="Location (City, State)" required>
                                    <Input value={profile.loc || ""} onChange={v => update("loc", v)} placeholder="Chicago, IL" />
                                </Field>
                                <Field label="ZIP Code">
                                    <Input value={profile.zip || ""} onChange={v => update("zip", v)} placeholder="60614" />
                                </Field>
                                <Field label="EIN / Tax ID">
                                    <Input value={profile.ein || ""} onChange={v => update("ein", v)} placeholder="12-3456789" />
                                </Field>
                                <Field label="UEI (SAM.gov)">
                                    <Input value={profile.uei || ""} onChange={v => update("uei", v)} placeholder="e.g. ABCD1234EFGH" />
                                </Field>
                                <Field label="NAICS Code">
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <Input value={profile.naics || ""} onChange={v => update("naics", v)} placeholder="e.g. 624190" style={{ flex: 1 }} />
                                        <select onChange={e => { if (e.target.value) update("naics", e.target.value); }}
                                            style={{ width: 140, padding: "8px 8px", borderRadius: 8, border: `1px solid ${T.glassBorder}`, background: T.glassLg, color: T.mute, fontSize: 11, outline: "none" }}>
                                            <option value="">Common codes…</option>
                                            {NAICS_COMMON.map(n => <option key={n.code} value={n.code}>{n.code} — {n.label}</option>)}
                                        </select>
                                    </div>
                                </Field>
                                <Field label="Annual Revenue ($)">
                                    <Input value={profile.revenue || ""} onChange={v => update("revenue", parseInt(v) || "")} placeholder="e.g. 500000" type="number" />
                                </Field>
                                <Field label="Website">
                                    <Input value={profile.website || ""} onChange={v => update("website", v)} placeholder="https://yourorg.org" />
                                </Field>
                                <Field label="Founded Year">
                                    <Input value={profile.founded || ""} onChange={v => update("founded", v)} placeholder="e.g. 2012" />
                                </Field>
                            </div>

                            <div style={{ marginTop: 16 }}>
                                <Field label="Mission Statement">
                                    <TextArea value={profile.mission || ""} onChange={v => update("mission", v)} rows={3} placeholder="Describe your organization's mission in 2-3 sentences. This is used for AI grant matching and narrative drafts." />
                                </Field>
                            </div>
                        </Card>
                    )}

                    {/* ── FOCUS & TAGS ── */}
                    {activeSection === "focus" && (
                        <Card>
                            <div style={{ fontSize: 11, color: T.mute, fontWeight: 800, letterSpacing: 1, marginBottom: 16 }}>FOCUS AREAS & TAGS</div>
                            <div style={{ marginBottom: 20 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 8 }}>Strategic Focus Areas <span style={{ color: T.mute, fontWeight: 400 }}>(drives grant matching)</span></div>
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                                    {(profile.focus || []).map(f => (
                                        <span key={f} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 20, background: `${T.blue}18`, border: `1px solid ${T.blue}33`, fontSize: 12, fontWeight: 600, color: T.blue }}>
                                            {f}
                                            <button onClick={() => removeFocus(f)} style={{ background: "none", border: "none", cursor: "pointer", color: T.blue, padding: 0, fontSize: 12, lineHeight: 1 }}>×</button>
                                        </span>
                                    ))}
                                    {(profile.focus || []).length === 0 && <span style={{ fontSize: 12, color: T.mute }}>No focus areas yet — add below</span>}
                                </div>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <Input value={newFocus} onChange={v => setNewFocus(v)} placeholder="Add focus area…"
                                        onKeyDown={e => e.key === "Enter" && addFocus(newFocus)} style={{ flex: 1 }} />
                                    <Btn variant="ghost" size="sm" onClick={() => addFocus(newFocus)}>Add</Btn>
                                </div>
                                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 10 }}>
                                    <span style={{ fontSize: 10, color: T.mute, fontWeight: 700, alignSelf: "center" }}>Suggestions:</span>
                                    {FOCUS_SUGGESTIONS.filter(f => !(profile.focus || []).includes(f)).slice(0, 10).map(f => (
                                        <button key={f} onClick={() => addFocus(f)}
                                            style={{ padding: "2px 9px", borderRadius: 14, fontSize: 11, cursor: "pointer", background: "rgba(255,255,255,0.04)", border: `1px solid ${T.glassBorder}`, color: T.sub, transition: "all 0.15s" }}
                                            onMouseEnter={e => { e.currentTarget.style.background = `${T.blue}18`; e.currentTarget.style.color = T.blue; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = T.sub; }}>
                                            + {f}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 8 }}>Tags <span style={{ color: T.mute, fontWeight: 400 }}>(AI matching, eligibility filters)</span></div>
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                                    {(profile.tags || []).map(t => (
                                        <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 14, background: "rgba(255,255,255,0.06)", border: `1px solid ${T.glassBorder}`, fontSize: 11, fontWeight: 600, color: T.sub }}>
                                            {t}
                                            <button onClick={() => removeTag(t)} style={{ background: "none", border: "none", cursor: "pointer", color: T.mute, padding: 0, fontSize: 12 }}>×</button>
                                        </span>
                                    ))}
                                    {(profile.tags || []).length === 0 && <span style={{ fontSize: 12, color: T.mute }}>No tags yet</span>}
                                </div>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <Input value={newTag} onChange={v => setNewTag(v)} placeholder="Add tag…"
                                        onKeyDown={e => e.key === "Enter" && addTag(newTag)} style={{ flex: 1 }} />
                                    <Btn variant="ghost" size="sm" onClick={() => addTag(newTag)}>Add</Btn>
                                </div>
                                <div style={{ fontSize: 11, color: T.mute, marginTop: 8 }}>
                                    Tags like "rural", "veteran", "woman-owned" are auto-generated from demographics in the Compliance section.
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* ── COMPLIANCE ── */}
                    {activeSection === "compliance" && (
                        <Card>
                            <div style={{ fontSize: 11, color: T.mute, fontWeight: 800, letterSpacing: 1, marginBottom: 16 }}>COMPLIANCE & DEMOGRAPHICS</div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                                <Check field="rural" label="Rural Organization" />
                                <Check field="veteran" label="Veteran-Owned" />
                                <Check field="womanOwned" label="Woman-Owned" />
                                <Check field="minority" label="Minority-Owned / MWBE" />
                                <Check field="disabled" label="Disability-Owned" />
                                <Check field="poverty" label="Economically Disadvantaged" />
                                <Check field="hubzone" label="HUBZone Certified" />
                                <Check field="sbaSmall" label="SBA Small Business" />
                                <Check field="selfEmployed" label="Self-Employed / Sole Proprietor" />
                                <Check field="tribalAffiliation" label="Tribal Affiliation" />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                                <Field label="SAM.gov Registration Status">
                                    <select value={profile.samStatus || ""} onChange={e => update("samStatus", e.target.value)}
                                        style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${T.glassBorder}`, background: T.glassLg, color: T.text, fontSize: 13, outline: "none" }}>
                                        <option value="">Unknown</option>
                                        <option value="active">Active</option>
                                        <option value="expired">Expired</option>
                                        <option value="not-registered">Not Registered</option>
                                    </select>
                                </Field>
                                <Field label="Fiscal Year End">
                                    <Input value={profile.fyEnd || ""} onChange={v => update("fyEnd", v)} placeholder="e.g. December 31" />
                                </Field>
                                <Field label="Indirect Cost Rate">
                                    <Input value={profile.indirectRate || ""} onChange={v => update("indirectRate", v)} placeholder="e.g. 10% De Minimis" />
                                </Field>
                                <Field label="Last Audit Year">
                                    <Input value={profile.lastAudit || ""} onChange={v => update("lastAudit", v)} placeholder="e.g. 2024 (Clean)" />
                                </Field>
                            </div>
                        </Card>
                    )}

                    {/* ── IMPACT ── */}
                    {activeSection === "impact" && (
                        <Card>
                            <div style={{ fontSize: 11, color: T.mute, fontWeight: 800, letterSpacing: 1, marginBottom: 16 }}>IMPACT METRICS</div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                                <Field label="Jobs Created / Retained">
                                    <Input value={profile.impactMetrics?.jobsCreated || ""} onChange={v => updateNested("impactMetrics", "jobsCreated", parseInt(v) || "")} placeholder="e.g. 1250" type="number" />
                                </Field>
                                <Field label="People Served Annually">
                                    <Input value={profile.impactMetrics?.peopleServed || ""} onChange={v => updateNested("impactMetrics", "peopleServed", parseInt(v) || "")} placeholder="e.g. 5000" type="number" />
                                </Field>
                                <Field label="Primary Demographic Focus">
                                    <Input value={profile.impactMetrics?.demographicFocus || ""} onChange={v => updateNested("impactMetrics", "demographicFocus", v)} placeholder="e.g. Rural Low-Income Youth" />
                                </Field>
                                <Field label="Geographic Service Area">
                                    <Input value={profile.impactMetrics?.serviceArea || ""} onChange={v => updateNested("impactMetrics", "serviceArea", v)} placeholder="e.g. 5-county rural region" />
                                </Field>
                                <Field label="Annual Budget ($)">
                                    <Input value={profile.impactMetrics?.annualBudget || ""} onChange={v => updateNested("impactMetrics", "annualBudget", parseInt(v) || "")} placeholder="e.g. 2000000" type="number" />
                                </Field>
                                <Field label="Years in Operation">
                                    <Input value={profile.impactMetrics?.yearsOp || ""} onChange={v => updateNested("impactMetrics", "yearsOp", v)} placeholder="e.g. 12" type="number" />
                                </Field>
                            </div>
                            <div style={{ marginTop: 14 }}>
                                <Field label="Key Program Description">
                                    <TextArea value={profile.impactMetrics?.programDesc || ""} onChange={v => updateNested("impactMetrics", "programDesc", v)} rows={3} placeholder="Describe your flagship program and its measurable outcomes…" />
                                </Field>
                            </div>
                        </Card>
                    )}

                    {/* ── NARRATIVES ── */}
                    {activeSection === "narratives" && (
                        <Card>
                            <div style={{ fontSize: 11, color: T.mute, fontWeight: 800, letterSpacing: 1, marginBottom: 16 }}>STANDING NARRATIVES</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                {[
                                    { key: "founder", label: "Founder / Origin Story", hint: "Why was the organization founded? What problem does it address?" },
                                    { key: "need", label: "Statement of Need", hint: "What is the documented community need? Include data points if possible." },
                                    { key: "impact", label: "Impact Statement", hint: "What outcomes has your organization achieved? Be specific and measurable." },
                                    { key: "capacity", label: "Organizational Capacity", hint: "Describe your team, facilities, and infrastructure to execute grants." },
                                    { key: "sustainability", label: "Sustainability Plan", hint: "How will programs continue after grant funding ends?" },
                                ].map(({ key, label, hint }) => (
                                    <div key={key}>
                                        <Field label={label}>
                                            <TextArea value={profile.narratives?.[key] || ""} onChange={v => updateNested("narratives", key, v)} rows={4} placeholder={hint} />
                                        </Field>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Save button at bottom */}
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                        <Btn variant="primary" onClick={handleSave} style={{ minWidth: 140 }}>
                            {saved ? "✅ Profile Saved!" : "💾 Save All Changes"}
                        </Btn>
                    </div>
                </div>
            </div>
        </div>
    );
};
