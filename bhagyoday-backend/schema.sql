DROP TABLE IF EXISTS orders;

CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_name TEXT NOT NULL,
  phone TEXT,
  service TEXT NOT NULL,
  stylist TEXT NOT NULL,
  price REAL NOT NULL,
  payment_method TEXT DEFAULT 'Cash',
  status TEXT DEFAULT 'Completed',
  notes TEXT,
  appointment_date TEXT NOT NULL,
  appointment_time TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_appointment_date ON orders(appointment_date);
CREATE INDEX idx_orders_client_name ON orders(client_name);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  auth_provider TEXT DEFAULT 'email', -- 'email' or 'google'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME DEFAULT CURRENT_TIMESTAMP
);

