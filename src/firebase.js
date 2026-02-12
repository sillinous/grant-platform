// ══════════════════════════════════════════════════════════════
// POCKETBASE SERVICE LAYER — Auth + Database + Real-time
// ══════════════════════════════════════════════════════════════
// Keeps the same export names so App.jsx doesn't need changes.
// PocketBase auto-persists auth in localStorage ("pocketbase_auth").

import PocketBase from "pocketbase";

let pb = null;
let isConfigured = false;

// ══════ INIT ══════
export function initFirebase(config) {
  const url = config?.url || config?.pbUrl || "";
  if (!url || !url.startsWith("http")) {
    console.log("PocketBase not configured — using localStorage mode");
    return false;
  }
  try {
    pb = new PocketBase(url);
    pb.autoCancellation(false);
    isConfigured = true;
    console.log("PocketBase connected:", url);
    return true;
  } catch (e) {
    console.error("PocketBase init failed:", e);
    return false;
  }
}

export function isFirebaseReady() { return isConfigured && pb !== null; }
export function getFirebaseAuth() { return pb?.authStore || null; }
export function getFirebaseDB() { return pb; }
export function getPB() { return pb; }

// ══════ AUTH ══════

// OAuth2 popup flow (Google, GitHub, etc.)
export async function signInGoogle() {
  if (!pb) return null;
  const authData = await pb.collection("users").authWithOAuth2({ provider: "google" });
  return authData.record;
}

// Email + password login
export async function signInEmail(email, password) {
  if (!pb) return null;
  const authData = await pb.collection("users").authWithPassword(email, password);
  return authData.record;
}

// Email + password register
export async function signUpEmail(email, password) {
  if (!pb) return null;
  // Create user, then authenticate
  await pb.collection("users").create({
    email,
    password,
    passwordConfirm: password,
  });
  const authData = await pb.collection("users").authWithPassword(email, password);
  return authData.record;
}

// Anonymous — not natively supported by PB, so we create a temp user
export async function signInAnon() {
  if (!pb) return null;
  const id = "anon_" + Math.random().toString(36).substring(2, 12);
  const email = id + "@anon.glp";
  const pass = "Anon_" + Date.now() + "!";
  try {
    await pb.collection("users").create({ email, password: pass, passwordConfirm: pass, name: "Anonymous" });
    const authData = await pb.collection("users").authWithPassword(email, pass);
    // Store anon credentials for re-auth
    try { localStorage.setItem("glp_anon_creds", JSON.stringify({ email, pass })); } catch {}
    return authData.record;
  } catch (e) {
    // If anon creds exist, try re-auth
    try {
      const creds = JSON.parse(localStorage.getItem("glp_anon_creds"));
      if (creds) {
        const authData = await pb.collection("users").authWithPassword(creds.email, creds.pass);
        return authData.record;
      }
    } catch {}
    throw e;
  }
}

export async function upgradeAnonymous(email, password) {
  if (!pb?.authStore?.record) return null;
  return pb.collection("users").update(pb.authStore.record.id, { email, password, passwordConfirm: password });
}

export async function upgradeToGoogle() {
  // PB doesn't support linking — user would need to create new account
  return null;
}

// Auth state listener
export function onAuthChange(callback) {
  if (!pb) return () => {};
  // Check current auth state immediately
  if (pb.authStore.isValid && pb.authStore.record) {
    setTimeout(() => callback(pb.authStore.record, "SIGNED_IN"), 0);
  } else {
    setTimeout(() => callback(null, "SIGNED_OUT"), 0);
  }
  // Listen for changes
  const unsub = pb.authStore.onChange((token, record) => {
    callback(record || null, record ? "TOKEN_REFRESH" : "SIGNED_OUT");
  });
  return unsub;
}

export async function logOut() {
  if (!pb) return;
  pb.authStore.clear();
}

export async function getSession() {
  if (!pb) return null;
  return pb.authStore.isValid ? pb.authStore : null;
}

// ══════ HELPERS ══════
function uid() { return pb?.authStore?.record?.id || "local"; }

async function upsert(collection, filterField, filterValue, data) {
  try {
    const existing = await pb.collection(collection).getFirstListItem(
      pb.filter(`${filterField} = {:v}`, { v: filterValue })
    );
    return pb.collection(collection).update(existing.id, data);
  } catch {
    return pb.collection(collection).create(data);
  }
}

// ══════ DATABASE — Profiles ══════

export async function loadUserProfile(userId) {
  if (!pb) return null;
  try {
    const record = await pb.collection("profiles").getFirstListItem(
      pb.filter("user = {:uid}", { uid: userId })
    );
    return record.data || null;
  } catch { return null; }
}

export async function saveUserProfile(userId, profile) {
  if (!pb) return;
  try {
    await upsert("profiles", "user", userId, {
      user: userId,
      data: profile,
    });
  } catch (e) { console.warn("saveProfile:", e.message); }
}

// ══════ DATABASE — Grants ══════

export function subscribeGrants(userId, callback) {
  if (!pb) return () => {};
  // Initial load
  loadGrants(userId).then(callback);
  // Real-time subscription
  pb.collection("user_grants").subscribe("*", (e) => {
    if (e.record.user === userId) loadGrants(userId).then(callback);
  });
  return () => { try { pb.collection("user_grants").unsubscribe("*"); } catch {} };
}

async function loadGrants(userId) {
  if (!pb) return [];
  try {
    const records = await pb.collection("user_grants").getFullList({
      filter: pb.filter("user = {:uid}", { uid: userId }),
      sort: "-updated",
    });
    return records.map(r => r.data);
  } catch { return []; }
}

export async function saveGrants(userId, grants) {
  if (!pb || !grants?.length) return;
  for (const g of grants) {
    try {
      await upsert("user_grants", "grant_id", String(g.id), {
        user: userId,
        grant_id: String(g.id),
        data: g,
      });
    } catch (e) { console.warn("saveGrant:", e.message); }
  }
}

export async function saveGrant(userId, grant) {
  return saveGrants(userId, [grant]);
}

// ══════ DATABASE — Documents ══════

export function subscribeDocs(userId, callback) {
  if (!pb) return () => {};
  loadDocs(userId).then(callback);
  pb.collection("user_docs").subscribe("*", (e) => {
    if (e.record.user === userId) loadDocs(userId).then(callback);
  });
  return () => { try { pb.collection("user_docs").unsubscribe("*"); } catch {} };
}

async function loadDocs(userId) {
  if (!pb) return [];
  try {
    const records = await pb.collection("user_docs").getFullList({
      filter: pb.filter("user = {:uid}", { uid: userId }),
    });
    return records.map(r => r.data);
  } catch { return []; }
}

export async function saveDocs(userId, docs) {
  if (!pb || !docs?.length) return;
  for (const d of docs) {
    try {
      await upsert("user_docs", "doc_id", String(d.id), {
        user: userId,
        doc_id: String(d.id),
        data: d,
      });
    } catch (e) { console.warn("saveDoc:", e.message); }
  }
}

// ══════ DATABASE — Contacts ══════

export async function saveContacts(userId, contacts) {
  if (!pb || !contacts?.length) return;
  for (const c of contacts) {
    try {
      await upsert("user_contacts", "contact_id", String(c.id), {
        user: userId,
        contact_id: String(c.id),
        data: c,
      });
    } catch (e) { console.warn("saveContact:", e.message); }
  }
}

export async function loadContacts(userId) {
  if (!pb) return [];
  try {
    const records = await pb.collection("user_contacts").getFullList({
      filter: pb.filter("user = {:uid}", { uid: userId }),
    });
    return records.map(r => r.data);
  } catch { return []; }
}

// ══════ DATABASE — AI History & Drafts ══════

export async function saveChatMessage(userId, msg) {
  if (!pb) return;
  try {
    await pb.collection("ai_history").create({
      user: userId,
      role: msg.role,
      text: msg.text,
      module: msg.module || "chat",
    });
  } catch {}
}

export async function saveDraft(userId, draft) {
  if (!pb) return;
  try {
    await pb.collection("drafts").create({
      user: userId,
      section: draft.section,
      grant_name: draft.grant,
      content: draft.text,
    });
  } catch {}
}

// ══════ SHARED / COMMUNITY ══════

export async function loadSharedTemplates() {
  if (!pb) return [];
  try {
    const records = await pb.collection("shared_templates").getFullList({ sort: "-created" });
    return records;
  } catch { return []; }
}

export async function shareTemplate(template) {
  if (!pb?.authStore?.record) return;
  try {
    await pb.collection("shared_templates").create({
      user: pb.authStore.record.id,
      author_name: pb.authStore.record.name || pb.authStore.record.email || "Anonymous",
      data: template,
    });
  } catch {}
}

// ══════ MIGRATION — localStorage → PocketBase ══════

export async function migrateFromLocalStorage(userId) {
  if (!pb) return false;
  try {
    const existing = await loadUserProfile(userId);
    if (existing && existing.migrated) return false;

    const loadLS = (key, def) => {
      try { const v = localStorage.getItem("glp_v5_" + key); return v ? JSON.parse(v) : def; } catch { return def; }
    };

    const profile = loadLS("profile", null);
    const grants = loadLS("grants", []);
    const docs = loadLS("docs", []);
    const contacts = loadLS("contacts", []);

    if (profile) await saveUserProfile(userId, { ...profile, migrated: true, migratedAt: new Date().toISOString() });
    if (grants.length) await saveGrants(userId, grants);
    if (docs.length) await saveDocs(userId, docs);
    if (contacts.length) await saveContacts(userId, contacts);

    console.log("Migration complete:", { grants: grants.length, docs: docs.length, contacts: contacts.length });
    return true;
  } catch (e) {
    console.error("Migration failed:", e);
    return false;
  }
}

// ══════ FULL EXPORT ══════

export async function exportAllData(userId) {
  if (!pb) return null;
  const [profile, grants, docs, contacts] = await Promise.all([
    loadUserProfile(userId),
    loadGrants(userId),
    loadDocs(userId),
    loadContacts(userId),
  ]);
  return {
    profile, grants, docs, contacts,
    exportedAt: new Date().toISOString(),
    source: "pocketbase",
  };
}

// ══════ COLLECTION SETUP INSTRUCTIONS ══════
// PocketBase creates collections via the Admin UI at /_/
// This function returns instructions for manual setup.
export function getSetupSQL() {
  return `PocketBase Collection Setup — Create these in Admin UI (/_/)
══════════════════════════════════════════════════════════════

PocketBase doesn't use SQL — create collections in the Admin Dashboard.
Go to: http://YOUR-SERVER:8090/_/

1. USERS (already exists as built-in auth collection "users")
   ✅ Pre-created by PocketBase — just enable email/password auth

2. Collection: "profiles"
   Fields:
   • user (Relation → users, required, unique)
   • data (JSON, required)
   API Rules: List/View/Create/Update/Delete = @request.auth.id = user

3. Collection: "user_grants"
   Fields:
   • user (Relation → users, required)
   • grant_id (Text, required)
   • data (JSON, required)
   Unique: user + grant_id
   API Rules: @request.auth.id = user

4. Collection: "user_docs"
   Fields:
   • user (Relation → users, required)
   • doc_id (Text, required)
   • data (JSON, required)
   Unique: user + doc_id
   API Rules: @request.auth.id = user

5. Collection: "user_contacts"
   Fields:
   • user (Relation → users, required)
   • contact_id (Text, required)
   • data (JSON, required)
   Unique: user + contact_id
   API Rules: @request.auth.id = user

6. Collection: "ai_history"
   Fields:
   • user (Relation → users, required)
   • role (Text, required)
   • text (Text, required)
   • module (Text, default: "chat")
   API Rules: @request.auth.id = user

7. Collection: "drafts"
   Fields:
   • user (Relation → users, required)
   • section (Text)
   • grant_name (Text)
   • content (Editor/Text)
   API Rules: @request.auth.id = user

8. Collection: "shared_templates"
   Fields:
   • user (Relation → users, required)
   • author_name (Text, default: "Anonymous")
   • data (JSON, required)
   API Rules:
     List/View: "" (public read)
     Create: @request.auth.id != ""
     Update/Delete: @request.auth.id = user

TIP: For each collection, set ALL API rules to:
  @request.auth.id = user
This ensures users can only access their own data.
For shared_templates, leave List/View empty (public).
`;
}
