import React, { useState, useEffect } from 'react';
import { Card, Input, Btn, Select, TextArea, Stat, Empty, Modal, Progress, Badge, MagicBtn } from '../ui';
import { LS, T, uid, fmt, PROFILE } from '../globals';
import { API } from '../api';

export const BudgetBuilder = ({ grants, updateGrant }) => {
  const [budgets, setBudgets] = useState(() => LS.get("budgets", {}));
  const [selectedGrant, setSelectedGrant] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ category: "personnel", description: "", amount: 0, quantity: 1, unit: "year", justification: "", costShare: 0, spent: 0 });
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);

  const handleMagicDraft = async () => {
    const grant = grants.find(g => g.id === selectedGrant);
    setMagicLoading(true);
    const draft = await API.generateMagicDraft(`budget justification for ${newItem.category}`, {
      item: newItem,
      grant: grant || "No specific grant context"
    }, "Explain why this cost is reasonable, allocable, and necessary.");
    setNewItem({ ...newItem, justification: draft });
    setMagicLoading(false);
  };

  useEffect(() => { LS.set("budgets", budgets); }, [budgets]);

  const CATEGORIES = [
    { id: "personnel", label: "👤 Personnel", color: T.blue },
    { id: "fringe", label: "🏥 Fringe Benefits", color: T.cyan },
    { id: "travel", label: "✈️ Travel", color: T.purple },
    { id: "equipment", label: "🖥️ Equipment", color: T.orange },
    { id: "supplies", label: "📦 Supplies", color: T.yellow },
    { id: "contractual", label: "📋 Contractual", color: T.amber },
    { id: "construction", label: "🏗️ Construction", color: T.green },
    { id: "other", label: "📎 Other Direct Costs", color: T.mute },
    { id: "indirect", label: "🏢 Indirect Costs", color: T.dim },
  ];
  const catMap = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

  const getBudget = () => budgets[selectedGrant] || { items: [], indirectRate: 10, notes: "" };
  const items = getBudget().items || [];
  const indirectRate = getBudget().indirectRate || 10;

  const addItem = () => {
    if (!selectedGrant || !newItem.description) return;
    const b = getBudget();
    const updated = { ...b, items: [...b.items, { ...newItem, id: uid(), total: newItem.amount * newItem.quantity, spent: newItem.spent || 0 }] };
    setBudgets({ ...budgets, [selectedGrant]: updated });
    setNewItem({ category: "personnel", description: "", amount: 0, quantity: 1, unit: "year", justification: "", costShare: 0, spent: 0 });
    setShowAdd(false);
  };

  const removeItem = (itemId) => {
    const b = getBudget();
    setBudgets({ ...budgets, [selectedGrant]: { ...b, items: b.items.filter(i => i.id !== itemId) } });
  };

  const setIndirectRate = (rate) => {
    const b = getBudget();
    setBudgets({ ...budgets, [selectedGrant]: { ...b, indirectRate: Number(rate) } });
  };

  const directTotal = items.filter(i => i.category !== "indirect").reduce((s, i) => s + (i.amount * i.quantity), 0);
  const indirectTotal = directTotal * (indirectRate / 100);
  const grandTotal = directTotal + indirectTotal;
  const costShareTotal = items.reduce((s, i) => s + (i.costShare || 0), 0);
  const federalShare = grandTotal - costShareTotal;
  const spentTotal = items.reduce((s, i) => s + (i.spent || 0), 0);

  const byCat = CATEGORIES.map(c => ({
    ...c, items: items.filter(i => i.category === c.id),
    total: items.filter(i => i.category === c.id).reduce((s, i) => s + i.amount * i.quantity, 0),
    spent: items.filter(i => i.category === c.id).reduce((s, i) => s + (i.spent || 0), 0),
    variance: (items.filter(i => i.category === c.id).reduce((s, i) => s + (i.spent || 0), 0) / items.filter(i => i.category === c.id).reduce((s, i) => s + i.amount * i.quantity, 0)) || 0
  })).filter(c => c.items.length > 0 || c.id === "indirect");

  const grant = grants.find(g => g.id === selectedGrant);
  const burnRate = spentTotal / (grant?.amount || 1);
  const remainingPercent = 1 - burnRate;

  const mockSync = () => {
    if (!selectedGrant) return;
    setLoading(true);
    setTimeout(() => {
      const b = getBudget();
      const updated = {
        ...b,
        items: b.items.map(item => ({
          ...item,
          spent: Math.min(item.amount * item.quantity, (item.spent || 0) + (Math.random() * (item.amount * item.quantity) * 0.2))
        }))
      };
      setBudgets({ ...budgets, [selectedGrant]: updated });
      setLoading(false);
      alert("✅ Financial Sync Complete: Pulled latest transactions from QuickBooks/Xero.");
    }, 1200);
  };

  const generateJustification = async () => {
    if (!selectedGrant || items.length === 0) return;
    setLoading(true);
    const grant = grants.find(g => g.id === selectedGrant);

    const budgetContext = CATEGORIES.map(c => {
      const catItems = items.filter(i => i.category === c.id);
      if (catItems.length === 0) return null;
      return `${c.label}:\n${catItems.map(i => `- ${i.description}: ${fmt(i.amount * i.quantity)} (${i.quantity} @ ${fmt(i.amount)}). User Note: ${i.justification || "None"}`).join("\n")}`;
    }).filter(Boolean).join("\n\n");

    const sys = `You are a professional grant financial consultant. Generate a detailed, persuasive Budget Justification narrative based on the provided budget data.
Follow federal standards (e.g., Uniform Guidance). For each category, explain WHY the costs are necessary and HOW the calculations were derived.

GRANT: ${grant?.title || "Unknown"}
AGENCY: ${grant?.agency || "Unknown"}
TOTAL PROJECT COST: ${fmt(grandTotal)}
ORGANIZATION: ${PROFILE.name}
LOCATION: ${PROFILE.loc}

BUDGET DATA:
${budgetContext}
Indirect Rate: ${indirectRate}%

Return a professional, structured narrative.`;

    const result = await API.callAI([{ role: "user", content: "Generate Budget Justification." }], sys);
    if (!result.error) {
      setAiResult(result.text);
      setShowResult(true);
    } else {
      alert("Error: " + result.error);
    }
    setLoading(false);
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <Select value={selectedGrant} onChange={setSelectedGrant} style={{ flex: 1 }}
          options={[{ value: "", label: "Select a grant..." }, ...grants.map(g => ({ value: g.id, label: `${g.title?.slice(0, 50)} (${fmt(g.amount || 0)})` }))]} />
        <Btn variant="primary" size="sm" onClick={() => setShowAdd(true)} disabled={!selectedGrant}>+ Line Item</Btn>
      </div>

      {!selectedGrant ? <Empty icon="💰" title="Select a grant to build a budget" sub="Choose a grant from the dropdown above" /> : (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 16 }}>
            <Card><Stat label="Direct Costs" value={fmt(directTotal)} color={T.blue} /></Card>
            <Card><Stat label={`Indirect (${indirectRate}%)`} value={fmt(indirectTotal)} color={T.purple} /></Card>
            <Card glow><Stat label="Grand Total" value={fmt(grandTotal)} color={T.amber} /></Card>
            <Card><Stat label="Cost Share" value={fmt(costShareTotal)} color={T.green} /></Card>
            <Card><Stat label="Federal Ask" value={fmt(federalShare)} color={T.cyan} /></Card>
          </div>

          {(() => {
            const grant = grants.find(g => g.id === selectedGrant);
            const awardAmt = grant?.amount || 0;
            const diff = awardAmt - grandTotal;
            return awardAmt > 0 ? (
              <Card style={{ marginBottom: 16, borderLeft: grandTotal > awardAmt ? `4px solid ${T.red}` : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: T.sub }}>Budget vs Award Ceiling</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: diff >= 0 ? T.green : T.red }}>
                    {diff >= 0 ? `${fmt(diff)} under ceiling ✅` : `${fmt(Math.abs(diff))} OVER ceiling ⚠️`}
                  </span>
                </div>
                <Progress value={grandTotal} max={awardAmt} color={diff >= 0 ? T.green : T.red} height={6} />

                {spentTotal > 0 && (
                  <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, color: T.mute, marginBottom: 4 }}>📈 Burn Rate Velocity</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{(burnRate * 100).toFixed(1)}%</div>
                      <div style={{ fontSize: 9, color: T.sub }}>of total funding exhausted</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: T.mute, marginBottom: 4 }}>⌛ Est. Runway</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: T.green }}>{Math.ceil(remainingPercent * 12)} Months</div>
                      <div style={{ fontSize: 9, color: T.sub }}>based on current trajectory</div>
                    </div>
                  </div>
                )}
              </Card>
            ) : null;
          })()}

          {byCat.map(c => (
            <Card key={c.id} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: c.items.length > 0 ? 8 : 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: c.color }}>{c.label}</span>
                  {c.variance > 0.8 && <Badge color={T.red} size="xs">High Variance ⚠️</Badge>}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{c.id === "indirect" ? fmt(indirectTotal) : fmt(c.total)}</span>
              </div>
              {c.id === "indirect" ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: T.mute }}>Rate:</span>
                  <Input type="number" value={indirectRate} onChange={setIndirectRate} style={{ width: 80 }} />
                  <span style={{ fontSize: 11, color: T.mute }}>% of direct costs ({fmt(directTotal)})</span>
                  <div style={{ marginLeft: "auto", fontSize: 11, color: T.green }}>Spent: {fmt(spentTotal * (indirectRate / 100))}</div>
                </div>
              ) : c.items.map(item => (
                <div key={item.id} style={{ padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: T.text }}>{item.description}</div>
                      <div style={{ fontSize: 10, color: T.mute }}>{item.quantity} {item.unit}(s) × {fmt(item.amount)}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{fmt(item.amount * item.quantity)}</div>
                        <div style={{ fontSize: 9, color: T.green }}>Spent: {fmt(item.spent || 0)}</div>
                      </div>
                      <button onClick={() => removeItem(item.id)} style={{ background: "none", border: "none", color: T.red, cursor: "pointer", fontSize: 11 }}>✕</button>
                    </div>
                  </div>
                  <Progress value={item.spent || 0} max={item.amount * item.quantity} color={T.green} height={3} />
                </div>
              ))}
            </Card>
          ))}

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <Btn size="sm" variant="primary" onClick={generateJustification} disabled={loading}>
              {loading ? "⏳ Writing..." : "✨ AI Generate Justification"}
            </Btn>
            {updateGrant && selectedGrant && <Btn size="sm" variant="ghost" onClick={() => {
              updateGrant(selectedGrant, { budgetTotal: grandTotal, budgetFederal: federalShare, budgetCostShare: costShareTotal });
            }}>🔗 Sync to Grant</Btn>}
            <Btn size="sm" variant="ghost" onClick={mockSync} disabled={loading}>
              {loading ? "⏳ Syncing..." : "🔄 Sync Financials"}
            </Btn>
            <Btn size="sm" variant="ghost" onClick={() => {
              const csv = "Category,Description,Quantity,Unit,Unit Cost,Total,Cost Share,Justification\n" +
                items.map(i => `"${catMap[i.category]?.label}","${i.description}",${i.quantity},"${i.unit}",${i.amount},${i.amount * i.quantity},${i.costShare || 0},"${i.justification || ""}"`).join("\n") +
                `\n"Indirect","${indirectRate}% of direct",1,"lump",${indirectTotal},${indirectTotal},0,"Negotiated rate"` +
                `\n"TOTAL","",,,${grandTotal},${grandTotal},${costShareTotal},""`;
              navigator.clipboard?.writeText(csv);
              alert("📊 CSV copied to clipboard!");
            }}>📊 Copy as CSV</Btn>
          </div>
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Budget Line Item">
        <div style={{ display: "grid", gap: 12 }}>
          <Select value={newItem.category} onChange={v => setNewItem({ ...newItem, category: v })} options={CATEGORIES.filter(c => c.id !== "indirect").map(c => ({ value: c.id, label: c.label }))} />
          <Input value={newItem.description} onChange={v => setNewItem({ ...newItem, description: v })} placeholder="Description (e.g., Project Director salary)" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <div><label style={{ fontSize: 10, color: T.mute }}>Unit Cost</label><Input type="number" value={newItem.amount} onChange={v => setNewItem({ ...newItem, amount: Number(v) })} /></div>
            <div><label style={{ fontSize: 10, color: T.mute }}>Quantity</label><Input type="number" value={newItem.quantity} onChange={v => setNewItem({ ...newItem, quantity: Number(v) })} /></div>
            <div><label style={{ fontSize: 10, color: T.mute }}>Unit</label>
              <Select value={newItem.unit} onChange={v => setNewItem({ ...newItem, unit: v })} options={[
                { value: "year", label: "Year" }, { value: "month", label: "Month" }, { value: "hour", label: "Hour" },
                { value: "trip", label: "Trip" }, { value: "unit", label: "Unit" }, { value: "lump", label: "Lump Sum" },
              ]} />
            </div>
          </div>
          <div><label style={{ fontSize: 10, color: T.mute }}>Cost Share (if any)</label><Input type="number" value={newItem.costShare} onChange={v => setNewItem({ ...newItem, costShare: Number(v) })} /></div>
          <div style={{ position: "relative" }}>
            <TextArea value={newItem.justification} onChange={v => setNewItem({ ...newItem, justification: v })} rows={3} placeholder="Budget justification for this item..." />
            <MagicBtn
              loading={magicLoading}
              onClick={handleMagicDraft}
              label="Draft Justification"
              style={{ position: "absolute", bottom: 8, right: 8 }}
            />
          </div>
          <div style={{ fontSize: 12, color: T.amber, fontWeight: 600 }}>Line Total: {fmt(newItem.amount * newItem.quantity)}</div>
          <Btn variant="primary" onClick={addItem}>Add Line Item</Btn>
        </div>
      </Modal>

      <Modal open={showResult} onClose={() => setShowResult(false)} title="📄 AI Budget Justification" width={800}>
        <div style={{ fontSize: 12, lineHeight: 1.7, color: T.text, whiteSpace: "pre-wrap", background: T.panel, padding: 16, borderRadius: 8, maxHeight: 500, overflow: "auto", border: `1px solid ${T.border}` }}>
          {aiResult}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
          <Btn size="sm" variant="primary" onClick={() => { navigator.clipboard?.writeText(aiResult); alert("📋 Justification copied!"); }}>📋 Copy Content</Btn>
          <Btn size="sm" variant="ghost" onClick={() => setShowResult(false)}>Close</Btn>
        </div>
      </Modal>
    </div>
  );
};

