import React from 'react';
import { useOrganization } from '../context/OrganizationContext.jsx';
import { T, PROFILE } from '../globals';
import { Card, Btn, Input, Badge, Progress, Stat } from '../ui';
import { useStore } from '../store';

export const OrgProfile = () => {
    const { activeContext, isPersonal } = useOrganization();
    const { alliances = [] } = useStore();


    if (isPersonal) return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 40 }}>
            <div style={{ background: `linear-gradient(135deg, ${T.panel}, ${T.bg})`, border: `1px solid ${T.border}`, borderRadius: 16, padding: 32, display: "flex", alignItems: "center", gap: 24 }}>
                <div style={{ width: 80, height: 80, borderRadius: 20, background: T.amber, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, boxShadow: `0 10px 30px ${T.amber}44` }}>
                    🏢
                </div>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, color: T.text, margin: 0, marginBottom: 8 }}>{PROFILE.name || "Your Organization"}</h1>
                    <div style={{ display: "flex", gap: 12 }}>
                        <Badge color={T.amber}>PERSONAL WORKSPACE</Badge>
                        <Badge color={T.blue}>{PROFILE.loc || "Location TBD"}</Badge>
                    </div>
                </div>
                <Btn variant="outline" style={{ marginLeft: "auto" }} onClick={() => window.location.href = "/settings"}>⚙️ Edit in Settings</Btn>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    <Card>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 16 }}>Organization Profile</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                            <div>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>ORGANIZATION NAME</label>
                                <Input value={PROFILE.name || "—"} readOnly />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>LOCATION</label>
                                <Input value={PROFILE.loc || "—"} readOnly />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>RURAL STATUS</label>
                                <Input value={PROFILE.rural ? "Rural (Eligible)" : "Urban/Suburban"} readOnly />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>DISABILITY-OWNED</label>
                                <Input value={PROFILE.disabled ? "Yes (DBE Certified)" : "Not Specified"} readOnly />
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 16 }}>Strategic Focus Areas</h3>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {(PROFILE.focus || ["Technology", "Workforce", "Community"]).map((f, i) => (
                                <Badge key={i} color={T.blue}>{f}</Badge>
                            ))}
                        </div>
                    </Card>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    <Card style={{ background: `linear-gradient(to bottom, ${T.panel}, ${T.bg})` }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 8 }}>ORGANIZATION HEALTH</div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 24, fontWeight: 900, color: T.green }}>92%</span>
                            <span style={{ fontSize: 12, color: T.green }}>profile complete</span>
                        </div>
                        <Progress value={92} color={T.green} style={{ height: 6 }} />
                    </Card>
                    <Card>
                        <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 8 }}>IMPACT TARGETS</div>
                        <Stat label="Jobs Created" value={PROFILE.impactMetrics?.jobsCreated || "N/A"} color={T.green} size="sm" />
                        <div style={{ marginTop: 12 }}>
                            <Stat label="Demographic Focus" value={PROFILE.impactMetrics?.demographicFocus || "Broad"} color={T.blue} size="sm" />
                        </div>
                    </Card>
                    <Card>
                        <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 8 }}>STRATEGIC ALLIANCES ({alliances.length})</div>
                        {alliances.length === 0
                            ? <div style={{ fontSize: 12, color: T.mute, fontStyle: "italic" }}>No alliances tracked yet.</div>
                            : alliances.slice(0, 3).map(a => (
                                <div key={a.id} style={{ padding: "6px 8px", background: T.panel, borderRadius: 6, marginBottom: 4, fontSize: 12, color: T.text }}>{a.name}</div>
                            ))
                        }
                    </Card>
                </div>
            </div>
        </div>
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 40 }}>
            {/* Header / Banner */}
            <div style={{ 
                background: `linear-gradient(135deg, ${T.panel}, ${T.bg})`, border: `1px solid ${T.border}`, borderRadius: 16, padding: 32,
                display: "flex", alignItems: "center", gap: 24
            }}>
                <div style={{ 
                    width: 80, height: 80, borderRadius: 20, background: T.blue, color: "white", 
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, boxShadow: `0 10px 30px ${T.blue}44`
                }}>
                    {activeContext.type === 'edc' ? '🏙️' : activeContext.type === 'government' ? '🏛️' : '🏢'}
                </div>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, color: T.text, margin: 0, marginBottom: 8 }}>{activeContext.name}</h1>
                    <div style={{ display: "flex", gap: 12 }}>
                        <Badge variant="outline" style={{ borderColor: T.borderHi }}>
                            {activeContext.type === 'edc' ? 'Economic Development Corp' : activeContext.type.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <Badge color={T.green}>VERIFIED ENTITY</Badge>
                    </div>
                </div>
                <Btn variant="outline" style={{ marginLeft: "auto" }}>Edit Profile</Btn>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    <Card>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 16 }}>Organization Details</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                            <div>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>LEGAL NAME</label>
                                <Input value={activeContext.name} readOnly />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>ENTITY TYPE</label>
                                <Input value={activeContext.type.toUpperCase()} readOnly />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>EIN / TAX ID</label>
                                <Input value="12-3456789" readOnly />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>UEI (SAM.GOV)</label>
                                <Input value="Not Connected" readOnly style={{ color: T.sub, fontStyle: "italic" }} />
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 16 }}>Compliance & Certifications</h3>
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                            <div style={{ padding: "12px 16px", border: `1px solid ${T.border}`, borderRadius: 8, flex: 1, minWidth: 200 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 4 }}>FISCAL YEAR END</div>
                                <div style={{ fontSize: 14, color: T.text }}>June 30</div>
                            </div>
                            <div style={{ padding: "12px 16px", border: `1px solid ${T.border}`, borderRadius: 8, flex: 1, minWidth: 200 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 4 }}>LAST AUDIT</div>
                                <div style={{ fontSize: 14, color: T.green }}>Clean (2025)</div>
                            </div>
                            <div style={{ padding: "12px 16px", border: `1px solid ${T.border}`, borderRadius: 8, flex: 1, minWidth: 200 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 4 }}>INDIRECT COST RATE</div>
                                <div style={{ fontSize: 14, color: T.text }}>10% De Minimis</div>
                            </div>
                        </div>
                    </Card>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                     <Card>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 16 }}>Team Members</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.dim, display: "flex", alignItems: "center", justifyContent: "center" }}>👤</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Travis SCp</div>
                                    <div style={{ fontSize: 11, color: T.sub }}>Admin</div>
                                </div>
                                <span style={{ fontSize: 10, color: T.green }}>Active</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 12, opacity: 0.6 }}>
                                <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.dim, display: "flex", alignItems: "center", justifyContent: "center" }}>👩‍💼</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Sarah Compliance</div>
                                    <div style={{ fontSize: 11, color: T.sub }}>Reviewer</div>
                                </div>
                                <span style={{ fontSize: 10, color: T.sub }}>Invited</span>
                            </div>
                        </div>
                        <Btn size="sm" block variant="ghost" style={{ marginTop: 16 }}>+ Invite Member</Btn>
                    </Card>

                    <Card style={{ background: `linear-gradient(to bottom, ${T.panel}, ${T.bg})` }}>
                         <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 8 }}>ORGANIZATION HEALTH</div>
                         <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                             <span style={{ fontSize: 24, fontWeight: 900, color: T.green }}>98%</span>
                             <span style={{ fontSize: 12, color: T.green }}>setup complete</span>
                         </div>
                         <Progress value={98} color={T.green} style={{ height: 6 }} />
                    </Card>

                    {/* Meta-Model Injection: Strategic Impact & Alliances */}
                    <Card style={{ borderLeft: `4px solid ${T.purple}` }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 16 }}>🌍 Impact & Ecosystem</h3>
                        <div style={{ display: "grid", gap: 16 }}>
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 4 }}>MACRO IMPACT TARGETS</div>
                                <div style={{ display: "flex", gap: 12 }}>
                                    <Stat label="Jobs Created" value={PROFILE.impactMetrics?.jobsCreated || 0} color={T.green} size="sm" />
                                    <Stat label="Key Demographic" value={PROFILE.impactMetrics?.demographicFocus || "Broad"} color={T.blue} size="sm" />
                                </div>
                            </div>

                            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 8 }}>STRATEGIC ALLIANCES ({alliances.length})</div>
                                {alliances.length === 0 ? (
                                    <div style={{ fontSize: 12, color: T.mute, fontStyle: "italic" }}>No active JVs or alliances tracked in CRM yet.</div>
                                ) : (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                        {alliances.map(a => (
                                            <div key={a.id} style={{ padding: 8, background: T.panel, borderRadius: 6, display: "flex", justifyContent: "space-between" }}>
                                                <span style={{ fontSize: 13, color: T.text }}>{a.name}</span>
                                                <Badge size="xs" color={T.purple}>{a.activeJointGrants?.length || 0} Shared Pursuits</Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
