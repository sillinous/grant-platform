import React, { useState, useEffect } from 'react';
import { Card, Btn, Select, TextArea, Badge } from '../ui';
import { API, buildPortfolioContext } from '../api';
import { T, LS, uid, fmtDate } from '../globals';

export const AIDrafter = ({ grants, vaultDocs, snapshots, setSnapshots, voicePersona, setVoicePersona, sections, setSections }) => {
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [docType, setDocType] = useState("narrative");
  const [selectedGrant, setSelectedGrant] = useState("");
  const [refinements, setRefinements] = useState([]);
  const [meta, setMeta] = useState(null);
  const [voice, setVoice] = useState("brand_balanced");

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
    const grant = grants.find(g => g.id === selectedGrant);
    const context = buildPortfolioContext(grants, vaultDocs, []);
    const selectedVoice = VOICES.find(v => v.id === voice);

    const sys = `You are an expert grant writer. ${context}
    
VOICE STYLE: ${selectedVoice.tone}
${voicePersona ? `ORGANIZATION PERSONA OVERRIDE: ${voicePersona}` : ""}

Write in a professional, compelling tone. Use specific data and evidence. Make claims measurable.`;
    const userMsg = `Draft a ${docType} section${grant ? ` for "${grant.title}"` : ""}:\n\n${prompt}`;
    const result = await API.callAI([{ role: "user", content: userMsg }], sys);
    if (result.error) setOutput(`Error: ${result.error}`);
    else {
      setOutput(result.text);
      setMeta({ provider: result.provider, model: result.model });
    }
    setLoading(false);
  };

  const autoAssemble = async () => {
    const grant = grants.find(g => g.id === selectedGrant);
    if (!grant) return alert("Select a grant first to auto-assemble.");
    setLoading(true);
    const sections = LS.get("section_library", []);
    const context = sections.map(s => `ID:${s.id} | Title:${s.title} | Category:${s.category}`).join("\n");
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
        const selected = ids.map(id => sections.find(s => s.id === id)).filter(Boolean);
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
    const sys = `You are an expert grant writer. Refine the following draft based on the instruction given.`;
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

  const saveSnapshot = () => {
    if (!output) return;
    const snap = { id: uid(), date: new Date().toISOString(), text: output, type: docType, model: meta?.model || "AI" };
    setSnapshots([snap, ...snapshots].slice(0, 20));
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

  const restoreSnapshot = (snap) => {
    if (confirm("Restore this version? current draft will be replaced.")) {
      setOutput(snap.text);
      setDocType(snap.type);
    }
  };

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>✍️ AI Grant Drafter & Voice Orchestrator</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Btn size="xs" variant="ghost" onClick={learnVoice} disabled={loading} title="Learn brand voice from Vault">
              {voicePersona ? "🔄 Re-Learn Voice" : "🧠 Learn Org Voice"}
            </Btn>
            <Btn size="xs" variant="primary" onClick={autoAssemble} disabled={loading || !selectedGrant} title="Auto-assemble from library">✨ Auto-Assemble</Btn>
            {meta && (
              <Badge size="xs" variant="ghost" style={{ fontSize: 9 }}>
                via {meta.provider} ({meta.model?.split("/").pop()})
              </Badge>
            )}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
          <Select value={docType} onChange={setDocType} options={[
            { value: "narrative", label: "📄 Project Narrative" }, { value: "need", label: "📊 Statement of Need" },
            { value: "budget", label: "💰 Budget Justification" }, { value: "abstract", label: "📋 Abstract" },
            { value: "evaluation", label: "📈 Evaluation Plan" }, { value: "sustainability", label: "🔄 Sustainability Plan" },
            { value: "letter", label: "✉️ Letter of Support" }, { value: "cover", label: "📄 Cover Letter" },
          ]} />
          <Select value={selectedGrant} onChange={setSelectedGrant}
            options={[{ value: "", label: "No specific grant" }, ...grants.map(g => ({ value: g.id, label: g.title?.slice(0, 40) }))]} />
          <Select value={voice} onChange={setVoice}
            options={VOICES.map(v => ({ value: v.id, label: `🎭 ${v.label}` }))} />
        </div>
        {voicePersona && (
          <div style={{ fontSize: 10, color: T.green, background: T.green + "08", padding: "6px 10px", borderRadius: 4, marginBottom: 12, border: `1px dashed ${T.green}44` }}>
            <b>Org Persona Active:</b> {voicePersona.slice(0, 100)}...
          </div>
        )}
        <TextArea value={prompt} onChange={setPrompt} rows={4} placeholder="Describe what you need drafted. AI will adapt to your Organization's Tone..." />
        <Btn variant="primary" onClick={draft} disabled={loading} style={{ marginTop: 8 }}>{loading ? "⏳ Drafting..." : "✨ Generate Draft"}</Btn>
      </Card>

      {output && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>📄 Draft Output</div>
            <div style={{ display: "flex", gap: 4 }}>
              <Btn size="sm" variant="success" onClick={saveSnapshot} title="Capture this version">📸 Save</Btn>
              <Btn size="sm" variant="primary" onClick={saveToLibrary} title="Save to Section Library">📦 Harvest</Btn>
              <Btn size="sm" variant="ghost" onClick={() => navigator.clipboard?.writeText(output)}>📋 Copy</Btn>
              <Btn size="sm" variant="ghost" onClick={() => setOutput("")}>✕ Clear</Btn>
            </div>
          </div>
          <div style={{ fontSize: 13, color: T.text, lineHeight: 1.7, whiteSpace: "pre-wrap", padding: 12, background: T.panel, borderRadius: 6, maxHeight: 400, overflow: "auto" }}>{output}</div>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, color: T.mute, marginBottom: 6 }}>Quick Refinements</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {["Make more concise", "Add data/metrics", "More professional tone", "Add budget justification", "Strengthen impact claims", "Add evaluation criteria"].map(r => (
                <Btn key={r} size="sm" variant="ghost" onClick={() => refine(r)} disabled={loading}>{r}</Btn>
              ))}
            </div>
          </div>
        </Card>
      )}

      {snapshots.length > 0 && (
        <Card style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 10 }}>📸 Snapshot History</div>
          <div style={{ maxHeight: 200, overflow: "auto" }}>
            {snapshots.map(snap => (
              <div key={snap.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: T.text }}>{snap.text.slice(0, 60)}...</div>
                  <div style={{ fontSize: 9, color: T.mute }}>{fmtDate(snap.date)} · {snap.type} · {snap.model?.split("/").pop()}</div>
                </div>
                <Btn size="xs" variant="ghost" onClick={() => restoreSnapshot(snap)}>Restore</Btn>
              </div>
            ))}
          </div>
          <Btn variant="ghost" size="xs" onClick={() => setSnapshots([])} style={{ marginTop: 8, color: T.red }}>Clear History</Btn>
        </Card>
      )}
    </div>
  );
};
