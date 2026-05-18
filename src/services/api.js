const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

function getToken() {
  return localStorage.getItem("token");
}

let refreshPromise = null;

async function refreshToken() {
  const token = getToken();
  if (!token) return null;
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    localStorage.setItem("token", data.token);
    return data.token;
  } catch {
    return null;
  }
}

async function request(path, options = {}) {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401 && token) {
    if (!refreshPromise) {
      refreshPromise = refreshToken();
    }
    const newToken = await refreshPromise;
    refreshPromise = null;
    if (newToken) {
      headers.Authorization = `Bearer ${newToken}`;
      const retryRes = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
      });
      const retryData = await retryRes.json();
      if (!retryRes.ok) {
        throw new Error(retryData.message || "Error en la solicitud");
      }
      return retryData;
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
    throw new Error("Sesión expirada");
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Error en la solicitud");
  }

  return data;
}

// AUTH
export const authAPI = {
  login: (email, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (payload) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  forgotPassword: (email) =>
    request("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  resetPassword: (token, password) =>
    request("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    }),
};

function qs(params) {
  if (!params || Object.keys(params).length === 0) return "";
  return "?" + new URLSearchParams(params).toString();
}

// PRODUCTS
export const productsAPI = {
  getAll: (params = {}) => request(`/products${qs(params)}`),
  getById: (id) => request(`/products/${id}`),
  getLowStock: () => request("/products/low-stock"),
  create: (payload) =>
    request("/products", { method: "POST", body: JSON.stringify(payload) }),
  update: (id, payload) =>
    request(`/products/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  delete: (id) =>
    request(`/products/${id}`, { method: "DELETE" }),
};

// SALES
export const salesAPI = {
  create: (payload) =>
    request("/sales", { method: "POST", body: JSON.stringify(payload) }),
  getAll: (params = {}) => request(`/sales${qs(params)}`),
  getById: (id) => request(`/sales/${id}`),
  update: (id, payload) =>
    request(`/sales/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  cancel: (id) =>
    request(`/sales/${id}/cancel`, { method: "PUT" }),
  delete: (id) =>
    request(`/sales/${id}`, { method: "DELETE" }),
};

// REPORTS
export const reportsAPI = {
  getDashboard: () => request("/reports/dashboard"),
  getDgiiReport: (month, year) => request(`/reports/dgii?month=${month}&year=${year}`),
  getProfitReport: (from, to) => request(`/reports/profit?from=${from}&to=${to}`),
};

// CLIENTS
export const clientsAPI = {
  getAll: (params = {}) => request(`/clients${qs(params)}`),
  getById: (id) => request(`/clients/${id}`),
  create: (payload) =>
    request("/clients", { method: "POST", body: JSON.stringify(payload) }),
  update: (id, payload) =>
    request(`/clients/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  delete: (id) =>
    request(`/clients/${id}`, { method: "DELETE" }),
};

// COMPANY
export const companyAPI = {
  get: () => request("/company"),
  update: (payload) =>
    request("/company", { method: "PUT", body: JSON.stringify(payload) }),
};

// NCF
export const ncfAPI = {
  getAll: () => request("/ncf"),
  update: (id, payload) =>
    request(`/ncf/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
};

// SUPPLIERS
export const suppliersAPI = {
  getAll: (params = {}) => request(`/suppliers${qs(params)}`),
  getById: (id) => request(`/suppliers/${id}`),
  create: (payload) =>
    request("/suppliers", { method: "POST", body: JSON.stringify(payload) }),
  update: (id, payload) =>
    request(`/suppliers/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  delete: (id) => request(`/suppliers/${id}`, { method: "DELETE" }),
};

// PURCHASES
export const purchasesAPI = {
  create: (payload) =>
    request("/purchases", { method: "POST", body: JSON.stringify(payload) }),
  getAll: (params = {}) => request(`/purchases${qs(params)}`),
  getById: (id) => request(`/purchases/${id}`),
  update: (id, payload) =>
    request(`/purchases/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  delete: (id) =>
    request(`/purchases/${id}`, { method: "DELETE" }),
};

// USERS
export const usersAPI = {
  getAll: () => request("/users"),
  getById: (id) => request(`/users/${id}`),
  update: (id, payload) =>
    request(`/users/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  delete: (id) =>
    request(`/users/${id}`, { method: "DELETE" }),
};

// INVENTORY
export const inventoryAPI = {
  getMovements: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/inventory/movements${qs ? "?" + qs : ""}`);
  },
  getValue: () => request("/inventory/value"),
};

// CATEGORIES
export const categoriesAPI = {
  getAll: () => request("/categories"),
  create: (payload) =>
    request("/categories", { method: "POST", body: JSON.stringify(payload) }),
  update: (id, payload) =>
    request(`/categories/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  delete: (id) =>
    request(`/categories/${id}`, { method: "DELETE" }),
};

