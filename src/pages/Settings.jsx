import { useState, useEffect } from "react";
import { companyAPI, ncfAPI } from "../services/api";
import Navbar from "../components/Navbar";
import toast from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const API_ORIGIN = API_BASE.replace("/api", "");

export default function Settings() {
  const [form, setForm] = useState({
    company_name: "",
    commercial_name: "",
    rnc: "",
    phone: "",
    email: "",
    address: "",
    logo_url: "",
    default_itbis: 18.00,
    currency: "RD$",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [ncfSequences, setNcfSequences] = useState([]);
  const [ncfEdit, setNcfEdit] = useState(null);
  const [ncfForm, setNcfForm] = useState({ prefix: "", current_number: "", valid_from: "", valid_until: "" });

  useEffect(() => {
    Promise.all([companyAPI.get(), ncfAPI.getAll()])
      .then(([company, ncf]) => {
        setForm({
          company_name: company.company_name || "",
          commercial_name: company.commercial_name || "",
          rnc: company.rnc || "",
          phone: company.phone || "",
          email: company.email || "",
          address: company.address || "",
          logo_url: company.logo_url || "",
          default_itbis: company.default_itbis || 18.00,
          currency: company.currency || "RD$",
        });
        setNcfSequences(Array.isArray(ncf) ? ncf : []);
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

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("logo", file);
      const res = await fetch(`${API_BASE}/company/logo`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setForm((prev) => ({ ...prev, logo_url: data.logo_url }));
      toast.success("Logo subido correctamente");
    } catch (err) {
      toast.error(err.message || "Error subiendo logo");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteLogo = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/company/logo`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setForm((prev) => ({ ...prev, logo_url: "" }));
      toast.success("Logo eliminado");
    } catch (err) {
      toast.error(err.message || "Error eliminando logo");
    }
  };

  const openNcfEdit = (seq) => {
    setNcfEdit(seq);
    setNcfForm({
      prefix: seq.prefix,
      current_number: seq.current_number,
      valid_from: seq.valid_from ? seq.valid_from.split("T")[0] : "",
      valid_until: seq.valid_until ? seq.valid_until.split("T")[0] : "",
    });
  };

  const handleNcfSave = async (e) => {
    e.preventDefault();
    if (!ncfEdit) return;
    try {
      await ncfAPI.update(ncfEdit.id, {
        prefix: ncfForm.prefix,
        current_number: Number(ncfForm.current_number),
        valid_from: ncfForm.valid_from,
        valid_until: ncfForm.valid_until,
      });
      toast.success("Secuencia NCF actualizada");
      const ncf = await ncfAPI.getAll();
      setNcfSequences(Array.isArray(ncf) ? ncf : []);
      setNcfEdit(null);
    } catch (err) {
      toast.error(err.message || "Error actualizando NCF");
    }
  };

  const getNcfTypeLabel = (type) => {
    const labels = { B01: "B01 — Consumidor Final", B02: "B02 — Facturación Crédito Fiscal" };
    return labels[type] || type;
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

          <h2 style={{ ...styles.sectionTitle, marginTop: 28 }}>Logo de la empresa</h2>

          <div style={styles.logoSection}>
            {form.logo_url ? (
              <div style={styles.logoPreview}>
                <img
                  src={`${API_ORIGIN}${form.logo_url}`}
                  alt="Logo"
                  style={styles.logoImg}
                />
                <button
                  type="button"
                  onClick={handleDeleteLogo}
                  style={styles.deleteLogoBtn}
                >
                  Eliminar logo
                </button>
              </div>
            ) : (
              <div style={styles.logoPlaceholder}>
                <span style={{ fontSize: 32, opacity: 0.3 }}>📷</span>
                <p style={{ margin: "8px 0 0", fontSize: 13, color: "#94a3b8" }}>
                  Sin logo
                </p>
              </div>
            )}
            <div style={styles.logoUpload}>
              <label style={styles.uploadLabel}>
                {uploading ? "Subiendo..." : "Seleccionar imagen"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleLogoUpload}
                  disabled={uploading}
                  style={{ display: "none" }}
                />
              </label>
              <p style={{ fontSize: 11, color: "#94a3b8", margin: "6px 0 0" }}>
                JPG, PNG, GIF o WebP. Máx 2MB.
              </p>
            </div>
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

      {/* Secuencias NCF */}
      <div style={{ ...styles.formCard, marginTop: 28 }}>
        <h2 style={styles.sectionTitle}>Secuencias NCF</h2>
        <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 20px", lineHeight: 1.6 }}>
          Las secuencias NCF se incrementan automáticamente al registrar una venta.
          Aquí puedes ver el estado actual de cada tipo.
        </p>
        {ncfSequences.length === 0 ? (
          <p style={{ color: "#94a3b8", fontSize: 14 }}>No hay secuencias NCF configuradas.</p>
        ) : (
          <table style={styles.ncfTable}>
            <thead>
              <tr>
                {["Tipo", "Prefijo", "Último NCF", "Vigente desde", "Vigente hasta", "Estado", "Acciones"].map((h) => (
                  <th key={h} style={styles.ncfTh}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ncfSequences.map((seq) => (
                <tr key={seq.id} style={styles.ncfTr}>
                  <td style={{ ...styles.ncfTd, fontWeight: 600 }}>{getNcfTypeLabel(seq.type)}</td>
                  <td style={{ ...styles.ncfTd, fontFamily: "monospace" }}>{seq.prefix}</td>
                  <td style={{ ...styles.ncfTd, fontFamily: "monospace" }}>
                    {seq.prefix}{String(seq.current_number).padStart(8, "0")}
                  </td>
                  <td style={styles.ncfTd}>{new Date(seq.valid_from).toLocaleDateString("es-DO")}</td>
                  <td style={styles.ncfTd}>{new Date(seq.valid_until).toLocaleDateString("es-DO")}</td>
                  <td style={styles.ncfTd}>
                    <span style={{
                      padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                      background: seq.is_active ? "#ecfdf5" : "#fef2f2",
                      color: seq.is_active ? "#059669" : "#dc2626",
                    }}>
                      {seq.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td style={styles.ncfTd}>
                    <button onClick={() => openNcfEdit(seq)} style={styles.editBtn}>Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal editar NCF */}
      {ncfEdit && (
        <div style={styles.overlay} onClick={() => setNcfEdit(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Editar secuencia {getNcfTypeLabel(ncfEdit.type)}</h2>
            <form onSubmit={handleNcfSave} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>Prefijo</label>
                <input value={ncfForm.prefix} onChange={(e) => setNcfForm({ ...ncfForm, prefix: e.target.value })} required style={styles.input} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Número actual</label>
                <input type="number" min="0" value={ncfForm.current_number} onChange={(e) => setNcfForm({ ...ncfForm, current_number: e.target.value })} required style={styles.input} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Vigente desde</label>
                <input type="date" value={ncfForm.valid_from} onChange={(e) => setNcfForm({ ...ncfForm, valid_from: e.target.value })} required style={styles.input} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Vigente hasta</label>
                <input type="date" value={ncfForm.valid_until} onChange={(e) => setNcfForm({ ...ncfForm, valid_until: e.target.value })} required style={styles.input} />
              </div>
              <div style={styles.modalBtns}>
                <button type="button" onClick={() => setNcfEdit(null)} style={styles.cancelBtn}>Cancelar</button>
                <button type="submit" style={styles.saveBtn}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
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
  form: { display: "flex", flexDirection: "column", gap: 18 },
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
  logoSection: {
    display: "flex", alignItems: "center", gap: 24,
    padding: "20px 0", flexWrap: "wrap",
  },
  logoPreview: { display: "flex", flexDirection: "column", alignItems: "center", gap: 8 },
  logoImg: { width: 120, height: 120, objectFit: "contain", borderRadius: 12, border: "1px solid #e2e8f0", background: "#fafafa" },
  deleteLogoBtn: {
    padding: "6px 14px", background: "#fef2f2", color: "#dc2626",
    border: "1px solid #fecaca", borderRadius: 8, fontSize: 12,
    fontWeight: 600, cursor: "pointer",
  },
  logoPlaceholder: {
    width: 120, height: 120, borderRadius: 12, border: "2px dashed #e2e8f0",
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", background: "#fafafa",
  },
  logoUpload: { display: "flex", flexDirection: "column", gap: 4 },
  uploadLabel: {
    display: "inline-block", padding: "10px 24px",
    background: "linear-gradient(135deg, #4f46e5, #7c3aed)", color: "#fff",
    borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer",
  },
  formFooter: { display: "flex", justifyContent: "flex-end", marginTop: 28 },
  saveBtn: {
    padding: "12px 32px", background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    color: "#fff", border: "none", borderRadius: 10, fontSize: 15,
    fontWeight: 600, cursor: "pointer",
  },
  ncfTable: { width: "100%", borderCollapse: "collapse", fontSize: 14 },
  ncfTh: {
    textAlign: "left", fontSize: 12, fontWeight: 600, color: "#94a3b8",
    textTransform: "uppercase", letterSpacing: "0.5px",
    padding: "14px 16px", borderBottom: "1px solid #f1f5f9", background: "#fafafa",
  },
  ncfTr: { borderBottom: "1px solid #f8fafc" },
  ncfTd: { padding: "12px 16px", fontSize: 13, color: "#334155" },
  editBtn: {
    padding: "6px 12px", background: "#eef2ff", color: "#4f46e5",
    border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
  },
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200,
  },
  modal: {
    background: "#fff", borderRadius: 20, padding: "36px",
    width: "100%", maxWidth: 500, boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
  },
  modalTitle: { fontSize: 20, fontWeight: 700, color: "#0f172a", margin: "0 0 24px" },
  modalBtns: { display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 4 },
  cancelBtn: {
    padding: "10px 20px", background: "transparent", border: "1.5px solid #e2e8f0",
    borderRadius: 10, fontSize: 14, fontWeight: 600, color: "#64748b", cursor: "pointer",
  },
};
