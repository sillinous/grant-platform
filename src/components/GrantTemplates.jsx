import React, { useState } from "react";
import { T, PROFILE, uid, fmt } from "../globals";
import { Card, Badge, Btn, Progress } from "../ui";

// ════════════════════════════════════════════════════════════════════════
// MODULE: GRANT TEMPLATES
// ════════════════════════════════════════════════════════════════════════
export const GrantTemplates = ({ addGrant }) => {
  const [templates] = useState([
    { id:"sbir", name:"SBIR/STTR Phase I", icon:"🔬", agency:"SBA / NSF / NIH / DOD / DOE",
      sections:["abstract","specific_aims","significance","innovation","approach","timeline","budget","bio","facilities"],
      tips:["Focus on innovation and commercial potential","Phase I is $150K-275K for 6-12 months","Must be a small business with <500 employees","PI must be primarily employed by the company"],
      tags:["small business","innovation","technology","research"], typicalAmount:250000, typicalDuration:"6-12 months" },
    { id:"cdbg", name:"Community Development Block Grant", icon:"🏘️", agency:"HUD",
      sections:["need","goals","activities","timeline","budget","capacity","impact"],
      tips:["Must benefit low/moderate income persons (51%+)","Strong community needs data is essential","Partnership letters strengthen applications","Focus on measurable outcomes"],
      tags:["community","housing","infrastructure","low-income"], typicalAmount:500000, typicalDuration:"12-24 months" },
    { id:"usda_rbdg", name:"USDA Rural Business Development", icon:"🌾", agency:"USDA Rural Development",
      sections:["need","goals","methodology","evaluation","sustainability","budget","capacity"],
      tips:["Must serve rural areas (population <50,000)","Newton, IL qualifies as rural","Economic development focus preferred","Training and technical assistance eligible"],
      tags:["rural","business","economic development","training"], typicalAmount:100000, typicalDuration:"12 months" },
    { id:"eda", name:"EDA Economic Development", icon:"📊", agency:"Economic Development Administration",
      sections:["need","strategy","scope","budget","timeline","sustainability","outcomes"],
      tips:["Must align with regional CEDS","Strong job creation/retention metrics","Infrastructure and capacity building","Match requirement varies by program"],
      tags:["economic development","jobs","infrastructure","regional"], typicalAmount:750000, typicalDuration:"24-36 months" },
    { id:"neh", name:"NEH Digital Humanities", icon:"📚", agency:"National Endowment for the Humanities",
      sections:["abstract","narrative","work_plan","staff","budget","data_management"],
      tips:["Technology must serve humanities research","Strong interdisciplinary teams","Clear digital methodology","Open access to results preferred"],
      tags:["humanities","digital","technology","research"], typicalAmount:100000, typicalDuration:"12-36 months" },
    { id:"dol_eta", name:"DOL Workforce Innovation", icon:"👷", agency:"Department of Labor / ETA",
      sections:["need","program_design","partnerships","outcomes","sustainability","budget","management"],
      tips:["Must align with WIOA priorities","Industry partnerships strengthen proposals","Focus on underserved populations","Evidence-based program models preferred"],
      tags:["workforce","training","employment","underserved"], typicalAmount:500000, typicalDuration:"24-48 months" },
    { id:"samhsa", name:"SAMHSA Community Grant", icon:"🧠", agency:"SAMHSA",
      sections:["abstract","need","proposed_approach","staff","evaluation","budget","data_collection"],
      tips:["Evidence-based practices required","Cultural competency is critical","Must address health disparities","Community partnerships essential"],
      tags:["mental health","substance abuse","community","health"], typicalAmount:400000, typicalDuration:"12-60 months" },
    { id:"nsf_i_corps", name:"NSF I-Corps", icon:"🚀", agency:"National Science Foundation",
      sections:["abstract","team","technology","hypothesis","plan","budget"],
      tips:["Entrepreneurial team required (EL, PI, IM)","Customer discovery is the core activity","100+ customer interviews expected","$50K for 7 weeks of intensive training"],
      tags:["entrepreneurship","technology","customer discovery","startup"], typicalAmount:50000, typicalDuration:"2 months" },
  ]);

  const [selected, setSelected] = useState(null);

  const handleUseTemplate = (template) => {
    addGrant({
      id: uid(), title: `[TEMPLATE] ${template.name}`, agency: template.agency,
      amount: template.typicalAmount, stage: "preparing", description: template.tips.join("\n"),
      category: template.name, tags: template.tags, createdAt: new Date().toISOString(),
      notes: `Template: ${template.name}\nDuration: ${template.typicalDuration}\nSections: ${template.sections.join(", ")}`,
      templateId: template.id, requiredSections: template.sections,
    });
  };

  return (
    <div>
      <Card style={{ marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:4 }}>📋 Grant Application Templates</div>
        <div style={{ fontSize:11, color:T.sub }}>Pre-configured templates for common federal grant programs. Each includes required sections, expert tips, and typical award amounts. Click "Use Template" to add one to your pipeline.</div>
      </Card>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))", gap:12 }}>
        {templates.map(t => (
          <Card key={t.id} style={{ cursor:"pointer" }} onClick={() => setSelected(t.id === selected?.id ? null : t)}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
              <div>
                <div style={{ fontSize:22, marginBottom:4 }}>{t.icon}</div>
                <div style={{ fontSize:14, fontWeight:600, color:T.text }}>{t.name}</div>
                <div style={{ fontSize:11, color:T.mute }}>{t.agency}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:14, fontWeight:700, color:T.green }}>{fmt(t.typicalAmount)}</div>
                <div style={{ fontSize:10, color:T.mute }}>{t.typicalDuration}</div>
              </div>
            </div>
            <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:8 }}>
              {t.tags.map(tag => <Badge key={tag} color={T.blue}>{tag}</Badge>)}
            </div>
            {/* Profile Match Indicator */}
            {(() => {
              const matchCount = t.tags.filter(tag => PROFILE.tags.some(pt => pt.includes(tag) || tag.includes(pt.replace(/-/g," ")))).length;
              const matchPct = (matchCount / t.tags.length) * 100;
              return (
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
                  <Progress value={matchPct} max={100} color={matchPct >= 50 ? T.green : T.yellow} height={4} />
                  <span style={{ fontSize:10, color: matchPct >= 50 ? T.green : T.yellow }}>{Math.round(matchPct)}% match</span>
                </div>
              );
            })()}

            {selected?.id === t.id && (
              <div style={{ marginTop:8, paddingTop:8, borderTop:`1px solid ${T.border}` }}>
                <div style={{ fontSize:11, fontWeight:600, color:T.amber, marginBottom:6 }}>Required Sections ({t.sections.length})</div>
                <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:8 }}>
                  {t.sections.map(s => <Badge key={s} color={T.purple}>{s.replace(/_/g," ")}</Badge>)}
                </div>
                <div style={{ fontSize:11, fontWeight:600, color:T.amber, marginBottom:6 }}>Expert Tips</div>
                {t.tips.map((tip, i) => <div key={i} style={{ fontSize:11, color:T.sub, padding:"2px 0" }}>💡 {tip}</div>)}
                <Btn variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); handleUseTemplate(t); }} style={{ marginTop:8 }}>📋 Use This Template</Btn>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
