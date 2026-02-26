import React, { useState, useEffect } from 'react';
import { Card, Badge, Btn, SkeletonCard, Icon } from '../ui';
import { T, fmt, uid, PROFILE } from '../globals';
import { API } from '../api';
import { Sparkles, ArrowRight, Target, Zap } from 'lucide-react';

export const OpportunityConcierge = ({ onAdd }) => {
    const [briefing, setBriefing] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBriefing = async () => {
            setLoading(true);
            const data = await API.getDailyBriefing(PROFILE);
            setBriefing(data);
            setLoading(false);
        };
        fetchBriefing();
    }, []);

    if (loading) return <SkeletonCard lines={6} title="Synthesizing Daily Briefing..." />;

    return (
        <Card glow style={{ 
            background: `linear-gradient(165deg, ${T.panel}, ${T.indigo}08)`,
            border: `1px solid ${T.indigo}22`,
            padding: 24
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ padding: 8, background: `${T.indigo}15`, borderRadius: 10, color: T.indigo }}>
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: 18, fontWeight: 900, color: T.text, margin: 0, fontFamily: 'Outfit' }}>Opportunity Concierge</h2>
                        <div style={{ fontSize: 11, color: T.sub, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 }}>
                            Strategic Briefing • {new Date().toLocaleDateString()}
                        </div>
                    </div>
                </div>
                <Badge color={T.indigo} style={{ padding: '4px 12px', fontWeight: 800 }}>AI AGENT ACTIVE</Badge>
            </div>

            <div style={{ 
                fontSize: 14, 
                color: T.sub, 
                lineHeight: 1.6, 
                padding: 16, 
                background: 'rgba(255,255,255,0.02)', 
                borderRadius: 12, 
                borderLeft: `4px solid ${T.indigo}`,
                marginBottom: 24,
                fontStyle: 'italic'
            }}>
                "{briefing?.briefing || "Our intelligence engines are scanning 18+ global streams for your mission..."}"
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
                {(briefing?.matches || []).map((m, i) => (
                    <div key={m.id} style={{ 
                        padding: 16, 
                        background: 'rgba(255,255,255,0.03)', 
                        borderRadius: 12, 
                        border: `1px solid ${T.glassBorder}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'transform 0.2s',
                        cursor: 'default'
                    }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.01)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                        <div style={{ flex: 1, paddingRight: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <Badge color={m._sourceColor || T.blue} style={{ fontSize: 9 }}>{m._source}</Badge>
                                <div style={{ fontSize: 10, fontWeight: 800, color: T.green, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Target size={10} /> {m._score}% Alignment
                                </div>
                            </div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 4 }}>{m.title}</div>
                            <div style={{ fontSize: 11, color: T.mute }}>{m.agency} • {typeof m.amount === 'number' ? fmt(m.amount) : m.amount}</div>
                        </div>
                        <Btn variant="primary" size="sm" onClick={() => onAdd(m)} style={{ gap: 6 }}>
                            Track <ArrowRight size={14} />
                        </Btn>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>
                <div style={{ fontSize: 11, color: T.dim, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Zap size={12} /> Powered by Flagship AI & 18+ Intelligence Streams
                </div>
            </div>
        </Card>
    );
};
