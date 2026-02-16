import React, { useState, useMemo } from 'react';
import { Card, Badge, Button, T } from './ui';
import { fmt } from '../globals';

export const ScenarioModeler = ({ grants = [] }) => {
    const [selectedGrants, setSelectedGrants] = useState([]);
    const [scenarios, setScenarios] = useState(1000);

    const activeGrants = useMemo(() => 
        grants.filter(g => selectedGrants.includes(g.id)),
        [grants, selectedGrants]
    );

    const simulation = useMemo(() => {
        if (activeGrants.length === 0) return null;

        const results = [];
        for (let i = 0; i < scenarios; i++) {
            let totalWinValue = 0;
            let burnRate = 0;
            
            activeGrants.forEach(g => {
                // Monte Carlo: Simulate win probability (default 30% if not specified)
                const prob = g.winProbability || 0.3;
                if (Math.random() < prob) {
                    totalWinValue += g.amount || 0;
                    burnRate += (g.amount || 0) / 12; // Simplified monthly burn
                }
            });
            results.push({ totalWinValue, burnRate });
        }

        const avgWinValue = results.reduce((a, b) => a + b.totalWinValue, 0) / scenarios;
        const avgBurn = results.reduce((a, b) => a + b.burnRate, 0) / scenarios;
        const maxBurn = Math.max(...results.map(r => r.burnRate));
        
        // Confidence Intervals
        const sortedBurn = results.map(r => r.burnRate).sort((a, b) => a - b);
        const p95Burn = sortedBurn[Math.floor(scenarios * 0.95)];

        return { avgWinValue, avgBurn, maxBurn, p95Burn };
    }, [activeGrants, scenarios]);

    const toggleGrant = (id) => {
        setSelectedGrants(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    return (
        <Card title="🎲 Multi-Grant Scenario Modeler (Monte Carlo)" icon="📊">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 20 }}>
                {/* Left: Selector */}
                <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.blue, marginBottom: 12 }}>Select Grants for Scenario</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {grants.map(g => (
                            <div 
                                key={g.id}
                                onClick={() => toggleGrant(g.id)}
                                style={{ 
                                    padding: '12px', 
                                    background: selectedGrants.includes(g.id) ? `${T.blue}15` : T.card,
                                    border: `1px solid ${selectedGrants.includes(g.id) ? T.blue : T.border}`,
                                    borderRadius: 8,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontWeight: 600, fontSize: 13 }}>{g.title}</div>
                                    <Badge color={T.blue}>{fmt(g.amount)}</Badge>
                                </div>
                                <div style={{ fontSize: 11, color: T.mute, marginTop: 4 }}>
                                    Win Prob: {Math.round((g.winProbability || 0.3) * 100)}% | Est. Duration: 12 months
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Results */}
                <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.blue, marginBottom: 12 }}>Simulation Results ({scenarios} runs)</div>
                    {simulation ? (
                        <div style={{ background: `${T.blue}08`, padding: 16, borderRadius: 12, border: `1px solid ${T.blue}22` }}>
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: 11, color: T.mute }}>Expected Portfolio Value</div>
                                <div style={{ fontSize: 24, fontWeight: 800, color: T.text }}>{fmt(simulation.avgWinValue)}</div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                                <div style={{ background: T.card, padding: 12, borderRadius: 8 }}>
                                    <div style={{ fontSize: 10, color: T.mute }}>Avg Monthly Burn</div>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: T.green }}>{fmt(simulation.avgBurn)}</div>
                                </div>
                                <div style={{ background: T.card, padding: 12, borderRadius: 8 }}>
                                    <div style={{ fontSize: 10, color: T.mute }}>P95 "Stress" Burn</div>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: T.red }}>{fmt(simulation.p95Burn)}</div>
                                </div>
                            </div>

                            <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.5, background: `${T.blue}10`, padding: 10, borderRadius: 6 }}>
                                💡 **Personnel Insight**: At P95 confidence, this scenario requires a surge of **{Math.ceil(simulation.p95Burn / 10000)} FTEs** (assuming $10k/mo avg).
                            </div>
                            
                            <Button 
                                variant="outline" 
                                style={{ width: '100%', marginTop: 12 }}
                                onClick={() => setScenarios(s => s === 1000 ? 5000 : 1000)}
                            >
                                Re-run with {scenarios === 1000 ? 5000 : 1000} Scenarios
                            </Button>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: 40, color: T.mute, background: T.card, borderRadius: 12, border: `1px dashed ${T.border}` }}>
                            Select grants on the left to start Monte Carlo simulation
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};
