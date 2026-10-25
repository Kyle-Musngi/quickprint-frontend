import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('uqp_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Interceptor for 401 Unauthorized handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-clear if this was a login attempt failure
      if (!error.config.url.includes('/auth/login/')) {
        localStorage.removeItem('uqp_access_token');
        localStorage.removeItem('uqp_refresh_token');
        localStorage.removeItem('uqp_user');
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (credentials) => {
    const res = await api.post('/auth/login/', credentials);
    if (res.data.access) {
      localStorage.setItem('uqp_access_token', res.data.access);
      localStorage.setItem('uqp_refresh_token', res.data.refresh);
      localStorage.setItem('uqp_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },
  register: async (userData) => {
    const res = await api.post('/auth/register/', userData);
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me/');
    return res.data;
  },
  updateProfile: async (data) => {
    const res = await api.patch('/auth/profile/', data);
    return res.data;
  },
  logout: async () => {
    try {
      await api.post('/auth/logout/');
    } catch {
      // Ignore network errors or token expiration during logout
    } finally {
      localStorage.removeItem('uqp_access_token');
      localStorage.removeItem('uqp_refresh_token');
      localStorage.removeItem('uqp_user');
      sessionStorage.clear();
    }
  }
};

export const shopService = {
  getShops: async (params) => {
    const res = await api.get('/shops/', { params });
    return res.data;
  },
  getShop: async (id) => {
    const res = await api.get(`/shops/${id}/`);
    return res.data;
  },
  registerShop: async (data) => {
    const res = await api.post('/shops/register/', data);
    return res.data;
  },
  getMyShop: async () => {
    const res = await api.get('/shops/my-shop/');
    return res.data;
  },
  updateMyShop: async (data) => {
    const res = await api.patch('/shops/my-shop/', data);
    return res.data;
  },
  getShopOperatingHours: async () => {
    const res = await api.get('/shops/my-shop/operating-hours/');
    return res.data;
  },
  updateShopOperatingHours: async (schedules) => {
    const res = await api.put('/shops/my-shop/operating-hours/', schedules);
    return res.data;
  },
  getPickupSlots: async (shopId, date) => {
    const res = await api.get(`/shops/${shopId}/pickup-slots/`, { params: { date } });
    return res.data;
  },
  getShopReviews: async (shopId, params) => {
    const res = await api.get(`/shops/${shopId}/reviews/`, { params });
    return res.data;
  },
  submitShopReview: async (shopId, reviewData) => {
    const res = await api.post(`/shops/${shopId}/reviews/`, reviewData);
    return res.data;
  },
  getMyShopReviews: async (params) => {
    const res = await api.get('/shops/my-shop/reviews/', { params });
    return res.data;
  },
  moderateReview: async (reviewId, data) => {
    const res = await api.post(`/shops/admin/reviews/${reviewId}/moderate/`, data);
    return res.data;
  },
  // Admin
  getAllShopsAdmin: async (params) => {
    const res = await api.get('/shops/admin/all/', { params });
    return res.data;
  },
  adminShopAction: async (shopId, action, reason = '') => {
    const res = await api.post(`/shops/admin/${shopId}/action/`, { action, reason });
    return res.data;
  }
};

export const printingService = {
  calculateEstimate: async (shopId, items) => {
    const res = await api.post('/printing/estimate/', { shop_id: shopId, items });
    return res.data;
  },
  getShopPrices: async (shopId) => {
    const res = await api.get(`/printing/shops/${shopId}/prices/`);
    return res.data;
  },
  getMyShopPrices: async () => {
    const res = await api.get('/printing/my-shop/prices/');
    return res.data;
  },
  updateMyShopPrices: async (rules) => {
    const res = await api.put('/printing/my-shop/prices/', { rules });
    return res.data;
  },
  getShopServices: async (shopId) => {
    const res = await api.get(`/printing/shops/${shopId}/services/`);
    return res.data;
  },
  getMyShopServices: async () => {
    const res = await api.get('/printing/my-shop/services/');
    return res.data;
  },
  addMyShopService: async (serviceData) => {
    const res = await api.post('/printing/my-shop/services/', serviceData);
    return res.data;
  }
};

export const orderService = {
  detectPages: async (formData) => {
    const res = await api.post('/orders/detect-pages/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  createOrder: async (formData) => {
    const res = await api.post('/orders/create/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  getOrders: async (params) => {
    const res = await api.get('/orders/', { params });
    return res.data;
  },
  getOrder: async (id) => {
    const res = await api.get(`/orders/${id}/`);
    return res.data;
  },
  cancelOrder: async (id, reason) => {
    const res = await api.post(`/orders/${id}/cancel/`, { reason });
    return res.data;
  },
  acceptOrder: async (id) => {
    const res = await api.post(`/orders/${id}/accept/`);
    return res.data;
  },
  rejectOrder: async (id, reason) => {
    const res = await api.post(`/orders/${id}/reject/`, { reason });
    return res.data;
  },
  startPrinting: async (id) => {
    const res = await api.post(`/orders/${id}/start-printing/`);
    return res.data;
  },
  readyForPickup: async (id) => {
    const res = await api.post(`/orders/${id}/ready-for-pickup/`);
    return res.data;
  },
  confirmPickup: async (id, pickupCode) => {
    const res = await api.post(`/orders/${id}/confirm-pickup/`, { pickup_code: pickupCode });
    return res.data;
  },
  updatePickupSlot: async (id, data) => {
    const res = await api.patch(`/orders/${id}/pickup-slot/`, data);
    return res.data;
  },
  getDocumentDownloadUrl: (orderId, docId) => {
    return `${API_BASE_URL}/orders/${orderId}/documents/${docId}/download/`;
  }
};

export const paymentService = {
  processSandboxPayment: async (data) => {
    const res = await api.post('/payments/process/', data);
    return res.data;
  },
  getPayments: async (params) => {
    const res = await api.get('/payments/', { params });
    return res.data;
  },
  getPayment: async (id) => {
    const res = await api.get(`/payments/${id}/`);
    return res.data;
  }
};

export const notificationService = {
  getNotifications: async () => {
    const res = await api.get('/notifications/');
    return res.data;
  },
  getUnreadCount: async () => {
    const res = await api.get('/notifications/unread-count/');
    return res.data;
  },
  markAsRead: async (id) => {
    const res = await api.post(`/notifications/${id}/read/`);
    return res.data;
  },
  markAllAsRead: async () => {
    const res = await api.post('/notifications/read-all/');
    return res.data;
  }
};

export const analyticsService = {
  getShopOverview: async () => {
    const res = await api.get('/analytics/shop-overview/');
    return res.data;
  },
  getAdminOverview: async () => {
    const res = await api.get('/analytics/admin-overview/');
    return res.data;
  }
};

export const supportService = {
  submitQuestion: async (data) => {
    const res = await api.post('/support/questions/', data);
    return res.data;
  },
  getMyQuestions: async () => {
    const res = await api.get('/support/questions/');
    return res.data;
  },
  getAdminQuestions: async (params) => {
    const res = await api.get('/support/admin/questions/', { params });
    return res.data;
  },
  getAdminQuestionDetail: async (id) => {
    const res = await api.get(`/support/admin/questions/${id}/`);
    return res.data;
  },
  answerQuestion: async (id, data) => {
    const res = await api.post(`/support/admin/questions/${id}/answer/`, data);
    return res.data;
  }
};

export default api;
