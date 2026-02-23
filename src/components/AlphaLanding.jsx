import { useState } from 'react';

const ORG_TYPES = [
  'Nonprofit Organization',
  'University / Research Institution',
  'Small Business (SBIR/STTR)',
  'Government Agency',
  'Grant Writing Consultant',
  'Individual Researcher',
  'Other',
];

const EXPERIENCE_LEVELS = [
  'New to grants',
  '1-5 grants submitted',
  '5-20 grants submitted',
  '20+ grants (experienced)',
  'Professional grant writer',
];

const USE_CASES = [
  'Finding relevant grants',
  'Writing grant narratives',
  'Building grant budgets',
  'Managing a grants pipeline',
  'Compliance & reporting',
  'Grant strategy & planning',
  'All of the above',
];

export function AlphaLanding({ onEnroll }) {
  const [form, setForm] = useState({ name: '', email: '', org: '', orgType: '', experience: '', useCase: '', feedback: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.orgType) return;
    setSubmitting(true);
    setError(null);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'alpha_signup',
          severity: 'low',
          description: JSON.stringify(form),
          module: 'alpha_landing',
          email: form.email,
          timestamp: new Date().toISOString(),
        }),
      });
      setSubmitted(true);
      localStorage.setItem('gp_alpha_enrolled', JSON.stringify({ ...form, enrolledAt: new Date().toISOString() }));
      localStorage.setItem('gp_alpha', '1');
      onEnroll?.(form);
    } catch (err) {
      setError('Submission failed — please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const S = {
    page: {
      minHeight: '100vh', background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 50%, #0a0a1a 100%)',
      color: '#e0e0e0', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      padding: '0 20px',
    },
    hero: { maxWidth: 720, margin: '0 auto', paddingTop: 80, textAlign: 'center' },
    badge: {
      display: 'inline-block', padding: '6px 16px', borderRadius: 20,
      background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
      color: '#818cf8', fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase',
      marginBottom: 24,
    },
    h1: { fontSize: 42, fontWeight: 700, color: '#fff', lineHeight: 1.2, margin: '0 0 16px' },
    gradient: { background: 'linear-gradient(135deg, #6366f1, #a78bfa, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
    subtitle: { fontSize: 18, color: '#999', lineHeight: 1.6, maxWidth: 560, margin: '0 auto 48px' },
    stats: { display: 'flex', justifyContent: 'center', gap: 40, marginBottom: 48, flexWrap: 'wrap' },
    stat: { textAlign: 'center' },
    statNum: { fontSize: 32, fontWeight: 700, color: '#fff' },
    statLabel: { fontSize: 12, color: '#666', marginTop: 4 },
    section: { maxWidth: 720, margin: '0 auto', padding: '48px 0' },
    sectionTitle: { fontSize: 24, fontWeight: 600, color: '#fff', marginBottom: 24 },
    card: {
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16, padding: 24, marginBottom: 16,
    },
    benefitGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 },
    benefit: {
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12, padding: 20,
    },
    benefitIcon: { fontSize: 28, marginBottom: 8 },
    benefitTitle: { fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 4 },
    benefitDesc: { fontSize: 13, color: '#888', lineHeight: 1.5 },
    form: { maxWidth: 520, margin: '0 auto' },
    formCard: {
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 20, padding: 32,
    },
    fieldGroup: { marginBottom: 16 },
    label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: {
      width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)',
      background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box',
    },
    select: {
      width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)',
      background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box',
      appearance: 'none',
    },
    submitBtn: {
      width: '100%', padding: '14px 20px', borderRadius: 12, border: 'none',
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
      fontSize: 16, fontWeight: 600, cursor: 'pointer', marginTop: 8,
    },
    success: {
      textAlign: 'center', padding: '48px 24px',
      background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)',
      borderRadius: 20,
    },
    footer: { textAlign: 'center', padding: '48px 0 32px', fontSize: 12, color: '#444' },
  };

  return (
    <div style={S.page}>
      {/* Hero */}
      <div style={S.hero}>
        <div style={S.badge}>🧪 Alpha Program</div>
        <h1 style={S.h1}>
          Help Build the Future of <span style={S.gradient}>Grant Management</span>
        </h1>
        <p style={S.subtitle}>
          We're building an AI-powered platform that helps organizations find, write, and win grants. 
          Join our Alpha Program to shape the product with your real-world expertise.
        </p>
        <div style={S.stats}>
          <div style={S.stat}>
            <div style={S.statNum}>48+</div>
            <div style={S.statLabel}>Modules</div>
          </div>
          <div style={S.stat}>
            <div style={S.statNum}>23</div>
            <div style={S.statLabel}>Live APIs</div>
          </div>
          <div style={S.stat}>
            <div style={S.statNum}>5</div>
            <div style={S.statLabel}>AI Providers</div>
          </div>
          <div style={S.stat}>
            <div style={S.statNum}>$0</div>
            <div style={S.statLabel}>Free for Testers</div>
          </div>
        </div>
      </div>

      {/* What You'll Test */}
      <div style={S.section}>
        <h2 style={S.sectionTitle}>What You'll Help Shape</h2>
        <div style={S.benefitGrid}>
          {[
            { icon: '🔍', title: 'Grant Discovery', desc: 'AI-powered search across federal databases, foundations, and state programs.' },
            { icon: '✍️', title: 'AI Grant Writing', desc: 'Draft narratives, score them, iterate — with AI that understands grant language.' },
            { icon: '💰', title: 'Budget Building', desc: 'Smart budget templates with AI-justified line items aligned to grant requirements.' },
            { icon: '📋', title: 'Pipeline Management', desc: 'Track every application from discovery to award with intelligent deadlines.' },
            { icon: '🧠', title: 'Intelligence Suite', desc: '15+ tools: funder research, win probability, scenario modeling, impact prediction.' },
            { icon: '📡', title: 'Real-Time Monitoring', desc: 'Grant sentinel, legislative tracker, compliance wizards — always watching.' },
          ].map((b, i) => (
            <div key={i} style={S.benefit}>
              <div style={S.benefitIcon}>{b.icon}</div>
              <div style={S.benefitTitle}>{b.title}</div>
              <div style={S.benefitDesc}>{b.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Alpha Benefits */}
      <div style={S.section}>
        <h2 style={S.sectionTitle}>Alpha Tester Benefits</h2>
        <div style={S.card}>
          {[
            '🎫 Free Pro access for the duration of the program',
            '🏅 "Founding Tester" badge and permanent recognition',
            '📣 Priority input on the product roadmap',
            '⚡ Early access to every new feature',
            '🔄 Your feedback directly shapes what we build next',
            '🤝 Direct communication with the development team',
          ].map((b, i) => (
            <div key={i} style={{ padding: '10px 0', borderBottom: i < 5 ? '1px solid rgba(255,255,255,0.06)' : 'none', fontSize: 14 }}>
              {b}
            </div>
          ))}
        </div>
      </div>

      {/* Application Form */}
      <div style={S.section}>
        <h2 style={{ ...S.sectionTitle, textAlign: 'center' }}>Join the Alpha</h2>
        <div style={S.form}>
          {submitted ? (
            <div style={S.success}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
              <h3 style={{ color: '#fff', fontSize: 22, margin: '0 0 8px' }}>You're In!</h3>
              <p style={{ color: '#888', fontSize: 14, margin: '0 0 24px', lineHeight: 1.6 }}>
                Welcome to the Alpha Program, {form.name.split(' ')[0]}. 
                You now have full Pro access. Start exploring — and don't forget to use the 
                feedback button (💬) to tell us what you think!
              </p>
              <button onClick={() => onEnroll?.(form)} style={S.submitBtn}>
                Start Using Grant Platform →
              </button>
            </div>
          ) : (
            <form style={S.formCard} onSubmit={submit}>
              <div style={S.fieldGroup}>
                <label style={S.label}>Your Name *</label>
                <input style={S.input} type="text" required value={form.name} onChange={e => update('name', e.target.value)} placeholder="Jane Doe" />
              </div>
              <div style={S.fieldGroup}>
                <label style={S.label}>Email *</label>
                <input style={S.input} type="email" required value={form.email} onChange={e => update('email', e.target.value)} placeholder="jane@org.org" />
              </div>
              <div style={S.fieldGroup}>
                <label style={S.label}>Organization</label>
                <input style={S.input} type="text" value={form.org} onChange={e => update('org', e.target.value)} placeholder="Your Org Name" />
              </div>
              <div style={S.fieldGroup}>
                <label style={S.label}>Organization Type *</label>
                <select style={S.select} required value={form.orgType} onChange={e => update('orgType', e.target.value)}>
                  <option value="">Select...</option>
                  {ORG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={S.fieldGroup}>
                <label style={S.label}>Grant Experience</label>
                <select style={S.select} value={form.experience} onChange={e => update('experience', e.target.value)}>
                  <option value="">Select...</option>
                  {EXPERIENCE_LEVELS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={S.fieldGroup}>
                <label style={S.label}>Primary Use Case</label>
                <select style={S.select} value={form.useCase} onChange={e => update('useCase', e.target.value)}>
                  <option value="">Select...</option>
                  {USE_CASES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={S.fieldGroup}>
                <label style={S.label}>What's your biggest grant challenge?</label>
                <textarea style={{ ...S.input, minHeight: 80, resize: 'vertical' }} value={form.feedback} onChange={e => update('feedback', e.target.value)} placeholder="Tell us what frustrates you about the current grant process..." />
              </div>
              {error && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 8 }}>{error}</div>}
              <button type="submit" style={S.submitBtn} disabled={submitting}>
                {submitting ? 'Joining...' : 'Join Alpha Program →'}
              </button>
              <p style={{ fontSize: 11, color: '#555', textAlign: 'center', marginTop: 12 }}>
                30-60 minutes/week · Things may break · Your feedback matters
              </p>
            </form>
          )}
        </div>
      </div>

      <div style={S.footer}>
        UNLESS Grant Platform · Alpha Program · Built for organizations that change the world
      </div>
    </div>
  );
}
