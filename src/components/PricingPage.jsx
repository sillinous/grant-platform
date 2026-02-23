import { useState } from 'react'
import { PLANS, getTier, getSubData } from '../subscription'

export function PricingPage() {
  const [email, setEmail] = useState(getSubData().email || '')
  const tier = getTier()

  const go = (plan) => {
    const url = email
      ? `/api/subscribe?plan=${plan}&email=${encodeURIComponent(email)}`
      : `/api/subscribe?plan=${plan}`
    window.location.href = url
  }

  if (tier !== 'free') {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9', marginBottom: 8 }}>
          You're on {tier.charAt(0).toUpperCase() + tier.slice(1)}
        </h2>
        <p style={{ color: '#64748b', marginBottom: 24 }}>
          You have full access to all {tier === 'team' ? 'Team' : 'Pro'} features.
        </p>
        <div style={{
          display: 'inline-block', background: '#0d1117',
          border: '1px solid #1e2938', borderRadius: 12, padding: '16px 24px',
        }}>
          <div style={{ fontSize: 12, color: '#475569', marginBottom: 4 }}>Subscribed email</div>
          <div style={{ fontSize: 15, color: '#94a3b8' }}>{getSubData().email || '—'}</div>
        </div>
      </div>
    )
  }

  const COMPARISON = [
    { feature: 'Grant Discovery (AI)', free: '3 results', pro: 'Unlimited', team: 'Unlimited' },
    { feature: 'Pipeline Management', free: '10 grants', pro: 'Unlimited', team: 'Unlimited' },
    { feature: 'AI Drafter', free: '✗', pro: '✓', team: '✓' },
    { feature: 'RFP Parser', free: '✗', pro: '✓', team: '✓' },
    { feature: 'Match Scorer', free: '✗', pro: '✓', team: '✓' },
    { feature: 'Budget Builder', free: '✗', pro: '✓', team: '✓' },
    { feature: 'Document Vault', free: '✗', pro: '✓', team: '✓' },
    { feature: 'Intelligence Suite (10+ tools)', free: '✗', pro: '✓', team: '✓' },
    { feature: 'AI Strategic Advisor', free: '✗', pro: '✓', team: '✓' },
    { feature: 'Funding Forecast', free: '✗', pro: '✓', team: '✓' },
    { feature: 'Executive Dashboard', free: '✗', pro: '✗', team: '✓' },
    { feature: 'Board Report Generator', free: '✗', pro: '✗', team: '✓' },
    { feature: 'Advisory War Room', free: '✗', pro: '✗', team: '✓' },
    { feature: 'Submission Assembler', free: '✗', pro: '✗', team: '✓' },
  ]

  const col = { color: '#f1f5f9', fontSize: 14 }
  const no = { color: '#334155', fontSize: 14 }
  const yes = { color: '#6366f1', fontSize: 14, fontWeight: 700 }
  const limited = { color: '#f59e0b', fontSize: 13 }

  const cellStyle = (val) => {
    if (val === '✓') return yes
    if (val === '✗') return no
    if (val.includes('Unlimited')) return yes
    return limited
  }

  return (
    <div style={{ padding: '32px 24px', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{
          display: 'inline-block', background: '#6366f115',
          border: '1px solid #6366f140', borderRadius: 99,
          padding: '4px 14px', fontSize: 11, color: '#818cf8',
          fontWeight: 700, letterSpacing: 1, marginBottom: 14,
        }}>GRANT PLATFORM PRICING</div>
        <h1 style={{ fontSize: 36, fontWeight: 900, color: '#f1f5f9', margin: '0 0 10px', letterSpacing: '-1px' }}>
          Unlock the full platform
        </h1>
        <p style={{ color: '#64748b', fontSize: 16, margin: '0 0 24px' }}>
          From discovery to closeout — everything your grants team needs.
        </p>
        <input
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Enter your email to get started"
          type="email"
          style={{
            padding: '11px 18px', width: 320, maxWidth: '100%',
            background: '#0a0f1a', border: '1px solid #1e2938',
            borderRadius: 10, color: '#e2e8f0', fontSize: 14,
            outline: 'none',
          }}
        />
      </div>

      {/* Plan cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 40 }}>
        {/* Free */}
        <div style={{ background: '#0d1117', border: '1px solid #1e2938', borderRadius: 16, padding: '24px 20px' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#64748b', marginBottom: 6 }}>Free</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#475569', marginBottom: 4 }}>$0</div>
          <div style={{ fontSize: 12, color: '#334155', marginBottom: 20 }}>forever</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px' }}>
            {['Basic Discovery (3 results)', 'Pipeline (10 grants)', 'Dashboard overview', 'Org profile'].map(f => (
              <li key={f} style={{ fontSize: 13, color: '#475569', padding: '4px 0', display: 'flex', gap: 6 }}>
                <span style={{ color: '#334155' }}>○</span> {f}
              </li>
            ))}
          </ul>
          <div style={{ padding: '9px 0', textAlign: 'center', background: '#0a0f1a', border: '1px solid #1e2938', borderRadius: 8, fontSize: 13, color: '#475569' }}>
            Current plan
          </div>
        </div>

        {/* Pro */}
        <div style={{
          background: '#0d1117',
          border: '1.5px solid #6366f1',
          borderRadius: 16, padding: '24px 20px',
          position: 'relative',
          boxShadow: '0 0 40px #6366f118',
        }}>
          <div style={{
            position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            borderRadius: 99, padding: '3px 14px',
            fontSize: 10, fontWeight: 800, color: '#fff', letterSpacing: 0.5, whiteSpace: 'nowrap',
          }}>MOST POPULAR</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#818cf8', marginBottom: 6 }}>Pro</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#f1f5f9', marginBottom: 4 }}>$49</div>
          <div style={{ fontSize: 12, color: '#475569', marginBottom: 20 }}>per month</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px' }}>
            {PLANS.pro.features.map(f => (
              <li key={f} style={{ fontSize: 13, color: '#94a3b8', padding: '4px 0', display: 'flex', gap: 6 }}>
                <span style={{ color: '#6366f1' }}>✓</span> {f}
              </li>
            ))}
          </ul>
          <button
            onClick={() => go('pro')}
            style={{
              width: '100%', padding: '11px 0',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: 'none', borderRadius: 8, color: '#fff',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Start Pro →
          </button>
        </div>

        {/* Team */}
        <div style={{ background: '#0d1117', border: '1px solid #7c3aed40', borderRadius: 16, padding: '24px 20px' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#a78bfa', marginBottom: 6 }}>Team</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#f1f5f9', marginBottom: 4 }}>$149</div>
          <div style={{ fontSize: 12, color: '#475569', marginBottom: 20 }}>per month</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px' }}>
            {PLANS.team.features.map(f => (
              <li key={f} style={{ fontSize: 13, color: '#94a3b8', padding: '4px 0', display: 'flex', gap: 6 }}>
                <span style={{ color: '#a78bfa' }}>✓</span> {f}
              </li>
            ))}
          </ul>
          <button
            onClick={() => go('team')}
            style={{
              width: '100%', padding: '11px 0',
              background: 'transparent',
              border: '1px solid #7c3aed60',
              borderRadius: 8, color: '#a78bfa',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Start Team →
          </button>
        </div>
      </div>

      {/* Comparison table */}
      <div style={{ background: '#0d1117', border: '1px solid #1e2938', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e2938', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', letterSpacing: 0.5 }}>FEATURE</div>
          {['FREE', 'PRO', 'TEAM'].map(h => (
            <div key={h} style={{ fontSize: 12, fontWeight: 700, color: '#475569', letterSpacing: 0.5, textAlign: 'center' }}>{h}</div>
          ))}
        </div>
        {COMPARISON.map((row, i) => (
          <div key={row.feature} style={{
            padding: '12px 20px',
            display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr',
            gap: 8, alignItems: 'center',
            background: i % 2 === 0 ? 'transparent' : '#ffffff04',
            borderBottom: '1px solid #0d1117',
          }}>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>{row.feature}</div>
            {[row.free, row.pro, row.team].map((val, j) => (
              <div key={j} style={{ textAlign: 'center', ...cellStyle(val) }}>{val}</div>
            ))}
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: '#334155' }}>
        🔒 Powered by Stripe · Cancel anytime · 14-day money-back guarantee
      </div>
    </div>
  )
}
