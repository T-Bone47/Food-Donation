import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { unwrapEnvelope } from './api-envelope';
import type {
  AccountStatus,
  AdminDonationDetail,
  AdminDonationRow,
  AdminUser,
  AggregateImpact,
  AppNotification,
  ApprovedNgo,
  Assignment,
  AuditLog,
  AuthUser,
  Donation,
  DonorStats,
  IncomingDelivery,
  NgoHistoryItem,
  NgoProfile,
  NgoVerificationRequest,
  PersonalImpact,
  ProfileUser,
  VolunteerDashboardStats,
  VolunteerTask,
} from './types';

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

// Cache & Deduplication Store
const inFlightRequests = new Map<string, Promise<unknown>>();
const responseCache = new Map<string, { timestamp: number; data: unknown }>();
const CACHE_TTL_MS = 2500; // 2.5s safe idempotent cache for rapid navigations

export function clearApiCache(): void {
  inFlightRequests.clear();
  responseCache.clear();
}

// Request Interceptor: Attach Auth Token and Deduplicate/Cache Idempotent Reads
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  // Deduplicate and short-circuit identical in-flight GET requests
  const method = config.method?.toLowerCase();
  if (method === 'get') {
    const cacheKey = `${config.url}?${JSON.stringify(config.params || {})}`;

    // Return cached response if fresh
    const cached = responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      config.adapter = async () => ({
        data: cached.data,
        status: 200,
        statusText: 'OK (Cached)',
        headers: {},
        config,
      });
      return config;
    }

    // Join identical in-flight requests
    if (inFlightRequests.has(cacheKey)) {
      config.adapter = async () => inFlightRequests.get(cacheKey) as any;
      return config;
    }
  }

  return config;
});

// Response Interceptor: Unwrap standard API envelope so
// caller reads `res.data.<payload>`. Invalidate cache on mutations.
api.interceptors.response.use(
  (response) => {
    const method = response.config?.method?.toLowerCase();
    if (method && ['post', 'put', 'patch', 'delete'].includes(method)) {
      clearApiCache();
    }
    response.data = unwrapEnvelope(response.data);
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        clearApiCache();
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  signup: (data: Record<string, unknown>) => api.post<{ user: AuthUser; token: string }>('/auth/signup', data),
  login: (emailOrCreds: string | { email: string; password: string }, maybePassword?: string) => {
    if (typeof emailOrCreds === 'object') {
      return api.post<{ user: AuthUser; token: string }>('/auth/login', emailOrCreds);
    }
    return api.post<{ user: AuthUser; token: string }>('/auth/login', { email: emailOrCreds, password: maybePassword });
  },
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get<{ user: ProfileUser }>('/auth/me'),
  updateMe: (data: Record<string, unknown>) => api.patch<{ user: ProfileUser }>('/auth/me', data),
  getUserByEmail: (email: string) => api.get(`/auth/users/${encodeURIComponent(email)}`),
};

// Donations API
export const donationsApi = {
  create: (data: Record<string, unknown>) => api.post<{ donation: Donation }>('/donations', data),
  getMine: (params: { status?: string; limit?: number; offset?: number } = {}) =>
    api.get<{ donations: Donation[] }>('/donations/mine', { params }),
  getAvailable: () => api.get<{ donations: Donation[] }>('/donations/available'),
  getById: (id: string) => api.get<{ donation: Donation }>(`/donations/${id}`),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/donations/${id}`, data),
  cancel: (id: string) => api.post<{ donation: Donation }>(`/donations/${id}/cancel`),
  claim: (id: string) =>
    api.post<{ donation: Donation; assignment: Assignment }>(`/donations/${id}/claim`),
  pickup: (id: string) => api.post<{ donation: Donation }>(`/donations/${id}/pickup`),
  // `ngoId` is the NGO's user id (ApprovedNgo.user_id), not the ngo_profiles id.
  deliver: (id: string, ngoId?: string) =>
    api.post<{ donation: Donation }>(`/donations/${id}/deliver`, { ngo_id: ngoId || 'ngo-demo-id' }),
  confirmReceipt: (id: string, data?: Record<string, unknown>) =>
    api.post<{ donation: Donation }>(`/donations/${id}/confirm-receipt`, data || {}),
};

// Volunteer API
export const volunteerApi = {
  getTasks: (params = {}) => api.get<{ tasks: VolunteerTask[] }>('/volunteer/tasks', { params }),
  getDashboard: () => api.get<{ stats: VolunteerDashboardStats }>('/volunteer/dashboard'),
  getImpact: () => api.get<{ impact: PersonalImpact }>('/volunteer/impact'),
  claimTask: (id: string) => donationsApi.claim(id),
  confirmPickup: (id: string) => donationsApi.pickup(id),
  confirmDelivery: (id: string, ngoId?: string) => donationsApi.deliver(id, ngoId),
};

// NGO API
export const ngoApi = {
  submitVerification: (data: Record<string, unknown>) =>
    api.post<{ profile: NgoProfile }>('/ngos/verification', data),
  getVerificationStatus: () => api.get<{ profile: NgoProfile | null }>('/ngos/verification'),
  getIncomingDeliveries: () => api.get<{ deliveries: IncomingDelivery[] }>('/ngos/incoming'),
  getIncoming: () => api.get<{ deliveries: IncomingDelivery[] }>('/ngos/incoming'),
  getHistory: (params = {}) => api.get<{ history: NgoHistoryItem[] }>('/ngos/history', { params }),
  getImpact: () => api.get<{ impact: PersonalImpact }>('/ngos/impact'),
  getApprovedNGOs: () => api.get<{ ngos: ApprovedNgo[] }>('/ngos/approved'),
  confirmReceipt: (id: string, data?: Record<string, unknown>) => donationsApi.confirmReceipt(id, data),
};

// Admin API
export const adminApi = {
  getVerifications: (params = {}) =>
    api.get<{ verifications: NgoVerificationRequest[] }>('/admin/verifications', { params }),
  reviewVerification: (id: string, data: Record<string, unknown>) =>
    api.patch<{ profile: NgoProfile }>(`/admin/verifications/${id}`, data),
  getUsers: (params = {}) => api.get<{ users: AdminUser[] }>('/admin/users', { params }),
  updateUserStatus: (id: string, status: AccountStatus) =>
    api.patch<{ user: Pick<AdminUser, 'id' | 'name' | 'email' | 'role' | 'account_status'> }>(`/admin/users/${id}`, { account_status: status }),
  getDonations: (params = {}) =>
    api.get<{ donations: AdminDonationRow[] }>('/admin/donations', { params }),
  getDonationById: (id: string) =>
    api.get<{ donation: AdminDonationDetail }>(`/admin/donations/${id}`),
  expireDonation: (id: string) => api.post<{ donation: Donation }>(`/admin/donations/${id}/expire`),
  getImpact: (params = {}) => api.get<{ impact: AggregateImpact }>('/admin/impact', { params }),
  getAuditLogs: (params = {}) => api.get<{ logs: AuditLog[] }>('/admin/audit-logs', { params }),
  processExpired: () => api.post('/admin/process-expired'),
};

// Notifications API
export const notificationsApi = {
  getAll: (params = {}) => api.get<{ notifications: AppNotification[] }>('/notifications', { params }),
  markRead: (id: string) => api.post<{ notification: AppNotification }>(`/notifications/${id}/read`),
  markAsRead: (id: string) => api.post<{ notification: AppNotification }>(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
};

// Impact API
export const impactApi = {
  getPersonal: () => api.get<{ impact: PersonalImpact }>('/impact/me'),
  getDonorStats: () => api.get<{ stats: DonorStats }>('/impact/donor'),
  getVolunteerStats: () => api.get('/impact/volunteer'),
  getSummary: () => api.get<{ summary: AggregateImpact }>('/impact/summary').catch(() => api.get<{ summary: AggregateImpact }>('/impact/me')),
};

// Health API
export const healthApi = {
  check: () => api.get('/health'),
  ready: () => api.get('/health/ready'),
};

// Demo API
export const demoApi = {
  createSession: (role: string) =>
    api.post<{ user: AuthUser; token: string; isDemo: boolean }>('/demo/session', { role }),
  getIdentities: () =>
    api.get<{ identities: import('./types').DemoIdentity[] }>('/demo/identities'),
  reset: () =>
    api.post<{ message: string; seedSummary: Record<string, number> }>('/demo/reset'),
  getStatus: () =>
    api.get<{ stats: Record<string, unknown> }>('/demo/status'),
};

export default api;
