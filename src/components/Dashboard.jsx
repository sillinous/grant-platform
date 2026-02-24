import React, { useState } from 'react';
import { Card, Btn, Empty } from '../ui';
import { T, fmt, fmtDate, daysUntil, STAGE_MAP, PROFILE } from '../globals';
import { useStore } from '../store';
import { API } from '../api';
import { getTier } from '../subscription';

const Sparkline = ({ data = [], color = T.amber, height = 32 }) => {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const w = 80, h = height;
  const pts = data.map((v, i) => `${(i / Math.max(data.length - 1, 1)) * w},${h - (v / max) * h}`).join(' ');
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill={color} opacity={0.08} />
    </svg>
  );
};

const UrgencyPill = ({ days }) => {
  if (days < 0) return <span style={{ fontSize: 10, fontWeight: 700, color: T.mute, background: T.dim, padding: '2px 7px', borderRadius: 99 }}>OVERDUE</span>;
  if (days <= 3) return <span style={{ fontSize: 10, fontWeight: 700, color: '#ff4757', background: '#ff475720', padding: '2px 7px', borderRadius: 99 }}>🔴 {days}d</span>;
  if (days <= 7) return <span style={{ fontSize: 10, fontWeight: 700, color: T.orange, background: T.orange + '20', padding: '2px 7px', borderRadius: 99 }}>🟠 {days}d</span>;
  if (days <= 14) return <span style={{ fontSize: 10, fontWeight: 700, color: T.yellow, background: T.yellow + '20', padding: '2px 7px', borderRadius: 99 }}>🟡 {days}d</span>;
  return <span style={{ fontSize: 10, color: T.sub, padding: '2px 7px', borderRadius: 99, background: T.dim }}>{days}d</span>;
};

const QuickAction = ({ icon, label, desc, color, onClick }) => {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: hov ? color + '12' : T.panel, border: `1px solid ${hov ? color : T.border}`, borderRadius: 10, padding: '12px 14px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 34, height: 34, borderRadius: 8, background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{label}</div>
        <div style={{ fontSize: 10, color: T.sub, marginTop: 1 }}>{desc}</div>
      </div>
    </button>
  );
};

const StageFunnel = ({ grants, navigate }) => {
  const stages = Object.entries(STAGE_MAP);
  const counts = Object.fromEntries(stages.map(([id]) => [id, grants.filter(g => g.stage === id).length]));
  const max = Math.max(...Object.values(counts), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {stages.map(([id, s]) => {
        const count = counts[id];
        const val = grants.filter(g => g.stage === id).reduce((sum, g) => sum + (g.amount || 0), 0);
        return (
          <div key={id} onClick={() => navigate?.(id !== 'all' && 'pipeline')} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <div style={{ width: 68, fontSize: 10, color: T.sub, textAlign: 'right', flexShrink: 0 }}>{s.label}</div>
            <div style={{ flex: 1, height: 13, background: T.dim, borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${(count / max) * 100}%`, height: '100%', background: s.color || T.amber, borderRadius: 3, minWidth: count > 0 ? 4 : 0 }} />
            </div>
            <div style={{ width: 18, fontSize: 11, fontWeight: 700, color: count > 0 ? T.text : T.mute }}>{count}</div>
            {val > 0 && <div style={{ fontSize: 10, color: T.mute, width: 58, textAlign: 'right' }}>{fmt(val)}</div>}
          </div>
        );
      })}
    </div>
  );
};

const AIBriefing = ({ grants }) => {
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(false);
  const fetch_ = async () => {
    setLoading(true);
    try { setBriefing(await API.getCuratedBriefing(PROFILE)); }
    catch (e) { setBriefing(null); }
    setLoading(false);
  };
  if (!briefing && !loading) return (
    <div style={{ textAlign: 'center', padding: '16px 0' }}>
      <div style={{ fontSize: 24, marginBottom: 6 }}>🧠</div>
      <div style={{ fontSize: 12, color: T.sub, marginBottom: 10 }}>AI-curated intelligence for your portfolio</div>
      <Btn onClick={fetch_} variant="primary" size="sm">Generate Briefing</Btn>
    </div>
  );
  if (loading) return <div style={{ textAlign: 'center', padding: '20px 0', color: T.sub, fontSize: 12 }}>⚡ Analyzing portfolio...</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {(briefing?.topPicks || []).slice(0, 3).map((p, i) => (
        <div key={i} style={{ padding: '9px 11px', background: T.bg, borderRadius: 8, border: `1px solid ${T.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: T.amber, fontWeight: 700, marginBottom: 2 }}>{p.sector} · {p.agency}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.text }}>{p.title}</div>
              <div style={{ fontSize: 10, color: T.sub, marginTop: 2, lineHeight: 1.4 }}>{p.reasoning}</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.green }}>{fmt(p.amount)}</div>
              <div style={{ fontSize: 10, color: T.blue }}>{p.matchScore}% match</div>
            </div>
          </div>
        </div>
      ))}
      {(briefing?.insights || []).map((ins, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, padding: '7px 9px', background: T.amberGlow, borderRadius: 7, border: `1px solid ${T.amberDim}30` }}>
          <span style={{ fontSize: 13 }}>{ins.icon}</span>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.amber }}>{ins.label}</div>
            <div style={{ fontSize: 10, color: T.sub, lineHeight: 1.4 }}>{ins.text}</div>
          </div>
        </div>
      ))}
      <Btn variant="ghost" size="xs" onClick={fetch_}>🔄 Refresh</Btn>
    </div>
  );
};

export const Dashboard = ({ navigate }) => {
  const { grants, tasks, vaultDocs, contacts, events } = useStore();
  const activeGrants = grants.filter(g => !['declined', 'archived'].includes(g.stage));
  const awarded = grants.filter(g => ['awarded', 'active', 'closeout'].includes(g.stage));
  const submitted = grants.filter(g => g.stage === 'submitted');
  const decided = grants.filter(g => ['awarded', 'declined'].includes(g.stage));
  const winRate = decided.length > 0 ? Math.round((grants.filter(g => g.stage === 'awarded').length / decided.length) * 100) : 0;
  const totalPipeline = activeGrants.reduce((s, g) => s + (g.amount || 0), 0);
  const totalAwarded = awarded.reduce((s, g) => s + (g.amount || 0), 0);
  const pendingTasks = tasks.filter(t => t.status === 'todo').length;
  const urgent = activeGrants.filter(g => g.deadline).map(g => ({ ...g, days: daysUntil(g.deadline) })).sort((a, b) => a.days - b.days).slice(0, 6);
  const recent = [...grants].sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0)).slice(0, 5);
  const now = Date.now(), weekMs = 7 * 24 * 60 * 60 * 1000;
  const sparkData = Array.from({ length: 8 }, (_, i) => {
    const start = now - (8 - i) * weekMs, end = now - (7 - i) * weekMs;
    return grants.filter(g => { const d = new Date(g.createdAt || 0).getTime(); return d >= start && d < end; }).length;
  });

  // Empty state for new users
  if (grants.length === 0) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 56, marginBottom: 20 }}>🚀</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: T.text, marginBottom: 8 }}>Welcome to Grant Platform</div>
      <div style={{ fontSize: 14, color: T.sub, maxWidth: 440, lineHeight: 1.6, marginBottom: 32 }}>
        Your AI-powered grant intelligence command center. Discover opportunities, write winning proposals, and track your entire portfolio in one place.
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Btn variant="primary" onClick={() => navigate?.('discovery')}>🔍 Discover Grants</Btn>
        <Btn variant="secondary" onClick={() => navigate?.('ai_drafter')}>✍️ Start Writing</Btn>
        <Btn variant="ghost" onClick={() => navigate?.('settings')}>⚙️ Configure AI</Btn>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 48, maxWidth: 600, width: '100%' }}>
        {[['🎯', 'Smart Discovery', '23+ data sources including Grants.gov, USASpending, ProPublica foundations'],
          ['🧠', 'AI-Powered Writing', 'Draft narratives, score proposals, and get red-team feedback in seconds'],
          ['📊', 'Full Lifecycle', 'From discovery to closeout — pipeline, compliance, awards, outcomes']
        ].map(([icon, title, desc]) => (
          <div key={title} style={{ padding: 20, background: T.panel, borderRadius: 12, border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4 }}>{title}</div>
            <div style={{ fontSize: 11, color: T.sub, lineHeight: 1.5 }}>{desc}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1400, margin: '0 auto' }}>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        {[
          { label: 'Pipeline Value', val: fmt(totalPipeline), color: T.amber, sub: `${activeGrants.length} active`, spark: sparkData },
          { label: 'Capital Secured', val: fmt(totalAwarded), color: T.green, sub: `${awarded.length} awards` },
          { label: 'Win Rate', val: `${winRate}%`, color: T.blue, sub: `${decided.length} decided` },
          { label: 'Submitted', val: submitted.length, color: T.purple, sub: 'awaiting decision' },
          { label: 'Open Tasks', val: pendingTasks, color: pendingTasks > 10 ? T.orange : T.cyan, sub: `${tasks.filter(t => t.status === 'done').length} completed` },
        ].map(({ label, val, color, sub, spark }) => (
          <Card key={label} style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 10, color: T.sub, fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{val}</div>
                <div style={{ fontSize: 11, color: T.mute, marginTop: 4 }}>{sub}</div>
              </div>
              {spark && <Sparkline data={spark} color={color} />}
            </div>
          </Card>
        ))}
      </div>

      {/* Main 3-col layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 300px', gap: 16 }}>

        {/* LEFT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>⏰ Upcoming Deadlines</div>
              <Btn size="xs" variant="ghost" onClick={() => navigate?.('calendar')}>Calendar →</Btn>
            </div>
            {urgent.length === 0 ? <Empty label="No upcoming deadlines" icon="📅" /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {urgent.map(g => (
                  <div key={g.id} onClick={() => navigate?.('pipeline')} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: g.days <= 3 ? '#ff475710' : g.days <= 7 ? T.orange + '10' : T.dim, borderRadius: 7, border: `1px solid ${g.days <= 3 ? '#ff475730' : 'transparent'}`, cursor: 'pointer' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.title}</div>
                      <div style={{ fontSize: 10, color: T.sub }}>{g.agency || 'Unknown Agency'} · {fmt(g.amount || 0)}</div>
                    </div>
                    <UrgencyPill days={g.days} />
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>📊 Pipeline Funnel</div>
              <Btn size="xs" variant="ghost" onClick={() => navigate?.('pipeline')}>View →</Btn>
            </div>
            <StageFunnel grants={grants} navigate={navigate} />
          </Card>
        </div>

        {/* CENTER */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>🕐 Recent Activity</div>
              <Btn size="xs" variant="ghost" onClick={() => navigate?.('pipeline')}>Pipeline →</Btn>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {recent.map(g => {
                const s = STAGE_MAP[g.stage] || {};
                return (
                  <div key={g.id} onClick={() => navigate?.('pipeline')} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', background: T.dim, borderRadius: 7, cursor: 'pointer' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.color || T.amber, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.title}</div>
                      <div style={{ fontSize: 10, color: T.sub }}>{g.agency} · {fmtDate(g.updatedAt || g.createdAt)}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.text }}>{fmt(g.amount || 0)}</div>
                      <div style={{ fontSize: 10, color: s.color || T.sub }}>{s.label || g.stage}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 12 }}>⚡ Quick Actions</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <QuickAction icon="🔍" label="Find Grants" desc="23+ data sources" color={T.blue} onClick={() => navigate?.('discovery')} />
              <QuickAction icon="✍️" label="AI Drafter" desc="Write with AI" color={T.amber} onClick={() => navigate?.('ai_drafter')} />
              <QuickAction icon="📄" label="Parse RFP" desc="Extract requirements" color={T.purple} onClick={() => navigate?.('rfp_parser')} />
              <QuickAction icon="⚔️" label="Pre-Flight" desc="Submission audit" color={T.green} onClick={() => navigate?.('preflight')} />
              <QuickAction icon="📋" label="Action Plan" desc="Task management" color={T.cyan} onClick={() => navigate?.('tasks')} />
              <QuickAction icon="💰" label="Budget" desc="Cost narrative" color={T.orange} onClick={() => navigate?.('budget')} />
            </div>
          </Card>
        </div>

        {/* RIGHT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 12 }}>🧠 Intelligence Briefing</div>
            <AIBriefing grants={grants} />
          </Card>

          <Card>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 10 }}>📦 Portfolio</div>
            {[
              { label: 'Docs in Vault', val: vaultDocs.length, icon: '🗄️', nav: 'vault' },
              { label: 'CRM Contacts', val: contacts.length, icon: '🤝', nav: 'network' },
              { label: 'Calendar Events', val: events.length, icon: '📅', nav: 'calendar' },
              { label: 'Total Grants', val: grants.length, icon: '📋', nav: 'pipeline' },
            ].map(({ label, val, icon, nav }) => (
              <div key={label} onClick={() => navigate?.(nav)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: `1px solid ${T.border}`, cursor: 'pointer' }}>
                <div style={{ fontSize: 12, color: T.sub }}>{icon} {label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{val}</div>
              </div>
            ))}
          </Card>
        </div>
      </div>

      {/* Upgrade CTA — only shown to free users */}
      {getTier() === 'free' && !localStorage.getItem('gp_alpha') && (
        <div style={{
          marginTop: 20, padding: '20px 24px', borderRadius: 14,
          background: 'linear-gradient(135deg, #6366f110, #8b5cf610)',
          border: '1px solid #6366f130',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>
              🚀 Unlock AI Grant Writing, Compliance, & Intelligence
            </div>
            <div style={{ fontSize: 12, color: T.sub, marginTop: 4 }}>
              Pro users write proposals 10x faster with AI Drafter, score narratives before submission, and track compliance automatically.
            </div>
          </div>
          <button onClick={() => navigate?.('pricing')} style={{
            padding: '10px 24px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            View Plans — from $49/mo →
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
