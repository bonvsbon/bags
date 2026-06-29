// API client for the เงินทอน backend.
// Talks baht <-> JSON; stores JWT access/refresh in localStorage and
// transparently refreshes the access token once on a 401.

// Base URL priority:
//  1. VITE_API_URL — explicit override for production / native (Capacitor) builds
//     where the API lives on a different origin (e.g. https://api.example.com/api/v1)
//  2. same-origin '/api/v1' — the dev server (and any tunnel/host in front of it)
//     proxies '/api' to the backend, so no CORS and one URL covers everything
function deriveBase() {
  if (import.meta?.env?.VITE_API_URL) return import.meta.env.VITE_API_URL;
  return '/api/v1';
}

const BASE = deriveBase();

const ACCESS_KEY = 'nl_access';
const REFRESH_KEY = 'nl_refresh';

export const tokens = {
  get access() {
    return localStorage.getItem(ACCESS_KEY);
  },
  get refresh() {
    return localStorage.getItem(REFRESH_KEY);
  },
  set({ access, refresh }) {
    if (access) localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
  get isAuthed() {
    return !!localStorage.getItem(ACCESS_KEY);
  },
};

class ApiError extends Error {
  constructor(status, detail) {
    super(typeof detail === 'string' ? detail : `HTTP ${status}`);
    this.status = status;
    this.detail = detail;
  }
}

async function raw(method, path, body, useAuth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (useAuth && tokens.access) headers.Authorization = `Bearer ${tokens.access}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.status === 204) return null;
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }
  if (!res.ok) throw new ApiError(res.status, data?.detail ?? data);
  return data;
}

async function request(method, path, body, useAuth = true) {
  try {
    return await raw(method, path, body, useAuth);
  } catch (e) {
    // One automatic refresh attempt on expired access token.
    if (e.status === 401 && useAuth && tokens.refresh) {
      try {
        const pair = await raw('POST', '/auth/refresh', { refresh_token: tokens.refresh }, false);
        tokens.set(pair);
        return await raw(method, path, body, useAuth);
      } catch {
        tokens.clear();
      }
    }
    throw e;
  }
}

export const api = {
  ApiError,

  // --- auth ---
  async register(email, password, display_name) {
    const t = await request('POST', '/auth/register', { email, password, display_name }, false);
    tokens.set(t);
    return t;
  },
  async login(email, password) {
    const t = await request('POST', '/auth/login', { email, password }, false);
    tokens.set(t);
    return t;
  },
  async google(id_token) {
    const t = await request('POST', '/auth/google', { id_token }, false);
    tokens.set(t);
    return t;
  },
  async guest() {
    const t = await request('POST', '/auth/guest', undefined, false);
    tokens.set(t);
    return t;
  },
  async guestUpgrade(email, password) {
    const t = await request('POST', '/auth/guest/upgrade', { email, password });
    tokens.set(t);
    return t;
  },
  me: () => request('GET', '/auth/me'),
  async logout() {
    if (tokens.refresh) {
      try {
        await request('POST', '/auth/logout', { refresh_token: tokens.refresh });
      } catch {
        /* ignore */
      }
    }
    tokens.clear();
  },

  // --- onboarding / profile / settings ---
  onboarding: (payload) => request('POST', '/onboarding', payload),
  getProfile: () => request('GET', '/profile'),
  patchProfile: (patch) => request('PATCH', '/profile', patch),
  getSettings: () => request('GET', '/settings'),
  patchSettings: (patch) => request('PATCH', '/settings', patch),

  // --- accounts ---
  listAccounts: () => request('GET', '/accounts'),
  createAccount: (a) => request('POST', '/accounts', a),
  patchAccount: (id, a) => request('PATCH', `/accounts/${id}`, a),
  deleteAccount: (id) => request('DELETE', `/accounts/${id}`),

  // --- categories ---
  listCategories: () => request('GET', '/categories'),
  createCategory: (c) => request('POST', '/categories', c),
  patchCategory: (id, c) => request('PATCH', `/categories/${id}`, c),
  deleteCategory: (id) => request('DELETE', `/categories/${id}`),

  // --- transactions ---
  listTransactions: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request('GET', `/transactions${q ? `?${q}` : ''}`);
  },
  createTransaction: (t) => request('POST', '/transactions', t),
  patchTransaction: (id, t) => request('PATCH', `/transactions/${id}`, t),
  deleteTransaction: (id) => request('DELETE', `/transactions/${id}`),

  // --- bills ---
  listBills: () => request('GET', '/bills'),
  createBill: (b) => request('POST', '/bills', b),
  patchBill: (id, b) => request('PATCH', `/bills/${id}`, b),
  deleteBill: (id) => request('DELETE', `/bills/${id}`),
  payBill: (id) => request('POST', `/bills/${id}/pay`),

  // --- budgets ---
  listBudgets: (period) =>
    request('GET', `/budgets${period ? `?period=${period}` : ''}`),
  createBudget: (b) => request('POST', '/budgets', b),
  patchBudget: (id, b) => request('PATCH', `/budgets/${id}`, b),
  deleteBudget: (id) => request('DELETE', `/budgets/${id}`),

  // --- goals ---
  listGoals: () => request('GET', '/goals'),
  createGoal: (g) => request('POST', '/goals', g),
  patchGoal: (id, g) => request('PATCH', `/goals/${id}`, g),
  deleteGoal: (id) => request('DELETE', `/goals/${id}`),
  contributeGoal: (id, amount) => request('POST', `/goals/${id}/contribute`, { amount }),

  // --- summary (screen payloads) ---
  summaryHome: () => request('GET', '/summary/home'),
  summaryDetail: () => request('GET', '/summary/detail'),
  summaryPlan: () => request('GET', '/summary/plan'),
  summaryDashboard: () => request('GET', '/summary/dashboard'),
  summaryReports: () => request('GET', '/summary/reports'),

  // --- insights ---
  listInsights: () => request('GET', '/insights'),
  readInsight: (id) => request('POST', `/insights/${id}/read`),
};
