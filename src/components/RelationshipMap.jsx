import React, { useState, useMemo } from 'react';
import { Card, Btn, Badge, Input, Select, TextArea, Tab, Progress, Empty, Modal } from '../ui';
import { T, uid, fmt, STAGE_MAP } from '../globals';

export const RelationshipMap = ({ grants, contacts, setContacts }) => {
  const [view, setView] = useState("network");
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", org: "", role: "", email: "", type: "funder", notes: "", grantIds: [] });

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
        <Btn variant="primary" size="sm" onClick={() => setShowAddContact(true)}>+ Add Contact</Btn>
      </div>

      {view === "network" && (
        <div>
          {agencies.length === 0 ? <Empty icon="🕸️" title="No agency data yet" sub="Add grants to build your funder network" /> :
            agencies.map(a => (
              <Card key={a.name} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{a.name}</div>
                    <div style={{ fontSize: 11, color: T.mute, marginTop: 2 }}>{a.grants.length} grant{a.grants.length > 1 ? "s" : ""} · {a.contacts.length} contact{a.contacts.length > 1 ? "s" : ""}</div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: T.green }}>{fmt(a.totalAmount)}</div>
                </div>
                <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
                  {a.grants.map(g => (
                    <Badge key={g.id} color={STAGE_MAP[g.stage]?.color || T.mute}>{STAGE_MAP[g.stage]?.icon} {g.title?.slice(0, 25)}</Badge>
                  ))}
                </div>
                {a.contacts.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    {a.contacts.map(c => (
                      <div key={c.id} style={{ fontSize: 11, color: T.sub, padding: 2 }}>👤 {c.name} — {c.role}</div>
                    ))}
                  </div>
                )}
              </Card>
            ))
          }
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
        <div>
          <Card style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>🔑 Funder Diversity</div>
            <div style={{ fontSize: 12, color: T.sub, marginBottom: 8 }}>
              You're connected to <strong style={{ color: T.amber }}>{agencies.length}</strong> unique agencies.
              {agencies.length < 5 ? " Consider diversifying your funder base to reduce risk." : " Good funder diversification."}
            </div>
            <Progress value={Math.min(agencies.length, 10)} max={10} color={agencies.length >= 5 ? T.green : T.yellow} />
          </Card>
          <Card style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>📊 Relationship Strength</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: T.blue }}>{contactList.filter(c => c.type === "program_officer").length}</div>
                <div style={{ fontSize: 11, color: T.mute }}>Program Officers</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: T.purple }}>{contactList.filter(c => c.type === "partner").length}</div>
                <div style={{ fontSize: 11, color: T.mute }}>Partners</div>
              </div>
            </div>
          </Card>
          <Card>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>💡 Recommendations</div>
            <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.6 }}>
              {contactList.length < 3 && <div>• Build your contact network — aim for at least 3 program officers</div>}
              {agencies.filter(a => a.contacts.length === 0).length > 0 && <div>• Add contacts for: {agencies.filter(a => a.contacts.length === 0).map(a => a.name).join(", ")}</div>}
              {grants.filter(g => g.stage === "declined").length > 0 && <div>• Review declined grants and reach out to program officers for feedback</div>}
              {contactList.length >= 5 && <div>• Strong network! Consider nurturing existing relationships with regular check-ins</div>}
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
    </div>
  );
};

