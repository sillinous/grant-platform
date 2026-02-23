import React, { useState, useEffect } from 'react';
import { Card, Stat, Btn, Progress, Badge, Empty } from '../ui';
import { T, fmt, fmtDate, daysUntil, STAGE_MAP, LS } from '../globals';
import { useStore } from '../store';

const DeadlineChip = ({ days }) => {
  if (days < 0) return <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: T.red + '20', color: T.red, fontWeight: 700 }}>OVERDUE</span>;
  if (days <= 7) return <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: T.red + '20', color: T.red, fontWeight: 700 }}>{days}d</span>;
  if (days <= 30) return <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: T.amber + '20', color: T.amber, fontWeight: 700 }}>{days}d</span>;
  return <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: T.green + '15', color: T.green, fontWeight: 700 }}>{days}d</span>;
};

const PipelineBar = ({ grants }) => {
  const stages = Object.entries(STAGE_MAP).map(([id, s]) => ({
    ...s, id, count: grants.filter(g => g.stage === id).length
  })).filter(s => s.count > 0);
  const total = stages.reduce((a, s) => a + s.count, 0) || 1;
  return (
    <div style={{ display: 'flex', gap: 2, height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 8 }}>
      {stages.map(s => (
        <div key={s.id} title={`${s.label}: ${s.count}`} style={{ flex: s.count / total, background: s.color || T.amber }} />
      ))}
    </div>
  );
};

const QuickAction = ({ icon, label, desc, onClick, color = T.amber }) => (
  <button onClick={onClick} style={{
    background: 'none', border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 14px',
    cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', width: '100%',
    display: 'flex', alignItems: 'center', gap: 12
  }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = color + '10'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = 'none'; }}>
    <span style={{ fontSize: 22 }}>{icon}</span>
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{label}</div>
      <div style={{ fontSize: 11, color: T.sub, marginTop: 1 }}>{desc}</div>
    </div>
  </button>
);

export const Dashboard = ({ navigate }) => {
  const { grants = [], tasks = [], vaultDocs = [], contacts = [] } = useStore();
  const [activityLog, setActivityLog] = useState([]);

  useEffect(() => {
    setActivityLog(LS.get('activity_log', []).slice(0, 8));
  }, []);

  const active = grants.filter(g => !['declined', 'archived'].includes(g.stage));
  const awarded = grants.filter(g => ['awarded', 'active', 'closeout'].includes(g.stage));
  const submitted = grants.filter(g => g.stage === 'submitted');
  const decided = grants.filter(g => ['awarded', 'declined'].includes(g.stage));
  const winRate = decided.length ? Math.round((awarded.length / decided.length) * 100) : 0;
  const totalAwarded = awarded.reduce((s, g) => s + (g.amount || 0), 0);
  const pipelineValue = active.reduce((s, g) => s + (g.amount || 0), 0);
  const pendingTasks = tasks.filter(t => t.status !== 'done');

  const upcoming = active
    .filter(g => g.deadline)
    .map(g => ({ ...g, days: daysUntil(g.deadline) }))
    .sort((a, b) => a.days - b.days)
    .slice(0, 5);

  const urgent = upcoming.filter(g => g.days <= 14);

  const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
    const [mo, yr] = [d.getMonth(), d.getFullYear()];
    return grants.filter(g => {
      if (!g.createdAt) return false;
      const gc = new Date(g.createdAt);
      return gc.getMonth() === mo && gc.getFullYear() === yr;
    }).reduce((s, g) => s + (g.amount || 0), 0);
  });

  const stageGroups = Object.entries(STAGE_MAP)
    .map(([id, s]) => ({ id, ...s, count: grants.filter(g => g.stage === id).length }))
    .filter(s => s.count > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1400, margin: '0 auto' }}>

      {urgent.length > 0 && (
        <div style={{ padding: '12px 16px', borderRadius: 10, background: T.red + '12', border: `1px solid ${T.red}40`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 18 }}>🚨</span>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.red }}>{urgent.length} deadline{urgent.length !== 1 ? 's' : ''} within 14 days: </span>
            <span style={{ fontSize: 12, color: T.sub }}>{urgent.map(g => `${g.title} (${g.days < 0 ? 'OVERDUE' : `${g.days}d`})`).join(' · ')}</span>
          </div>
          {navigate && <Btn size="xs" variant="ghost" onClick={() => navigate('calendar')}>Calendar →</Btn>}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <Card style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: 11, color: T.sub, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>Capital Secured</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: T.amber, margin: '6px 0 4px' }}>{fmt(totalAwarded)}</div>
          <div style={{ fontSize: 11, color: T.sub }}>{awarded.length} awards active</div>
        </Card>
        <Card style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: 11, color: T.sub, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>Pipeline Value</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: T.blue, margin: '6px 0 4px' }}>{fmt(pipelineValue)}</div>
          <div style={{ fontSize: 11, color: T.sub }}>{active.length} active pursuits</div>
          <PipelineBar grants={grants} />
        </Card>
        <Card style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: 11, color: T.sub, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>Win Rate</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: winRate >= 50 ? T.green : T.orange, margin: '6px 0 4px' }}>{winRate}%</div>
          <Progress value={winRate} max={100} color={winRate >= 50 ? T.green : T.orange} height={4} />
          <div style={{ fontSize: 11, color: T.sub, marginTop: 6 }}>{decided.length} decided · {submitted.length} pending</div>
        </Card>
        <Card style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: 11, color: T.sub, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>Open Tasks</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: pendingTasks.length > 5 ? T.red : T.text, margin: '6px 0 4px' }}>{pendingTasks.length}</div>
          <div style={{ fontSize: 11, color: T.sub }}>{pendingTasks.filter(t => t.priority === 'high').length} high priority</div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 300px', gap: 16, alignItems: 'start' }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>📅 Upcoming Deadlines</div>
            {navigate && <Btn size="xs" variant="ghost" onClick={() => navigate('calendar')}>Calendar</Btn>}
          </div>
          {upcoming.length === 0 ? <Empty title="No deadlines set" icon="📅" /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {upcoming.map(g => (
                <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: g.days <= 7 ? T.red + '08' : T.dim, borderRadius: 8, border: `1px solid ${g.days <= 7 ? T.red + '30' : 'transparent'}` }}>
                  <DeadlineChip days={g.days} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.title}</div>
                    <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{g.agency} · {fmtDate(g.deadline)}</div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.amber, flexShrink: 0 }}>{fmt(g.amount || 0)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>📋 Pipeline by Stage</div>
            {navigate && <Btn size="xs" variant="ghost" onClick={() => navigate('pipeline')}>Full View</Btn>}
          </div>
          {stageGroups.length === 0 ? (
            <Empty title="No grants in pipeline yet" icon="📋">
              {navigate && <Btn size="sm" variant="primary" onClick={() => navigate('discovery')} style={{ marginTop: 12 }}>Find Grants →</Btn>}
            </Empty>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stageGroups.map(s => {
                const val = grants.filter(g => g.stage === s.id).reduce((a, g) => a + (g.amount || 0), 0);
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color || T.amber, flexShrink: 0 }} />
                    <div style={{ flex: 1, fontSize: 12, color: T.sub }}>{s.label}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.text, minWidth: 18 }}>{s.count}</div>
                    <div style={{ width: 80 }}><Progress value={s.count} max={Math.max(...stageGroups.map(x => x.count))} color={s.color || T.amber} height={4} /></div>
                    <div style={{ fontSize: 11, color: T.amber, minWidth: 64, textAlign: 'right' }}>{fmt(val)}</div>
                  </div>
                );
              })}
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: T.sub }}>Total pipeline</span>
                <span style={{ fontWeight: 700, color: T.amber }}>{fmt(pipelineValue)}</span>
              </div>
            </div>
          )}
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 2 }}>⚡ Quick Actions</div>
          <QuickAction icon="🔍" label="Find Grants" desc="Search 10K+ opportunities" onClick={() => navigate?.('discovery')} />
          <QuickAction icon="✍️" label="AI Drafter" desc="Write with AI assistance" onClick={() => navigate?.('ai_drafter')} color={T.purple} />
          <QuickAction icon="📄" label="Parse RFP" desc="Extract requirements" onClick={() => navigate?.('rfp_parser')} color={T.blue} />
          <QuickAction icon="⚔️" label="Pre-Flight Audit" desc="Submission readiness" onClick={() => navigate?.('preflight')} color={T.green} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>💎 Top Pursuits by Value</div>
            {navigate && <Btn size="xs" variant="ghost" onClick={() => navigate('pipeline')}>All Grants</Btn>}
          </div>
          {grants.length === 0 ? (
            <Empty title="Start adding grants to your pipeline" icon="💰">
              {navigate && <Btn size="sm" variant="primary" onClick={() => navigate('discovery')} style={{ marginTop: 12 }}>Discover Opportunities →</Btn>}
            </Empty>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[...grants].sort((a, b) => (b.amount || 0) - (a.amount || 0)).slice(0, 5).map(g => {
                const stageInfo = STAGE_MAP[g.stage] || { label: g.stage, color: T.sub };
                return (
                  <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: T.dim, borderRadius: 8 }}>
                    <div style={{ width: 6, height: 32, borderRadius: 3, background: stageInfo.color || T.amber, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.title}</div>
                      <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{g.agency || 'Unknown Agency'}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.amber }}>{fmt(g.amount || 0)}</div>
                      <div style={{ fontSize: 10, color: stageInfo.color || T.sub, textTransform: 'uppercase', letterSpacing: 0.5 }}>{stageInfo.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>📑 Priority Tasks</div>
            {navigate && <Btn size="xs" variant="ghost" onClick={() => navigate('tasks')}>Action Plan</Btn>}
          </div>
          {pendingTasks.length === 0 ? <Empty title="All tasks complete!" icon="✅" /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[...pendingTasks]
                .sort((a, b) => (a.priority === 'high' ? -1 : 1) - (b.priority === 'high' ? -1 : 1))
                .slice(0, 6).map(task => {
                  const grant = grants.find(g => g.id === task.grantId);
                  return (
                    <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: T.dim, borderRadius: 7 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: task.priority === 'high' ? T.red : task.priority === 'medium' ? T.amber : T.sub }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</div>
                        {grant && <div style={{ fontSize: 11, color: T.amber, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{grant.title}</div>}
                      </div>
                      <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: task.priority === 'high' ? T.red + '20' : T.dim, color: task.priority === 'high' ? T.red : T.sub, flexShrink: 0 }}>{task.priority || 'normal'}</span>
                    </div>
                  );
                })}
              {pendingTasks.length > 6 && <div style={{ fontSize: 11, color: T.sub, textAlign: 'center', padding: 6 }}>+{pendingTasks.length - 6} more tasks</div>}
            </div>
          )}
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 16 }}>📈 Pipeline Trend (6 Months)</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 70 }}>
            {monthlyTrend.map((v, i) => {
              const maxVal = Math.max(...monthlyTrend, 1);
              const pct = (v / maxVal) * 100;
              const label = new Date(new Date().setMonth(new Date().getMonth() - (5 - i))).toLocaleString('default', { month: 'short' });
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div title={fmt(v)} style={{ width: '100%', borderRadius: '3px 3px 0 0', height: `${Math.max(pct, 4)}%`, maxHeight: 56, background: i === 5 ? T.amber : T.amber + '50', transition: 'height 0.3s' }} />
                  <span style={{ fontSize: 10, color: T.sub }}>{label}</span>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 20, fontSize: 11 }}>
            {[
              { label: 'Total Grants', val: grants.length, color: T.text },
              { label: 'Docs in Vault', val: vaultDocs.length, color: T.text },
              { label: 'Contacts', val: contacts.length, color: T.text },
            ].map(item => (
              <div key={item.label}>
                <div style={{ color: T.sub }}>{item.label}</div>
                <div style={{ fontWeight: 700, color: item.color }}>{item.val}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>⚡ Recent Activity</div>
          </div>
          {activityLog.length === 0 ? <Empty title="Activity appears as you use the platform" icon="⚡" /> : (
            <div>
              {activityLog.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon || '📝'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: T.sub, marginTop: 1 }}>{new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  </div>
                  {item.amount > 0 && <div style={{ fontSize: 12, fontWeight: 700, color: T.green, flexShrink: 0 }}>{fmt(item.amount)}</div>}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { icon: '🔍', label: 'Grant Discovery', desc: 'Search 10K+ federal, state & private opportunities with AI matching', page: 'discovery', color: T.amber },
          { icon: '🧠', label: 'AI Strategic Advisor', desc: 'Portfolio strategy, win analysis, and AI-powered next steps', page: 'advisor', color: T.purple },
          { icon: '📊', label: 'Portfolio Optimizer', desc: 'Identify highest-ROI opportunities and optimize your mix', page: 'optimizer', color: T.blue },
        ].map(item => (
          <div key={item.page} onClick={() => navigate?.(item.page)} style={{ padding: '14px 16px', borderRadius: 10, border: `1px solid ${T.border}`, cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = item.color; e.currentTarget.style.background = item.color + '08'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = 'transparent'; }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4 }}>{item.label}</div>
            <div style={{ fontSize: 11, color: T.sub, lineHeight: 1.5 }}>{item.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
