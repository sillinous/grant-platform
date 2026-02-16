import { Component, useState } from "react";
import { T, clamp } from "./globals";

// ─── ERROR BOUNDARY ────────────────────────────────────────────────────
export class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error(`ErrorBoundary [${this.props.name || "unknown"}]:`, error, info); }
  render() {
    if (this.state.error) return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 8 }}>Something went wrong in {this.props.name || "this module"}</div>
        <div style={{ fontSize: 12, color: T.mute, marginBottom: 16 }}>{this.state.error.message}</div>
        <button onClick={() => this.setState({ error: null })} style={{
          padding: "8px 16px", background: T.amber, border: "none", borderRadius: 6, cursor: "pointer",
          color: "#0a0e14", fontWeight: 600, fontSize: 12
        }}>🔄 Try Again</button>
      </div>
    );
    return this.props.children;
  }
}

// ─── ICON COMPONENTS ───────────────────────────────────────────────────
export const Icon = ({ name, size = 16, color = T.sub }) => {
  const icons = {
    search: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
    plus: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>,
    check: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M20 6 9 17l-5-5"/></svg>,
    x: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>,
    chevRight: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>,
    chevDown: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>,
    calendar: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
    folder: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
    dollar: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    network: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><circle cx="12" cy="5" r="3"/><circle cx="5" cy="19" r="3"/><circle cx="19" cy="19" r="3"/><path d="M12 8v4M8.5 17 11 14M15.5 17 13 14"/></svg>,
    ai: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4zM6 12h12M8 20h8M12 12v8"/></svg>,
    chart: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>,
    file: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>,
    settings: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>,
    alert: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>,
    trophy: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>,
    download: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>,
    refresh: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
    copy: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
    trash: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
    edit: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  };
  return icons[name] || null;
};

// ─── SHARED UI COMPONENTS ──────────────────────────────────────────────
export const Btn = ({ children, onClick, variant = "default", size = "md", icon, disabled, style }) => {
  const base = { border:"none", borderRadius:6, cursor: disabled ? "not-allowed" : "pointer", display:"inline-flex", alignItems:"center", gap:6, fontFamily:"inherit", transition:"all 0.2s", opacity: disabled ? 0.5 : 1 };
  const variants = {
    default: { ...base, background:T.card, color:T.text, border:`1px solid ${T.border}` },
    primary: { ...base, background:T.amber, color:"#0a0e14", fontWeight:600 },
    ghost: { ...base, background:"transparent", color:T.sub },
    danger: { ...base, background:"transparent", color:T.red, border:`1px solid ${T.red}33` },
    success: { ...base, background:T.green+"22", color:T.green, border:`1px solid ${T.green}33` },
  };
  const sizes = { sm: { padding:"4px 10px", fontSize:12 }, md: { padding:"8px 16px", fontSize:13 }, lg: { padding:"10px 20px", fontSize:14 } };
  return <button onClick={disabled ? undefined : onClick} style={{ ...variants[variant], ...sizes[size], ...style }}>{icon}{children}</button>;
};

export const Card = ({ children, style, onClick, glow }) => (
  <div onClick={onClick} style={{
    background: T.card, border: `1px solid ${glow ? T.amber+"44" : T.border}`,
    borderRadius: 10, padding: 16, transition: "all 0.2s",
    cursor: onClick ? "pointer" : "default",
    boxShadow: glow ? `0 0 20px ${T.amber}11` : "none", ...style,
  }}>{children}</div>
);

export const Badge = ({ children, color = T.amber, style, ...props }) => (
  <span {...props} style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: color + "22", color, ...style }}>{children}</span>
);

export const Input = ({ value, onChange, placeholder, style, type = "text", ...props }) => (
  <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    style={{ width:"100%", padding:"8px 12px", background:T.panel, border:`1px solid ${T.border}`, borderRadius:6, color:T.text, fontSize:13, fontFamily:"inherit", outline:"none", ...style }} {...props} />
);

export const TextArea = ({ value, onChange, placeholder, rows = 4, style }) => (
  <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
    style={{ width:"100%", padding:"8px 12px", background:T.panel, border:`1px solid ${T.border}`, borderRadius:6, color:T.text, fontSize:13, fontFamily:"inherit", outline:"none", resize:"vertical", ...style }} />
);

export const Select = ({ value, onChange, options, style }) => (
  <select value={value} onChange={e => onChange(e.target.value)}
    style={{ padding:"8px 12px", background:T.panel, border:`1px solid ${T.border}`, borderRadius:6, color:T.text, fontSize:13, fontFamily:"inherit", ...style }}>
    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);

export const Tab = ({ tabs, active, onChange }) => (
  <div style={{ display:"flex", gap:2, background:T.panel, padding:3, borderRadius:8, marginBottom:16 }}>
    {tabs.map(t => (
      <button key={t.id} onClick={() => onChange(t.id)} style={{
        flex:1, padding:"8px 12px", border:"none", borderRadius:6, cursor:"pointer", fontSize:12, fontWeight:500, fontFamily:"inherit",
        background: active === t.id ? T.card : "transparent", color: active === t.id ? T.amber : T.mute, transition:"all 0.2s",
      }}>{t.icon} {t.label}</button>
    ))}
  </div>
);

export const Progress = ({ value, max = 100, color = T.amber, height = 6 }) => (
  <div style={{ width:"100%", height, background:T.dim, borderRadius:height/2, overflow:"hidden" }}>
    <div style={{ width:`${clamp((value/max)*100,0,100)}%`, height:"100%", background:color, borderRadius:height/2, transition:"width 0.5s ease" }} />
  </div>
);

export const Empty = ({ icon = "📭", title, sub: subtitle, action }) => (
  <div style={{ textAlign:"center", padding:48, color:T.mute }}>
    <div style={{ fontSize:40, marginBottom:12 }}>{icon}</div>
    <div style={{ fontSize:15, color:T.sub, marginBottom:4 }}>{title}</div>
    {subtitle && <div style={{ fontSize:12, marginBottom:16 }}>{subtitle}</div>}
    {action}
  </div>
);

export const Modal = ({ open, onClose, title, children, width = 600 }) => {
  if (!open) return null;
  return (
    <div style={{ position:"fixed", inset:0, zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.7)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background:T.panel, border:`1px solid ${T.border}`, borderRadius:12, width:"90%", maxWidth:width, maxHeight:"85vh", overflow:"auto", padding:24 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <h3 style={{ color:T.text, margin:0, fontSize:16 }}>{title}</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", color:T.mute, cursor:"pointer", fontSize:18 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
};

export const Stat = ({ label, value, color = T.amber, sub: subtitle }) => (
  <div style={{ textAlign:"center" }}>
    <div style={{ fontSize:22, fontWeight:700, color, lineHeight:1.2 }}>{value}</div>
    <div style={{ fontSize:11, color:T.mute, marginTop:2 }}>{label}</div>
    {subtitle && <div style={{ fontSize:10, color:T.dim }}>{subtitle}</div>}
  </div>
);

export const MiniBar = ({ data, values, colors, height = 120, color = T.amber }) => {
  if (values && colors) {
    return (
      <div style={{ width: "100%", height: 6, background: T.border, borderRadius: 3, overflow: "hidden", display: "flex" }}>
        {values.map((v, i) => (
          <div key={i} style={{ width: `${v}%`, height: "100%", background: colors[i] || color }} />
        ))}
      </div>
    );
  }
  if (!data) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height, padding: "8px 0" }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{ fontSize: 9, color: T.mute }}>{d.value > 999999 ? `$${(d.value / 1e6).toFixed(0)}M` : d.value > 999 ? `$${(d.value / 1e3).toFixed(0)}K` : d.value}</div>
          <div style={{ width: "100%", height: `${(d.value / max) * 80}%`, minHeight: 2, background: color, borderRadius: 3, transition: "height 0.5s" }} />
          <div style={{ fontSize: 9, color: T.mute }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
};

// ─── CONFIRM MODAL (B2) ─────────────────────────────────────────────────
export const ConfirmModal = ({ open, title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", onConfirm, onCancel, variant = "danger" }) => {
  if (!open) return null;
  const colors = { danger: T.red, warning: T.orange, primary: T.amber };
  const accentColor = colors[variant] || T.amber;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1001, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
      <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, maxWidth: 400, width: "90%", boxShadow: `0 8px 32px rgba(0,0,0,0.5)` }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 8 }}>{title || "Confirm"}</div>
        <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.6, marginBottom: 20, whiteSpace: "pre-wrap" }}>{message}</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Btn size="sm" variant="ghost" onClick={onCancel}>{cancelLabel}</Btn>
          <Btn size="sm" variant="primary" onClick={onConfirm} style={{ background: accentColor }}>{confirmLabel}</Btn>
        </div>
      </div>
    </div>
  );
};

// ─── PROMPT MODAL (B2) ──────────────────────────────────────────────────
export const PromptModal = ({ open, title, message, defaultValue = "", placeholder = "", onSubmit, onCancel }) => {
  const [value, setValue] = useState(defaultValue);
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1001, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
      <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, maxWidth: 400, width: "90%", boxShadow: `0 8px 32px rgba(0,0,0,0.5)` }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 8 }}>{title || "Input"}</div>
        {message && <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.6, marginBottom: 12 }}>{message}</div>}
        <input value={value} onChange={e => setValue(e.target.value)} placeholder={placeholder}
          onKeyDown={e => e.key === "Enter" && onSubmit(value)}
          style={{ width: "100%", background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: "8px 12px", color: T.text, outline: "none", fontSize: 13, marginBottom: 16, boxSizing: "border-box" }}
          autoFocus />
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Btn size="sm" variant="ghost" onClick={onCancel}>Cancel</Btn>
          <Btn size="sm" variant="primary" onClick={() => onSubmit(value)}>OK</Btn>
        </div>
      </div>
    </div>
  );
};

// ─── SKELETON LOADERS (B4) ──────────────────────────────────────────────
const pulse = `@keyframes skeletonPulse { 0%,100% { opacity:0.4 } 50% { opacity:0.8 } }`;
if (typeof document !== "undefined" && !document.getElementById("skeleton-pulse-style")) {
  const style = document.createElement("style"); style.id = "skeleton-pulse-style"; style.textContent = pulse; document.head.appendChild(style);
}

export const SkeletonLine = ({ width = "100%", height = 12, style: sx = {} }) => (
  <div style={{ width, height, background: T.border, borderRadius: 4, animation: "skeletonPulse 1.5s ease-in-out infinite", ...sx }} />
);

export const SkeletonCard = ({ lines = 3, style: sx = {} }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, ...sx }}>
    <SkeletonLine width="60%" height={14} style={{ marginBottom: 12 }} />
    {Array.from({ length: lines }).map((_, i) => (
      <SkeletonLine key={i} width={`${80 - i * 10}%`} style={{ marginBottom: 8 }} />
    ))}
  </div>
);

export const SkeletonStat = ({ style: sx = {} }) => (
  <div style={{ textAlign: "center", ...sx }}>
    <SkeletonLine width={48} height={22} style={{ margin: "0 auto 4px" }} />
    <SkeletonLine width={64} height={10} style={{ margin: "0 auto" }} />
  </div>
);

