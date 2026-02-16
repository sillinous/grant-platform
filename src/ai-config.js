
import { LS } from "./globals";

// ─── AI PROVIDER DEFINITIONS ───────────────────────────────────────────
export const AI_PROVIDERS = {
    openrouter: {
        id: "openrouter", name: "OpenRouter", icon: "🌐", color: "#6366f1",
        envKey: "VITE_OPENROUTER_KEY", lsKey: "openrouter_key",
        description: "Meta-router with access to all major models. Recommended primary.",
        keyUrl: "https://openrouter.ai/keys",
        keyPrefix: "sk-or-",
        models: [
            { id: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet", tier: "flagship" },
            { id: "openai/gpt-4o", label: "GPT-4o", tier: "flagship" },
            { id: "google/gemini-pro-1.5", label: "Gemini 1.5 Pro", tier: "flagship" },
            { id: "openai/o1-mini", label: "OpenAI o1-mini", tier: "reasoning" },
            { id: "meta-llama/llama-3.1-405b-instruct", label: "Llama 3.1 405B", tier: "standard" },
            { id: "google/gemini-flash-1.5", label: "Gemini 1.5 Flash", tier: "fast" },
            { id: "openrouter/auto", label: "Auto-router", tier: "standard" },
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
            { id: "gpt-4-turbo", label: "GPT-4 Turbo", tier: "standard" },
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

    gemini: {
        id: "gemini", name: "Google Gemini", icon: "🔵", color: "#4285f4",
        envKey: "VITE_GEMINI_KEY", lsKey: "gemini_key",
        description: "Gemini models — multimodal with large context windows.",
        keyUrl: "https://aistudio.google.com/apikey",
        keyPrefix: "AIza",
        models: [
            { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro", tier: "flagship" },
            { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash", tier: "fast" },
            { id: "gemini-2.0-flash-exp", label: "Gemini 2.0 Flash (latest)", tier: "standard" },
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

// ─── PROVIDER HELPERS ──────────────────────────────────────────────────
export function getActiveProvider() {
    // OpenRouter is primary if its key exists
    const orKey = import.meta.env.VITE_OPENROUTER_KEY || LS.get("openrouter_key");
    const explicitProvider = LS.get("ai_provider");

    if (explicitProvider && AI_PROVIDERS[explicitProvider]) {
        return AI_PROVIDERS[explicitProvider];
    }
    // Auto-select: OpenRouter first, then whichever has a key
    if (orKey) return AI_PROVIDERS.openrouter;
    for (const id of ["anthropic", "openai", "gemini", "nvidia"]) {
        const p = AI_PROVIDERS[id];
        if (import.meta.env[p.envKey] || LS.get(p.lsKey)) return p;
    }
    return AI_PROVIDERS.openrouter; // default even without key (will show error prompting config)
}

export function getProviderKey(providerId) {
    const p = AI_PROVIDERS[providerId];
    if (!p) return null;
    return import.meta.env[p.envKey] || LS.get(p.lsKey) || null;
}
