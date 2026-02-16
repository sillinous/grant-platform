import React, { useState } from 'react';
import { Card, Stat, Empty, Badge, Progress } from '../ui';
import { T, STAGE_MAP, pct } from '../globals';

export const ComplianceTracker = ({ grants, updateGrant }) => {
  const [selectedId, setSelectedId] = useState(null);

  const activeGrants = grants.filter(g => ["awarded", "active", "preparing", "drafting", "submitted"].includes(g.stage));

  const DEFAULT_CHECKLIST = [
    { id: "sam", label: "SAM.gov Registration Active", category: "registration", critical: true },
    { id: "uei", label: "UEI Number Obtained", category: "registration", critical: true },
    { id: "duns", label: "DUNS Number (if applicable)", category: "registration", critical: false },
    { id: "sf424", label: "SF-424 Application Form", category: "forms", critical: true },
    { id: "sf424a", label: "SF-424A Budget Form", category: "forms", critical: true },
    { id: "narrative", label: "Project Narrative Complete", category: "content", critical: true },
    { id: "budget", label: "Budget & Justification", category: "content", critical: true },
    { id: "need", label: "Statement of Need", category: "content", critical: true },
    { id: "eval", label: "Evaluation Plan", category: "content", critical: false },
    { id: "sustain", label: "Sustainability Plan", category: "content", critical: false },
    { id: "timeline", label: "Project Timeline / Milestones", category: "content", critical: true },
    { id: "letters", label: "Letters of Support/Commitment", category: "support", critical: false },
    { id: "resume", label: "Key Personnel Resumes", category: "support", critical: true },
    { id: "org_chart", label: "Organizational Chart", category: "support", critical: false },
    { id: "financial", label: "Financial Statements / Audit", category: "compliance", critical: false },
    { id: "assurances", label: "Certifications & Assurances", category: "compliance", critical: true },
    { id: "conflict", label: "Conflict of Interest Policy", category: "compliance", critical: false },
    { id: "indirect", label: "Indirect Cost Rate Agreement", category: "compliance", critical: false },
    { id: "review", label: "Internal Review Complete", category: "qa", critical: true },
    { id: "proofread", label: "Proofread & Formatted", category: "qa", critical: true },
  ];

  const getChecklist = (grant) => grant.checklist || DEFAULT_CHECKLIST.map(c => ({ ...c, done: false }));
  const getProgress = (grant) => {
    const cl = getChecklist(grant);
    return cl.length > 0 ? (cl.filter(c => c.done).length / cl.length) * 100 : 0;
  };
  const getCriticalProgress = (grant) => {
    const cl = getChecklist(grant).filter(c => c.critical);
    return cl.length > 0 ? (cl.filter(c => c.done).length / cl.length) * 100 : 0;
  };

  const toggleItem = (grantId, itemId) => {
    const grant = grants.find(g => g.id === grantId);
    if (!grant) return;
    const cl = getChecklist(grant);
    const updated = cl.map(c => c.id === itemId ? { ...c, done: !c.done } : c);
    updateGrant(grantId, { checklist: updated });
  };

  const selected = selectedId ? grants.find(g => g.id === selectedId) : null;
  const CATEGORIES = { registration: "🧙 Registration", forms: "📄 Forms", content: "📄 Content", support: "🤝 Support", compliance: "✅ Compliance", qa: "🔍 Quality" };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8, marginBottom: 16 }}>
        <Card><Stat label="Active Grants" value={activeGrants.length} color={T.blue} /></Card>
        <Card><Stat label="Fully Compliant" value={activeGrants.filter(g => getProgress(g) === 100).length} color={T.green} /></Card>
        <Card><Stat label="Need Attention" value={activeGrants.filter(g => getCriticalProgress(g) < 100).length} color={T.yellow} /></Card>
      </div>

      {activeGrants.length === 0 ? <Empty icon="✅" title="No active grants to track" sub="Compliance tracking begins when grants enter preparation" /> :
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 16 }}>
          {/* Grant List */}
          <div>
            {activeGrants.map(g => {
              const prog = getProgress(g);
              const critProg = getCriticalProgress(g);
              return (
                <Card key={g.id} onClick={() => setSelectedId(g.id)} style={{ marginBottom: 8, cursor: "pointer", borderColor: selectedId === g.id ? T.amber + "66" : T.border }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 4 }}>{g.title?.slice(0, 35)}</div>
                  <div style={{ fontSize: 10, color: T.mute, marginBottom: 6 }}>{STAGE_MAP[g.stage]?.icon} {STAGE_MAP[g.stage]?.label}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.sub, marginBottom: 3 }}>
                    <span>Overall</span><span style={{ color: prog === 100 ? T.green : T.yellow }}>{pct(prog)}</span>
                  </div>
                  <Progress value={prog} max={100} color={prog === 100 ? T.green : T.amber} height={4} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.sub, marginBottom: 3, marginTop: 4 }}>
                    <span>Critical</span><span style={{ color: critProg === 100 ? T.green : T.red }}>{pct(critProg)}</span>
                  </div>
                  <Progress value={critProg} max={100} color={critProg === 100 ? T.green : T.red} height={4} />
                </Card>
              );
            })}
          </div>

          {/* Checklist Detail */}
          <Card>
            {!selected ? <div style={{ color: T.mute, fontSize: 12, textAlign: "center", padding: 40 }}>Select a grant to view checklist</div> :
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 12 }}>{selected.title?.slice(0, 50)}</div>
                {Object.entries(CATEGORIES).map(([catId, catLabel]) => {
                  const items = getChecklist(selected).filter(c => c.category === catId);
                  if (items.length === 0) return null;
                  return (
                    <div key={catId} style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.amber, marginBottom: 6 }}>{catLabel}</div>
                      {items.map(item => (
                        <div key={item.id} onClick={() => toggleItem(selected.id, item.id)} style={{
                          display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 4, cursor: "pointer",
                          background: item.done ? T.green + "08" : "transparent", marginBottom: 2,
                        }}>
                          <span style={{ fontSize: 14, color: item.done ? T.green : T.mute }}>{item.done ? "☑️" : "☐"}</span>
                          <span style={{ fontSize: 12, color: item.done ? T.sub : T.text, textDecoration: item.done ? "line-through" : "none", flex: 1 }}>{item.label}</span>
                          {item.critical && <Badge color={T.red} style={{ fontSize: 9 }}>CRITICAL</Badge>}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            }
          </Card>
        </div>
      }
    </div>
  );
};

