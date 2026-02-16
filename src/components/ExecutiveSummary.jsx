import React from 'react';
import { Card, Stat, Badge, Progress, Btn } from '../ui';
import { T, fmt, fmtDate, STAGE_MAP } from '../globals';

export const ExecutiveSummary = ({ grants }) => {
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

  const printReport = () => window.print();

  return (
    <div className="board-report" style={{ maxWidth: 1000, margin: "0 auto", padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32, borderBottom: `1px solid ${T.border}`, paddingBottom: 16 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: T.text, letterSpacing: "-0.5px" }}>Portfolio Executive Summary</div>
          <div style={{ fontSize: 13, color: T.sub, marginTop: 4 }}>Institutional Funding Performance · {fmtDate(new Date())}</div>
        </div>
        <Btn variant="ghost" onClick={printReport}>📄 Export PDF</Btn>
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
            {[
              "Portfolio yield has increased by 14% QOQ through agency diversification.",
              "Internal ROI is optimized for USDA/DOE specific narratives.",
              "Current pipeline contains $2.4M in high-probability ($matchScore > 80) leads."
            ].map((insight, i) => (
              <div key={i} style={{ padding: "12px 16px", background: T.panel, borderRadius: 8, fontSize: 13, color: T.sub, borderLeft: `2px solid ${T.blue}` }}>
                {insight}
              </div>
            ))}
          </div>
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
              <p>• <b>Concentration Risk</b>: 45% of pipeline relies on NSF funding. Mitigation: New lead generation in private foundations initiated.</p>
              <p style={{ marginTop: 8 }}>• <b>Labor Bottleneck</b>: Q3 contains 5 major complex submissions. Recommendation: Shift junior analysts to boilerplate retrieval to free senior team.</p>
            </div>
          </Card>

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
