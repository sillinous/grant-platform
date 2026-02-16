
import { auth } from "./auth.js";
import { LS, saveProfile, PROFILE } from "./globals.js";

const SYNC_ENDPOINT = "/.netlify/functions/sync";

export const cloud = {
  // Pull data from Cloud -> Local
  async pull() {
    const token = await auth.getToken();
    if (!token) return;

    try {
      const res = await fetch(SYNC_ENDPOINT, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error("Sync failed");
      
      const remoteData = await res.json();
      
      if (Object.keys(remoteData).length === 0) {
        // First time cloud user? Upload local data.
        await this.push(); 
        return;
      }

      // Merge Strategy: Remote Overwrites Local (for MVP simplicity)
      // In a real app, you'd want timestamp-based merging.
      if (remoteData.grants) LS.set("grants", remoteData.grants);
      if (remoteData.docs) LS.set("vault_docs", remoteData.docs);
      if (remoteData.contacts) LS.set("contacts", remoteData.contacts);
      if (remoteData.profile) saveProfile(remoteData.profile);
      if (remoteData.events) LS.set("events", remoteData.events);
      if (remoteData.library) LS.set("section_library", remoteData.library);
      if (remoteData.scores) LS.set("score_history", remoteData.scores);
      if (remoteData.funders) LS.set("saved_funders", remoteData.funders);
      if (remoteData.snapshots) LS.set("draft_snapshots", remoteData.snapshots);
      if (remoteData.onboarding) LS.set("onboarding_complete", remoteData.onboarding);

      return remoteData;
    } catch (e) {
      console.error("Cloud Pull Error:", e);
    }
  },

  // Push data from Local -> Cloud
  async push() {
    const token = await auth.getToken();
    console.log("Pushing data...", token ? "Authorized" : "Anonymous");
    if (!token) return;

    const payload = {
      grants: LS.get("grants", []),
      docs: LS.get("vault_docs", []),
      contacts: LS.get("contacts", []),
      profile: PROFILE,
      events: LS.get("events", []),
      library: LS.get("section_library", []),
      scores: LS.get("score_history", []),
      funders: LS.get("saved_funders", []),
      snapshots: LS.get("draft_snapshots", []),
      onboarding: LS.get("onboarding_complete", false),
      voicePersona: LS.get("org_voice_persona", null),
      lastSync: new Date().toISOString()
    };

    try {
      await fetch(SYNC_ENDPOINT, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      console.log("Cloud Saved");
    } catch (e) {
      console.error("Cloud Push Error:", e);
    }
  }
};
