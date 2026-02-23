import { useState, useRef, useEffect } from 'react';

const CATEGORIES = [
  { id: 'bug', icon: '🐛', label: 'Bug / Error', color: '#ef4444' },
  { id: 'ux', icon: '🎨', label: 'UX / Confusing', color: '#f59e0b' },
  { id: 'feature', icon: '💡', label: 'Feature Request', color: '#3b82f6' },
  { id: 'praise', icon: '⭐', label: 'This is Great!', color: '#10b981' },
];

const SEVERITY = [
  { id: 'low', label: 'Minor', color: '#6b7280' },
  { id: 'medium', label: 'Moderate', color: '#f59e0b' },
  { id: 'high', label: 'Blocking', color: '#ef4444' },
];

export function FeedbackWidget({ currentModule, userTier, userEmail }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState(null);
  const [severity, setSeverity] = useState('medium');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pulse, setPulse] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Pulse animation on first visit
  useEffect(() => {
    const seen = localStorage.getItem('gp_feedback_seen');
    if (!seen) {
      setPulse(true);
      const t = setTimeout(() => { setPulse(false); localStorage.setItem('gp_feedback_seen', '1'); }, 8000);
      return () => clearTimeout(t);
    }
  }, []);

  const reset = () => {
    setCategory(null);
    setSeverity('medium');
    setDescription('');
    setSubmitted(false);
  };

  const submit = async () => {
    if (!category || !description.trim()) return;
    setSubmitting(true);
    try {
      const payload = {
        category,
        severity,
        description: description.trim(),
        module: currentModule || 'unknown',
        tier: userTier || 'free',
        email: userEmail || '',
        url: window.location.href,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        userAgent: navigator.userAgent.slice(0, 120),
        timestamp: new Date().toISOString(),
        sessionId: sessionStorage.getItem('gp_session') || 'unknown',
      };

      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      setSubmitted(true);
      setTimeout(() => { setOpen(false); reset(); }, 2000);
    } catch (err) {
      console.error('Feedback submit error:', err);
      // Fallback: store locally for later sync
      const pending = JSON.parse(localStorage.getItem('gp_pending_feedback') || '[]');
      pending.push({ category, severity, description, module: currentModule, timestamp: new Date().toISOString() });
      localStorage.setItem('gp_pending_feedback', JSON.stringify(pending));
      setSubmitted(true);
      setTimeout(() => { setOpen(false); reset(); }, 2000);
    } finally {
      setSubmitting(false);
    }
  };

  const S = {
    fab: {
      position: 'fixed', bottom: 24, right: 24, zIndex: 10000,
      width: 56, height: 56, borderRadius: '50%',
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      color: '#fff', border: 'none', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 24, boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
      transition: 'transform 0.2s, box-shadow 0.2s',
      animation: pulse ? 'gp-pulse 2s ease-in-out infinite' : 'none',
    },
    panel: {
      position: 'fixed', bottom: 90, right: 24, zIndex: 10001,
      width: 340, maxHeight: '70vh', overflow: 'auto',
      background: '#1a1a2e', borderRadius: 16,
      boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
      border: '1px solid rgba(255,255,255,0.1)',
      padding: 20, color: '#e0e0e0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    title: { margin: '0 0 4px', fontSize: 16, fontWeight: 600, color: '#fff' },
    subtitle: { margin: '0 0 16px', fontSize: 12, color: '#888' },
    catGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 },
    catBtn: (active, color) => ({
      padding: '10px 8px', borderRadius: 10, border: `2px solid ${active ? color : 'rgba(255,255,255,0.1)'}`,
      background: active ? `${color}15` : 'rgba(255,255,255,0.03)',
      color: active ? '#fff' : '#aaa', cursor: 'pointer', fontSize: 12, fontWeight: 500,
      textAlign: 'center', transition: 'all 0.15s',
    }),
    sevRow: { display: 'flex', gap: 6, marginBottom: 16 },
    sevBtn: (active, color) => ({
      flex: 1, padding: '6px 8px', borderRadius: 8, border: `1px solid ${active ? color : 'rgba(255,255,255,0.1)'}`,
      background: active ? `${color}20` : 'transparent',
      color: active ? '#fff' : '#888', cursor: 'pointer', fontSize: 11, fontWeight: 500, textAlign: 'center',
    }),
    textarea: {
      width: '100%', minHeight: 80, padding: 12, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)',
      background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 13, resize: 'vertical',
      fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
    },
    context: { marginTop: 8, fontSize: 10, color: '#555', textAlign: 'right' },
    submitBtn: {
      width: '100%', padding: '12px 16px', borderRadius: 10, border: 'none',
      background: (!category || !description.trim()) ? '#333' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      color: '#fff', fontSize: 14, fontWeight: 600, cursor: (!category || !description.trim()) ? 'not-allowed' : 'pointer',
      marginTop: 12, transition: 'all 0.2s',
    },
    success: {
      textAlign: 'center', padding: '32px 16px',
    },
    label: { fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  };

  return (
    <>
      <style>{`
        @keyframes gp-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 4px 20px rgba(99,102,241,0.4); }
          50% { transform: scale(1.1); box-shadow: 0 4px 30px rgba(99,102,241,0.6); }
        }
      `}</style>

      {/* Floating Action Button */}
      <button
        style={S.fab}
        onClick={() => { setOpen(!open); if (!open) reset(); }}
        title="Send Feedback"
        onMouseEnter={(e) => { e.target.style.transform = 'scale(1.1)'; }}
        onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; }}
      >
        {open ? '✕' : '💬'}
      </button>

      {/* Feedback Panel */}
      {open && (
        <div ref={ref} style={S.panel}>
          {submitted ? (
            <div style={S.success}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
              <h3 style={{ color: '#fff', margin: '0 0 8px' }}>Thank you!</h3>
              <p style={{ color: '#888', fontSize: 13, margin: 0 }}>
                Your feedback helps build a better platform for everyone.
              </p>
            </div>
          ) : (
            <>
              <h3 style={S.title}>Send Feedback</h3>
              <p style={S.subtitle}>
                📍 {currentModule || 'General'} • Alpha Program
              </p>

              {/* Category Selection */}
              <div style={S.label}>What kind of feedback?</div>
              <div style={S.catGrid}>
                {CATEGORIES.map(c => (
                  <button
                    key={c.id}
                    style={S.catBtn(category === c.id, c.color)}
                    onClick={() => setCategory(c.id)}
                  >
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{c.icon}</div>
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Severity (only for bugs and UX) */}
              {(category === 'bug' || category === 'ux') && (
                <>
                  <div style={S.label}>How severe?</div>
                  <div style={S.sevRow}>
                    {SEVERITY.map(s => (
                      <button
                        key={s.id}
                        style={S.sevBtn(severity === s.id, s.color)}
                        onClick={() => setSeverity(s.id)}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Description */}
              <div style={S.label}>Tell us more</div>
              <textarea
                style={S.textarea}
                placeholder={
                  category === 'bug' ? 'What happened? What did you expect to happen?' :
                  category === 'ux' ? 'What was confusing? What would be clearer?' :
                  category === 'feature' ? 'What would you like to see? How would it help your work?' :
                  category === 'praise' ? 'What are you enjoying? What should we keep doing?' :
                  'Describe your feedback...'
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
              />
              <div style={S.context}>
                {description.length}/2000
              </div>

              {/* Submit */}
              <button
                style={S.submitBtn}
                onClick={submit}
                disabled={!category || !description.trim() || submitting}
              >
                {submitting ? 'Sending...' : 'Send Feedback'}
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}

// ── Module Micro-Survey ────────────────────────────────────────────
// Shows once per module after first meaningful interaction
export function ModuleSurvey({ moduleId, moduleName, onDismiss }) {
  const [response, setResponse] = useState(null);
  const [detail, setDetail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const key = `gp_survey_${moduleId}`;
  const alreadySurveyed = localStorage.getItem(key);
  if (alreadySurveyed) return null;

  const submit = async () => {
    localStorage.setItem(key, '1');
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'survey',
          module: moduleId,
          severity: response === 'yes' ? 'low' : response === 'partial' ? 'medium' : 'high',
          description: `Module survey: ${response}${detail ? ` — ${detail}` : ''}`,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (e) { /* silent */ }
    setSubmitted(true);
    setTimeout(() => onDismiss?.(), 1500);
  };

  if (submitted) return (
    <div style={{ padding: '8px 16px', background: 'rgba(16,185,129,0.1)', borderRadius: 8, fontSize: 12, color: '#10b981', textAlign: 'center', margin: '8px 0' }}>
      Thanks for the feedback! ✓
    </div>
  );

  return (
    <div style={{
      padding: 16, background: 'rgba(99,102,241,0.08)', borderRadius: 12,
      border: '1px solid rgba(99,102,241,0.2)', margin: '12px 0',
      fontSize: 13, color: '#ccc',
    }}>
      <div style={{ marginBottom: 8, fontWeight: 600 }}>
        Did <strong>{moduleName}</strong> do what you expected?
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: response && response !== 'yes' ? 8 : 0 }}>
        {[
          { id: 'yes', label: '✅ Yes', color: '#10b981' },
          { id: 'partial', label: '🔶 Partially', color: '#f59e0b' },
          { id: 'no', label: '❌ No', color: '#ef4444' },
        ].map(o => (
          <button key={o.id} onClick={() => { setResponse(o.id); if (o.id === 'yes') setTimeout(submit, 300); }}
            style={{
              flex: 1, padding: '6px 10px', borderRadius: 8,
              border: `1px solid ${response === o.id ? o.color : 'rgba(255,255,255,0.1)'}`,
              background: response === o.id ? `${o.color}20` : 'transparent',
              color: response === o.id ? '#fff' : '#888', cursor: 'pointer', fontSize: 12,
            }}>
            {o.label}
          </button>
        ))}
      </div>
      {response && response !== 'yes' && (
        <>
          <input
            type="text" value={detail} onChange={(e) => setDetail(e.target.value)}
            placeholder="What went wrong? (optional)"
            style={{
              width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 12, outline: 'none', boxSizing: 'border-box',
            }}
          />
          <button onClick={submit} style={{
            marginTop: 8, padding: '6px 16px', borderRadius: 8, border: 'none',
            background: '#6366f1', color: '#fff', fontSize: 12, cursor: 'pointer',
          }}>
            Submit
          </button>
        </>
      )}
    </div>
  );
}
