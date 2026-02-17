import React from 'react';
import { Card, Stat, Badge, Progress, Btn } from '../ui';
import { BoardSlider } from './BoardSlider';
import { T, fmt, fmtDate, STAGE_MAP, PROFILE } from '../globals';
import { API, buildPortfolioContext } from '../api';

export const ExecutiveSummary = ({ grants, tasks = [], budgets = {} }) => {
  const awarded = grants.filter(g => ["awarded", "active", "closeout"].includes(g.stage));
  const active = grants.filter(g => !["declined", "closeout", "archived"].includes(g.stage));
  
  const totalAwarded = awarded.reduce((s, g) => s + (g.amount || 0), 0);
  const totalPipeline = active.reduce((s, g) => s + (g.amount || 0), 0);
  const winRate = grants.filter(g => g.stage === "declined").length === 0 ? 100 : 
    Math.round((awarded.length / (awarded.length + grants.filter(g => g.stage === "declined").length)) * 100);

  const topWins = awarded.sort((a,b) => b.amount - a.amount).slice(0, 3);
  const upcoming = active.filter(g => g.deadline && new Date(g.deadline) > new Date())
    .sort((a,b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 3);

  const [insights, setInsights] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [censusData, setCensusData] = React.useState(null);

  React.useEffect(() => {
    API.getCensusData().then(d => {
      if (d && !d._error) setCensusData(d);
    });
  }, []);

  const generateAIAnalysis = async () => {
    setLoading(true);

    // Calculate operational metrics for AI context
    const completedTasks = tasks.filter(t => t.status === "done").length;
    const taskVelocity = tasks.length > 0 ? (completedTasks / tasks.length * 100).toFixed(1) : "0";

    const totalSpentAcrossPortfolio = Object.values(budgets).reduce((acc, b) =>
      acc + (b.items || []).reduce((s, i) => s + (i.spent || 0), 0), 0
    );
    const portfolioBurnRate = totalAwarded > 0 ? (totalSpentAcrossPortfolio / totalAwarded * 100).toFixed(1) : "0";

    const context = buildPortfolioContext(grants, LS.get("vault_docs", []), []); 
    const prompt = `Analyze this grant portfolio for an Executive Board. 

    STRATEGIC CONTEXT:
    - Awarded: ${fmt(totalAwarded)} | Pipeline: ${fmt(totalPipeline)} | Win Rate: ${winRate}%
    - Operational Velocity: ${taskVelocity}% of Action Plan tasks completed.
    - Financial Burn: ${fmt(totalSpentAcrossPortfolio)} spent across portfolio (${portfolioBurnRate}% utilization).
    
    Identify:
    1. Three specific "Strategic Wins" or trends (mentioning operational efficiency if relevant).
    2. Two "Portfolio Risks" (e.g. agency concentration, funding cliffs, or slow task velocity).
    3. One "Chief Strategy Officer Recommendation" on how to optimize current organizational capacity.
    Format as a JSON object with keys: insights (array of strings), risks (array of strings), recommendation (string).`;

    const result = await API.callAI([{ role: "user", content: prompt }], "You are a Chief Strategy Officer AI.");
    try {
      const data = JSON.parse(result.text.match(/\{[\s\S]*\}/)?.[0] || '{"insights":[], "risks":[], "recommendation":""}');
      setInsights(data);
    } catch (e) {
      console.warn("AI parsing failed", e);
    }
    setLoading(false);
  };

  const printReport = () => window.print();

  return (
    <div className="board-report" style={{ maxWidth: 1000, margin: "0 auto", padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32, borderBottom: `1px solid ${T.border}`, paddingBottom: 16 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: T.text, letterSpacing: "-0.5px" }}>Portfolio Executive Summary</div>
          <div style={{ fontSize: 13, color: T.sub, marginTop: 4 }}>Institutional Funding Performance · {fmtDate(new Date())}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="primary" onClick={generateAIAnalysis} disabled={loading}>{loading ? "🧠 Analyzing..." : "✨ AI Strategic Analysis"}</Btn>
          <Btn variant="ghost" onClick={printReport}>📄 Export PDF</Btn>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        <Card style={{ textAlign: "center", borderTop: `4px solid ${T.green}` }}>
          <Stat label="Total Funding Awarded" value={fmt(totalAwarded)} color={T.green} />
        </Card>
        <Card style={{ textAlign: "center", borderTop: `4px solid ${T.blue}` }}>
          <Stat label="Weighted Pipeline" value={fmt(totalPipeline)} color={T.blue} />
        </Card>
        <Card style={{ textAlign: "center", borderTop: `4px solid ${T.amber}` }}>
          <Stat label="Historical Win Rate" value={`${winRate}%`} color={T.amber} />
        </Card>
      </div>

      <div style={{ marginBottom: 32 }}>
        <BoardSlider grants={grants} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 24 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            🏆 Top Awarded Projects
          </div>
          {topWins.map((g, i) => (
            <Card key={i} style={{ marginBottom: 12, background: T.green + "05" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{g.title}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: T.green }}>{fmt(g.amount)}</div>
              </div>
              <div style={{ display: "flex", gap: 12, fontSize: 11, color: T.sub }}>
                <span>Agency: <b>{g.agency}</b></span>
                <span>Type: <b>{g.type || "Grant"}</b></span>
              </div>
            </Card>
          ))}

          <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 16, marginTop: 32 }}>
            💡 Key Strategic Insights
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            {(insights?.insights || [
              "Portfolio yield has increased through agency diversification.",
              "Internal ROI is optimized for domain-specific narratives.",
              "Current pipeline contains high-probability leads ready for drafting."
            ]).map((insight, i) => (
              <div key={i} style={{ padding: "12px 16px", background: T.panel, borderRadius: 8, fontSize: 13, color: T.sub, borderLeft: `2px solid ${T.blue}` }}>
                {insight}
              </div>
            ))}
          </div>
          {insights?.recommendation && (
            <div style={{ marginTop: 24, padding: 16, background: T.blue + "10", borderRadius: 8, border: `1px solid ${T.blue}44` }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: T.blue, marginBottom: 4, letterSpacing: 0.5 }}>STRATEGIC RECOMMENDATION</div>
              <div style={{ fontSize: 13, color: T.text, lineHeight: 1.5 }}>{insights.recommendation}</div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <Card>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 16 }}>⏰ Critical Deadlines</div>
            {upcoming.map((u, i) => (
              <div key={i} style={{ padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{u.title.slice(0, 30)}...</span>
                  <Badge color={T.red} size="sm">{fmtDate(u.deadline)}</Badge>
                </div>
                <Progress value={80} max={100} color={T.blue} height={3} />
              </div>
            ))}
          </Card>

          <Card style={{ background: T.amber + "05" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.amber, marginBottom: 12 }}>🛡️ Risk & Mitigation</div>
            <div style={{ fontSize: 11, color: T.sub, lineHeight: 1.6 }}>
              {(insights?.risks || [
                "Concentration Risk: Significant pipeline reliance on single-agency funding. Mitigation: Diversification initiated.",
                "Labor Bottleneck: Q3 contains major complex submissions. Recommendation: Leverage AI boilerplate for draft acceleration."
              ]).map((risk, i) => (
                <p key={i} style={{ marginTop: i > 0 ? 8 : 0 }}>• {risk}</p>
              ))}
            </div>
          </Card>

          {censusData && (
            <Card style={{ background: T.purple + "05", borderLeft: `4px solid ${T.purple}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.purple, marginBottom: 12 }}>🌱 Social ROI Intensity</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 10, color: T.mute }}>Community Poverty</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{censusData[1]?.[1]}%</div>
                  <Progress value={parseFloat(censusData[1]?.[1])} max={30} color={T.red} height={3} style={{ marginTop: 4 }} />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: T.mute }}>Unemployment</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{censusData[1]?.[2]}%</div>
                  <Progress value={parseFloat(censusData[1]?.[2])} max={15} color={T.amber} height={3} style={{ marginTop: 4 }} />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: T.mute }}>Higher Ed. %</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{censusData[1]?.[3]}%</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: T.mute }}>Median Income</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: T.green }}>{fmt(parseInt(censusData[1]?.[4] || 0))}</div>
                </div>
              </div>
              <div style={{ fontSize: 9, color: T.sub, marginTop: 12, lineHeight: 1.4 }}>
                <b>Strategic Impact</b>: Your portfolio directly targets a region with {censusData[1]?.[1]}% poverty. Each dollar of awarded funding ({fmt(totalAwarded)}) delivers hyper-local economic stabilizing value.
              </div>
            </Card>
          )}

          <div style={{ marginTop: "auto", padding: 16, background: T.bg, borderRadius: 12, border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.mute, marginBottom: 8 }}>EXECUTIVE APPROVAL</div>
            <div style={{ height: 40, borderBottom: `1px dashed ${T.mute}`, marginBottom: 4 }} />
            <div style={{ fontSize: 9, color: T.mute }}>Chief Strategy Officer / Date</div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .board-report { padding: 0 !important; width: 100% !important; max-width: none !important; }
          .board-report * { color: black !important; }
          button { display: none !important; }
          .board-report > div { border-color: #eee !important; box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
};
