import { useStore } from '../store';

export const OutcomeTracker = () => {
  const { grants, updateGrant } = useStore();
  const awarded = grants.filter(g => ["awarded","active","closeout"].includes(g.stage));
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);

  const getOutcomes = (grant) => grant.outcomes || { kpis:[], milestones:[], deliverables:[], narrative:"" };

  const updateOutcomes = (grantId, updates) => {
    const grant = grants.find(g => g.id === grantId);
    if (!grant) return;
    updateGrant(grantId, { outcomes:{ ...getOutcomes(grant), ...updates } });
  };

  const suggestOutcomes = async (grantId) => {
    const grant = grants.find(g => g.id === grantId);
    if (!grant) return;
    setLoading(true);
    const outcomes = getOutcomes(grant);
    const sys = `You are a Grant Performance Officer. Based on this grant and project narrative, suggest 3-5 measurable KPIs and 3-5 project milestones.
GRANT: ${grant.title}
NARRATIVE: ${outcomes.narrative || "No narrative provided."}

Format as JSON:
{
  "kpis": [{"name": "KPI Name", "target": 100, "unit": "students/hours/etc"}],
  "milestones": [{"title": "Milestone Title", "daysFromNow": 30}]
}`;

    const res = await API.callAI([{ role: "user", content: "Suggest outcomes." }], sys);
    if (!res.error) {
      try {
        const cleaned = res.text.replace(/```json\n?|```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        const newKpis = parsed.kpis.map(k => ({ ...k, id: uid(), current: 0, period: "quarterly" }));
        const now = new Date();
        const newMs = parsed.milestones.map(m => {
          const d = new Date();
          d.setDate(now.getDate() + (m.daysFromNow || 30));
          return { id: uid(), title: m.title, dueDate: d.toISOString().split("T")[0], status: "pending" };
        });
        updateOutcomes(grantId, { kpis: [...outcomes.kpis, ...newKpis], milestones: [...outcomes.milestones, ...newMs] });
      } catch (e) { alert("Failed to parse suggested outcomes."); }
    } else { alert(res.error); }
    setLoading(false);
  };

  const addKPI = (grantId) => {
    const o = getOutcomes(grants.find(g=>g.id===grantId));
    updateOutcomes(grantId, { kpis:[...o.kpis, { id:uid(), name:"", target:0, current:0, unit:"", period:"quarterly" }] });
  };

  const updateKPI = (grantId, kpiId, updates) => {
    const o = getOutcomes(grants.find(g=>g.id===grantId));
    updateOutcomes(grantId, { kpis:o.kpis.map(k => k.id === kpiId ? { ...k, ...updates } : k) });
  };

  const removeKPI = (grantId, kpiId) => {
    const o = getOutcomes(grants.find(g=>g.id===grantId));
    updateOutcomes(grantId, { kpis:o.kpis.filter(k => k.id !== kpiId) });
  };

  const addMilestone = (grantId) => {
    const o = getOutcomes(grants.find(g=>g.id===grantId));
    updateOutcomes(grantId, { milestones:[...o.milestones, { id:uid(), title:"", dueDate:"", status:"pending", notes:"" }] });
  };

  const updateMilestone = (grantId, msId, updates) => {
    const o = getOutcomes(grants.find(g=>g.id===grantId));
    updateOutcomes(grantId, { milestones:o.milestones.map(m => m.id === msId ? { ...m, ...updates } : m) });
  };

  const selected = selectedId ? grants.find(g => g.id === selectedId) : null;
  const selOutcomes = selected ? getOutcomes(selected) : null;

  const totalKPIs = awarded.reduce((s,g) => s + (getOutcomes(g).kpis?.length || 0), 0);
  const metKPIs = awarded.reduce((s,g) => s + (getOutcomes(g).kpis?.filter(k => k.current >= k.target).length || 0), 0);
  const totalMilestones = awarded.reduce((s,g) => s + (getOutcomes(g).milestones?.length || 0), 0);
  const completedMilestones = awarded.reduce((s,g) => s + (getOutcomes(g).milestones?.filter(m => m.status === "complete").length || 0), 0);

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:8, marginBottom:16 }}>
        <Card><Stat label="Active Awards" value={awarded.length} color={T.green} /></Card>
        <Card><Stat label="KPIs Met" value={`${metKPIs}/${totalKPIs}`} color={totalKPIs > 0 && metKPIs === totalKPIs ? T.green : T.yellow} /></Card>
        <Card><Stat label="Milestones" value={`${completedMilestones}/${totalMilestones}`} color={T.blue} /></Card>
        <Card><Stat label="On Track" value={awarded.filter(g => {
          const o = getOutcomes(g);
          const overdue = (o.milestones||[]).filter(m => m.dueDate && daysUntil(m.dueDate) < 0 && m.status !== "complete").length;
          return overdue === 0;
        }).length} color={T.green} /></Card>
      </div>

      {awarded.length === 0 ? <Empty icon="📊" title="No active awards to track" sub="Outcomes tracking begins when grants are awarded" /> :
        <div style={{ display:"grid", gridTemplateColumns:"280px 1fr", gap:16 }}>
          <div>
            {awarded.map(g => {
              const o = getOutcomes(g);
              const kpiProg = o.kpis?.length > 0 ? (o.kpis.filter(k=>k.current>=k.target).length / o.kpis.length) * 100 : 0;
              return (
                <Card key={g.id} onClick={() => setSelectedId(g.id)} style={{ marginBottom:6, cursor:"pointer", borderColor: selectedId === g.id ? T.amber+"66" : T.border }}>
                  <div style={{ fontSize:12, fontWeight:600, color:T.text }}>{g.title?.slice(0,30)}</div>
                  <div style={{ fontSize:10, color:T.mute }}>{o.kpis?.length || 0} KPIs · {o.milestones?.length || 0} milestones</div>
                  <Progress value={kpiProg} max={100} color={kpiProg === 100 ? T.green : T.yellow} height={3} />
                </Card>
              );
            })}
          </div>

          <div>
            {!selected ? <Card><div style={{ color:T.mute, fontSize:12, textAlign:"center", padding:32 }}>Select an award to manage outcomes</div></Card> : (
              <div>
                <Card style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 8 }}>📝 Outcome Narrative</div>
                  <TextArea value={selOutcomes?.narrative || ""} onChange={v => updateOutcomes(selected.id, { narrative: v })} rows={3} placeholder="Describe outcomes achieved, impact on community, lessons learned..." />
                  <Btn variant="ghost" size="sm" onClick={() => suggestOutcomes(selected.id)} disabled={loading} style={{ marginTop: 8 }}>
                    {loading ? "⏳ Thinking..." : "🤖 Suggest Outcomes via AI"}
                  </Btn>
                </Card>

                <Card style={{ marginBottom:12 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>📈 Key Performance Indicators</div>
                    <Btn size="sm" onClick={() => addKPI(selected.id)}>+ KPI</Btn>
                  </div>
                  {(selOutcomes?.kpis || []).length === 0 ? <div style={{ color:T.mute, fontSize:11 }}>No KPIs defined. Add key performance indicators to track progress.</div> :
                    (selOutcomes.kpis).map(k => (
                      <div key={k.id} style={{ padding:"8px 0", borderBottom:`1px solid ${T.border}` }}>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 80px 80px 80px 30px", gap:6, alignItems:"center" }}>
                          <Input value={k.name} onChange={v => updateKPI(selected.id, k.id, { name:v })} placeholder="KPI name" style={{ fontSize:11 }} />
                          <Input type="number" value={k.target} onChange={v => updateKPI(selected.id, k.id, { target:Number(v) })} placeholder="Target" style={{ fontSize:11 }} />
                          <Input type="number" value={k.current} onChange={v => updateKPI(selected.id, k.id, { current:Number(v) })} placeholder="Current" style={{ fontSize:11 }} />
                          <Input value={k.unit} onChange={v => updateKPI(selected.id, k.id, { unit:v })} placeholder="Unit" style={{ fontSize:11 }} />
                          <button onClick={() => removeKPI(selected.id, k.id)} style={{ background:"none", border:"none", color:T.red, cursor:"pointer" }}>✕</button>
                        </div>
                        <Progress value={k.current} max={k.target || 1} color={k.current >= k.target ? T.green : T.yellow} height={3} />
                      </div>
                    ))
                  }
                </Card>

                <Card style={{ marginBottom:12 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:T.text }}>📅 Milestones</div>
                    <Btn size="sm" onClick={() => addMilestone(selected.id)}>+ Milestone</Btn>
                  </div>
                  {(selOutcomes?.milestones || []).map(m => (
                    <div key={m.id} style={{ display:"flex", gap:8, alignItems:"center", padding:"6px 0", borderBottom:`1px solid ${T.border}` }}>
                      <button onClick={() => updateMilestone(selected.id, m.id, { status: m.status === "complete" ? "pending" : "complete" })}
                        style={{ background:"none", border:"none", cursor:"pointer", fontSize:14, color: m.status === "complete" ? T.green : T.mute }}>{m.status === "complete" ? "☑" : "☐"}</button>
                      <Input value={m.title} onChange={v => updateMilestone(selected.id, m.id, { title:v })} placeholder="Milestone" style={{ flex:1, fontSize:11 }} />
                      <Input type="date" value={m.dueDate || ""} onChange={v => updateMilestone(selected.id, m.id, { dueDate:v })} style={{ width:130, fontSize:11 }} />
                      <Select value={m.status} onChange={v => updateMilestone(selected.id, m.id, { status:v })} style={{ fontSize:10, width:100 }}
                        options={[{value:"pending",label:"Pending"},{value:"inprogress",label:"In Progress"},{value:"complete",label:"Complete"},{value:"overdue",label:"Overdue"}]} />
                    </div>
                  ))}
                  {(selOutcomes?.milestones || []).length === 0 && <div style={{ color:T.mute, fontSize:11 }}>No milestones yet</div>}
                </Card>
              </div>
            )}
          </div>
        </div>
      }
    </div>
  );
};
