import React, { useState, useMemo } from 'react';
import { Card, Stat, Btn, Progress } from '../ui';
import { T, fmt } from '../globals';

export const StrategyModeler = ({ grants }) => {
    const pipeline = grants.filter(g => !["awarded", "declined"].includes(g.stage));
    
    // Default confidence per stage
    const STAGE_CONFIDENCE = {
        discovered: 0.1,
        researching: 0.2,
        qualifying: 0.4,
        preparing: 0.5,
        drafting: 0.6,
        reviewing: 0.7,
        submitted: 0.3, // Re-weighted lower until first feedback
        under_review: 0.5
    };

    const [multiplier, setMultiplier] = useState(1); // To global optimism
    
    const modeledValue = useMemo(() => {
        return pipeline.reduce((sum, g) => {
            const baseConf = STAGE_CONFIDENCE[g.stage] || 0.1;
            return sum + (g.amount * baseConf * multiplier);
        }, 0);
    }, [pipeline, multiplier]);

    const totalRawValue = pipeline.reduce((s, g) => s + (g.amount || 0), 0);
    const winRateSim = (modeledValue / (totalRawValue || 1)) * 100;

    return (
        <div style={{ animation: "fadeIn 0.5s ease-out" }}>
            <div style={{ marginBottom: 24 }}>
                <h3 style={{ color: T.text, fontSize: 18, margin: 0 }}>Strategic Forecast Modeler</h3>
                <p style={{ color: T.sub, fontSize: 13 }}>Adjust the Global Optimism slider to stress-test your pipeline yield.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 32 }}>
                <div style={{ display: "grid", gap: 20 }}>
                    <Card style={{ background: T.bg }}>
                        <Stat label="WIP Adjusted Capital" value={fmt(modeledValue)} color={T.amber} size="lg" />
                        <div style={{ fontSize: 11, color: T.sub, marginTop: 8 }}>
                            Based on {pipeline.length} pursuits at current maturity.
                        </div>
                    </Card>

                    <Card style={{ background: T.bg }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 12 }}>Global Optimism Multiplier</div>
                        <input 
                            type="range" min="0.5" max="2" step="0.1" 
                            value={multiplier} 
                            onChange={(e) => setMultiplier(parseFloat(e.target.value))}
                            style={{ width: "100%", accentColor: T.amber }}
                        />
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.mute, marginTop: 8 }}>
                            <span>Conservative (0.5x)</span>
                            <span style={{ color: T.amber, fontWeight: 800 }}>{multiplier}x</span>
                            <span>Aggressive (2.0x)</span>
                        </div>
                    </Card>
                </div>

                <Card style={{ background: T.panel }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 16 }}>Expected Pipeline Yield</div>
                    <div style={{ position: "relative", height: 180, display: "flex", alignItems: "flex-end", gap: 12, paddingBottom: 24 }}>
                        {/* Simple Bar Visualization */}
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                            <div style={{ width: "100%", height: "100%", background: T.border, borderRadius: 4, position: "relative", overflow: "hidden" }}>
                                <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: `100%`, background: T.blue + "44" }} />
                            </div>
                            <span style={{ fontSize: 10, color: T.sub }}>Raw Pipeline</span>
                        </div>
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                            <div style={{ width: "100%", height: "100%", background: T.border, borderRadius: 4, position: "relative", overflow: "hidden" }}>
                                <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: `${winRateSim}%`, background: T.amber, transition: "height 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }} />
                            </div>
                            <span style={{ fontSize: 10, color: T.amber }}>Modeled Yield</span>
                        </div>
                    </div>
                    
                    <div style={{ padding: 16, background: T.bg, borderRadius: 8, border: `1px solid ${T.border}` }}>
                        <div style={{ fontSize: 12, color: T.text, fontWeight: 600, marginBottom: 4 }}>AI Risk Assessment</div>
                        <p style={{ fontSize: 11, color: T.sub, margin: 0, lineHeight: 1.5 }}>
                            Your pipeline is heavily weighted in 'Under Review' for Federal grants. 
                            Increasing federal velocity by 12% would shift modeled yield to {fmt(modeledValue * 1.12)}.
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
};
