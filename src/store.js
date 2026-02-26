import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { uid, daysUntil } from './globals';
import { auth } from './auth';
import { cloud } from './cloud';

export const useStore = create(
  persist(
    (set, get) => ({
      // State
      grants: [], // { id, title, amount, agency, stage, meta: { riskScore, alignmentScore }, compliance: { reportingFreq, matchRequired }, financials: { drawnDown, balance }, relationships: { internalLeadId, subGrantees: [], vaultDocs: [] } }
      vaultDocs: [], // { id, name, type, docType, validUntil, linkedGrants: [], tags: [] }
      contacts: [], // { id, name, role, influenceScore, associatedGrants: [], lastInteraction }
      events: [],
      sidebarCollapsed: {},
      onboardingComplete: false,
      sectionLibrary: [],
      savedFunders: [],
      scoreHistory: [],
      draftSnapshots: [],
      orgVoicePersona: null,
      tasks: [],
      budgets: {},
      alliances: [], // { id, name, partners: [], sharedGoals: [], activeJointGrants: [] }
      
      // Actions
      setGrants: (grants) => set({ grants }),
      setVaultDocs: (vaultDocs) => set({ vaultDocs }),
      setContacts: (contacts) => set({ contacts }),
      setEvents: (events) => set({ events }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setOnboardingComplete: (onboardingComplete) => set({ onboardingComplete }),
      setSectionLibrary: (sectionLibrary) => set({ sectionLibrary }),
      setSavedFunders: (savedFunders) => set({ savedFunders }),
      setScoreHistory: (scoreHistory) => set({ scoreHistory }),
      setDraftSnapshots: (draftSnapshots) => set({ draftSnapshots }),
      setOrgVoicePersona: (orgVoicePersona) => set({ orgVoicePersona }),
      setTasks: (tasks) => set({ tasks }),
      setBudgets: (budgets) => set({ budgets }),
      setAlliances: (alliances) => set({ alliances }),

      // Complex Actions
      addGrant: (grant) => {
        const { grants, tasks, budgets } = get();
        if (grant.oppNumber && grants.some(g => g.oppNumber === grant.oppNumber)) return;
        if (grant.id && grants.some(g => g.id === grant.id)) return;
        
        // Comprehensive Meta-Model Initialization
        const newGrant = {
          ...grant,
          createdAt: new Date().toISOString(),
          meta: { riskScore: Math.floor(Math.random() * 40) + 10, alignmentScore: Math.floor(Math.random() * 30) + 70, winProbability: 50 },
          compliance: { reportingFrequency: "Quarterly", requiredAudits: ["A-133"], matchingFundsRequired: false, matchPercent: 0 },
          financials: { directCosts: grant.amount || 0, indirectCosts: 0, drawnDown: 0, balance: grant.amount || 0 },
          impact: { targetBeneficiaries: 0, geographicReach: [], expectedROI: 0 },
          relationships: { sponsorContactId: null, internalLeadId: null, subGrantees: [], vaultDocs: [] }
        };
        
        const defaultTasks = [
          { id: uid(), grantId: newGrant.id, title: "🔍 RFP Deep Dive", status: "todo", notes: "Initial review of requirements and eligibility.", priority: "high" },
          { id: uid(), grantId: newGrant.id, title: "📋 Compliance Matrix", status: "todo", notes: "Draft the internal compliance and requirements matrix.", priority: "medium" },
          { id: uid(), grantId: newGrant.id, title: "✍️ Narrative Skeleton", status: "todo", notes: "Build the initial draft framework based on the RFP.", priority: "high" },
          { id: uid(), grantId: newGrant.id, title: "💰 Budget Alignment", status: "todo", notes: "Cross-check budget placeholders against award limits.", priority: "medium" }
        ];

        const newBudgets = { ...budgets };
        if (newGrant.amount > 0) {
          newBudgets[newGrant.id] = {
            items: [
              { id: uid(), category: "personnel", description: "Program Director / Lead", amount: Math.round(newGrant.amount * 0.4), quantity: 1, justification: "Estimated leadership for program implementation." },
              { id: uid(), category: "other", description: "Operational Reserve", amount: Math.round(newGrant.amount * 0.6), quantity: 1, justification: "Balance of award ceiling for program activities." }
            ],
            updatedAt: new Date().toISOString()
          };
        }

        set({
          grants: [...grants, newGrant],
          tasks: [...tasks, ...defaultTasks],
          budgets: newBudgets
        });
      },

      updateGrant: (id, updates) => {
        set(state => ({
          grants: state.grants.map(g => {
            if (g.id !== id) return g;
            const updated = { ...g, ...updates, updatedAt: new Date().toISOString() };
            if (updates.stage && updates.stage !== g.stage) {
              updated.stageHistory = [...(g.stageHistory || []), { from: g.stage || "new", to: updates.stage, date: new Date().toISOString() }];
            }
            return updated;
          })
        }));
      },

      deleteGrant: (id) => {
        set(state => ({ grants: state.grants.filter(x => x.id !== id) }));
      },
      
      syncFromCloud: (data) => {
         // Merge logic
         set(state => ({
            grants: data.grants || state.grants,
            vaultDocs: data.docs || state.vaultDocs,
            contacts: data.contacts || state.contacts,
            events: data.events || state.events,
            sectionLibrary: data.library || state.sectionLibrary,
            savedFunders: data.funders || state.savedFunders,
            scoreHistory: data.scores || state.scoreHistory,
            draftSnapshots: data.snapshots || state.draftSnapshots,
            onboardingComplete: data.onboarding !== undefined ? data.onboarding : state.onboardingComplete,
            orgVoicePersona: data.voicePersona || state.orgVoicePersona,
            tasks: data.tasks || state.tasks,
            budgets: data.budgets || state.budgets,
           alliances: data.alliances || state.alliances,
         }));
      }
    }),
    {
      name: 'grant-platform-storage', // name of item in the storage (must be unique)
      getStorage: () => localStorage, // (optional) by default the 'localStorage' is used
      partialize: (state) => ({ 
        grants: state.grants,
        vaultDocs: state.vaultDocs,
        contacts: state.contacts,
        events: state.events,
        sidebarCollapsed: state.sidebarCollapsed,
        onboardingComplete: state.onboardingComplete,
        sectionLibrary: state.sectionLibrary,
        savedFunders: state.savedFunders,
        scoreHistory: state.scoreHistory,
        draftSnapshots: state.draftSnapshots,
        orgVoicePersona: state.orgVoicePersona,
        tasks: state.tasks,
        budgets: state.budgets,
        alliances: state.alliances
      }), // only save these fields
    }
  )
);
