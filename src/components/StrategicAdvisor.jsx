import { useStore } from '../store';

export const StrategicAdvisor = () => {
  const { grants, vaultDocs, contacts } = useStore();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("portfolio");

  const MODES = [
    { id:"portfolio", label:"🎯 Portfolio Strategy", prompt:"Analyze my entire grant portfolio. Evaluate diversification, risk concentration, pipeline health, conversion potential, and strategic gaps. Provide a prioritized action plan for the next 30/60/90 days." },
    { id:"targeting", label:"🔍 Targeting Strategy", prompt:"Based on my profile, businesses, and demographics, what types of federal grants should I prioritize? What agencies and programs are the best fit? What areas am I underexploring?" },
    { id: "win_prob", label: "🎲 Win Probability (Beta)", prompt: "Run a 'Go/No-Go' analysis for my active grants. Synthesize my organizational capacity against the specific requirements and competitive landscape. Rate success probability as a percentage and provide the 3 biggest 'Winning Factors' and 3 'Deal Breakers'." },
    { id:"narrative", label:"✍️ Narrative Strategy", prompt:"Review my profile and suggest the strongest narrative angles I should use across applications. What's my most compelling story? How should I frame my rural location, disability, and multiple ventures as strengths?" },
    { id:"capacity", label:"🏢 Capacity Building", prompt:"What organizational capacity gaps might reviewers identify? What should I address before submitting more applications? Suggest specific improvements to strengthen my competitive position." },
    { id:"timeline", label:"📅 Timeline Optimization", prompt:"Look at my pipeline deadlines, stages, and workload. Am I overcommitted? Should I drop any grants? What's the optimal sequence for completing applications to maximize quality?" },
    { id:"growth", label:"📈 Growth Plan", prompt:"Design a 12-month grant strategy growth plan. How many grants should I apply for per quarter? What's a realistic funded portfolio target? How should my strategy evolve as I win more awards?" },
  ];

  const analyze = async () => {
    setLoading(true);
    const context = buildPortfolioContext(grants, vaultDocs, contacts);
    const grantDetails = grants.map(g => `- ${g.title} | ${STAGE_MAP[g.stage]?.label} | ${fmt(g.amount||0)} | ${g.agency} | Deadline: ${g.deadline ? fmtDate(g.deadline) : 'none'}`).join("\n");
    const peers = LS.get("peers", []).map(p => `- ${p.name} | ${p.agency} | ${fmt(p.amount)}`).join("\n");
    const selectedMode = MODES.find(m => m.id === mode);

    const sys = `You are an elite grant strategy consultant. ${selectedMode.id === "win_prob" ? "You specialize in probability analysis and risk assessment for federal bids." : "You specialize in building sustainable grant portfolios for underserved communities."}

${context}

DETAILED GRANTS:
${grantDetails}

PEER COMPETITIVE DATA:
${peers}

Provide specific, actionable, data-driven advice. Reference the user's actual portfolio and peer data. Include timelines and metrics where appropriate. Structure your response with clear headers and priorities.`;

    const result = await API.callAI([{ role:"user", content: selectedMode.prompt }], sys);
    setAnalysis({ mode: selectedMode, text: result.error ? `Error: ${result.error}` : result.text, date: new Date().toISOString() });
    setLoading(false);
  };

  return (
    <div style={{ padding: 20, animation: "fadeIn 0.4s" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 24, padding: "8px", background: `${T.amber}11`, borderRadius: "8px" }}>🧠</div>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: T.text, margin: 0 }}>Strategic Advisor</h2>
          <p style={{ color: T.mute, fontSize: 13, marginTop: 4 }}>Deep strategic analysis powered by AI based on your entire portfolio.</p>
        </div>
      </div>

      <Card style={{ marginBottom: 24, borderTop: `4px solid ${T.amber}` }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginBottom: 20 }}>
          {MODES.map(m => (
            <div key={m.id} onClick={() => setMode(m.id)} style={{
              padding: 16, borderRadius: 8, cursor: "pointer",
              border: `1px solid ${mode === m.id ? T.amber : T.border}`,
              background: mode === m.id ? `${T.amber}11` : T.panel,
              transition: "all 0.2s"
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: mode === m.id ? T.amber : T.text }}>{m.label}</div>
            </div>
          ))}
        </div>
        <Btn variant="primary" size="lg" style={{ width: "100%" }} onClick={analyze} disabled={loading}>
          {loading ? "⏳ Analyzing portfolio..." : `🧠 Run ${MODES.find(m => m.id === mode)?.label}`}
        </Btn>
      </Card>

      {analysis && (
        <Card style={{ borderLeft: `4px solid ${T.green}`, animation: "fadeIn 0.5s" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: T.text, margin: 0 }}>{analysis.mode.label} Results</h3>
              <div style={{ fontSize: 11, color: T.mute, marginTop: 4 }}>Generated {fmtDate(analysis.date)}</div>
            </div>
            <Btn size="sm" variant="ghost" onClick={() => navigator.clipboard?.writeText(analysis.text)}>📋 Copy</Btn>
          </div>
          <div style={{ fontSize: 14, color: T.sub, lineHeight: 1.7, whiteSpace: "pre-wrap", padding: 20, background: T.panel, borderRadius: 8, border: `1px solid ${T.border}` }}>
            {analysis.text}
          </div>
        </Card>
      )}
    </div>
  );
};
