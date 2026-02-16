import React, { useState } from 'react';
import { Card, Btn, Select, TextArea } from '../ui';
import { T, PROFILE, fmt } from '../globals';
import { API } from '../api';

export const LetterGenerator = ({ grants, contacts }) => {
  const [config, setConfig] = useState({ grantId:"", contactId:"", type:"support", points:[], customPoints:"" });
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const LETTER_TYPES = [
    { id:"support", label:"Letter of Support", desc:"Shows community backing" },
    { id:"commitment", label:"Letter of Commitment", desc:"Pledges resources/partnership" },
    { id:"intent", label:"Letter of Intent", desc:"States plan to apply/collaborate" },
    { id:"match", label:"Match Certification", desc:"Confirms cost-share commitment" },
    { id:"mou", label:"MOU Draft", desc:"Memorandum of Understanding" },
  ];

  const generate = async () => {
    if (!config.grantId) return;
    setLoading(true);
    const grant = grants.find(g => g.id === config.grantId);
    const contact = (contacts || []).find(c => c.id === config.contactId);
    const sys = `You are an expert at drafting formal grant support letters. Write a professional ${LETTER_TYPES.find(t=>t.id===config.type)?.label || "Letter of Support"}.`;
    const prompt = `Draft a ${config.type} letter for:
Grant: ${grant?.title || "Unknown"}
Agency: ${grant?.agency || "Unknown"}  
Amount: ${fmt(grant?.amount || 0)}
${contact ? `From: ${contact.name}, ${contact.role} at ${contact.org}` : "From: [Organization Name]"}
Applicant: ${PROFILE.name}, ${PROFILE.loc}
Applicant businesses: ${PROFILE.businesses.filter(b=>b.st==="active").map(b=>`${b.n} (${b.d})`).join("; ")}
${config.customPoints ? `Key points to include: ${config.customPoints}` : ""}

Make it formal, specific to the project, and include a signature block.`;

    const result = await API.callAI([{ role:"user", content:prompt }], sys);
    setOutput(result.error ? `Error: ${result.error}` : result.text);
    setLoading(false);
  };

  return (
    <div>
      <Card style={{ marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>✉️ Letter of Support Generator</div>
        <div style={{ display:"grid", gap:12 }}>
          <Select value={config.grantId} onChange={v => setConfig({...config, grantId:v})}
            options={[{ value:"", label:"Select grant..." }, ...grants.map(g => ({ value:g.id, label:g.title?.slice(0,50) }))]} />
          <Select value={config.contactId} onChange={v => setConfig({...config, contactId:v})}
            options={[{ value:"", label:"Select signer (or leave blank)..." }, ...(contacts||[]).map(c => ({ value:c.id, label:`${c.name} — ${c.org}` }))]} />
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {LETTER_TYPES.map(t => (
              <Btn key={t.id} size="sm" variant={config.type === t.id ? "primary" : "default"} onClick={() => setConfig({...config, type:t.id})}>{t.label}</Btn>
            ))}
          </div>
          <TextArea value={config.customPoints} onChange={v => setConfig({...config, customPoints:v})} rows={2} placeholder="Key points to include (optional)..." />
          <Btn variant="primary" onClick={generate} disabled={loading || !config.grantId}>{loading ? "⏳ Generating..." : "✨ Generate Letter"}</Btn>
        </div>
      </Card>

      {output && (
        <Card>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <div style={{ fontSize:13, fontWeight:600, color:T.text }}>📄 Generated Letter</div>
            <div style={{ display:"flex", gap:4 }}>
              <Btn size="sm" variant="ghost" onClick={() => navigator.clipboard?.writeText(output)}>📋 Copy</Btn>
              <Btn size="sm" variant="ghost" onClick={() => setOutput("")}>✕</Btn>
            </div>
          </div>
          <div style={{ fontSize:12, color:T.sub, lineHeight:1.7, whiteSpace:"pre-wrap", padding:12, background:T.panel, borderRadius:6, maxHeight:500, overflow:"auto" }}>{output}</div>
        </Card>
      )}
    </div>
  );
};
