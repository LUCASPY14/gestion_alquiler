import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise = null;

function clearSessionAndRedirect() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    const refreshToken = localStorage.getItem('refresh_token');

    if (response?.status !== 401 || config._retried || !refreshToken) {
      if (response?.status === 401) clearSessionAndRedirect();
      return Promise.reject(error);
    }

    config._retried = true;
    try {
      refreshPromise ??= axios
        .post(`${import.meta.env.VITE_API_URL}/token/refresh/`, { refresh: refreshToken })
        .finally(() => {
          refreshPromise = null;
        });
      const { data } = await refreshPromise;
      localStorage.setItem('access_token', data.access);
      config.headers.Authorization = `Bearer ${data.access}`;
      return api(config);
    } catch (refreshError) {
      clearSessionAndRedirect();
      return Promise.reject(refreshError);
    }
  },
);

export default api;
