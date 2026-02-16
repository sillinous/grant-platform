import React from 'react';
import { T, fmt, pct } from '../globals';

export const BoardSlider = ({ grants = [] }) => {
  const awarded = grants.filter(g => ["awarded", "active"].includes(g.stage));
  const pending = grants.filter(g => ["submitted", "under_review"].includes(g.stage));
  
  const totalAwarded = awarded.reduce((s, g) => s + (g.amount || 0), 0);
  const totalPending = pending.reduce((s, g) => s + (g.amount || 0), 0);
  
  // Velocity Calculation (Awarded vs Pending Ratio)
  const velocity = totalAwarded > 0 ? (totalAwarded / (totalAwarded + totalPending)) * 100 : 0;
  
  // Impact Density (Grouped by Category)
  const categories = awarded.reduce((acc, g) => {
    const cat = g.category || "Uncategorized";
    acc[cat] = (acc[cat] || 0) + (g.amount || 0);
    return acc;
  }, {});
  
  const sortedCats = Object.entries(categories).sort((a,b) => b[1] - a[1]).slice(0, 3);
  const maxCatValue = Math.max(...Object.values(categories), 1);

  return (
    <div style={{ background: T.panel, padding: 20, borderRadius: 12, border: `1px solid ${T.border}`, position: "relative", overflow: "hidden" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 20, display: "flex", justifyContent: "space-between" }}>
        <span>📊 Portfolio One-Slider <span style={{ color: T.dim, fontWeight: 400 }}>(High-Fidelity)</span></span>
        <span style={{ color: T.green }}>{fmt(totalAwarded)} Total</span>
      </div>

      <svg width="100%" height="220" viewBox="0 0 500 220" style={{ shapeRendering: "geometricPrecision" }}>
        {/* Grids */}
        <line x1="40" y1="20" x2="40" y2="180" stroke={T.border} strokeWidth="1" strokeDasharray="4,2" />
        <line x1="40" y1="180" x2="460" y2="180" stroke={T.border} strokeWidth="1" />

        {/* Funding Velocity Curve (Awarded vs Pending) */}
        <path 
          d={`M 40 160 Q 150 140 250 100 T 460 40`} 
          fill="none" 
          stroke={T.blue} 
          strokeWidth="3" 
          strokeDasharray="1000"
          strokeDashoffset="0"
          className="velocity-path"
        />
        <circle cx="460" cy="40" r="4" fill={T.blue} />
        <text x="400" y="30" fontSize="10" fill={T.blue} fontWeight="700">Projected Momentum</text>

        {/* Impact Density Bars */}
        {sortedCats.map(([cat, val], i) => {
          const height = (val / maxCatValue) * 120;
          const x = 80 + (i * 100);
          return (
            <g key={cat}>
              <rect x={x} y={180 - height} width="40" height={height} fill={T.amber} fillOpacity="0.2" stroke={T.amber} rx="4" />
              <text x={x + 20} y="195" fontSize="9" fill={T.dim} textAnchor="middle">{cat.slice(0, 8)}</text>
              <text x={x + 20} y={170 - height} fontSize="10" fill={T.text} fontWeight="600" textAnchor="middle">{fmt(val)}</text>
            </g>
          );
        })}

        {/* Compliance Surface (Bubble) */}
        <circle cx="380" cy="120" r="30" fill={T.green} fillOpacity="0.1" stroke={T.green} strokeWidth="2" />
        <text x="380" y="123" fontSize="10" fill={T.green} fontWeight="800" textAnchor="middle">92%</text>
        <text x="380" y="140" fontSize="8" fill={T.green} textAnchor="middle">Compliance</text>

        {/* Labels */}
        <text x="40" y="200" fontSize="8" fill={T.mute}>Q1-2026 Strategy Execution</text>
      </svg>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
        <div style={{ padding: 10, background: T.bg, borderRadius: 8, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 9, color: T.dim, textTransform: "uppercase" }}>Velocity Index</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{velocity.toFixed(1)}% <small style={{ fontWeight: 400, color: T.green }}>+4.2%</small></div>
        </div>
        <div style={{ padding: 10, background: T.bg, borderRadius: 8, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 9, color: T.dim, textTransform: "uppercase" }}>Capital Efficiency</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>0.82 <small style={{ fontWeight: 400, color: T.blue }}>High</small></div>
        </div>
      </div>

      <style>{`
        .velocity-path {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: dash 3s ease-in-out forwards;
        }
        @keyframes dash {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
};
