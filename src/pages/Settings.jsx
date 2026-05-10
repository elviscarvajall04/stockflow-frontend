import { useState, useEffect } from "react";
import { companyAPI } from "../services/api";
import Navbar from "../components/Navbar";
import toast from "react-hot-toast";

export default function Settings() {
  const [form, setForm] = useState({
    company_name: "",
    commercial_name: "",
    rnc: "",
    phone: "",
    email: "",
    address: "",
    default_itbis: 18.00,
    currency: "RD$",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    companyAPI.get()
      .then((data) => {
        setForm({
          company_name: data.company_name || "",
          commercial_name: data.commercial_name || "",
          rnc: data.rnc || "",
          phone: data.phone || "",
          email: data.email || "",
          address: data.address || "",
          default_itbis: data.default_itbis || 18.00,
          currency: data.currency || "RD$",
        });
      })
      .catch(() => toast.error("Error cargando configuración"))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await companyAPI.update({
        ...form,
        default_itbis: Number(form.default_itbis),
      });
      toast.success("Configuración guardada correctamente");
    } catch (err) {
      toast.error(err.message || "Error guardando configuración");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <Navbar />
        <div style={styles.content}>
          <p style={styles.msg}>Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.content}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Configuración</h1>
            <p style={styles.subtitle}>Datos de la empresa y facturación</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={styles.formCard}>
          <h2 style={styles.sectionTitle}>Datos de la empresa</h2>

          <div style={styles.grid2}>
            <div style={styles.field}>
              <label style={styles.label}>Nombre de la empresa</label>
              <input
                name="company_name"
                value={form.company_name}
                onChange={handleChange}
                placeholder="Ej: Mi Empresa SRL"
                required
                style={styles.input}
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

            <div style={styles.field}>
              <label style={styles.label}>RNC</label>
              <input
                name="rnc"
                value={form.rnc}
                onChange={handleChange}
                placeholder="Ej: 123456789"
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Teléfono</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Ej: 809-555-5555"
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Ej: info@miempresa.com"
                style={styles.input}
              />
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

          <h2 style={{ ...styles.sectionTitle, marginTop: 28 }}>Configuración fiscal</h2>

          <div style={styles.grid2}>
            <div style={styles.field}>
              <label style={styles.label}>ITBIS por defecto (%)</label>
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
          </div>

          <div style={styles.formFooter}>
            <button
              type="submit"
              disabled={saving}
              style={{ ...styles.saveBtn, opacity: saving ? 0.7 : 1 }}
            >
              {saving ? "Guardando..." : "Guardar configuración"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f8fafc", fontFamily: "'Segoe UI', system-ui, sans-serif" },
  content: { maxWidth: 800, margin: "0 auto", padding: "32px 24px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 },
  title: { fontSize: 28, fontWeight: 700, color: "#0f172a", margin: "0 0 4px" },
  subtitle: { fontSize: 15, color: "#64748b", margin: 0 },
  msg: { color: "#64748b", fontSize: 15 },
  formCard: {
    background: "#fff", borderRadius: 16, padding: "36px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9",
  },
  sectionTitle: { fontSize: 17, fontWeight: 700, color: "#0f172a", margin: "0 0 20px" },
  grid2: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 18,
  },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: "#374151" },
  input: {
    padding: "11px 14px", border: "1.5px solid #e2e8f0",
    borderRadius: 10, fontSize: 14, outline: "none", color: "#0f172a",
    background: "#fff",
  },
  formFooter: { display: "flex", justifyContent: "flex-end", marginTop: 28 },
  saveBtn: {
    padding: "12px 32px", background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    color: "#fff", border: "none", borderRadius: 10, fontSize: 15,
    fontWeight: 600, cursor: "pointer",
  },
};
