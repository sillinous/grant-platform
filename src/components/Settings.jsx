import React, { useState, useEffect } from 'react';
import { T, LS, PROFILE, saveProfile, DEFAULT_PROFILE } from '../globals';
import { Card, Btn, Input, TextArea, Select, Badge, Empty, Modal, MagicBtn } from '../ui';
import { API } from '../api';
import { AI_PROVIDERS as AI_PROVIDERS_LIST, getActiveProvider, getProviderKey as getProviderKeyFn } from '../ai-config';
import { NarrativeWizard } from './NarrativeWizard';

export const Settings = ({ showToast }) => {
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState("profile");

  // Profile state — editable copy
  const [profile, setProfile] = useState({ ...PROFILE });
  const [loading, setLoading] = useState(false);
  const [showAddBiz, setShowAddBiz] = useState(false);
  const [newBiz, setNewBiz] = useState({ n: "", d: "", st: "active", sec: "", monthly: 0 });
  const [newTag, setNewTag] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);
  const [showWizard, setShowWizard] = useState(false);

  // AI State
  const [aiProvider, setAiProvider] = useState(() => LS.get("ai_provider", ""));
  const [activeModel, setActiveModel] = useState(() => LS.get("ai_model", ""));
  const [providerKeys, setProviderKeys] = useState(() => {
    const keys = {};
    Object.keys(AI_PROVIDERS_LIST).forEach(id => {
      keys[id] = LS.get(AI_PROVIDERS_LIST[id].lsKey, "");
    });
    return keys;
  });
  const [testResult, setTestResult] = useState({ status: "", message: "" });
  const activeProvider = aiProvider ? AI_PROVIDERS_LIST[aiProvider] : getActiveProvider();

  const updateProfile = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const updateNarrative = (field, value) => {
    setProfile(prev => ({ ...prev, narratives: { ...prev.narratives, [field]: value } }));
  };

  const handleMagicDraft = async (type) => {
    setLoading(true);
    const draft = await API.generateMagicDraft(`${type} story/narrative`, { profile }, "Write in third person, professional and compelling.");
    updateNarrative(type, draft);
    setLoading(false);
  };

  const addTag = () => {
    if (!newTag.trim() || profile.tags.includes(newTag.trim())) return;
    setProfile(prev => ({ ...prev, tags: [...prev.tags, newTag.trim().toLowerCase().replace(/\s+/g, "-")] }));
    setNewTag("");
  };

  const removeTag = (tag) => {
    setProfile(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const addBusiness = () => {
    if (!newBiz.n) return;
    setProfile(prev => ({ ...prev, businesses: [...prev.businesses, { ...newBiz }] }));
    setNewBiz({ n: "", d: "", st: "active", sec: "", monthly: 0 });
    setShowAddBiz(false);
  };

  const updateBusiness = (idx, updates) => {
    setProfile(prev => ({
      ...prev, businesses: prev.businesses.map((b, i) => i === idx ? { ...b, ...updates } : b),
    }));
  };

  const generateBusinessDescription = async (idx) => {
    setLoading(true);
    const b = profile.businesses[idx];
    const sys = "You are a Business Consultant and Grant Writer. Draft a concise, high-impact description for a grant-seeking organization.";
    const content = `Business Name: ${b.n}\nSector: ${b.sec}\nMonthly Revenue: ${b.monthly}\nOther Context: ${profile.name} (Owner), ${profile.loc} (Location).\n\nTask: Write a professional 1-sentence description that explains what this business does and its value proposition.`;
    const res = await API.callAI([{ role: "user", content }], sys);
    if (!res.error) {
      updateBusiness(idx, { d: res.text });
    } else {
      alert(`AI Assist failed: ${res.error}`);
    }
    setLoading(false);
  };

  const removeBusiness = (idx) => {
    setProfile(prev => ({ ...prev, businesses: prev.businesses.filter((_, i) => i !== idx) }));
  };

  const saveProfileData = () => {
    // Auto-generate tags from demographics
    const autoTags = [];
    if (profile.disabled) autoTags.push("disabled");
    if (profile.poverty) autoTags.push("below-poverty", "economically-disadvantaged");
    if (profile.rural) autoTags.push("rural");
    if (profile.selfEmployed) autoTags.push("self-employed");
    if (profile.loc) {
      const state = profile.loc.split(",").pop()?.trim().toLowerCase();
      if (state) autoTags.push(`${state}-resident`);
    }
    // Merge auto-tags with manual tags (no duplicates)
    const manualTags = profile.tags.filter(t => !autoTags.includes(t));
    const merged = { ...profile, tags: [...new Set([...autoTags, ...manualTags])] };

    saveProfile(merged);
    setProfile({ ...PROFILE }); // Re-read from updated global
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const clearData = () => {
    if (confirm("⚠️ This will delete ALL your grant data, documents, contacts, and settings. Are you sure?")) {
      const keys = ["grants", "vault_docs", "contacts", "events", "runway", "tasks", "section_library",
        "budgets", "peers", "saved_funders", "match_alerts", "watch_terms", "match_analyses",
        "score_history", "collab_notes", "activity_log", "sam_checklist", "anthropic_key", "profile"];
      keys.forEach(k => LS.del(k));
      showToast && showToast("All data cleared. Reloading...", "success");
      setTimeout(() => location.reload(), 1000);
    }
  };

  const importData = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);

          // B5: Validate import data schema
          const warnings = [];
          if (data.grants && Array.isArray(data.grants)) {
            const invalid = data.grants.filter(g => !g.id || !g.title);
            if (invalid.length) warnings.push(`${invalid.length} grant(s) missing required fields (id, title)`);
            // Auto-fix: ensure IDs exist
            data.grants = data.grants.map(g => ({ ...g, id: g.id || `import_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` }));
          }
          if (data.contacts && Array.isArray(data.contacts)) {
            const invalid = data.contacts.filter(c => !c.id || !c.name);
            if (invalid.length) warnings.push(`${invalid.length} contact(s) missing required fields (id, name)`);
            data.contacts = data.contacts.map(c => ({ ...c, id: c.id || `contact_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` }));
          }
          if (data.vault_docs && !Array.isArray(data.vault_docs)) warnings.push("vault_docs should be an array");
          if (data.events && !Array.isArray(data.events)) warnings.push("events should be an array");

          if (warnings.length > 0) {
            const proceed = confirm(`⚠️ Import Validation:\n${warnings.map(w => `• ${w}`).join("\n")}\n\nProceed anyway? (Missing IDs will be auto-generated)`);
            if (!proceed) return;
          }

          const shouldMerge = confirm("Do you want to MERGE with existing data?\n• OK = Merge (Keep existing data)\n• Cancel = Replace (Wipe & Overwrite)");

          if (!shouldMerge) {
            // Replace Mode
            if (data.grants) LS.set("grants", data.grants);
            if (data.vault_docs || data.documents) LS.set("vault_docs", data.vault_docs || data.documents);
            if (data.contacts) LS.set("contacts", data.contacts);
            if (data.events) LS.set("events", data.events);
            if (data.tasks) LS.set("tasks", data.tasks);
            if (data.section_library || data.sections) LS.set("section_library", data.section_library || data.sections);
            if (data.budgets) LS.set("budgets", data.budgets);
            if (data.peers) LS.set("peers", data.peers);
            if (data.profile) saveProfile(data.profile);
          } else {
            // Merge Mode
            if (data.grants) {
              const existing = LS.get("grants", []);
              const merged = [...existing, ...data.grants].filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
              LS.set("grants", merged);
            }
            if (data.vault_docs || data.documents) {
              const incoming = data.vault_docs || data.documents;
              const existing = LS.get("vault_docs", []);
              LS.set("vault_docs", [...existing, ...incoming]);
            }
            // Simple merges for lists map-like objects would require deep merge but lists are common here
            if (data.contacts) LS.set("contacts", [...LS.get("contacts", []), ...data.contacts]);
            if (data.events) LS.set("events", [...LS.get("events", []), ...data.events]);
            if (data.tasks) LS.set("tasks", { ...LS.get("tasks", {}), ...data.tasks }); // Tasks are obj keyed by ID
            if (data.section_library) LS.set("section_library", { ...LS.get("section_library", {}), ...data.section_library });
            if (data.budgets) LS.set("budgets", { ...LS.get("budgets", {}), ...data.budgets });
          }

          showToast && showToast("Data imported successfully! Reloading...", "success");
          setTimeout(() => location.reload(), 1500);
        } catch { showToast && showToast("Failed to parse import file", "error"); }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const isNewUser = !PROFILE.name;

  const SUGGESTED_TAGS = [
    "tech-entrepreneur", "ai-technology", "multiple-ventures", "veteran", "minority-owned",
    "woman-owned", "lgbtq-owned", "first-generation", "immigrant", "hbcu-affiliated",
    "tribal-community", "hub-zone", "8a-certified", "workforce-development", "stem-education",
    "agriculture", "aquaculture", "manufacturing", "healthcare", "clean-energy",
    "social-enterprise", "nonprofit", "community-development", "youth-services",
  ];

  const BIZ_SECTORS = [
    "AI/Automation", "E-commerce", "Music/Entertainment", "AI/SaaS", "MarTech", "SaaS",
    "AgTech", "FinTech", "EdTech", "HealthTech", "CleanTech", "Manufacturing",
    "Consulting", "Nonprofit", "Food/Beverage", "Real Estate", "Media", "Other",
  ];

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {[
          { id: "profile", label: "👤 Profile" },
          { id: "businesses", label: "🏢 Businesses" },
          { id: "narratives", label: "📝 Narratives" },
          { id: "ai", label: "🔑 AI Config" },
          { id: "data", label: "💾 Data" },
        ].map(t => (
          <Btn key={t.id} variant={tab === t.id ? "primary" : "ghost"} size="sm" onClick={() => setTab(t.id)}>{t.label}</Btn>
        ))}
      </div>

      {/* New User Welcome */}
      {isNewUser && tab === "profile" && (
        <Card style={{ marginBottom: 16, borderColor: T.amber + "44" }} glow>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.amber, marginBottom: 8 }}>👋 Welcome to UNLESS!</div>
          <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.6 }}>
            Set up your profile below. This information is used across the platform to match you with grants, generate narratives, and provide personalized recommendations. All data stays in your browser — nothing is sent to any server.
          </div>
        </Card>
      )}

      {/* ─── PROFILE TAB ─── */}
      {tab === "profile" && (
        <div>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 12 }}>👤 Personal Information</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 10, color: T.mute, display: "block", marginBottom: 4 }}>Full Name *</label>
                <Input value={profile.name} onChange={v => updateProfile("name", v)} placeholder="Your full name" />
              </div>
              <div>
                <label style={{ fontSize: 10, color: T.mute, display: "block", marginBottom: 4 }}>Location *</label>
                <Input value={profile.loc} onChange={v => updateProfile("loc", v)} placeholder="City, State (e.g., Newton, Illinois)" />
              </div>
            </div>

            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Demographics & Eligibility</div>
            <div style={{ fontSize: 11, color: T.mute, marginBottom: 8 }}>These help match you with grants targeting specific populations. Check all that apply.</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 6 }}>
              {[
                { key: "rural", label: "Rural Community (pop. <50,000)", icon: "🌾" },
                { key: "disabled", label: "Person with Disability", icon: "♿" },
                { key: "poverty", label: "Below Poverty Line", icon: "📉" },
                { key: "selfEmployed", label: "Self-Employed / Sole Proprietor", icon: "💼" },
              ].map(d => (
                <div key={d.key} onClick={() => updateProfile(d.key, !profile[d.key])} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 6, cursor: "pointer",
                  background: profile[d.key] ? T.green + "10" : T.panel, border: `1px solid ${profile[d.key] ? T.green + "44" : T.border}`,
                }}>
                  <span style={{ fontSize: 16, color: profile[d.key] ? T.green : T.mute }}>{profile[d.key] ? "☑" : "☐"}</span>
                  <span style={{ fontSize: 12, color: profile[d.key] ? T.text : T.sub }}>{d.icon} {d.label}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 8 }}>🏷️ Profile Tags</div>
            <div style={{ fontSize: 11, color: T.mute, marginBottom: 8 }}>Tags are used for grant matching and AI context. Demographic tags are auto-generated from checkboxes above.</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
              {profile.tags.map(t => (
                <Badge key={t} color={T.blue} style={{ cursor: "pointer" }} onClick={() => removeTag(t)}>{t} ✕</Badge>
              ))}
              {profile.tags.length === 0 && <span style={{ fontSize: 11, color: T.mute }}>No tags yet — add some below or check demographics above</span>}
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <Input value={newTag} onChange={setNewTag} placeholder="Add custom tag..." style={{ flex: 1 }} onKeyDown={e => e.key === "Enter" && addTag()} />
              <Btn size="sm" onClick={addTag}>+ Add</Btn>
            </div>
            <div style={{ fontSize: 10, color: T.mute, marginBottom: 4 }}>Suggested tags (click to add):</div>
            <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
              {SUGGESTED_TAGS.filter(t => !profile.tags.includes(t)).slice(0, 16).map(t => (
                <Badge key={t} color={T.mute} style={{ cursor: "pointer", fontSize: 9 }}
                  onClick={() => setProfile(prev => ({ ...prev, tags: [...prev.tags, t] }))}>{t}</Badge>
              ))}
            </div>
          </Card>

          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="primary" onClick={saveProfileData}>{profileSaved ? "✅ Saved!" : "💾 Save Profile"}</Btn>
          </div>
        </div>
      )}

      {/* ─── BUSINESSES TAB ─── */}
      {tab === "businesses" && (
        <div>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>🏢 Businesses & Ventures</div>
                <div style={{ fontSize: 11, color: T.mute }}>These are included in AI-generated narratives and grant matching</div>
              </div>
              <Btn variant="primary" size="sm" onClick={() => setShowAddBiz(true)}>+ Add Business</Btn>
            </div>

            {profile.businesses.length === 0 ? (
              <Empty icon="🏢" title="No businesses added" sub="Add your businesses to improve grant matching and AI-generated content" action={<Btn variant="primary" size="sm" onClick={() => setShowAddBiz(true)}>+ Add First Business</Btn>} />
            ) : profile.businesses.map((b, idx) => (
              <Card key={idx} style={{ marginBottom: 8 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px 100px 40px", gap: 8, alignItems: "center" }}>
                  <div>
                    <label style={{ fontSize: 9, color: T.mute }}>Name</label>
                    <Input value={b.n} onChange={v => updateBusiness(idx, { n: v })} />
                  </div>
                  <div>
                    <label style={{ fontSize: 9, color: T.mute }}>Sector</label>
                    <Select value={b.sec} onChange={v => updateBusiness(idx, { sec: v })}
                      options={BIZ_SECTORS.map(s => ({ value: s, label: s }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 9, color: T.mute }}>Status</label>
                    <Select value={b.st} onChange={v => updateBusiness(idx, { st: v })}
                      options={[{ value: "active", label: "🟢 Active" }, { value: "dev", label: "🟡 Development" }, { value: "research", label: "🔵 Research" }, { value: "paused", label: "⚪ Paused" }]} />
                  </div>
                  <div>
                    <label style={{ fontSize: 9, color: T.mute }}>Monthly Rev</label>
                    <Input type="number" value={b.monthly} onChange={v => updateBusiness(idx, { monthly: Number(v) })} />
                  </div>
                  <button onClick={() => removeBusiness(idx)} style={{ background: "none", border: "none", color: T.red, cursor: "pointer", fontSize: 14, marginTop: 12 }}>✕</button>
                </div>
                <div style={{ marginTop: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <label style={{ fontSize: 9, color: T.mute }}>Description</label>
                    <Btn variant="ghost" size="xs" onClick={() => generateBusinessDescription(idx)} disabled={loading}>{loading ? "⏳" : "🪄 AI Assist"}</Btn>
                  </div>
                  <Input value={b.d} onChange={v => updateBusiness(idx, { d: v })} placeholder="Brief description for grant narratives..." />
                </div>
              </Card>
            ))}
          </Card>

          <Btn variant="primary" onClick={saveProfileData}>{profileSaved ? "✅ Saved!" : "💾 Save Profile"}</Btn>

          <Modal open={showAddBiz} onClose={() => setShowAddBiz(false)} title="Add Business">
            <div style={{ display: "grid", gap: 12 }}>
              <Input value={newBiz.n} onChange={v => setNewBiz({ ...newBiz, n: v })} placeholder="Business name" />
              <Input value={newBiz.d} onChange={v => setNewBiz({ ...newBiz, d: v })} placeholder="Brief description" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <Select value={newBiz.sec} onChange={v => setNewBiz({ ...newBiz, sec: v })}
                  options={[{ value: "", label: "Select sector..." }, ...BIZ_SECTORS.map(s => ({ value: s, label: s }))]} />
                <Select value={newBiz.st} onChange={v => setNewBiz({ ...newBiz, st: v })}
                  options={[{ value: "active", label: "🟢 Active" }, { value: "dev", label: "🟡 Development" }, { value: "research", label: "🔵 Research" }, { value: "paused", label: "⚪ Paused" }]} />
              </div>
              <div>
                <label style={{ fontSize: 10, color: T.mute }}>Monthly Revenue ($)</label>
                <Input type="number" value={newBiz.monthly} onChange={v => setNewBiz({ ...newBiz, monthly: Number(v) })} />
              </div>
              <Btn variant="primary" onClick={addBusiness}>Add Business</Btn>
            </div>
          </Modal>
        </div>
      )}

      {/* ─── NARRATIVES TAB ─── */}
      {tab === "narratives" && (
        <div>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>📝 Narrative Templates</div>
                <div style={{ fontSize: 11, color: T.mute }}>These narratives are used for grant applications and reporting.</div>
              </div>
              <Btn variant="primary" size="sm" onClick={() => setShowWizard(true)}>🪄 Narrative Wizard</Btn>
            </div>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 12, padding: "8px 12px", background: T.panel, borderRadius: 6, borderLeft: `3px solid ${T.amber}` }}>
              💡 <strong>Pro-Tip:</strong> Use the <strong>Narrative Wizard</strong> above to draft all three sections in one guided workflow based on your mission and goals.
            </div>

            <div style={{ position: "relative" }}>
              <TextArea value={profile.narratives?.founder || ""} onChange={v => updateNarrative("founder", v)} rows={3}
                placeholder="e.g., [Name] is an entrepreneur and technologist based in [Location], building [what you do] that [impact]." />
              <MagicBtn
                loading={loading && tab === "narratives"}
                onClick={() => handleMagicDraft("founder")}
                label="Draft Story"
                style={{ position: "absolute", bottom: 8, right: 8 }}
              />
            </div>

            <div style={{ position: "relative" }}>
              <TextArea value={profile.narratives?.need || ""} onChange={v => updateNarrative("need", v)} rows={3}
                placeholder="e.g., Operating from a [rural/urban] community with [challenges], [Name] faces [specific barriers] that restrict access to [resources]." />
              <MagicBtn
                loading={loading && tab === "narratives"}
                onClick={() => handleMagicDraft("need")}
                label="Draft Need"
                style={{ position: "absolute", bottom: 8, right: 8 }}
              />
            </div>

            <div style={{ position: "relative" }}>
              <TextArea value={profile.narratives?.impact || ""} onChange={v => updateNarrative("impact", v)} rows={3}
                placeholder="e.g., Each venture is designed to demonstrate that [approach] can [outcome], creating [broader impact]." />
              <MagicBtn
                loading={loading && tab === "narratives"}
                onClick={() => handleMagicDraft("impact")}
                label="Draft Vision"
                style={{ position: "absolute", bottom: 8, right: 8 }}
              />
            </div>
          </Card>

          <Btn variant="primary" onClick={saveProfileData}>{profileSaved ? "✅ Saved!" : "💾 Save Profile"}</Btn>
        </div>
      )}

      {/* ─── AI CONFIG TAB ─── */}
      {tab === "ai" && (
        <div>
          {/* Active Provider Selector */}
          <Card style={{ marginBottom: 16, borderColor: T.amber + "44" }} glow>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 8 }}>🧠 Active AI Provider</div>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 12 }}>Select which AI provider to use. OpenRouter is recommended — it gives you access to all major models with a single key.</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              <Btn size="sm" variant={!aiProvider ? "primary" : "ghost"} onClick={() => { LS.del("ai_provider"); setAiProvider(""); }}>
                🔄 Auto-detect
              </Btn>
              {Object.values(AI_PROVIDERS_LIST).map(p => (
                <Btn key={p.id} size="sm" variant={aiProvider === p.id ? "primary" : "ghost"} onClick={() => { LS.set("ai_provider", p.id); setAiProvider(p.id); }}
                  style={aiProvider === p.id ? { borderColor: p.color, boxShadow: `0 0 8px ${p.color}44` } : {}}>
                  {p.icon} {p.name} {getProviderKeyFn(p.id) ? "✅" : ""}
                </Btn>
              ))}
            </div>
            <div style={{ fontSize: 11, color: T.mute, padding: "6px 10px", borderRadius: 6, background: T.panel }}>
              Currently active: <strong style={{ color: activeProvider?.color || T.text }}>{activeProvider?.icon} {activeProvider?.name}</strong>
              {activeModel && <span> · Model: <strong>{AI_PROVIDERS_LIST[activeProvider?.id]?.models.find(m => m.id === activeModel)?.label || activeModel}</strong></span>}
            </div>
          </Card>

          {/* Model Selector */}
          {activeProvider && (
            <Card style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 8 }}>🎯 Model Selection</div>
              <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>Choose a model for {activeProvider.name}. Flagship models offer the best quality; fast models are cheaper and quicker.</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {activeProvider.models.map(m => {
                  const tierColors = { flagship: T.amber, standard: T.blue, fast: T.green, reasoning: T.purple, open: T.cyan };
                  const isActive = activeModel === m.id || (!activeModel && m === activeProvider.models[0]);
                  return (
                    <div key={m.id} onClick={() => { LS.set("ai_model", m.id); setActiveModel(m.id); }}
                      style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: 8, cursor: "pointer",
                        background: isActive ? (activeProvider.color || T.amber) + "18" : T.panel,
                        border: `1px solid ${isActive ? (activeProvider.color || T.amber) + "66" : T.border}`,
                        transition: "all 0.2s"
                      }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 14 }}>{isActive ? "◉" : "○"}</span>
                        <span style={{ fontSize: 12, fontWeight: isActive ? 600 : 400, color: T.text }}>{m.label}</span>
                      </div>
                      <Badge style={{ background: (tierColors[m.tier] || T.mute) + "22", color: tierColors[m.tier] || T.mute, fontSize: 9 }}>{m.tier}</Badge>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Per-Provider API Keys */}
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 12 }}>🔑 API Keys</div>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 12 }}>Configure keys for each provider. Keys are stored locally in your browser only.</div>
            {Object.values(AI_PROVIDERS_LIST).map(p => {
              const currentKey = providerKeys[p.id] || "";
              const hasKey = !!getProviderKeyFn(p.id);
              return (
                <div key={p.id} style={{ marginBottom: 16, padding: 12, borderRadius: 8, background: T.panel, border: `1px solid ${T.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 16 }}>{p.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{p.name}</span>
                      {hasKey && <span style={{ fontSize: 10, color: T.green }}>✅ configured</span>}
                    </div>
                    <a href={p.keyUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: T.blue, textDecoration: "none" }}>Get key →</a>
                  </div>
                  <div style={{ fontSize: 10, color: T.mute, marginBottom: 6 }}>{p.description}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Input type="password" value={currentKey} onChange={v => setProviderKeys(prev => ({ ...prev, [p.id]: v }))} placeholder={`${p.keyPrefix}...`} style={{ flex: 1 }} />
                    <Btn size="sm" variant="primary" onClick={() => {
                      if (currentKey.trim()) {
                        LS.set(p.lsKey, currentKey.trim());
                      } else {
                        LS.del(p.lsKey);
                      }
                      setSaved(true); setTimeout(() => setSaved(false), 2000);
                      showToast?.(`${p.name} key ${currentKey.trim() ? "saved" : "cleared"}`, "success");
                    }}>💾</Btn>
                  </div>
                </div>
              );
            })}
          </Card>

          {/* Connection Test */}
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 4 }}>🧪 Connection Test</div>
                <div style={{ fontSize: 11, color: T.sub }}>Send a test message to verify your active provider is working.</div>
              </div>
              <Btn size="sm" variant="primary" onClick={async () => {
                setTestResult({ status: "testing" });
                const result = await API.testAIConnection();
                setTestResult(result.error ? { status: "error", message: result.error } : { status: "success", message: result.text });
              }} disabled={testResult.status === "testing"}>
                {testResult.status === "testing" ? "⏳ Testing..." : "🚀 Test"}
              </Btn>
            </div>
            {testResult.status && testResult.status !== "testing" && (
              <div style={{
                marginTop: 8, padding: "8px 12px", borderRadius: 6, fontSize: 11,
                background: testResult.status === "success" ? T.green + "15" : T.red + "15",
                color: testResult.status === "success" ? T.green : T.red,
                border: `1px solid ${testResult.status === "success" ? T.green + "33" : T.red + "33"}`
              }}>
                {testResult.status === "success" ? "✅" : "❌"} {testResult.message}
              </div>
            )}
          </Card>

          {/* AI-Powered Modules */}
          <Card>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 8 }}>🤖 AI-Powered Modules</div>
            <div style={{ fontSize: 12, color: T.sub }}>These modules require an API key to function:</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 6, marginTop: 8 }}>
              {["AI Drafter", "Narrative Scorer", "Strategic Advisor", "RFP Parser", "Letter Generator", "AI Chat", "Match Scorer (Deep)", "Report Generator (AI mode)"].map(m => {
                const hasAnyKey = !!getProviderKeyFn(activeProvider?.id);
                return (
                  <div key={m} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", borderRadius: 4, background: T.panel }}>
                    <span style={{ color: hasAnyKey ? T.green : T.red, fontSize: 12 }}>{hasAnyKey ? "✅" : "⚠️"}</span>
                    <span style={{ fontSize: 11, color: T.text }}>{m}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* ─── DATA TAB ─── */}
      {tab === "data" && (
        <div>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 12 }}>💾 Data Management</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Btn size="sm" onClick={() => {
                const data = { profile: PROFILE, grants: LS.get("grants", []), vault_docs: LS.get("vault_docs", []), contacts: LS.get("contacts", []), events: LS.get("events", []), tasks: LS.get("tasks", []), section_library: LS.get("section_library", []), budgets: LS.get("budgets", {}) };
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `unless-backup-${new Date().toISOString().split("T")[0]}.json`; a.click();
              }}>📥 Export All Data</Btn>
              <Btn size="sm" onClick={importData}>📤 Import Data</Btn>
              <Btn size="sm" variant="danger" onClick={clearData}>🗑️ Clear All Data</Btn>
              <Btn size="sm" variant="danger" onClick={() => {
                if (confirm("Reset profile to blank? Your grant data will be kept.")) {
                  saveProfile(DEFAULT_PROFILE);
                  setProfile({ ...DEFAULT_PROFILE });
                }
              }}>🔄 Reset Profile</Btn>
            </div>
          </Card>

          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 8 }}>📊 Storage Usage</div>
            {[
              { key: "grants", label: "Grants" }, { key: "vault_docs", label: "Documents" },
              { key: "contacts", label: "Contacts" }, { key: "events", label: "Events" },
              { key: "tasks", label: "Tasks" }, { key: "section_library", label: "Section Library" },
              { key: "budgets", label: "Budgets" }, { key: "peers", label: "Peers" },
              { key: "saved_funders", label: "Saved Funders" }, { key: "match_alerts", label: "Match Alerts" },
              { key: "collab_notes", label: "Collaboration Notes" }, { key: "sam_checklist", label: "SAM Checklist" },
            ].map(item => {
              const data = LS.get(item.key, item.key === "budgets" ? {} : []);
              const count = Array.isArray(data) ? data.length : Object.keys(data).length;
              const size = JSON.stringify(data).length;
              return (
                <div key={item.key} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>
                  <span style={{ color: T.text }}>{item.label}</span>
                  <span style={{ color: T.mute }}>{count} items · {(size / 1024).toFixed(1)}KB</span>
                </div>
              );
            })}
          </Card>

          <Card>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 8 }}>🔒 Privacy</div>
            <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.6 }}>
              All data is stored locally in your browser's localStorage. Nothing is sent to any server except your API key (sent only to the specific AI provider you choose when using AI features). Clearing your browser data will erase everything — use Export to create backups.
            </div>
          </Card>
        </div>
      )}
      {showWizard && (
        <NarrativeWizard
          onCancel={() => setShowWizard(false)}
          onComplete={(results) => {
            setProfile(prev => ({
              ...prev,
              narratives: {
                ...prev.narratives,
                ...results
              }
            }));
            setShowWizard(false);
            showToast("Narratives updated from wizard! Don't forget to save.", "success");
          }}
        />
      )}
    </div>
  );
};
