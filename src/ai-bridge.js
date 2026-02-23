// ── AI Bridge ──────────────────────────────────────────────────────
// Unified AI interface: uses user's API key if available, 
// falls back to server-side proxy with rate limiting.
// Drop-in replacement for direct provider calls.

import { getActiveProvider, getProviderKey, AI_PROVIDERS } from './ai-config';
import { analytics } from './analytics';
import { getTier } from './subscription';
import { isAlphaUser } from './flags';

// Check if user has any API key configured
function hasUserKey() {
  for (const [id, provider] of Object.entries(AI_PROVIDERS)) {
    const key = import.meta.env[provider.envKey] || localStorage.getItem(provider.lsKey);
    if (key) return true;
  }
  return false;
}

// Get effective tier for rate limiting
function getEffectiveTier() {
  if (isAlphaUser()) return 'alpha';
  return getTier() || 'free';
}

// Get session ID for rate limiting
function getSessionId() {
  let sid = sessionStorage.getItem('gp_session');
  if (!sid) {
    sid = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem('gp_session', sid);
  }
  return sid;
}

/**
 * Send a message to AI - automatically routes to best available backend
 * 
 * @param {Object} options
 * @param {Array} options.messages - [{role: 'user'|'assistant', content: string}]
 * @param {string} options.system - System prompt
 * @param {number} options.maxTokens - Max response tokens
 * @param {string} options.model - Optional model override (for user-key calls)
 * @returns {Promise<{text: string, provider: string, model: string, remaining?: number}>}
 */
export async function aiChat({ messages, system, maxTokens = 1024, model }) {
  const start = Date.now();
  
  // Route 1: User has their own API key → use it directly (no rate limit)
  if (hasUserKey()) {
    try {
      const provider = getActiveProvider();
      const key = getProviderKey(provider.id);
      const selectedModel = model || provider.models[0]?.id;
      
      const result = await provider.call(key, selectedModel, messages, system);
      
      analytics.aiCall('chat', !result.error, Date.now() - start, provider.id);
      
      if (result.error) throw new Error(result.error);
      return { text: result.text, provider: provider.id, model: selectedModel };
    } catch (err) {
      // If user key fails, fall through to server proxy
      console.warn('User API key failed, falling back to server proxy:', err.message);
    }
  }
  
  // Route 2: Server-side proxy (rate limited, no user key needed)
  try {
    const res = await fetch('/api/ai-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Id': getSessionId(),
        'X-Tier': getEffectiveTier(),
      },
      body: JSON.stringify({ messages, system, maxTokens }),
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      analytics.aiCall('chat', false, Date.now() - start, 'proxy');
      
      if (res.status === 429) {
        return {
          text: `You've reached your daily AI limit (${data.limit} calls). Configure your own API key in Settings for unlimited access, or wait until midnight UTC for your limit to reset.`,
          provider: 'proxy',
          model: 'rate-limited',
          rateLimited: true,
          remaining: 0,
        };
      }
      throw new Error(data.error || 'AI proxy error');
    }
    
    analytics.aiCall('chat', true, Date.now() - start, 'proxy');
    
    return {
      text: data.text,
      provider: 'proxy',
      model: data.model,
      remaining: data.remaining,
      limit: data.limit,
    };
  } catch (err) {
    analytics.aiCall('chat', false, Date.now() - start, 'proxy');
    throw err;
  }
}

/**
 * Call a server-side AI action (find-grants, draft-section, etc.)
 * These always use the server-side function, not user keys.
 */
export async function aiAction(action, params) {
  const start = Date.now();
  
  try {
    const res = await fetch('/api/ai/' + action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    
    if (!res.ok) {
      analytics.aiCall(action, false, Date.now() - start, 'server');
      const err = await res.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(err.error || `AI action failed: ${res.status}`);
    }
    
    analytics.aiCall(action, true, Date.now() - start, 'server');
    return await res.json();
  } catch (err) {
    analytics.aiCall(action, false, Date.now() - start, 'server');
    throw err;
  }
}

/**
 * Quick utility: get AI completion with just a prompt
 */
export async function aiComplete(prompt, system = '', maxTokens = 1024) {
  return aiChat({
    messages: [{ role: 'user', content: prompt }],
    system,
    maxTokens,
  });
}

/**
 * Check remaining rate limit without making an AI call
 */
export function getRateLimitInfo() {
  const hasKey = hasUserKey();
  return {
    hasUserKey: hasKey,
    tier: getEffectiveTier(),
    unlimited: hasKey,
  };
}
