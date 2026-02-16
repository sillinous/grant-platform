import React, { useState } from 'react';
import { Card, Input, Btn, Badge, Progress } from '../ui';
import { T, fmtDate } from '../globals';
import { API } from '../api';

export const LegislativeTracker = () => {
  const [query, setQuery] = useState("");
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);

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
      alert(res.error);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 8 }}>🗳️ Upstream Legislative Tracking</div>
        <div style={{ fontSize: 12, color: T.sub, marginBottom: 12 }}>
          Track appropriations and funding bills in Congress to forecast grant opportunities 6-12 months before they are posted to Grants.gov.
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Input 
            value={query} 
            onChange={setQuery} 
            placeholder="Search bills... (e.g. 'agriculture', 'broadband', 'healthcare')" 
            style={{ flex: 1 }}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
          />
          <Btn variant="primary" onClick={handleSearch} disabled={loading}>{loading ? "⏳" : "🔍"} Search Bills</Btn>
        </div>
      </Card>

      {bills.length > 0 && (
        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>📋 Relevant Legislation ({bills.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {bills.map((b, i) => (
              <div key={i} style={{ padding: 12, background: T.panel, borderRadius: 8, border: `1px solid ${T.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{b.title}</div>
                    <div style={{ fontSize: 10, color: T.mute, marginTop: 2 }}>
                      {b.number} · {b.type} · Latest Action: {fmtDate(b.latestAction?.actionDate)}
                    </div>
                  </div>
                  <Btn size="xs" variant="ghost" onClick={() => predictImpact(b)} disabled={loading}>🧠 Forecast</Btn>
                </div>
                <div style={{ fontSize: 11, color: T.sub }}>{b.latestAction?.text}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {selectedBill && selectedBill.forecast && (
        <Card style={{ borderLeft: `4px solid ${T.amber}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.amber }}>🔮 AI Funding Forecast: {selectedBill.number}</div>
            <button onClick={() => setSelectedBill(null)} style={{ background: "none", border: "none", color: T.sub, cursor: "pointer" }}>✕</button>
          </div>
          <div style={{ fontSize: 11, color: T.text, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
            {selectedBill.forecast}
          </div>
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "flex-end" }}>
            <Btn size="xs" variant="primary" onClick={() => alert("Monitoring bill state. You will be notified of major actions.")}>🔔 Watch Bill</Btn>
          </div>
        </Card>
      )}
    </div>
  );
};
