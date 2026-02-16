import React, { useState, useEffect } from 'react';
import { Card, Btn, TextArea, Badge, Progress, Empty, Modal, Tab } from '../ui';
import { LS, T, uid, fmtDate } from '../globals';
import { API } from '../api';

export const ComplianceMatrix = ({ grants }) => {
  const [rfpText, setRfpText] = useState("");
  const [selectedGrant, setSelectedGrant] = useState("");
  const [matrices, setMatrices] = useState(() => LS.get("compliance_matrices", {}));
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("checklist");

  useEffect(() => { LS.set("compliance_matrices", matrices); }, [matrices]);

  const currentMatrix = matrices[selectedGrant] || { requirements: [], eligibility: [], attachments: [], metadata: {} };

  const analyzeRFP = async () => {
    if (!rfpText.trim() || !selectedGrant) return;
    setLoading(true);
    const grant = grants.find(g => g.id === selectedGrant);
    
    const sys = `You are a Grant Compliance Officer. Analyze the following RFP text for ${grant?.title || "a grant"}. 
Extract three categories of compliance items:
1. REQUIREMENTS (Submission rules, formatting, deadlines)
2. ELIGIBILITY (Who can apply, match requirements)
3. ATTACHMENTS (Mandatory forms, letters, appendices)

Format each item as a short, actionable title with a detailed description.
Return ONLY JSON:
{
  "requirements": [{"title": "...", "desc": "...", "status": "pending"}],
  "eligibility": [{"title": "...", "desc": "...", "status": "pending"}],
  "attachments": [{"title": "...", "desc": "...", "status": "pending"}]
}`;

    const result = await API.callAI([{ role: "user", content: rfpText }], sys);
    if (!result.error) {
      try {
        const cleaned = result.text.replace(/```json\n?|```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        setMatrices({ ...matrices, [selectedGrant]: { ...parsed, analyzedAt: new Date().toISOString() } });
      } catch (e) { alert("Analysis failed to parse findings."); }
    }
    setLoading(false);
  };

  const toggleItem = (category, index) => {
    const m = { ...currentMatrix };
    const item = m[category][index];
    item.status = item.status === "completed" ? "pending" : "completed";
    setMatrices({ ...matrices, [selectedGrant]: m });
  };

  const totalItems = (currentMatrix.requirements?.length || 0) + (currentMatrix.eligibility?.length || 0) + (currentMatrix.attachments?.length || 0);
  const completedItems = [...(currentMatrix.requirements || []), ...(currentMatrix.eligibility || []), ...(currentMatrix.attachments || [])].filter(i => i.status === "completed").length;
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const renderSection = (title, category, icon, color) => {
    const items = currentMatrix[category] || [];
    if (items.length === 0) return null;
    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 16 }}>{icon}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{title}</span>
          <Badge size="xs" color={color}>{items.length}</Badge>
        </div>
        {items.map((item, i) => (
          <div key={i} onClick={() => toggleItem(category, i)} style={{
            display: "flex", gap: 12, padding: "10px 12px", borderRadius: 8, marginBottom: 6, cursor: "pointer",
            background: item.status === "completed" ? T.green + "12" : T.card,
            border: `1px solid ${item.status === "completed" ? T.green + "44" : T.border}`,
            opacity: item.status === "completed" ? 0.7 : 1,
            transition: "all 0.2s"
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: 4, border: `2px solid ${item.status === "completed" ? T.green : T.mute}`,
              background: item.status === "completed" ? T.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
            }}>
              {item.status === "completed" && <span style={{ color: "white", fontSize: 12 }}>✓</span>}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: item.status === "completed" ? T.mute : T.text, textDecoration: item.status === "completed" ? "line-through" : "none" }}>{item.title}</div>
              <div style={{ fontSize: 10, color: T.sub, marginTop: 2 }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: T.mute, marginBottom: 4 }}>Select Active Grant</div>
          <select value={selectedGrant} onChange={e => setSelectedGrant(e.target.value)} style={{
            width: "100%", padding: "8px", borderRadius: 6, background: T.card, border: `1px solid ${T.border}`, color: T.text, fontSize: 12
          }}>
            <option value="">-- Choose a Grant --</option>
            {grants.map(g => <option key={g.id} value={g.id}>{g.title?.slice(0, 50)}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <Btn variant="primary" size="sm" onClick={() => setView(view === "analyze" ? "checklist" : "analyze")}>
            {view === "analyze" ? "📋 View Checklist" : "🔍 Analyze RFP"}
          </Btn>
        </div>
      </div>

      {!selectedGrant ? <Empty icon="⚖️" title="Compliance Matrix" sub="Select a grant to analyze requirements and track compliance" /> : (
        <div>
          {view === "analyze" ? (
            <Card>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 8 }}>🔍 RFP Intelligence Extraction</div>
              <div style={{ fontSize: 11, color: T.sub, marginBottom: 12 }}>Paste the "Requirements", "Submission", or "Review" sections from the RFP. The AI will build your checklist.</div>
              <TextArea value={rfpText} onChange={setRfpText} rows={12} placeholder="Paste RFP text here..." />
              <Btn variant="primary" onClick={analyzeRFP} disabled={loading || !rfpText.trim()} style={{ marginTop: 12, width: "100%" }}>
                {loading ? "⏳ Extracting Requirements..." : "🚀 Analyze & Build Checklist"}
              </Btn>
            </Card>
          ) : (
            <div>
              {totalItems === 0 ? (
                <Empty icon="📋" title="Checklist Empty" sub="Switch to 'Analyze RFP' to extract requirements automatically" action={<Btn variant="primary" size="sm" onClick={() => setView("analyze")}>Analyze RFP</Btn>} />
              ) : (
                <div>
                  <Card style={{ marginBottom: 16, background: T.panel + "33" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>Overall Compliance Readiness</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: progressPercent >= 80 ? T.green : T.amber }}>{progressPercent}%</span>
                    </div>
                    <Progress value={progressPercent} max={100} color={progressPercent >= 80 ? T.green : T.amber} height={8} />
                    <div style={{ fontSize: 10, color: T.mute, marginTop: 6, textAlign: "right" }}>{completedItems} of {totalItems} items completed</div>
                  </Card>

                  {renderSection("Submission Requirements", "requirements", "📑", T.blue)}
                  {renderSection("Eligibility Rules", "eligibility", "⚖️", T.cyan)}
                  {renderSection("Mandatory Attachments", "attachments", "📎", T.purple)}

                  <div style={{ textAlign: "center", marginTop: 20 }}>
                    <Btn variant="ghost" size="sm" onClick={() => {
                        if(confirm("Clear this matrix and re-analyze?")) {
                            setMatrices({ ...matrices, [selectedGrant]: { requirements: [], eligibility: [], attachments: [], metadata: {} } });
                            setView("analyze");
                        }
                    }}>🗑️ Reset Matrix</Btn>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
