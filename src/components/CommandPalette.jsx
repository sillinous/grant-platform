import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { T } from '../globals';
import { useStore } from '../store';

const COMMANDS = [
  { id: 'dashboard', label: 'Executive Dashboard', icon: '📊', path: '/dashboard', desc: 'High-level portfolio overview', group: 'Navigate' },
  { id: 'discovery', label: 'Discovery Hub', icon: '🔭', path: '/discovery', desc: 'Find new grant opportunities', group: 'Navigate' },
  { id: 'studio', label: 'Grant Writing Studio', icon: '🖋️', path: '/studio', desc: 'AI-powered grant writing', group: 'Navigate' },
  { id: 'pipeline', label: 'Grant Pipeline', icon: '🚀', path: '/pipeline', desc: 'Manage your grant stages', group: 'Navigate' },
  { id: 'impact', label: 'Impact Portfolio', icon: '🌍', path: '/impact', desc: 'Visualize your impact', group: 'Navigate' },
  { id: 'intelligence', label: 'Intelligence Feed', icon: '📡', path: '/intelligence', desc: 'Strategic intelligence briefings', group: 'Navigate' },
  { id: 'concierge', label: 'AI Concierge', icon: '🤖', path: '/concierge', desc: 'Personalized AI recommendations', group: 'Navigate' },
  { id: 'profile', label: 'Organization Profile', icon: '🏢', path: '/profile', desc: 'Manage org settings', group: 'Navigate' },
  { id: 'settings', label: 'System Settings', icon: '⚙️', path: '/settings', desc: 'Configure API keys and preferences', group: 'Navigate' },
];

export const CommandPalette = () => {
  const navigate = useNavigate();
  const { grants } = useStore();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef(null);

  // Build grant commands dynamically from store
  const grantCommands = grants.slice(0, 10).map(g => ({
    id: `grant-${g.id}`,
    label: g.title,
    icon: '🎯',
    desc: `${g.agency || ''} · ${g.stage || 'pipeline'}`,
    group: 'Your Grants',
    action: () => navigate('/pipeline'),
  }));

  const allCommands = [...COMMANDS, ...grantCommands];

  const filtered = query
    ? allCommands.filter(c =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.desc?.toLowerCase().includes(query.toLowerCase())
      )
    : allCommands;

  // Keyboard shortcut to open
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(o => !o);
        setQuery('');
        setSelected(0);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus input when open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && filtered[selected]) {
      const cmd = filtered[selected];
      if (cmd.path) navigate(cmd.path);
      if (cmd.action) cmd.action();
      setOpen(false);
    }
  };

  if (!open) return null;

  const groups = [...new Set(filtered.map(c => c.group))];

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 50000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '15vh', animation: 'fadeIn 0.15s' }}
      onClick={e => e.target === e.currentTarget && setOpen(false)}
    >
      <div style={{ width: '100%', maxWidth: 600, background: T.panel, border: `1px solid ${T.borderHi}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.8)', animation: 'fadeSlideUp 0.25s ease-out' }}>
        {/* Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: `1px solid ${T.border}` }}>
          <span style={{ fontSize: 18, opacity: 0.6 }}>🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search grants..."
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: T.text, fontSize: 16, fontFamily: 'inherit' }}
          />
          <kbd style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 5, padding: '2px 6px', fontSize: 10, color: T.mute }}>ESC</kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: T.mute, fontSize: 13 }}>No results found</div>
          ) : (
            groups.map(group => {
              const groupItems = filtered.filter(c => c.group === group);
              let idx = filtered.indexOf(groupItems[0]);
              return (
                <div key={group}>
                  <div style={{ padding: '8px 18px 4px', fontSize: 10, fontWeight: 800, color: T.mute, letterSpacing: 1.5, textTransform: 'uppercase' }}>{group}</div>
                  {groupItems.map(cmd => {
                    const cmdIdx = filtered.indexOf(cmd);
                    const isSelected = cmdIdx === selected;
                    return (
                      <div
                        key={cmd.id}
                        onClick={() => { if (cmd.path) navigate(cmd.path); if (cmd.action) cmd.action(); setOpen(false); }}
                        onMouseEnter={() => setSelected(cmdIdx)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '10px 18px', cursor: 'pointer',
                          background: isSelected ? `${T.amber}10` : 'transparent',
                          borderLeft: `2px solid ${isSelected ? T.amber : 'transparent'}`,
                          transition: 'all 0.1s',
                        }}
                      >
                        <span style={{ fontSize: 18, opacity: isSelected ? 1 : 0.7 }}>{cmd.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: isSelected ? T.text : T.sub }}>{cmd.label}</div>
                          {cmd.desc && <div style={{ fontSize: 11, color: T.mute }}>{cmd.desc}</div>}
                        </div>
                        {cmd.path && <kbd style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 5, padding: '2px 6px', fontSize: 9, color: T.dim }}>↵</kbd>}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '8px 18px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 16, fontSize: 10, color: T.mute }}>
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>ESC Close</span>
          <span style={{ marginLeft: 'auto' }}>Ctrl+K to open</span>
        </div>
      </div>
    </div>
  );
};
