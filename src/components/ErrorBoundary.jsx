import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error no capturado:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.page}>
          <div style={styles.card}>
            <div style={styles.icon}>⚠️</div>
            <h1 style={styles.title}>Algo salió mal</h1>
            <p style={styles.text}>
              Ocurrió un error inesperado. Recarga la página o intenta de nuevo.
            </p>
            {this.props.showDetails && this.state.error && (
              <pre style={styles.detail}>
                {this.state.error.message}
              </pre>
            )}
            <div style={styles.actions}>
              <button onClick={() => window.location.reload()} style={styles.btn}>
                Recargar página
              </button>
              <button onClick={() => window.location.href = "/dashboard"} style={styles.btnSecondary}>
                Ir al inicio
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles = {
  page: {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    background: "#f8fafc", fontFamily: "'Segoe UI', system-ui, sans-serif", padding: 24,
  },
  card: {
    background: "#fff", borderRadius: 20, padding: "48px 40px",
    maxWidth: 440, width: "100%", textAlign: "center",
    boxShadow: "0 4px 24px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9",
  },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: 700, color: "#0f172a", margin: "0 0 12px" },
  text: { fontSize: 15, color: "#64748b", lineHeight: 1.6, margin: "0 0 24px" },
  detail: {
    background: "#fef2f2", color: "#dc2626", padding: "12px 16px",
    borderRadius: 8, fontSize: 12, textAlign: "left", overflowX: "auto",
    marginBottom: 20, border: "1px solid #fecaca",
  },
  actions: { display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" },
  btn: {
    padding: "11px 24px", background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    color: "#fff", border: "none", borderRadius: 10, fontSize: 14,
    fontWeight: 600, cursor: "pointer",
  },
  btnSecondary: {
    padding: "11px 24px", background: "transparent", border: "1.5px solid #e2e8f0",
    borderRadius: 10, fontSize: 14, fontWeight: 600, color: "#475569", cursor: "pointer",
  },
};
