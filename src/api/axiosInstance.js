import axios from 'axios';

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: true,
});

// Request interceptor to add access token to headers
axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = getCookie('access_token');
    console.log('Access token from cookie:', accessToken); // Debug log
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    console.log('Request config:', config); // Debug log
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    console.log('Response error:', error.response?.status, error.response?.data); // Debug log
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        console.log('Attempting token refresh');
        const refreshToken = getCookie('refresh_token');
        
        if (!refreshToken) {
          console.error('No refresh token found in cookies');
          // Don't redirect immediately, let the auth check handle it
          return Promise.reject(error);
        }
        
        // Call your custom refresh endpoint
        const response = await axios.post('http://localhost:8000/api/token/refresh/', {}, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        console.log('Refresh response:', response.data);
        
        if (response.status === 200) {
          // The new tokens are automatically set in cookies by the server
          // Retry the original request
          const newAccessToken = getCookie('access_token');
          if (newAccessToken) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError.response?.data || refreshError.message);
        // Don't redirect here, let the auth check handle it
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;