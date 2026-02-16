import React, { useState, useMemo } from 'react';
import { Card, Btn, Stat, MiniBar } from '../ui';
import { T, PROFILE, fmt, fmtDate, getProfileState } from '../globals';
import { API } from '../api';

export const FundingForecast = ({ grants }) => {
  const [forecastMonths, setForecastMonths] = useState(12);
  const [loading, setLoading] = useState(false);
  const [trendData, setTrendData] = useState(null);

  const loadTrends = async () => {
    setLoading(true);
    try {
      const years = [2020, 2021, 2022, 2023, 2024];
      const promises = years.map(fy => API.getSpendingByState(getProfileState().abbr, fy));
      const results = await Promise.all(promises);
      const trends = years.map((y, i) => {
        const total = (results[i].results || []).reduce((s, r) => s + (r.aggregated_amount || 0), 0);
        return { year: y, label: `FY${y}`, value: total, total };
      });
      setTrendData(trends);
    } catch { setTrendData([]); }
    setLoading(false);
  };

  const awarded = grants.filter(g => ["awarded","active"].includes(g.stage));
  const pending = grants.filter(g => ["submitted","under_review"].includes(g.stage));
  const pipeline = grants.filter(g => !["awarded","active","closeout","declined","submitted","under_review"].includes(g.stage));

  const monthlyForecast = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < forecastMonths; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthLabel = d.toLocaleDateString("en-US", { month:"short", year:"2-digit" });
      let monthRevenue = awarded.reduce((s,g) => s + ((g.amount||0) / 12), 0);
      const pendingContrib = pending.reduce((s,g) => s + ((g.amount||0) * 0.3 / 12), 0);
      if (i >= 2) monthRevenue += pendingContrib;
      const pipeContrib = pipeline.reduce((s,g) => s + ((g.amount||0) * 0.1 / 12), 0);
      if (i >= 6) monthRevenue += pipeContrib;
      months.push({ label: monthLabel, value: Math.round(monthRevenue), month: i + 1 });
    }
    return months;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grants, forecastMonths]);

  const cumulative = monthlyForecast.reduce((acc, m) => {
    const prev = acc.length > 0 ? acc[acc.length - 1].value : 0;
    acc.push({ ...m, value: prev + m.value });
    return acc;
  }, []);

  const projectedAnnual = monthlyForecast.reduce((s,m) => s + m.value, 0);

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:8, marginBottom:16 }}>
        <Card glow><Stat label="Projected Annual" value={fmt(projectedAnnual)} color={T.amber} /></Card>
        <Card><Stat label="Monthly Avg" value={fmt(projectedAnnual / forecastMonths)} color={T.blue} /></Card>
        <Card><Stat label="Confidence" value={awarded.length > 0 ? "Medium" : "Low"} color={awarded.length > 0 ? T.yellow : T.red} /></Card>
        <Card><Stat label="Data Points" value={grants.length} color={T.purple} /></Card>
      </div>

      <Card style={{ marginBottom:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div style={{ fontSize:13, fontWeight:600, color:T.text }}>📈 Revenue Forecast</div>
          <div style={{ display:"flex", gap:4 }}>
            {[6,12,18,24].map(m => (
              <Btn key={m} size="sm" variant={forecastMonths === m ? "primary" : "ghost"} onClick={() => setForecastMonths(m)}>{m}mo</Btn>
            ))}
          </div>
        </div>
        <MiniBar data={monthlyForecast.slice(0,12)} height={120} color={T.green} />
        <div style={{ fontSize:10, color:T.mute, marginTop:4 }}>Monthly projected inflow based on: awarded (100%), pending (30% × 2-month lag), pipeline (10% × 6-month lag)</div>
      </Card>

      <Card style={{ marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:8 }}>📊 Cumulative Revenue</div>
        <MiniBar data={cumulative.slice(0,12)} height={120} color={T.amber} />
      </Card>

      <Card style={{ marginBottom:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>🏛️ {PROFILE.loc ? PROFILE.loc.split(",").pop()?.trim() : getProfileState().abbr} Federal Grant Trends</div>
          <Btn variant="primary" size="sm" onClick={loadTrends} disabled={loading}>{loading ? "⏳ Loading..." : "📊 Load Trends"}</Btn>
        </div>
        {trendData && <MiniBar data={trendData} height={100} color={T.blue} />}
        {trendData && (
          <div style={{ fontSize:11, color:T.sub, marginTop:8 }}>
            {(() => {
              const latest = trendData[trendData.length - 1]?.total || 0;
              const prev = trendData[trendData.length - 2]?.total || 1;
              const change = ((latest - prev) / prev) * 100;
              return `Latest year: ${fmt(latest)} (${change >= 0 ? "+" : ""}${change.toFixed(1)}% vs prior year)`;
            })()}
          </div>
        )}
      </Card>

      <Card>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:8 }}>📋 Forecast Assumptions</div>
        <div style={{ fontSize:12, color:T.sub, lineHeight:1.7 }}>
          <div>Awarded grants: 100% certainty, distributed evenly across 12 months</div>
          <div>Pending applications: 30% conversion rate, 2-month decision lag</div>
          <div>Pipeline grants: 10% ultimate conversion, 6-month development cycle</div>
          <div>Model does not account for: multi-year awards, seasonal patterns, or agency-specific timing</div>
          <div style={{ color:T.mute, marginTop:8, fontStyle:"italic" }}>Confidence increases as you add more awarded and pending grants.</div>
        </div>
      </Card>
    </div>
  );
};
