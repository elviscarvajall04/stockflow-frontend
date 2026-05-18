import { useState, useEffect } from "react";
import { reportsAPI } from "../services/api";
import Navbar from "../components/Navbar";
import toast from "react-hot-toast";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from "recharts";

export default function Profit() {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const [from, setFrom] = useState(firstDay.toISOString().split("T")[0]);
  const [to, setTo] = useState(now.toISOString().split("T")[0]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const result = await reportsAPI.getProfitReport(from, to);
      setData(result);
    } catch {
      toast.error("Error generando reporte");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { generate(); }, []);

  const formatMoney = (v) => `$${Number(v).toLocaleString("es-DO", { minimumFractionDigits: 2 })}`;

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.content}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Ganancias</h1>
            <p style={styles.subtitle}>Rentabilidad del negocio por período</p>
          </div>
        </div>

        <div style={styles.controls}>
          <div style={styles.field}>
            <label style={styles.label}>Desde</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={styles.input} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Hasta</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={styles.input} />
          </div>
          <button onClick={generate} disabled={loading} style={styles.generateBtn}>
            {loading ? "Generando..." : "Generar"}
          </button>
        </div>

        {loading && <p style={styles.msg}>Calculando ganancias...</p>}

        {data && (
          <>
            <div style={styles.summaryGrid}>
              <div style={{ ...styles.card, borderLeft: "4px solid #4f46e5" }}>
                <p style={styles.cardLabel}>Ingresos</p>
                <p style={{ ...styles.cardValue, color: "#4f46e5" }}>{formatMoney(data.summary.total_revenue)}</p>
              </div>
              <div style={{ ...styles.card, borderLeft: "4px solid #dc2626" }}>
                <p style={styles.cardLabel}>Costos</p>
                <p style={{ ...styles.cardValue, color: "#dc2626" }}>{formatMoney(data.summary.total_cost)}</p>
              </div>
              <div style={{ ...styles.card, borderLeft: `4px solid ${data.summary.total_profit >= 0 ? "#059669" : "#dc2626"}` }}>
                <p style={styles.cardLabel}>Ganancia neta</p>
                <p style={{ ...styles.cardValue, color: data.summary.total_profit >= 0 ? "#059669" : "#dc2626" }}>
                  {formatMoney(data.summary.total_profit)}
                </p>
              </div>
              <div style={{ ...styles.card, borderLeft: "4px solid #0891b2" }}>
                <p style={styles.cardLabel}>Margen</p>
                <p style={{ ...styles.cardValue, color: "#0891b2" }}>{data.summary.total_margin}%</p>
              </div>
            </div>

            {data.daily.length > 0 && (
              <div style={styles.chartCard}>
                <h2 style={styles.chartTitle}>Evolución diaria</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={data.daily}>
                    <defs>
                      <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }}
                      tickFormatter={(d) => new Date(d).toLocaleDateString("es-DO", { day: "2-digit", month: "short" })} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <Tooltip
                      formatter={(value) => [formatMoney(value), ""]}
                      contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} fill="url(#profitGrad)" name="Ingresos" />
                    <Area type="monotone" dataKey="cost" stroke="#dc2626" strokeWidth={2} fill="none" strokeDasharray="4 4" name="Costos" />
                    <Area type="monotone" dataKey="profit" stroke="#059669" strokeWidth={2} fill="none" name="Ganancia" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {data.products.length > 0 && (
              <div style={styles.chartCard}>
                <h2 style={styles.chartTitle}>Productos más rentables</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.products.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="product_name" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <Tooltip formatter={(value) => [formatMoney(value), ""]} />
                    <Bar dataKey="profit" fill="#059669" radius={[6, 6, 0, 0]} name="Ganancia" />
                    <Bar dataKey="cost" fill="#dc2626" radius={[6, 6, 0, 0]} name="Costo" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div style={styles.tableCard}>
              <h2 style={styles.tableTitle}>
                Detalle por producto ({data.products.length})
              </h2>
              {data.products.length === 0 ? (
                <p style={styles.empty}>No hay datos en este período.</p>
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {["Producto", "Vendidos", "Ingreso", "Costo prom.", "Costo total", "Ganancia", "Margen"].map((h) => (
                        <th key={h} style={styles.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.products.map((p) => (
                      <tr key={p.product_id} style={styles.tr}>
                        <td style={{ ...styles.td, fontWeight: 600, color: "#0f172a" }}>{p.product_name}</td>
                        <td style={styles.td}>{p.units_sold}</td>
                        <td style={{ ...styles.td, color: "#4f46e5", fontWeight: 600 }}>{formatMoney(p.revenue)}</td>
                        <td style={styles.td}>{formatMoney(p.avg_cost)}</td>
                        <td style={{ ...styles.td, color: "#dc2626" }}>{formatMoney(p.cost)}</td>
                        <td style={{ ...styles.td, fontWeight: 700, color: p.profit >= 0 ? "#059669" : "#dc2626" }}>
                          {formatMoney(p.profit)}
                        </td>
                        <td style={styles.td}>
                          <span style={{
                            padding: "3px 8px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                            background: p.margin >= 0 ? "#ecfdf5" : "#fef2f2",
                            color: p.margin >= 0 ? "#059669" : "#dc2626",
                          }}>
                            {p.margin}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
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
  controls: { display: "flex", gap: 12, alignItems: "flex-end", marginBottom: 24, flexWrap: "wrap" },
  field: { display: "flex", flexDirection: "column", gap: 4 },
  label: { fontSize: 12, fontWeight: 600, color: "#374151" },
  input: {
    padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 10,
    fontSize: 14, outline: "none", color: "#0f172a", background: "#fff",
  },
  generateBtn: {
    padding: "10px 24px", background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    color: "#fff", border: "none", borderRadius: 10, fontSize: 14,
    fontWeight: 600, cursor: "pointer",
  },
  msg: { color: "#64748b", fontSize: 15 },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 16, marginBottom: 24,
  },
  card: {
    background: "#fff", borderRadius: 12, padding: "20px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9",
  },
  cardLabel: { fontSize: 13, color: "#64748b", margin: "0 0 8px", fontWeight: 500 },
  cardValue: { fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: "-0.5px" },
  chartCard: {
    background: "#fff", borderRadius: 16, padding: "24px 28px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9",
    marginBottom: 24,
  },
  chartTitle: { fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 20px" },
  tableCard: {
    background: "#fff", borderRadius: 16, padding: "24px 28px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9",
  },
  tableTitle: { fontSize: 17, fontWeight: 700, color: "#0f172a", margin: "0 0 20px" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left", fontSize: 12, fontWeight: 600, color: "#94a3b8",
    textTransform: "uppercase", letterSpacing: "0.5px",
    padding: "12px 16px", borderBottom: "1px solid #f1f5f9", background: "#fafafa",
  },
  tr: { borderBottom: "1px solid #f8fafc" },
  td: { padding: "12px 16px", fontSize: 13, color: "#334155" },
  empty: { color: "#94a3b8", fontSize: 14, textAlign: "center", padding: "32px 0" },
};
