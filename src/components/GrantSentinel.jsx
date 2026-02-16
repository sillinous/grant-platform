import React, { useState, useEffect } from 'react';
import { Card, Btn, Badge, Progress, Empty } from '../ui';
import { T, LS, uid, PROFILE, fmt } from '../globals';
import { API } from '../api';

export const GrantSentinel = ({ onAdd, grants }) => {
  const [active, setActive] = useState(() => LS.get("sentinel_active", false));
  const [matches, setMatches] = useState(() => LS.get("sentinel_matches", []));
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => { LS.set("sentinel_active", active); }, [active]);
  useEffect(() => { LS.set("sentinel_matches", matches); }, [matches]);

  const runScan = async () => {
    if (scanning) return;
    setScanning(true);
    setProgress(10);
    
    // Simulate background scanning across multiple sources
    const sources = ["SAM.gov", "Grants.gov", "Foundation Center", "State Portals"];
    for (let i = 0; i < sources.length; i++) {
        await new Promise(r => setTimeout(r, 800));
        setProgress(20 + (i * 20));
    }

    const sys = `You are an Autonomous Grant Scout. Based on the User Profile, find 3 high-probability grant matches that are currently "open" in the ecosystem.
APPLICANT: ${PROFILE.name} | ${PROFILE.tags.join(", ")} | Rural:${PROFILE.rural}

Return ONLY a JSON array of opportunities:
[{ "title": "...", "agency": "...", "amount": 0, "fit": 95, "reason": "...", "deadline": "2026-06-01" }]`;

    const result = await API.callAI([{ role: "user", content: "Scan all sources for 90%+ matches." }], sys);
    
    if (!result.error) {
      try {
        const cleaned = result.text.replace(/```json\n?|```/g, "").trim();
        const found = JSON.parse(cleaned);
        const unique = found.filter(f => !matches.some(m => m.title === f.title) && !grants.some(g => g.title === f.title));
        if (unique.length > 0) {
            setMatches(prev => [...unique.map(u => ({ ...u, id: uid(), foundAt: new Date().toISOString() })), ...prev]);
        }
      } catch (e) { console.error("Sentinel parse error", e); }
    }
    
    setProgress(100);
    setTimeout(() => { setScanning(false); setProgress(0); }, 1000);
  };

  // Simulate periodic background scanning if active
  useEffect(() => {
    let interval;
    if (active) {
      interval = setInterval(() => {
        if (!scanning) runScan();
      }, 60000); // Check every minute in this demo (would be hours in prod)
    }
    return () => clearInterval(interval);
  }, [active, scanning]);

  return (
    <div>
      <Card glow={active} style={{ border: active ? `1px solid ${T.amber}44` : `1px solid ${T.border}`, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text, display: "flex", alignItems: "center", gap: 8 }}>
              📡 AI Grant Sentinel 
              <Badge color={active ? T.green : T.mute}>{active ? "ACTIVE" : "STANDBY"}</Badge>
            </div>
            <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>
              {active ? "Scanning global ecosystem for mission-aligned opportunities..." : "Sentinel is paused. Active monitoring disabled."}
            </div>
          </div>
          <Btn variant={active ? "danger" : "primary"} size="sm" onClick={() => setActive(!active)}>
            {active ? "Stop Monitor" : "Activate Sentinel"}
          </Btn>
        </div>

        {scanning && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.amber, marginBottom: 4 }}>
              <span>Autonomous Scan in Progress...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} max={100} color={T.amber} height={6} />
          </div>
        )}
      </Card>

      <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 12, display: "flex", justifyContent: "space-between" }}>
        <span>🎯 Intelligent Matches ({matches.length})</span>
        {matches.length > 0 && <Btn size="xs" variant="ghost" onClick={() => setMatches([])}>Clear All</Btn>}
      </div>

      {matches.length === 0 ? (
        <Empty icon="📡" title="No Autonomous Matches" sub={active ? "Sentinel is warming up. First batch of results usually appears within 2-5 minutes of activation." : "Activate the Sentinel to begin background monitoring."} />
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {matches.map(m => (
            <Card key={m.id} style={{ background: `linear-gradient(to right, ${T.card}, ${T.panel})`, position: "relative" }}>
              <div style={{ position: "absolute", top: 12, right: 12, textAlign: "right" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: T.green }}>{m.fit}%</div>
                <div style={{ fontSize: 9, color: T.mute }}>MATCH</div>
              </div>
              <div style={{ paddingRight: 60 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{m.title}</div>
                <div style={{ fontSize: 11, color: T.amber, marginTop: 2 }}>{m.agency} · {fmt(m.amount)}</div>
                <div style={{ fontSize: 10, color: T.sub, marginTop: 8, fontStyle: "italic" }}>
                  <span style={{ color: T.amber }}>Why:</span> {m.reason}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <Btn size="xs" variant="primary" onClick={() => {
                    onAdd({ ...m, stage: "discovered", source: "sentinel" });
                    setMatches(prev => prev.filter(x => x.id !== m.id));
                  }}>🎯 Capture Pursuit</Btn>
                  <Btn size="xs" variant="ghost" onClick={() => setMatches(prev => prev.filter(x => x.id !== m.id))}>Hide</Btn>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
