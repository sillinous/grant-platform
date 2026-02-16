import React, { useState } from 'react';
import { Card, Btn, Select } from '../ui';
import { API } from '../api';
import { T, getProfileState } from '../globals';

export const CensusNarrative = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [narrative, setNarrative] = useState("");
  const [customArea, setCustomArea] = useState(() => getProfileState().fips);

  const STATES = [
    { fips: "17", name: "Illinois" }, { fips: "06", name: "California" }, { fips: "48", name: "Texas" },
    { fips: "36", name: "New York" }, { fips: "12", name: "Florida" }, { fips: "39", name: "Ohio" },
    { fips: "42", name: "Pennsylvania" }, { fips: "18", name: "Indiana" }, { fips: "29", name: "Missouri" },
  ];

  const loadCensusData = async () => {
    setLoading(true);
    try {
      const fields = "NAME,S1701_C03_001E,S2301_C04_001E,S2801_C01_001E,S1501_C02_019E";
      const result = await API.getCensusData(customArea, fields);
      if (result.length >= 2) {
        const headers = result[0];
        const values = result[1];
        const parsed = {};
        headers.forEach((h, i) => { parsed[h] = values[i]; });
        setData(parsed);
        generateNarrative(parsed);
      }
    } catch (e) { setData({ error: e.message }); }
    setLoading(false);
  };

  const generateNarrative = (censusData) => {
    const state = censusData.NAME || "the target area";
    const poverty = parseFloat(censusData.S1701_C03_001E) || 0;
    const unemployment = parseFloat(censusData.S2301_C04_001E) || 0;
    const broadband = parseFloat(censusData.S2801_C01_001E) || 0;
    const bachelors = parseFloat(censusData.S1501_C02_019E) || 0;

    const povertyStatus = poverty > 15 ? "significantly above" : poverty > 12 ? "above" : "near";
    const unempStatus = unemployment > 6 ? "elevated" : unemployment > 4 ? "moderate" : "relatively stable";
    const broadbandStatus = broadband < 80 ? "limited" : broadband < 90 ? "moderate" : "adequate";

    const text = `STATEMENT OF NEED — ${state}

${state} faces persistent socioeconomic challenges that underscore the critical need for this project. The poverty rate stands at ${poverty.toFixed(1)}%, ${povertyStatus} the national average, indicating that a substantial portion of the population lacks adequate financial resources to meet basic needs. This economic hardship is compounded by an ${unempStatus} unemployment rate of ${unemployment.toFixed(1)}%, reflecting limited employment opportunities particularly in rural and underserved communities.

Digital infrastructure remains a significant barrier, with ${broadbandStatus} broadband access at ${broadband.toFixed(1)}% household penetration. In rural areas like Newton, Illinois — the project's base of operations — this digital divide is even more pronounced, limiting residents' ability to participate in the modern economy, access remote work opportunities, and utilize digital services that urban populations take for granted.

Educational attainment data shows ${bachelors.toFixed(1)}% of the population holds a bachelor's degree or higher, indicating both a workforce development opportunity and the need for innovative approaches to skill-building that don't require traditional four-year pathways.

These intersecting challenges — poverty, unemployment, digital exclusion, and limited educational pathways — create a compounding effect that disproportionately impacts rural communities, disabled individuals, and economically disadvantaged entrepreneurs. The proposed project directly addresses these barriers through technology-enabled solutions that bridge geographic and economic divides, creating sustainable pathways to economic self-sufficiency.

[Data Source: U.S. Census Bureau, American Community Survey 5-Year Estimates, 2022]`;

    setNarrative(text);
  };

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 8 }}>📊 Census-Powered Narrative Generator</div>
        <div style={{ fontSize: 12, color: T.sub, marginBottom: 12 }}>Generates a data-backed Statement of Need using live Census ACS data. Ready to paste into grant applications.</div>
        <div style={{ display: "flex", gap: 8 }}>
          <Select value={customArea} onChange={setCustomArea} options={STATES.map(s => ({ value: s.fips, label: s.name }))} style={{ flex: 1 }} />
          <Btn variant="primary" onClick={loadCensusData} disabled={loading}>{loading ? "⏳ Loading..." : "📊 Generate Narrative"}</Btn>
        </div>
      </Card>

      {data && !data.error && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 8 }}>📈 Census Data — {data.NAME}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            <div style={{ textAlign: "center", padding: 8, background: T.panel, borderRadius: 6 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: parseFloat(data.S1701_C03_001E) > 15 ? T.red : T.yellow }}>{data.S1701_C03_001E}%</div>
              <div style={{ fontSize: 10, color: T.mute }}>Poverty Rate</div>
            </div>
            <div style={{ textAlign: "center", padding: 8, background: T.panel, borderRadius: 6 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: parseFloat(data.S2301_C04_001E) > 6 ? T.red : T.yellow }}>{data.S2301_C04_001E}%</div>
              <div style={{ fontSize: 10, color: T.mute }}>Unemployment</div>
            </div>
            <div style={{ textAlign: "center", padding: 8, background: T.panel, borderRadius: 6 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: parseFloat(data.S2801_C01_001E) < 85 ? T.red : T.green }}>{data.S2801_C01_001E}%</div>
              <div style={{ fontSize: 10, color: T.mute }}>Broadband Access</div>
            </div>
            <div style={{ textAlign: "center", padding: 8, background: T.panel, borderRadius: 6 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: T.blue }}>{data.S1501_C02_019E}%</div>
              <div style={{ fontSize: 10, color: T.mute }}>Bachelor's+</div>
            </div>
          </div>
        </Card>
      )}

      {narrative && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>📄 Generated Statement of Need</div>
            <Btn size="sm" variant="ghost" onClick={() => navigator.clipboard?.writeText(narrative)}>📋 Copy</Btn>
          </div>
          <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.7, whiteSpace: "pre-wrap", padding: 12, background: T.panel, borderRadius: 6, maxHeight: 500, overflow: "auto" }}>{narrative}</div>
        </Card>
      )}
    </div>
  );
};

