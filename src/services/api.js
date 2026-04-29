const BASE_URL = "https://stockflow-rd-production.up.railway.app/api";

function getToken() {
  return localStorage.getItem("token");
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
};

// PRODUCTS
export const productsAPI = {
  getAll: () => request("/products"),
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
  getAll: () => request("/sales"),
  getById: (id) => request(`/sales/${id}`),
};

// REPORTS
export const reportsAPI = {
  getDashboard: () => request("/reports/dashboard"),
};