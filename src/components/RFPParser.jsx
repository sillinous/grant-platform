import { useStore } from '../store';

export const RFPParser = () => {
  const { grants, updateGrant: onUpdate, tasks, setTasks } = useStore();
  const [rawText, setRawText] = useState("");
  const [parsed, setParsed] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedGrant, setSelectedGrant] = useState("");

  const parse = async () => {
    if (!rawText.trim()) return;
    setLoading(true);
    const sys = `You are an expert at parsing grant RFPs (Requests for Proposals). Extract structured information from the RFP text provided. Return a JSON object with these fields:
    - title: string
    - agency: string
    - deadline: string (ISO date if found)
    - amount_min: number
    - amount_max: number
    - eligibility: string[] (list of eligibility requirements)
    - required_docs: string[] (list of required documents)
    - evaluation_criteria: {criterion: string, weight: number}[] (scoring criteria with weights)
    - key_dates: {event: string, date: string}[] (important dates)
    - sections_required: string[] (required proposal sections)
    - match_areas: string[] (subject/focus areas)
    - page_limits: {section: string, pages: number}[] (page limits if specified)
    - contacts: {name: string, email: string, role: string}[] (contact info)
    - cfda_number: string (if applicable)
    - coaching: {
        alignmentScore: number (0-100),
        alignmentJustification: string,
        complianceChecklist: { item: string, status: "required" | "recommended" }[],
        strategicGaps: string[]
      }
    - special_notes: string[] (anything else important)
    Respond with ONLY the JSON, no markdown formatting.`;
    const result = await API.callAI([{ role: "user", content: `Parse this RFP:\n\n${rawText}` }], sys);
    if (result.error) { setParsed({ error: result.error }); }
    else {
      try {
        const cleaned = result.text.replace(/```json\n?|```/g, "").trim();
        setParsed(JSON.parse(cleaned));
      } catch { setParsed({ raw: result.text }); }
    }
    setLoading(false);
  };

  const applyToGrant = () => {
    if (!parsed || !selectedGrant) return;
    const updates = {};
    if (parsed.title) updates.title = parsed.title;
    if (parsed.agency) updates.agency = parsed.agency;
    if (parsed.deadline) updates.deadline = parsed.deadline;
    if (parsed.amount_max) updates.amount = parsed.amount_max;
    if (parsed.required_docs) updates.requiredDocs = parsed.required_docs;
    if (parsed.evaluation_criteria) updates.evalCriteria = parsed.evaluation_criteria;
    if (parsed.sections_required) updates.sections = parsed.sections_required;
    onUpdate(selectedGrant, updates);
  };

  const generateTasks = () => {
    if (!parsed) return;
    const newTasks = [];
    if (parsed.required_docs) {
      parsed.required_docs.forEach(doc => {
        newTasks.push({ id: uid(), title: `Draft: ${doc}`, grantId: selectedGrant, priority: "high", status: "todo", createdAt: new Date().toISOString(), notes: "Auto-generated from RFP Parser" });
      });
    }
    if (parsed.key_dates) {
      parsed.key_dates.forEach(ev => {
        newTasks.push({ id: uid(), title: `Milestone: ${ev.event}`, grantId: selectedGrant, priority: "medium", status: "todo", dueDate: ev.date, createdAt: new Date().toISOString(), notes: "Auto-generated from RFP Parser" });
      });
    }
    if (newTasks.length > 0) {
      const updated = [...tasks, ...newTasks];
      setTasks(updated);
      LS.set("tasks", updated);
      alert(`${newTasks.length} tasks injected into Action Plan.`);
    }
  };

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>📑 AI-Powered RFP Parser</div>
        <div style={{ fontSize: 12, color: T.sub, marginBottom: 8 }}>Paste an RFP, NOFO, or grant announcement below. The AI will extract structured requirements, deadlines, scoring criteria, and required documents.</div>
        <TextArea value={rawText} onChange={setRawText} rows={10} placeholder="Paste the full RFP/NOFO text here..." />
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <Btn variant="primary" onClick={parse} disabled={loading}>{loading ? "⏳ Parsing..." : "🔍 Parse RFP"}</Btn>
          <Btn variant="ghost" onClick={() => { setRawText(""); setParsed(null); }}>Clear</Btn>
        </div>
      </Card>

      {parsed && !parsed.error && !parsed.raw && (
        <div>
          {/* Apply to Grant */}
          <Card style={{ marginBottom: 12, background: T.panel + "33" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 8 }}>🔗 Lifecycle Integration</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 8, alignItems: "center" }}>
              <Select value={selectedGrant} onChange={setSelectedGrant}
                options={[{ value: "", label: "Select a grant..." }, ...grants.map(g => ({ value: g.id, label: g.title?.slice(0, 50) }))]} style={{ flex: 1 }} />
              <Btn variant="primary" size="sm" onClick={applyToGrant} disabled={!selectedGrant}>Apply Metadata</Btn>
              <Btn variant="ghost" size="sm" onClick={generateTasks} disabled={!selectedGrant}>⚡ Gen Tasks</Btn>
            </div>
            {!selectedGrant && <div style={{ fontSize: 9, color: T.amber, marginTop: 4 }}>Select a grant to automate task generation from requirements.</div>}
          </Card>
          {/* Coaching & Alignment */}
          {parsed.coaching && (
            <Card style={{ marginBottom: 12, borderLeft: `4px solid ${parsed.coaching.alignmentScore >= 80 ? T.green : T.amber}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>🎯 Mission Alignment & Coaching</div>
                  <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{parsed.coaching.alignmentJustification}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: parsed.coaching.alignmentScore >= 80 ? T.green : T.amber }}>{parsed.coaching.alignmentScore}%</div>
                  <div style={{ fontSize: 9, color: T.mute }}>ALIGNMENT</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.text, marginBottom: 8, textTransform: "uppercase" }}>📝 Compliance Checklist</div>
                  {parsed.coaching.complianceChecklist?.map((c, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, fontSize: 11, color: T.sub }}>
                      <input type="checkbox" readOnly checked={false} style={{ cursor: "pointer" }} />
                      <span style={{ color: c.status === "required" ? T.red : T.sub }}>{c.item}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.text, marginBottom: 8, textTransform: "uppercase" }}>⚠️ Strategic Gaps</div>
                  {parsed.coaching.strategicGaps?.map((g, i) => (
                    <div key={i} style={{ fontSize: 10, color: T.red, marginBottom: 4, padding: "2px 6px", background: T.red + "11", borderRadius: 4 }}>
                      • {g}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Overview */}
          <Card style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 8 }}>{parsed.title || "Parsed RFP"}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div><span style={{ fontSize: 10, color: T.mute }}>Agency</span><div style={{ fontSize: 12, color: T.text }}>{parsed.agency || "—"}</div></div>
              <div><span style={{ fontSize: 10, color: T.mute }}>Deadline</span><div style={{ fontSize: 12, color: parsed.deadline ? T.red : T.mute }}>{parsed.deadline ? fmtDate(parsed.deadline) : "—"}</div></div>
              <div><span style={{ fontSize: 10, color: T.mute }}>Funding Range</span><div style={{ fontSize: 12, color: T.green }}>{parsed.amount_min ? `${fmt(parsed.amount_min)} – ${fmt(parsed.amount_max)}` : parsed.amount_max ? fmt(parsed.amount_max) : "—"}</div></div>
            </div>
            {parsed.cfda_number && <div style={{ fontSize: 11, color: T.blue, marginTop: 8 }}>CFDA: {parsed.cfda_number}</div>}
          </Card>

          {/* Eligibility */}
          {parsed.eligibility?.length > 0 && (
            <Card style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 8 }}>✅ Eligibility Requirements</div>
              {parsed.eligibility.map((e, i) => {
                const profileMatch = PROFILE.tags.some(t => e.toLowerCase().includes(t.replace(/-/g, " ")));
                return (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "4px 0", borderBottom: `1px solid ${T.border}` }}>
                    <span style={{ color: profileMatch ? T.green : T.yellow, fontSize: 14 }}>{profileMatch ? "✅" : "⚠️"}</span>
                    <span style={{ fontSize: 12, color: T.text }}>{e}</span>
                  </div>
                );
              })}
            </Card>
          )}

          {/* Required Documents */}
          {parsed.required_docs?.length > 0 && (
            <Card style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 8 }}>📄 Required Documents</div>
              {parsed.required_docs.map((d, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 12, color: T.text, borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ color: T.mute }}>☐</span> {d}
                </div>
              ))}
            </Card>
          )}

          {/* Evaluation Criteria */}
          {parsed.evaluation_criteria?.length > 0 && (
            <Card style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 8 }}>📊 Evaluation Criteria</div>
              {parsed.evaluation_criteria.map((c, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: 12, color: T.text }}>{c.criterion}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Progress value={c.weight} max={100} color={T.amber} height={4} />
                    <Badge color={T.amber}>{c.weight}pts</Badge>
                  </div>
                </div>
              ))}
            </Card>
          )}

          {/* Sections Required */}
          {parsed.sections_required?.length > 0 && (
            <Card style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 8 }}>📋 Required Sections</div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {parsed.sections_required.map((s, i) => <Badge key={i} color={T.blue}>{s}</Badge>)}
              </div>
              {parsed.page_limits?.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  {parsed.page_limits.map((p, i) => <div key={i} style={{ fontSize: 11, color: T.mute }}>{p.section}: {p.pages} pages max</div>)}
                </div>
              )}
            </Card>
          )}

          {/* Key Dates */}
          {parsed.key_dates?.length > 0 && (
            <Card style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 8 }}>📅 Key Dates</div>
              {parsed.key_dates.map((d, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 12, borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ color: T.text }}>{d.event}</span>
                  <span style={{ color: T.amber }}>{d.date}</span>
                </div>
              ))}
            </Card>
          )}

        </div>
      )}

      {parsed?.error && <Card><div style={{ color: T.red, fontSize: 12 }}>Error: {parsed.error}</div></Card>}
      {parsed?.raw && <Card><div style={{ fontSize: 12, color: T.sub, whiteSpace: "pre-wrap" }}>{parsed.raw}</div></Card>}
    </div>
  );
};
