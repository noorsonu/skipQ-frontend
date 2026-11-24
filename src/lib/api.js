import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Attach JWT Bearer Token if customer is logged in
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('ak_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Auth APIs (Google, Direct Password, & Password Reset)
export const authApi = {
  googleLogin: (payload) => apiClient.post('/api/auth/google-login', payload),
  directLogin: (payload) => apiClient.post('/api/auth/direct-login', payload),
  resetPassword: (payload) => apiClient.post('/api/auth/reset-password', payload),
  sendOtp: (phone) => apiClient.post('/api/auth/send-otp', { phone }),
  verifyOtp: (phone, otp, name, age) => apiClient.post('/api/auth/verify-otp', {
    phone,
    otp,
    name: name || undefined,
    age: age ? Number(age) : undefined
  }),
  checkPhone: (phone) => apiClient.get(`/api/auth/check-phone/${phone}`),
  getMe: () => apiClient.get('/api/auth/me'),
};

// Shop Discovery & Management APIs
export const shopApi = {
  getShops: (params) => apiClient.get('/api/shops', { params }),
  getShopBySlug: (slug) => apiClient.get(`/api/shops/slug/${slug}`),
  getShopById: (id) => apiClient.get(`/api/shops/${id}`),
  getShopsByPhone: (phone) => apiClient.get(`/api/shops/by-phone/${phone}`),
  createShop: (payload) => apiClient.post('/api/shops', payload),
  getQueueStatus: (shopId) => apiClient.get(`/api/shops/${shopId}/queue/status`),
};

// Queue & Token Lifecycle APIs
export const queueApi = {
  joinQueue: (shopId, payload) => apiClient.post(`/api/shops/${shopId}/queue/tokens/join`, payload),
  getShopTokens: (shopId) => apiClient.get(`/api/shops/${shopId}/queue/tokens`),
  callNext: (shopId) => apiClient.post(`/api/shops/${shopId}/queue/next`),
  completeToken: (shopId, tokenId) => apiClient.post(`/api/shops/${shopId}/queue/tokens/${tokenId}/complete`),
  markNoShow: (shopId, tokenId) => apiClient.post(`/api/shops/${shopId}/queue/tokens/${tokenId}/no-show`),
  skipToken: (shopId, tokenId) => apiClient.post(`/api/shops/${shopId}/queue/tokens/${tokenId}/skip`),
  getMyActiveTokens: () => apiClient.get('/api/queue/tokens/my'),
  getMyTokenHistory: () => apiClient.get('/api/queue/tokens/my/history'),
  getTokenById: (tokenId) => apiClient.get(`/api/tokens/${tokenId}`),
  cancelToken: (tokenId, reason = 'Cancelled by customer') =>
    apiClient.post(`/api/queue/tokens/${tokenId}/cancel`, { reason }),
  reQueue: (tokenId) =>
    apiClient.post(`/api/tokens/${tokenId}/requeue`),
  checkIn: (tokenId, lat, lng) =>
    apiClient.post(`/api/tokens/${tokenId}/checkin`, { lat, lng }),
};

// Review & Rating APIs (BRD Section 22, FR-1101, FR-1106)
export const reviewApi = {
  submitReview: (payload) => apiClient.post('/api/reviews', payload),
  getShopReviews: (shopId) => apiClient.get(`/api/shops/${shopId}/reviews`),
  replyToReview: (shopId, reviewId, reply) => apiClient.post(`/api/shops/${shopId}/reviews/${reviewId}/reply`, { reply }),
  reportAbuse: (reviewId, reason) => apiClient.post(`/api/reviews/${reviewId}/report-abuse`, { reason }),
};

// Categories & Zones
export const zoneApi = {
  getCategories: () => apiClient.get('/api/categories'),
  getZones: () => apiClient.get('/api/zones'),
};

// User Profile Management APIs
export const userApi = {
  getProfile: () => apiClient.get('/api/users/me'),
  updateProfile: (payload) => apiClient.patch('/api/users/me', payload),
  deleteAccount: (reason) => apiClient.post('/api/users/me/delete-account', { reason }),
};

// Admin System Governance & Purge APIs
export const adminApi = {
  purgeAllData: (secret = 'SKIPQ_PURGE_2026') => 
    apiClient.post('/api/admin/system/purge-all-data', {}, { headers: { 'X-Admin-Secret': secret } }),
};
