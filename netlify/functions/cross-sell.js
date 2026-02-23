// Grant Platform → UNLESS Ecosystem Cross-Sell
// Fires after subscription to recommend complementary platforms
// Called by subscribe.js after successful payment verification

const https = require('https')

const RESEND_KEY = process.env.RESEND_API_KEY
const ECOSYSTEM = {
  oracle: {
    name: 'ORACLE Intelligence',
    url: 'https://oracle-intelligence.netlify.app',
    hook: 'Your grants target specific markets — get deep market intelligence in 5 minutes.',
    cta: 'Get Market Intelligence →',
    price: 'Reports from $39',
  },
  atlas: {
    name: 'ATLAS Financial Models',
    url: 'https://unless-atlas-platform.netlify.app',
    hook: 'Grant budgets need financial projections. Generate investor-ready models instantly.',
    cta: 'Build Financial Model →',
    price: 'Models from $49',
  },
  clear: {
    name: 'CLEAR Intelligence',
    url: 'https://clear-platform.netlify.app',
    hook: 'Ongoing competitive analysis for the sectors you\'re seeking grants in.',
    cta: 'Start Analyzing →',
    price: 'Free to start',
  },
}

// Tier-specific recommendations
const TIER_RECS = {
  pro: ['oracle', 'atlas'],
  team: ['oracle', 'atlas', 'clear'],
}

async function sendCrossSellEmail(email, tier) {
  if (!RESEND_KEY || !email) return null

  const recs = (TIER_RECS[tier] || TIER_RECS.pro).map(id => ECOSYSTEM[id])

  const recCards = recs.map(r => `
    <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:16px;border-left:4px solid #F59E0B;">
      <h3 style="margin:0 0 6px 0;color:#1a1a2e;font-size:16px;">${r.name}</h3>
      <p style="margin:0 0 12px 0;color:#555;font-size:14px;line-height:1.5;">${r.hook}</p>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <a href="${r.url}?ref=grant-platform&tier=${tier}" style="background:#F59E0B;color:#1a1a2e;padding:8px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;">${r.cta}</a>
        <span style="color:#888;font-size:12px;">${r.price}</span>
      </div>
    </div>
  `).join('')

  const tierName = tier === 'team' ? 'Team' : 'Pro'

  const html = `
    <div style="max-width:560px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="padding:32px 24px;">
        <h1 style="font-size:22px;color:#1a1a2e;margin:0 0 8px 0;">Welcome to Grant Platform ${tierName} 🎉</h1>
        <p style="color:#666;margin:0 0 24px 0;font-size:15px;line-height:1.6;">
          Your subscription is active. To get the most from your grant work, 
          here are tools that pair perfectly with your new capabilities:
        </p>
        ${recCards}
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
        <p style="color:#999;font-size:12px;text-align:center;">
          UNLESS Ecosystem — AI-powered tools that work better together
        </p>
      </div>
    </div>
  `

  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      from: 'UNLESS Grants <grants@updates.oracleintelligence.net>',
      to: [email],
      subject: `Your Grant Platform ${tierName} is active — here's what pairs with it`,
      html,
    })
    const req = https.request({
      hostname: 'api.resend.com',
      path: '/emails',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      }
    }, res => {
      let d = ''
      res.on('data', c => d += c)
      res.on('end', () => resolve(JSON.parse(d)))
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

exports.handler = async (event) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  }

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors, body: '' }

  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: cors, body: '{"error":"POST only"}' }

  try {
    const { email, tier } = JSON.parse(event.body || '{}')
    if (!email) return { statusCode: 400, headers: cors, body: '{"error":"email required"}' }

    const recs = (TIER_RECS[tier || 'pro'] || TIER_RECS.pro).map(id => ({
      platform: ECOSYSTEM[id].name,
      url: `${ECOSYSTEM[id].url}?ref=grant-platform&tier=${tier || 'pro'}`,
      reason: ECOSYSTEM[id].hook,
      price: ECOSYSTEM[id].price,
    }))

    // Fire cross-sell email in background
    const emailResult = await sendCrossSellEmail(email, tier || 'pro').catch(() => null)

    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify({
        recommendations: recs,
        emailSent: !!emailResult?.id,
        ecosystem: 'UNLESS',
      })
    }
  } catch (err) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) }
  }
}
