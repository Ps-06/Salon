# Bhagyoday Parlour - Beauty Salon Management App

A full-stack React Native + Cloudflare Workers application for managing beauty salon operations, including order management, staff performance tracking, and real-time analytics.

## 🎯 Features

### Dashboard
- Real-time revenue statistics (Today, This Week, All-Time)
- Order count tracking
- Top services analytics
- Stylist performance metrics
- Auto-refreshes when screen is focused

### Order Management
- Create new orders with service, stylist, date/time selection
- Search and filter orders (All, Pending, In Progress, Completed, Cancelled)
- Swipe actions:
  - **Right swipe**: Change order status
  - **Left swipe**: Delete order (with fade effect)
- Pull-to-refresh functionality
- Infinite scroll pagination

### Authentication
- Email OTP verification
- Google Sign-In (mock)
- Session management with AsyncStorage
- Protected routes

### Business Reports
- Detailed revenue breakdown
- Stylist leaderboard with performance progress bars
- Service popularity tracking
- Analytics based on completed orders only

### User Account
- Profile information display
- Account settings access
- Logout functionality

## 📱 Tech Stack

### Backend
- **Cloudflare Workers** - Serverless API
- **Cloudflare D1** - SQLite database
- **Hono.js** - Lightweight web framework

### Mobile
- **React Native** - Cross-platform mobile framework
- **Expo** - Development platform (SDK 54)
- **Expo Router** - File-based routing
- **TypeScript** - Type safety
- **React Hook Form** - Form state management
- **Axios** - HTTP client
- **AsyncStorage** - Local data persistence
- **React Native Gesture Handler** - Swipe gestures
- **Expo Linear Gradient** - Gradient backgrounds
- **Expo Vector Icons** - Icon library

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Cloudflare account
- Expo Go app (for mobile testing)

### Backend Setup

```bash
cd bhagyoday-backend

# Install dependencies
npm install

# Login to Cloudflare
npx wrangler login

# Create D1 database
npx wrangler d1 create bhagyoday_db

# Update wrangler.toml with the database_id returned above

# Deploy schema to database
npx wrangler d1 execute bhagyoday_db --remote --file=./schema.sql

# Deploy the Worker
npm run deploy
```

Note the deployed URL (e.g., `https://bhagyoday-api.YOUR_SUBDOMAIN.workers.dev`)

### Mobile Setup

```bash
cd bhagyoday-mobile

# Install dependencies
npm install

# Update API_BASE_URL in constants/parlour.ts
# Replace with your Cloudflare Worker URL

# Start development server
npx expo start --clear

# Scan QR code with Expo Go app on your phone
```

## 📸 Screen Structure

```
/
├── login                    # Authentication screen
├── index                    # Dashboard (main screen)
├── orders                   # Orders list
├── new-order               # Create new order
├── reports                 # Business analytics
└── account                 # User profile
```

## 🔧 API Endpoints

### Orders
- `GET /api/orders` - Get all orders (with search, filters, pagination)
- `GET /api/orders/:id` - Get single order
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Delete order

### Statistics
- `GET /api/stats` - Get dashboard statistics (only completed orders)

### Authentication
- `POST /api/auth/send-otp` - Send OTP to email
- `POST /api/auth/verify-otp` - Verify OTP and login
- `POST /api/auth/google` - Google Sign-In

## 💾 Database Schema

### users
- `id` - Primary key
- `email` - Unique email address
- `name` - User name
- `auth_provider` - 'email' or 'google'
- `created_at` - Account creation timestamp
- `last_login` - Last login timestamp

### otps
- `id` - Primary key
- `email` - Email address
- `otp_code` - 6-digit code
- `expires_at` - Expiration timestamp
- `used` - Boolean flag

### orders
- `id` - Primary key
- `client_name` - Customer name
- `phone` - Contact number (10 digits, Indian format)
- `service` - Service name
- `stylist` - Staff member name
- `price` - Service cost (₹)
- `payment_method` - Cash, UPI, Paytm, PhonePe, etc.
- `status` - Pending, In Progress, Completed, Cancelled
- `notes` - Additional details
- `appointment_date` - Service date (YYYY-MM-DD)
- `appointment_time` - Service time (HH:MM)
- `created_at` - Order creation timestamp
- `updated_at` - Last update timestamp

## 🎨 Theme & Styling

The app uses a cohesive Indian beauty salon theme with:
- **Primary Color**: #C2185B (Deep Pink)
- **Secondary Color**: #FF9800 (Orange)
- **Background**: Light gray (#F5F5F5)
- **Surface**: White (#FFFFFF)
- **Currency**: Indian Rupee (₹)

## 📊 Important Notes

- **Revenue Tracking**: Only "Completed" orders are counted in dashboard stats
- **Real-time Updates**: Dashboard auto-refreshes when you return to it
- **Swipe Gestures**: Right = Status Change, Left = Delete
- **OTP Testing**: Default test OTP is `123456`
- **Phone Format**: Supports Indian phone numbers (10 digits starting with 6-9)

## 🔐 Security

- Authentication tokens stored in secure AsyncStorage
- Session persistence across app restarts
- Protected routes requiring login
- OTP expiration (10 minutes)
- Status validation on backend

## 📦 Building for Production

### Android APK
```bash
cd bhagyoday-mobile
eas build -p android --profile preview
```

### iOS App
```bash
cd bhagyoday-mobile
eas build -p ios
```

(Requires Apple Developer Account for iOS)

## 🤝 Contributing

Feel free to fork and submit pull requests for improvements!

## 📝 License

This project is open source and available under the MIT License.

## 👨‍💼 Author

Built with Bhagyoday Parlour in mind - Supporting small beauty businesses with modern technology.

---

**Status**: Fully functional and ready for deployment ✅
