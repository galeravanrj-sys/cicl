// Centralized API base configuration for CRA client
// Use REACT_APP_API_URL like: http://<LAN_IP>:5000/api
export const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
// Derive host root (without trailing /api) for health checks or non-API endpoints
export const API_HOST = API_BASE.replace(/\/api\/?$/, '');