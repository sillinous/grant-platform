import React, { useState } from 'react';
import { Card, Input, Btn, Badge, Progress } from '../ui';
import { T, PROFILE } from '../globals';
import { API } from '../api';

export const SAMWizard = () => {
  const [step, setStep] = useState(1);
  const [ueiSearch, setUeiSearch] = useState("");
  const [entity, setEntity] = useState(null);
  const [loading, setLoading] = useState(false);

  const searchEntity = async () => {
    if (!ueiSearch.trim()) return;
    setLoading(true);
    try {
      const data = await API.searchSAMEntities(ueiSearch);
      const entities = data.entityData || [];
      if (entities.length > 0) {
        const e = entities[0];
        setEntity({
          name: e.entityRegistration?.legalBusinessName || "",
          uei: e.entityRegistration?.ueiSAM || "",
          status: e.entityRegistration?.registrationStatus || "",
          expiration: e.entityRegistration?.registrationExpirationDate || "",
          cage: e.entityRegistration?.cageCode || "",
          address: e.coreData?.physicalAddress || {},
          types: e.entityRegistration?.businessTypes || [],
          naics: (e.assertions?.naicsCode || []).map(n => `${n.naicsCode} ${n.naicsDesc || ""}`),
        });
      }
    } catch {}
    setLoading(false);
  };

  const STEPS = [
    { n:1, label:"Check Registration", desc:"Search for your entity in SAM.gov" },
    { n:2, label:"Registration Status", desc:"Review your current status" },
    { n:3, label:"Requirements Checklist", desc:"Ensure all requirements are met" },
    { n:4, label:"Certifications", desc:"Small business and other certs" },
  ];

  const REQS = [
    { label:"UEI Number", done: !!PROFILE.duns, tip:"Unique Entity ID — required for all federal grants" },
    { label:"CAGE Code", done: !!PROFILE.cage, tip:"Commercial and Government Entity code" },
    { label:"EIN / Tax ID", done: !!PROFILE.ein, tip:"Employer Identification Number from IRS" },
    { label:"SAM.gov Registration", done: !!entity?.status, tip:"Must be active in SAM.gov to receive federal awards" },
    { label:"Annual Renewal", done: entity?.expiration && new Date(entity.expiration) > new Date(), tip:"SAM.gov registration must be renewed annually" },
    { label:"Banking Information", done: false, tip:"ACH banking details for electronic funds transfer" },
    { label:"E-Business POC", done: false, tip:"Electronic Business Point of Contact in SAM.gov" },
    { label:"Grants.gov Registration", done: false, tip:"Must be registered in Grants.gov to submit applications" },
  ];

  const completedReqs = REQS.filter(r => r.done).length;
  const isHealthy = entity?.status === "Active" && new Date(entity.expiration) > new Date();
  const daysNear = entity?.expiration ? Math.ceil((new Date(entity.expiration) - new Date()) / (1000 * 60 * 60 * 24)) : null;

  const trustScore = Math.round((completedReqs / REQS.length) * 100);

  const exportEvidence = () => {
    const content = `COMPLIANCE AUDIT REPORT\nGenerated: ${new Date().toISOString()}\n\nEntity: ${entity?.name || "N/A"}\nUEI: ${entity?.uei || "N/A"}\nStatus: ${entity?.status || "N/A"}\nExpiration: ${entity?.expiration || "N/A"}\n\nCompliance Score: ${trustScore}%\nCompleted Requirements: ${completedReqs}/${REQS.length}\n\nVerified via GrantPlatform Strategic Sentinel.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `compliance_audit_${entity?.uei || "org"}.txt`;
    link.click();
  };

  return (
    <div>
      <Card style={{ marginBottom: 16, borderLeft: daysNear !== null && daysNear < 60 ? `4px solid ${T.red}` : "none" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>🏛️ SAM.gov Registration Wizard</div>
            {isHealthy && <Badge color={T.green}>✅ Verified</Badge>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 9, color: T.mute, textTransform: "uppercase", fontWeight: 700 }}>Trust Score</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: trustScore > 80 ? T.green : trustScore > 50 ? T.amber : T.red }}>{trustScore}%</div>
            </div>
            <Btn variant="ghost" size="xs" onClick={exportEvidence} disabled={!entity}>📥 Export Evidence</Btn>
          </div>
        </div>

        {daysNear !== null && daysNear < 60 && (
          <div style={{ background: T.red + "15", padding: "8px 12px", borderRadius: 4, marginBottom: 12, border: `1px solid ${T.red}33` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.red }}>🚨 REGISTRATION EXPIRES IN {daysNear} DAYS</div>
            <div style={{ fontSize: 10, color: T.sub }}>Renewal processes can take 4-6 weeks. Initiate renewal immediately to avoid funding gaps.</div>
          </div>
        )}

        <div style={{ display:"flex", gap:4, marginBottom:12 }}>
          {STEPS.map(s => (
            <div key={s.n} onClick={() => setStep(s.n)} style={{
              flex:1, padding:8, borderRadius:4, cursor:"pointer", textAlign:"center",
              background: step === s.n ? T.amber+"15" : T.panel,
              borderBottom: step === s.n ? `2px solid ${T.amber}` : `2px solid transparent`,
            }}>
              <div style={{ fontSize:11, fontWeight:600, color: step === s.n ? T.amber : T.mute }}>Step {s.n}</div>
              <div style={{ fontSize:10, color:T.sub }}>{s.label}</div>
            </div>
          ))}
        </div>
        <Progress value={step} max={4} color={T.amber} height={4} />
      </Card>

      {step === 1 && (
        <Card>
          <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>🔍 Search SAM.gov Registration</div>
          <div style={{ fontSize:11, color:T.sub, marginBottom:12 }}>Enter your UEI, CAGE code, or organization name to check your SAM.gov registration status.</div>
          <div style={{ display:"flex", gap:8 }}>
            <Input value={ueiSearch} onChange={setUeiSearch} placeholder="UEI, CAGE code, or org name..." style={{ flex:1 }} onKeyDown={e => e.key === "Enter" && searchEntity()} />
            <Btn variant="primary" onClick={searchEntity} disabled={loading}>{loading ? "⏳" : "🔍"} Search</Btn>
          </div>
          {entity && (
            <div style={{ marginTop:16, padding:12, background:T.panel, borderRadius:6 }}>
              <div style={{ fontSize:14, fontWeight:600, color:T.text }}>{entity.name}</div>
              <div style={{ display:"flex", gap:4, marginTop:8 }}>
                <Badge color={entity.status === "Active" ? T.green : T.red}>{entity.status}</Badge>
                <Badge color={T.blue}>UEI: {entity.uei}</Badge>
                {entity.cage && <Badge color={T.purple}>CAGE: {entity.cage}</Badge>}
              </div>
              {entity.expiration && <div style={{ fontSize:11, color:T.mute, marginTop:8 }}>Expires: {entity.expiration}</div>}
              <Btn size="sm" variant="primary" onClick={() => setStep(2)} style={{ marginTop:12 }}>Continue →</Btn>
            </div>
          )}
        </Card>
      )}

      {step === 2 && (
        <Card>
          <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>📋 Registration Status</div>
          {entity ? (
            <div>
              <div style={{ padding:12, background:T.panel, borderRadius:6, marginBottom:12 }}>
                <div style={{ fontSize:14, fontWeight:600, color:T.text }}>{entity.name}</div>
                <div style={{ marginTop:8 }}>
                  <div style={{ fontSize:12 }}><strong style={{ color:T.sub }}>UEI:</strong> <span style={{ color:T.text }}>{entity.uei}</span></div>
                  <div style={{ fontSize:12 }}><strong style={{ color:T.sub }}>CAGE:</strong> <span style={{ color:T.text }}>{entity.cage || "Not assigned"}</span></div>
                  <div style={{ fontSize:12 }}><strong style={{ color:T.sub }}>Status:</strong> <Badge color={entity.status === "Active" ? T.green : T.red}>{entity.status}</Badge></div>
                  <div style={{ fontSize:12 }}><strong style={{ color:T.sub }}>Expires:</strong> <span style={{ color:T.text }}>{entity.expiration || "Unknown"}</span></div>
                </div>
                {entity.naics.length > 0 && (
                  <div style={{ marginTop:8 }}>
                    <div style={{ fontSize:11, fontWeight:600, color:T.sub }}>NAICS Codes:</div>
                    {entity.naics.slice(0,5).map((n,i) => <div key={i} style={{ fontSize:10, color:T.mute }}>{n}</div>)}
                  </div>
                )}
              </div>
              <Btn size="sm" variant="primary" onClick={() => setStep(3)}>Continue to Checklist →</Btn>
            </div>
          ) : <div style={{ color:T.mute, fontSize:12 }}>Search for your entity first in Step 1</div>}
        </Card>
      )}

      {step === 3 && (
        <Card>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div style={{ fontSize:13, fontWeight:600, color:T.text }}>✅ Requirements Checklist</div>
            <Badge color={completedReqs === REQS.length ? T.green : T.yellow}>{completedReqs}/{REQS.length} Complete</Badge>
          </div>
          <Progress value={completedReqs} max={REQS.length} color={completedReqs === REQS.length ? T.green : T.yellow} height={6} />
          <div style={{ marginTop:12 }}>
            {REQS.map((r, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 0", borderBottom:`1px solid ${T.border}` }}>
                <span style={{ color: r.done ? T.green : T.red, fontSize:16 }}>{r.done ? "✅" : "⬜"}</span>
                <div>
                  <div style={{ fontSize:12, fontWeight:600, color: r.done ? T.green : T.text }}>{r.label}</div>
                  <div style={{ fontSize:10, color:T.mute }}>{r.tip}</div>
                </div>
              </div>
            ))}
          </div>
          <Btn size="sm" variant="primary" onClick={() => setStep(4)} style={{ marginTop:12 }}>Continue →</Btn>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>📜 Small Business Certifications</div>
          <div style={{ fontSize:11, color:T.sub, marginBottom:12 }}>These certifications can give you competitive advantages in federal contracting and some grant programs.</div>
          {[
            { label:"8(a) Business Development", desc:"For small disadvantaged businesses", link:"https://www.sba.gov/8a" },
            { label:"HUBZone", desc:"Historically Underutilized Business Zones", link:"https://www.sba.gov/hubzone" },
            { label:"Service-Disabled Veteran-Owned (SDVOSB)", desc:"For veteran-owned businesses", link:"https://www.sba.gov/sdvosb" },
            { label:"Women-Owned Small Business (WOSB)", desc:"For women-owned businesses", link:"https://www.sba.gov/wosb" },
            { label:"Economically Disadvantaged WOSB (EDWOSB)", desc:"For economically disadvantaged women-owned businesses", link:"" },
            { label:"Small Disadvantaged Business (SDB)", desc:"Self-certification for socially/economically disadvantaged", link:"" },
          ].map((cert, i) => (
            <div key={i} style={{ padding:"8px 0", borderBottom:`1px solid ${T.border}` }}>
              <div style={{ fontSize:12, fontWeight:600, color:T.text }}>{cert.label}</div>
              <div style={{ fontSize:10, color:T.mute }}>{cert.desc}</div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};
