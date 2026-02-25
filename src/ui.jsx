import React from 'react';
import { T } from './globals';

export const ErrorBoundary = ({ children }) => (
    <div style={{ padding: 20, background: T.red + "11", color: T.red, borderRadius: 8 }}>
        {children}
    </div>
);

export const Btn = ({ children, variant = "ghost", size = "md", style, block, ...props }) => {
    const colors = {
        primary: { bg: T.amber, text: "#000" },
        success: { bg: T.green, text: "#fff" },
        danger: { bg: T.red, text: "#fff" },
        ghost: { bg: "rgba(255,255,255,0.05)", text: T.text },
        outline: { bg: "transparent", border: `1px solid ${T.glassBorder}`, text: T.text }
  };
    const theme = colors[variant] || colors.ghost;
    const padding = size === "xs" ? "4px 8px" : size === "sm" ? "8px 12px" : "12px 20px";
    const fontSize = size === "xs" ? 11 : size === "sm" ? 13 : 14;

  return (
      <button
          style={{
              padding, fontSize, fontWeight: 700, borderRadius: 10, border: theme.border || "none",
              background: theme.bg, color: theme.text, cursor: "pointer", transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              display: block ? "flex" : "inline-flex", alignItems: "center", gap: 8, justifyContent: "center", width: block ? "100%" : "auto",
              boxShadow: variant === "primary" ? "0 4px 15px rgba(245, 158, 11, 0.2)" : "none",
              ...style
          }}
          onMouseEnter={e => { e.currentTarget.style.filter = "brightness(1.1)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { e.currentTarget.style.filter = "none"; e.currentTarget.style.transform = "none"; }}
          {...props}
      >
          {children}
      </button>
  );
};

export const Card = ({ children, style, glow, ...props }) => (
    <div
        className="animate-in"
        style={{
            background: T.glassLg, backdropFilter: "blur(12px)", border: `1px solid ${T.glassBorder}`,
            borderRadius: 16, padding: 20, boxShadow: glow ? T.glow : "none",
            ...style
        }}
        {...props}
    >
        {children}
    </div>
);

export const Badge = ({ children, color = T.blue, style }) => (
    <span style={{
        padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 800,
        background: color + "22", color, border: `1px solid ${color}44`,
        letterSpacing: "0.05em", textTransform: "uppercase", ...style
    }}>
        {children}
    </span>
);

export const Input = ({ label, style, ...props }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
        {label && <label style={{ fontSize: 12, color: T.sub, fontWeight: 600 }}>{label}</label>}
        <input
            style={{
                padding: "12px 16px", background: "rgba(255,255,255,0.03)", border: `1px solid ${T.glassBorder}`,
                borderRadius: 10, color: T.text, fontSize: 14, outline: "none", transition: "border-color 0.2s",
                ...style
            }}
            onFocus={e => e.currentTarget.style.borderColor = T.amber}
            onBlur={e => e.currentTarget.style.borderColor = T.glassBorder}
            {...props}
        />
    </div>
);

export const Select = ({ label, options = [], style, ...props }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
        {label && <label style={{ fontSize: 12, color: T.sub, fontWeight: 600 }}>{label}</label>}
        <select
            style={{
                padding: "12px 16px", background: "rgba(255,255,255,0.03)", border: `1px solid ${T.glassBorder}`,
                borderRadius: 10, color: T.text, fontSize: 14, outline: "none", transition: "border-color 0.2s",
                cursor: "pointer", appearance: "none", ...style
            }}
            {...props}
        >
            {options.map(opt => <option key={opt.value} value={opt.value} style={{ background: T.panel }}>{opt.label}</option>)}
        </select>
    </div>
);

export const Progress = ({ value, max = 100, color = T.blue, height = 10, style }) => (
    <div style={{ width: "100%", height, background: "rgba(255,255,255,0.05)", borderRadius: height / 2, overflow: "hidden", ...style }}>
        <div style={{ width: `${(value / max) * 100}%`, height: "100%", background: color, transition: "width 0.3s ease" }} />
    </div>
);

export const Tabs = ({ children, defaultValue, className, onValueChange }) => {
    const [active, setActive] = React.useState(defaultValue);
    return (
        <div className={className}>
            {React.Children.map(children, child => {
                if (child.type === TabsList || child.type === TabsContent) {
                    return React.cloneElement(child, { active, setActive });
                }
                return child;
            })}
        </div>
    );
};

export const TabsList = ({ children, active, setActive, style }) => (
    <div style={{ display: "flex", borderBottom: `1px solid ${T.glassBorder}`, marginBottom: 20, ...style }}>
        {React.Children.map(children, child => React.cloneElement(child, { active, setActive }))}
    </div>
);

export const TabsTrigger = ({ children, value, active, setActive, style }) => (
    <button
        onClick={() => setActive(value)}
        style={{
            padding: "12px 20px", background: "none", border: "none", borderBottom: `2px solid ${active === value ? T.amber : "transparent"}`,
            color: active === value ? T.text : T.sub, cursor: "pointer", fontSize: 14, fontWeight: active === value ? 700 : 500,
            transition: "all 0.2s", ...style
        }}
    >
        {children}
    </button>
);

export const TabsContent = ({ children, value, active }) => active === value ? <div className="animate-in">{children}</div> : null;

export const Stat = ({ label, value, color = T.amber, size = "md", style }) => (
    <div style={style}>
        <div style={{ fontSize: size === "lg" ? 12 : 11, color: T.sub, fontWeight: 700, letterSpacing: 1 }}>{label.toUpperCase()}</div>
        <div style={{ fontSize: size === "lg" ? 32 : 24, fontWeight: 900, color, marginTop: 4, letterSpacing: "-0.02em" }}>{value}</div>
    </div>
);

export const MiniBar = ({ values = [], colors = [], height = 6 }) => (
    <div style={{ display: "flex", width: "100%", height, background: "rgba(255,255,255,0.05)", borderRadius: height / 2, overflow: "hidden" }}>
        {values.map((v, i) => (
            <div key={i} style={{ width: `${v}%`, height: "100%", background: colors[i] || T.blue, transition: "width 0.3s ease" }} />
        ))}
    </div>
);

const ICON_MAP = {
    chart: "📊",
    rocket: "🚀",
    shield: "🛡️",
    bolt: "⚡",
    cog: "⚙️",
    user: "👤",
    search: "🔍",
    check: "✓",
    alert: "⚠️",
    info: "ℹ️",
    briefcase: "💼",
    globe: "🌍",
    target: "🎯",
    trending: "📈"
};

export const Icon = ({ name, size = 16, style }) => (
    <span style={{ fontSize: size, display: "inline-flex", alignItems: "center", justifyContent: "center", ...style }}>
        {ICON_MAP[name] || "❓"}
    </span>
);

export const Modal = ({ title, children, onClose }) => (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
        <Card style={{ maxWidth: 600, width: "100%", maxHeight: "90vh", overflow: "auto", position: "relative", border: `1px solid ${T.glassBorder}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{title}</h2>
                <button onClick={onClose} style={{ background: "none", border: "none", color: T.sub, cursor: "pointer", fontSize: 20 }}>✕</button>
            </div>
            {children}
        </Card>
    </div>
);

export const TrackBtn = ({ onTrack, defaultLabel = "+ Track" }) => {
    const [tracked, setTracked] = React.useState(false);
    return (
        <Btn
            size="sm"
            variant={tracked ? "success" : "ghost"}
            onClick={() => { onTrack(); setTracked(true); }}
            disabled={tracked}
        >
            {tracked ? "✓ Tracked" : defaultLabel}
        </Btn>
    );
};

export const Empty = ({ icon, title, sub }) => (
    <div style={{ padding: "60px 20px", textAlign: "center", color: T.mute }}>
        <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>{icon}</div>
        <h3 style={{ fontSize: 18, color: T.sub, margin: 0 }}>{title}</h3>
        <p style={{ fontSize: 13, margin: "8px 0 0" }}>{sub}</p>
    </div>
);

export const SkeletonCard = ({ lines = 3, style }) => (
    <Card style={{ padding: 16, ...style }}>
        {[...Array(lines)].map((_, i) => (
            <div key={i} style={{ height: 12, background: "rgba(255,255,255,0.03)", borderRadius: 6, marginBottom: 10, width: i === 0 ? "40%" : i === lines - 1 ? "60%" : "100%" }} />
        ))}
    </Card>
);

export const TextArea = ({ label, style, ...props }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%", marginBottom: 12 }}>
        {label && <label style={{ fontSize: 12, color: T.sub, fontWeight: 600 }}>{label}</label>}
        <textarea
            style={{
                padding: "12px 16px", background: "rgba(255,255,255,0.03)", border: `1px solid ${T.glassBorder}`,
                borderRadius: 10, color: T.text, fontSize: 14, outline: "none", transition: "border-color 0.2s",
                minHeight: 100, resize: "vertical", fontFamily: "inherit",
                ...style
            }}
            onFocus={e => e.currentTarget.style.borderColor = T.amber}
            onBlur={e => e.currentTarget.style.borderColor = T.glassBorder}
            {...props}
        />
    </div>
);

export const MagicBtn = ({ onClick, loading, label = "Magic Draft", style }) => (
    <button
        onClick={onClick}
        disabled={loading}
        style={{
            padding: "6px 12px", borderRadius: 8, border: "none",
            background: `linear-gradient(135deg, ${T.purple} 0%, ${T.blue} 100%)`,
            color: "white", fontSize: 11, fontWeight: 800, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6, opacity: loading ? 0.6 : 1,
            boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)",
            ...style
        }}
    >
        <span>{loading ? "✨ Processing..." : "✨ " + label}</span>
    </button>
);
