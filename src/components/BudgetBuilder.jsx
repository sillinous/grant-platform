import React, { useState, useEffect } from 'react';
import { Card, Input, Btn, Select, TextArea, Stat, Empty, Modal, Progress } from '../ui';
import { LS, T, uid, fmt } from '../globals';

export const BudgetBuilder = ({ grants, updateGrant }) => {
  const [budgets, setBudgets] = useState(() => LS.get("budgets", {}));
  const [selectedGrant, setSelectedGrant] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ category: "personnel", description: "", amount: 0, quantity: 1, unit: "year", justification: "", costShare: 0 });

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
    const updated = { ...b, items: [...b.items, { ...newItem, id: uid(), total: newItem.amount * newItem.quantity }] };
    setBudgets({ ...budgets, [selectedGrant]: updated });
    setNewItem({ category: "personnel", description: "", amount: 0, quantity: 1, unit: "year", justification: "", costShare: 0 });
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

  const byCat = CATEGORIES.map(c => ({
    ...c, items: items.filter(i => i.category === c.id),
    total: items.filter(i => i.category === c.id).reduce((s, i) => s + i.amount * i.quantity, 0),
  })).filter(c => c.items.length > 0 || c.id === "indirect");

  const generateJustification = async () => {
    if (!selectedGrant || items.length === 0) return;
    const grant = grants.find(g => g.id === selectedGrant);
    const text = `BUDGET JUSTIFICATION\nGrant: ${grant?.title || "Unknown"}\n\n${CATEGORIES.map(c => {
      const catItems = items.filter(i => i.category === c.id);
      if (catItems.length === 0) return null;
      return `${c.label}\n${catItems.map(i => `  ${i.description}: ${fmt(i.amount * i.quantity)} — ${i.justification || `${i.quantity} ${i.unit}(s) at ${fmt(i.amount)} each. Required for project implementation.`}`).join("\n")}`;
    }).filter(Boolean).join("\n\n")}\n\nIndirect Costs: ${indirectRate}% of direct costs = ${fmt(indirectTotal)}\n\nTOTAL PROJECT COST: ${fmt(grandTotal)}\nFederal Share: ${fmt(federalShare)}\nCost Share: ${fmt(costShareTotal)}`;
    navigator.clipboard?.writeText(text);
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
              <Card style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: T.sub }}>Budget vs Award Ceiling</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: diff >= 0 ? T.green : T.red }}>
                    {diff >= 0 ? `${fmt(diff)} under ceiling ✅` : `${fmt(Math.abs(diff))} OVER ceiling ⚠️`}
                  </span>
                </div>
                <Progress value={grandTotal} max={awardAmt} color={diff >= 0 ? T.green : T.red} height={6} />
              </Card>
            ) : null;
          })()}

          {byCat.map(c => (
            <Card key={c.id} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: c.items.length > 0 ? 8 : 0 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: c.color }}>{c.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{c.id === "indirect" ? fmt(indirectTotal) : fmt(c.total)}</span>
              </div>
              {c.id === "indirect" ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: T.mute }}>Rate:</span>
                  <Input type="number" value={indirectRate} onChange={setIndirectRate} style={{ width: 80 }} />
                  <span style={{ fontSize: 11, color: T.mute }}>% of direct costs ({fmt(directTotal)})</span>
                </div>
              ) : c.items.map(item => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: T.text }}>{item.description}</div>
                    <div style={{ fontSize: 10, color: T.mute }}>{item.quantity} {item.unit}(s) × {fmt(item.amount)}{item.costShare > 0 ? ` · Cost Share: ${fmt(item.costShare)}` : ""}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{fmt(item.amount * item.quantity)}</span>
                    <button onClick={() => removeItem(item.id)} style={{ background: "none", border: "none", color: T.red, cursor: "pointer", fontSize: 11 }}>✕</button>
                  </div>
                </div>
              ))}
            </Card>
          ))}

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <Btn size="sm" onClick={generateJustification}>📋 Copy Budget Justification</Btn>
            {updateGrant && selectedGrant && <Btn size="sm" variant="primary" onClick={() => {
              updateGrant(selectedGrant, { budgetTotal: grandTotal, budgetFederal: federalShare, budgetCostShare: costShareTotal });
            }}>🔗 Sync to Grant</Btn>}
            <Btn size="sm" variant="ghost" onClick={() => {
              const csv = "Category,Description,Quantity,Unit,Unit Cost,Total,Cost Share,Justification\n" +
                items.map(i => `"${catMap[i.category]?.label}","${i.description}",${i.quantity},"${i.unit}",${i.amount},${i.amount * i.quantity},${i.costShare || 0},"${i.justification || ""}"`).join("\n") +
                `\n"Indirect","${indirectRate}% of direct",1,"lump",${indirectTotal},${indirectTotal},0,"Negotiated rate"` +
                `\n"TOTAL","",,,${grandTotal},${grandTotal},${costShareTotal},""`;
              navigator.clipboard?.writeText(csv);
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
          <TextArea value={newItem.justification} onChange={v => setNewItem({ ...newItem, justification: v })} rows={2} placeholder="Budget justification for this item..." />
          <div style={{ fontSize: 12, color: T.amber, fontWeight: 600 }}>Line Total: {fmt(newItem.amount * newItem.quantity)}</div>
          <Btn variant="primary" onClick={addItem}>Add Line Item</Btn>
        </div>
      </Modal>
    </div>
  );
};
