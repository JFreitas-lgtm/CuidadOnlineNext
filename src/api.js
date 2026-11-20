let csrf = null;

export class ApiError extends Error {
  constructor(status, payload) {
    super(payload?.error?.message || 'Não foi possível conectar ao servidor.');
    this.name = 'ApiError';
    this.status = status;
    this.code = payload?.error?.code || 'NETWORK_ERROR';
    this.fields = payload?.error?.fields || {};
  }
}

async function request(path, options = {}, retryCsrf = true) {
  const headers = { Accept: 'application/json', ...options.headers };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (csrf && !['GET', 'HEAD'].includes(options.method || 'GET')) headers['X-CSRF-Token'] = csrf;
  let response;
  try {
    response = await fetch(`/api${path}`, { credentials: 'same-origin', ...options, headers, body: options.body === undefined ? undefined : JSON.stringify(options.body) });
  } catch {
    throw new ApiError(0, { error: { code: 'NETWORK_ERROR', message: 'O servidor está indisponível. Tente novamente em instantes.' } });
  }
  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    if (retryCsrf && response.status === 403 && payload?.error?.code === 'CSRF_INVALID' && path !== '/auth/me') {
      const refreshed = await request('/auth/me', {}, false);
      csrf = refreshed.csrfToken;
      return request(path, options, false);
    }
    throw new ApiError(response.status, payload);
  }
  if (payload?.csrfToken) csrf = payload.csrfToken;
  return payload;
}

export const api = (path, options = {}) => request(path, options, true);

export async function getSession() {
  const payload = await api('/auth/me');
  csrf = payload.csrfToken;
  return payload.user;
}

export const authApi = {
  register: values => api('/auth/register', { method: 'POST', body: values }),
  login: values => api('/auth/login', { method: 'POST', body: values }),
  logout: () => api('/auth/logout', { method: 'POST' }),
  theme: theme => api('/account/theme', { method: 'PATCH', body: { theme } }),
};
