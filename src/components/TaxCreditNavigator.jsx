import React, { useState } from "react";
import { T, PROFILE, uid } from "../globals";
import { Card, Btn, Badge, Empty, Stat, Progress, TrackBtn } from "../ui";

export const TaxCreditNavigator = ({ onAdd }) => {
    const [loading, setLoading] = useState(false);
    const [hasCalculated, setHasCalculated] = useState(false);

    const credits = [
        {
            id: uid(),
            title: "Research & Development (R&D) Tax Credit",
            agency: "Internal Revenue Service (IRS)",
            amount: "Up to $250k/year",
            match: 85,
            description: "Federal tax credit for companies that incur R&D costs in the US. Ideal for technology firms and software development.",
            criteria: "Developing or improving a product, process, or software.",
            isState: false
        },
        {
            id: uid(),
            title: "Work Opportunity Tax Credit (WOTC)",
            agency: "Department of Labor / IRS",
            amount: "Up to $9,600/hire",
            match: 90,
            description: "Federal tax credit available to employers for hiring individuals from certain targeted groups who have consistently faced significant barriers to employment.",
            criteria: "Hiring veterans, ex-felons, or long-term unemployment recipients.",
            isState: false
        },
        {
            id: uid(),
            title: "State Economic Development & Job Creation Credit",
            agency: "State Department of Revenue",
            amount: "Variable by State",
            match: 75,
            description: "State-level credits for creating new full-time jobs or making significant capital investments within designated economic development zones.",
            criteria: "Net new job creation in the designated state.",
            isState: true
        }
    ];

    const [scanProgress, setScanProgress] = useState(0);
    const [scanText, setScanText] = useState("");

    const calculateEligibility = () => {
        setLoading(true);
        setScanProgress(10);
        setScanText("Parsing NAICS codes...");
        setTimeout(() => {
            setScanProgress(45);
            setScanText("Querying Federal Database...");
        }, 500);
        setTimeout(() => {
            setScanProgress(80);
            setScanText("Checking State Incentives...");
        }, 1000);
        setTimeout(() => {
            setHasCalculated(true);
            setLoading(false);
        }, 1500);
    };

    return (
        <div style={{ animation: "fadeIn 0.4s" }}>
            <Card style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
                    <div style={{ fontSize: 24, padding: "8px", background: `${T.green}11`, borderRadius: "8px" }}>💸</div>
                    <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>Tax Credit Navigator</div>
                        <div style={{ fontSize: 13, color: T.sub, marginTop: 4 }}>Discover non-dilutive capital through federal and state tax incentives based on your operations.</div>
                    </div>
                </div>

                {!hasCalculated ? (
                    <div style={{ textAlign: "center", padding: "24px 0" }}>
                        {!loading ? (
                            <>
                                <Btn variant="primary" size="lg" onClick={calculateEligibility}>
                                    🔍 Scan Profile for Tax Credit Eligibility
                                </Btn>
                                <div style={{ fontSize: 11, color: T.mute, marginTop: 12 }}>
                                    We will analyze your NAICS code ({PROFILE.naics || "Not set"}), location, and business focus to identify missing tax credits.
                                </div>
                            </>
                        ) : (
                            <div style={{ maxWidth: 400, margin: "0 auto" }}>
                                <div style={{ fontSize: 13, color: T.amber, fontWeight: 700, marginBottom: 8 }}>{scanText}</div>
                                <Progress value={scanProgress} max={100} color={T.amber} height={8} />
                            </div>
                        )}
                    </div>
                ) : (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 16, borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
                            <div style={{ display: "flex", gap: 16 }}>
                                <Stat label="Eligible Credits Found" value="3" color={T.green} />
                                <Stat label="Est. Total Claim Value" value="~$350,000" color={T.amber} />
                            </div>
                            <Btn variant="ghost" size="sm" onClick={() => { setHasCalculated(false); setScanProgress(0); }}>⚙️ Recalculate</Btn>
                    </div>
                )}
            </Card>

            {hasCalculated && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: T.mute, letterSpacing: 1.2, marginBottom: 4, paddingLeft: 4, textTransform: "uppercase" }}>Top Matched Tax Credits</div>

                    {credits.map(c => (
                        <Card key={c.id} style={{ borderLeft: `3px solid ${c.isState ? T.blue : T.purple}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                        <Badge color={c.match > 80 ? T.green : T.amber}>{c.match}% Match</Badge>
                                        <Badge color={c.isState ? T.blue : T.purple}>{c.isState ? "State Credit" : "Federal Credit"}</Badge>
                                    </div>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 4 }}>{c.title}</div>
                                    <div style={{ fontSize: 12, color: T.sub }}>{c.agency}</div>
                                </div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: T.green, background: `${T.green}11`, padding: "6px 12px", borderRadius: "16px" }}>
                                    {c.amount}
                                </div>
                            </div>

                            <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.6, marginBottom: 12 }}>{c.description}</div>

                            <div style={{ fontSize: 12, color: T.text, background: T.panel, padding: "10px 12px", borderRadius: "6px", marginBottom: 16, borderLeft: `2px solid ${T.border}` }}>
                                <b style={{ color: T.mute, marginRight: 6 }}>Key Eligibility Criteria:</b> {c.criteria}
                            </div>

                            <div style={{ display: "flex", gap: 10, borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
                                {onAdd && (
                                    <TrackBtn onTrack={() => onAdd({
                                        id: uid(), title: c.title, agency: c.agency, stage: "discovered", description: c.description, category: "Tax Credit", tags: ["tax-credit", c.isState ? "state" : "federal"]
                                    })} defaultLabel="📋 Track Credit" />
                                )}
                                <Btn size="sm" variant="ghost">📄 IRS Form / Guidelines</Btn>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};
