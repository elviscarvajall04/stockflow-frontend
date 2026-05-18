import { useState, useEffect } from "react";
import { productsAPI, categoriesAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Pagination from "../components/Pagination";
import { TableSkeleton } from "../components/Skeleton";
import toast from "react-hot-toast";
import { useExportPDF } from "../hooks/usePDF";

const PAGE_LIMIT = 50;

export default function Products() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { exportProducts } = useExportPDF();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", price: "", stock: "", itbis: "18.00", category_id: "" });
  const [formLoading, setFormLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState([]);
  const [showCatModal, setShowCatModal] = useState(false);

  const loadProducts = (p = 1) => {
    setLoading(true);
    setPage(p);
    Promise.all([productsAPI.getAll({ page: p, limit: PAGE_LIMIT }), categoriesAPI.getAll()])
      .then(([pData, cData]) => {
        const list = pData.data || pData || [];
        setProducts(Array.isArray(list) ? list : []);
        setTotal(pData.total || 0);
        setTotalPages(pData.totalPages || 1);
        setCategories(Array.isArray(cData) ? cData : []);
      })
      .catch(() => toast.error("Error cargando datos"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadProducts(1); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", price: "", stock: "", itbis: "18.00", category_id: "" });
    setShowModal(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setForm({ name: product.name, price: product.price, stock: product.stock, itbis: product.itbis ?? "18.00", category_id: product.category_id ?? "" });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    const payload = {
      name: form.name,
      price: Number(form.price),
      stock: Number(form.stock),
      itbis: Number(form.itbis),
      category_id: form.category_id ? Number(form.category_id) : null,
    };

    try {
      if (editing) {
        await productsAPI.update(editing.id, payload);
        toast.success("Producto actualizado correctamente");
      } else {
        await productsAPI.create(payload);
        toast.success("Producto creado correctamente");
      }
      closeModal();
      loadProducts();
    } catch (err) {
      toast.error(err.message || "Error guardando producto");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`¿Eliminar "${name}"?`)) return;
    try {
      await productsAPI.delete(id);
      toast.success(`"${name}" eliminado correctamente`);
      loadProducts();
    } catch (err) {
      toast.error(err.message || "Error eliminando producto");
    }
  };

  const handleExport = () => {
    if (products.length === 0) {
      toast.error("No hay productos para exportar");
      return;
    }
    exportProducts(filtered);
    toast.success("PDF generado correctamente");
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={styles.page}>
      <Navbar />

      <div style={styles.content}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Productos</h1>
            <p style={styles.subtitle}>Gestión de inventario</p>
          </div>
          <div style={styles.headerBtns}>
            <button onClick={handleExport} style={styles.exportBtn}>
              ⬇ Exportar PDF
            </button>
            {isAdmin && (
              <button onClick={openCreate} style={styles.createBtn}>
                + Nuevo producto
              </button>
            )}
          </div>
        </div>

        {/* Buscador */}
        <div style={styles.searchBox}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Buscar producto por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
          {search && (
            <button onClick={() => setSearch("")} style={styles.clearBtn}>✕</button>
          )}
        </div>

        {loading && <TableSkeleton rows={6} cols={7} />}

        {!loading && (
          <div style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {["ID", "Nombre", "Categoría", "Precio", "ITBIS", "Stock", "Estado", isAdmin ? "Acciones" : ""].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                  {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={styles.empty}>
                      {search ? `No se encontraron productos con "${search}"` : "No hay productos registrados."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.id} style={styles.tr}>
                      <td style={styles.td}>#{p.id}</td>
                      <td style={{ ...styles.td, fontWeight: 600, color: "#0f172a" }}>{p.name}</td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.catBadge,
                          background: p.category_name ? "#f1f5f9" : "transparent",
                          color: p.category_name ? "#475569" : "#94a3b8",
                        }}>
                          {p.category_name || "Sin categoría"}
                        </span>
                      </td>
                      <td style={styles.td}>${Number(p.price).toLocaleString("es-DO")}</td>
                      <td style={styles.td}>{Number(p.itbis || 18).toFixed(1)}%</td>
                      <td style={styles.td}>{p.stock}</td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.badge,
                          background: p.stock <= 5 ? "#fef2f2" : "#ecfdf5",
                          color: p.stock <= 5 ? "#dc2626" : "#059669",
                        }}>
                          {p.stock <= 5 ? "Bajo stock" : "Disponible"}
                        </span>
                      </td>
                      {isAdmin && (
                        <td style={styles.td}>
                          <button onClick={() => openEdit(p)} style={styles.editBtn}>
                            Editar
                          </button>
                          <button onClick={() => handleDelete(p.id, p.name)} style={styles.deleteBtn}>
                            Eliminar
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <Pagination page={page} totalPages={totalPages} total={total} limit={PAGE_LIMIT} onChange={loadProducts} />
          </div>
        )}
      </div>

      {showModal && (
        <div style={styles.overlay} onClick={closeModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>
              {editing ? "Editar producto" : "Nuevo producto"}
            </h2>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>Nombre</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Ej: Arroz 5kg"
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Categoría</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <select
                    name="category_id"
                    value={form.category_id}
                    onChange={handleChange}
                    style={{ ...styles.input, flex: 1 }}
                  >
                    <option value="">Sin categoría</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {isAdmin && (
                    <button type="button" onClick={() => setShowCatModal(true)} style={{
                      padding: "11px 14px", background: "#f8fafc", border: "1.5px solid #e2e8f0",
                      borderRadius: 10, fontSize: 14, cursor: "pointer", color: "#475569",
                    }} title="Gestionar categorías">
                      ⚙️
                    </button>
                  )}
                </div>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Precio (RD$)</label>
                <input
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Stock</label>
                <input
                  name="stock"
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={handleChange}
                  placeholder="0"
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>ITBIS (%)</label>
                <select
                  name="itbis"
                  value={form.itbis}
                  onChange={handleChange}
                  style={styles.input}
                >
                  <option value="18.00">18% — General</option>
                  <option value="0.00">0% — Exento</option>
                  <option value="16.00">16% — Reducido</option>
                </select>
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
                  {formLoading ? "Guardando..." : editing ? "Guardar cambios" : "Crear producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal gestionar categorías */}
      {showCatModal && (
        <CatModal
          categories={categories}
          onClose={() => { setShowCatModal(false); setCatEditing(null); setCatForm({ name: "" }); }}
          onRefresh={() => {
            Promise.all([productsAPI.getAll(), categoriesAPI.getAll()])
              .then(([pData, cData]) => { setProducts(pData); setCategories(cData); });
          }}
        />
      )}
    </div>
  );
}

function CatModal({ categories, onClose, onRefresh }) {
  const [catForm, setCatForm] = useState({ name: "" });
  const [catEditing, setCatEditing] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const reset = () => { setCatForm({ name: "" }); setCatEditing(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!catForm.name.trim()) { toast.error("El nombre es obligatorio"); return; }
    setFormLoading(true);
    try {
      if (catEditing) {
        await categoriesAPI.update(catEditing.id, catForm);
        toast.success("Categoría actualizada");
      } else {
        await categoriesAPI.create(catForm);
        toast.success("Categoría creada");
      }
      reset();
      onRefresh();
    } catch (err) {
      toast.error(err.message || "Error guardando categoría");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (cat) => {
    if (!confirm(`¿Eliminar categoría "${cat.name}"?`)) return;
    try {
      await categoriesAPI.delete(cat.id);
      toast.success("Categoría eliminada");
      onRefresh();
    } catch (err) {
      toast.error(err.message || err.message);
    }
  };

  return (
    <div style={catStyles.overlay} onClick={() => { onClose(); reset(); }}>
      <div style={catStyles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={catStyles.modalTitle}>Gestionar categorías</h2>
          <button onClick={() => { onClose(); reset(); }} style={catStyles.closeBtn}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <input
            value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
            placeholder={catEditing ? "Editar categoría..." : "Nueva categoría..."}
            required style={catStyles.input}
          />
          <button type="submit" disabled={formLoading} style={catStyles.saveBtn}>
            {formLoading ? "..." : catEditing ? "Actualizar" : "Agregar"}
          </button>
          {catEditing && (
            <button type="button" onClick={reset} style={catStyles.cancelBtn}>Cancelar</button>
          )}
        </form>

        {categories.length === 0 ? (
          <p style={{ color: "#94a3b8", fontSize: 14, textAlign: "center", padding: 20 }}>
            No hay categorías registradas.
          </p>
        ) : (
          <table style={catStyles.table}>
            <thead>
              <tr>
                {["Nombre", "Productos", "Acciones"].map((h) => (
                  <th key={h} style={catStyles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} style={catStyles.tr}>
                  <td style={{ ...catStyles.td, fontWeight: 600 }}>{c.name}</td>
                  <td style={catStyles.td}>{c.product_count || 0}</td>
                  <td style={catStyles.td}>
                    <button onClick={() => { setCatEditing(c); setCatForm({ name: c.name }); }} style={catStyles.editBtn}>Editar</button>
                    <button onClick={() => handleDelete(c)} style={catStyles.deleteBtn}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const catStyles = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300,
  },
  modal: {
    background: "#fff", borderRadius: 20, padding: "28px",
    width: "100%", maxWidth: 500, boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
  },
  modalTitle: { fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 },
  closeBtn: { background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#94a3b8", padding: "4px 8px" },
  input: {
    flex: 1, padding: "10px 12px", border: "1.5px solid #e2e8f0",
    borderRadius: 10, fontSize: 14, outline: "none", color: "#0f172a",
  },
  saveBtn: {
    padding: "10px 18px", background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer",
  },
  cancelBtn: {
    padding: "10px 16px", background: "transparent", border: "1.5px solid #e2e8f0",
    borderRadius: 10, fontSize: 14, fontWeight: 600, color: "#64748b", cursor: "pointer",
  },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 14 },
  th: {
    textAlign: "left", fontSize: 12, fontWeight: 600, color: "#94a3b8",
    textTransform: "uppercase", letterSpacing: "0.5px",
    padding: "10px 12px", borderBottom: "1px solid #f1f5f9", background: "#fafafa",
  },
  tr: { borderBottom: "1px solid #f8fafc" },
  td: { padding: "10px 12px", fontSize: 13, color: "#334155" },
  editBtn: {
    padding: "5px 10px", background: "#eef2ff", color: "#4f46e5",
    border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", marginRight: 6,
  },
  deleteBtn: {
    padding: "5px 10px", background: "#fef2f2", color: "#dc2626",
    border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
  },
};

const styles = {
  page: { minHeight: "100vh", background: "#f8fafc", fontFamily: "'Segoe UI', system-ui, sans-serif" },
  content: { maxWidth: 1100, margin: "0 auto", padding: "32px 24px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 },
  title: { fontSize: 28, fontWeight: 700, color: "#0f172a", margin: "0 0 4px" },
  subtitle: { fontSize: 15, color: "#64748b", margin: 0 },
  headerBtns: { display: "flex", gap: 12 },
  exportBtn: {
    padding: "10px 20px", background: "#fff",
    color: "#4f46e5", border: "1.5px solid #4f46e5",
    borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer",
  },
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
  badge: { padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 },
  catBadge: { padding: "3px 8px", borderRadius: 6, fontSize: 12, fontWeight: 500 },
  editBtn: {
    padding: "6px 12px", background: "#eef2ff", color: "#4f46e5",
    border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600,
    cursor: "pointer", marginRight: 8,
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
    color: "#fff", border: "none", borderRadius: 10, fontSize: 14,
    fontWeight: 600, cursor: "pointer",
  },
};