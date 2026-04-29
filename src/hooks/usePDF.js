import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function useExportPDF() {
  const exportProducts = (products) => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setTextColor(79, 70, 229);
    doc.text("StockFlow RD", 14, 20);

    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text("Reporte de Productos", 14, 28);
    doc.text(`Generado: ${new Date().toLocaleDateString("es-DO", {
      day: "2-digit", month: "long", year: "numeric"
    })}`, 14, 35);

    autoTable(doc, {
      startY: 42,
      head: [["ID", "Nombre", "Precio (RD$)", "Stock", "Estado"]],
      body: products.map((p) => [
        `#${p.id}`,
        p.name,
        `$${Number(p.price).toLocaleString("es-DO")}`,
        p.stock,
        p.stock <= 5 ? "Bajo stock" : "Disponible",
      ]),
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 11,
      },
      bodyStyles: { fontSize: 10 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { cellPadding: 6 },
    });

    doc.save("productos-stockflow.pdf");
  };

  const exportSales = (sales) => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setTextColor(79, 70, 229);
    doc.text("StockFlow RD", 14, 20);

    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text("Reporte de Ventas", 14, 28);
    doc.text(`Generado: ${new Date().toLocaleDateString("es-DO", {
      day: "2-digit", month: "long", year: "numeric"
    })}`, 14, 35);

    const total = sales.reduce((sum, s) => sum + Number(s.total), 0);

    autoTable(doc, {
      startY: 42,
      head: [["ID", "Vendedor", "Total (RD$)", "Fecha"]],
      body: sales.map((s) => [
        `#${s.id ?? s.sale_id ?? "—"}`,
        s.user_name,
        `$${Number(s.total).toLocaleString("es-DO")}`,
        new Date(s.created_at).toLocaleDateString("es-DO", {
          day: "2-digit", month: "short", year: "numeric",
        }),
      ]),
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 11,
      },
      bodyStyles: { fontSize: 10 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { cellPadding: 6 },
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setTextColor(5, 150, 105);
    doc.text(`Total general: $${total.toLocaleString("es-DO")}`, 14, finalY);

    doc.save("ventas-stockflow.pdf");
  };

  return { exportProducts, exportSales };
}