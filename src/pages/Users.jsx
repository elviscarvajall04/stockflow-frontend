import { useState, useEffect } from "react";
import { usersAPI, authAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { TableSkeleton } from "../components/Skeleton";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function Users() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "employee" });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (user?.role !== "admin") { navigate("/dashboard"); return; }
    loadUsers();
  }, [user]);

  const loadUsers = () => {
    setLoading(true);
    usersAPI.getAll()
      .then(setUsers)
      .catch(() => toast.error("Error cargando usuarios"))
      .finally(() => setLoading(false));
  };

  const openCreate = () => {
    setEditTarget(null);
    setForm({ name: "", email: "", password: "", role: "employee" });
    setShowCreateModal(true);
  };

  const openEdit = (u) => {
    setEditTarget(u);
    setForm({ name: u.name, email: u.email, password: "", role: u.role });
    setShowCreateModal(true);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (editTarget) {
        const payload = { name: form.name, email: form.email, role: form.role };
        if (form.password) payload.password = form.password;
        await usersAPI.update(editTarget.id, payload);
        toast.success("Usuario actualizado");
      } else {
        await authAPI.register(form);
        toast.success("Usuario creado");
      }
      setShowCreateModal(false);
      loadUsers();
    } catch (err) {
      toast.error(err.message || "Error guardando usuario");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await usersAPI.delete(deleteTarget.id);
      toast.success("Usuario eliminado");
      setDeleteTarget(null);
      loadUsers();
    } catch (err) {
      toast.error(err.message || "Error eliminando usuario");
    }
  };

  return (
    <div style={styles.page}>
      <Navbar />

      <div style={styles.content}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Usuarios</h1>
            <p style={styles.subtitle}>Gestión de accesos al sistema</p>
          </div>
          <button onClick={openCreate} style={styles.createBtn}>+ Nuevo usuario</button>
        </div>

        {loading && <TableSkeleton rows={5} cols={5} />}

        {!loading && (
          <div style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {["Nombre", "Email", "Rol", "Creado", "Acciones"].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={5} style={styles.empty}>No hay usuarios registrados.</td></tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} style={styles.tr}>
                      <td style={{ ...styles.td, fontWeight: 600, color: "#0f172a" }}>{u.name}</td>
                      <td style={styles.td}>{u.email}</td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.roleBadge,
                          background: u.role === "admin" ? "#eef2ff" : "#ecfeff",
                          color: u.role === "admin" ? "#4f46e5" : "#0891b2",
                        }}>
                          {u.role === "admin" ? "Administrador" : "Empleado"}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {new Date(u.created_at).toLocaleDateString("es-DO", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </td>
                      <td style={styles.td}>
                        <button onClick={() => openEdit(u)} style={styles.editBtn}>Editar</button>
                        <button onClick={() => setDeleteTarget(u)} style={styles.deleteBtn}>Eliminar</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal crear / editar */}
      {showCreateModal && (
        <div style={styles.overlay} onClick={() => setShowCreateModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>{editTarget ? "Editar usuario" : "Nuevo usuario"}</h2>
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>Nombre</label>
                <input name="name" value={form.name} onChange={handleChange} required style={styles.input} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Correo electrónico</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} required style={styles.input} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>{editTarget ? "Nueva contraseña (dejar vacío para mantener)" : "Contraseña"}</label>
                <input name="password" type="password" value={form.password} onChange={handleChange}
                  required={!editTarget} minLength={editTarget ? 0 : 6} style={styles.input} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Rol</label>
                <select name="role" value={form.role} onChange={handleChange} style={styles.select}>
                  <option value="employee">Empleado</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div style={styles.modalBtns}>
                <button type="button" onClick={() => setShowCreateModal(false)} style={styles.cancelBtn}>Cancelar</button>
                <button type="submit" disabled={formLoading} style={{ ...styles.saveBtn, opacity: formLoading ? 0.7 : 1 }}>
                  {formLoading ? "Guardando..." : editTarget ? "Guardar cambios" : "Crear usuario"}
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
            <h2 style={styles.modalTitle}>Eliminar usuario</h2>
            <p style={{ fontSize: 15, color: "#334155", marginBottom: 16, lineHeight: 1.6 }}>
              ¿Estás seguro de eliminar a <strong>{deleteTarget.name}</strong>?
            </p>
            <div style={{
              background: "#fef2f2", border: "1px solid #fca5a5",
              borderRadius: 10, padding: "14px 16px", fontSize: 14, color: "#991b1b",
              lineHeight: 1.6, marginBottom: 20,
            }}>
              🗑️ Se eliminará permanentemente. No se puede eliminar si tiene ventas o compras registradas.
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
  roleBadge: {
    padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600,
  },
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
  select: {
    padding: "11px 14px", border: "1.5px solid #e2e8f0",
    borderRadius: 10, fontSize: 14, outline: "none", color: "#0f172a", background: "#fff",
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
};
