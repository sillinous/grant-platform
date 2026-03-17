import React, { useState, useEffect } from 'react';
import { Card, Input, Btn, Stat, Badge, Empty, ScoreRing, ScanProgress, Progress } from '../ui';
import { LS, T, uid, fmt, fmtDate, PROFILE } from '../globals';
import { API } from '../api';
import { useStore } from '../store';

// Build default watch terms from the org profile focus areas
const getDefaultWatchTerms = () => {
  const profile = window.__PROFILE || PROFILE || {};
  const focus = profile.focus || [];
  const tags = profile.tags || [];
  const loc = profile.loc ? profile.loc.split(',')[0].trim() : '';
  const fromFocus = focus.slice(0, 4).map(f => f.toLowerCase());
  const fromTags = tags.slice(0, 2).map(t => t.toLowerCase());
  const defaults = ['rural technology', 'disability entrepreneurship', 'small business innovation', 'workforce development'];
  // Merge profile-derived terms first, then fill with defaults
  const merged = [...new Set([...fromFocus, ...fromTags, ...(loc ? [loc] : []), ...defaults])];
  return merged.slice(0, 8);
};

export const MatchAlerts = ({ onAdd }) => {
  const { grants, addGrant: storeAddGrant, alliances = [] } = useStore();
  const activeOnAdd = onAdd || storeAddGrant;
  const [alerts, setAlerts] = useState(() => LS.get('match_alerts', []));
  const [watchTerms, setWatchTerms] = useState(() => LS.get('watch_terms', getDefaultWatchTerms()));
  const [newTerm, setNewTerm] = useState('');
  const [scanning, setScanning] = useState(false);
  const [activeTerm, setActiveTerm] = useState(null);
  const [scanDone, setScanDone] = useState(false);
  const [lastScan, setLastScan] = useState(() => LS.get('last_scan', null));

  useEffect(() => { LS.set('match_alerts', alerts); }, [alerts]);
  useEffect(() => { LS.set('watch_terms', watchTerms); }, [watchTerms]);

  // Auto-scan on first open if we have no alerts yet
  useEffect(() => {
    if (alerts.length === 0 && !scanning && !lastScan) {
      setTimeout(() => scanAll(), 800);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addWatch = () => {
    if (!newTerm.trim() || watchTerms.includes(newTerm.trim())) return;
    setWatchTerms(prev => [...prev, newTerm.trim()]);
    setNewTerm('');
  };

  const removeWatch = (term) => setWatchTerms(prev => prev.filter(t => t !== term));

  const scanAll = async () => {
    setScanning(true);
    setScanDone(false);
    const newAlerts = [];
    const seen = new Set([...grants.map(g => g.title), ...alerts.map(a => a.title)]);

    const [j40, wages] = await Promise.all([
      API.checkJustice40Status(window.__PROFILE?.zip || '60601').catch(() => ({ qualified: false })),
      API.getBLSWageData().catch(() => ({ benchmarks: {} }))
    ]);
    const justice40Bonus = j40.qualified ? 20 : 0;

    for (const term of watchTerms.slice(0, 6)) {
      setActiveTerm(term);
      try {
        const [grantsData, spendingData] = await Promise.all([
          API.searchGrants(term, { rows: 8 }),
          API.searchAwardRecipients(term).catch(() => ({ results: [] }))
        ]);

        const hits = [...(grantsData.oppHits || []), ...(spendingData.results || []).map(r => ({
          title: r.recipient_name + ' — ' + (r.award_type || 'Federal Award'),
          agency: r.awarding_agency_name || 'USASpending',
          awardCeiling: r.total_obligation || 0,
          description: `USASpending peer data: ${r.recipient_name} received federal funds in this sector.`,
          _source: 'USASpending'
        }))];

        hits.forEach(opp => {
          const title = opp.title || opp.opportunityTitle || '';
          if (!title || seen.has(title)) return;
          seen.add(title);

          const text = `${title} ${opp.description || opp.synopsis || ''}`.toLowerCase();
          const breakdown = [];
          let score = 0;

          if (text.includes('rural') || text.includes('underserved')) { score += 18; breakdown.push('Rural/Underserved +18'); }
          if (text.includes('disab')) { score += 15; breakdown.push('Disability Focus +15'); }
          if (text.includes('small business') || text.includes('sbir')) { score += 12; breakdown.push('SBIR/Small Biz +12'); }
          if (text.includes('technology') || text.includes('ai') || text.includes('innovation')) { score += 10; breakdown.push('Tech/Innovation +10'); }
          if (text.includes('poverty') || text.includes('low-income')) { score += 12; breakdown.push('Poverty/Low-Income +12'); }
          if (text.includes('workforce') || text.includes('training')) { score += 10; breakdown.push('Workforce Dev +10'); }
          if (text.includes('broadband') || text.includes('digital')) { score += 8; breakdown.push('Digital Equity +8'); }

          const profile = window.__PROFILE || PROFILE || { loc: 'Illinois', focus: [] };
          const locTerms = profile.loc?.toLowerCase().split(',').map(s => s.trim());
          if (locTerms?.some(l => text.includes(l))) { score += 10; breakdown.push('Location Match +10'); }

          const focusMatch = (profile.focus || []).filter(f => text.includes(f.toLowerCase()));
          if (focusMatch.length > 0) { score += focusMatch.length * 8; breakdown.push(`Focus Match (${focusMatch.join(', ')}) +${focusMatch.length * 8}`); }

          const agency = opp.agency || opp.agencyName || '';
          const isAllianceMatch = alliances.some(a => a.name?.toLowerCase().includes(agency.toLowerCase()));
          if (isAllianceMatch) { score += 25; breakdown.push('Alliance Relationship +25'); }
          if (justice40Bonus > 0) { score += justice40Bonus; breakdown.push(`Justice40 Priority +${justice40Bonus}`); }

          if (score >= 10) {
            newAlerts.push({
              id: uid(), title, agency,
              amount: opp.awardCeiling || opp.estimatedFunding || 0,
              deadline: opp.closeDate || '',
              description: (opp.description || opp.synopsis || '').slice(0, 350),
              matchScore: Math.min(score, 100),
              matchTerm: term,
              source: opp._source || 'Grants.gov',
              breakdown,
              isAllianceMatch,
              discoveredAt: new Date().toISOString(),
              dismissed: false,
              oppId: opp.id || opp.opportunityId,
            });
          }
        });
      } catch {}
      await new Promise(r => setTimeout(r, 400));
    }

    setAlerts(prev => [...newAlerts, ...prev].slice(0, 75));
    setLastScan(new Date().toISOString());
    LS.set('last_scan', new Date().toISOString());
    setScanDone(true);
    setActiveTerm(null);
    setTimeout(() => { setScanning(false); setScanDone(false); }, 2500);
  };

  const dismissAlert = (id) => setAlerts(prev => prev.map(a => a.id === id ? { ...a, dismissed: true } : a));
  const trackAlert = (alert) => {
    activeOnAdd({
      id: uid(), title: alert.title, agency: alert.agency, amount: alert.amount,
      deadline: alert.deadline, stage: 'discovered', description: alert.description,
      oppId: alert.oppId, createdAt: new Date().toISOString(),
      notes: `Discovered via Match Alert (${alert.matchTerm})`, tags: [alert.matchTerm],
    });
    dismissAlert(alert.id);
  };

  const activeAlerts = alerts.filter(a => !a.dismissed);
  const [filterSource, setFilterSource] = useState('All');
  const [expandedAlert, setExpandedAlert] = useState(null);

  const filteredAlerts = activeAlerts
    .filter(a => filterSource === 'All' || a.source === filterSource)
    .sort((a, b) => b.matchScore - a.matchScore);

  const sources = ['All', ...new Set(activeAlerts.map(a => a.source).filter(Boolean))];
  const avgMatch = activeAlerts.length > 0 ? Math.round(activeAlerts.reduce((s, a) => s + a.matchScore, 0) / activeAlerts.length) : 0;

  return (
    <div className="animate-in">
      {/* ─── Watch List Config ─── */}
      <Card style={{ marginBottom: 20, borderTop: `3px solid ${T.amber}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ fontSize: 20 }}>🔔</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: T.text, fontFamily: 'Outfit' }}>Grant Watch List</div>
            <div style={{ fontSize: 11, color: T.sub }}>Monitor Grants.gov + USASpending for new grants matching your keywords, scored against your profile.</div>
          </div>
          {lastScan && <div style={{ marginLeft: 'auto', fontSize: 10, color: T.mute, fontWeight: 700 }}>Last scan: {fmtDate(lastScan)}</div>}
        </div>

        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
          {watchTerms.map(t => (
            <Badge key={t} color={T.blue} onClick={() => removeWatch(t)} style={{ cursor: 'pointer', paddingRight: 6 }}>
              {t} <span style={{ opacity: 0.6, fontWeight: 400 }}>✕</span>
            </Badge>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <Input value={newTerm} onChange={e => setNewTerm(e.target.value)} placeholder="Add watch keyword..." style={{ flex: 1 }} onKeyDown={e => e.key === 'Enter' && addWatch()} />
          <Btn size="sm" onClick={addWatch}>+ Add</Btn>
          <Btn variant="primary" onClick={scanAll} disabled={scanning} style={{ minWidth: 110 }}>
            {scanning ? <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', marginRight: 4 }}>⚙️</span>Scanning</> : '🔍 Scan Now'}
          </Btn>
        </div>
      </Card>

      {/* ─── Scan Progress ─── */}
      {scanning && (
        <ScanProgress terms={watchTerms.slice(0, 6)} currentTerm={activeTerm} done={scanDone} />
      )}

      {/* ─── Stats ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Active Alerts', value: activeAlerts.length, color: T.amber },
          { label: 'Watch Terms', value: watchTerms.length, color: T.blue },
          { label: 'Tracked', value: alerts.filter(a => a.dismissed).length, color: T.green },
          { label: 'Avg Match', value: avgMatch > 0 ? `${avgMatch}%` : '—', color: T.purple }
        ].map(({ label, value, color }) => (
          <Card key={label} style={{ padding: '14px 18px', background: `${color}08`, borderTop: `2px solid ${color}` }}>
            <Stat label={label} value={value} color={color} />
          </Card>
        ))}
      </div>

      {/* ─── Source Filters ─── */}
      {activeAlerts.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {sources.map(s => (
            <button key={s} onClick={() => setFilterSource(s)} style={{
              padding: '5px 14px', borderRadius: 20,
              border: `1px solid ${filterSource === s ? T.amber + '60' : T.glassBorder}`,
              background: filterSource === s ? `${T.amber}14` : 'transparent',
              color: filterSource === s ? T.amber : T.sub,
              fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
            }}>{s}{s !== 'All' && ` (${activeAlerts.filter(a => a.source === s).length})`}</button>
          ))}
        </div>
      )}

      {/* ─── Alert Cards ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {filteredAlerts.length === 0
          ? <div style={{ gridColumn: '1 / -1' }}>
            <Empty icon="🔔" title="No alerts yet" sub="Click 'Scan Now' to check Grants.gov + USASpending for new grants matching your watch terms." action="Scan Now" onAction={scanAll} />
          </div>
          : filteredAlerts.map(a => {
            const topColor = a.matchScore >= 75 ? T.green : a.matchScore >= 45 ? T.amber : T.mute;
            return (
              <Card key={a.id} interactive glow={a.matchScore >= 70} style={{ borderTop: `5px solid ${topColor}`, padding: 22, cursor: 'default' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ flex: 1, marginRight: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                      <Badge color={topColor} style={{ background: `${topColor}12`, fontWeight: 900 }}>
                        MATCH {a.matchScore}%
                      </Badge>
                      <Badge color={T.blue} style={{ background: `${T.blue}0d`, textTransform: 'none', fontWeight: 700 }}>#{a.matchTerm}</Badge>
                      {a.source && a.source !== 'Grants.gov' && <Badge color={T.purple} style={{ background: `${T.purple}0d`, fontSize: 9 }}>{a.source}</Badge>}
                      {a.isAllianceMatch && <Badge color={T.teal} style={{ background: `${T.teal}0d`, fontSize: 9 }}>🤝 Alliance</Badge>}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: T.text, lineHeight: 1.35, fontFamily: 'Outfit' }}>{a.title}</div>
                    <div style={{ fontSize: 10, color: T.mute, fontWeight: 800, letterSpacing: 1.2, marginTop: 4 }}>{a.agency?.toUpperCase()}</div>
                  </div>
                  <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <ScoreRing score={a.matchScore} size={52} />
                    {a.amount > 0 && <div style={{ fontSize: 13, fontWeight: 900, color: T.green, whiteSpace: 'nowrap' }}>{fmt(a.amount)}</div>}
                    {a.deadline && <div style={{ fontSize: 10, color: T.mute, fontWeight: 700, whiteSpace: 'nowrap' }}>{fmtDate(a.deadline)}</div>}
                  </div>
                </div>

                {/* Match bar */}
                <div style={{ marginBottom: 12 }}>
                  <Progress value={a.matchScore} color={topColor} height={4} />
                </div>

                <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.7, marginBottom: 12, padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: `1px solid ${T.glassBorder}` }}>
                  {a.description?.slice(0, 220)}{a.description?.length > 220 ? '…' : ''}
                </div>

                {a.breakdown && expandedAlert === a.id && (
                  <div style={{ marginBottom: 12, padding: 12, background: `${T.amber}08`, borderRadius: 8, border: `1px solid ${T.amber}22`, animation: 'fadeIn 0.25s' }}>
                    <div style={{ fontSize: 10, fontWeight: 900, color: T.amber, marginBottom: 8, letterSpacing: 1 }}>SCORE BREAKDOWN</div>
                    {a.breakdown.map((b, i) => (
                      <div key={i} style={{ fontSize: 11, color: T.sub, marginBottom: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: T.green, fontWeight: 700 }}>+</span>{b}
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, borderTop: `1px solid ${T.glassBorder}`, paddingTop: 14 }}>
                  <Btn variant="success" style={{ flex: 1, fontSize: 12 }} onClick={() => trackAlert(a)}>📋 Track Grant</Btn>
                  {a.breakdown && <Btn size="sm" variant="ghost" onClick={() => setExpandedAlert(expandedAlert === a.id ? null : a.id)} style={{ border: `1px solid ${T.amber}30` }}>📊 {expandedAlert === a.id ? 'Hide' : 'Why?'}</Btn>}
                  <Btn size="sm" variant="ghost" onClick={() => dismissAlert(a.id)} style={{ color: T.mute }}>✕</Btn>
                </div>
              </Card>
            );
          })
        }
      </div>
    </div>
  );
};
