import axios from 'axios';

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

const axiosInstance = axios.create({
  baseURL: 'https://blog-api.midhung.in/api',
  withCredentials: true,
});

// Request interceptor to add access token to headers
axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = getCookie('access_token');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle blocked users and token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle blocked user - force logout immediately
    if (error.response?.status === 403) {
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || '';
      
      if (errorMessage.toLowerCase().includes('blocked') || 
          errorMessage.toLowerCase().includes('account is disabled')) {
        
        // Clear all cookies
        document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        
        // Clear localStorage if you use it
        localStorage.clear();
        
        // Redirect to login with blocked message
        alert('Your account has been blocked by an administrator.');
        window.location.href = '/login';
        
        return Promise.reject(error);
      }
    }
    
    // Handle token refresh for 401 errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = getCookie('refresh_token');
        
        if (!refreshToken) {
          window.location.href = '/login';
          return Promise.reject(error);
        }
        
        const response = await axios.post('https://blog-api.midhung.in/api/token/refresh/', {}, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (response.status === 200) {
          const newAccessToken = getCookie('access_token');
          if (newAccessToken) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;