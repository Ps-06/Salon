import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

type Bindings = {
  DB: D1Database
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

  // MOCK: Always use '123456' as the OTP for testing
  const mockOtp = '123456';
  const expiresAt = new Date(Date.now() + 10 * 60000).toISOString(); // 10 mins validity

  await c.env.DB.prepare(
    'INSERT INTO otps (email, otp_code, expires_at) VALUES (?, ?, ?)'
  ).bind(email, mockOtp, expiresAt).run();

  // In a real app, you would call Resend/Sendgrid here.
  console.log(`[MOCK EMAIL] Sent OTP ${mockOtp} to ${email}`);

  return c.json({ message: 'OTP sent successfully (Check server logs)' });
});

app.post('/api/auth/verify-otp', async (c) => {
  const { email, otp } = await c.req.json();
  if (!email || !otp) return c.json({ error: 'Email and OTP required' }, 400);

  const record = await c.env.DB.prepare(
    'SELECT * FROM otps WHERE email = ? AND otp_code = ? AND used = 0 AND expires_at > CURRENT_TIMESTAMP ORDER BY id DESC LIMIT 1'
  ).bind(email, otp).first();

  if (!record) {
    return c.json({ error: 'Invalid or expired OTP' }, 401);
  }

  // Mark as used
  await c.env.DB.prepare('UPDATE otps SET used = 1 WHERE id = ?').bind(record.id).run();

  // Create or get user
  let user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  if (!user) {
    await c.env.DB.prepare('INSERT INTO users (email, auth_provider) VALUES (?, ?)').bind(email, 'email').run();
    user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  } else {
    await c.env.DB.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').bind(user.id).run();
  }

  return c.json({ message: 'Login successful', user, token: 'mock_jwt_token_123' });
});

app.post('/api/auth/google', async (c) => {
  const { token, email, name } = await c.req.json();
  // In a real app, verify the Google Token ID here using google-auth-library.

  let user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  if (!user) {
    await c.env.DB.prepare('INSERT INTO users (email, name, auth_provider) VALUES (?, ?, ?)').bind(email, name || 'Google User', 'google').run();
    user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
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
