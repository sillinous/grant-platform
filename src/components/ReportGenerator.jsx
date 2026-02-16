import React, { useState } from 'react';
import { Card, Btn, Modal } from '../ui';
import { T, PROFILE, fmt, fmtDate, daysUntil, STAGES, STAGE_MAP } from '../globals';
import { API, buildPortfolioContext } from '../api';

export const ReportGenerator = ({ grants, vaultDocs, contacts }) => {
  const [reportType, setReportType] = useState("portfolio");
  const [generated, setGenerated] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const REPORT_TYPES = [
    { id:"portfolio", label:"📊 Portfolio Summary", desc:"Overview of all grants, pipeline status, and financial projections" },
    { id:"progress", label:"📈 Progress Report", desc:"Status updates on active grants with milestones and achievements" },
    { id:"pipeline", label:"📋 Pipeline Report", desc:"Detailed view of grants in each stage with recommendations" },
    { id:"financial", label:"💰 Financial Summary", desc:"Award amounts, burn rates, and projections across all grants" },
    { id:"impact", label:"🎯 Impact Report", desc:"Outcomes, metrics, and community impact from awarded grants" },
    { id:"funder", label:"🏛️ Funder Analysis", desc:"Breakdown of funding sources, success rates, and relationship strength" },
    { id: "microsite", label: "🌐 Shareable Microsite", desc: "Generate a standalone HTML impact summary for external stakeholders" },
    { id: "advocacy", label: "📢 Advocacy & PR Kit", desc: "AI-generated press releases and impact cards for award wins" },
  ];

  const generateReport = async () => {
    setLoading(true);
    const context = buildPortfolioContext(grants, vaultDocs, contacts);
    const grantDetails = grants.map(g => `- ${g.title} | ${STAGE_MAP[g.stage]?.label} | ${fmt(g.amount||0)} | ${g.agency} | ${g.deadline ? fmtDate(g.deadline) : 'No deadline'}`).join("\n");

    const prompts = {
      portfolio: `Generate a comprehensive Portfolio Summary Report including: executive summary, pipeline overview by stage, total funding sought vs awarded, key deadlines in the next 30 days, risk areas, and strategic recommendations.`,
      progress: `Generate a Progress Report for all active and awarded grants. Include: current status, recent milestones, upcoming deliverables, any blockers or concerns, and next steps for each grant.`,
      pipeline: `Generate a Pipeline Report showing: grants in each lifecycle stage, conversion rates between stages, bottlenecks, recommended priorities, and suggested actions for stalled grants.`,
      financial: `Generate a Financial Summary Report including: total funding awarded, total pending, total in pipeline, burn rate on active awards, projected cash flow, and budget utilization analysis.`,
      impact: `Generate an Impact Report covering: communities served, outcomes achieved, jobs created or supported, innovations developed, and how the portfolio aligns with broader economic development goals.`,
      funder: `Generate a Funder Analysis Report including: funding sources breakdown, success rate by agency, relationship strength assessment, diversification analysis, and recommendations for new funder targets.`,
      microsite: `Generate a public-facing Impact Advocacy Story. Focus on mission-match, community ROI, and success testimonials. Format as a self-contained data story for a general audience. Include HTML/CSS structure for a microsite.`,
      advocacy: `Generate a PR Advocacy Kit for the most recent wins. Include a draft Press Release, three social media "Impact Cards" (text-based), and a letter to a local representative highlighting community benefit.`,
    };

    const sys = `You are an expert grant management consultant generating a professional report. ${context}\n\nGRANT DETAILS:\n${grantDetails}\n\nFormat the report with clear sections, headers, and actionable insights. Use specific numbers from the data provided.`;
    const result = await API.callAI([{ role:"user", content: prompts[reportType] }], sys);
    setGenerated(result.error ? `Error: ${result.error}` : result.text);
    setLoading(false);
  };

  const generateLocal = () => {
    const awarded = grants.filter(g => ["awarded","active"].includes(g.stage));
    const pending = grants.filter(g => ["submitted","under_review"].includes(g.stage));
    const pipeline = grants.filter(g => ["discovered","researching","qualifying","preparing","drafting","reviewing"].includes(g.stage));

    const report = `═══════════════════════════════════════════
UNLESS GRANT PORTFOLIO — SUMMARY REPORT
Generated: ${new Date().toLocaleDateString()}
═══════════════════════════════════════════

EXECUTIVE SUMMARY
─────────────────
Total Grants: ${grants.length}
Total Sought: ${fmt(grants.reduce((s,g) => s + (g.amount||0), 0))}
Total Awarded: ${fmt(awarded.reduce((s,g) => s + (g.amount||0), 0))}
Win Rate: ${grants.filter(g=>["awarded","active","closeout"].includes(g.stage)).length}/${grants.filter(g=>["awarded","active","closeout","declined"].includes(g.stage)).length || 1} (${((grants.filter(g=>["awarded","active","closeout"].includes(g.stage)).length / Math.max(grants.filter(g=>["awarded","active","closeout","declined"].includes(g.stage)).length, 1)) * 100).toFixed(0)}%)

PIPELINE BREAKDOWN
──────────────────
${STAGES.map(s => {
  const ct = grants.filter(g => g.stage === s.id);
  return ct.length > 0 ? `${s.icon} ${s.label}: ${ct.length} grants — ${fmt(ct.reduce((sum,g)=>sum+(g.amount||0),0))}` : null;
}).filter(Boolean).join("\n")}

AWARDED GRANTS
──────────────
${awarded.length === 0 ? "No awards yet" : awarded.map(g => `• ${g.title} — ${fmt(g.amount||0)} (${g.agency})`).join("\n")}

PENDING DECISIONS
─────────────────
${pending.length === 0 ? "No pending applications" : pending.map(g => `• ${g.title} — ${fmt(g.amount||0)} (${g.agency})`).join("\n")}

ACTIVE PIPELINE
───────────────
${pipeline.length === 0 ? "Pipeline empty" : pipeline.map(g => `• [${STAGE_MAP[g.stage]?.label}] ${g.title} — ${fmt(g.amount||0)}`).join("\n")}

UPCOMING DEADLINES (Next 30 Days)
─────────────────────────────────
${grants.filter(g => g.deadline && daysUntil(g.deadline) >= 0 && daysUntil(g.deadline) <= 30).sort((a,b) => new Date(a.deadline) - new Date(b.deadline)).map(g => `• ${fmtDate(g.deadline)} (${daysUntil(g.deadline)}d) — ${g.title}`).join("\n") || "No upcoming deadlines"}

PROFILE: ${PROFILE.name} | ${PROFILE.loc}
BUSINESSES: ${PROFILE.businesses.filter(b=>b.st==="active").map(b=>b.n).join(", ")}`;

    setGenerated(report);
  };

  return (
    <div>
      <Card style={{ marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>📊 Report Generator</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:8, marginBottom:12 }}>
          {REPORT_TYPES.map(r => (
            <div key={r.id} onClick={() => setReportType(r.id)} style={{
              padding:12, borderRadius:6, cursor:"pointer", border:`1px solid ${reportType === r.id ? T.amber+"66" : T.border}`,
              background: reportType === r.id ? T.amber+"08" : T.panel,
            }}>
              <div style={{ fontSize:12, fontWeight:600, color: reportType === r.id ? T.amber : T.text }}>{r.label}</div>
              <div style={{ fontSize:10, color:T.mute, marginTop:4 }}>{r.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <Btn variant="primary" onClick={generateReport} disabled={loading}>{loading ? "⏳ Generating..." : "🧠 AI Report"}</Btn>
          <Btn onClick={generateLocal}>📊 Quick Report (No AI)</Btn>
        </div>
      </Card>

      {generated && (
        <Card>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <div style={{ fontSize:13, fontWeight:600, color:T.text }}>📄 Generated Report</div>
            <div style={{ display:"flex", gap:4 }}>
              {reportType === "microsite" && <Btn size="sm" variant="success" onClick={() => setShowPreview(true)}>🌐 Preview Microsite</Btn>}
              <Btn size="sm" variant="ghost" onClick={() => navigator.clipboard?.writeText(generated)}>📋 Copy</Btn>
              <Btn size="sm" variant="ghost" onClick={() => setGenerated("")}>✕ Clear</Btn>
            </div>
          </div>
          <div style={{ fontSize:12, color:T.sub, lineHeight:1.7, whiteSpace:"pre-wrap", padding:12, background:T.panel, borderRadius:6, maxHeight:600, overflow:"auto" }}>{generated}</div>
        </Card>
      )}

      {showPreview && (
        <Modal title="🌐 Impact Microsite Preview" onClose={() => setShowPreview(false)}>
          <div style={{ background: "white", padding: 0, borderRadius: 8, height: "70vh", overflow: "hidden" }}>
            <iframe
              srcDoc={generated.includes("<html") ? generated : `<html><body style="font-family:sans-serif;padding:40px;color:#333;line-height:1.6"><h1>Impact Story</h1><div style="white-space:pre-wrap">${generated}</div></body></html>`}
              style={{ width: "100%", height: "100%", border: "none" }}
              title="Microsite Preview"
            />
          </div>
          <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
            <Btn variant="primary" onClick={() => setShowPreview(false)}>Close Preview</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};
