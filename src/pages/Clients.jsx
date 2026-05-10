import { useState, useEffect } from "react";
import { clientsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import toast from "react-hot-toast";

export default function Clients() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });
  const [formLoading, setFormLoading] = useState(false);

  const loadClients = () => {
    setLoading(true);
    clientsAPI.getAll()
      .then(setClients)
      .catch(() => toast.error("Error cargando clientes"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadClients(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", email: "", phone: "", address: "" });
    setShowModal(true);
  };

  const openEdit = (client) => {
    setEditing(client);
    setForm({
      name: client.name,
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
    });
    setShowModal(true);
  };

  const openDetail = async (client) => {
    try {
      const data = await clientsAPI.getById(client.id);
      setSelectedClient(data);
      setShowDetail(true);
    } catch {
      toast.error("Error cargando detalle del cliente");
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
  };

  const closeDetail = () => {
    setShowDetail(false);
    setSelectedClient(null);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (editing) {
        await clientsAPI.update(editing.id, form);
        toast.success("Cliente actualizado correctamente");
      } else {
        await clientsAPI.create(form);
        toast.success("Cliente creado correctamente");
      }
      closeModal();
      loadClients();
    } catch (err) {
      toast.error(err.message || "Error guardando cliente");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`¿Eliminar a "${name}"?`)) return;
    try {
      await clientsAPI.delete(id);
      toast.success(`"${name}" eliminado correctamente`);
      loadClients();
    } catch (err) {
      toast.error(err.message || "Error eliminando cliente");
    }
  };

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
    (c.phone && c.phone.includes(search))
  );

  return (
    <div style={styles.page}>
      <Navbar />

      <div style={styles.content}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Clientes</h1>
            <p style={styles.subtitle}>Gestión de clientes y historial de compras</p>
          </div>
          {isAdmin && (
            <button onClick={openCreate} style={styles.createBtn}>
              + Nuevo cliente
            </button>
          )}
        </div>

        {/* Buscador */}
        <div style={styles.searchBox}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Buscar por nombre, email o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
          {search && (
            <button onClick={() => setSearch("")} style={styles.clearBtn}>✕</button>
          )}
        </div>

        {loading && <p style={styles.msg}>Cargando clientes...</p>}

        {!loading && (
          <div style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {["ID", "Nombre", "Email", "Teléfono", "Registrado", "Acciones"].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={styles.empty}>
                      {search ? `No se encontraron clientes con "${search}"` : "No hay clientes registrados."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => (
                    <tr key={c.id} style={styles.tr}>
                      <td style={styles.td}>#{c.id}</td>
                      <td style={{ ...styles.td, fontWeight: 600, color: "#0f172a" }}>{c.name}</td>
                      <td style={styles.td}>{c.email || "—"}</td>
                      <td style={styles.td}>{c.phone || "—"}</td>
                      <td style={styles.td}>
                        {new Date(c.created_at).toLocaleDateString("es-DO", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </td>
                      <td style={styles.td}>
                        <button onClick={() => openDetail(c)} style={styles.detailBtn}>
                          Ver
                        </button>
                        {isAdmin && (
                          <>
                            <button onClick={() => openEdit(c)} style={styles.editBtn}>
                              Editar
                            </button>
                            <button onClick={() => handleDelete(c.id, c.name)} style={styles.deleteBtn}>
                              Eliminar
                            </button>
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

      {/* Modal crear/editar */}
      {showModal && (
        <div style={styles.overlay} onClick={closeModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>
              {editing ? "Editar cliente" : "Nuevo cliente"}
            </h2>
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>Nombre *</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Ej: Juan Pérez"
                  required
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
                  placeholder="juan@empresa.com"
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Teléfono</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="809-555-0000"
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Dirección</label>
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Calle, ciudad, país"
                  style={styles.input}
                />
              </div>
              <div style={styles.modalBtns}>
                <button type="button" onClick={closeModal} style={styles.cancelBtn}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  style={{ ...styles.saveBtn, opacity: formLoading ? 0.7 : 1 }}
                >
                  {formLoading ? "Guardando..." : editing ? "Guardar cambios" : "Crear cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal detalle */}
      {showDetail && selectedClient && (
        <div style={styles.overlay} onClick={closeDetail}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.detailHeader}>
              <div style={styles.detailAvatar}>
                {selectedClient.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 style={styles.detailName}>{selectedClient.name}</h2>
                <p style={styles.detailSub}>{selectedClient.email || "Sin email"}</p>
              </div>
            </div>

            <div style={styles.detailInfo}>
              {selectedClient.phone && (
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Teléfono</span>
                  <span style={styles.detailValue}>{selectedClient.phone}</span>
                </div>
              )}
              {selectedClient.address && (
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Dirección</span>
                  <span style={styles.detailValue}>{selectedClient.address}</span>
                </div>
              )}
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Total gastado</span>
                <span style={{ ...styles.detailValue, color: "#059669", fontWeight: 700 }}>
                  ${Number(selectedClient.total_spent).toLocaleString("es-DO")}
                </span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Total compras</span>
                <span style={styles.detailValue}>{selectedClient.sales.length}</span>
              </div>
            </div>

            <h3 style={styles.historyTitle}>Historial de compras</h3>
            {selectedClient.sales.length === 0 ? (
              <p style={styles.empty}>Este cliente no tiene compras registradas.</p>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    {["ID", "Total", "Fecha"].map((h) => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedClient.sales.map((s) => (
                    <tr key={s.id} style={styles.tr}>
                      <td style={styles.td}>#{s.id}</td>
                      <td style={{ ...styles.td, color: "#059669", fontWeight: 600 }}>
                        ${Number(s.total).toLocaleString("es-DO")}
                      </td>
                      <td style={styles.td}>
                        {new Date(s.created_at).toLocaleDateString("es-DO", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div style={{ textAlign: "right", marginTop: 24 }}>
              <button onClick={closeDetail} style={styles.cancelBtn}>Cerrar</button>
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
    color: "#fff", border: "none", borderRadius: 10, fontSize: 14,
    fontWeight: 600, cursor: "pointer",
  },
  searchBox: {
    position: "relative", marginBottom: 20,
    maxWidth: 420, display: "flex", alignItems: "center",
  },
  searchIcon: { position: "absolute", left: 14, fontSize: 14 },
  searchInput: {
    width: "100%", padding: "11px 40px 11px 38px",
    border: "1.5px solid #e2e8f0", borderRadius: 10,
    fontSize: 14, outline: "none", color: "#0f172a", background: "#fff",
  },
  clearBtn: {
    position: "absolute", right: 12, background: "none",
    border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 14,
  },
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
  empty: { textAlign: "center", padding: "40px", color: "#94a3b8", fontSize: 14 },
  detailBtn: {
    padding: "6px 12px", background: "#f0fdf4", color: "#059669",
    border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600,
    cursor: "pointer", marginRight: 8,
  },
  editBtn: {
    padding: "6px 12px", background: "#eef2ff", color: "#4f46e5",
    border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600,
    cursor: "pointer", marginRight: 8,
  },
  deleteBtn: {
    padding: "6px 12px", background: "#fef2f2", color: "#dc2626",
    border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer",
  },
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200,
  },
  modal: {
    background: "#fff", borderRadius: 20, padding: "36px",
    width: "100%", maxWidth: 480, boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
    maxHeight: "90vh", overflowY: "auto",
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
    color: "#fff", border: "none", borderRadius: 10, fontSize: 14,
    fontWeight: 600, cursor: "pointer",
  },
  detailHeader: {
    display: "flex", alignItems: "center", gap: 16, marginBottom: 24,
  },
  detailAvatar: {
    width: 56, height: 56, borderRadius: "50%",
    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    color: "#fff", display: "flex", alignItems: "center",
    justifyContent: "center", fontSize: 22, fontWeight: 700, flexShrink: 0,
  },
  detailName: { fontSize: 20, fontWeight: 700, color: "#0f172a", margin: "0 0 4px" },
  detailSub: { fontSize: 14, color: "#64748b", margin: 0 },
  detailInfo: {
    background: "#f8fafc", borderRadius: 12, padding: "16px 20px",
    marginBottom: 24, display: "flex", flexDirection: "column", gap: 12,
  },
  detailRow: { display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4, },
  detailLabel: { fontSize: 13, color: "#64748b", fontWeight: 500 },
  detailValue: { fontSize: 14, color: "#0f172a", wordBreak: "break-word", overflowWrap: "break-word", width: "100%", lineHeight: 1.5 },
  historyTitle: { fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 16px" },
};