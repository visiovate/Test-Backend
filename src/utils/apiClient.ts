import axios from 'axios';
import { config } from '../config';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: `${config.apiPrefix}`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API calls
export const authAPI = {
  login: (data: { email: string; password: string }) => 
    api.post('/auth/login', data),
  register: (data: { email: string; password: string; name: string }) => 
    api.post('/auth/register', data),
  refreshToken: (refreshToken: string) => 
    api.post('/auth/refresh-token', { refreshToken }),
};

// User API calls
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: any) => api.put('/users/profile', data),
  updatePassword: (data: { currentPassword: string; newPassword: string }) => 
    api.put('/users/password', data),
};

// Maid API calls
export const maidAPI = {
  getAllMaids: (params?: any) => api.get('/maids', { params }),
  getMaidById: (id: string) => api.get(`/maids/${id}`),
  getMaidAvailability: (id: string, date: string) => 
    api.get(`/maids/${id}/availability`, { params: { date } }),
};

// Booking API calls
export const bookingAPI = {
  createBooking: (data: any) => api.post('/bookings', data),
  getBookings: (params?: any) => api.get('/bookings', { params }),
  getBookingById: (id: string) => api.get(`/bookings/${id}`),
  cancelBooking: (id: string) => api.post(`/bookings/${id}/cancel`),
};

// Review API calls
export const reviewAPI = {
  createReview: (data: any) => api.post('/reviews', data),
  getReviews: (params?: any) => api.get('/reviews', { params }),
  updateReview: (id: string, data: any) => api.put(`/reviews/${id}`, data),
};

// Payment API calls
export const paymentAPI = {
  createPayment: (data: any) => api.post('/payments', data),
  getPaymentHistory: () => api.get('/payments/history'),
  getPaymentById: (id: string) => api.get(`/payments/${id}`),
};

// Search API calls
export const searchAPI = {
  searchMaids: (query: string) => api.get('/search', { params: { q: query } }),
};

// Notification API calls
export const notificationAPI = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

export default {
  auth: authAPI,
  user: userAPI,
  maid: maidAPI,
  booking: bookingAPI,
  review: reviewAPI,
  payment: paymentAPI,
  search: searchAPI,
  notification: notificationAPI,
}; 