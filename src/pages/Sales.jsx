import { useState, useEffect } from "react";
import { salesAPI, productsAPI } from "../services/api";
import Navbar from "../components/Navbar";
import toast from "react-hot-toast";
import { useExportPDF } from "../hooks/usePDF";

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [items, setItems] = useState([{ product_id: "", quantity: 1 }]);
  const [formLoading, setFormLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState("efectivo");
  const [received, setReceived] = useState("");
  const [reference, setReference] = useState("");
  const { exportSales } = useExportPDF();

  const loadData = () => {
    setLoading(true);
    Promise.all([salesAPI.getAll(), productsAPI.getAll()])
      .then(([salesData, productsData]) => {
        setSales(Array.isArray(salesData) ? salesData : []);
        setProducts(Array.isArray(productsData) ? productsData : []);
      })
      .catch(() => toast.error("Error cargando datos"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const openModal = () => {
    setItems([{ product_id: "", quantity: 1 }]);
    setPaymentMethod("efectivo");
    setReceived("");
    setReference("");
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const addItem = () => {
    setItems([...items, { product_id: "", quantity: 1 }]);
  };

  const removeItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const getTotal = () => {
    return items.reduce((sum, item) => {
      const product = products.find((p) => p.id === Number(item.product_id));
      if (!product) return sum;
      return sum + product.price * item.quantity;
    }, 0);
  };

  const getChange = () => {
    const total = getTotal();
    const rec = Number(received || 0);
    return rec - total;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validItems = items.filter((i) => i.product_id && i.quantity > 0);
    if (validItems.length === 0) {
      toast.error("Agrega al menos un producto válido");
      return;
    }
    if (paymentMethod === "efectivo" && Number(received || 0) < getTotal()) {
      toast.error("El monto recibido es menor al total");
      return;
    }
    setFormLoading(true);
    try {
      await salesAPI.create({
        user_id: JSON.parse(localStorage.getItem("user"))?.id,
        items: validItems.map((i) => ({
          product_id: Number(i.product_id),
          quantity: Number(i.quantity),
        })),
        payment_method: paymentMethod,
        received: Number(received || 0),
        reference: paymentMethod === "transferencia" ? reference : null,
      });
      toast.success("Venta registrada correctamente");
      closeModal();
      loadData();
    } catch (err) {
      toast.error(err.message || "Error registrando venta");
    } finally {
      setFormLoading(false);
    }
  };

  const filterSales = (sales) => {
    const now = new Date();
    return sales.filter((s) => {
      const date = new Date(s.created_at);
      if (filter === "today") return date.toDateString() === now.toDateString();
      if (filter === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return date >= weekAgo;
      }
      if (filter === "month") {
        return date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear();
      }
      return true;
    });
  };

  const filtered = filterSales(sales);
  const filterTotal = filtered.reduce((sum, s) => sum + Number(s.total), 0);

  const handleExport = () => {
    if (filtered.length === 0) {
      toast.error("No hay ventas para exportar");
      return;
    }
    exportSales(filtered);
    toast.success("PDF generado correctamente");
  };

  const filters = [
    { label: "Todas", value: "all" },
    { label: "Hoy", value: "today" },
    { label: "Esta semana", value: "week" },
    { label: "Este mes", value: "month" },
  ];

  const paymentMethods = [
    { value: "efectivo", label: "💵 Efectivo" },
    { value: "tarjeta", label: "💳 Tarjeta" },
    { value: "transferencia", label: "🏦 Transferencia" },
  ];

  return (
    <div style={styles.page}>
      <Navbar />

      <div style={styles.content}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Ventas</h1>
            <p style={styles.subtitle}>Historial y registro de ventas</p>
          </div>
          <div style={styles.headerBtns}>
            <button onClick={handleExport} style={styles.exportBtn}>
              ⬇ Exportar PDF
            </button>
            <button onClick={openModal} style={styles.createBtn}>
              + Nueva venta
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div style={styles.filtersRow}>
          <div style={styles.filterBtns}>
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                style={{
                  ...styles.filterBtn,
                  background: filter === f.value ? "#4f46e5" : "#fff",
                  color: filter === f.value ? "#fff" : "#64748b",
                  border: filter === f.value ? "1.5px solid #4f46e5" : "1.5px solid #e2e8f0",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
          {filter !== "all" && (
            <div style={styles.totalPill}>
              Total: <strong>${filterTotal.toLocaleString("es-DO")}</strong>
            </div>
          )}
        </div>

        {loading && <p style={styles.msg}>Cargando ventas...</p>}

        {!loading && (
          <div style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {["ID", "Vendedor", "Total", "Método de pago", "Fecha"].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={styles.empty}>
                      No hay ventas en este período.
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => (
                    <tr key={s.sale_id ?? s.id} style={styles.tr}>
                      <td style={styles.td}>#{s.sale_id ?? s.id ?? "—"}</td>
                      <td style={styles.td}>{s.user_name}</td>
                      <td style={{ ...styles.td, fontWeight: 600, color: "#059669" }}>
                        ${Number(s.total).toLocaleString("es-DO")}
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.methodBadge,
                          background: s.payment_method === "efectivo" ? "#ecfdf5" :
                            s.payment_method === "tarjeta" ? "#eef2ff" : "#fff7ed",
                          color: s.payment_method === "efectivo" ? "#059669" :
                            s.payment_method === "tarjeta" ? "#4f46e5" : "#ea580c",
                        }}>
                          {s.payment_method === "efectivo" ? "💵 Efectivo" :
                            s.payment_method === "tarjeta" ? "💳 Tarjeta" :
                              s.payment_method === "transferencia" ? "🏦 Transferencia" :
                                s.payment_method || "N/A"}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {new Date(s.created_at).toLocaleDateString("es-DO", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
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
        <div style={styles.overlay} onClick={closeModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Nueva venta</h2>
            <form onSubmit={handleSubmit} style={styles.form}>

              {/* Productos */}
              {items.map((item, index) => (
                <div key={index} style={styles.itemRow}>
                  <select
                    value={item.product_id}
                    onChange={(e) => handleItemChange(index, "product_id", e.target.value)}
                    required
                    style={styles.select}
                  >
                    <option value="">Selecciona producto</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — ${Number(p.price).toLocaleString("es-DO")} (stock: {p.stock})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                    required
                    style={styles.qtyInput}
                    placeholder="Cant."
                  />
                  <button type="button" onClick={() => removeItem(index)} style={styles.removeBtn}>
                    ✕
                  </button>
                </div>
              ))}

              <button type="button" onClick={addItem} style={styles.addItemBtn}>
                + Agregar producto
              </button>

              {/* Total */}
              <div style={styles.totalBox}>
                <span style={styles.totalLabel}>Total</span>
                <span style={styles.totalValue}>
                  ${getTotal().toLocaleString("es-DO")}
                </span>
              </div>

              {/* Método de pago */}
              <div style={styles.field}>
                <label style={styles.label}>Método de pago</label>
                <div style={styles.paymentBtns}>
                  {paymentMethods.map((pm) => (
                    <button
                      key={pm.value}
                      type="button"
                      onClick={() => setPaymentMethod(pm.value)}
                      style={{
                        ...styles.paymentBtn,
                        background: paymentMethod === pm.value ? "#4f46e5" : "#f8fafc",
                        color: paymentMethod === pm.value ? "#fff" : "#64748b",
                        border: paymentMethod === pm.value ? "1.5px solid #4f46e5" : "1.5px solid #e2e8f0",
                      }}
                    >
                      {pm.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Monto recibido (solo efectivo) */}
              {paymentMethod === "efectivo" && (
                <div style={styles.field}>
                  <label style={styles.label}>Monto recibido (RD$)</label>
                  <input
                    type="number"
                    min="0"
                    value={received}
                    onChange={(e) => setReceived(e.target.value)}
                    placeholder="0.00"
                    style={styles.input}
                  />
                  {Number(received) > 0 && (
                    <div style={{
                      ...styles.changePill,
                      background: getChange() >= 0 ? "#ecfdf5" : "#fef2f2",
                      color: getChange() >= 0 ? "#059669" : "#dc2626",
                    }}>
                      {getChange() >= 0
                        ? `Cambio: $${getChange().toLocaleString("es-DO")}`
                        : `Faltan: $${Math.abs(getChange()).toLocaleString("es-DO")}`}
                    </div>
                  )}
                </div>
              )}

              {/* Referencia (solo transferencia) */}
              {paymentMethod === "transferencia" && (
                <div style={styles.field}>
                  <label style={styles.label}>Número de referencia</label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Ej: TRF-000123"
                    style={styles.input}
                  />
                </div>
              )}

              <div style={styles.modalBtns}>
                <button type="button" onClick={closeModal} style={styles.cancelBtn}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  style={{ ...styles.saveBtn, opacity: formLoading ? 0.7 : 1 }}
                >
                  {formLoading ? "Registrando..." : "Registrar venta"}
                </button>
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
  content: { maxWidth: 1100, margin: "0 auto", padding: "32px 24px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 },
  title: { fontSize: 28, fontWeight: 700, color: "#0f172a", margin: "0 0 4px" },
  subtitle: { fontSize: 15, color: "#64748b", margin: 0 },
  headerBtns: { display: "flex", gap: 12 },
  exportBtn: {
    padding: "10px 20px", background: "#fff", color: "#4f46e5",
    border: "1.5px solid #4f46e5", borderRadius: 10, fontSize: 14,
    fontWeight: 600, cursor: "pointer",
  },
  createBtn: {
    padding: "10px 20px", background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    color: "#fff", border: "none", borderRadius: 10, fontSize: 14,
    fontWeight: 600, cursor: "pointer",
  },
  filtersRow: { display: "flex", alignItems: "center", gap: 16, marginBottom: 20, flexWrap: "wrap" },
  filterBtns: { display: "flex", gap: 8 },
  filterBtn: { padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" },
  totalPill: {
    padding: "8px 16px", background: "#ecfdf5", color: "#059669",
    borderRadius: 8, fontSize: 13, border: "1px solid #a7f3d0",
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
  methodBadge: { padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 },
  empty: { textAlign: "center", padding: "40px", color: "#94a3b8", fontSize: 14 },
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200,
  },
  modal: {
    background: "#fff", borderRadius: 20, padding: "36px",
    width: "100%", maxWidth: 520, boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
    maxHeight: "90vh", overflowY: "auto",
  },
  modalTitle: { fontSize: 20, fontWeight: 700, color: "#0f172a", margin: "0 0 24px" },
  form: { display: "flex", flexDirection: "column", gap: 14 },
  itemRow: { display: "flex", gap: 10, alignItems: "center" },
  select: {
    flex: 1, padding: "10px 12px", border: "1.5px solid #e2e8f0",
    borderRadius: 10, fontSize: 14, outline: "none", color: "#0f172a", background: "#fff",
  },
  qtyInput: {
    width: 80, padding: "10px 12px", border: "1.5px solid #e2e8f0",
    borderRadius: 10, fontSize: 14, outline: "none", color: "#0f172a", textAlign: "center",
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
    background: "#f8fafc", borderRadius: 10, padding: "14px 16px",
    border: "1px solid #e2e8f0",
  },
  totalLabel: { fontSize: 14, color: "#64748b", fontWeight: 500 },
  totalValue: { fontSize: 22, fontWeight: 700, color: "#059669" },
  field: { display: "flex", flexDirection: "column", gap: 8 },
  label: { fontSize: 13, fontWeight: 600, color: "#374151" },
  paymentBtns: { display: "flex", gap: 8, flexWrap: "wrap" },
  paymentBtn: {
    padding: "10px 16px", borderRadius: 10, fontSize: 13,
    fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
  },
  input: {
    padding: "11px 14px", border: "1.5px solid #e2e8f0",
    borderRadius: 10, fontSize: 14, outline: "none", color: "#0f172a",
  },
  changePill: {
    padding: "8px 14px", borderRadius: 8, fontSize: 13,
    fontWeight: 600, textAlign: "center",
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