// Centralized API base configuration for CRA client
// Prefer REACT_APP_API_URL; in production fallback to Render API
export const API_BASE = (() => {
  const envBase = process.env.REACT_APP_API_URL;
  if (envBase) return envBase;
  const isBrowser = typeof window !== 'undefined';
  const host = isBrowser ? window.location.host : '';
  const isVercelProd = /cicl\.vercel\.app$/i.test(host);
  if (isVercelProd) return 'https://cicl.onrender.com/api';
  return 'http://localhost:5000/api';
})();

// Derive host root (without trailing /api) for health checks or non-API endpoints
export const API_HOST = API_BASE.replace(/\/api\/?$/, '');