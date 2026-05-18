import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { productsAPI } from "../services/api";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === "admin";
  const [menuOpen, setMenuOpen] = useState(false);
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    productsAPI.getLowStock()
      .then((data) => setLowStockCount(Array.isArray(data) ? data.length : 0))
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const links = [
    { label: "Dashboard", path: "/dashboard", show: true },
    { label: "Productos", path: "/products", show: true },
    { label: "Kardex", path: "/kardex", show: true },
    { label: "Ganancias", path: "/profit", show: true },
    { label: "Ventas", path: "/sales", show: true },
    { label: "Compras", path: "/purchases", show: true },
    { label: "Proveedores", path: "/suppliers", show: true },
    { label: "Clientes", path: "/clients", show: true },
    { label: "Usuarios", path: "/users", show: isAdmin },
    { label: "Configuración", path: "/settings", show: isAdmin },
    { label: "DGII", path: "/dgii", show: isAdmin },
  ];

  const handleNav = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.left}>
        <div style={styles.brand} onClick={() => navigate("/dashboard")}>
          <span style={styles.icon}>📦</span>
          <span style={styles.brandName}>StockFlow RD</span>
        </div>
        <div style={styles.links} className="nav-links">
          {links.filter((l) => l.show).map((l) => (
            <button
              key={l.path}
              onClick={() => navigate(l.path)}
              style={{
                ...styles.link,
                color: location.pathname === l.path ? "#4f46e5" : "#64748b",
                borderBottom: location.pathname === l.path
                  ? "2px solid #4f46e5"
                  : "2px solid transparent",
              }}
            >
              {l.label}
              {l.path === "/products" && lowStockCount > 0 && (
                <span style={styles.badge}>{lowStockCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.right} className="nav-right">
        <div style={styles.userInfo}>
          <div style={{
            ...styles.avatar,
            background: isAdmin
              ? "linear-gradient(135deg, #4f46e5, #7c3aed)"
              : "linear-gradient(135deg, #0891b2, #0e7490)",
          }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p style={styles.userName}>{user?.name}</p>
            <p style={{ ...styles.userRole, color: isAdmin ? "#4f46e5" : "#0891b2" }}>
              {user?.role === "admin" ? "Administrador" : "Empleado"}
            </p>
          </div>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          Cerrar sesión
        </button>
      </div>

      <button
        className="nav-hamburger"
        style={styles.hamburger}
        onClick={() => setMenuOpen(!menuOpen)}
      >
        {menuOpen ? "✕" : "☰"}
      </button>

      {menuOpen && (
        <div style={styles.mobileMenu} className="nav-mobile-menu">
          <div style={styles.mobileUser}>
            <div style={{
              ...styles.avatar,
              background: isAdmin
                ? "linear-gradient(135deg, #4f46e5, #7c3aed)"
                : "linear-gradient(135deg, #0891b2, #0e7490)",
            }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p style={styles.userName}>{user?.name}</p>
              <p style={{ ...styles.userRole, color: isAdmin ? "#4f46e5" : "#0891b2" }}>
                {user?.role === "admin" ? "Administrador" : "Empleado"}
              </p>
            </div>
          </div>

          <div style={styles.mobileDivider} />

          {links.filter((l) => l.show).map((l) => (
            <button
              key={l.path}
              onClick={() => handleNav(l.path)}
              style={{
                ...styles.mobileLink,
                background: location.pathname === l.path ? "#eef2ff" : "transparent",
                color: location.pathname === l.path ? "#4f46e5" : "#334155",
              }}
            >
              {l.label}
              {l.path === "/products" && lowStockCount > 0 && (
                <span style={styles.mobileBadge}>{lowStockCount}</span>
              )}
            </button>
          ))}

          <div style={styles.mobileDivider} />

          <button onClick={handleLogout} style={styles.mobileLogout}>
            Cerrar sesión
          </button>
        </div>
      )}
    </nav>
  );
}

const styles = {
  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 20px",
    height: 60,
    background: "#fff",
    borderBottom: "1px solid #e2e8f0",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  left: { display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 },
  brand: { display: "flex", alignItems: "center", gap: 10, cursor: "pointer", flexShrink: 0 },
  icon: { fontSize: 22 },
  brandName: { fontSize: 18, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.3px" },
  links: {
    display: "flex", alignItems: "center", gap: 2,
    overflowX: "auto", flex: 1, minWidth: 0,
    msOverflowStyle: "none", scrollbarWidth: "none",
  },
  link: {
    padding: "20px 10px", background: "transparent", border: "none",
    fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "color 0.2s",
    whiteSpace: "nowrap", flexShrink: 0, display: "flex", alignItems: "center", gap: 6,
  },
  badge: {
    background: "#dc2626", color: "#fff", fontSize: 10, fontWeight: 700,
    borderRadius: 10, padding: "1px 6px", minWidth: 18, textAlign: "center",
    lineHeight: "16px",
  },
  mobileBadge: {
    background: "#dc2626", color: "#fff", fontSize: 10, fontWeight: 700,
    borderRadius: 10, padding: "1px 6px", minWidth: 18, textAlign: "center",
    lineHeight: "16px", marginLeft: 8,
  },
  right: { display: "flex", alignItems: "center", gap: 12, flexShrink: 0 },
  userInfo: { display: "flex", alignItems: "center", gap: 8 },
  avatar: {
    width: 32, height: 32, borderRadius: "50%", color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 13, fontWeight: 700, flexShrink: 0,
  },
  userName: { fontSize: 13, fontWeight: 600, color: "#0f172a", margin: 0, lineHeight: 1.3 },
  userRole: { fontSize: 11, margin: 0, lineHeight: 1.3 },
  logoutBtn: {
    padding: "6px 12px", background: "transparent", border: "1.5px solid #e2e8f0",
    borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#64748b", cursor: "pointer",
  },
  hamburger: {
    background: "none", border: "none", fontSize: 22,
    cursor: "pointer", color: "#0f172a", padding: "8px",
  },
  mobileMenu: {
    position: "absolute", top: 64, left: 0, right: 0,
    background: "#fff", borderBottom: "1px solid #e2e8f0",
    padding: "16px", display: "flex", flexDirection: "column",
    gap: 4, zIndex: 99, boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  },
  mobileUser: { display: "flex", alignItems: "center", gap: 12, padding: "8px 4px 16px" },
  mobileDivider: { height: 1, background: "#f1f5f9", margin: "8px 0" },
  mobileLink: {
    padding: "12px 16px", border: "none", borderRadius: 10,
    fontSize: 15, fontWeight: 600, cursor: "pointer", textAlign: "left",
  },
  mobileLogout: {
    padding: "12px 16px", background: "#fef2f2", border: "none",
    borderRadius: 10, fontSize: 15, fontWeight: 600, color: "#dc2626",
    cursor: "pointer", textAlign: "left", marginTop: 4,
  },
};