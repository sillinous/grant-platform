import React, { useState, useEffect, useCallback } from 'react';
import { Card, Btn, Progress } from '../ui';
import { T, saveProfile, PROFILE } from '../globals';
import { API } from '../api';

const ORG_TYPES = [
  { id: 'nonprofit', icon: '≡ƒÅ¢∩╕Å', label: 'Nonprofit Organization', desc: 'Tax-exempt org (501(c)(3), etc.)' },
  { id: 'smallbiz', icon: '≡ƒÅó', label: 'Small Business', desc: 'SBIR/STTR eligible' },
  { id: 'university', icon: '≡ƒÄô', label: 'University / Research', desc: 'Academic institution or lab' },
  { id: 'govagency', icon: 'ΓÜû∩╕Å', label: 'Government Entity', desc: 'State, local, tribal government' },
  { id: 'consultant', icon: '≡ƒô¥', label: 'Grant Consultant', desc: 'Write grants for others' },
  { id: 'individual', icon: '≡ƒæñ', label: 'Individual / Researcher', desc: 'Personal research or project' },
];

const FOCUS_AREAS = [
  { id: 'health', icon: '≡ƒÅÑ', label: 'Health & Human Services' },
  { id: 'education', icon: '≡ƒôÜ', label: 'Education & Workforce' },
  { id: 'environment', icon: '≡ƒî┐', label: 'Environment & Energy' },
  { id: 'technology', icon: '≡ƒÆ╗', label: 'Technology & Innovation' },
  { id: 'community', icon: '≡ƒÅÿ∩╕Å', label: 'Community Development' },
  { id: 'agriculture', icon: '≡ƒî╛', label: 'Agriculture & Rural' },
  { id: 'justice', icon: 'ΓÜû∩╕Å', label: 'Justice & Public Safety' },
  { id: 'arts', icon: '≡ƒÄ¿', label: 'Arts & Culture' },
  { id: 'housing', icon: '≡ƒÅá', label: 'Housing & Infrastructure' },
  { id: 'science', icon: '≡ƒö¼', label: 'Science & Research' },
  { id: 'international', icon: '≡ƒîì', label: 'International Development' },
  { id: 'defense', icon: '≡ƒ¢í∩╕Å', label: 'Defense & Security' },
];

const STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC','PR','GU','VI','AS','MP',
];

const FOCUS_TO_KEYWORD = {
  health: 'health services medical', education: 'education workforce training',
  environment: 'environment climate energy', technology: 'technology innovation SBIR',
  community: 'community development economic', agriculture: 'agriculture rural USDA',
  justice: 'justice public safety', arts: 'arts cultural humanities',
  housing: 'housing infrastructure transportation', science: 'research science NSF',
  international: 'international development USAID', defense: 'defense security DOD',
};

const ChoiceGrid = ({ options, selected, onSelect, multi = false, cols = 3 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 10 }}>
    {options.map(opt => {
      const isSelected = multi ? selected?.includes(opt.id) : selected === opt.id;
      return (
        <button key={opt.id} onClick={() => {
          if (multi) {
            const next = selected?.includes(opt.id)
              ? selected.filter(x => x !== opt.id)
              : [...(selected || []), opt.id];
            onSelect(next);
          } else onSelect(opt.id);
        }} style={{
          background: isSelected ? T.amber + '18' : T.panel,
          border: `1.5px solid ${isSelected ? T.amber : T.border}`,
          borderRadius: 12, padding: '14px 12px', cursor: 'pointer',
          textAlign: 'left', transition: 'all 0.15s',
        }}>
          <div style={{ fontSize: 22, marginBottom: 6 }}>{opt.icon}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: isSelected ? T.amber : T.text }}>{opt.label}</div>
          {opt.desc && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{opt.desc}</div>}
        </button>
      );
    })}
  </div>
);

const GrantPreview = ({ grant }) => {
  const amt = grant.awardCeiling || grant.estimatedFunding || 0;
  const deadline = grant.closeDate || grant.archiveDate;
  return (
    <div style={{
      background: T.panel, border: `1px solid ${T.border}`,
      borderRadius: 10, padding: '12px 14px', marginBottom: 8,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.text, lineHeight: 1.4,
            overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {grant.title}
          </div>
          <div style={{ fontSize: 11, color: T.sub, marginTop: 3 }}>
            {grant.agencyCode || grant.agency || 'Federal'} ┬╖ {grant.number || ''}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          {amt > 0 && <div style={{ fontSize: 13, fontWeight: 800, color: T.green }}>
            ${amt >= 1000000 ? (amt / 1000000).toFixed(1) + 'M' : amt >= 1000 ? (amt / 1000).toFixed(0) + 'K' : amt}
          </div>}
          {deadline && <div style={{ fontSize: 10, color: T.orange }}>
            Due {new Date(deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>}
        </div>
      </div>
    </div>
  );
};

export const OnboardingWizard = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [orgName, setOrgName] = useState(PROFILE.name || '');
  const [orgType, setOrgType] = useState('');
  const [state, setState] = useState('');
  const [focusAreas, setFocusAreas] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchCount, setSearchCount] = useState(0);
  const TOTAL = 5;

  const doSearch = useCallback(async () => {
    if (focusAreas.length === 0) return;
    setSearchLoading(true);
    try {
      const keywords = focusAreas.slice(0, 2).map(f => FOCUS_TO_KEYWORD[f] || f).join(' ');
      const res = await API.searchGrants(keywords, { rows: 6 });
      setSearchResults(res.oppHits || []);
      setSearchCount(res.totalCount || 0);
    } catch { setSearchResults([]); }
    setSearchLoading(false);
  }, [focusAreas]);

  useEffect(() => {
    if (step === 4 && searchResults.length === 0 && !searchLoading) doSearch();
  }, [step, searchResults.length, searchLoading, doSearch]);

  const finish = () => {
    const profile = {
      name: orgName, loc: state, tags: focusAreas,
      orgType, onboardedAt: new Date().toISOString(),
    };
    saveProfile(profile);
    localStorage.setItem('gp_onboarded', '1');
    onComplete?.(profile);
  };

  const canAdvance = () => {
    if (step === 1) return orgType;
    if (step === 2) return orgName;
    if (step === 3) return focusAreas.length > 0;
    return true;
  };

  const S = {
    overlay: {
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 10000, padding: 20,
    },
    card: {
      background: T.bg, border: `1px solid ${T.border}`,
      borderRadius: 20, maxWidth: 640, width: '100%',
      maxHeight: '90vh', overflowY: 'auto',
      boxShadow: '0 32px 100px rgba(0,0,0,0.5)',
    },
    header: { padding: '28px 32px 0', position: 'relative' },
    body: { padding: '20px 32px 28px' },
    title: { fontSize: 22, fontWeight: 800, color: T.text, marginBottom: 4 },
    desc: { fontSize: 13, color: T.sub, lineHeight: 1.6, marginBottom: 20 },
    input: {
      width: '100%', padding: '12px 14px', borderRadius: 10,
      border: `1px solid ${T.border}`, background: T.panel,
      color: T.text, fontSize: 14, outline: 'none', boxSizing: 'border-box',
    },
    select: {
      width: '100%', padding: '12px 14px', borderRadius: 10,
      border: `1px solid ${T.border}`, background: T.panel,
      color: T.text, fontSize: 14, outline: 'none', boxSizing: 'border-box',
    },
    footer: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      paddingTop: 16, borderTop: `1px solid ${T.border}`,
    },
    skip: {
      background: 'none', border: 'none', color: T.mute,
      fontSize: 12, cursor: 'pointer', padding: '4px 8px',
    },
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (<>
          <div style={S.title}>What type of organization are you?</div>
          <div style={S.desc}>This helps us tailor grant recommendations to your eligibility.</div>
          <ChoiceGrid options={ORG_TYPES} selected={orgType} onSelect={setOrgType} cols={2} />
        </>);
      case 2:
        return (<>
          <div style={S.title}>Tell us about your organization</div>
          <div style={S.desc}>We'll use this to match you with relevant opportunities.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Organization Name {orgType === 'individual' ? '(or Your Name)' : ''}
              </label>
              <input style={S.input} value={orgName} onChange={e => setOrgName(e.target.value)}
                placeholder={orgType === 'individual' ? 'Your Name' : 'e.g., Sunrise Community Foundation'} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                State / Territory
              </label>
              <select style={S.select} value={state} onChange={e => setState(e.target.value)}>
                <option value="">Select your state...</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </>);
      case 3:
        return (<>
          <div style={S.title}>What areas do you focus on?</div>
          <div style={S.desc}>Select all that apply ΓÇö we'll search for matching grants in the next step.</div>
          <ChoiceGrid options={FOCUS_AREAS} selected={focusAreas} onSelect={setFocusAreas} multi cols={3} />
        </>);
      case 4:
        return (<>
          <div style={S.title}>
            {searchLoading ? 'ΓÜí Searching federal databases...' :
              searchCount > 0 ? `≡ƒÄ» ${searchCount.toLocaleString()} grants match your profile` :
                'Searching for opportunities...'}
          </div>
          <div style={S.desc}>
            {searchLoading ? 'Querying Grants.gov for opportunities matching your focus areas...' :
              searchCount > 0 ? 'Here are some current opportunities. You can explore thousands more in the Discovery module.' :
                'We searched for grants but didn\'t find exact matches right now. The Discovery module has 23+ data sources to search.'}
          </div>
          {searchLoading ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>≡ƒöì</div>
              <div style={{ fontSize: 12, color: T.sub }}>Searching Grants.gov...</div>
            </div>
          ) : (
            <div>
              {searchResults.slice(0, 5).map((g, i) => <GrantPreview key={i} grant={g} />)}
              {searchCount > 6 && (
                <div style={{ textAlign: 'center', padding: '12px 0', fontSize: 12, color: T.amber, fontWeight: 600 }}>
                  + {(searchCount - 6).toLocaleString()} more matching opportunities ΓåÆ
                </div>
              )}
            </div>
          )}
        </>);
      case 5:
        return (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>≡ƒÜÇ</div>
            <div style={S.title}>You're all set{orgName ? `, ${orgName}` : ''}!</div>
            <div style={{ ...S.desc, maxWidth: 420, margin: '0 auto' }}>
              Your profile is configured. Here's your quick-start guide:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, textAlign: 'left', marginTop: 16 }}>
              {[
                { icon: '≡ƒöì', title: 'Discover Grants', desc: 'Search 23+ federal data sources for matching opportunities', color: T.blue },
                { icon: 'Γ£ì∩╕Å', title: 'AI Grant Writer', desc: 'Draft narratives with AI that understands grant language', color: T.amber },
                { icon: '≡ƒôè', title: 'Track Your Pipeline', desc: 'Manage applications through 12 lifecycle stages', color: T.green },
                { icon: '≡ƒºá', title: 'Intelligence Suite', desc: '15+ tools for research, analysis, and strategy', color: T.purple },
              ].map(({ icon, title, desc, color }) => (
                <div key={title} style={{
                  background: T.panel, border: `1px solid ${T.border}`,
                  borderRadius: 10, padding: '14px',
                }}>
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color }}>{title}</div>
                  <div style={{ fontSize: 11, color: T.sub, marginTop: 2, lineHeight: 1.4 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div style={S.overlay}>
      <div style={S.card}>
        <div style={S.header}>
          <Progress value={step} max={TOTAL} color={T.amber} height={4} style={{ marginBottom: 0 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
            <div style={{ fontSize: 11, color: T.mute, fontWeight: 600, letterSpacing: 0.5 }}>
              STEP {step} OF {TOTAL}
            </div>
            <button style={S.skip} onClick={finish}>Skip setup ΓåÆ</button>
          </div>
        </div>
        <div style={S.body}>
          {renderStep()}
          <div style={S.footer}>
            {step > 1 ? (
              <Btn variant="ghost" size="sm" onClick={() => setStep(step - 1)}>ΓåÉ Back</Btn>
            ) : <div />}
            {step < TOTAL ? (
              <Btn variant="primary" size="sm" onClick={() => setStep(step + 1)}
                disabled={!canAdvance()}>
                {step === 3 ? '≡ƒöì Search Grants ΓåÆ' : 'Next ΓåÆ'}
              </Btn>
            ) : (
              <Btn variant="primary" onClick={finish}>≡ƒÜÇ Launch Dashboard</Btn>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
