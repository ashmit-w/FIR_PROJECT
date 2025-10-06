import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('login')) {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  // Register user
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Login user
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Get user profile
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // Get current user (alias)
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// FIR API functions
export const firAPI = {
  // Get all FIRs
  getAllFIRs: async (params = {}) => {
    const response = await api.get('/firs', { params });
    return response.data;
  },

  // Get single FIR
  getFIR: async (id) => {
    const response = await api.get(`/firs/${id}`);
    return response.data;
  },

  // Create new FIR
  createFIR: async (firData) => {
    const response = await api.post('/firs', firData);
    return response.data;
  },

  // Update FIR
  updateFIR: async (id, firData) => {
    const response = await api.put(`/firs/${id}`, firData);
    return response.data;
  },

  // Delete FIR
  deleteFIR: async (id) => {
    const response = await api.delete(`/firs/${id}`);
    return response.data;
  },

  // Add remark to FIR
  addRemark: async (id, remark) => {
    const response = await api.post(`/firs/${id}/remarks`, { remark });
    return response.data;
  },

  // Update FIR disposal status
  updateDisposal: async (id, disposalData) => {
    const response = await api.patch(`/disposal/${id}`, disposalData);
    return response.data;
  },

  // Get performance report
  getPerformanceReport: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.policeStationId && filters.policeStationId !== 'all') {
      params.append('policeStationId', filters.policeStationId);
    }
    
    const queryString = params.toString();
    const url = queryString ? `/reports/performance?${queryString}` : '/reports/performance';
    
    const response = await api.get(url);
    return response.data;
  },

  // Get detailed FIR report
  getFIRReport: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.policeStationId && filters.policeStationId !== 'all') {
      params.append('policeStationId', filters.policeStationId);
    }
    if (filters.disposalStatus && filters.disposalStatus !== 'all') {
      params.append('disposalStatus', filters.disposalStatus);
    }
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    
    const queryString = params.toString();
    const url = queryString ? `/reports/firs?${queryString}` : '/reports/firs';
    
    const response = await api.get(url);
    return response.data;
  },
};

// Health check
export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

// Export report API for easy access
export const reportAPI = {
  getPerformanceReport: firAPI.getPerformanceReport,
  getFIRReport: firAPI.getFIRReport
};

export default api;