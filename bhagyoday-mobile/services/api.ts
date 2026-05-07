import axios from 'axios';
import { API_BASE_URL } from '../constants/parlour';

// --- Types ---

export interface Order {
  id?: number;
  client_name: string;
  phone?: string;
  service: string;
  stylist: string;
  price: number;
  payment_method?: string;
  status?: string;
  notes?: string;
  appointment_date: string;
  appointment_time: string;
  created_at?: string;
  updated_at?: string;
}

export interface OrdersResponse {
  data: Order[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface StatItem {
  count: number;
  revenue: number;
}

export interface DashboardStats {
  today: StatItem;
  this_week: StatItem;
  all_time: StatItem;
  top_services: Array<{ service: string; count: number }>;
  stylist_performance: Array<{ stylist: string; count: number; revenue: number }>;
}

// --- Axios Instance Setup ---

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Interceptors ---

apiClient.interceptors.request.use(
  (config) => {
    //console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    //if (config.params) console.log('Params:', config.params);
    //if (config.data) console.log('Body:', config.data);
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    //console.log(`[API Response] ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(`[API Error] ${error.response.status} ${error.config.url}:`, error.response.data);
    } else if (error.request) {
      console.error(`[API Error] No response received for ${error.config.url}`);
    } else {
      console.error(`[API Error] Setup error: ${error.message}`);
    }
    return Promise.reject(error);
  }
);

// --- API Functions ---

const handleApiError = (error: any, customMessage: string) => {
  const message = error.response?.data?.error || error.message || 'Unknown error occurred';
  throw new Error(`${customMessage}: ${message}`);
};

export const api = {
  // Get all orders with optional filters
  getOrders: async (params?: { date?: string; search?: string; status?: string; limit?: number; offset?: number }): Promise<OrdersResponse> => {
    try {
      const response = await apiClient.get<OrdersResponse>('/api/orders', { params });
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Failed to fetch orders');
    }
  },

  // Get a single order by ID
  getOrder: async (id: number | string): Promise<Order> => {
    try {
      const response = await apiClient.get<Order>(`/api/orders/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error, `Failed to fetch order ${id}`);
    }
  },

  // Create a new order
  createOrder: async (order: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Promise<{ message: string }> => {
    try {
      const response = await apiClient.post<{ message: string }>('/api/orders', order);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Failed to create order');
    }
  },

  // Update an existing order
  updateOrder: async (id: number | string, updates: Partial<Order>): Promise<{ message: string }> => {
    try {
      const response = await apiClient.put<{ message: string }>(`/api/orders/${id}`, updates);
      return response.data;
    } catch (error) {
      return handleApiError(error, `Failed to update order ${id}`);
    }
  },

  // Delete an order
  deleteOrder: async (id: number | string): Promise<{ message: string }> => {
    try {
      const response = await apiClient.delete<{ message: string }>(`/api/orders/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error, `Failed to delete order ${id}`);
    }
  },

  // Get dashboard statistics
  getStats: async (): Promise<DashboardStats> => {
    try {
      const response = await apiClient.get<DashboardStats>('/api/stats');
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Failed to fetch dashboard stats');
    }
  }
};

// --- Auth Endpoints ---
export const authApi = {
  sendOtp: async (email: string) => {
    const res = await apiClient.post('/api/auth/send-otp', { email });
    return res.data;
  },
  verifyOtp: async (email: string, otp: string, otpSession: string, linkGoogle = false) => {
    const res = await apiClient.post('/api/auth/verify-otp', {
      email,
      otp,
      otpSession,
      linkGoogle
    });
    return res.data;
  },
  googleLogin: async (idToken: string, email?: string, name?: string) => {
    const res = await apiClient.post('/api/auth/google', { idToken, email, name });
    return res.data;
  }
};
