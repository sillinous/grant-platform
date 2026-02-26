import React, { useState, useRef, useCallback } from 'react';
import { T } from './globals';

// ─── SPEECH RECOGNITION HOOK ──────────────────────────────────────────────
export const useSpeechRecognition = (onAppend) => {
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);

    const toggle = useCallback(() => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Speech recognition is not supported in this browser. Try Chrome/Edge.");
            return;
        }
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (e) => {
            const transcript = e.results[0][0].transcript;
            if (transcript) onAppend(transcript);
        };
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);

        try { recognition.start(); recognitionRef.current = recognition; } catch (e) { setIsListening(false); }
    }, [isListening, onAppend]);

    return { isListening, toggle };
};

/* ─── Global keyframes injected once ──────────────────────────────────────── */
if (typeof document !== 'undefined' && !document.getElementById('ui-keyframes')) {
    const s = document.createElement('style');
    s.id = 'ui-keyframes';
    s.textContent = `
        @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        @keyframes pulseRing { 0%,100%{box-shadow:0 0 0 0 rgba(245,158,11,0.25)} 50%{box-shadow:0 0 0 8px rgba(245,158,11,0)} }
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes trackPop { 0%{transform:scale(1)} 50%{transform:scale(1.08)} 100%{transform:scale(1)} }
        @keyframes scanLine { 0%{left:-100%} 100%{left:100%} }
        .animate-in { animation: fadeSlideUp 0.35s cubic-bezier(0.25,0.46,0.45,0.94) both; }
        .card-hover { transition: transform 0.2s cubic-bezier(0.4,0,0.2,1), box-shadow 0.2s; }
        .card-hover:hover { transform: translateY(-3px); }
    `;
    document.head.appendChild(s);
}

export const ErrorBoundary = ({ children }) => (
    <div style={{ padding: 20, background: T.red + '11', color: T.red, borderRadius: 8 }}>
        {children}
    </div>
);

export const Btn = ({ children, variant = 'ghost', size = 'md', style, block, ...props }) => {
    const colors = {
        primary: { bg: `linear-gradient(135deg, ${T.amber} 0%, #f97316 100%)`, text: '#000', shadow: `0 4px 15px rgba(245,158,11,0.3)` },
        success: { bg: `linear-gradient(135deg, ${T.green} 0%, #059669 100%)`, text: '#fff', shadow: `0 4px 15px rgba(16,185,129,0.25)` },
        danger: { bg: T.red, text: '#fff', shadow: `0 4px 15px rgba(239,68,68,0.25)` },
        ghost: { bg: 'rgba(255,255,255,0.05)', text: T.text, shadow: 'none' },
        outline: { bg: 'transparent', border: `1px solid ${T.glassBorder}`, text: T.text, shadow: 'none' }
    };
    const theme = colors[variant] || colors.ghost;
    const padding = size === 'xs' ? '4px 8px' : size === 'sm' ? '7px 12px' : '11px 20px';
    const fontSize = size === 'xs' ? 10 : size === 'sm' ? 12 : 14;
    return (
        <button
            style={{
                padding, fontSize, fontWeight: 700, borderRadius: 10, border: theme.border || 'none',
                background: theme.bg, color: theme.text, cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                display: block ? 'flex' : 'inline-flex', alignItems: 'center', gap: 6,
                justifyContent: 'center', width: block ? '100%' : 'auto',
                boxShadow: theme.shadow, letterSpacing: 0.3,
                opacity: props.disabled ? 0.5 : 1,
                ...style
            }}
            onMouseEnter={e => { if (!e.currentTarget.disabled) { e.currentTarget.style.filter = 'brightness(1.12)'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = theme.shadow?.replace(/0\.3\)/, '0.5)') || 'none'; } }}
            onMouseLeave={e => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = theme.shadow; }}
            {...props}
        >
            {children}
        </button>
    );
};

export const Card = ({ children, style, glow, interactive, ...props }) => {
    const [hovered, setHovered] = React.useState(false);
    return (
        <div
            className="animate-in"
            onMouseEnter={() => interactive && setHovered(true)}
            onMouseLeave={() => interactive && setHovered(false)}
            style={{
                background: T.glassLg, backdropFilter: 'blur(14px)',
                border: `1px solid ${hovered ? T.borderHi : T.glassBorder}`,
                borderRadius: 16, padding: 20,
                boxShadow: glow ? `${T.glow}, ${hovered ? '0 16px 40px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.3)'}` : hovered ? '0 12px 32px rgba(0,0,0,0.35)' : 'none',
                transform: interactive && hovered ? 'translateY(-3px)' : 'none',
                transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)',
                ...style
            }}
            {...props}
        >
            {children}
        </div>
    );
};

export const Badge = ({ children, color = T.blue, style, onClick }) => (
    <span
        onClick={onClick}
        style={{
            padding: '3px 9px', borderRadius: 7, fontSize: 10, fontWeight: 800,
            background: color + '1e', color, border: `1px solid ${color}40`,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            cursor: onClick ? 'pointer' : 'default',
            transition: 'all 0.15s',
            display: 'inline-flex', alignItems: 'center', gap: 3,
            ...style
        }}
    >
        {children}
    </span>
);

export const Input = ({ label, style, dictate, value, onChange, ...props }) => {
    const { isListening, toggle } = useSpeechRecognition((transcript) => {
        if (onChange) {
            const currentVal = value || '';
            const space = currentVal.length > 0 && !currentVal.endsWith(' ') ? ' ' : '';
            onChange({ target: { value: currentVal + space + transcript } });
        }
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', position: 'relative' }}>
            {label && <label style={{ fontSize: 11, color: T.sub, fontWeight: 700, letterSpacing: 0.5 }}>{label}</label>}
            <input
                value={value}
                onChange={onChange}
                style={{
                    padding: '11px 15px', paddingRight: dictate ? 40 : 15, background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${T.glassBorder}`,
                    borderRadius: 10, color: T.text, fontSize: 14, outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    ...style
                }}
                onFocus={e => { e.currentTarget.style.borderColor = T.amber; e.currentTarget.style.boxShadow = `0 0 0 3px ${T.amber}18`; }}
                onBlur={e => { e.currentTarget.style.borderColor = T.glassBorder; e.currentTarget.style.boxShadow = 'none'; }}
                {...props}
            />
            {dictate && (
                <button type="button" onClick={toggle} title="Dictate" style={{
                    position: 'absolute', right: 8, bottom: 9, background: 'transparent', border: 'none',
                    color: isListening ? T.red : T.mute, cursor: 'pointer', fontSize: 16,
                    animation: isListening ? 'pulseRing 1.5s infinite' : 'none', borderRadius: '50%',
                    padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    {isListening ? "🔴" : "🎤"}
                </button>
            )}
        </div>
    );
};

export const Select = ({ label, options = [], style, ...props }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
        {label && <label style={{ fontSize: 11, color: T.sub, fontWeight: 700, letterSpacing: 0.5 }}>{label}</label>}
        <select
            style={{
                padding: '11px 15px', background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${T.glassBorder}`,
                borderRadius: 10, color: T.text, fontSize: 14, outline: 'none',
                transition: 'border-color 0.2s', cursor: 'pointer', appearance: 'none',
                ...style
            }}
            onFocus={e => { e.currentTarget.style.borderColor = T.amber; }}
            onBlur={e => { e.currentTarget.style.borderColor = T.glassBorder; }}
            {...props}
        >
            {options.map(opt => <option key={opt.value} value={opt.value} style={{ background: T.panel }}>{opt.label}</option>)}
        </select>
    </div>
);

export const Progress = ({ value, max = 100, color = T.blue, height = 10, style, animated }) => (
    <div style={{ width: '100%', height, background: 'rgba(255,255,255,0.05)', borderRadius: height / 2, overflow: 'hidden', ...style }}>
        <div style={{
            width: `${Math.min(100, (value / max) * 100)}%`, height: '100%',
            background: animated ? `linear-gradient(90deg, ${color}, ${color}cc, ${color})` : color,
            backgroundSize: animated ? '200% 100%' : undefined,
            animation: animated ? 'scanLine 1.5s linear infinite' : undefined,
            borderRadius: height / 2,
            transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
            boxShadow: `0 0 8px ${color}66`
        }} />
    </div>
);

export const ScoreRing = ({ score, size = 60, color }) => {
    const c = color || (score >= 85 ? T.green : score >= 65 ? T.blue : score >= 40 ? T.amber : T.red);
    const r = (size / 2) - 5;
    const circ = 2 * Math.PI * r;
    const dash = (score / 100) * circ;
    return (
        <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
            <svg viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)', width: size, height: size }}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.border} strokeWidth={4.5} />
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={c} strokeWidth={4.5}
                    strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 0.9s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 4px ${c}88)` }} />
            </svg>
            <div style={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                fontSize: size < 50 ? 10 : 12, fontWeight: 900, color: c, lineHeight: 1
            }}>
                {score}<span style={{ fontSize: size < 50 ? 7 : 9, opacity: 0.7 }}>%</span>
            </div>
        </div>
    );
};

export const Tabs = ({ children, defaultValue, className, onValueChange }) => {
    const [active, setActive] = React.useState(defaultValue);
    const handleSet = (v) => { setActive(v); onValueChange?.(v); };
    return (
        <div className={className}>
            {React.Children.map(children, child => {
                if (child?.type === TabsList || child?.type === TabsContent) {
                    return React.cloneElement(child, { active, setActive: handleSet });
                }
                return child;
            })}
        </div>
    );
};

export const TabsList = ({ children, active, setActive, style }) => (
    <div style={{ display: 'flex', borderBottom: `1px solid ${T.glassBorder}`, marginBottom: 20, gap: 2, ...style }}>
        {React.Children.map(children, child => React.cloneElement(child, { active, setActive }))}
    </div>
);

export const TabsTrigger = ({ children, value, active, setActive, style }) => (
    <button
        onClick={() => setActive(value)}
        style={{
            padding: '11px 20px', background: active === value ? `${T.amber}10` : 'none',
            border: 'none', borderBottom: `2px solid ${active === value ? T.amber : 'transparent'}`,
            color: active === value ? T.text : T.sub, cursor: 'pointer',
            fontSize: 13, fontWeight: active === value ? 700 : 500,
            transition: 'all 0.2s', borderRadius: '8px 8px 0 0',
            ...style
        }}
    >
        {children}
    </button>
);

export const TabsContent = ({ children, value, active }) =>
    active === value ? <div className="animate-in">{children}</div> : null;

export const Stat = ({ label, value, color = T.amber, size = 'md', style }) => (
    <div style={style}>
        <div style={{ fontSize: 10, color: T.sub, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase' }}>{label}</div>
        <div style={{ fontSize: size === 'lg' ? 32 : 22, fontWeight: 900, color, marginTop: 3, letterSpacing: '-0.03em', fontFamily: 'Outfit, sans-serif' }}>{value}</div>
    </div>
);

export const MiniBar = ({ values = [], colors = [], height = 6 }) => (
    <div style={{ display: 'flex', width: '100%', height, background: 'rgba(255,255,255,0.05)', borderRadius: height / 2, overflow: 'hidden' }}>
        {values.map((v, i) => (
            <div key={i} style={{ width: `${v}%`, height: '100%', background: colors[i] || T.blue, transition: 'width 0.5s ease' }} />
        ))}
    </div>
);

const ICON_MAP = {
    chart: '📊', rocket: '🚀', shield: '🛡️', bolt: '⚡', cog: '⚙️',
    user: '👤', search: '🔍', check: '✓', alert: '⚠️', info: 'ℹ️',
    briefcase: '💼', globe: '🌍', target: '🎯', trending: '📈'
};

export const Icon = ({ name, size = 16, style }) => (
    <span style={{ fontSize: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...style }}>
        {ICON_MAP[name] || '❓'}
    </span>
);

export const Modal = ({ title, children, onClose }) => (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20, animation: 'fadeIn 0.2s' }}>
        <Card style={{ maxWidth: 640, width: '100%', maxHeight: '90vh', overflow: 'auto', position: 'relative', borderTop: `3px solid ${T.amber}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, fontFamily: 'Outfit' }}>{title}</h2>
                <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.glassBorder}`, color: T.sub, cursor: 'pointer', fontSize: 16, borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>✕</button>
            </div>
            {children}
        </Card>
    </div>
);

export const TrackBtn = ({ onTrack, defaultLabel = '+ Track', label }) => {
    const [state, setState] = React.useState('idle'); // idle | success
    const lbl = label || defaultLabel;
    return (
        <Btn
            size="sm"
            variant={state === 'success' ? 'success' : 'ghost'}
            style={{
                animation: state === 'success' ? 'trackPop 0.35s ease' : 'none',
                border: state === 'idle' ? `1px dashed ${T.glassBorder}` : 'none',
                minWidth: 80
            }}
            onClick={() => { if (state === 'idle') { onTrack(); setState('success'); } }}
            disabled={state === 'success'}
        >
            {state === 'success' ? '✓ Tracked' : lbl}
        </Btn>
    );
};

export const Empty = ({ icon, title, sub, action, onAction }) => (
    <div style={{ padding: '56px 20px', textAlign: 'center', color: T.mute, animation: 'fadeIn 0.4s' }}>
        <div style={{ fontSize: 52, marginBottom: 16, opacity: 0.4, filter: 'grayscale(0.3)' }}>{icon}</div>
        <h3 style={{ fontSize: 17, color: T.sub, margin: '0 0 8px', fontWeight: 700, fontFamily: 'Outfit' }}>{title}</h3>
        <p style={{ fontSize: 13, margin: '0 0 20px', color: T.mute, lineHeight: 1.6, maxWidth: 380, marginLeft: 'auto', marginRight: 'auto' }}>{sub}</p>
        {action && onAction && (
            <Btn variant="primary" size="sm" onClick={onAction}>{action}</Btn>
        )}
    </div>
);

export const SkeletonCard = ({ lines = 3, style }) => (
    <Card style={{ padding: 18, overflow: 'hidden', ...style }}>
        {[...Array(lines)].map((_, i) => (
            <div key={i} style={{
                height: i === 0 ? 16 : 11,
                borderRadius: 7, marginBottom: 10,
                width: i === 0 ? '45%' : i === 1 ? '100%' : i === lines - 1 ? '65%' : '100%',
                background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 100%)',
                backgroundSize: '400px 100%',
                animation: 'shimmer 1.6s ease-in-out infinite',
                animationDelay: `${i * 0.1}s`
            }} />
        ))}
    </Card>
);

export const TextArea = ({ label, style, dictate, value, onChange, ...props }) => {
    const { isListening, toggle } = useSpeechRecognition((transcript) => {
        if (onChange) {
            const currentVal = value || '';
            const space = currentVal.length > 0 && !currentVal.endsWith(' ') && !currentVal.endsWith('\n') ? ' ' : '';
            onChange({ target: { value: currentVal + space + transcript } });
        }
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', marginBottom: 12, position: 'relative' }}>
            {label && <label style={{ fontSize: 11, color: T.sub, fontWeight: 700, letterSpacing: 0.5 }}>{label}</label>}
            <textarea
                value={value}
                onChange={onChange}
                style={{
                    padding: '11px 15px', paddingRight: dictate ? 40 : 15, background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${T.glassBorder}`,
                    borderRadius: 10, color: T.text, fontSize: 14, outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s', minHeight: 100,
                    resize: 'vertical', fontFamily: 'inherit', ...style
                }}
                onFocus={e => { e.currentTarget.style.borderColor = T.amber; e.currentTarget.style.boxShadow = `0 0 0 3px ${T.amber}18`; }}
                onBlur={e => { e.currentTarget.style.borderColor = T.glassBorder; e.currentTarget.style.boxShadow = 'none'; }}
                {...props}
            />
            {dictate && (
                <button type="button" onClick={toggle} title="Dictate" style={{
                    position: 'absolute', right: 8, top: 28, background: 'transparent', border: 'none',
                    color: isListening ? T.red : T.mute, cursor: 'pointer', fontSize: 16,
                    animation: isListening ? 'pulseRing 1.5s infinite' : 'none', borderRadius: '50%',
                    padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    {isListening ? "🔴" : "🎤"}
                </button>
            )}
        </div>
    );
};

export const MagicBtn = ({ onClick, loading, label = 'Magic Draft', style }) => (
    <button
        onClick={onClick}
        disabled={loading}
        style={{
            padding: '7px 14px', borderRadius: 9, border: 'none',
            background: `linear-gradient(135deg, ${T.purple} 0%, ${T.blue} 100%)`,
            color: 'white', fontSize: 11, fontWeight: 800, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, opacity: loading ? 0.6 : 1,
            boxShadow: '0 4px 16px rgba(139,92,246,0.35)',
            transition: 'all 0.2s', ...style
        }}
        onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.12)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
        onMouseLeave={e => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'none'; }}
    >
        <span>{loading ? '✨ Processing...' : '✨ ' + label}</span>
    </button>
);

export const ScanProgress = ({ terms, currentTerm, done }) => (
    <div style={{ padding: 20, background: `${T.amber}08`, border: `1px solid ${T.amber}22`, borderRadius: 14, marginBottom: 20, animation: 'fadeIn 0.3s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: done ? T.green : T.amber, boxShadow: done ? `0 0 8px ${T.green}88` : '0 0 8px rgba(245,158,11,0.6)', animation: done ? 'none' : 'pulseRing 1.2s ease infinite' }} />
            <span style={{ fontSize: 12, fontWeight: 800, color: done ? T.green : T.amber, letterSpacing: 0.5 }}>
                {done ? '✓ SCAN COMPLETE' : `SCANNING: ${currentTerm?.toUpperCase()}`}
            </span>
        </div>
        <Progress value={done ? 100 : terms.indexOf(currentTerm) >= 0 ? ((terms.indexOf(currentTerm)) / terms.length) * 100 : 0} color={done ? T.green : T.amber} height={5} animated={!done} />
        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            {terms.map((t, i) => {
                const idx = terms.indexOf(currentTerm);
                const isDone = done || i < idx;
                const isActive = !done && t === currentTerm;
                return (
                    <span key={t} style={{
                        fontSize: 10, padding: '2px 8px', borderRadius: 6, fontWeight: 700,
                        background: isDone ? `${T.green}18` : isActive ? `${T.amber}18` : 'rgba(255,255,255,0.03)',
                        color: isDone ? T.green : isActive ? T.amber : T.mute,
                        border: `1px solid ${isDone ? T.green + '30' : isActive ? T.amber + '30' : T.glassBorder}`,
                        transition: 'all 0.3s'
                    }}>
                        {isDone ? '✓' : isActive ? '⏳' : '○'} {t}
                    </span>
                );
            })}
        </div>
    </div>
);
