import React, { useState } from 'react';
import { Card, Btn, Progress } from '../ui';
import { T, PROFILE } from '../globals';

export const OnboardingWizard = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const TOTAL = 5;

  const steps = [
    { title:"Welcome to UNLESS", content:"UNLESS is your all-in-one grant lifecycle management platform. We'll help you discover, apply for, manage, and report on federal grants." },
    { title:"Your Profile", content:`Organization: ${PROFILE.name}\nLocation: ${PROFILE.loc}\nBusinesses: ${PROFILE.businesses.filter(b=>b.st==="active").map(b=>b.n).join(", ")}\n\nYou can update these anytime in Settings.` },
    { title:"Discovery", content:"Start by searching for grants in the Discovery module. We search Grants.gov and SAM.gov for opportunities matching your profile. You can also set up Match Alerts to be notified of new matching grants." },
    { title:"Your Pipeline", content:"Track grants through 12 lifecycle stages from Discovery to Closeout. Each grant has its own detail page where you can manage documents, contacts, tasks, and more." },
    { title:"AI Tools", content:"AI-powered tools help you draft narratives, score proposals, generate reports, build budgets, and more. Use the AI Chat Bar for quick questions or deep strategic analysis." },
  ];

  const current = steps[step - 1];

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:10000 }}>
      <Card style={{ maxWidth:500, width:"90%" }}>
        <Progress value={step} max={TOTAL} color={T.amber} height={4} />
        <div style={{ padding:24 }}>
          <div style={{ fontSize:20, fontWeight:700, color:T.amber, marginBottom:8 }}>{current.title}</div>
          <div style={{ fontSize:13, color:T.sub, lineHeight:1.8, whiteSpace:"pre-wrap", marginBottom:24 }}>{current.content}</div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:12, color:T.mute }}>{step} / {TOTAL}</span>
            <div style={{ display:"flex", gap:8 }}>
              {step > 1 && <Btn variant="ghost" onClick={() => setStep(step-1)}>← Back</Btn>}
              {step < TOTAL ? <Btn variant="primary" onClick={() => setStep(step+1)}>Next →</Btn> : <Btn variant="primary" onClick={onComplete}>🚀 Get Started</Btn>}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
