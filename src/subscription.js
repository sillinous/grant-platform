// ── Subscription State ────────────────────────────────────────────
// Tiers: free | deep-search | pro | team
// Stored in localStorage after Stripe checkout verification

const KEY = 'gp_sub'
const PRICES = {
  pro:  'price_1T40hc6XLHH1oci1NXMMr4Hu',
  team: 'price_1T40hd6XLHH1oci1JkPoQmmV',
}

// Tier hierarchy for access checks: team > pro > deep-search > free
const TIER_LEVEL = { free: 0, 'deep-search': 1, pro: 2, team: 3 }

// Features gated by tier
export const GATES = {
  // Deep-search tier (one-time $19 — AI discovery access for 30 days)
  ai_discovery:     'deep-search',
  ai_find_grants:   'deep-search',
  // Pro tier
  ai_drafter:       'pro',
  rfp_parser:       'pro',
  match_scorer:     'pro',
  preflight:        'pro',
  narrative_scorer: 'pro',
  section_library:  'pro',
  budget:           'pro',
  vault:            'pro',
  tasks:            'pro',
  awards:           'pro',
  outcomes:         'pro',
  closeout:         'pro',
  projector:        'pro',
  forecast:         'pro',
  advisor:          'pro',
  sentinel:         'pro',
  network:          'pro',
  funder_research:  'pro',
  optimizer:        'pro',
  win_prob:         'pro',
  winloss:          'pro',
  impact:           'pro',
  impact_predict:   'pro',
  scenario_modeler: 'pro',
  funding_stacker:  'pro',
  policy_modeler:   'pro',
  impact_mapper:    'pro',
  compliance_wizard:'pro',
  compliance_tracker:'pro',
  // Team-only
  exec_dash:           'team',
  executive_summary:   'team',
  advisory:            'team',
  submission_assembler:'team',
  calendar:            'pro',
}

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
}
function save(data) {
  localStorage.setItem(KEY, JSON.stringify(data))
}

export function getTier() {
  const sub = load()
  if (!sub.tier) return 'free'
  // Check expiry (subscriptions renew monthly — we re-verify periodically)
  if (sub.expiresAt && Date.now() > sub.expiresAt) return 'free'
  return sub.tier
}

export function getSubData() {
  return load()
}

export function setSub(tier, email, expiresAt) {
  save({ tier, email, expiresAt, updatedAt: Date.now() })
}

export function clearSub() {
  localStorage.removeItem(KEY)
}

export function canAccess(featureId) {
  const required = GATES[featureId]
  if (!required) return true  // unprotected
  const tier = getTier()
  return (TIER_LEVEL[tier] || 0) >= (TIER_LEVEL[required] || 0)
}

export function getCheckoutUrl(plan) {
  return `/api/subscribe?plan=${plan}`
}

export const PLANS = {
  'deep-search': {
    name: 'Deep Search',
    price: 19,
    oneTime: true,
    features: [
      'One comprehensive AI-powered grant search',
      'Full match report with scoring & tier ranking',
      'Industry-specific opportunity discovery',
      '30-day access to AI discovery tools',
    ]
  },
  pro: {
    name: 'Pro',
    price: 49,
    priceId: PRICES.pro,
    features: [
      'Unlimited AI grant discovery',
      'AI Drafter & Narrative Scorer',
      'RFP Parser & Match Scorer',
      'Budget Builder & Document Vault',
      'Pre-Flight Audit & Compliance',
      'Intelligence suite (10+ tools)',
      'Funding Forecast & Projector',
      'Strategic AI Advisor',
    ]
  },
  team: {
    name: 'Team',
    price: 149,
    priceId: PRICES.team,
    features: [
      'Everything in Pro',
      'Executive Dashboard & Reports',
      'Advisory War Room',
      'Submission Assembler & Packager',
      'Board Report Generator',
      'Multi-user collaboration',
      'Priority AI processing',
      'Dedicated onboarding',
    ]
  }
}
