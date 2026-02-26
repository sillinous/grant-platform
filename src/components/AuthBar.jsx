import React, { useState, useEffect } from 'react';
import { T } from '../globals';
import { Btn, Badge } from '../ui';
import { auth } from '../auth';
import { cloud } from '../cloud';

export const AuthBar = () => {
  const [user, setUser] = useState(auth.user);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'saved' | 'error'
  const [lastSyncedLabel, setLastSyncedLabel] = useState('');

  useEffect(() => {
    // Register cloud status callback
    cloud.onStatusChange = (status) => {
      setSyncStatus(status);
      if (status === 'saved' && cloud.lastSynced) {
        setLastSyncedLabel('Just now');
      }
    };

    // Listen for auth changes broadcast from main.jsx via custom event
    const onAuthChange = (e) => {
      setUser(e.detail);
      // Clear label on logout
      if (!e.detail) {
        setSyncStatus('idle');
        setLastSyncedLabel('');
      }
    };
    window.addEventListener('gp_auth_change', onAuthChange);

    // Reflect current user on mount
    setUser(auth.user);

    return () => {
      window.removeEventListener('gp_auth_change', onAuthChange);
      cloud.onStatusChange = null;
    };
  }, []);

  const handleSync = async () => {
    setSyncStatus('syncing');
    await cloud.push();
  };

  const syncColor = {
    idle: T.mute,
    syncing: T.amber,
    saved: T.green,
    error: T.red,
  }[syncStatus] || T.mute;

  const syncIcon = {
    idle: '☁️',
    syncing: '⏳',
    saved: '✓',
    error: '⚠️',
  }[syncStatus] || '☁️';

  const syncLabel = {
    idle: 'Not synced',
    syncing: 'Saving...',
    saved: lastSyncedLabel || 'Saved',
    error: 'Sync failed',
  }[syncStatus] || '';

  // ── Logged Out ──────────────────────────────────────────────────────
  if (!user) {
    return (
      <div style={{ padding: '14px 16px', borderTop: `1px solid ${T.glassBorder}` }}>
        <div style={{ fontSize: 11, color: T.mute, marginBottom: 10, textAlign: 'center' }}>
          Sign in to sync your data across devices
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn
            variant="primary"
            block
            size="sm"
            onClick={() => auth.login()}
          >
            🔐 Sign In
          </Btn>
          <Btn
            variant="ghost"
            block
            size="sm"
            style={{ border: `1px solid ${T.glassBorder}` }}
            onClick={() => auth.signup()}
          >
            Sign Up
          </Btn>
        </div>
      </div>
    );
  }

  // ── Logged In ───────────────────────────────────────────────────────
  const initials = (user.user_metadata?.full_name || user.email || '?')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div style={{ padding: '12px 16px', borderTop: `1px solid ${T.glassBorder}`, background: 'rgba(0,0,0,0.1)' }}>
      {/* User Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: `linear-gradient(135deg, ${T.amber}, #f97316)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 800, color: '#000'
        }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.user_metadata?.full_name || user.email?.split('@')[0]}
          </div>
          <div style={{ fontSize: 10, color: T.mute, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.email}
          </div>
        </div>
      </div>

      {/* Sync Status Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1 }}>
          <span style={{ fontSize: 13 }}>{syncIcon}</span>
          <span style={{ fontSize: 10, color: syncColor, fontWeight: 600 }}>{syncLabel}</span>
        </div>
        <button
          onClick={handleSync}
          disabled={syncStatus === 'syncing'}
          title="Sync to cloud"
          style={{
            background: 'none', border: `1px solid ${T.glassBorder}`, borderRadius: 6,
            padding: '3px 8px', fontSize: 10, color: syncStatus === 'syncing' ? T.amber : T.sub,
            cursor: syncStatus === 'syncing' ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { if (syncStatus !== 'syncing') e.currentTarget.style.borderColor = T.amber; }}
          onMouseLeave={e => e.currentTarget.style.borderColor = T.glassBorder}
        >
          {syncStatus === 'syncing' ? 'Saving…' : '↑ Sync'}
        </button>
        <button
          onClick={() => auth.logout()}
          title="Sign out"
          style={{
            background: 'none', border: `1px solid ${T.glassBorder}`, borderRadius: 6,
            padding: '3px 8px', fontSize: 10, color: T.mute,
            cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.red; e.currentTarget.style.color = T.red; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.glassBorder; e.currentTarget.style.color = T.mute; }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};
