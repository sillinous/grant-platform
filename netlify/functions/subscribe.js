const https = require('https')

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY
const BASE_URL = process.env.URL || 'https://unless-fortuna-grants.netlify.app'

const PRICES = {
  pro:  'price_1T40hc6XLHH1oci1NXMMr4Hu',
  team: 'price_1T40hd6XLHH1oci1JkPoQmmV',
}

function stripePost(path, data) {
  return new Promise((resolve, reject) => {
    const body = Object.entries(data)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&')
    const req = https.request({
      hostname: 'api.stripe.com',
      path: `/v1/${path}`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
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
  }

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors, body: '' }

  if (event.httpMethod === 'GET') {
    // Redirect to checkout
    const plan = event.queryStringParameters?.plan || 'pro'
    const email = event.queryStringParameters?.email || ''
    const priceId = PRICES[plan]
    if (!priceId) return { statusCode: 400, body: 'Invalid plan' }

    const session = await stripePost('checkout/sessions', {
      'mode': 'subscription',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      'success_url': `${BASE_URL}/?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
      'cancel_url': `${BASE_URL}/?upgrade=cancelled`,
      ...(email ? { 'customer_email': email } : {}),
      'allow_promotion_codes': 'true',
      'billing_address_collection': 'auto',
    })

    if (session.url) {
      return { statusCode: 302, headers: { ...cors, Location: session.url }, body: '' }
    }
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: session.error?.message }) }
  }

  if (event.httpMethod === 'POST') {
    // Verify session after return
    const { session_id } = JSON.parse(event.body || '{}')
    if (!session_id) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'No session_id' }) }

    const session = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'api.stripe.com',
        path: `/v1/checkout/sessions/${session_id}?expand[]=subscription`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${STRIPE_KEY}` }
      }, res => {
        let d = ''
        res.on('data', c => d += c)
        res.on('end', () => resolve(JSON.parse(d)))
      })
      req.on('error', reject)
      req.end()
    })

    if (session.payment_status === 'paid' || session.status === 'complete') {
      const sub = session.subscription
      const tier = sub?.items?.data?.[0]?.price?.id === PRICES.team ? 'team' : 'pro'
      const email = session.customer_details?.email || session.customer_email || ''
      const expiresAt = (sub?.current_period_end || Math.floor(Date.now()/1000) + 2592000) * 1000

      // Fire ecosystem cross-sell in background (non-blocking)
      if (email) {
        fetch(`${BASE_URL}/.netlify/functions/cross-sell`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, tier }),
        }).catch(() => {}) // fire-and-forget
      }

      return {
        statusCode: 200,
        headers: { ...cors, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true, tier, email, expiresAt })
      }
    }
    return {
      statusCode: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, status: session.payment_status })
    }
  }

  return { statusCode: 405, body: 'Method not allowed' }
}
