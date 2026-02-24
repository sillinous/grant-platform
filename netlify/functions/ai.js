// Grant OS — Unified AI Function
// Replaces the entire Express backend from EnhancedGrantSystem
// All AI calls route through here: /api/ai/:action

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY

const callClaude = async (system, userContent, maxTokens = 1024) => {
  const key = OPENROUTER_KEY || ANTHROPIC_KEY
  const useOpenRouter = !!OPENROUTER_KEY
  
  if (useOpenRouter) {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
        'HTTP-Referer': 'https://unless-fortuna-grants.netlify.app'
      },
      body: JSON.stringify({
        model: 'arcee-ai/trinity-large-preview:free',
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userContent }
        ]
      })
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`OpenRouter error: ${res.status} ${err.slice(0,100)}`)
    }
    const d = await res.json()
    return d.choices?.[0]?.message?.content || ''
  }
  
  // Fallback to Anthropic direct
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: userContent }]
    })
  })
  if (!res.ok) throw new Error(`Anthropic error: ${res.status}`)
  const d = await res.json()
  return d.content?.[0]?.text || ''
}

const parseJSON = (text) => {
  try {
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(clean)
  } catch {
    return null
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' } }
  }
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' }
  if (!ANTHROPIC_KEY && !OPENROUTER_KEY) return { statusCode: 500, body: JSON.stringify({ error: 'API key not set' }) }

  // Extract action from path OR request body
  let action = event.path
    .replace(/^\/.netlify\/functions\/ai\/?/, '')
    .replace(/^\/api\/ai\//, '')
  if (!action || action.startsWith('/')) {
    // Fallback: read action from body
    action = JSON.parse(event.body || '{}').action || ''
  }
  let body
  try { body = JSON.parse(event.body) } catch { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) } }

  const respond = (data) => ({
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(data)
  })

  try {
    // ── GRANT DISCOVERY ────────────────────────────────────────────────────────
    if (action === 'find-grants') {
      const { profile } = body
      const text = await callClaude(
        `You are a grant research expert. Return ONLY valid JSON, no markdown.`,
        `Find 4 grant opportunities for this organization:
Name: ${profile.name}
Type: ${profile.profileType}
Industry: ${profile.industry}
Stage: ${profile.stage}
Description: ${profile.description}
Funding needs: ${profile.fundingNeeds}

Return JSON: {"opportunities":[{"title":string,"description":string,"amount":string,"funder":string,"matchScore":number}]}`,
        500
      )
      const parsed = parseJSON(text)
      return respond(parsed || { opportunities: [] })
    }

    // ── ELIGIBILITY CHECK ──────────────────────────────────────────────────────
    if (action === 'check-eligibility') {
      const { profile, grant } = body
      const text = await callClaude(
        `You are a grant eligibility analyst. Return ONLY valid JSON.`,
        `Check eligibility for:
Organization: ${profile.name} (${profile.profileType}, ${profile.industry}, ${profile.stage})
Mission: ${profile.description}
Grant: ${grant.name} — ${grant.description} (${grant.fundingAmount})

Return JSON: { "confidenceScore": "High"|"Medium"|"Low", "deadlines": [{"date": string, "description": string}], "strengths": [string], "gaps": [string], "advice": string }`,
        800
      )
      const parsed = parseJSON(text)
      return respond(parsed || { confidenceScore: 'Medium', strengths: [], gaps: [], deadlines: [], advice: 'Unable to analyze at this time.' })
    }

    // ── LIFECYCLE INSIGHTS ─────────────────────────────────────────────────────
    if (action === 'lifecycle-insights') {
      const { grant, stage } = body
      const text = await callClaude(
        `You are a grant lifecycle expert. Return ONLY valid JSON.`,
        `Provide insights for stage "${stage}" of grant: ${grant.name} (${grant.fundingAmount}, from ${grant.funder || 'funder'})
Return JSON: { "keyActivities": [string], "typicalTimeline": string, "insiderTips": string }`,
        600
      )
      const parsed = parseJSON(text)
      return respond(parsed || { keyActivities: [], typicalTimeline: 'Varies', insiderTips: '' })
    }

    // ── DRAFT SECTION ──────────────────────────────────────────────────────────
    if (action === 'draft-section') {
      const { profile, grant, section } = body
      const wordCounts = { 'Executive Summary': 250, 'Program Narrative': 800, 'Goals & Outcomes': 400, 'Budget Narrative': 350, 'Organizational Capacity': 300 }
      const words = wordCounts[section] || 400
      const text = await callClaude(
        `You are an expert grant writer with 20 years of experience writing successful foundation and government grant proposals.`,
        `Write the "${section}" section (~${words} words) for this grant application:

ORGANIZATION: ${profile.name} (${profile.profileType})
MISSION: ${profile.description}
INDUSTRY: ${profile.industry}
GRANT: ${grant.name} — ${grant.description}
FUNDER: ${grant.funder || 'Funder'}
AMOUNT: ${grant.fundingAmount}

Write a compelling, specific, professional draft. Use concrete language, avoid clichés. Match the funder's priorities.`,
        1000
      )
      return respond({ draft: text })
    }

    // ── APPLICATION REVIEW ─────────────────────────────────────────────────────
    if (action === 'review-application') {
      const { grant, drafts } = body
      const draftText = drafts.map(d => `${d.section}:\n${d.content}`).join('\n\n')
      const text = await callClaude(
        `You are a senior grant reviewer. Return ONLY valid JSON.`,
        `Review this grant application for: ${grant.name} (${grant.fundingAmount})

DRAFTS:
${draftText.slice(0, 3000)}

Return JSON: { "overallScore": "Strong Contender"|"Promising"|"Needs Revision", "strengths": [string], "recommendations": [string], "generatedAt": "${new Date().toISOString()}" }`,
        800
      )
      const parsed = parseJSON(text)
      return respond(parsed || { overallScore: 'Promising', strengths: [], recommendations: [], generatedAt: new Date().toISOString() })
    }

    // ── RED TEAM REVIEW ────────────────────────────────────────────────────────
    if (action === 'red-team-review') {
      const { grant, drafts } = body
      const draftText = drafts.map(d => `${d.section}:\n${d.content}`).join('\n\n')
      const text = await callClaude(
        `You are a skeptical grant reviewer tasked with finding every weakness. Return ONLY valid JSON.`,
        `Red-team this grant application for: ${grant.name}

DRAFTS:
${draftText.slice(0, 3000)}

Find every vulnerability a funder might use to reject this. Return JSON: { "overallRisk": "High"|"Medium"|"Low", "vulnerabilities": [string], "probingQuestions": [string], "generatedAt": "${new Date().toISOString()}" }`,
        800
      )
      const parsed = parseJSON(text)
      return respond(parsed || { overallRisk: 'Medium', vulnerabilities: [], probingQuestions: [], generatedAt: new Date().toISOString() })
    }

    // ── BUDGET JUSTIFICATION ───────────────────────────────────────────────────
    if (action === 'budget-justification') {
      const { grant, drafts, budgetItem } = body
      const text = await callClaude(
        `You are an expert at writing grant budget justifications. Be specific and tie every dollar to outcomes.`,
        `Write a 2-3 sentence budget justification for this line item:
Item: ${budgetItem.description}
Amount: $${budgetItem.amount}
Grant: ${grant.name} (${grant.fundingAmount})
${drafts?.length ? `Program context: ${drafts[0]?.content?.slice(0, 500)}` : ''}

Write a compelling, specific justification that connects the cost to measurable program outcomes.`,
        400
      )
      return respond({ justification: text })
    }

    // ── FUNDER PERSONA ─────────────────────────────────────────────────────────
    if (action === 'funder-persona') {
      const { grant } = body
      const text = await callClaude(
        `You are an expert in philanthropic strategy and funder psychology. Return ONLY valid JSON.`,
        `Analyze the funder for this grant:
Grant: ${grant.name}
Funder: ${grant.funder || 'Unknown'}
Description: ${grant.description}
Amount: ${grant.fundingAmount}

Return JSON: { "funderName": string, "coreMission": string, "keyPriorities": [string], "communicationStyle": string, "strategicAdvice": string, "generatedAt": "${new Date().toISOString()}" }`,
        700
      )
      const parsed = parseJSON(text)
      return respond(parsed || { funderName: grant.funder || 'Funder', coreMission: '', keyPriorities: [], communicationStyle: '', strategicAdvice: '', generatedAt: new Date().toISOString() })
    }

    // ── SUCCESS PATTERNS ───────────────────────────────────────────────────────
    if (action === 'success-patterns') {
      const { grant } = body
      const text = await callClaude(
        `You are a grant intelligence analyst. Return ONLY valid JSON.`,
        `Analyze success patterns for grants from: ${grant.funder || grant.name}
Industry focus: ${grant.industry || 'General'}
Typical award: ${grant.fundingAmount}

Return JSON: { "commonThemes": [string], "fundedProjectTypes": [string], "fundingRangeInsights": string, "keywordPatterns": [string], "strategicRecommendations": string, "generatedAt": "${new Date().toISOString()}" }`,
        700
      )
      const parsed = parseJSON(text)
      return respond(parsed || { commonThemes: [], fundedProjectTypes: [], fundingRangeInsights: '', keywordPatterns: [], strategicRecommendations: '', generatedAt: new Date().toISOString() })
    }

    // ── COHESION ANALYSIS ──────────────────────────────────────────────────────
    if (action === 'cohesion-analysis') {
      const { grant, drafts, budgetItems } = body
      const draftText = drafts?.map(d => `${d.section}: ${d.content?.slice(0, 300)}`).join('\n') || ''
      const text = await callClaude(
        `You are an expert proposal editor. Find consistency issues. Return ONLY valid JSON.`,
        `Analyze cohesion in this grant proposal for: ${grant.name}

DRAFTS:
${draftText}

BUDGET ITEMS: ${budgetItems?.map(b => b.description).join(', ') || 'None'}

Find inconsistencies between sections — dollar amounts, statistics, program names, timelines, beneficiary counts.
Return JSON: { "findings": [ { "finding": string, "sections": [string], "severity": "Critical"|"Warning"|"Suggestion" } ], "generatedAt": "${new Date().toISOString()}" }`,
        700
      )
      const parsed = parseJSON(text)
      return respond(parsed || { findings: [], generatedAt: new Date().toISOString() })
    }

    // ── DIFFERENTIATION ────────────────────────────────────────────────────────
    if (action === 'differentiation') {
      const { grant, drafts } = body
      const draftText = drafts?.map(d => `${d.section}: ${d.content?.slice(0, 300)}`).join('\n') || ''
      const text = await callClaude(
        `You are a grant strategy consultant. Return ONLY valid JSON.`,
        `How can this application stand out for: ${grant.name} (${grant.fundingAmount})?

CURRENT DRAFTS:
${draftText}

Return JSON: { "innovativeAngles": [string], "alternativeMetrics": [string], "partnershipSuggestions": [string], "generatedAt": "${new Date().toISOString()}" }`,
        700
      )
      const parsed = parseJSON(text)
      return respond(parsed || { innovativeAngles: [], alternativeMetrics: [], partnershipSuggestions: [], generatedAt: new Date().toISOString() })
    }

    // ── CHAT ───────────────────────────────────────────────────────────────────
    if (action === 'chat') {
      const { profile, grant, messages, newMessage, message, context } = body
      // Support both old format (message/context) and new format (messages/newMessage)
      const userMsg = newMessage || message || ''
      const sys = `You are an expert grant writing assistant helping ${profile?.name || 'an organization'}${grant?.name ? ` apply for "${grant.name}" (${grant.fundingAmount})` : ''}. Give specific, actionable advice.${context ? ` Context: ${context}` : ''}`
      const text = await callClaude(sys, userMsg, 800)
      return respond({ reply: text || 'Unable to respond.' })
    }

    // ── IMPACT STORY ───────────────────────────────────────────────────────────
    if (action === 'impact-story') {
      const { dataPoints } = body
      const text = await callClaude(
        `You are a master storyteller for nonprofit impact. Write vividly and specifically.`,
        `Transform these data points into a compelling impact story for a grant application:
${dataPoints}

Write 2-3 paragraphs that bring numbers to life through human stories while maintaining credibility.`,
        600
      )
      return respond({ story: text })
    }

    // ── REPORTING DRAFT ────────────────────────────────────────────────────────
    if (action === 'draft-report') {
      const { profile, grant, progressNotes } = body
      const text = await callClaude(
        `You are an expert at writing grant progress reports.`,
        `Write a progress report for:
Organization: ${profile?.name}
Grant: ${grant?.name} (${grant?.fundingAmount})
Progress notes: ${progressNotes}

Write a professional narrative report covering: activities completed, outcomes achieved, challenges and adaptations, and next steps.`,
        900
      )
      return respond({ report: text })
    }

    // ── COMPLIANCE TASKS ───────────────────────────────────────────────────────
    if (action === 'extract-compliance') {
      const { text: grantText } = body
      const result = await callClaude(
        `You are a grant compliance specialist. Return ONLY valid JSON.`,
        `Extract all compliance tasks and deadlines from this grant agreement text:
${grantText?.slice(0, 3000)}

Return JSON: { "tasks": [ { "description": string, "dueDate": string } ] }`,
        600
      )
      const parsed = parseJSON(result)
      return respond(parsed || { tasks: [] })
    }

    return { statusCode: 404, body: JSON.stringify({ error: `Unknown action: ${action}` }) }

  } catch (err) {
    console.error('AI function error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
