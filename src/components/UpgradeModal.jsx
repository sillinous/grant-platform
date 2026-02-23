import { useState } from 'react'
import { PLANS, getCheckoutUrl } from '../subscription'

// ── Upgrade Modal ─────────────────────────────────────────────────
// Shown when a free user tries to access a Pro/Team feature

export function UpgradeModal({ onClose, featureName, requiredTier = 'pro' }) {
  const [email, setEmail] = useState('')
  const [hoveredPlan, setHoveredPlan] = useState(requiredTier)

  const go = (plan) => {
    const url = email
      ? `/api/subscribe?plan=${plan}&email=${encodeURIComponent(email)}`
      : `/api/subscribe?plan=${plan}`
    window.location.href = url
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }} onClick={e => e.target === e.currentTarget && onClose?.()}>
      <div style={{
        background: '#0d1117', border: '1px solid #1e2938',
        borderRadius: 20, maxWidth: 720, width: '100%',
        padding: '40px 36px', position: 'relative',
        boxShadow: '0 40px 120px rgba(0,0,0,0.6)',
      }}>
        {/* Close */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16,
          background: 'transparent', border: 'none', color: '#475569',
          cursor: 'pointer', fontSize: 20, lineHeight: 1,
        }}>✕</button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            display: 'inline-block', background: '#6366f115',
            border: '1px solid #6366f140', borderRadius: 99,
            padding: '4px 16px', fontSize: 11, color: '#818cf8',
            fontWeight: 700, letterSpacing: 1, marginBottom: 14,
          }}>UPGRADE REQUIRED</div>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: '#f1f5f9', margin: '0 0 8px', letterSpacing: '-0.5px' }}>
            {featureName || 'This feature'} requires Pro
          </h2>
          <p style={{ color: '#64748b', fontSize: 15, margin: 0 }}>
            Unlock the full grant intelligence platform. Cancel anytime.
          </p>
        </div>

        {/* Email */}
        <div style={{ marginBottom: 28 }}>
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Your email address"
            type="email"
            style={{
              width: '100%', padding: '11px 16px',
              background: '#0a0f1a', border: '1px solid #1e2938',
              borderRadius: 10, color: '#e2e8f0', fontSize: 14,
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Plan cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
          {Object.entries(PLANS).map(([key, plan]) => {
            const isHighlighted = key === requiredTier || hoveredPlan === key
            const isRecommended = key === 'pro'
            return (
              <div
                key={key}
                onMouseEnter={() => setHoveredPlan(key)}
                onMouseLeave={() => setHoveredPlan(requiredTier)}
                onClick={() => go(key)}
                style={{
                  border: `1.5px solid ${isHighlighted ? '#6366f1' : '#1e2938'}`,
                  borderRadius: 14, padding: '22px 20px',
                  cursor: 'pointer',
                  background: isHighlighted ? '#6366f108' : 'transparent',
                  transition: 'all 0.15s',
                  position: 'relative',
                }}
              >
                {isRecommended && (
                  <div style={{
                    position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    borderRadius: 99, padding: '2px 12px',
                    fontSize: 10, fontWeight: 800, color: '#fff', letterSpacing: 0.5,
                    whiteSpace: 'nowrap',
                  }}>MOST POPULAR</div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9' }}>{plan.name}</div>
                    <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>per month</div>
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: isHighlighted ? '#818cf8' : '#64748b' }}>
                    ${plan.price}
                  </div>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {plan.features.slice(0, 5).map(f => (
                    <li key={f} style={{
                      fontSize: 12, color: '#64748b', padding: '3px 0',
                      display: 'flex', gap: 6, alignItems: 'flex-start',
                    }}>
                      <span style={{ color: '#6366f1', flexShrink: 0 }}>✓</span> {f}
                    </li>
                  ))}
                  {plan.features.length > 5 && (
                    <li style={{ fontSize: 12, color: '#475569', padding: '3px 0' }}>
                      + {plan.features.length - 5} more...
                    </li>
                  )}
                </ul>
                <button style={{
                  marginTop: 16, width: '100%', padding: '10px 0',
                  background: isHighlighted
                    ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                    : 'transparent',
                  border: `1px solid ${isHighlighted ? 'transparent' : '#1e2938'}`,
                  borderRadius: 8, color: isHighlighted ? '#fff' : '#64748b',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}>
                  Start {plan.name} →
                </button>
              </div>
            )
          })}
        </div>

        <div style={{ textAlign: 'center', fontSize: 12, color: '#334155' }}>
          🔒 Secured by Stripe · Cancel anytime · Instant access after payment
        </div>
      </div>
    </div>
  )
}

// ── ProBadge: inline lock icon shown in sidebar nav ───────────────
export function ProBadge({ tier = 'pro' }) {
  return (
    <span style={{
      marginLeft: 'auto', flexShrink: 0,
      background: tier === 'team' ? '#7c3aed15' : '#6366f115',
      border: `1px solid ${tier === 'team' ? '#7c3aed40' : '#6366f140'}`,
      borderRadius: 4, padding: '1px 5px',
      fontSize: 9, fontWeight: 800,
      color: tier === 'team' ? '#a78bfa' : '#818cf8',
      letterSpacing: 0.5,
    }}>
      {tier === 'team' ? 'TEAM' : 'PRO'}
    </span>
  )
}
