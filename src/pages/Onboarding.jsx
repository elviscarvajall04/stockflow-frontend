import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { companyAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const steps = [
  { id: 1, label: "Empresa" },
  { id: 2, label: "Confirmar" },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { refreshCompanyStatus } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    company_name: "",
    commercial_name: "",
    rnc: "",
    phone: "",
    email: "",
    address: "",
    default_itbis: "18.00",
    currency: "RD$",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const isStep1Valid = () => form.company_name.trim().length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await companyAPI.update({
        ...form,
        default_itbis: Number(form.default_itbis),
      });
      toast.success("Empresa configurada correctamente");
      await refreshCompanyStatus();
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast.error(err.message || "Error guardando configuración");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.logo}>SF</div>
          <h1 style={styles.title}>Configura tu empresa</h1>
          <p style={styles.subtitle}>
            Completa los datos de tu empresa para empezar a usar StockFlow RD.
          </p>
        </div>

        <div style={styles.progressBar}>
          {steps.map((s, i) => (
            <div key={s.id} style={styles.progressStep}>
              <div style={{
                ...styles.stepDot,
                background: s.id <= step ? "#4f46e5" : "#e2e8f0",
                color: s.id <= step ? "#fff" : "#94a3b8",
              }}>
                {s.id <= step ? "✓" : s.id}
              </div>
              <span style={{
                ...styles.stepLabel,
                color: s.id <= step ? "#4f46e5" : "#94a3b8",
                fontWeight: s.id <= step ? 600 : 400,
              }}>
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <div style={{
                  ...styles.stepLine,
                  background: s.id < step ? "#4f46e5" : "#e2e8f0",
                }} />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={styles.formCard}>
          {step === 1 && (
            <>
              <h2 style={styles.sectionTitle}>Datos de la empresa</h2>
              <div style={styles.field}>
                <label style={styles.label}>Nombre de la empresa *</label>
                <input
                  name="company_name"
                  value={form.company_name}
                  onChange={handleChange}
                  placeholder="Ej: Mi Empresa SRL"
                  required
                  style={styles.input}
                  autoFocus
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Nombre comercial</label>
                <input
                  name="commercial_name"
                  value={form.commercial_name}
                  onChange={handleChange}
                  placeholder="Opcional"
                  style={styles.input}
                />
              </div>
              <div style={styles.grid2}>
                <div style={styles.field}>
                  <label style={styles.label}>RNC</label>
                  <input
                    name="rnc"
                    value={form.rnc}
                    onChange={handleChange}
                    placeholder="123456789"
                    style={styles.input}
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Teléfono</label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="809-555-5555"
                    style={styles.input}
                  />
                </div>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Email</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="info@miempresa.com"
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Dirección</label>
                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Dirección fiscal"
                  rows={2}
                  style={{ ...styles.input, resize: "vertical", fontFamily: "inherit" }}
                />
              </div>
              <div style={styles.grid2}>
                <div style={styles.field}>
                  <label style={styles.label}>ITBIS por defecto</label>
                  <select
                    name="default_itbis"
                    value={form.default_itbis}
                    onChange={handleChange}
                    style={styles.input}
                  >
                    <option value="18.00">18% — General</option>
                    <option value="0.00">0% — Exento</option>
                    <option value="16.00">16% — Reducido</option>
                  </select>
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Moneda</label>
                  <select
                    name="currency"
                    value={form.currency}
                    onChange={handleChange}
                    style={styles.input}
                  >
                    <option value="RD$">RD$ — Peso Dominicano</option>
                    <option value="US$">US$ — Dólar Americano</option>
                    <option value="EUR">€ — Euro</option>
                  </select>
                </div>
              </div>
              <div style={styles.actions}>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!isStep1Valid()}
                  style={{
                    ...styles.primaryBtn,
                    opacity: isStep1Valid() ? 1 : 0.5,
                    cursor: isStep1Valid() ? "pointer" : "not-allowed",
                  }}
                >
                  Continuar →
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 style={styles.sectionTitle}>Confirma los datos</h2>
              <div style={styles.summaryCard}>
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>Empresa</span>
                  <span style={styles.summaryValue}>{form.company_name}</span>
                </div>
                {form.commercial_name && (
                  <div style={styles.summaryRow}>
                    <span style={styles.summaryLabel}>Nombre comercial</span>
                    <span style={styles.summaryValue}>{form.commercial_name}</span>
                  </div>
                )}
                {form.rnc && (
                  <div style={styles.summaryRow}>
                    <span style={styles.summaryLabel}>RNC</span>
                    <span style={styles.summaryValue}>{form.rnc}</span>
                  </div>
                )}
                {form.phone && (
                  <div style={styles.summaryRow}>
                    <span style={styles.summaryLabel}>Teléfono</span>
                    <span style={styles.summaryValue}>{form.phone}</span>
                  </div>
                )}
                {form.email && (
                  <div style={styles.summaryRow}>
                    <span style={styles.summaryLabel}>Email</span>
                    <span style={styles.summaryValue}>{form.email}</span>
                  </div>
                )}
                {form.address && (
                  <div style={styles.summaryRow}>
                    <span style={styles.summaryLabel}>Dirección</span>
                    <span style={styles.summaryValue}>{form.address}</span>
                  </div>
                )}
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>ITBIS</span>
                  <span style={styles.summaryValue}>{form.default_itbis}%</span>
                </div>
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>Moneda</span>
                  <span style={styles.summaryValue}>{form.currency}</span>
                </div>
              </div>
              <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>
                Puedes modificar estos datos después desde Configuración.
              </p>
              <div style={styles.actions}>
                <button type="button" onClick={() => setStep(1)} style={styles.secondaryBtn}>
                  ← Atrás
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ ...styles.primaryBtn, opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? "Guardando..." : "✓ Comenzar a usar StockFlow"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh", background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "'Segoe UI', system-ui, sans-serif", padding: 24,
  },
  container: { width: "100%", maxWidth: 560 },
  header: { textAlign: "center", marginBottom: 36 },
  logo: {
    width: 56, height: 56, borderRadius: 16,
    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    color: "#fff", display: "inline-flex", alignItems: "center",
    justifyContent: "center", fontSize: 22, fontWeight: 800,
    marginBottom: 16,
  },
  title: { fontSize: 26, fontWeight: 700, color: "#0f172a", margin: "0 0 8px" },
  subtitle: { fontSize: 15, color: "#64748b", margin: 0, lineHeight: 1.6 },
  progressBar: {
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: 0, marginBottom: 32,
  },
  progressStep: { display: "flex", alignItems: "center", gap: 8 },
  stepDot: {
    width: 28, height: 28, borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 12, fontWeight: 700, flexShrink: 0,
  },
  stepLabel: { fontSize: 13, whiteSpace: "nowrap" },
  stepLine: {
    width: 60, height: 2, margin: "0 8px",
  },
  formCard: {
    background: "#fff", borderRadius: 20, padding: "36px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9",
  },
  sectionTitle: { fontSize: 17, fontWeight: 700, color: "#0f172a", margin: "0 0 24px" },
  field: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 18 },
  label: { fontSize: 13, fontWeight: 600, color: "#374151" },
  input: {
    padding: "11px 14px", border: "1.5px solid #e2e8f0",
    borderRadius: 10, fontSize: 14, outline: "none", color: "#0f172a",
    background: "#fff",
  },
  grid2: {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18,
  },
  actions: {
    display: "flex", justifyContent: "flex-end", gap: 12,
    marginTop: 24,
  },
  primaryBtn: {
    padding: "12px 28px", background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    color: "#fff", border: "none", borderRadius: 10, fontSize: 15,
    fontWeight: 600, cursor: "pointer",
  },
  secondaryBtn: {
    padding: "12px 24px", background: "transparent",
    border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 15,
    fontWeight: 600, color: "#475569", cursor: "pointer",
  },
  summaryCard: {
    background: "#f8fafc", borderRadius: 12, padding: "20px",
    display: "flex", flexDirection: "column", gap: 14,
    marginBottom: 16, border: "1px solid #e2e8f0",
  },
  summaryRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  summaryLabel: { fontSize: 13, color: "#64748b", fontWeight: 500 },
  summaryValue: { fontSize: 14, color: "#0f172a", fontWeight: 600, textAlign: "right" },
};
