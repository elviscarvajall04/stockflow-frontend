import { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";
import toast from "react-hot-toast";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>Enlace inválido</h1>
          <p style={styles.text}>El enlace de recuperación no es válido o falta el token.</p>
          <Link to="/forgot-password" style={styles.link}>Solicitar nuevo enlace</Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setLoading(true);
    try {
      await authAPI.resetPassword(token, password);
      toast.success("Contraseña actualizada correctamente");
      setDone(true);
    } catch (err) {
      toast.error(err.message || "Error restableciendo contraseña");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.logo}>SF</div>
          <h1 style={styles.title}>Contraseña actualizada</h1>
          <p style={styles.text}>Tu contraseña se ha restablecido correctamente.</p>
          <Link to="/login" style={styles.linkBtn}>Iniciar sesión</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>SF</div>
        <h1 style={styles.title}>Restablecer contraseña</h1>
        <form onSubmit={handleSubmit} style={styles.form}>
          <p style={styles.text}>Ingresa tu nueva contraseña.</p>
          <div style={styles.field}>
            <label style={styles.label}>Nueva contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
              style={styles.input}
              autoFocus
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Confirmar contraseña</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repite la contraseña"
              required
              style={styles.input}
            />
          </div>
          <button type="submit" disabled={loading} style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}>
            {loading ? "Actualizando..." : "Restablecer contraseña"}
          </button>
          <Link to="/login" style={styles.link}>Volver al inicio de sesión</Link>
        </form>
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
    border: "1px solid #f1f5f9", textAlign: "center",
  },
  logo: {
    width: 48, height: 48, borderRadius: 14,
    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center",
    fontSize: 20, fontWeight: 800, marginBottom: 20,
  },
  title: { fontSize: 22, fontWeight: 700, color: "#0f172a", margin: "0 0 8px" },
  text: { fontSize: 14, color: "#64748b", lineHeight: 1.6, margin: "0 0 20px" },
  form: { display: "flex", flexDirection: "column", gap: 16, textAlign: "left" },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: "#374151" },
  input: {
    padding: "11px 14px", border: "1.5px solid #e2e8f0", borderRadius: 10,
    fontSize: 14, outline: "none", color: "#0f172a", background: "#fff",
  },
  btn: {
    padding: "12px 24px", background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    color: "#fff", border: "none", borderRadius: 10, fontSize: 15,
    fontWeight: 600, cursor: "pointer", marginTop: 4,
  },
  link: {
    display: "block", textAlign: "center", fontSize: 14, color: "#4f46e5",
    fontWeight: 500, textDecoration: "none",
  },
  linkBtn: {
    display: "inline-block", padding: "12px 32px",
    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    color: "#fff", border: "none", borderRadius: 10, fontSize: 15,
    fontWeight: 600, cursor: "pointer", textDecoration: "none", marginTop: 8,
  },
};
