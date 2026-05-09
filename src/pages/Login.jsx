import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await authAPI.login(form.email, form.password);
      login(data.token, data.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Credenciales inválidas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Panel izquierdo - solo visible en desktop */}
      <div className="login-brand" style={styles.brand}>
        <div style={styles.brandInner}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>📦</span>
          </div>
          <h1 style={styles.brandTitle}>StockFlow RD</h1>
          <p style={styles.brandSub}>
            Sistema de gestión de inventario y ventas para tu negocio.
          </p>
          <div style={styles.features}>
            {[
              "Control de stock en tiempo real",
              "Registro de ventas",
              "Reportes del dashboard",
              "Roles admin y empleado",
            ].map((f) => (
              <div key={f} style={styles.featureItem}>
                <span style={styles.check}>✓</span>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panel derecho - formulario */}
      <div style={styles.formPanel}>
        {/* Logo mobile */}
        <div className="login-mobile-logo" style={styles.mobileLogo}>
          <span style={styles.mobileLogoIcon}>📦</span>
          <span style={styles.mobileLogoText}>StockFlow RD</span>
        </div>

        <div style={styles.formCard}>
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>Bienvenido de vuelta</h2>
            <p style={styles.formSub}>Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Correo electrónico</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="admin@stockflow.com"
                required
                style={styles.input}
                onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Contraseña</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                style={styles.input}
                onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              />
            </div>

            {error && (
              <div style={styles.errorBox}>
                <span>⚠️</span> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.btn,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Iniciando sesión..." : "Iniciar sesión"}
            </button>
          </form>

          <p style={styles.hint}>
            ¿No tienes cuenta?{" "}
            <span style={styles.link} onClick={() => navigate("/register")}>
              Regístrate
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  brand: {
    flex: 1,
    background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 40px",
    color: "#fff",
  },
  brandInner: { maxWidth: 380 },
  logo: {
    width: 64,
    height: 64,
    background: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  logoIcon: { fontSize: 32 },
  brandTitle: {
    fontSize: 36,
    fontWeight: 700,
    margin: "0 0 12px",
    letterSpacing: "-0.5px",
  },
  brandSub: {
    fontSize: 16,
    opacity: 0.85,
    lineHeight: 1.6,
    marginBottom: 40,
  },
  features: { display: "flex", flexDirection: "column", gap: 16 },
  featureItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    fontSize: 15,
    opacity: 0.9,
  },
  check: {
    width: 24,
    height: 24,
    background: "rgba(255,255,255,0.2)",
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 700,
    flexShrink: 0,
  },
  formPanel: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "#f8fafc",
    padding: "40px 24px",
  },
  mobileLogo: {
    display: "none",
    alignItems: "center",
    gap: 10,
    marginBottom: 24,
  },
  mobileLogoIcon: { fontSize: 28 },
  mobileLogoText: {
    fontSize: 22,
    fontWeight: 700,
    color: "#0f172a",
  },
  formCard: {
    width: "100%",
    maxWidth: 420,
    background: "#fff",
    borderRadius: 20,
    padding: "40px 36px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
  },
  formHeader: { marginBottom: 32 },
  formTitle: {
    fontSize: 26,
    fontWeight: 700,
    color: "#0f172a",
    margin: "0 0 8px",
  },
  formSub: { color: "#64748b", fontSize: 14, margin: 0 },
  form: { display: "flex", flexDirection: "column", gap: 20 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 14, fontWeight: 600, color: "#374151" },
  input: {
    padding: "12px 14px",
    border: "1.5px solid #e2e8f0",
    borderRadius: 10,
    fontSize: 15,
    outline: "none",
    transition: "border-color 0.2s",
    color: "#0f172a",
    background: "#fff",
  },
  errorBox: {
    background: "#fef2f2",
    color: "#dc2626",
    border: "1px solid #fecaca",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 14,
    display: "flex",
    gap: 8,
    alignItems: "center",
  },
  btn: {
    padding: "13px",
    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    marginTop: 4,
  },
  hint: {
    textAlign: "center",
    fontSize: 14,
    color: "#64748b",
    marginTop: 24,
  },
  link: { color: "#4f46e5", fontWeight: 600, cursor: "pointer" },
};