import React, { useState } from 'react';
import { Card, Btn, Input, Select, TextArea } from '../ui';
import { API, buildPortfolioContext } from '../api';
import { T } from '../globals';

export const AIDrafter = ({ grants, vaultDocs }) => {
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [docType, setDocType] = useState("narrative");
  const [selectedGrant, setSelectedGrant] = useState("");
  const [refinements, setRefinements] = useState([]);

  const draft = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    const grant = grants.find(g => g.id === selectedGrant);
    const context = buildPortfolioContext(grants, vaultDocs, []);
    const sys = `You are an expert grant writer. ${context}\n\nWrite in a professional, compelling tone. Use specific data and evidence. Make claims measurable.`;
    const userMsg = `Draft a ${docType} section${grant ? ` for "${grant.title}"` : ""}:\n\n${prompt}`;
    const result = await API.callAI([{ role: "user", content: userMsg }], sys);
    if (result.error) setOutput(`Error: ${result.error}`);
    else setOutput(result.text);
    setLoading(false);
  };

  const refine = async (instruction) => {
    if (!output) return;
    setLoading(true);
    const sys = `You are an expert grant writer. Refine the following draft based on the instruction given.`;
    const result = await API.callAI([
      { role: "user", content: `Current draft:\n\n${output}\n\nRefinement instruction: ${instruction}` },
    ], sys);
    if (!result.error) {
      setRefinements([...refinements, { instruction, before: output, after: result.text }]);
      setOutput(result.text);
    }
    setLoading(false);
  };

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>✍️ AI Grant Drafter</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
          <Select value={docType} onChange={setDocType} options={[
            { value: "narrative", label: "📄 Project Narrative" }, { value: "need", label: "📊 Statement of Need" },
            { value: "budget", label: "💰 Budget Justification" }, { value: "abstract", label: "📋 Abstract" },
            { value: "evaluation", label: "📈 Evaluation Plan" }, { value: "sustainability", label: "🔄 Sustainability Plan" },
            { value: "letter", label: "✉️ Letter of Support" }, { value: "cover", label: "📄 Cover Letter" },
          ]} />
          <Select value={selectedGrant} onChange={setSelectedGrant}
            options={[{ value: "", label: "No specific grant" }, ...grants.map(g => ({ value: g.id, label: g.title?.slice(0, 40) }))]} />
        </div>
        <TextArea value={prompt} onChange={setPrompt} rows={4} placeholder="Describe what you need drafted. Be specific about the audience, requirements, and key points to include..." />
        <Btn variant="primary" onClick={draft} disabled={loading} style={{ marginTop: 8 }}>{loading ? "⏳ Drafting..." : "✨ Generate Draft"}</Btn>
      </Card>

      {output && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>📄 Draft Output</div>
            <div style={{ display: "flex", gap: 4 }}>
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
          {refinements.length > 0 && (
            <div style={{ marginTop: 12, fontSize: 10, color: T.dim }}>
              {refinements.length} refinement{refinements.length > 1 ? "s" : ""} applied
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

