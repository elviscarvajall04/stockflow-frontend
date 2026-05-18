import { useState, useEffect } from "react";
import { reportsAPI, inventoryAPI } from "../services/api";
import Navbar from "../components/Navbar";
import { CardSkeleton } from "../components/Skeleton";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [inventoryValue, setInventoryValue] = useState(null);
  const [profitData, setProfitData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([reportsAPI.getDashboard(), inventoryAPI.getValue(), reportsAPI.getProfitReport("1970-01-01", "2999-12-31")])
      .then(([report, inv, profit]) => {
        setData(report);
        setInventoryValue(inv);
        setProfitData(profit);
      })
      .catch(() => setError("Error cargando el dashboard"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.content}>
        <div style={styles.metrics}>
          {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div style={styles.centered}>
      <p style={styles.errorText}>{error}</p>
    </div>
  );

  const metrics = [
    {
      label: "Total productos",
      value: data.total_products,
      icon: "📦",
      color: "#4f46e5",
      bg: "#eef2ff",
    },
    {
      label: "Total ventas",
      value: data.total_sales,
      icon: "🧾",
      color: "#0891b2",
      bg: "#ecfeff",
    },
    {
      label: "Ingresos totales",
      value: `$${Number(data.total_revenue).toLocaleString("es-DO")}`,
      icon: "💰",
      color: "#059669",
      bg: "#ecfdf5",
    },
    {
      label: "ITBIS cobrado",
      value: data.total_itbis ? `$${Number(data.total_itbis).toLocaleString("es-DO")}` : "$0",
      icon: "🧾",
      color: "#dc2626",
      bg: "#fef2f2",
    },
    {
      label: "Ganancia total",
      value: profitData ? `$${Number(profitData.summary.total_profit).toLocaleString("es-DO")}` : "$0",
      icon: "📈",
      color: "#059669",
      bg: "#ecfdf5",
    },
    {
      label: "Productos bajo stock",
      value: data.low_stock_products,
      icon: "⚠️",
      color: "#f59e0b",
      bg: "#fffbeb",
    },
    {
      label: "Valor del inventario",
      value: inventoryValue ? `$${Number(inventoryValue.total_value).toLocaleString("es-DO")}` : "$0",
      icon: "📊",
      color: "#0891b2",
      bg: "#ecfeff",
    },
  ];

  // Datos para gráfica de ventas por día
  const salesByDay = data.recent_sales.reduce((acc, sale) => {
    const date = new Date(sale.created_at).toLocaleDateString("es-DO", {
      day: "2-digit",
      month: "short",
    });
    const existing = acc.find((d) => d.date === date);
    if (existing) {
      existing.total += Number(sale.total);
      existing.ventas += 1;
    } else {
      acc.push({ date, total: Number(sale.total), ventas: 1 });
    }
    return acc;
  }, []);

  // Datos para gráfica de productos más vendidos
  const topProducts = data.recent_sales
    .flatMap((s) => s.items || [])
    .reduce((acc, item) => {
      if (!item) return acc;
      const existing = acc.find((p) => p.name === item.product_name);
      if (existing) {
        existing.cantidad += item.quantity || 1;
      } else {
        acc.push({ name: item.product_name || "Producto", cantidad: item.quantity || 1 });
      }
      return acc;
    }, [])
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 5);

  const hasTopProducts = topProducts.length > 0;

  return (
    <div style={styles.page}>
      <Navbar />

      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>Dashboard</h1>
          <p style={styles.subtitle}>Resumen general de tu negocio</p>
        </div>

        {/* Métricas */}
        <div style={styles.grid}>
          {metrics.map((m) => (
            <div key={m.label} style={styles.card}>
              <div style={{ ...styles.iconBox, background: m.bg }}>
                <span style={styles.iconEmoji}>{m.icon}</span>
              </div>
              <div>
                <p style={styles.metricLabel}>{m.label}</p>
                <p style={{ ...styles.metricValue, color: m.color }}>
                  {m.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Gráficas */}
        <div style={styles.chartsGrid}>

          {/* Gráfica de ingresos */}
          <div style={styles.chartCard}>
            <h2 style={styles.chartTitle}>Ingresos por día</h2>
            <p style={styles.chartSub}>Basado en ventas recientes</p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={salesByDay} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} />
                <Tooltip
                  formatter={(value) => [`$${Number(value).toLocaleString("es-DO")}`, "Ingresos"]}
                  contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13 }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  fill="url(#colorTotal)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfica de productos más vendidos */}
          <div style={styles.chartCard}>
            <h2 style={styles.chartTitle}>Productos más vendidos</h2>
            <p style={styles.chartSub}>Por cantidad de unidades</p>
            {hasTopProducts ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topProducts} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} />
                  <Tooltip
                    formatter={(value) => [value, "Unidades"]}
                    contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13 }}
                  />
                  <Bar dataKey="cantidad" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={styles.emptyChart}>
                <p style={styles.emptyText}>
                  Los datos detallados de productos aparecerán aquí cuando el endpoint incluya items por venta.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Ventas recientes */}
        <div style={styles.tableCard}>
          <h2 style={styles.tableTitle}>Ventas recientes</h2>
          {data.recent_sales.length === 0 ? (
            <p style={styles.empty}>No hay ventas registradas todavía.</p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  {["ID", "Usuario", "Total", "Fecha"].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.recent_sales.map((sale) => (
                  <tr key={sale.id} style={styles.tr}>
                    <td style={styles.td}>#{sale.id}</td>
                    <td style={styles.td}>{sale.user_name}</td>
                    <td style={{ ...styles.td, fontWeight: 600, color: "#059669" }}>
                      ${Number(sale.total).toLocaleString("es-DO")}
                    </td>
                    <td style={styles.td}>
                      {new Date(sale.created_at).toLocaleDateString("es-DO", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  centered: {
    display: "flex", alignItems: "center",
    justifyContent: "center", minHeight: "100vh",
  },
  loadingText: { color: "#64748b", fontSize: 16 },
  errorText: { color: "#dc2626", fontSize: 16 },
  content: { maxWidth: 1100, margin: "0 auto", padding: "32px 24px" },
  header: { marginBottom: 28 },
  title: { fontSize: 28, fontWeight: 700, color: "#0f172a", margin: "0 0 4px" },
  subtitle: { fontSize: 15, color: "#64748b", margin: 0 },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 20, marginBottom: 24,
  },
  card: {
    background: "#fff", borderRadius: 16, padding: "24px 20px",
    display: "flex", alignItems: "center", gap: 16,
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9",
  },
  iconBox: {
    width: 52, height: 52, borderRadius: 12,
    display: "flex", alignItems: "center",
    justifyContent: "center", flexShrink: 0,
  },
  iconEmoji: { fontSize: 24 },
  metricLabel: { fontSize: 13, color: "#64748b", margin: "0 0 4px", fontWeight: 500 },
  metricValue: { fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: "-0.5px" },
  chartsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: 20, marginBottom: 24,
  },
  chartCard: {
    background: "#fff", borderRadius: 16, padding: "24px 28px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9",
  },
  chartTitle: { fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 4px" },
  chartSub: { fontSize: 13, color: "#94a3b8", margin: "0 0 20px" },
  emptyChart: {
    height: 220, display: "flex",
    alignItems: "center", justifyContent: "center",
  },
  emptyText: {
    color: "#94a3b8", fontSize: 13,
    textAlign: "center", lineHeight: 1.6,
  },
  tableCard: {
    background: "#fff", borderRadius: 16, padding: "24px 28px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9",
  },
  tableTitle: { fontSize: 17, fontWeight: 700, color: "#0f172a", margin: "0 0 20px" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left", fontSize: 12, fontWeight: 600, color: "#94a3b8",
    textTransform: "uppercase", letterSpacing: "0.5px",
    padding: "0 16px 12px 0", borderBottom: "1px solid #f1f5f9",
  },
  tr: { borderBottom: "1px solid #f8fafc" },
  td: { padding: "14px 16px 14px 0", fontSize: 14, color: "#334155" },
  empty: { color: "#94a3b8", fontSize: 14, textAlign: "center", padding: "32px 0" },
};