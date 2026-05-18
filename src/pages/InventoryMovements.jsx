import { useState, useEffect } from "react";
import { inventoryAPI, productsAPI } from "../services/api";
import Navbar from "../components/Navbar";
import { TableSkeleton } from "../components/Skeleton";
import toast from "react-hot-toast";

export default function InventoryMovements() {
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productId, setProductId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const loadMovements = () => {
    setLoading(true);
    const params = {};
    if (productId) params.product_id = productId;
    if (from) params.from = from;
    if (to) params.to = to;

    inventoryAPI.getMovements(params)
      .then(setMovements)
      .catch(() => toast.error("Error cargando movimientos"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    productsAPI.getAll()
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => {});
    loadMovements();
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    loadMovements();
  };

  const clearFilters = () => {
    setProductId("");
    setFrom("");
    setTo("");
    setTimeout(() => loadMovements(), 0);
  };

  const typeLabels = {
    entry: { label: "Entrada", color: "#059669", bg: "#ecfdf5" },
    exit: { label: "Salida", color: "#dc2626", bg: "#fef2f2" },
    adjustment: { label: "Ajuste", color: "#f59e0b", bg: "#fffbeb" },
  };

  const refLabels = {
    sale: "Venta",
    purchase: "Compra",
    cancellation: "Anulación",
    purchase_delete: "Elim. Compra",
  };

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.content}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Kardex</h1>
            <p style={styles.subtitle}>Movimientos del inventario</p>
          </div>
        </div>

        {/* Filtros */}
        <form onSubmit={handleFilter} style={styles.filterCard}>
          <div style={styles.filterGrid}>
            <div style={styles.field}>
              <label style={styles.label}>Producto</label>
              <select value={productId} onChange={(e) => setProductId(e.target.value)} style={styles.input}>
                <option value="">Todos los productos</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Desde</label>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={styles.input} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Hasta</label>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={styles.input} />
            </div>
          </div>
          <div style={styles.filterActions}>
            <button type="submit" style={styles.filterBtn}>Filtrar</button>
            <button type="button" onClick={clearFilters} style={styles.clearBtn}>Limpiar</button>
          </div>
        </form>

        {/* Tabla */}
        <div style={styles.tableCard}>
          {loading ? (
            <TableSkeleton rows={6} cols={6} />
          ) : movements.length === 0 ? (
            <p style={styles.empty}>No hay movimientos registrados.</p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  {["Fecha", "Producto", "Tipo", "Cantidad", "Saldo", "Costo Unit.", "Referencia", "Notas"].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => {
                  const t = typeLabels[m.type] || { label: m.type, color: "#64748b", bg: "#f8fafc" };
                  return (
                    <tr key={m.id} style={styles.tr}>
                      <td style={styles.td}>
                        {new Date(m.created_at).toLocaleDateString("es-DO", {
                          day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                        })}
                      </td>
                      <td style={{ ...styles.td, fontWeight: 600 }}>{m.product_name}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.typeBadge, background: t.bg, color: t.color }}>
                          {t.label}
                        </span>
                      </td>
                      <td style={{ ...styles.td, fontWeight: 600, color: m.type === "entry" ? "#059669" : "#dc2626" }}>
                        {m.type === "entry" ? "+" : "-"}{m.quantity}
                      </td>
                      <td style={{ ...styles.td, fontFamily: "monospace" }}>{m.balance_after}</td>
                      <td style={styles.td}>
                        {Number(m.unit_cost) > 0 ? `$${Number(m.unit_cost).toLocaleString("es-DO")}` : "—"}
                      </td>
                      <td style={styles.td}>
                        <span style={styles.refBadge}>
                          {refLabels[m.reference_type] || m.reference_type}
                          {m.reference_id ? ` #${m.reference_id}` : ""}
                        </span>
                      </td>
                      <td style={{ ...styles.td, color: "#94a3b8", fontSize: 12 }}>{m.notes || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f8fafc", fontFamily: "'Segoe UI', system-ui, sans-serif" },
  content: { maxWidth: 1100, margin: "0 auto", padding: "32px 24px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 },
  title: { fontSize: 28, fontWeight: 700, color: "#0f172a", margin: "0 0 4px" },
  subtitle: { fontSize: 15, color: "#64748b", margin: 0 },
  filterCard: {
    background: "#fff", borderRadius: 16, padding: "24px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9", marginBottom: 20,
  },
  filterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 16, marginBottom: 16,
  },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: "#374151" },
  input: {
    padding: "10px 12px", border: "1.5px solid #e2e8f0",
    borderRadius: 10, fontSize: 14, outline: "none", color: "#0f172a", background: "#fff",
  },
  filterActions: { display: "flex", gap: 10 },
  filterBtn: {
    padding: "10px 24px", background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer",
  },
  clearBtn: {
    padding: "10px 20px", background: "transparent", border: "1.5px solid #e2e8f0",
    borderRadius: 10, fontSize: 14, fontWeight: 600, color: "#64748b", cursor: "pointer",
  },
  msg: { color: "#64748b", fontSize: 15, textAlign: "center", padding: "40px 0" },
  empty: { color: "#94a3b8", fontSize: 14, textAlign: "center", padding: "40px 0" },
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
  td: { padding: "14px 20px", fontSize: 13, color: "#334155" },
  typeBadge: { padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600 },
  refBadge: {
    padding: "3px 8px", background: "#f1f5f9", color: "#475569",
    borderRadius: 6, fontSize: 11, fontWeight: 600,
  },
};
