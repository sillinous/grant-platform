# UNLESS Grant Lifecycle Platform

**v10.7 — Compound Intelligence Edition**

A comprehensive grant discovery, intelligence, and application platform powered by 23 API functions across 8 federal data services, with AI-driven proposal drafting that uses section-specific intelligence routing.

## Architecture

- **Single-file React application** (6,689 lines)
- **PocketBase** for cloud sync (optional, works offline)
- **Claude AI** for intelligent drafting, analysis, and briefing
- **8-phase fullScan pipeline** that queries 18+ federal API endpoints

## API Integrations (23 functions)

| Service | Endpoints | Auth |
|---------|-----------|------|
| Grants.gov | search2, fetchOpportunity | None |
| USAspending | Awards, Agency, Recipients, Trends, CFDA, County, Local Awards, Autocomplete | None |
| SBIR.gov | Awards search | None |
| Federal Register | NOFO early warning | None |
| Census Bureau | ACS 5-Year demographics | None (key optional) |
| ProPublica | Nonprofit search, Org detail/990 | None |
| FAC.gov | Single audit, Findings | DEMO_KEY / custom |
| Regulations.gov | Policy notices | DEMO_KEY / custom |
| Simpler.Grants.gov | Enhanced search | User key (free) |
| SAM.gov | Entity verification, UEI lookup | User key (free) |
| Claude AI | Drafter, RFP Parser, Reports, Briefing, Narratives, Gap Analysis | User key |

## 8-Phase Discovery Pipeline

1. **Posted Grants** — Grants.gov search2
2. **Forecasted Grants** — upcoming opportunities
3. **Award Intelligence** — Agency + Award + SBIR competitive data
4. **Early Warning** — Federal Register NOFOs + Census demographics
5. **Funder Research** — ProPublica nonprofits + FAC compliance
6. **Regulatory Monitor** — Regulations.gov + Spending trends + Top recipients
7. **Program Intelligence** — CFDA programs + County spending + Local awards
8. **Premium APIs** — Simpler.Grants.gov + SAM.gov (when keys configured)

## Compound Intelligence Workflows

The AI Drafter uses **section-specific intelligence routing** — each proposal section type (Statement of Need, Budget Narrative, Org Capability, etc.) prioritizes different data sources:

- **Statement of Need** → ⭐ Census ACS + County + Local Awards + Trends
- **Budget Narrative** → ⭐ CFDA Programs + Awards + Top Recipients + Trends
- **Org Capability** → ⭐ Award Intel + SBIR + Funder Research + FAC
- **Impact & Outcomes** → ⭐ Census + Spending + County + Local Awards

## Modules

Dashboard, Discovery Engine, Grant Pipeline, AI Drafter, RFP Parser, Documents, Contacts, Funders, Programs, Calendar, Reports, Financial Tracker, Community Data, Compliance, AI Chat, Profile/Settings, Onboarding Wizard, Guided Tour, Command Palette (⌘K)

## Setup

```bash
npm install
npm run dev      # Development
npm run build    # Production build
```

### API Keys (Profile → Identity)

- **Required**: Anthropic Claude API key for AI features
- **Optional**: Simpler.Grants.gov, SAM.gov, Census Bureau, Data.gov keys for enhanced capabilities

## Build Stats

- **Lines**: 6,689
- **Compiled**: 465KB (132KB gzipped)
- **External APIs**: 18 endpoints across 8 services
- **AI Functions**: 7 (6 Claude + 1 auto-generator)
- **Errors**: 0

## License

MIT

---

*Built by UNLESS · Powered by Anthropic Claude*
