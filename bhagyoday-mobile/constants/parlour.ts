export const API_BASE_URL = "https://bhagyoday-api.sabhayaparth06.workers.dev"; // Replace with your actual Cloudflare Worker URL

export const SERVICES = [
  "Haircut (Basic)",
  "Haircut (Advanced)",
  "Hair Wash & Blow Dry",
  "Hair Spa",
  "Keratin Treatment",
  "Hair Coloring (Global)",
  "Root Touch Up",
  "Hair Highlights",
  "Threading (Eyebrows/Upper Lip)",
  "Waxing (Half Legs/Arms)",
  "Waxing (Full Body)",
  "Bikini Wax",
  "Bleach / De-tan",
  "Basic Facial",
  "Advanced Facial (Anti-Aging/Acne)",
  "O3+ Facial",
  "Bridal Makeup",
  "Party Makeup",
  "Engagement Makeup",
  "Mehendi (Basic)",
  "Bridal Mehendi",
  "Manicure",
  "Pedicure",
  "Nail Art / Extensions",
  "Head Massage",
  "Body Massage",
  "Saree Draping",
  "Hair Styling / Updo"
];

export const STYLISTS = [
  "Priya",
  "Anjali",
  "Meera",
  "Kavita",
  "Owner",
  "Other"
];

export const PAYMENT_METHODS = [
  "Cash",
  "Credit Card",
  "Debit Card",
  "UPI",
  "Paytm",
  "PhonePe",
  "Pending"
];

export const ORDER_STATUSES = [
  "Pending",
  "In Progress",
  "Completed",
  "Cancelled"
];

export const STATUS_COLORS: Record<string, string> = {
  "Pending": "#FF9800",      // Orange
  "In Progress": "#2196F3",  // Blue
  "Completed": "#4CAF50",    // Green
  "Cancelled": "#F44336"     // Red
};

export const THEME = {
  colors: {
    primary: "#C2185B",        // Deep Pink/Rose (Bhagyoday Branding)
    primaryLight: "#F06292",
    primaryDark: "#880E4F",
    secondary: "#FFB300",      // Amber/Gold
    background: "#F8F9FA",     // Light gray background
    surface: "#FFFFFF",        // Card backgrounds
    text: "#212121",           // Main text
    textSecondary: "#757575",  // Subtitles / placeholders
    border: "#E0E0E0",         // Dividers and borders
    error: "#D32F2F",          // Error states
    success: "#388E3C",        // Success states
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    pill: 9999,
  }
};
