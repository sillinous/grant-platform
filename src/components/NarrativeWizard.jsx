import React, { useState } from 'react';
import { Card, Btn, Progress, TextArea, Badge } from '../ui';
import { T, PROFILE } from '../globals';
import { API } from '../api';
import { useStore } from '../store';

export const NarrativeWizard = ({ onComplete, onCancel, activeGrantId, navigate }) => {
  const { setWorkflowBrief } = useStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState({
    passions: "",
    challenges: "",
    goals: "",
    demographics: ""
  });
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const TOTAL = 4;

  const steps = [
    { 
      title: "Step 1: Your Why", 
      desc: "What inspired you to start this journey? What are you passionate about?",
      field: "passions",
      placeholder: "e.g., I've always been passionate about bridging the digital divide in rural communities..."
    },
    { 
      title: "Step 2: The Need", 
      desc: "What specific challenges or gaps are you trying to address? What's standing in your way?",
      field: "challenges",
      placeholder: "e.g., Many elderly residents in our area lack reliable internet access to manage their health..."
    },
    { 
      title: "Step 3: The Vision", 
      desc: "If you had unlimited resources, what would success look like for your community/organization?",
      field: "goals",
      placeholder: "e.g., We want to establish 5 community hubs that provide free training and devices to 1,000+ residents..."
    },
    { 
      title: "Step 4: AI Generation", 
      desc: "Reviewing your inputs and drafting your story...",
      field: "generation"
    }
  ];

  const current = steps[step - 1];

  const handleNext = async () => {
    if (step < 3) {
      setStep(step + 1);
    } else if (step === 3) {
      setStep(4);
      generateAll();
    }
  };

  const generateAll = async () => {
    setLoading(true);

    // Pull OpenAlex research + BLS wage benchmarks in parallel
    const [research, wages] = await Promise.all([
      API.searchOpenAlexResearch(inputs.challenges.slice(0, 100) || PROFILE.focus?.[0] || "community development"),
      API.getBLSWageData()
    ]);

    const citationText = Array.isArray(research) && research.length > 0
      ? research.slice(0, 3).map(r => `- "${r.title}" (${r.year}, ${r.citations} citations)`).join("\n")
      : "No citations found.";

    const wageText = wages?.benchmarks
      ? Object.values(wages.benchmarks).map(w => `${w.title}: $${w.annualWage.toLocaleString()} (${w.source})`).join(", ")
      : "";

    const context = `
      Passions: ${inputs.passions}
      Challenges: ${inputs.challenges}
      Goals: ${inputs.goals}
      Profile Name: ${PROFILE.name}
      Location: ${PROFILE.loc}
      Macro Impact Target (Primary Demographic): ${PROFILE.impactMetrics?.demographicFocus || "Broad"}
      Macro Impact Target (Jobs Created): ${PROFILE.impactMetrics?.jobsCreated || "N/A"}
      Local Poverty Rate: ${PROFILE.impactMetrics?.localPovertyRate || "N/A"}%
      Local Broadband Access: ${PROFILE.impactMetrics?.broadbandAccess || "N/A"}%

      EVIDENCE BASE (peer-reviewed research on this topic):
${citationText}

      LOCAL WAGE BENCHMARKS (BLS OES 2024):
      ${wageText}
    `;

    const sys = `You are a Professional Grant Strategy Consultant. Based on the raw inputs, draft three polished narratives.
    IMPORTANT: Weave in the peer-reviewed evidence and local data provided in the context to make narratives highly compelling and data-driven.`;
    const prompt = `
      Context: ${context}
      
      Tasks:
      1. Draft a 2-3 sentence 'Founder Story' (Third person).
      2. Draft a 2-3 sentence 'Statement of Need' (Third person). Cite at least one piece of research evidence.
      3. Draft a 2-3 sentence 'Impact Vision' (Third person). Mention the demographic focus and jobs.
      
      Return as JSON with keys: 'founder', 'need', 'impact'.
    `;

    const res = await API.callAI([{ role: "user", content: prompt }], sys, { forceJson: true });
    
    if (!res.error) {
      try {
        const data = JSON.parse(res.text.replace(/```json\n?|```/g, "").trim());
        setResults({ ...data, _evidence: research, _wages: wages?.benchmarks });
      } catch (e) {
        setResults({ founder: "Failed to parse AI output. Please try again.", need: "", impact: "" });
      }
    } else {
      setError(res.error);
    }
    setLoading(false);
  };

  const applyNarratives = () => {
    if (activeGrantId) {
      setWorkflowBrief(activeGrantId, results);
    }
    if (onComplete) onComplete(results);
  };

  return (
    <div style={{ padding: 16, display: "flex", justifyContent: "center" }}>
      <Card style={{ maxWidth: 800, width: "100%", borderColor: T.amber + "33" }} glow>
        <div style={{ padding: "16px 24px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.amber }}>🪄 Narrative Strategy Wizard</div>
          <Btn variant="ghost" size="xs" onClick={onCancel}>✕</Btn>
        </div>
        
        <Progress value={step} max={TOTAL} color={T.amber} height={4} />
        
        <div style={{ padding: 24, minHeight: 300, display: "flex", flexDirection: "column" }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: T.text, marginBottom: 4 }}>{current.title}</div>
            <div style={{ fontSize: 13, color: T.sub }}>{current.desc}</div>
          </div>

          {step < 4 && current.field !== 'generation' ? (
            <div style={{ flex: 1 }}>
              <TextArea 
                dictate={true}
                value={inputs[current.field] || ""}
                onChange={e => setInputs({ ...inputs, [current.field]: e.target.value })}
                rows={8}
                placeholder={current.placeholder}
                style={{ fontSize: 13, lineHeight: 1.6 }}
              />
            </div>
          ) : (
            <div style={{ flex: 1 }}>
              {loading ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 200, gap: 16 }}>
                  <div style={{ fontSize: 32, animation: "spin 2s linear infinite" }}>✨</div>
                  <div style={{ fontSize: 14, color: T.amber }}>AI is weaving your narratives...</div>
                </div>
                ) : error ? (
                  <div style={{ padding: 16, background: `${T.red}11`, border: `1px solid ${T.red}44`, borderRadius: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.red, marginBottom: 4 }}>⚠️ Generation Failed</div>
                    <div style={{ fontSize: 12, color: T.sub, marginBottom: 12 }}>{error}</div>
                    <div style={{ fontSize: 11, color: T.mute }}>Add an AI API key in Settings → AI Config to enable AI narrative generation. You can still manually write your brief and proceed.</div>
                    <Btn variant="ghost" size="sm" style={{ marginTop: 12 }} onClick={() => { setError(null); setStep(3); }}>← Edit Inputs</Btn>
                  </div>
                ) : results ? (
                <div style={{ gap: 12, display: "flex", flexDirection: "column" }}>
                  <div style={{ padding: 10, background: T.panel, borderRadius: 8 }}>
                    <Badge color={T.purple} style={{ marginBottom: 4 }}>Founder Story</Badge>
                    <div style={{ fontSize: 12, color: T.text }}>{results.founder}</div>
                  </div>
                  <div style={{ padding: 10, background: T.panel, borderRadius: 8 }}>
                    <Badge color={T.blue} style={{ marginBottom: 4 }}>Statement of Need</Badge>
                    <div style={{ fontSize: 12, color: T.text }}>{results.need}</div>
                  </div>
                  <div style={{ padding: 10, background: T.panel, borderRadius: 8 }}>
                    <Badge color={T.green} style={{ marginBottom: 4 }}>Impact Vision</Badge>
                    <div style={{ fontSize: 12, color: T.text }}>{results.impact}</div>
                  </div>
                </div>
                ) : null}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 12, color: T.mute }}>Step {step} of {TOTAL}</span>
            <div style={{ display: "flex", gap: 8 }}>
              {step > 1 && <Btn variant="ghost" onClick={() => setStep(step - 1)} disabled={loading}>← Back</Btn>}
              {step < TOTAL ? (
                <Btn variant="primary" onClick={handleNext} disabled={!String(inputs[current.field] ?? '').trim()}>
                  {step === 3 ? 'Generate →' : 'Next →'}
                </Btn>
              ) : (
                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn variant="ghost" onClick={applyNarratives} disabled={loading || !results}>💾 Save Brief</Btn>
                    <Btn variant="primary" onClick={() => { applyNarratives(); navigate('workbench'); }} disabled={loading || !results}>✨ Go to Workbench →</Btn>
                  </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
