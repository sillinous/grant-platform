import React, { useState } from 'react';
import { Card, Input, Btn, Badge, Progress, SkeletonCard, Empty, TrackBtn } from '../ui';
import { T, fmtDate, uid, toast} from '../globals';
import { API } from '../api';
import { useStore } from '../store';

export const LegislativeTracker = ({ onAdd: propOnAdd }) => {
  const { addGrant: storeOnAdd, events, setEvents } = useStore();
  const onAdd = propOnAdd || storeOnAdd;
  const [query, setQuery] = useState("");
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [sponsorIntel, setSponsorIntel] = useState({});

  const lookupSponsor = async (sponsorName) => {
    if (!sponsorName || sponsorIntel[sponsorName]) return;
    const results = await API.searchFecInfluence(sponsorName);
    const top = Array.isArray(results) ? results[0] : null;
    if (top) setSponsorIntel(prev => ({ ...prev, [sponsorName]: top }));
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    const data = await API.searchBills(query);
    setBills(data.bills || []);
    setLoading(false);
  };

  const predictImpact = async (bill) => {
    setLoading(true);
    const sys = `You are a Legislative Funding Analyst. Analyze this Congressional bill to predict its impact on future grant opportunities.
    Bill: ${bill.title} (${bill.number})
    Type: ${bill.type}
    Latest Action: ${bill.latestAction?.text || "None"}
    
    Provide a strategic FORECAST:
    1. FUNDING VELOCITY: How soon will these funds reach the grant market? (e.g., 6-12 months).
    2. KEY PRIORITIES: What specific activities are being funded?
    3. TARGET RECIPIENTS: Who should start preparing now?
    
    Return a concise, professional legislative forecast.`;
    
    const res = await API.callAI([{ role: "user", content: "Generate Funding Forecast." }], sys);
    if (!res.error) {
      setSelectedBill({ ...bill, forecast: res.text });
    } else {
      toast(res.error);
    }
    setLoading(false);
  };

  return (
    <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Card style={{ background: T.glassLg }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ fontSize: 20 }}>🗳️</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text, fontFamily: "Outfit" }}>Upstream Legislative Tracking</div>
        </div>
        <div style={{ fontSize: 12, color: T.sub, marginBottom: 12 }}>
          Track appropriations and funding bills in Congress to forecast grant opportunities 6-12 months before they are posted to Grants.gov.
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Input 
            value={query} 
            onChange={e => setQuery(e.target.value)} 
            placeholder="Search bills... (e.g. 'agriculture', 'broadband', 'healthcare')" 
            style={{ flex: 1 }}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
          />
          <Btn variant="primary" onClick={handleSearch} disabled={loading}>{loading ? "⏳" : "🔍"} Search Bills</Btn>
        </div>
      </Card>

      {loading && <div style={{ marginBottom: 20 }}><SkeletonCard lines={4} /><SkeletonCard lines={4} /></div>}

      {bills.length === 0 && !loading && (
        <Empty icon="🗳️" title="No Bills Searched" sub="Search for keywords like 'agriculture' or 'broadband' to find active Congressional bills." />
      )}

      {bills.length > 0 && !loading && (
        <Card glow style={{ borderTop: `4px solid ${T.blue}` }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: T.text, marginBottom: 20, letterSpacing: 1, textTransform: "uppercase" }}>📋 Strategic Appropriations ({bills.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {bills.map((b, i) => (
              <div key={i} style={{ padding: 16, background: "rgba(255,255,255,0.02)", borderRadius: 12, border: `1px solid ${T.glassBorder}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: T.text, fontFamily: "Outfit" }}>{b.title}</div>
                    <div style={{ fontSize: 12, color: T.sub, marginTop: 4, fontWeight: 700, letterSpacing: 0.5 }}>
                      {b.number?.toUpperCase()} • {b.type?.toUpperCase()} • ACTION: {fmtDate(b.latestAction?.actionDate)}
                    </div>
                    {b.sponsor?.name && (
                      <div style={{ marginTop: 6 }}>
                        <span
                          style={{ fontSize: 11, color: T.blue, cursor: "pointer", textDecoration: "underline" }}
                          onClick={() => lookupSponsor(b.sponsor.name)}
                        >
                          Sponsor: {b.sponsor.name} {sponsorIntel[b.sponsor.name] ? `— ${(sponsorIntel[b.sponsor.name].party || "?")} / $${((sponsorIntel[b.sponsor.name].totalReceipts || 0) / 1000000).toFixed(1)}M raised` : "📊 FEC"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {events?.some(e => e.title.includes(b.number)) ? (
                      <Btn size="xs" variant="ghost" disabled style={{ color: T.green }}>✓ Scheduled</Btn>
                    ) : (
                      <Btn size="xs" variant="ghost" onClick={() => {
                        setEvents([...(events || []), {
                          id: uid(),
                          title: `Legis: ${b.number} - ${b.title.slice(0, 30)}...`,
                          date: b.latestAction?.actionDate || new Date().toISOString(),
                          type: "milestone",
                          color: T.blue,
                          notes: `Legislative Action: ${b.latestAction?.text}`
                        }]);
                      }}>📅 Add to Calendar</Btn>
                    )}
                    <Btn size="xs" variant="primary" onClick={() => predictImpact(b)} disabled={loading}>🧠 Run Forecast</Btn>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.5 }}>{b.latestAction?.text}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {selectedBill && selectedBill.forecast && (
        <Card glow style={{ borderLeft: `6px solid ${T.amber}`, background: `${T.amber}05`, padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: T.amber, letterSpacing: 2 }}>🔮 AI STRATEGIC FUNDING FORECAST: {selectedBill.number}</div>
            <button onClick={() => setSelectedBill(null)} style={{ background: "none", border: "none", color: T.sub, cursor: "pointer", fontSize: 16 }}>✕</button>
          </div>
          <div style={{ fontSize: 14, color: T.text, whiteSpace: "pre-wrap", lineHeight: 1.7, fontStyle: "italic", marginBottom: 24 }}>
            {selectedBill.forecast}
          </div>
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${T.glassBorder}`, display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <Btn variant="ghost" onClick={() => toast("Monitoring bill state. You will be notified of major actions.")}>🔔 Watch Action</Btn>
            {onAdd && (
              <TrackBtn onTrack={() => onAdd({
                id: uid(), title: selectedBill.title, agency: "Legislative Forecast",
                stage: "discovered", description: selectedBill.forecast, category: "Foresight",
                createdAt: new Date().toISOString()
              })} label="+ Track Strategy" />
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
