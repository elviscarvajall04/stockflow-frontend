import { useState } from "react";
import { Link } from "react-router-dom";
import { authAPI } from "../services/api";
import toast from "react-hot-toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetUrl, setResetUrl] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await authAPI.forgotPassword(email);
      setResetUrl(data.resetUrl);
      toast.success("Enlace generado correctamente");
    } catch (err) {
      toast.error(err.message || "Error generando enlace");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>SF</div>
        <h1 style={styles.title}>Recuperar contraseña</h1>
        {!resetUrl ? (
          <form onSubmit={handleSubmit} style={styles.form}>
            <p style={styles.text}>
              Ingresa tu correo electrónico y generaremos un enlace para restablecer tu contraseña.
            </p>
            <div style={styles.field}>
              <label style={styles.label}>Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@empresa.com"
                required
                style={styles.input}
                autoFocus
              />
            </div>
            <button type="submit" disabled={loading} style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}>
              {loading ? "Generando..." : "Generar enlace"}
            </button>
            <Link to="/login" style={styles.link}>Volver al inicio de sesión</Link>
          </form>
        ) : (
          <div>
            <div style={styles.successBox}>
              <p style={styles.successTitle}>✅ Enlace generado</p>
              <p style={styles.text}>
                Comparte este enlace con el usuario para que restablezca su contraseña:
              </p>
              <div style={styles.urlBox}>
                <code style={styles.url}>{resetUrl}</code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(resetUrl);
                    toast.success("Enlace copiado");
                  }}
                  style={styles.copyBtn}
                >
                  Copiar
                </button>
              </div>
              <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 12 }}>
                El enlace expira en 1 hora.
              </p>
            </div>
            <Link to="/login" style={styles.link}>Volver al inicio de sesión</Link>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)",
    fontFamily: "'Segoe UI', system-ui, sans-serif", padding: 24,
  },
  card: {
    background: "#fff", borderRadius: 20, padding: "40px 36px",
    width: "100%", maxWidth: 420, boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
    border: "1px solid #f1f5f9",
  },
  logo: {
    width: 48, height: 48, borderRadius: 14,
    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 20, fontWeight: 800, margin: "0 auto 20px",
  },
  title: { fontSize: 22, fontWeight: 700, color: "#0f172a", textAlign: "center", margin: "0 0 8px" },
  text: { fontSize: 14, color: "#64748b", lineHeight: 1.6, margin: "0 0 20px", textAlign: "center" },
  form: { display: "flex", flexDirection: "column", gap: 16 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: "#374151" },
  input: {
    padding: "11px 14px", border: "1.5px solid #e2e8f0", borderRadius: 10,
    fontSize: 14, outline: "none", color: "#0f172a", background: "#fff",
  },
  btn: {
    padding: "12px 24px", background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    color: "#fff", border: "none", borderRadius: 10, fontSize: 15,
    fontWeight: 600, cursor: "pointer",
  },
  link: {
    display: "block", textAlign: "center", fontSize: 14, color: "#4f46e5",
    fontWeight: 500, marginTop: 16, textDecoration: "none",
  },
  successBox: {
    background: "#f8fafc", borderRadius: 12, padding: "20px",
    border: "1px solid #e2e8f0", marginBottom: 8,
  },
  successTitle: { fontSize: 15, fontWeight: 700, color: "#059669", margin: "0 0 12px" },
  urlBox: {
    display: "flex", gap: 8, alignItems: "center",
    background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px",
  },
  url: {
    flex: 1, fontSize: 11, color: "#0f172a", wordBreak: "break-all",
    fontFamily: "monospace", lineHeight: 1.5,
  },
  copyBtn: {
    padding: "6px 14px", background: "#eef2ff", color: "#4f46e5",
    border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0,
  },
};
