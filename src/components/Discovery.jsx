import React, { useState } from 'react';
import { Card, Badge, Btn, Tabs, Input } from '../ui';
import { T, uid } from '../globals';
import { API } from '../api';
import { useStore } from '../store';
import { Globe, Map, Target, Shield, Cpu, Zap, DollarSign, Bookmark, TrendingUp, Search } from 'lucide-react';

// Sub-components
import { GovContractRadar } from "./GovContractRadar";
import { TaxCreditNavigator } from "./TaxCreditNavigator";
import { EarmarkScout } from "./EarmarkScout";
import { PhilanthropyPulse } from "./PhilanthropyPulse";
import { SynergyEngine } from "./SynergyEngine";
import { PolicySentinel } from "./PolicySentinel";
import { SurplusSentinel } from "./SurplusSentinel";
import { SubGrantRadar } from "./SubGrantRadar";
import { FoundationScout990 } from "./FoundationScout990";
import { DAFSignal } from "./DAFSignal";
import { PRINavigator } from "./PRINavigator";
import { CyPresScout } from "./CyPresScout";
import { DAOMap } from "./DAOMap";
import { CSRAllianceMapper } from "./CSRAllianceMapper";
import { GivingCircleScout } from "./GivingCircleScout";
import { UnsolicitedProspector } from "./UnsolicitedProspector";
import { ChamberPulse } from "./ChamberPulse";
import { FaithFunder } from "./FaithFunder";
import { CBALedger } from "./CBALedger";
import { InKindVault } from "./InKindVault";
import { RegionalPulse } from "./RegionalPulse";
import { FamilyOfficeProspector } from "./FamilyOfficeProspector";
import { PeerProspecting } from "./PeerProspecting";
import { LegislativeTracker } from "./LegislativeTracker";
import { MatchAlerts } from "./MatchAlerts";

export const Discovery = () => {
    const [tab, setTab] = useState("grants");
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const { addGrant } = useStore();

    const onAdd = (grant) => {
        addGrant(grant);
        alert(`Successfully tracked: ${grant.title}`);
    };

    const handleSearch = async () => {
        setLoading(true);
        let res = [];
        if (tab === "grants") {
            const data = await API.searchGrants(query);
            res = data.oppHits || [];
        } else if (tab === "state") {
            res = await API.searchStateGrants(query, "IL");
        }
        setResults(res);
        setLoading(false);
    };

    return (
        <div className="discovery-hub animate-in">
            <header style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 32, fontWeight: 900, color: T.text, margin: 0, letterSpacing: "-0.04em", fontFamily: "Outfit" }}>Discovery Hub</h1>
                <p style={{ color: T.sub, marginTop: 4, fontSize: 15 }}>Global funding intelligence & strategic opportunity mapping.</p>
            </header>

            <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
                <div style={{ flex: 1, position: "relative" }}>
                    <Search style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 18, height: 18, color: T.mute }} />
                    <Input
                        value={query}
                        onChange={(val) => setQuery(val)}
                        placeholder="Search for grants, contracts, or philanthropic signals..."
                        style={{ paddingLeft: 44, height: 48, borderRadius: 12, border: `1px solid ${T.glassBorder}`, background: T.glassLg }}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    />
                </div>
                <Btn variant="primary" style={{ padding: "0 28px", height: 48, borderRadius: 12 }} onClick={handleSearch} disabled={loading}>
                    {loading ? "Discovering..." : "Discover Opportunities"}
                </Btn>
            </div>

            <Tabs value={tab} onValueChange={setTab} className="w-full">
                <div className="flex overflow-x-auto pb-2 gap-2 border-b border-white/5 scrollbar-hide">
                    {[
                        { id: "grants", label: "Federal Grants", icon: <Globe className="w-4 h-4" /> },
                        { id: "state", label: "State & Local", icon: <Map className="w-4 h-4" /> },
                        { id: "philanthropy", label: "Philanthropy", icon: <DollarSign className="w-4 h-4" /> },
                        { id: "regional", label: "Regional/Local", icon: <Target className="w-4 h-4" /> },
                        { id: "contracts", label: "Contracts", icon: <Shield className="w-4 h-4" /> },
                        { id: "tax_credits", label: "Tax Credits", icon: <TrendingUp className="w-4 h-4" /> },
                        { id: "earmarks", label: "Earmarks", icon: <Bookmark className="w-4 h-4" /> },
                        { id: "foresight", label: "Strategic Foresight", icon: <Cpu className="w-4 h-4" /> },
                        { id: "alerts", label: "Match Alerts", icon: <Zap className="w-4 h-4" /> },
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            style={{ transition: "all 0.2s" }}
                            className={`px-4 py-3 flex items-center gap-2 whitespace-nowrap text-sm border-b-2 ${tab === t.id ? "border-amber-500 text-amber-500 bg-white/5" : "border-transparent text-gray-500 hover:text-gray-300"}`}
                        >
                            {t.icon}
                            {t.label}
                        </button>
                    ))}
                </div>

                <div style={{ marginTop: 32 }}>
                    {tab === "grants" && (
                        <div className="space-y-4">
                            {results.length === 0 && !loading && <Card style={{ textAlign: "center", padding: 60 }}><p style={{ color: T.mute }}>Enter a query to discover federal grants from Grants.gov</p></Card>}
                            {results.map(g => (
                                <Card key={g.id} glow style={{ marginBottom: 12 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <div style={{ flex: 1 }}>
                                            <Badge color={T.blue}>{g.agency}</Badge>
                                            <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 8 }}>{g.title}</h3>
                                            <p style={{ color: T.sub, fontSize: 14 }}>{g.description?.slice(0, 200)}...</p>
                                        </div>
                                        <div style={{ textAlign: "right", minWidth: 150 }}>
                                            <div style={{ fontSize: 20, fontWeight: 800, color: T.green }}>{typeof g.amount === 'number' ? `$${g.amount.toLocaleString()}` : g.amount}</div>
                                            <div style={{ color: T.mute, fontSize: 12 }}>Deadline: {g.deadline}</div>
                                            <Btn variant="primary" style={{ marginTop: 12 }} onClick={() => onAdd(g)}>Track Grant</Btn>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}

                    {tab === "state" && (
                        <div className="space-y-4">
                            {results.length === 0 && !loading && <Card style={{ textAlign: "center", padding: 60 }}><p style={{ color: T.mute }}>Searching state portals...</p></Card>}
                            {results.map(g => (
                                <Card key={g.id} style={{ marginBottom: 12 }}>
                                    <Badge color={T.purple}>{g.agency}</Badge>
                                    <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>{g.title}</h3>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                                        <span style={{ fontWeight: 600, color: T.green }}>${g.amount?.toLocaleString()}</span>
                                        <Btn size="sm" onClick={() => onAdd(g)}>Track Opportunity</Btn>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}

                    {tab === "regional" && (
                        <div className="space-y-8">
                            <RegionalPulse onAdd={onAdd} />
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <ChamberPulse onAdd={onAdd} />
                                <FaithFunder onAdd={onAdd} />
                                <CBALedger onAdd={onAdd} />
                                <InKindVault onAdd={onAdd} />
                                <SurplusSentinel onAdd={onAdd} />
                            </div>
                        </div>
                    )}

                    {tab === "contracts" && <GovContractRadar onAdd={onAdd} />}
                    {tab === "tax_credits" && <TaxCreditNavigator onAdd={onAdd} />}
                    {tab === "earmarks" && <EarmarkScout onAdd={onAdd} />}

                    {tab === "philanthropy" && (
                        <div className="space-y-8">
                            <PhilanthropyPulse onAdd={onAdd} />
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <FoundationScout990 onAdd={onAdd} />
                                <FamilyOfficeProspector onAdd={onAdd} />
                                <PeerProspecting onAdd={onAdd} />
                                <DAFSignal onAdd={onAdd} />
                                <PRINavigator onAdd={onAdd} />
                                <CyPresScout onAdd={onAdd} />
                                <GivingCircleScout onAdd={onAdd} />
                                <DAOMap onAdd={onAdd} />
                                <CSRAllianceMapper onAdd={onAdd} />
                                <UnsolicitedProspector onAdd={onAdd} />
                            </div>
                        </div>
                    )}

                    {tab === "alerts" && <MatchAlerts onAdd={onAdd} />}

                    {tab === "foresight" && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <LegislativeTracker onAdd={onAdd} />
                            <PolicySentinel onAdd={onAdd} />
                            <SynergyEngine onAdd={onAdd} />
                            <SubGrantRadar onAdd={onAdd} />
                        </div>
                    )}
                </div>
            </Tabs>
        </div>
    );
};

export default Discovery;
