import axios from 'axios';

const fallbackBaseURL = '/api/v1';
const baseURL = import.meta.env.VITE_API_URL
  ? new URL('/api/v1', import.meta.env.VITE_API_URL).toString().replace(/\/$/, '')
  : fallbackBaseURL;

if (!import.meta.env.VITE_API_URL && typeof window !== 'undefined') {
  const remoteHosts = ['vercel.app', 'netlify.app', 'render.com'];
  if (remoteHosts.some((host) => window.location.hostname.includes(host))) {
    console.warn(
      'VITE_API_URL is not configured. Requests will fall back to the same origin path /api/v1, which only works if the backend is served from the same domain.'
    );
  }
}

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.setToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = 'Bearer ' + token;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

export default api;
