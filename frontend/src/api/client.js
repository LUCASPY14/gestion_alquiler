import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

const METODOS_SEGUROS = new Set(['get', 'head', 'options']);

function leerCookie(nombre) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${nombre}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

api.interceptors.request.use((config) => {
  if (!METODOS_SEGUROS.has((config.method || 'get').toLowerCase())) {
    const csrfToken = leerCookie('csrftoken');
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }
  }
  return config;
});

let refreshPromise = null;
let onSessionExpired = null;

export function setOnSessionExpired(callback) {
  onSessionExpired = callback;
}

function manejarSesionExpirada() {
  if (onSessionExpired) onSessionExpired();
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    if (response?.status !== 401 || config._retried || config.url?.endsWith('/token/refresh/')) {
      if (response?.status === 401) manejarSesionExpirada();
      return Promise.reject(error);
    }

    config._retried = true;
    try {
      refreshPromise ??= api.post('/token/refresh/').finally(() => {
        refreshPromise = null;
      });
      await refreshPromise;
      return api(config);
    } catch (refreshError) {
      manejarSesionExpirada();
      return Promise.reject(refreshError);
    }
  },
);

export default api;
