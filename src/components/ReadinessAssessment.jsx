import React, { useState } from 'react';
import { Card, Btn, Progress, Badge, Stat } from '../ui';
import { T, PROFILE } from '../globals';
import { API } from '../api';
import { useStore } from '../store';

export const ReadinessAssessment = () => {
  const { grants, vaultDocs, contacts } = useStore();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(false);

  const runAssessment = async () => {
    setLoading(true);
    const checks = [];
    // Profile completeness
    if (PROFILE.name) checks.push({ cat:"Profile", item:"Organization Name", status:true });
    else checks.push({ cat:"Profile", item:"Organization Name", status:false, fix:"Set organization name in profile" });
    if (PROFILE.loc) checks.push({ cat:"Profile", item:"Location", status:true });
    else checks.push({ cat:"Profile", item:"Location", status:false, fix:"Set location in profile" });
    if (PROFILE.duns) checks.push({ cat:"Profile", item:"DUNS/UEI Number", status:true });
    else checks.push({ cat:"Profile", item:"DUNS/UEI Number", status:false, fix:"Register for a UEI at SAM.gov" });
    if (PROFILE.ein) checks.push({ cat:"Profile", item:"EIN / Tax ID", status:true });
    else checks.push({ cat:"Profile", item:"EIN / Tax ID", status:false, fix:"Add your EIN in Settings" });
    if (PROFILE.cage) checks.push({ cat:"Profile", item:"CAGE Code", status:true });
    else checks.push({ cat:"Profile", item:"CAGE Code", status:false, fix:"CAGE code is assigned during SAM.gov registration" });
    // Pipeline
    if (grants.length > 0) checks.push({ cat:"Pipeline", item:"Grants Tracked", status:true });
    else checks.push({ cat:"Pipeline", item:"Grants Tracked", status:false, fix:"Add grants to your pipeline via Discovery" });
    if (grants.some(g=>g.deadline)) checks.push({ cat:"Pipeline", item:"Deadlines Set", status:true });
    else checks.push({ cat:"Pipeline", item:"Deadlines Set", status:false, fix:"Add deadlines to your grants" });
    // Documents
    if ((vaultDocs||[]).length > 0) checks.push({ cat:"Documents", item:"Document Vault", status:true });
    else checks.push({ cat:"Documents", item:"Document Vault", status:false, fix:"Upload org docs in Document Vault" });
    // Contacts
    if ((contacts||[]).length > 0) checks.push({ cat:"Network", item:"Contacts", status:true });
    else checks.push({ cat:"Network", item:"Contacts", status:false, fix:"Add contacts in Relationship Map" });
    // Businesses
    const activeBiz = PROFILE.businesses?.filter(b=>b.st==="active") || [];
    if (activeBiz.length > 0) checks.push({ cat:"Profile", item:"Active Business", status:true });
    else checks.push({ cat:"Profile", item:"Active Business", status:false, fix:"Add business details in Settings" });

    // Fintech Integration
    const fortunaLinked = API.fortuna.isLinked();
    if (fortunaLinked) {
      checks.push({ cat: "Fintech", item: "Fortuna Connection", status: true });
      const health = await API.fortuna.getFinancialHealth();
      if (health && health.score >= 80) checks.push({ cat: "Fintech", item: "Financial Health (>80)", status: true });
      else checks.push({ cat: "Fintech", item: "Financial Health (>80)", status: false, fix: "Improve liquidity ratio to boost score" });
    } else {
      checks.push({ cat: "Fintech", item: "Fortuna Connection", status: false, fix: "Link Fortuna account for automated audit" });
    }

    const passed = checks.filter(c => c.status).length;
    const total = checks.length;
    const score = Math.round((passed / total) * 100);

    setAssessment({ checks, passed, total, score });
    setLoading(false);
  };

  const categories = assessment ? [...new Set(assessment.checks.map(c => c.cat))] : [];

  return (
    <div>
      <Card style={{ marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:8 }}>🎯 Grant Readiness Assessment</div>
        <div style={{ fontSize:11, color:T.sub, marginBottom:12 }}>Check if your organization has the essential elements in place to successfully apply for and manage federal grants.</div>
        <Btn variant="primary" onClick={runAssessment} disabled={loading}>{loading ? "⏳ Assessing..." : "🔍 Run Assessment"}</Btn>
      </Card>

      {assessment && (
        <div>
          <Card style={{ marginBottom:16 }} glow={assessment.score === 100}>
            <div style={{ display:"flex", alignItems:"center", gap:16 }}>
              <div style={{ fontSize:48, fontWeight:700, color: assessment.score >= 80 ? T.green : assessment.score >= 50 ? T.yellow : T.red }}>{assessment.score}%</div>
              <div>
                <div style={{ fontSize:14, fontWeight:600, color:T.text }}>Grant Readiness Score</div>
                <div style={{ fontSize:12, color:T.sub }}>{assessment.passed}/{assessment.total} requirements met</div>
                <Progress value={assessment.passed} max={assessment.total} color={assessment.score >= 80 ? T.green : T.yellow} height={8} />
              </div>
            </div>
          </Card>

          {categories.map(cat => (
            <Card key={cat} style={{ marginBottom:8 }}>
              <div style={{ fontSize:12, fontWeight:600, color:T.text, marginBottom:8 }}>{cat}</div>
              {assessment.checks.filter(c => c.cat === cat).map((c, i) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:`1px solid ${T.border}` }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ color: c.status ? T.green : T.red, fontSize:14 }}>{c.status ? "✅" : "❌"}</span>
                    <span style={{ fontSize:12, color:T.text }}>{c.item}</span>
                  </div>
                  {!c.status && <span style={{ fontSize:10, color:T.mute }}>{c.fix}</span>}
                </div>
              ))}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
