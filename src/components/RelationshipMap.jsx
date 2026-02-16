import React, { useState, useMemo } from 'react';
import { Card, Btn, Badge, Input, Select, TextArea, Tab, Progress, Empty, Modal } from '../ui';
import { T, uid, fmt, STAGE_MAP, PROFILE } from '../globals';
import { API } from '../api';

export const RelationshipMap = ({ grants, contacts, setContacts }) => {
  const [view, setView] = useState("network");
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", org: "", role: "", email: "", type: "funder", notes: "", grantIds: [] });
  const [showTeaming, setShowTeaming] = useState(false);
  const [selectedGrantId, setSelectedGrantId] = useState("");
  const [teamingResult, setTeamingResult] = useState(null);
  const [pathfindResult, setPathfindResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const contactList = contacts || [];

  // Build relationship data
  const agencies = useMemo(() => {
    const map = {};
    grants.forEach(g => {
      const agency = g.agency || "Unknown";
      if (!map[agency]) map[agency] = { name: agency, grants: [], totalAmount: 0, contacts: [] };
      map[agency].grants.push(g);
      map[agency].totalAmount += g.amount || 0;
    });
    contactList.forEach(c => {
      if (c.org && map[c.org]) map[c.org].contacts.push(c);
    });
    return Object.values(map).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [grants, contactList]);

  const addContact = () => {
    if (!newContact.name) return;
    setContacts([...contactList, { ...newContact, id: uid(), createdAt: new Date().toISOString() }]);
    setNewContact({ name: "", org: "", role: "", email: "", type: "funder", notes: "", grantIds: [] });
    setShowAddContact(false);
  };

  const deleteContact = (id) => setContacts(contactList.filter(c => c.id !== id));

  const runTeamingStrategy = async () => {
    if (!selectedGrantId) return;
    setLoading(true);
    const grant = grants.find(g => g.id === selectedGrantId);
    const sys = `You are a Senior Strategic Partnerships Consultant. Analyze this grant opportunity and provide a Teaming Strategy. Return a structured report.`;
    const result = await API.callAI([{ role: "user", content: `Grant: ${grant?.title}` }], sys);
    if (!result.error) setTeamingResult(result.text);
    setLoading(false);
  };

  const runPathfinder = async (agencyName) => {
    setLoading(true);
    const agency = agencies.find(a => a.name === agencyName);
    const sys = `You are a Relationship Intelligence Specialist. Analyze the path to ${agencyName}.
Contacts at this Agency: ${agency.contacts.map(c => c.name).join(", ")}
Our Win Count here: ${agency.grants.filter(g => g.stage === "awarded").length}

Provide the 'Most Strategic Path' to secure a meeting with a Program Officer. Mention specific contacts if available.`;
    const result = await API.callAI([{ role: "user", content: "Find the path." }], sys);
    if (!result.error) setPathfindResult({ agency: agencyName, text: result.text });
    setLoading(false);
  };

  const CONTACT_TYPES = [
    { id: "funder", label: "💰 Funder", color: T.green },
    { id: "program_officer", label: "👤 Program Officer", color: T.blue },
    { id: "partner", label: "🤝 Partner", color: T.purple },
    { id: "reviewer", label: "👁️ Reviewer", color: T.yellow },
    { id: "mentor", label: "🎓 Mentor", color: T.amber },
    { id: "other", label: "📎 Other", color: T.mute },
  ];
  const typeMap = Object.fromEntries(CONTACT_TYPES.map(t => [t.id, t]));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Tab tabs={[
          { id: "network", icon: "🕸️", label: "Agency Network" },
          { id: "contacts", icon: "👥", label: "Contacts CRM" },
          { id: "insights", icon: "💡", label: "Insights" },
        ]} active={view} onChange={setView} />
        <div style={{ display: "flex", gap: 6 }}>
          <Btn variant="ghost" size="sm" onClick={() => setShowTeaming(true)}>✨ Teaming Intelligence</Btn>
          <Btn variant="primary" size="sm" onClick={() => setShowAddContact(true)}>+ Add Contact</Btn>
        </div>
      </div>

      {view === "network" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 8, height: "fit-content" }}>
            {agencies.length === 0 ? <Empty icon="🕸️" title="No agency data yet" sub="Add grants to build your funder network" /> :
              agencies.map(a => (
                <Card key={a.name} style={{ marginBottom: 0, position: "relative" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{a.name}</div>
                      <div style={{ fontSize: 10, color: T.mute, marginTop: 2 }}>{a.grants.length} grants · {a.contacts.length} contacts</div>
                    </div>
                    <Btn size="xs" variant="ghost" onClick={() => runPathfinder(a.name)} disabled={loading}>🎯 Path</Btn>
                  </div>
                  <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
                    {a.grants.map(g => (
                      <div key={g.id} style={{ width: 6, height: 6, borderRadius: "50%", background: STAGE_MAP[g.stage]?.color || T.mute }} title={g.title} />
                    ))}
                  </div>
                  {a.contacts.length > 0 && (
                    <div style={{ marginTop: 8, borderTop: `1px solid ${T.border}`, paddingTop: 6 }}>
                      {a.contacts.slice(0, 2).map(c => (
                        <div key={c.id} style={{ fontSize: 10, color: T.sub, marginBottom: 2 }}>👤 {c.name}</div>
                      ))}
                      {a.contacts.length > 2 && <div style={{ fontSize: 9, color: T.dim }}>+ {a.contacts.length - 2} more</div>}
                    </div>
                  )}
                </Card>
              ))
            }
          </div>

          <div style={{ position: "sticky", top: 0 }}>
            {pathfindResult ? (
              <Card style={{ background: T.panel + "22", borderColor: T.amber + "33" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.amber }}>🗺️ Intelligence Path: {pathfindResult.agency}</div>
                  <button onClick={() => setPathfindResult(null)} style={{ background: "none", border: "none", color: T.mute, cursor: "pointer" }}>✕</button>
                </div>
                <div style={{ fontSize: 11, color: T.sub, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{pathfindResult.text}</div>
                <Btn size="sm" variant="ghost" style={{ width: "100%", marginTop: 12 }} onClick={() => { navigator.clipboard?.writeText(pathfindResult.text); alert("📋 Path copied!"); }}>📋 Copy Intel</Btn>
              </Card>
            ) : (
              <Card style={{ textAlign: "center", opacity: 0.6 }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>🎯</div>
                <div style={{ fontSize: 12, color: T.mute }}>Select <strong>Path</strong> on an agency card to determine the best relationship strategy.</div>
              </Card>
            )}
          </div>
        </div>
      )}

      {view === "contacts" && (
        <div>
          {contactList.length === 0 ? <Empty icon="👥" title="No contacts yet" sub="Add program officers, partners, and mentors" action={<Btn variant="primary" size="sm" onClick={() => setShowAddContact(true)}>+ Add Contact</Btn>} /> :
            contactList.map(c => (
              <Card key={c.id} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: T.mute }}>{c.org}{c.role ? ` · ${c.role}` : ""}</div>
                    {c.email && <div style={{ fontSize: 11, color: T.blue, marginTop: 2 }}>{c.email}</div>}
                    {c.notes && <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>{c.notes}</div>}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Badge color={typeMap[c.type]?.color || T.mute}>{typeMap[c.type]?.label || c.type}</Badge>
                    <button onClick={() => deleteContact(c.id)} style={{ background: "none", border: "none", color: T.red, cursor: "pointer", fontSize: 14 }}>✕</button>
                  </div>
                </div>
              </Card>
            ))
          }
        </div>
      )}

      {view === "insights" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          <Card>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>🔑 Funder Diversity</div>
            <div style={{ fontSize: 12, color: T.sub, marginBottom: 8 }}>
              Connected to <strong style={{ color: T.amber }}>{agencies.length}</strong> unique agencies.
              {agencies.length < 5 ? " Consider diversifying." : " Good diversification."}
            </div>
            <Progress value={Math.min(agencies.length, 10)} max={10} color={agencies.length >= 5 ? T.green : T.yellow} />
          </Card>
          <Card>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>📊 Agency Penetration</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: T.blue }}>{contactList.filter(c => c.type === "program_officer").length}</div>
                <div style={{ fontSize: 11, color: T.mute }}>Officers</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: T.purple }}>{contactList.filter(c => c.type === "partner").length}</div>
                <div style={{ fontSize: 11, color: T.mute }}>Partners</div>
              </div>
            </div>
          </Card>
          <Card>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>💡 Recommendations</div>
            <div style={{ fontSize: 10, color: T.sub, lineHeight: 1.6 }}>
              {contactList.length < 3 && <div>• Build your contact network.</div>}
              {agencies.filter(a => a.contacts.length === 0).length > 0 && <div>• Add contacts for: {agencies.filter(a => a.contacts.length === 0).map(a => a.name.slice(0, 10)).join(", ")}...</div>}
              {grants.filter(g => g.stage === "declined").length > 0 && <div>• Reach out for feedback on declines.</div>}
            </div>
          </Card>
        </div>
      )}

      <Modal open={showAddContact} onClose={() => setShowAddContact(false)} title="Add Contact">
        <div style={{ display: "grid", gap: 12 }}>
          <Input value={newContact.name} onChange={v => setNewContact({ ...newContact, name: v })} placeholder="Full name" />
          <Input value={newContact.org} onChange={v => setNewContact({ ...newContact, org: v })} placeholder="Organization" />
          <Input value={newContact.role} onChange={v => setNewContact({ ...newContact, role: v })} placeholder="Role / Title" />
          <Input value={newContact.email} onChange={v => setNewContact({ ...newContact, email: v })} placeholder="Email" />
          <Select value={newContact.type} onChange={v => setNewContact({ ...newContact, type: v })} options={CONTACT_TYPES.map(t => ({ value: t.id, label: t.label }))} />
          <TextArea value={newContact.notes} onChange={v => setNewContact({ ...newContact, notes: v })} rows={2} placeholder="Notes..." />
          <Btn variant="primary" onClick={addContact}>Add Contact</Btn>
        </div>
      </Modal>

      <Modal open={showTeaming} onClose={() => setShowTeaming(false)} title="🤝 AI Teaming Intelligence" width={800}>
        {!teamingResult ? (
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ fontSize: 12, color: T.sub }}>Select a grant opportunity to generate a tailored partnership strategy.</div>
            <Select value={selectedGrantId} onChange={setSelectedGrantId} options={[{ value: "", label: "Select a grant..." }, ...grants.map(g => ({ value: g.id, label: g.title?.slice(0, 60) }))]} />
            <Btn variant="primary" onClick={runTeamingStrategy} disabled={loading || !selectedGrantId}>{loading ? "⏳ Analyzing Strategy..." : "🚀 Generate Strategy"}</Btn>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 12, lineHeight: 1.7, color: T.text, whiteSpace: "pre-wrap", background: T.panel, padding: 16, borderRadius: 8, maxHeight: 500, overflow: "auto", border: `1px solid ${T.border}` }}>
              {teamingResult}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
              <Btn size="sm" variant="ghost" onClick={() => setTeamingResult(null)}>← Select Another Grant</Btn>
              <Btn size="sm" variant="primary" onClick={() => { navigator.clipboard?.writeText(teamingResult); alert("📋 Strategy copied!"); }}>📋 Copy Strategy</Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};


