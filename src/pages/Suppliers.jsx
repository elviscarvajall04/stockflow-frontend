import { useState, useEffect } from "react";
import { suppliersAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import toast from "react-hot-toast";

export default function Suppliers() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", rnc: "", phone: "", email: "", address: "" });
  const [formLoading, setFormLoading] = useState(false);
  const [detailTarget, setDetailTarget] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadSuppliers = () => {
    setLoading(true);
    suppliersAPI.getAll()
      .then(setSuppliers)
      .catch(() => toast.error("Error cargando proveedores"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadSuppliers(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", rnc: "", phone: "", email: "", address: "" });
    setShowModal(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({ name: s.name, rnc: s.rnc || "", phone: s.phone || "", email: s.email || "", address: s.address || "" });
    setShowModal(true);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (editing) {
        await suppliersAPI.update(editing.id, form);
        toast.success("Proveedor actualizado");
      } else {
        await suppliersAPI.create(form);
        toast.success("Proveedor creado");
      }
      setShowModal(false);
      loadSuppliers();
    } catch (err) {
      toast.error(err.message || "Error guardando proveedor");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await suppliersAPI.delete(deleteTarget.id);
      toast.success(`"${deleteTarget.name}" eliminado`);
      setDeleteTarget(null);
      loadSuppliers();
    } catch (err) {
      toast.error(err.message || "Error eliminando proveedor");
    }
  };

  const openDetail = async (supplier) => {
    setDetailTarget(supplier);
    setDetailData(null);
    setDetailLoading(true);
    try {
      const data = await suppliersAPI.getById(supplier.id);
      setDetailData(data);
    } catch {
      toast.error("Error cargando detalle del proveedor");
    } finally {
      setDetailLoading(false);
    }
  };

  const filtered = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.rnc && s.rnc.includes(search)) ||
    (s.phone && s.phone.includes(search))
  );

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.content}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Proveedores</h1>
            <p style={styles.subtitle}>Gestión de proveedores</p>
          </div>
          {isAdmin && (
            <button onClick={openCreate} style={styles.createBtn}>+ Nuevo proveedor</button>
          )}
        </div>

        <div style={styles.searchBox}>
          <span style={styles.searchIcon}>🔍</span>
          <input type="text" placeholder="Buscar por nombre, RNC o teléfono..."
            value={search} onChange={(e) => setSearch(e.target.value)} style={styles.searchInput} />
          {search && <button onClick={() => setSearch("")} style={styles.clearBtn}>✕</button>}
        </div>

        {loading && <p style={styles.msg}>Cargando proveedores...</p>}

        {!loading && (
          <div style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {["Nombre", "RNC", "Teléfono", "Email", "Compras", "Acciones"].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} style={styles.empty}>No hay proveedores registrados.</td></tr>
                ) : (
                  filtered.map((s) => (
                    <tr key={s.id} style={styles.tr}>
                      <td style={{ ...styles.td, fontWeight: 600, color: "#0f172a" }}>{s.name}</td>
                      <td style={styles.td}>{s.rnc || "—"}</td>
                      <td style={styles.td}>{s.phone || "—"}</td>
                      <td style={styles.td}>{s.email || "—"}</td>
                      <td style={styles.td}>{s.purchase_count || 0}</td>
                      <td style={styles.td}>
                        <button onClick={() => openDetail(s)} style={styles.detailBtn}>Ver</button>
                        {isAdmin && (
                          <>
                            <button onClick={() => openEdit(s)} style={styles.editBtn}>Editar</button>
                            <button onClick={() => setDeleteTarget(s)} style={styles.deleteBtn}>Eliminar</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div style={styles.overlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>{editing ? "Editar proveedor" : "Nuevo proveedor"}</h2>
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>Nombre *</label>
                <input name="name" value={form.name} onChange={handleChange} required style={styles.input} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>RNC</label>
                <input name="rnc" value={form.rnc} onChange={handleChange} style={styles.input} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Teléfono</label>
                <input name="phone" value={form.phone} onChange={handleChange} style={styles.input} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} style={styles.input} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Dirección</label>
                <input name="address" value={form.address} onChange={handleChange} style={styles.input} />
              </div>
              <div style={styles.modalBtns}>
                <button type="button" onClick={() => setShowModal(false)} style={styles.cancelBtn}>Cancelar</button>
                <button type="submit" disabled={formLoading} style={{ ...styles.saveBtn, opacity: formLoading ? 0.7 : 1 }}>
                  {formLoading ? "Guardando..." : editing ? "Guardar cambios" : "Crear proveedor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminación */}
      {deleteTarget && (
        <div style={styles.overlay} onClick={() => setDeleteTarget(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Eliminar proveedor</h2>
            <p style={{ fontSize: 15, color: "#334155", marginBottom: 16, lineHeight: 1.6 }}>
              ¿Estás seguro de eliminar a <strong>{deleteTarget.name}</strong>?
            </p>
            <div style={{
              background: "#fef2f2", border: "1px solid #fca5a5",
              borderRadius: 10, padding: "14px 16px", fontSize: 14, color: "#991b1b",
              lineHeight: 1.6, marginBottom: 20,
            }}>
              🗑️ No se puede eliminar si tiene compras registradas.
            </div>
            <div style={styles.modalBtns}>
              <button onClick={() => setDeleteTarget(null)} style={styles.cancelBtn}>Cancelar</button>
              <button onClick={handleDelete} style={{
                padding: "10px 20px", background: "#dc2626", color: "#fff",
                border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalle proveedor */}
      {detailTarget && (
        <div style={styles.overlay} onClick={() => { setDetailTarget(null); setDetailData(null); }}>
          <div style={{ ...styles.modal, maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>{detailTarget.name}</h2>

            {detailLoading ? (
              <p style={{ color: "#64748b", fontSize: 14 }}>Cargando detalle...</p>
            ) : detailData ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                  <div><strong style={styles.detailLabel}>RNC</strong><p style={styles.detailValue}>{detailData.rnc || "—"}</p></div>
                  <div><strong style={styles.detailLabel}>Teléfono</strong><p style={styles.detailValue}>{detailData.phone || "—"}</p></div>
                  <div><strong style={styles.detailLabel}>Email</strong><p style={styles.detailValue}>{detailData.email || "—"}</p></div>
                  <div><strong style={styles.detailLabel}>Dirección</strong><p style={styles.detailValue}>{detailData.address || "—"}</p></div>
                </div>

                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>
                  Historial de compras
                </h3>
                <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px" }}>
                  Total: <strong style={{ color: "#059669" }}>${Number(detailData.total_purchases || 0).toLocaleString("es-DO")}</strong>
                </p>

                {(!detailData.purchases || detailData.purchases.length === 0) ? (
                  <p style={{ color: "#94a3b8", fontSize: 14, textAlign: "center", padding: 24 }}>No hay compras registradas.</p>
                ) : (
                  <table style={styles.nestedTable}>
                    <thead>
                      <tr>
                        {["#", "Total", "NCF", "Fecha", "Registrado por"].map((h) => (
                          <th key={h} style={styles.nestedTh}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {detailData.purchases.map((p) => (
                        <tr key={p.id} style={styles.nestedTr}>
                          <td style={styles.nestedTd}>#{p.id}</td>
                          <td style={{ ...styles.nestedTd, fontWeight: 600, color: "#059669" }}>
                            ${Number(p.total).toLocaleString("es-DO")}
                          </td>
                          <td style={{ ...styles.nestedTd, fontFamily: "monospace", fontSize: 12 }}>{p.ncf || "—"}</td>
                          <td style={styles.nestedTd}>
                            {new Date(p.created_at).toLocaleDateString("es-DO", {
                              day: "2-digit", month: "short", year: "numeric",
                            })}
                          </td>
                          <td style={styles.nestedTd}>{p.user_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            ) : null}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={() => { setDetailTarget(null); setDetailData(null); }} style={styles.cancelBtn}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f8fafc", fontFamily: "'Segoe UI', system-ui, sans-serif" },
  content: { maxWidth: 1100, margin: "0 auto", padding: "32px 24px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 },
  title: { fontSize: 28, fontWeight: 700, color: "#0f172a", margin: "0 0 4px" },
  subtitle: { fontSize: 15, color: "#64748b", margin: 0 },
  createBtn: {
    padding: "10px 20px", background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer",
  },
  searchBox: { position: "relative", marginBottom: 20, maxWidth: 420, display: "flex", alignItems: "center" },
  searchIcon: { position: "absolute", left: 14, fontSize: 14 },
  searchInput: {
    width: "100%", padding: "11px 40px 11px 38px", border: "1.5px solid #e2e8f0",
    borderRadius: 10, fontSize: 14, outline: "none", color: "#0f172a", background: "#fff",
  },
  clearBtn: { position: "absolute", right: 12, background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 14 },
  msg: { color: "#64748b", fontSize: 15 },
  tableCard: {
    background: "#fff", borderRadius: 16, overflow: "hidden",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left", fontSize: 12, fontWeight: 600, color: "#94a3b8",
    textTransform: "uppercase", letterSpacing: "0.5px",
    padding: "16px 20px", borderBottom: "1px solid #f1f5f9", background: "#fafafa",
  },
  tr: { borderBottom: "1px solid #f8fafc" },
  td: { padding: "14px 20px", fontSize: 14, color: "#334155" },
  editBtn: {
    padding: "6px 12px", background: "#eef2ff", color: "#4f46e5",
    border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", marginRight: 8,
  },
  deleteBtn: {
    padding: "6px 12px", background: "#fef2f2", color: "#dc2626",
    border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer",
  },
  empty: { textAlign: "center", padding: "40px", color: "#94a3b8", fontSize: 14 },
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200,
  },
  modal: {
    background: "#fff", borderRadius: 20, padding: "36px",
    width: "100%", maxWidth: 440, boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
  },
  modalTitle: { fontSize: 20, fontWeight: 700, color: "#0f172a", margin: "0 0 24px" },
  form: { display: "flex", flexDirection: "column", gap: 18 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: "#374151" },
  input: {
    padding: "11px 14px", border: "1.5px solid #e2e8f0",
    borderRadius: 10, fontSize: 14, outline: "none", color: "#0f172a",
  },
  modalBtns: { display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 4 },
  cancelBtn: {
    padding: "10px 20px", background: "transparent", border: "1.5px solid #e2e8f0",
    borderRadius: 10, fontSize: 14, fontWeight: 600, color: "#64748b", cursor: "pointer",
  },
  saveBtn: {
    padding: "10px 24px", background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer",
  },
  detailBtn: {
    padding: "6px 12px", background: "#f8fafc", color: "#475569",
    border: "1.5px solid #e2e8f0", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", marginRight: 8,
  },
  detailLabel: { fontSize: 12, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" },
  detailValue: { fontSize: 15, color: "#0f172a", margin: "4px 0 0", fontWeight: 500 },
  nestedTable: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  nestedTh: {
    textAlign: "left", fontSize: 11, fontWeight: 600, color: "#94a3b8",
    textTransform: "uppercase", letterSpacing: "0.5px",
    padding: "10px 12px", borderBottom: "1px solid #f1f5f9", background: "#fafafa",
  },
  nestedTr: { borderBottom: "1px solid #f8fafc" },
  nestedTd: { padding: "10px 12px", fontSize: 13, color: "#334155" },
};
