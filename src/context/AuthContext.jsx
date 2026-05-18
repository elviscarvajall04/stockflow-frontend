import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

function checkCompanyStatus() {
  const token = localStorage.getItem("token");
  if (!token) return Promise.resolve({ configured: false });
  const base = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
  return fetch(`${base}/company/status`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((r) => r.json())
    .catch(() => ({ configured: false }));
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [companyConfigured, setCompanyConfigured] = useState(false);
  const [checkingCompany, setCheckingCompany] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      checkCompanyStatus().then((data) => {
        setCompanyConfigured(data.configured);
        setCheckingCompany(false);
      });
    } else {
      setCheckingCompany(false);
    }
    setLoading(false);
  }, []);

  const login = (tokenValue, userData) => {
    localStorage.setItem("token", tokenValue);
    localStorage.setItem("user", JSON.stringify(userData));
    setToken(tokenValue);
    setUser(userData);
    setCheckingCompany(true);
    checkCompanyStatus().then((data) => {
      setCompanyConfigured(data.configured);
      setCheckingCompany(false);
    });
  };

  const refreshCompanyStatus = () => {
    return checkCompanyStatus().then((data) => {
      setCompanyConfigured(data.configured);
    });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setCompanyConfigured(false);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, companyConfigured, checkingCompany, refreshCompanyStatus }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}