import axios from 'axios';

const KEY = 'lp_session';
export const getSession = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
export const setSession = (s) => (s ? localStorage.setItem(KEY, JSON.stringify(s)) : localStorage.removeItem(KEY));

const api = axios.create({ baseURL: `${import.meta.env.VITE_API_URL || ''}/api` });

api.interceptors.request.use((config) => {
  const s = getSession();
  if (s?.access_token) config.headers.Authorization = `Bearer ${s.access_token}`;
  return config;
});

// On 401, refresh once (shared across concurrent requests), then retry.
let refreshing = null;
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const s = getSession();
    const isAuthCall = original?.url?.startsWith('/auth/');
    if (error.response?.status === 401 && s?.refresh_token && !original._retry && !isAuthCall) {
      original._retry = true;
      try {
        refreshing ??= axios.post(`${api.defaults.baseURL}/auth/refresh`, { refresh_token: s.refresh_token })
          .finally(() => { refreshing = null; });
        const { data } = await refreshing;
        setSession(data.session);
        original.headers.Authorization = `Bearer ${data.session.access_token}`;
        return api(original);
      } catch {
        setSession(null);
        window.dispatchEvent(new Event('lp:signed-out'));
      }
    }
    return Promise.reject(error);
  }
);

export const errorMessage = (e) => e.response?.data?.error || 'Could not reach the server. Check your connection and try again.';
export default api;
