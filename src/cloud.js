import { auth } from "./auth.js";
import { saveProfile } from "./globals.js";

const SYNC_ENDPOINT = "/.netlify/functions/sync";

// Debounce helper
let _pushTimer = null;

export const cloud = {
  isSyncing: false,
  lastSynced: null,
  onStatusChange: null, // callback(status: 'syncing'|'saved'|'error'|'offline')

  _notify(status) {
    if (this.onStatusChange) this.onStatusChange(status);
  },

  // Pull data from Cloud → Zustand store
  async pull() {
    const token = await auth.getToken();
    if (!token) return null;

    try {
      this._notify('syncing');
      const res = await fetch(SYNC_ENDPOINT, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!res.ok) throw new Error(`Sync failed: ${res.status}`);

      const remoteData = await res.json();

      if (!remoteData || Object.keys(remoteData).length === 0) {
        // First-time cloud user — push local data up
        await this.push();
        this._notify('saved');
        return null;
      }

      this.lastSynced = new Date();
      this._notify('saved');
      return remoteData;
    } catch (e) {
      console.error("Cloud Pull Error:", e);
      this._notify('error');
      return null;
    }
  },

  // Push data from Zustand store → Cloud (reads live from store)
  async push() {
    const token = await auth.getToken();
    if (!token) return;

    // Lazily import the store to avoid circular dependencies
    const { useStore } = await import("./store.js");
    const state = useStore.getState();

    const payload = {
      grants: state.grants,
      docs: state.vaultDocs,
      contacts: state.contacts,
      events: state.events,
      library: state.sectionLibrary,
      scores: state.scoreHistory,
      funders: state.savedFunders,
      snapshots: state.draftSnapshots,
      onboarding: state.onboardingComplete,
      voicePersona: state.orgVoicePersona,
      tasks: state.tasks,
      budgets: state.budgets,
      alliances: state.alliances,
      lastSync: new Date().toISOString(),
    };

    try {
      this._notify('syncing');
      const res = await fetch(SYNC_ENDPOINT, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Push failed: ${res.status}`);
      this.lastSynced = new Date();
      this._notify('saved');
    } catch (e) {
      console.error("Cloud Push Error:", e);
      this._notify('error');
    }
  },

  // Debounced push — call after any store mutation
  // Won't spam the API if many changes happen quickly
  schedulePush(delayMs = 1500) {
    clearTimeout(_pushTimer);
    _pushTimer = setTimeout(() => this.push(), delayMs);
  },
};
