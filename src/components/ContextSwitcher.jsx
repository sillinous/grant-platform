import React, { useState } from 'react';
import { useOrganization } from '../context/OrganizationContext.jsx';
import { T } from '../globals';
import { Btn, Card } from '../ui';

export const ContextSwitcher = () => {
    const { activeContext, userOrgs, switchContext } = useOrganization();
    const [isOpen, setIsOpen] = useState(false);

    const currentName = activeContext === "personal" ? "Travis SCp" : activeContext.name;
    const currentType = activeContext === "personal" ? "Personal Account" : 
        activeContext.type === 'edc' ? 'Economic Dev Corp' : 
        activeContext.type === 'government' ? 'Government Entity' : 'Non-Profit';

    const getIcon = (type) => {
        if (type === 'personal') return '👤';
        if (type === 'edc') return '🏙️';
        if (type === 'government') return '🏛️';
        if (type === 'non_profit') return '💝';
        return '🏢';
    };

    return (
        <div style={{ position: 'relative', marginBottom: 20 }}>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12,
                    padding: 12, display: 'flex', alignItems: 'center', gap: 12,
                    cursor: 'pointer', transition: 'all 0.2s',
                    boxShadow: isOpen ? `0 0 0 2px ${T.blue}44` : 'none'
                }}
            >
                <div style={{ 
                    width: 36, height: 36, borderRadius: 8, background: activeContext === "personal" ? T.dim : `${T.blue}22`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
                }}>
                    {activeContext === "personal" ? '👤' : getIcon(activeContext.type)}
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{currentName}</div>
                    <div style={{ fontSize: 11, color: T.sub }}>{currentType}</div>
                </div>
                <div style={{ fontSize: 12, color: T.sub }}>▼</div>
            </div>

            {isOpen && (
                <div style={{
                    position: 'absolute', top: '110%', left: 0, right: 0,
                    background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12,
                    zIndex: 100, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                }}>
                    <div style={{ padding: 8, fontSize: 10, fontWeight: 700, color: T.sub, textTransform: 'uppercase', background: T.dim }}>
                        Switch Context
                    </div>
                    
                    <div 
                        onClick={() => { switchContext("personal"); setIsOpen(false); }}
                        style={{ 
                            padding: "10px 12px", display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                            background: activeContext === "personal" ? `${T.blue}11` : 'transparent',
                            color: activeContext === "personal" ? T.blue : T.text
                        }}
                    >
                        <span>👤</span>
                        <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>Travis SCp</div>
                    </div>

                    <div style={{ height: 1, background: T.border, margin: "4px 0" }} />

                    {userOrgs.map(org => (
                        <div 
                            key={org.id}
                            onClick={() => { switchContext(org.id); setIsOpen(false); }}
                            style={{ 
                                padding: "10px 12px", display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                                background: activeContext.id === org.id ? `${T.blue}11` : 'transparent',
                                color: activeContext.id === org.id ? T.blue : T.text
                            }}
                        >
                            <span>{getIcon(org.type)}</span>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>{org.name}</div>
                                <div style={{ fontSize: 10, color: T.sub, textTransform: 'capitalize' }}>{org.type.replace('_', ' ')}</div>
                            </div>
                        </div>
                    ))}

                    <div style={{ padding: 8, borderTop: `1px solid ${T.border}` }}>
                        <Btn size="sm" block variant="ghost" style={{ fontSize: 12 }}>+ Create New Organization</Btn>
                    </div>
                </div>
            )}
        </div>
    );
};
