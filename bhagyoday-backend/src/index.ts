import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

type Bindings = {
  DB: D1Database
  BREVO_API_KEY: string
  OTP_SIGNING_SECRET?: string
  GOOGLE_CLIENT_ID?: string
}

type Order = {
  id?: number
  client_name: string
  phone?: string
  service: string
  stylist: string
  price: number
  payment_method?: string
  status?: string
  notes?: string
  appointment_date: string
  appointment_time: string
  created_at?: string
  updated_at?: string
}

type OtpSessionPayload = {
  type: 'signup_otp_v1'
  email: string
  name?: string
  passwordHash?: string
  otpHash: string
  expiry: number
}

type GoogleTokenInfo = {
  aud?: string
  azp?: string
  email?: string
  email_verified?: string | boolean
  name?: string
  given_name?: string
  family_name?: string
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()

const normalizeEmail = (email: string) => email.trim().toLowerCase()

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const generateOTP = () => {
  const buffer = new Uint32Array(1)
  crypto.getRandomValues(buffer)
  return (buffer[0] % 1000000).toString().padStart(6, '0')
}

const hash = async (value: string) => {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value))
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

const timingSafeEqual = (a: string, b: string) => {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

const parseAuthProviders = (provider?: string | null) => {
  if (!provider) return []
  return provider
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
}

const hasAuthProvider = (provider: string | null | undefined, target: string) =>
  parseAuthProviders(provider).includes(target.toLowerCase())

const mergeAuthProviders = (provider: string | null | undefined, target: string) => {
  const set = new Set(parseAuthProviders(provider))
  set.add(target.toLowerCase())
  return Array.from(set).join(',')
}

const getGoogleClientId = (env: Bindings) => {
  if (!env.GOOGLE_CLIENT_ID) throw new Error('GOOGLE_CLIENT_ID is not configured')
  return env.GOOGLE_CLIENT_ID
}

const verifyGoogleIdToken = async (env: Bindings, idToken: string) => {
  const clientId = getGoogleClientId(env)
  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
  )
  if (!response.ok) return null

  const data = (await response.json()) as GoogleTokenInfo
  if (data.aud !== clientId) return null

  const emailVerified = data.email_verified === true || data.email_verified === 'true'
  if (!emailVerified || !data.email) return null

  const name = data.name || [data.given_name, data.family_name].filter(Boolean).join(' ')
  return { email: data.email, name: name || undefined }
}

const base64UrlEncode = (input: Uint8Array | string) => {
  const bytes = typeof input === 'string' ? encoder.encode(input) : input
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

const base64UrlDecode = (input: string) => {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

const getOtpSigningSecret = (env: Bindings) => {
  const secret = env.OTP_SIGNING_SECRET || env.BREVO_API_KEY
  if (!secret) throw new Error('OTP signing secret is not configured')
  return secret
}

const signOtpSession = async (env: Bindings, payload: OtpSessionPayload) => {
  const secret = getOtpSigningSecret(env)
  const payloadBase64 = base64UrlEncode(JSON.stringify(payload))
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadBase64))
  const signatureBase64 = base64UrlEncode(new Uint8Array(signature))
  return `${payloadBase64}.${signatureBase64}`
}

const verifyOtpSession = async (env: Bindings, token: string) => {
  const secret = getOtpSigningSecret(env)
  const parts = token.split('.')
  if (parts.length !== 2) return null

  const [payloadBase64, signatureBase64] = parts
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )

  const signatureBytes = base64UrlDecode(signatureBase64)
  const isValid = await crypto.subtle.verify(
    'HMAC',
    key,
    signatureBytes,
    encoder.encode(payloadBase64)
  )
  if (!isValid) return null

  const payloadBytes = base64UrlDecode(payloadBase64)
  const payloadJson = decoder.decode(payloadBytes)
  return JSON.parse(payloadJson) as OtpSessionPayload
}

const sendOtpEmail = async (env: Bindings, email: string, otp: string) => {
  if (!env.BREVO_API_KEY) throw new Error('BREVO_API_KEY is not configured')

  const senderEmail =  'soulcord.dynamics@gmail.com'
  const senderName = 'Bhagyoday Parlour'

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; color: #111; line-height: 1.5;">
      <h2 style="margin: 0 0 12px;">Your Bhagyoday Parlour Login Code</h2>
      <p style="margin: 0 0 16px;">Use the code below to sign in. It expires in 5 minutes.</p>
      <div style="font-size: 24px; font-weight: bold; letter-spacing: 4px; padding: 12px 16px; background: #f5f5f5; display: inline-block; border-radius: 8px;">
        ${otp}
      </div>
      <p style="margin: 16px 0 0; color: #555;">If you did not request this, you can ignore this email.</p>
    </div>
  `.trim()

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': env.BREVO_API_KEY,
      'content-type': 'application/json',
      accept: 'application/json'
    },
    body: JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      to: [{ email }],
      subject: 'Your Bhagyoday Parlour login code',
      htmlContent,
      textContent: `Your Bhagyoday Parlour login code is ${otp}. It expires in 5 minutes.`
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Brevo email failed: ${errorText}`)
  }
}

const app = new Hono<{ Bindings: Bindings }>()

// Middleware
app.use('*', logger())
app.use('/api/*', cors({
  origin: '*', // Adjust this for production security
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}))

// Error handling
app.onError((err, c) => {
  console.error(`${err}`)
  return c.json({ error: 'Internal Server Error', message: err.message }, 500)
})


// --- AUTHENTICATION (MOCKED) ---

app.post('/api/auth/send-otp', async (c) => {
  const { email } = await c.req.json();
  if (!email) return c.json({ error: 'Email is required' }, 400);

  const normalizedEmail = normalizeEmail(email)
  if (!isValidEmail(normalizedEmail)) {
    return c.json({ error: 'Invalid email address' }, 400)
  }

  const otp = generateOTP()
  const otpHash = await hash(otp)
  const expiry = Date.now() + 5 * 60 * 1000

  const otpSession = await signOtpSession(c.env, {
    type: 'signup_otp_v1',
    email: normalizedEmail,
    otpHash,
    expiry
  })

  await sendOtpEmail(c.env, normalizedEmail, otp)

  const existingUser = await c.env.DB
    .prepare('SELECT auth_provider FROM users WHERE email = ?')
    .bind(normalizedEmail)
    .first()

  const accountLinkedWithGoogle = existingUser
    ? hasAuthProvider(existingUser.auth_provider as string | null | undefined, 'google') &&
      !hasAuthProvider(existingUser.auth_provider as string | null | undefined, 'email')
    : false

  return c.json({
    message: 'OTP sent successfully',
    otpSession,
    expiresAt: expiry,
    accountLinkedWithGoogle
  })
});

app.post('/api/auth/verify-otp', async (c) => {
  const { email, otp, otpSession, linkGoogle } = await c.req.json();
  if (!email || !otp || !otpSession) {
    return c.json({ error: 'Email, OTP, and session required' }, 400)
  }

  const normalizedEmail = normalizeEmail(email)
  if (!isValidEmail(normalizedEmail)) {
    return c.json({ error: 'Invalid email address' }, 400)
  }

  const session = await verifyOtpSession(c.env, otpSession)
  if (!session || session.type !== 'signup_otp_v1') {
    return c.json({ error: 'Invalid or expired OTP session' }, 401)
  }

  if (session.email !== normalizedEmail || Date.now() > session.expiry) {
    return c.json({ error: 'Invalid or expired OTP' }, 401)
  }

  const otpValue = String(otp).trim()
  const otpHash = await hash(otpValue)
  if (!timingSafeEqual(otpHash, session.otpHash)) {
    return c.json({ error: 'Invalid or expired OTP' }, 401)
  }

  // Create or get user
  let user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(normalizedEmail).first();
  if (!user) {
    await c.env.DB.prepare('INSERT INTO users (email, auth_provider) VALUES (?, ?)').bind(normalizedEmail, 'email').run();
    user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(normalizedEmail).first();
  } else {
    const shouldLinkEmail =
      Boolean(linkGoogle) &&
      hasAuthProvider(user.auth_provider as string | null | undefined, 'google') &&
      !hasAuthProvider(user.auth_provider as string | null | undefined, 'email')

    if (shouldLinkEmail) {
      const updatedProvider = mergeAuthProviders(user.auth_provider as string | null | undefined, 'email')
      await c.env.DB
        .prepare('UPDATE users SET auth_provider = ?, last_login = CURRENT_TIMESTAMP WHERE id = ?')
        .bind(updatedProvider, user.id)
        .run()
    } else {
      await c.env.DB.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').bind(user.id).run()
    }
  }

  return c.json({ message: 'Login successful', user, token: 'mock_jwt_token_123' });
});

app.post('/api/auth/google', async (c) => {
  const { idToken, token, email, name } = await c.req.json();
  const providedToken = idToken || token

  let resolvedEmail = email
  let resolvedName = name

  if (providedToken) {
    const profile = await verifyGoogleIdToken(c.env, providedToken)
    if (!profile) return c.json({ error: 'Invalid Google token' }, 401)
    resolvedEmail = profile.email
    resolvedName = profile.name || resolvedName
  }

  if (!resolvedEmail) return c.json({ error: 'Google token required' }, 400)

  const normalizedEmail = normalizeEmail(resolvedEmail)
  if (!isValidEmail(normalizedEmail)) {
    return c.json({ error: 'Invalid email address' }, 400)
  }

  let user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(normalizedEmail).first();
  if (!user) {
    await c.env.DB
      .prepare('INSERT INTO users (email, name, auth_provider) VALUES (?, ?, ?)')
      .bind(normalizedEmail, resolvedName || 'Google User', 'google')
      .run();
    user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(normalizedEmail).first();
  } else {
    const shouldLinkGoogle = !hasAuthProvider(user.auth_provider as string | null | undefined, 'google')

    if (shouldLinkGoogle) {
      const updatedProvider = mergeAuthProviders(user.auth_provider as string | null | undefined, 'google')
      await c.env.DB
        .prepare('UPDATE users SET auth_provider = ?, last_login = CURRENT_TIMESTAMP WHERE id = ?')
        .bind(updatedProvider, user.id)
        .run()
    } else {
      await c.env.DB.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').bind(user.id).run()
    }
  }

  return c.json({ message: 'Google Login successful', user, token: 'mock_jwt_token_google' });
});

// --- EXISTING ENDPOINTS ---

// 1. Health check
app.get('/', (c) => {
  return c.json({ 
    salon: 'Bhagyoday Parlour API',
    status: 'healthy',
    timestamp: new Date().toISOString()
  })
})

// 2. List orders with filters
app.get('/api/orders', async (c) => {
  const { date, search, status, limit = '50', offset = '0' } = c.req.query()
  
  let query = 'SELECT * FROM orders WHERE 1=1'
  const params: any[] = []

  if (date) {
    query += ' AND appointment_date = ?'
    params.push(date)
  }
  if (status) {
    query += ' AND status = ?'
    params.push(status)
  }
  if (search) {
    query += ' AND (client_name LIKE ? OR phone LIKE ?)'
    params.push(`%${search}%`, `%${search}%`)
  }

  query += ' ORDER BY appointment_date DESC, appointment_time DESC LIMIT ? OFFSET ?'
  params.push(Number(limit), Number(offset))

  const { results } = await c.env.DB.prepare(query).bind(...params).all()
  
  // Get total count for pagination
  let countQuery = 'SELECT COUNT(*) as total FROM orders WHERE 1=1'
  const countParams: any[] = []
  if (date) { countQuery += ' AND appointment_date = ?'; countParams.push(date); }
  if (status) { countQuery += ' AND status = ?'; countParams.push(status); }
  if (search) { countQuery += ' AND (client_name LIKE ? OR phone LIKE ?)'; countParams.push(`%${search}%`, `%${search}%`); }
  
  const countResult = await c.env.DB.prepare(countQuery).bind(...countParams).first()
  
  return c.json({
    data: results,
    pagination: {
      total: countResult?.total || 0,
      limit: Number(limit),
      offset: Number(offset)
    }
  })
})

// 3. Get single order
app.get('/api/orders/:id', async (c) => {
  const id = c.req.param('id')
  const order = await c.env.DB
    .prepare('SELECT * FROM orders WHERE id = ?')
    .bind(id)
    .first()

  if (!order) return c.json({ error: 'Order not found' }, 404)
  return c.json(order)
})

// 4. Create order
app.post('/api/orders', async (c) => {
  try {
    const body = await c.req.json<Order>()
    
    // Basic Validation
    if (!body.client_name || !body.service || !body.stylist || body.price === undefined || !body.appointment_date || !body.appointment_time) {
      return c.json({ error: 'Missing required fields' }, 400)
    }

    const { success } = await c.env.DB.prepare(
      `INSERT INTO orders (client_name, phone, service, stylist, price, payment_method, status, notes, appointment_date, appointment_time) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      body.client_name,
      body.phone || null,
      body.service,
      body.stylist,
      body.price,
      body.payment_method || 'Cash',
      body.status || 'Pending', // Changed default slightly to be more realistic for new appointments
      body.notes || null,
      body.appointment_date,
      body.appointment_time
    ).run()

    if (success) {
      return c.json({ message: 'Order created successfully' }, 201)
    } else {
      return c.json({ error: 'Failed to create order' }, 500)
    }
  } catch (error) {
    return c.json({ error: 'Invalid payload' }, 400)
  }
})

// 5. Update order
app.put('/api/orders/:id', async (c) => {
  const id = c.req.param('id')
  
  // Check if exists
  const existing = await c.env.DB.prepare('SELECT id FROM orders WHERE id = ?').bind(id).first()
  if (!existing) return c.json({ error: 'Order not found' }, 404)

  try {
    const body = await c.req.json<Partial<Order>>()
    
    // Dynamically build update query
    const updates: string[] = []
    const params: any[] = []

    const updatableFields = ['client_name', 'phone', 'service', 'stylist', 'price', 'payment_method', 'status', 'notes', 'appointment_date', 'appointment_time']
    
    for (const field of updatableFields) {
      if (body[field as keyof Order] !== undefined) {
        updates.push(`${field} = ?`)
        params.push(body[field as keyof Order])
      }
    }

    if (updates.length === 0) return c.json({ error: 'No fields to update' }, 400)

    updates.push("updated_at = CURRENT_TIMESTAMP")
    params.push(id) // for WHERE clause

    const query = `UPDATE orders SET ${updates.join(', ')} WHERE id = ?`
    
    const { success } = await c.env.DB.prepare(query).bind(...params).run()
    
    if (success) return c.json({ message: 'Order updated successfully' })
    return c.json({ error: 'Failed to update order' }, 500)
  } catch (error) {
    return c.json({ error: 'Invalid payload' }, 400)
  }
})

// 6. Delete order
app.delete('/api/orders/:id', async (c) => {
  const id = c.req.param('id')
  const { success } = await c.env.DB
    .prepare('DELETE FROM orders WHERE id = ?')
    .bind(id)
    .run()

  if (success) return c.json({ message: 'Order deleted successfully' })
  return c.json({ error: 'Failed to delete order or order not found' }, 404)
})

// 7. Get dashboard stats
app.get('/api/stats', async (c) => {
  const db = c.env.DB
  
  // SQLite DATE function helps with basic date groupings
  // ONLY COUNT 'Completed' orders for revenue and performance statistics
  const queries = [
    // Today's Stats
    db.prepare("SELECT COUNT(*) as count, SUM(price) as revenue FROM orders WHERE appointment_date = date('now') AND status = 'Completed'"),
    // This Week's Stats
    db.prepare("SELECT COUNT(*) as count, SUM(price) as revenue FROM orders WHERE appointment_date >= date('now', '-7 days') AND status = 'Completed'"),
    // All Time Stats
    db.prepare("SELECT COUNT(*) as count, SUM(price) as revenue FROM orders WHERE status = 'Completed'"),
    // Top Services
    db.prepare("SELECT service, COUNT(*) as count FROM orders WHERE status = 'Completed' GROUP BY service ORDER BY count DESC LIMIT 5"),
    // Stylist Performance
    db.prepare("SELECT stylist, COUNT(*) as count, SUM(price) as revenue FROM orders WHERE status = 'Completed' GROUP BY stylist ORDER BY revenue DESC")
  ]

  const [today, week, allTime, topServices, stylists] = await db.batch(queries)

  return c.json({
    today: today.results[0] || { count: 0, revenue: 0 },
    this_week: week.results[0] || { count: 0, revenue: 0 },
    all_time: allTime.results[0] || { count: 0, revenue: 0 },
    top_services: topServices.results,
    stylist_performance: stylists.results
  })
})

export default app