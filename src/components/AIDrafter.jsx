import React, { useState, useEffect, useRef } from 'react';
import { Card, Btn, Select, TextArea, Badge, Progress } from '../ui';
import { API, buildPortfolioContext } from '../api';
import { T, LS, uid, fmtDate } from '../globals';
import { useOrganization } from '../context/OrganizationContext.jsx';

export const AIDrafter = ({ grants, vaultDocs, snapshots, setSnapshots, voicePersona, setVoicePersona, sections, setSections }) => {
  const { activeOrg } = useOrganization();
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [displayedOutput, setDisplayedOutput] = useState(""); // For typewriter effect
  const [loading, setLoading] = useState(false);
  const [docType, setDocType] = useState("narrative");
  const [selectedGrant, setSelectedGrant] = useState("");
  const [refinements, setRefinements] = useState([]);
  const [meta, setMeta] = useState(null);
  const [voice, setVoice] = useState("brand_balanced");
  const [audit, setAudit] = useState(null);
  const [auditing, setAuditing] = useState(false);
  const [typingIndex, setTypingIndex] = useState(0);

  // Typewriter Effect
  useEffect(() => {
    if (output && typingIndex < output.length) {
      const timeout = setTimeout(() => {
        setDisplayedOutput(prev => prev + output.charAt(typingIndex));
        setTypingIndex(prev => prev + 1);
      }, 5); // Adjust speed here
      return () => clearTimeout(timeout);
    }
  }, [output, typingIndex]);

  // Reset typewriter when output changes significantly (new draft)
  useEffect(() => {
    if (output !== displayedOutput && typingIndex === 0) {
      setDisplayedOutput("");
    }
  }, [output]);

  const VOICES = [
    { id: "academic", label: "Academic & Robust", tone: "Formal, data-heavy, peer-reviewed style." },
    { id: "direct", label: "Direct & Urgent", tone: "Action-oriented, concise, emphasizing immediate need." },
    { id: "community", label: "Community-Led", tone: "Narrative, inclusive, person-first language." },
    { id: "brand_balanced", label: "Brand Balanced (Recommended)", tone: "Professional yet accessible, matching existing successful grants." }
  ];

  const learnVoice = async () => {
    if (!vaultDocs || vaultDocs.length === 0) return alert("Add docs to your Vault first to learn your brand voice.");
    setLoading(true);
    const sample = vaultDocs.map(d => `DOC: ${d.title}\nCONTENT: ${d.content?.slice(0, 400)}`).join("\n\n---\n\n");
    const sys = `You are a Linguistic Brand Architect. Analyze the following document samples from the user's organization.
Identify their "Voice Persona":
1. Keywords and semantic preferences.
2. Sentence structure and pacing.
3. Tone (e.g., authoritative, humble, visionary).

Return a 3-sentence "Voice Blueprint" that can be used to guide future AI drafting.`;
      const result = await API.callAI([{ role: "user", content: `Analyze this voice: ${sample}` }], sys);
      if (!result.error) {
        setVoicePersona(result.text);
        alert("✨ Org Voice Learned! Your drafts will now match your unique brand identity.");
      }
      setLoading(false);
    };

  const draft = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
      setTypingIndex(0);
      setDisplayedOutput("");

      const grant = grants.find(g => g.id === selectedGrant);
      const context = buildPortfolioContext(grants, vaultDocs, []);
      const selectedVoice = VOICES.find(v => v.id === voice);

      // Inject Organization Context
      const orgContext = activeOrg ? `
ORGANIZATION CONTEXT:
Name: ${activeOrg.name}
Type: ${activeOrg.type}
Mission: ${activeOrg.mission || "Not specified"}
Region: ${activeOrg.region || "Not specified"}
        ` : "";

      const sys = `You are an expert grant writer. ${context}
        
${orgContext}

VOICE STYLE: ${selectedVoice.tone}
${voicePersona ? `ORGANIZATION PERSONA OVERRIDE: ${voicePersona}` : ""}

os: Write in a professional, compelling tone. Use specific data and evidence. Make claims measurable. Structure with clear headers if needed.`;

      const userMsg = `Draft a ${docType} section${grant ? ` for "${grant.title}"` : ""}:\n\n${prompt}`;
      const result = await API.callAI([{ role: "user", content: userMsg }], sys);

      if (result.error) {
        setOutput(`Error: ${result.error}`);
        setTypingIndex(result.error.length); // Skip typing for errors
      } else {
        setOutput(result.text);
        setMeta({ provider: result.provider, model: result.model });
      }
      setLoading(false);
    };

  const autoAssemble = async () => {
    const grant = grants.find(g => g.id === selectedGrant);
    if (!grant) return alert("Select a grant first to auto-assemble.");
    setLoading(true);
      setTypingIndex(0);
      setDisplayedOutput("");

      const sectionsLib = LS.get("section_library", []);
      const context = sectionsLib.map(s => `ID:${s.id} | Title:${s.title} | Category:${s.category}`).join("\n");
      const sys = `You are a Grant Document Architect. Map the following grant requirements to the best available sections in the library.
GRANT: ${grant.title}
DESCRIPTION: ${grant.description}

LIBRARY SECTIONS:
${context}

Return ONLY a JSON array of section IDs in the optimal sequence for a draft:
["id1", "id2", "id3"]`;

      const result = await API.callAI([{ role: "user", content: "Select the best sections for this grant." }], sys);
      if (!result.error) {
        try {
          const cleaned = result.text.replace(/```json\n?|```/g, "").trim();
          const ids = JSON.parse(cleaned);
          const selected = ids.map(id => sectionsLib.find(s => s.id === id)).filter(Boolean);
          const assembled = selected.map(s => `## ${s.title}\n\n${s.content}`).join("\n\n---\n\n");
          setOutput(assembled);
          setMeta({ provider: result.provider, model: result.model });
          alert(`✨ Assembled ${selected.length} sections from your library!`);
        } catch (e) { alert("Failed to assemble sections."); }
      }
      setLoading(false);
    };

  const refine = async (instruction) => {
    if (!output) return;
    setLoading(true);
      setTypingIndex(0);
      setDisplayedOutput(""); // Clear for re-typing effect

      const sys = `You are an expert grant writer. Refine the following draft based on the instruction given. Keep the Organization's voice.`;
      const res = await API.callAI([
        { role: "user", content: `Current draft:\n\n${output}\n\nRefinement instruction: ${instruction}` },
      ], sys);

      if (!res.error) {
        setRefinements([...refinements, { instruction, before: output, after: res.text }]);
        setOutput(res.text);
        setMeta({ provider: res.provider, model: res.model });
      }
      setLoading(false);
    };

  const runAudit = async () => {
    if (!output) return;
    setAuditing(true);
    const result = await API.auditSection(output, docType, selectedGrant);
    if (!result.error) {
      setAudit(result);
    } else {
      alert("Audit failed: " + result.error);
    }
    setAuditing(false);
  };

  const saveSnapshot = () => {
    if (!output) return;
    const snap = { id: uid(), date: new Date().toISOString(), text: output, type: docType, model: meta?.model || "AI" };
      setSnapshots([snap, ...snapshots].slice(0, 20)); // Keep last 20
      alert("📸 Snapshot saved!");
    };

  const saveToLibrary = () => {
    if (!output) return;
    const title = prompt.slice(0, 40) || `AI Draft (${docType})`;
    const newSection = {
      id: uid(),
      title,
      content: output,
      category: docType === "narrative" ? "Narrative" : docType === "need" ? "Need" : "General",
      tags: ["AI-Generated", docType],
      lastModified: new Date().toISOString()
    };
    const updated = [...sections, newSection];
    setSections(updated);
    LS.set("section_library", updated);
    alert(`✨ Saved to Library as "${title}"`);
  };

  return (
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20, height: "calc(100vh - 100px)", minHeight: 600 }}>
        {/* ━━━ LEFT COLUMN: CONTEXT & CONTROLS ━━━ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", paddingRight: 4 }}>

          {/* 1. Organization Context Card */}
          <Card style={{ background: `linear-gradient(135deg, ${T.panel}, ${T.blue}05)`, border: `1px solid ${T.blue}22` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.blue, marginBottom: 8, letterSpacing: 1 }}>IDENTITY SOURCE</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 6, background: T.blue, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                {activeOrg?.name.charAt(0) || "P"}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{activeOrg?.name || "Personal Context"}</div>
                <div style={{ fontSize: 10, color: T.mute }}>{activeOrg ? "Organization" : "Individual"}</div>
              </div>
            </div>
            {voicePersona ? (
              <div style={{ fontSize: 10, color: T.sub, fontStyle: "italic", borderLeft: `2px solid ${T.green}`, paddingLeft: 8 }}>
                "Persona Active: {voicePersona.slice(0, 60)}..."
              </div>
            ) : (
              <Btn size="xs" variant="ghost" onClick={learnVoice} style={{ width: "100%" }}>🧠 Learn Brand Voice</Btn>
            )}
          </Card>

          {/* 2. Configuration */}
          <Card>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.mute, marginBottom: 8, letterSpacing: 1 }}>CONFIGURATION</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 10, color: T.sub, marginBottom: 4, display: "block" }}>Document Type</label>
                <Select value={docType} onChange={setDocType} options={[
                  { value: "narrative", label: "📄 Project Narrative" }, { value: "need", label: "📊 Statement of Need" },
                  { value: "budget", label: "💰 Budget Justification" }, { value: "abstract", label: "📋 Abstract" },
                  { value: "evaluation", label: "📈 Evaluation Plan" }, { value: "sustainability", label: "🔄 Sustainability Plan" },
                  { value: "letter", label: "✉️ Letter of Support" },
                ]} style={{ width: "100%" }} />
              </div>
              <div>
                <label style={{ fontSize: 10, color: T.sub, marginBottom: 4, display: "block" }}>Target Grant</label>
                <Select value={selectedGrant} onChange={setSelectedGrant}
                  options={[{ value: "", label: "General / Unspecified" }, ...grants.map(g => ({ value: g.id, label: g.title?.slice(0, 30) + "..." }))]}
                  style={{ width: "100%" }} />
              </div>
              <div>
                <label style={{ fontSize: 10, color: T.sub, marginBottom: 4, display: "block" }}>Tone & Voice</label>
                <Select value={voice} onChange={setVoice}
                  options={VOICES.map(v => ({ value: v.id, label: v.label }))}
                  style={{ width: "100%" }} />
              </div>
            </div>
          </Card>

          {/* 3. Prompt Input */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.mute, marginBottom: 8, letterSpacing: 1 }}>INSTRUCTIONS</div>
            <TextArea
              value={prompt}
              onChange={setPrompt}
              style={{ flex: 1, fontSize: 13, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8, padding: 12, lineHeight: 1.5, resize: "none" }}
              placeholder="Describe what you need drafted. Be specific about goals, metrics, and key partners..."
            />
            <Btn variant="primary" onClick={draft} disabled={loading} style={{ marginTop: 12, height: 44, fontSize: 14 }}>
              {loading ? "⏳ Generating..." : "✨ Generate Draft"}
            </Btn>
            <Btn size="sm" variant="ghost" onClick={autoAssemble} disabled={loading || !selectedGrant} style={{ marginTop: 8 }}>
              ✨ Auto-Assemble from Library
            </Btn>
          </div>
        </div>

        {/* ━━━ RIGHT COLUMN: CANVAS & OUTPUT ━━━ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%" }}>
          {/* Visual Header for Canvas */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 4px" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>Live Draft Canvas</div>
              {loading && <div style={{ fontSize: 12, color: T.blue, animation: "pulse 1.5s infinite" }}>● AI Drafting...</div>}
            </div>
            {output && (
              <div style={{ display: "flex", gap: 6 }}>
                <Btn size="sm" variant="success" onClick={saveSnapshot}>📸 Save Snapshot</Btn>
                <Btn size="sm" variant="ghost" onClick={runAudit} disabled={auditing}>🛡️ Audit</Btn>
                <Btn size="sm" variant="ghost" onClick={() => navigator.clipboard?.writeText(output)}>📋 Copy</Btn>
                <Btn size="sm" variant="ghost" onClick={() => { setOutput(""); setDisplayedOutput(""); }}>🗑️ Clear</Btn>
              </div>
            )}
          </div>

          {/* The Canvas */}
          <Card style={{ flex: 1, padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", background: T.bg, border: `1px solid ${T.border}` }}>
            {/* Toolbar */}
            <div style={{ padding: "8px 12px", borderBottom: `1px solid ${T.border}`, background: T.panel, display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.mute, marginRight: 8 }}>QUICK REFINE:</div>
              {["Make Concise", "Add Metrics", "Professional Tone", "Expand"].map(r => (
                <button key={r} onClick={() => refine(r)} disabled={loading}
                  style={{ background: "transparent", border: `1px solid ${T.border}`, borderRadius: 4, padding: "4px 8px", fontSize: 10, color: T.sub, cursor: "pointer", transition: "0.2s" }}
                  onMouseOver={e => e.target.style.borderColor = T.blue}
                  onMouseOut={e => e.target.style.borderColor = T.border}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Editor Area */}
            <div style={{ flex: 1, padding: 32, overflowY: "auto", fontFamily: "'Courier Prime', 'Roboto Mono', monospace", fontSize: 14, lineHeight: 1.8, color: T.text }}>
              {displayedOutput ? (
                <div style={{ whiteSpace: "pre-wrap" }}>
                  {displayedOutput}
                  {typingIndex < output.length && <span style={{ borderRight: `2px solid ${T.blue}`, animation: "blink 1s step-end infinite" }}>&nbsp;</span>}
                </div>
              ) : (
                <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: T.dim, flexDirection: "column", gap: 12 }}>
                  <div style={{ fontSize: 32, opacity: 0.2 }}>⌨️</div>
                  <div style={{ fontSize: 13 }}>Ready to draft. Configure your parameters on the left.</div>
                </div>
              )}
            </div>

            {/* Meta Footer */}
            {meta && (
              <div style={{ padding: "4px 12px", borderTop: `1px solid ${T.border}`, background: T.panel, fontSize: 10, color: T.mute, display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <span>Model: {meta.model}</span>
                <span>Provider: {meta.provider}</span>
                <span>Chars: {output.length}</span>
              </div>
            )}
          </Card>

          {/* Audit Overlay (if active) */}
          {audit && (
            <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginTop: -16, zIndex: 10, boxShadow: "0 -4px 20px rgba(0,0,0,0.2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: audit.status === "pass" ? T.green : T.amber }}>COMPLIANCE: {audit.score}/100</div>
                <Btn size="xs" variant="ghost" onClick={() => setAudit(null)}>Close</Btn>
              </div>
              <Progress value={audit.score} max={100} color={audit.status === "pass" ? T.green : T.amber} height={4} />
              <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.red, marginBottom: 4 }}>DEFICIENCIES</div>
                  {audit.deficiencies.map((d, i) => <div key={i} style={{ fontSize: 10, color: T.sub, marginBottom: 2 }}>• {d}</div>)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.blue, marginBottom: 4 }}>RECOMMENDATIONS</div>
                  {audit.recommendations.map((r, i) => <div key={i} style={{ fontSize: 10, color: T.sub, marginBottom: 2 }}>• {r}</div>)}
                </div>
              </div>
            </div>
          )}
        </div>

        <style>{`
                @keyframes blink { 50% { border-color: transparent } }
                @keyframes pulse { 0% { opacity: 0.5 } 50% { opacity: 1 } 100% { opacity: 0.5 } }
            `}</style>
      </div>
    );
};
