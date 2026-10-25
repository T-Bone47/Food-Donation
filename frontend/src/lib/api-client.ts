import axios from 'axios';

// API client configuration
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
};

export const api = axios.create({
  baseURL: `${getApiBaseUrl()}/api/v1`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        // Don't redirect here - let the component handle it
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  signup: (data: Record<string, unknown>) => api.post('/auth/signup', data),
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateMe: (data: Record<string, unknown>) => api.patch('/auth/me', data),
  getUserByEmail: (email: string) => api.get(`/auth/users/${encodeURIComponent(email)}`),
};

// Donations API
export const donationsApi = {
  create: (data: Record<string, unknown>) => api.post('/donations', data),
  getMine: (params = {}) => api.get('/donations/mine', { params }),
  getAvailable: () => api.get('/donations/available'),
  getById: (id: string) => api.get(`/donations/${id}`),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/donations/${id}`, data),
  cancel: (id: string) => api.post(`/donations/${id}/cancel`),
  claim: (id: string) => api.post(`/donations/${id}/claim`),
  pickup: (id: string) => api.post(`/donations/${id}/pickup`),
  deliver: (id: string, ngoId: string) =>
    api.post(`/donations/${id}/deliver`, { ngo_id: ngoId }),
  confirmReceipt: (id: string) => api.post(`/donations/${id}/confirm-receipt`),
};

// Volunteer API
export const volunteerApi = {
  getTasks: () => api.get('/volunteer/tasks'),
  getDashboard: () => api.get('/volunteer/dashboard'),
  getImpact: () => api.get('/volunteer/impact'),
};

// NGO API
export const ngoApi = {
  submitVerification: (data: Record<string, unknown>) => api.post('/ngos/verification', data),
  getVerificationStatus: () => api.get('/ngos/verification'),
  getIncomingDeliveries: () => api.get('/ngos/incoming'),
  getHistory: () => api.get('/ngos/history'),
  getImpact: () => api.get('/ngos/impact'),
  getApprovedNGOs: () => api.get('/ngos/approved'),
};

// Admin API
export const adminApi = {
  getVerifications: (params = {}) => api.get('/admin/verifications', { params }),
  reviewVerification: (id: string, data: Record<string, unknown>) => api.patch(`/admin/verifications/${id}`, data),
  getUsers: (params = {}) => api.get('/admin/users', { params }),
  updateUserStatus: (id: string, status: string) => api.patch(`/admin/users/${id}`, { account_status: status }),
  getDonations: (params = {}) => api.get('/admin/donations', { params }),
  getDonationById: (id: string) => api.get(`/admin/donations/${id}`),
  expireDonation: (id: string) => api.post(`/admin/donations/${id}/expire`),
  getImpact: (params = {}) => api.get('/admin/impact', { params }),
  getAuditLogs: (params = {}) => api.get('/admin/audit-logs', { params }),
  processExpired: () => api.post('/admin/process-expired'),
};

// Notifications API
export const notificationsApi = {
  getAll: (params = {}) => api.get('/notifications', { params }),
  markRead: (id: string) => api.post(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
};

// Impact API
export const impactApi = {
  getPersonal: () => api.get('/impact/me'),
  getDonorStats: () => api.get('/impact/donor'),
  getVolunteerStats: () => api.get('/impact/volunteer'),
};

// Health API
export const healthApi = {
  check: () => api.get('/health'),
  ready: () => api.get('/health/ready'),
};

export default api;