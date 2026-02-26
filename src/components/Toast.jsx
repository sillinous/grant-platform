import React, { useEffect, useState } from 'react';
import { T } from '../globals';
import { useStore } from '../store';

// Add a global toast notification system backed by the store
// Usage: useStore.getState().showToast("Message", "success" | "error" | "info")

export const Toast = () => {
  const { toast } = useStore();
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState(null);

  useEffect(() => {
    if (toast) {
      setCurrent(toast);
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 3200);
      return () => clearTimeout(t);
    }
  }, [toast]);

  if (!visible || !current) return null;

  const colors = {
    success: T.green,
    error: T.red,
    warning: T.amber,
    info: T.blue,
  };
  const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
  const color = colors[current.type] || T.amber;

  return (
    <div style={{
      position: "fixed", bottom: 80, right: 24,
      padding: "12px 18px",
      borderRadius: 12,
      background: T.panel,
      border: `1px solid ${color}44`,
      color: T.text,
      fontSize: 13,
      fontWeight: 600,
      zIndex: 99999,
      animation: "fadeSlideUp 0.3s ease-out",
      boxShadow: `0 8px 30px rgba(0,0,0,0.5), 0 0 0 1px ${color}22`,
      display: "flex", alignItems: "center", gap: 10,
      minWidth: 220, maxWidth: 360,
    }}>
      <span style={{ color, fontSize: 16, flexShrink: 0 }}>{icons[current.type] || '●'}</span>
      <span style={{ color: T.text }}>{current.msg}</span>
    </div>
  );
};
