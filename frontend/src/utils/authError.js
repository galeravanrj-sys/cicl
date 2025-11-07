// Centralized auth error mapping for consistent UX across contexts and interceptors

const KICKED_OUT_MESSAGES = new Set([
  'Session is not active or has been terminated',
  'Unable to validate session',
  'No token, authorization denied',
  'Token is not valid'
]);

const EXPIRED_MESSAGES = new Set([
  'Token has expired'
]);

export function mapAuthError(err) {
  const status = err?.response?.status;
  const backendMsg = err?.response?.data?.message || '';
  const isNetwork = err?.message === 'Network Error';

  if (isNetwork) {
    return {
      status: 0,
      reason: 'network',
      message: 'Unable to connect to the server. Please check your connection or try again later.',
      redirect: false
    };
  }

  if (status === 401 || status === 403) {
    if (KICKED_OUT_MESSAGES.has(backendMsg)) {
      return {
        status,
        reason: 'kicked_out',
        message: 'You’ve been logged in elsewhere. Please log in again.',
        redirect: true
      };
    }
    if (EXPIRED_MESSAGES.has(backendMsg)) {
      return {
        status,
        reason: 'expired',
        message: 'Your session has expired. Please log in again.',
        redirect: true
      };
    }
    return {
      status,
      reason: 'unauthorized',
      message: 'Authentication failed. Please log in again.',
      redirect: true
    };
  }

  return {
    status: status ?? -1,
    reason: 'unknown',
    message: err?.response?.data?.message || 'Unexpected error. Please try again later.',
    redirect: false
  };
}

// Utilities for passing a transient banner message across redirects
const BANNER_KEY = 'post_redirect_banner';

export function setPostRedirectBanner(message, type = 'error', ttlMs = 10000) {
  try {
    const payload = { message, type, ts: Date.now(), ttlMs };
    sessionStorage.setItem(BANNER_KEY, JSON.stringify(payload));
  } catch (_) {
    // ignore storage errors
  }
}

export function consumePostRedirectBanner() {
  try {
    const raw = sessionStorage.getItem(BANNER_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(BANNER_KEY);
    const payload = JSON.parse(raw);
    const age = Date.now() - (payload.ts || 0);
    if (payload.ttlMs && age > payload.ttlMs) return null; // expired
    return payload;
  } catch (_) {
    return null;
  }
}