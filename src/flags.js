// ── Feature Flags ────────────────────────────────────────────────────
// Phases: alpha → beta → stable
// Alpha: visible only to enrolled testers
// Beta: visible to wider audience
// Stable: visible to all

const FLAGS = {
  // Phase 0: Foundation (live now)
  feedback_widget:    'stable',
  analytics:          'stable',
  alpha_landing:      'stable',
  error_reporting:    'stable',
  
  // Core workflows (alpha testing)
  discovery:          'stable',
  pipeline:           'stable',
  ai_drafter:         'stable',
  budget_builder:     'stable',
  calendar:           'stable',
  
  // Intelligence modules (need validation)
  funder_research:    'alpha',
  win_probability:    'alpha',
  scenario_modeler:   'alpha',
  impact_predictor:   'alpha',
  impact_mapper:      'alpha',
  policy_modeler:     'alpha',
  funding_stacker:    'alpha',
  
  // Advanced features (beta)
  collaboration_hub:  'beta',
  executive_dashboard:'beta',
  advisory_board:     'beta',
  submission_assembler:'beta',
  
  // Integration features
  fortuna_link:       'alpha',
  philanthropy_intel: 'alpha',
  cross_sell:         'alpha',
  
  // Server-side AI (no user keys needed)
  server_ai:          'stable',
};

export function isFeatureEnabled(featureId) {
  const flag = FLAGS[featureId];
  if (!flag || flag === 'stable') return true;
  
  const isAlpha = localStorage.getItem('gp_alpha') === '1';
  const isBeta = localStorage.getItem('gp_beta') === '1' || isAlpha;
  
  if (flag === 'alpha') return isAlpha;
  if (flag === 'beta') return isBeta;
  return true;
}

export function getPhase(featureId) {
  return FLAGS[featureId] || 'stable';
}

export function isAlphaUser() {
  return localStorage.getItem('gp_alpha') === '1';
}

export function isBetaUser() {
  return localStorage.getItem('gp_beta') === '1' || isAlphaUser();
}

export function enrollAlpha() {
  localStorage.setItem('gp_alpha', '1');
}

export function enrollBeta() {
  localStorage.setItem('gp_beta', '1');
}

export { FLAGS };
