
import { LS } from "./globals";

// ─── AI PROVIDER DEFINITIONS ───────────────────────────────────────────
export const AI_PROVIDERS = {

    // ── FREE TIER: Groq ─────────────────────────────────────────────────
    // Free API key at https://console.groq.com — Llama 3 & Mixtral, very fast
    groq: {
        id: "groq", name: "Groq (Free)", icon: "⚡", color: "#f55036",
        envKey: "VITE_GROQ_KEY", lsKey: "groq_key",
        description: "Free high-speed inference. Get a free key at console.groq.com — no credit card required.",
        keyUrl: "https://console.groq.com/keys",
        keyPrefix: "gsk_",
        free: true,
        models: [
            { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B (Free)", tier: "free" },
            { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant (Free)", tier: "free" },
            { id: "mixtral-8x7b-32768", label: "Mixtral 8x7B (Free)", tier: "free" },
            { id: "gemma2-9b-it", label: "Gemma 2 9B (Free)", tier: "free" },
        ],
        async call(apiKey, model, messages, systemPrompt) {
            const msgs = systemPrompt ? [{ role: "system", content: systemPrompt }, ...messages] : messages;
            const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
                body: JSON.stringify({ model, max_tokens: 4096, messages: msgs }),
            });
            if (!r.ok) { const e = await r.json().catch(() => ({})); return { error: e.error?.message || `Groq API ${r.status}` }; }
            const d = await r.json();
            return { text: d.choices?.[0]?.message?.content || "", provider: "groq", model };
        },
    },

    // ── FREE TIER: OpenRouter Free Models ───────────────────────────────
    // Free models on OpenRouter (no billing needed for :free suffix models)
    openrouter_free: {
        id: "openrouter_free", name: "OpenRouter (Free Models)", icon: "🆓", color: "#8b5cf6",
        envKey: "VITE_OPENROUTER_KEY", lsKey: "openrouter_key",
        description: "Free models via OpenRouter — no cost, just sign up at openrouter.ai.",
        keyUrl: "https://openrouter.ai/keys",
        keyPrefix: "sk-or-",
        free: true,
        models: [
            { id: "meta-llama/llama-3.3-70b-instruct:free", label: "Llama 3.3 70B (Free)", tier: "free" },
            { id: "google/gemini-2.0-flash-exp:free", label: "Gemini 2.0 Flash (Free)", tier: "free" },
            { id: "deepseek/deepseek-r1:free", label: "DeepSeek R1 (Free)", tier: "free" },
            { id: "mistralai/mistral-7b-instruct:free", label: "Mistral 7B (Free)", tier: "free" },
            { id: "microsoft/phi-3-mini-128k-instruct:free", label: "Phi-3 Mini (Free)", tier: "free" },
        ],
        async call(apiKey, model, messages, systemPrompt) {
            const msgs = systemPrompt ? [{ role: "system", content: systemPrompt }, ...messages] : messages;
            const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}`, "HTTP-Referer": window.location.origin, "X-Title": "UNLESS Grant Platform" },
                body: JSON.stringify({ model, max_tokens: 4096, messages: msgs }),
            });
            if (!r.ok) { const e = await r.json().catch(() => ({})); return { error: e.error?.message || `OpenRouter ${r.status}` }; }
            const d = await r.json();
            return { text: d.choices?.[0]?.message?.content || "", provider: "openrouter_free", model };
        },
    },

    // ── FREE TIER: Google Gemini via AI Studio ──────────────────────────
    gemini: {
        id: "gemini", name: "Google Gemini", icon: "🔵", color: "#4285f4",
        envKey: "VITE_GEMINI_KEY", lsKey: "gemini_key",
        description: "Free tier available at aistudio.google.com — generous daily limits, no credit card required.",
        keyUrl: "https://aistudio.google.com/apikey",
        keyPrefix: "AIza",
        free: true,
        models: [
            { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash (Free)", tier: "free" },
            { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash (Free)", tier: "free" },
            { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro", tier: "flagship" },
        ],
        async call(apiKey, model, messages, systemPrompt) {
            const contents = messages.map(m => ({
                role: m.role === "assistant" ? "model" : "user",
                parts: [{ text: m.content }],
            }));
            const body = { contents, generationConfig: { maxOutputTokens: 4096 } };
            if (systemPrompt) body.systemInstruction = { parts: [{ text: systemPrompt }] };
            const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!r.ok) { const e = await r.json().catch(() => ({})); return { error: e.error?.message || `Gemini API ${r.status}` }; }
            const d = await r.json();
            return { text: d.candidates?.[0]?.content?.parts?.map(p => p.text).join("") || "", provider: "gemini", model };
        },
    },

    // ── PAID: OpenRouter ─────────────────────────────────────────────────
    openrouter: {
        id: "openrouter", name: "OpenRouter", icon: "🌐", color: "#6366f1",
        envKey: "VITE_OPENROUTER_KEY", lsKey: "openrouter_key",
        description: "Access to all major models (Claude, GPT-4, Gemini, Llama). Pay-per-token.",
        keyUrl: "https://openrouter.ai/keys",
        keyPrefix: "sk-or-",
        models: [
            { id: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet", tier: "flagship" },
            { id: "openai/gpt-4o", label: "GPT-4o", tier: "flagship" },
            { id: "google/gemini-pro-1.5", label: "Gemini 1.5 Pro", tier: "flagship" },
            { id: "openai/o1-mini", label: "OpenAI o1-mini", tier: "reasoning" },
            { id: "meta-llama/llama-3.1-405b-instruct", label: "Llama 3.1 405B", tier: "standard" },
            { id: "google/gemini-flash-1.5", label: "Gemini 1.5 Flash", tier: "fast" },
        ],
        async call(apiKey, model, messages, systemPrompt) {
            const msgs = systemPrompt ? [{ role: "system", content: systemPrompt }, ...messages] : messages;
            const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}`, "HTTP-Referer": window.location.origin, "X-Title": "UNLESS Grant Platform" },
                body: JSON.stringify({ model, max_tokens: 4096, messages: msgs }),
            });
            if (!r.ok) { const e = await r.json().catch(() => ({})); return { error: e.error?.message || `OpenRouter API ${r.status}` }; }
            const d = await r.json();
            return { text: d.choices?.[0]?.message?.content || "", provider: "openrouter", model };
        },
    },

    // ── PAID: Anthropic ──────────────────────────────────────────────────
    anthropic: {
        id: "anthropic", name: "Anthropic", icon: "🟤", color: "#d4a574",
        envKey: "VITE_ANTHROPIC_KEY", lsKey: "anthropic_key",
        description: "Claude models — excellent for nuanced writing and analysis.",
        keyUrl: "https://console.anthropic.com/settings/keys",
        keyPrefix: "sk-ant-",
        models: [
            { id: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet", tier: "flagship" },
            { id: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku", tier: "fast" },
            { id: "claude-3-opus-20240229", label: "Claude 3 Opus", tier: "premium" },
        ],
        async call(apiKey, model, messages, systemPrompt) {
            const r = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
                body: JSON.stringify({ model, max_tokens: 4096, system: systemPrompt || "", messages }),
            });
            if (!r.ok) { const e = await r.json().catch(() => ({})); return { error: e.error?.message || `Anthropic API ${r.status}` }; }
            const d = await r.json();
            return { text: d.content?.map(c => c.text).join("") || "", provider: "anthropic", model };
        },
    },

    // ── PAID: OpenAI ─────────────────────────────────────────────────────
    openai: {
        id: "openai", name: "OpenAI", icon: "🟢", color: "#10a37f",
        envKey: "VITE_OPENAI_KEY", lsKey: "openai_key",
        description: "GPT models — strong general-purpose reasoning and code.",
        keyUrl: "https://platform.openai.com/api-keys",
        keyPrefix: "sk-",
        models: [
            { id: "gpt-4o", label: "GPT-4o", tier: "flagship" },
            { id: "gpt-4o-mini", label: "GPT-4o Mini", tier: "fast" },
            { id: "o1-mini", label: "o1-mini (reasoning)", tier: "reasoning" },
        ],
        async call(apiKey, model, messages, systemPrompt) {
            const msgs = systemPrompt ? [{ role: "system", content: systemPrompt }, ...messages] : messages;
            const r = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
                body: JSON.stringify({ model, max_tokens: 4096, messages: msgs }),
            });
            if (!r.ok) { const e = await r.json().catch(() => ({})); return { error: e.error?.message || `OpenAI API ${r.status}` }; }
            const d = await r.json();
            return { text: d.choices?.[0]?.message?.content || "", provider: "openai", model };
        },
    },

    // ── PAID: NVIDIA NIM ─────────────────────────────────────────────────
    nvidia: {
        id: "nvidia", name: "NVIDIA NIM", icon: "🟩", color: "#76b900",
        envKey: "VITE_NVIDIA_KEY", lsKey: "nvidia_key",
        description: "NVIDIA-hosted open models — fast inference on enterprise GPUs.",
        keyUrl: "https://build.nvidia.com/explore/discover",
        keyPrefix: "nvapi-",
        models: [
            { id: "meta/llama-3.1-405b-instruct", label: "Llama 3.1 405B", tier: "flagship" },
            { id: "meta/llama-3.1-70b-instruct", label: "Llama 3.1 70B", tier: "standard" },
            { id: "nvidia/llama-3.1-nemotron-70b-instruct", label: "Nemotron 70B", tier: "custom" },
        ],
        async call(apiKey, model, messages, systemPrompt) {
            const msgs = systemPrompt ? [{ role: "system", content: systemPrompt }, ...messages] : messages;
            const r = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
                body: JSON.stringify({ model, max_tokens: 4096, messages: msgs }),
            });
            if (!r.ok) { const e = await r.json().catch(() => ({})); return { error: e.error?.message || `NVIDIA API ${r.status}` }; }
            const d = await r.json();
            return { text: d.choices?.[0]?.message?.content || "", provider: "nvidia", model };
        },
    },
};

// ─── FREE PROVIDER PRIORITY ORDER ──────────────────────────────────────
export const FREE_PROVIDER_PRIORITY = ["groq", "openrouter_free", "gemini"];
export const PAID_PROVIDER_PRIORITY = ["openrouter", "anthropic", "openai", "gemini", "nvidia"];

// ─── PROVIDER HELPERS ───────────────────────────────────────────────────
export function getActiveProvider() {
    const explicitProvider = LS.get("ai_provider");
    if (explicitProvider && AI_PROVIDERS[explicitProvider]) {
        return AI_PROVIDERS[explicitProvider];
    }
    // Auto-select: try free providers first, then paid
    const allPriority = [...FREE_PROVIDER_PRIORITY, ...PAID_PROVIDER_PRIORITY];
    for (const id of allPriority) {
        const p = AI_PROVIDERS[id];
        if (!p) continue;
        const hasKey = import.meta.env[p.envKey] || LS.get(p.lsKey);
        if (hasKey) return p;
    }
    // Default to Groq (free) to show helpful error pointing to free option
    return AI_PROVIDERS.groq;
}

export function getProviderKey(providerId) {
    const p = AI_PROVIDERS[providerId];
    if (!p) return null;
    return import.meta.env[p.envKey] || LS.get(p.lsKey) || null;
}

export function getFreeProviders() {
    return Object.values(AI_PROVIDERS).filter(p => p.free);
}

export function hasAnyKey() {
    return Object.values(AI_PROVIDERS).some(p => {
        return import.meta.env[p.envKey] || LS.get(p.lsKey);
    });
}
