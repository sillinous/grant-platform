// ── Grant Platform Analytics ─────────────────────────────────────────
// Privacy-first: no PII, no third-party, aggregated locally then synced
// Tracks: module visits, feature gate hits, AI calls, API success/failure

const SESSION_KEY = 'gp_session';
const EVENTS_KEY = 'gp_analytics';
const BATCH_SIZE = 20;

// Generate or retrieve session ID
function getSession() {
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

// Store event locally
function pushEvent(event) {
  try {
    const events = JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]');
    events.push({
      ...event,
      session: getSession(),
      ts: Date.now(),
    });
    
    // Keep max 500 events locally, trim oldest
    if (events.length > 500) events.splice(0, events.length - 500);
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
    
    // Auto-flush when batch is full
    if (events.length >= BATCH_SIZE) flush();
  } catch (e) { /* localStorage full or unavailable */ }
}

// Flush events to server
async function flush() {
  try {
    const events = JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]');
    if (events.length === 0) return;
    
    const batch = events.splice(0, BATCH_SIZE);
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
    
    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: batch }),
    }).catch(() => {
      // Put them back if flush fails
      const current = JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]');
      localStorage.setItem(EVENTS_KEY, JSON.stringify([...batch, ...current]));
    });
  } catch (e) { /* silent */ }
}

// ── Public API ──────────────────────────────────────────────────────

export const analytics = {
  // Track module/page visit
  pageView(moduleId, moduleName) {
    pushEvent({ type: 'page_view', module: moduleId, name: moduleName });
  },
  
  // Track feature gate encounter (free user hitting pro wall)
  gateHit(featureId, userTier) {
    pushEvent({ type: 'gate_hit', feature: featureId, tier: userTier });
  },
  
  // Track AI call
  aiCall(action, success, durationMs, provider) {
    pushEvent({ type: 'ai_call', action, success, durationMs, provider });
  },
  
  // Track external API call
  apiCall(service, success, durationMs) {
    pushEvent({ type: 'api_call', service, success, durationMs });
  },
  
  // Track user action (button click, form submit, etc)
  action(name, detail) {
    pushEvent({ type: 'action', name, detail });
  },
  
  // Track error
  error(component, message) {
    pushEvent({ type: 'error', component, message: (message || '').slice(0, 200) });
  },
  
  // Track onboarding progress
  onboarding(step, completed) {
    pushEvent({ type: 'onboarding', step, completed });
  },
  
  // Track feedback widget interaction
  feedbackOpen() {
    pushEvent({ type: 'feedback_open' });
  },
  
  // Manual flush (e.g., on page unload)
  flush,
  
  // Get session ID
  getSession,
};

// Flush on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', flush);
  // Also flush every 5 minutes
  setInterval(flush, 300000);
}
