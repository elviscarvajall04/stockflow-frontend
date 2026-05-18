import { useState } from "react";
import { reportsAPI } from "../services/api";
import Navbar from "../components/Navbar";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function DgiiReport() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const months = [
    { value: 1, label: "Enero" }, { value: 2, label: "Febrero" },
    { value: 3, label: "Marzo" }, { value: 4, label: "Abril" },
    { value: 5, label: "Mayo" }, { value: 6, label: "Junio" },
    { value: 7, label: "Julio" }, { value: 8, label: "Agosto" },
    { value: 9, label: "Septiembre" }, { value: 10, label: "Octubre" },
    { value: 11, label: "Noviembre" }, { value: 12, label: "Diciembre" },
  ];

  const generate = async () => {
    setLoading(true);
    try {
      const result = await reportsAPI.getDgiiReport(month, year);
      setData(result);
    } catch {
      toast.error("Error generando reporte");
    } finally {
      setLoading(false);
    }
  };

  const exportPdf = () => {
    if (!data) return;
    const doc = new jsPDF();
    const monthName = months.find((m) => m.value === month)?.label || month;

    doc.setFontSize(18);
    doc.setTextColor(79, 70, 229);
    doc.text("StockFlow RD", 14, 20);

    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("Reporte DGII — ITBIS", 14, 30);

    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text(`Período: ${monthName} ${year}`, 14, 38);
    doc.text(`Generado: ${now.toLocaleDateString("es-DO", { day: "2-digit", month: "long", year: "numeric" })}`, 14, 45);

    // Resumen
    autoTable(doc, {
      startY: 52,
      head: [["", "Monto RD$", "ITBIS RD$"]],
      body: [
        ["Ventas del período", `$${data.ventas.total.toLocaleString("es-DO")}`, `$${data.ventas.itbis.toLocaleString("es-DO")}`],
        ["Compras del período", `$${data.compras.total.toLocaleString("es-DO")}`, `$${data.compras.itbis.toLocaleString("es-DO")}`],
      ],
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: "bold", fontSize: 10 },
      bodyStyles: { fontSize: 10 },
      styles: { cellPadding: 6 },
    });

    const fy = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("ITBIS a pagar:", 14, fy);
    doc.setFontSize(14);
    doc.setTextColor(data.itbis_a_pagar > 0 ? "#dc2626" : "#059669");
    doc.text(`$${data.itbis_a_pagar.toLocaleString("es-DO")}`, 80, fy);

    // Detalle de ventas
    if (data.ncf_emitidos && data.ncf_emitidos.length > 0) {
      doc.addPage();
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text("Detalle de facturas emitidas", 14, 20);
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Período: ${monthName} ${year}`, 14, 28);

      autoTable(doc, {
        startY: 34,
        head: [["NCF", "Tipo", "Total", "ITBIS", "Fecha"]],
        body: data.ncf_emitidos.map((s) => [
          s.ncf,
          s.ncf_type || "B02",
          `$${Number(s.total).toLocaleString("es-DO")}`,
          `$${Number(s.itbis_total || 0).toLocaleString("es-DO")}`,
          new Date(s.created_at).toLocaleDateString("es-DO"),
        ]),
        headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: "bold", fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        styles: { cellPadding: 5 },
      });
    }

    doc.save(`dgii-itbis-${monthName}-${year}.pdf`);
  };

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.content}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Reporte DGII</h1>
            <p style={styles.subtitle}>Declaración mensual de ITBIS</p>
          </div>
        </div>

        <div style={styles.controls}>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} style={styles.select}>
            {months.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))}
            min={2020} max={2030} style={{ ...styles.select, width: 100 }} />
          <button onClick={generate} disabled={loading} style={styles.generateBtn}>
            {loading ? "Generando..." : "Generar reporte"}
          </button>
        </div>

        {data && (
          <>
            <div style={styles.summaryGrid}>
              <div style={{ ...styles.summaryCard, borderLeft: "4px solid #4f46e5" }}>
                <p style={styles.summaryLabel}>Ventas del período</p>
                <p style={styles.summaryValue}>${data.ventas.total.toLocaleString("es-DO")}</p>
                <p style={styles.summarySub}>ITBIS cobrado: ${data.ventas.itbis.toLocaleString("es-DO")}</p>
                <p style={styles.summarySub}>{data.ventas.cantidad} facturas emitidas</p>
              </div>
              <div style={{ ...styles.summaryCard, borderLeft: "4px solid #0891b2" }}>
                <p style={styles.summaryLabel}>Compras del período</p>
                <p style={styles.summaryValue}>${data.compras.total.toLocaleString("es-DO")}</p>
                <p style={styles.summarySub}>ITBIS estimado: ${data.compras.itbis.toLocaleString("es-DO")}</p>
                <p style={styles.summarySub}>{data.compras.cantidad} compras registradas</p>
              </div>
              <div style={{ ...styles.summaryCard, borderLeft: `4px solid ${data.itbis_a_pagar > 0 ? "#dc2626" : "#059669"}` }}>
                <p style={styles.summaryLabel}>ITBIS a pagar</p>
                <p style={{ ...styles.summaryValue, color: data.itbis_a_pagar > 0 ? "#dc2626" : "#059669" }}>
                  ${data.itbis_a_pagar.toLocaleString("es-DO")}
                </p>
                <p style={styles.summarySub}>
                  {data.itbis_a_pagar > 0
                    ? "Monto a pagar a la DGII"
                    : "Crédito a favor"}
                </p>
              </div>
            </div>

            {data.ncf_emitidos && data.ncf_emitidos.length > 0 && (
              <div style={styles.tableCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                    Facturas emitidas ({data.ncf_emitidos.length})
                  </h2>
                  <button onClick={exportPdf} style={styles.exportBtn}>⬇ Exportar PDF</button>
                </div>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {["NCF", "Tipo", "Total", "ITBIS", "Fecha"].map((h) => (
                        <th key={h} style={styles.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.ncf_emitidos.map((s, i) => (
                      <tr key={i} style={styles.tr}>
                        <td style={{ ...styles.td, fontFamily: "monospace", fontSize: 12 }}>{s.ncf}</td>
                        <td style={styles.td}>{s.ncf_type || "B02"}</td>
                        <td style={{ ...styles.td, fontWeight: 600, color: "#059669" }}>
                          ${Number(s.total).toLocaleString("es-DO")}
                        </td>
                        <td style={{ ...styles.td, color: "#dc2626" }}>
                          ${Number(s.itbis_total || 0).toLocaleString("es-DO")}
                        </td>
                        <td style={styles.td}>
                          {new Date(s.created_at).toLocaleDateString("es-DO")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f8fafc", fontFamily: "'Segoe UI', system-ui, sans-serif" },
  content: { maxWidth: 1000, margin: "0 auto", padding: "32px 24px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 700, color: "#0f172a", margin: "0 0 4px" },
  subtitle: { fontSize: 15, color: "#64748b", margin: 0 },
  controls: { display: "flex", gap: 12, alignItems: "center", marginBottom: 28 },
  select: {
    padding: "11px 14px", border: "1.5px solid #e2e8f0", borderRadius: 10,
    fontSize: 14, outline: "none", color: "#0f172a", background: "#fff",
  },
  generateBtn: {
    padding: "11px 24px", background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    color: "#fff", border: "none", borderRadius: 10, fontSize: 14,
    fontWeight: 600, cursor: "pointer",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 20, marginBottom: 28,
  },
  summaryCard: {
    background: "#fff", borderRadius: 12, padding: "20px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9",
  },
  summaryLabel: { fontSize: 13, color: "#64748b", margin: "0 0 8px", fontWeight: 500 },
  summaryValue: { fontSize: 24, fontWeight: 700, color: "#0f172a", margin: "0 0 4px" },
  summarySub: { fontSize: 12, color: "#94a3b8", margin: "2px 0" },
  tableCard: {
    background: "#fff", borderRadius: 16, padding: "24px 28px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left", fontSize: 12, fontWeight: 600, color: "#94a3b8",
    textTransform: "uppercase", letterSpacing: "0.5px",
    padding: "12px 16px", borderBottom: "1px solid #f1f5f9", background: "#fafafa",
  },
  tr: { borderBottom: "1px solid #f8fafc" },
  td: { padding: "12px 16px", fontSize: 14, color: "#334155" },
  exportBtn: {
    padding: "8px 16px", background: "#f8fafc", border: "1.5px solid #e2e8f0",
    borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#475569",
    cursor: "pointer",
  },
};
