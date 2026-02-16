import React, { useState } from 'react';
import { Card, Btn, Badge, Input, Select, TextArea, Empty, Progress } from '../ui';
import { T, LS, uid, fmtDate, fmt } from '../globals';
import { API } from '../api';

export const CloseoutWizard = ({ grants, updateGrant }) => {
  const [activeGrantId, setActiveGrantId] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  const activeGrant = grants.find(g => g.id === activeGrantId);

  const generateCloseout = async () => {
    if (!activeGrant) return;
    setLoading(true);
    const sys = `You are a Grant Compliance Officer. Generate a FINAL CLOSEOUT SUMMARY (SF-425 equivalent) and a PERFORMANCE NARRATIVE.
    Return ONLY JSON:
    {
      "sf425": {
        "total_awarded": N,
        "total_spent": N,
        "remaining_balance": N,
        "federal_share_of_expenditures": N,
        "recipient_share_of_expenditures": N,
        "unliquidated_obligations": N
      },
      "performance_narrative": "A 3-paragraph summary of milestones achieved, impact delivered, and sustainability plan.",
      "audit_readiness": "low|medium|high",
      "flags": ["string"]
    }`;

    const prompt = `Generate closeout data for this grant:\n\nTitle: ${activeGrant.title}\nAmount: ${activeGrant.amount}\nSpent: ${activeGrant.spent || 0}\nDescription: ${activeGrant.description}`;

    const res = await API.callAI([{ role: "user", content: prompt }], sys, { forceJson: true });
    if (!res.error) {
       const data = typeof res.text === "string" ? JSON.parse(res.text.replace(/```json\n?|```/g, "").trim()) : res.text;
       setReport(data);
       setStep(3);
    }
    setLoading(false);
  };

  const finalizeCloseout = () => {
    updateGrant(activeGrantId, { stage: "archived", closeoutDate: new Date().toISOString(), closeoutReport: report });
    alert("✅ Grant Successfully Closed Out and Archived.");
    setActiveGrantId("");
    setStep(1);
    setReport(null);
  };

  const STEPS = [
    { n: 1, label: "Selection" },
    { n: 2, label: "Reconciliation" },
    { n: 3, label: "Review & Generate" },
    { n: 4, label: "Final Archival" }
  ];

  return (
    <Card style={{ maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>📑 Automated Closeout Wizard</div>
          <div style={{ fontSize: 11, color: T.sub }}>Streamlining compliance reporting and permanent archival.</div>
        </div>
        <Badge color={T.amber}>SF-425 Automation</Badge>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
        {STEPS.map(s => (
          <div key={s.n} style={{ flex: 1, padding: 8, background: step >= s.n ? T.amber + "15" : T.panel, borderRadius: 4, borderBottom: `3px solid ${step >= s.n ? T.amber : T.border}`, textAlign: "center", transition: "all 0.3s" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: step >= s.n ? T.amber : T.mute }}>STEP {s.n}</div>
            <div style={{ fontSize: 9, color: T.sub }}>{s.label}</div>
          </div>
        ))}
      </div>

      {step === 1 && (
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600 }}>Select a grant in the 'Closeout' or 'Active' stage:</div>
          <Select 
            value={activeGrantId} 
            onChange={setActiveGrantId} 
            options={[
              { value: "", label: "-- Choose Grant --" },
              ...grants.filter(g => ["active", "closeout"].includes(g.stage)).map(g => ({ value: g.id, label: g.title }))
            ]} 
          />
          {activeGrantId && <Btn variant="primary" onClick={() => setStep(2)}>Continue to Reconciliation →</Btn>}
          {!activeGrantId && <Empty icon="📂" title="Ready to Closeout?" sub="Select an active grant to begin the automated reporting process." />}
        </div>
      )}

      {step === 2 && activeGrant && (
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ padding: 16, background: T.panel, borderRadius: 8, border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{activeGrant.title}</div>
            <div style={{ fontSize: 12, color: T.sub }}>Agency: {activeGrant.agency} | Awarded: {fmt(activeGrant.amount)}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Card>
              <div style={{ fontSize: 10, color: T.mute, marginBottom: 4 }}>TOTAL SPENT</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{fmt(activeGrant.spent || 0)}</div>
            </Card>
            <Card>
              <div style={{ fontSize: 10, color: T.mute, marginBottom: 4 }}>REMAINING BALANCE</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: T.green }}>{fmt(activeGrant.amount - (activeGrant.spent || 0))}</div>
            </Card>
          </div>
          <div style={{ fontSize: 11, color: T.sub }}>
            Verify that all financial transactions have been synced. If correct, proceed to generate the AI-powered closeout narratives.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="ghost" onClick={() => setStep(1)}>← Back</Btn>
            <Btn variant="primary" style={{ flex: 1 }} onClick={generateCloseout} disabled={loading}>{loading ? "⏳ Generating Smart Report..." : "🛠️ Generate Closeout Package"}</Btn>
          </div>
        </div>
      )}

      {step === 3 && report && (
        <div style={{ display: "grid", gap: 20 }}>
          <div style={{ padding: 16, background: T.blue + "08", border: `1px solid ${T.blue}22`, borderRadius: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: T.blue }}>DRAFT SF-425 SUMMARY</div>
              <Badge color={report.audit_readiness === "high" ? T.green : T.amber}>Audit readiness: {report.audit_readiness}</Badge>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {Object.entries(report.sf425).map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${T.border}`, fontSize: 10 }}>
                  <span style={{ color: T.mute, textTransform: "capitalize" }}>{k.replace(/_/g, " ")}:</span>
                  <span style={{ fontWeight: 700 }}>{typeof v === "number" ? fmt(v) : v}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.text, marginBottom: 8 }}>PERFORMANCE NARRATIVE (AI DRAFT)</div>
            <div style={{ fontSize: 11, color: T.sub, lineHeight: 1.6, padding: 12, background: T.panel, borderRadius: 8, whiteSpace: "pre-wrap" }}>
              {report.performance_narrative}
            </div>
          </div>

          {report.flags?.length > 0 && (
            <div style={{ padding: 12, background: T.red + "11", borderRadius: 8, border: `1px solid ${T.red}22` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.red, marginBottom: 8 }}>🚩 COMPLIANCE FLAGS</div>
              {report.flags.map((f, i) => <div key={i} style={{ fontSize: 10, color: T.sub, marginBottom: 2 }}>• {f}</div>)}
            </div>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="ghost" onClick={() => setStep(2)}>← Re-edit</Btn>
            <Btn variant="primary" style={{ flex: 1 }} onClick={() => setStep(4)}>Proceed to Final Sign-off →</Btn>
          </div>
        </div>
      )}

      {step === 4 && (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ fontSize: 40, marginBottom: 20 }}>🏗️</div>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>Ready for Permanent Archival?</div>
          <div style={{ fontSize: 12, color: T.sub, marginBottom: 24, maxWidth: 400, margin: "0 auto 24px" }}>
            Clicking 'Finalize' will move this grant to the 'Archived' state. All closeout documents will be permanently attached to the record for audit retention.
          </div>
          <div style={{ display: "flex", justify: "center", gap: 12 }}>
            <Btn variant="ghost" onClick={() => setStep(3)}>Wait, go back</Btn>
            <Btn variant="primary" onClick={finalizeCloseout}>✅ Finalize & Archive</Btn>
          </div>
        </div>
      )}
    </Card>
  );
};
