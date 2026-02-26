import React, { useState } from 'react';
import { Card, Btn, Badge, T } from '../ui';
import { NarrativeWizard } from './NarrativeWizard';
import { AIDrafter } from './AIDrafter';
import { DocumentAssembler } from './DocumentAssembler';
import { UniversalApplication } from './UniversalApplication';
import { useStore } from '../store';

export const GrantWritingStudio = () => {
    const { grants } = useStore();
    const [activeTab, setActiveTab] = useState('brief');
    const [selectedOpportunity, setSelectedOpportunity] = useState(null);

    const TABS = [
        { id: 'brief', label: '1. The Brief', icon: '📝', desc: 'Guided Narrative Strategy', component: NarrativeWizard },
        { id: 'workbench', label: '2. The Workbench', icon: '🛠️', desc: 'AI-Powered Section Drafting', component: AIDrafter },
        { id: 'bindery', label: '3. The Bindery', icon: '📦', desc: 'Final Document Assembly', component: DocumentAssembler },
        { id: 'autopilot', label: '4. Auto-Pilot', icon: '⚡', desc: 'Autonomous Submissions', component: UniversalApplication },
    ];

    const currentTab = TABS.find(t => t.id === activeTab);

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 80px)", background: T.bg }}>
            {/* Header / Nav */}
            <div style={{ padding: "16px 24px", background: T.panel, borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: T.text, display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 24 }}>🖋️</span> UNIFIED GRANT WRITING STUDIO
                    </h1>
                    <div style={{ fontSize: 11, color: T.mute, marginTop: 4 }}>End-to-End Autonomous Application Lifecycle</div>
                </div>
                <div style={{ display: "flex", gap: 4, background: T.bg, padding: 4, borderRadius: 10, border: `1px solid ${T.border}` }}>
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: "8px 16px",
                                border: "none",
                                borderRadius: 8,
                                background: activeTab === tab.id ? T.blue : "transparent",
                                color: activeTab === tab.id ? "white" : T.mute,
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "0.2s",
                                display: "flex",
                                alignItems: "center",
                                gap: 8
                            }}
                        >
                            <span>{tab.icon}</span> {tab.label.split('. ')[1]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div style={{ flex: 1, display: "grid", gridTemplateColumns: "280px 1fr", overflow: "hidden" }}>
                {/* Unified Sidebar for Status & Global Settings */}
                <div style={{ borderRight: `1px solid ${T.border}`, background: T.panel, padding: 16, overflowY: "auto" }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: T.mute, letterSpacing: 1, marginBottom: 16 }}>WORKFLOW STATUS</div>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {TABS.map(tab => (
                            <div key={tab.id} style={{ 
                                padding: 12, borderRadius: 8, 
                                background: activeTab === tab.id ? `${T.blue}11` : "transparent",
                                border: `1px solid ${activeTab === tab.id ? `${T.blue}44` : "transparent"}`,
                                opacity: activeTab === tab.id ? 1 : 0.6
                            }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: activeTab === tab.id ? T.blue : T.text }}>{tab.label}</div>
                                <div style={{ fontSize: 10, color: T.sub, marginTop: 2 }}>{tab.desc}</div>
                                {activeTab === tab.id && <div style={{ fontSize: 9, color: T.blue, fontWeight: 900, marginTop: 8 }}>● CURRENT STEP</div>}
                            </div>
                        ))}
                    </div>

                    <hr style={{ border: "none", borderTop: `1px solid ${T.border}`, margin: "24px 0" }} />
                    
                    <div style={{ fontSize: 10, fontWeight: 800, color: T.mute, letterSpacing: 1, marginBottom: 12 }}>GLOBAL OPPORTUNITY TARGET</div>
                    <Card style={{ padding: 12, background: T.bg }}>
                        <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>Select a grant to anchor this entire session's context.</div>
                        <select 
                            style={{ width: "100%", background: T.panel, color: T.text, border: `1px solid ${T.border}`, borderRadius: 4, padding: 6, fontSize: 12 }}
                            value={selectedOpportunity?.id || ""}
                            onChange={(e) => {
                                const g = grants.find(g => g.id === e.target.value);
                                setSelectedOpportunity(g);
                            }}
                        >
                            <option value="">No Active Target</option>
                            {grants.map(g => (
                                <option key={g.id} value={g.id}>{g.title?.slice(0, 30)}...</option>
                            ))}
                        </select>
                        {selectedOpportunity && (
                            <div style={{ marginTop: 12 }}>
                                <Badge color={T.green} style={{ fontSize: 9 }}>{selectedOpportunity.agency}</Badge>
                                <div style={{ fontSize: 10, color: T.sub, marginTop: 4 }}>Deadline: {selectedOpportunity.deadline || "TBD"}</div>
                            </div>
                        )}
                    </Card>

                    <div style={{ marginTop: 40, padding: 16, background: `${T.purple}08`, borderRadius: 12, border: `1px dashed ${T.purple}33` }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: T.purple, marginBottom: 8 }}>STUDIO INTELLIGENCE</div>
                        <div style={{ fontSize: 10, color: T.sub, lineHeight: 1.5 }}>
                            Your studio is leveraging the **Meta-Model**. All narratives, compliance audits, and budgets are auto-synced to your organization's alliances and contacts.
                        </div>
                    </div>
                </div>

                {/* Sub-Component Render Area */}
                <div style={{ overflowY: "auto", padding: 24, background: T.bg }}>
                    {activeTab === 'autopilot' ? (
                        <UniversalApplication opportunity={selectedOpportunity} onClose={() => setActiveTab('bindery')} />
                    ) : (
                        <currentTab.component />
                    )}
                </div>
            </div>
        </div>
    );
};
