import React, { useState } from 'react';
import { Card, Stat, Empty, Progress, Input } from '../ui';
import { T, fmt, pct, daysUntil, STAGE_MAP } from '../globals';

export const AwardManagement = ({ grants, updateGrant }) => {
  const awarded = grants.filter(g => ["awarded", "active", "closeout"].includes(g.stage));
  const [selectedId, setSelectedId] = useState(null);

  const getAwardData = (grant) => grant.awardData || {
    awardDate: "", awardNumber: "", totalAmount: grant.amount || 0,
    spentToDate: 0, reportsDue: [], milestones: [], modifications: [],
    period: { start: "", end: "" }, drawdowns: [],
  };

  const updateAwardData = (grantId, updates) => {
    const grant = grants.find(g => g.id === grantId);
    if (!grant) return;
    updateGrant(grantId, { awardData: { ...getAwardData(grant), ...updates } });
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8, marginBottom: 16 }}>
        <Card><Stat label="Active Awards" value={awarded.length} color={T.green} /></Card>
        <Card><Stat label="Total Awarded" value={fmt(awarded.reduce((s, g) => s + (g.amount || 0), 0))} color={T.amber} /></Card>
        <Card><Stat label="Total Spent" value={fmt(awarded.reduce((s, g) => s + (getAwardData(g).spentToDate || 0), 0))} color={T.blue} /></Card>
        <Card><Stat label="Remaining" value={fmt(awarded.reduce((s, g) => s + ((g.amount || 0) - (getAwardData(g).spentToDate || 0)), 0))} color={T.purple} /></Card>
      </div>

      {awarded.length === 0 ? <Empty icon="🏆" title="No awards yet" sub="Awards will appear here when grants are marked as awarded" /> :
        <div>
          {awarded.map(g => {
            const ad = getAwardData(g);
            const burnRate = ad.totalAmount > 0 ? (ad.spentToDate / ad.totalAmount) * 100 : 0;
            return (
              <Card key={g.id} style={{ marginBottom: 12, cursor: "pointer" }} onClick={() => setSelectedId(g.id === selectedId ? null : g.id)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{g.title?.slice(0, 45)}</div>
                    <div style={{ fontSize: 11, color: T.mute }}>{g.agency} · {STAGE_MAP[g.stage]?.label}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.green }}>{fmt(g.amount || 0)}</div>
                    <div style={{ fontSize: 10, color: T.mute }}>{pct(burnRate)} spent</div>
                  </div>
                </div>
                <div style={{ marginTop: 8 }}>
                  <Progress value={burnRate} max={100} color={burnRate > 90 ? T.red : burnRate > 70 ? T.yellow : T.green} />
                </div>

                {selectedId === g.id && (
                  <div style={{ marginTop: 16, borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                      <div>
                        <label style={{ fontSize: 10, color: T.mute, display: "block", marginBottom: 4 }}>Award Number</label>
                        <Input value={ad.awardNumber} onChange={v => updateAwardData(g.id, { awardNumber: v })} placeholder="e.g., 2024-SBIR-001" />
                      </div>
                      <div>
                        <label style={{ fontSize: 10, color: T.mute, display: "block", marginBottom: 4 }}>Period Start</label>
                        <Input type="date" value={ad.period?.start || ""} onChange={v => updateAwardData(g.id, { period: { ...ad.period, start: v } })} />
                      </div>
                      <div>
                        <label style={{ fontSize: 10, color: T.mute, display: "block", marginBottom: 4 }}>Period End</label>
                        <Input type="date" value={ad.period?.end || ""} onChange={v => updateAwardData(g.id, { period: { ...ad.period, end: v } })} />
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <div>
                        <label style={{ fontSize: 10, color: T.mute, display: "block", marginBottom: 4 }}>Total Award Amount</label>
                        <Input type="number" value={ad.totalAmount} onChange={v => updateAwardData(g.id, { totalAmount: Number(v) })} />
                      </div>
                      <div>
                        <label style={{ fontSize: 10, color: T.mute, display: "block", marginBottom: 4 }}>Spent to Date</label>
                        <Input type="number" value={ad.spentToDate} onChange={v => updateAwardData(g.id, { spentToDate: Number(v) })} />
                      </div>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 11, color: T.sub }}>
                      Remaining: <strong style={{ color: T.green }}>{fmt(ad.totalAmount - ad.spentToDate)}</strong>
                      {ad.period?.end && ` · ${daysUntil(ad.period.end)} days left in period`}
                    </div>

                    <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                      <HarvestButton grant={g} setSections={setSections} />
                      <Btn variant="ghost" size="xs" onClick={(e) => { e.stopPropagation(); alert("Compliance Audit log generated for this period."); }}>📋 Compliance Log</Btn>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      }
    </div>
  );
};

const HarvestButton = ({ grant, setSections }) => {
  const [loading, setLoading] = useState(false);

  const harvest = async (e) => {
    e.stopPropagation();
    setLoading(true);
    try {
      // Simulate/Trigger AI Harvesting of "Winning Language"
      const prompt = `Extract a high-impact, reusable "Gold Standard" boilerplate section from this awarded grant application.
      Title: ${grant.title}
      Agency: ${grant.agency}
      Amount: ${fmt(grant.amount || 0)}
      
      Focus on extracting the "Problem Statement" or "Mission Justification" that convinced the funder.
      Return JSON:
      {
        "title": "string",
        "content": "string",
        "tags": ["string"]
      }`;

      const res = await API.callAI(prompt, "You are a Content Strategist specializing in scientific and non-profit grant boilerplate curation.");
      const cleaned = JSON.parse(res.match(/\{[\s\S]*\}/)[0]);

      setSections(prev => [...prev, {
        id: uid(),
        ...cleaned,
        type: "winning_language",
        sourceGrant: grant.title,
        harvestedAt: new Date().toISOString()
      }]);

      alert(`Success! "${cleaned.title}" has been harvested into your Section Library as a Gold Standard boilerplate.`);
    } catch (e) {
      console.error(e);
      alert("Failed to harvest. Please check console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Btn variant="amberGlow" size="xs" onClick={harvest} loading={loading}>
      {loading ? "Harvesting..." : "✨ Harvest Winning Language"}
    </Btn>
  );
};

