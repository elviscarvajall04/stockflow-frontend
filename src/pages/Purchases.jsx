import { useState, useEffect } from "react";
import { purchasesAPI, productsAPI, suppliersAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Pagination from "../components/Pagination";
import { TableSkeleton } from "../components/Skeleton";
import toast from "react-hot-toast";

const PAGE_LIMIT = 50;

export default function Purchases() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [ncf, setNcf] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([{ product_id: "", quantity: 1, cost_price: "", applies_itbis: true, is_new: false, new_product_name: "", new_sale_price: "" }]);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const loadData = (p = 1) => {
    setLoading(true);
    setPage(p);
    Promise.all([purchasesAPI.getAll({ page: p, limit: PAGE_LIMIT }), productsAPI.getAll(), suppliersAPI.getAll()])
      .then(([pData, prData, sData]) => {
        const list = pData.data || pData || [];
        setPurchases(Array.isArray(list) ? list : []);
        setTotal(pData.total || 0);
        setTotalPages(pData.totalPages || 1);
        setProducts(Array.isArray(prData) ? prData : []);
        setSuppliers(Array.isArray(sData) ? sData : []);
      })
      .catch(() => toast.error("Error cargando datos"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(1); }, []);

  const openModal = () => {
    setEditTarget(null);
    setSupplierId("");
    setNcf("");
    setNotes("");
    setItems([{ product_id: "", quantity: 1, cost_price: "", applies_itbis: true, is_new: false, new_product_name: "", new_sale_price: "" }]);
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditTarget(p);
    setSupplierId(p.supplier_id || "");
    setNcf(p.ncf || "");
    setNotes(p.notes || "");
    setItems(p.items && p.items.length > 0
      ? p.items.map((i) => ({ product_id: i.product_id, quantity: i.quantity, cost_price: i.cost_price, applies_itbis: i.applies_itbis !== false, is_new: false, new_product_name: "", new_sale_price: "" }))
      : [{ product_id: "", quantity: 1, cost_price: "", applies_itbis: true, is_new: false, new_product_name: "", new_sale_price: "" }]
    );
    setShowModal(true);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const addItem = () => setItems([...items, { product_id: "", quantity: 1, cost_price: "", applies_itbis: true, is_new: false, new_product_name: "", new_sale_price: "" }]);
  const removeItem = (index) => { if (items.length > 1) setItems(items.filter((_, i) => i !== index)); };

  const getTotal = () => items.reduce((sum, item) => {
    return sum + (Number(item.cost_price || 0) * Number(item.quantity || 0));
  }, 0);

  const renderItemRows = () => items.map((item, index) => (
    <div key={index} style={styles.itemCol}>
      <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
        <button
          type="button"
          onClick={() => handleItemChange(index, "is_new", false)}
          style={{
            ...styles.tabBtn, flex: 1,
            background: !item.is_new ? "#4f46e5" : "#f1f5f9",
            color: !item.is_new ? "#fff" : "#64748b",
          }}
        >
          Producto existente
        </button>
        <button
          type="button"
          onClick={() => handleItemChange(index, "is_new", true)}
          style={{
            ...styles.tabBtn, flex: 1,
            background: item.is_new ? "#4f46e5" : "#f1f5f9",
            color: item.is_new ? "#fff" : "#64748b",
          }}
        >
          + Producto nuevo
        </button>
      </div>
      <div style={styles.itemRow}>
      {item.is_new ? (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            value={item.new_product_name}
            onChange={(e) => handleItemChange(index, "new_product_name", e.target.value)}
            placeholder="Nombre del producto"
            required
            style={styles.input}
          />
          <input
            type="number" min="0" step="0.01" placeholder="Precio venta RD$"
            value={item.new_sale_price}
            onChange={(e) => handleItemChange(index, "new_sale_price", e.target.value)}
            required style={styles.qtyInput}
          />
        </div>
      ) : (
        <select
          value={item.product_id}
          onChange={(e) => handleItemChange(index, "product_id", e.target.value)}
          required style={styles.select}
        >
          <option value="">Seleccionar producto</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {Number(p.price).toLocaleString("es-DO")} (stock: {p.stock})
            </option>
          ))}
        </select>
      )}
      <input
        type="number" min="1" placeholder="Cant." value={item.quantity}
        onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
        required style={styles.qtyInput}
      />
      <input
        type="number" min="0" step="0.01" placeholder="Costo RD$" value={item.cost_price}
        onChange={(e) => handleItemChange(index, "cost_price", e.target.value)}
        required style={styles.costInput}
      />
      <button
        type="button"
        onClick={() => handleItemChange(index, "applies_itbis", !item.applies_itbis)}
        style={{
          ...styles.itbisToggle,
          background: item.applies_itbis ? "#ecfdf5" : "#fef2f2",
          color: item.applies_itbis ? "#059669" : "#dc2626",
        }}
        title={item.applies_itbis ? "Incluye ITBIS" : "Sin ITBIS"}
      >
        {item.applies_itbis ? "ITBIS" : "No ITBIS"}
      </button>
      <button type="button" onClick={() => removeItem(index)} style={styles.removeBtn}>✕</button>
    </div>
  </div>
  ));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validItems = items.filter((i) =>
      i.quantity > 0 && i.cost_price > 0 && (
        i.is_new ? i.new_product_name && i.new_sale_price > 0 : i.product_id
      )
    );
    if (!supplierId) { toast.error("Selecciona un proveedor"); return; }
    if (validItems.length === 0) { toast.error("Agrega al menos un producto válido"); return; }
    setFormLoading(true);
    try {
      if (editTarget) {
        await purchasesAPI.update(editTarget.purchase_id, {
          supplier_id: Number(supplierId),
          ncf,
          notes,
        });
        toast.success("Compra actualizada");
      } else {
        await purchasesAPI.create({
          supplier_id: Number(supplierId),
          items: validItems.map((i) => {
            const base = {
              quantity: Number(i.quantity),
              cost_price: Number(i.cost_price),
              applies_itbis: i.applies_itbis !== false,
            };
            if (i.is_new) {
              return { ...base, new_product_name: i.new_product_name, new_sale_price: Number(i.new_sale_price) };
            }
            return { ...base, product_id: Number(i.product_id) };
          }),
          ncf,
          notes,
        });
        toast.success("Compra registrada. Stock actualizado.");
      }
      setShowModal(false);
      loadData(page);
    } catch (err) {
      toast.error(err.message || "Error guardando compra");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await purchasesAPI.delete(deleteTarget.purchase_id);
      toast.success("Compra eliminada y stock revertido");
      setDeleteTarget(null);
      loadData(page);
    } catch (err) {
      toast.error(err.message || "Error eliminando compra");
    }
  };

  const totalCost = purchases.reduce((sum, p) => sum + Number(p.total), 0);

  const filtered = purchases.filter((p) =>
    String(p.purchase_id).includes(search) ||
    (p.supplier_name && p.supplier_name.toLowerCase().includes(search.toLowerCase())) ||
    (p.ncf && p.ncf.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.content}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Compras</h1>
            <p style={styles.subtitle}>Registro de compras a proveedores</p>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <input type="text" placeholder="Buscar compra..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.searchInput} />
            <div style={{
              padding: "8px 16px", background: "#ecfdf5", color: "#059669",
              borderRadius: 8, fontSize: 14, border: "1px solid #a7f3d0",
            }}>
              Total invertido: <strong>{totalCost.toLocaleString("es-DO")}</strong>
            </div>
            <button onClick={openModal} style={styles.createBtn}>+ Nueva compra</button>
          </div>
        </div>

        {loading && <TableSkeleton rows={5} cols={7} />}

        {!loading && (
          <div style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {["ID", "Proveedor", "Productos", "Total", "NCF", "Fecha", "Registrado por", isAdmin ? "Acciones" : ""].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={styles.empty}>{search ? "Sin resultados." : "No hay compras registradas."}</td></tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.purchase_id} style={styles.tr}>
                      <td style={styles.td}>#{p.purchase_id}</td>
                      <td style={{ ...styles.td, fontWeight: 600, color: "#0f172a" }}>{p.supplier_name}</td>
                       <td style={styles.td}>
                         {Array.isArray(p.items)
                           ? p.items.map((i) => `${i.product_name} x${i.quantity}`).join(", ")
                           : "—"}
                       </td>
                      <td style={{ ...styles.td, fontWeight: 600, color: "#059669" }}>
                        ${Number(p.total).toLocaleString("es-DO")}
                      </td>
                      <td style={{ ...styles.td, fontFamily: "monospace", fontSize: 12 }}>{p.ncf || "—"}</td>
                      <td style={styles.td}>
                        {new Date(p.created_at).toLocaleDateString("es-DO", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </td>
                      <td style={styles.td}>{p.user_name}</td>
                      {isAdmin && (
                        <td style={styles.td}>
                          <button onClick={() => openEdit(p)} style={styles.editBtn}>Editar</button>
                          <button onClick={() => setDeleteTarget(p)} style={styles.deleteBtn}>Eliminar</button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <Pagination page={page} totalPages={totalPages} total={total} limit={PAGE_LIMIT} onChange={loadData} />
          </div>
        )}
      </div>

      {/* Modal crear / editar compra */}
      {showModal && (
        <div style={styles.overlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>{editTarget ? "Editar compra" : "Nueva compra"}</h2>
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>Proveedor *</label>
                <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} required style={styles.select}>
                  <option value="">Selecciona proveedor</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {renderItemRows()}
              <button type="button" onClick={addItem} style={styles.addItemBtn}>+ Agregar producto</button>

              <div style={styles.field}>
                <label style={styles.label}>NCF del proveedor</label>
                <input type="text" value={ncf} onChange={(e) => setNcf(e.target.value)} placeholder="Opcional" style={styles.input} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Notas</label>
                <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" style={styles.input} />
              </div>

              <div style={styles.totalBox}>
                <span style={{ fontSize: 14, color: "#64748b" }}>Total compra</span>
                <span style={{ fontSize: 22, fontWeight: 700, color: "#059669" }}>
                  {'$'}{getTotal().toLocaleString("es-DO")}
                </span>
              </div>

              <div style={styles.modalBtns}>
                <button type="button" onClick={() => setShowModal(false)} style={styles.cancelBtn}>Cancelar</button>
                <button type="submit" disabled={formLoading}
                  style={{ ...styles.saveBtn, opacity: formLoading ? 0.7 : 1 }}>
                  {formLoading ? "Guardando..." : editTarget ? "Guardar cambios" : "Registrar compra"}
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
            <h2 style={styles.modalTitle}>Eliminar compra</h2>
            <p style={{ fontSize: 15, color: "#334155", marginBottom: 16, lineHeight: 1.6 }}>
              ¿Estás seguro de eliminar la compra <strong>#{deleteTarget.purchase_id}</strong>?
            </p>
            <div style={{
              background: "#fef2f2", border: "1px solid #fca5a5",
              borderRadius: 10, padding: "14px 16px", fontSize: 14, color: "#991b1b",
              lineHeight: 1.6, marginBottom: 20,
            }}>
              🗑️ El stock de los productos será revertido automáticamente.
              Esta acción no se puede deshacer.
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
  empty: { textAlign: "center", padding: "40px", color: "#94a3b8", fontSize: 14 },
  editBtn: {
    padding: "6px 12px", background: "#eef2ff", color: "#4f46e5",
    border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", marginRight: 8,
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
    width: "100%", maxWidth: 600, boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
    maxHeight: "90vh", overflowY: "auto",
  },
  modalTitle: { fontSize: 20, fontWeight: 700, color: "#0f172a", margin: "0 0 24px" },
  form: { display: "flex", flexDirection: "column", gap: 14 },
  field: { display: "flex", flexDirection: "column", gap: 8 },
  label: { fontSize: 13, fontWeight: 600, color: "#374151" },
  select: {
    flex: 1, padding: "10px 12px", border: "1.5px solid #e2e8f0",
    borderRadius: 10, fontSize: 14, outline: "none", color: "#0f172a", background: "#fff",
  },
  itemCol: { display: "flex", flexDirection: "column", gap: 4 },
  tabBtn: {
    padding: "7px 10px", border: "none", borderRadius: 8,
    fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
  },
  itemRow: { display: "flex", gap: 8, alignItems: "center" },
  qtyInput: {
    width: 70, padding: "10px 12px", border: "1.5px solid #e2e8f0",
    borderRadius: 10, fontSize: 14, outline: "none", color: "#0f172a", textAlign: "center",
  },
  costInput: {
    width: 110, padding: "10px 12px", border: "1.5px solid #e2e8f0",
    borderRadius: 10, fontSize: 14, outline: "none", color: "#0f172a",
  },
  itbisToggle: {
    padding: "6px 8px", border: "none", borderRadius: 6,
    fontSize: 10, fontWeight: 700, cursor: "pointer", flexShrink: 0, letterSpacing: "-0.3px",
  },
  removeBtn: {
    width: 36, height: 36, background: "#fef2f2", color: "#dc2626",
    border: "none", borderRadius: 8, fontSize: 16, cursor: "pointer", flexShrink: 0,
  },
  addItemBtn: {
    padding: "9px 16px", background: "#f8fafc", border: "1.5px dashed #cbd5e1",
    borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#64748b",
    cursor: "pointer", textAlign: "center",
  },
  totalBox: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    background: "#f8fafc", borderRadius: 10, padding: "14px 16px", border: "1px solid #e2e8f0",
  },
  searchInput: {
    padding: "10px 14px", border: "1.5px solid #e2e8f0", borderRadius: 10,
    fontSize: 14, outline: "none", color: "#0f172a", width: 220,
  },
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
};
