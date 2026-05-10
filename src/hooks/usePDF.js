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
      head: [["ID", "Nombre", "Precio", "ITBIS", "Stock", "Estado"]],
      body: products.map((p) => [
        `#${p.id}`,
        p.name,
        `$${Number(p.price).toLocaleString("es-DO")}`,
        `${Number(p.itbis || 18).toFixed(1)}%`,
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

    const subtotal = sales.reduce((sum, s) => sum + Number(s.subtotal || s.total), 0);
    const itbis = sales.reduce((sum, s) => sum + Number(s.itbis_total || 0), 0);
    const total = sales.reduce((sum, s) => sum + Number(s.total), 0);

    autoTable(doc, {
      startY: 42,
      head: [["NCF", "Vendedor", "Subtotal", "ITBIS", "Total", "Fecha"]],
      body: sales.map((s) => [
        s.ncf || `#${s.id ?? s.sale_id ?? "—"}`,
        s.user_name,
        `$${Number(s.subtotal || s.total).toLocaleString("es-DO")}`,
        `$${Number(s.itbis_total || 0).toLocaleString("es-DO")}`,
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
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text(`Subtotal: $${subtotal.toLocaleString("es-DO")}`, 14, finalY);
    doc.setTextColor(220, 38, 38);
    doc.text(`ITBIS: $${itbis.toLocaleString("es-DO")}`, 14, finalY + 7);
    doc.setTextColor(5, 150, 105);
    doc.setFontSize(13);
    doc.text(`Total general: $${total.toLocaleString("es-DO")}`, 14, finalY + 16);

    doc.save("ventas-stockflow.pdf");
  };

  const exportInvoice = (sale, company) => {
    const doc = new jsPDF();

    // Encabezado empresa
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229);
    doc.text(company?.company_name || "StockFlow RD", 14, 22);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    if (company?.rnc) doc.text(`RNC: ${company.rnc}`, 14, 30);
    if (company?.phone) doc.text(`Tel: ${company.phone}`, 14, 35);
    if (company?.address) doc.text(`Dir: ${company.address}`, 14, 40);
    if (company?.email) doc.text(`Email: ${company.email}`, 14, 45);

    // Comprobante fiscal
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text("FACTURA", 140, 22);
    doc.setFontSize(11);
    doc.setTextColor(79, 70, 229);
    doc.text(sale.ncf || "", 140, 30);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Fecha: ${new Date(sale.created_at).toLocaleDateString("es-DO", {
      day: "2-digit", month: "long", year: "numeric",
    })}`, 140, 37);
    doc.text(`Vendedor: ${sale.user_name || ""}`, 140, 42);

    // Cliente
    const clientY = company?.rnc ? 55 : 50;
    doc.setDrawColor(226, 232, 240);
    doc.line(14, clientY, 196, clientY);

    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("Cliente:", 14, clientY + 8);
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.text(sale.client_name || "Consumidor Final", 14, clientY + 16);
    if (sale.client_rnc) {
      doc.text(`RNC: ${sale.client_rnc}`, 14, clientY + 23);
    }

    // Tabla de productos
    const tableStartY = (sale.client_rnc ? clientY + 30 : clientY + 24);
    const items = Array.isArray(sale.items) ? sale.items : [];

    autoTable(doc, {
      startY: tableStartY,
      head: [["Producto", "Cant.", "Precio", "ITBIS", "Subtotal"]],
      body: items.map((item) => {
        const qty = Number(item.quantity) || 1;
        const price = Number(item.price) || 0;
        const itbisRate = Number(item.itbis_rate || 18);
        const itemSubtotal = price * qty;
        const itemItbis = itemSubtotal * (itbisRate / 100);
        return [
          item.product_name || "Producto",
          qty.toString(),
          `$${price.toLocaleString("es-DO")}`,
          `$${itemItbis.toLocaleString("es-DO")}`,
          `$${(itemSubtotal + itemItbis).toLocaleString("es-DO")}`,
        ];
      }),
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 10,
      },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { cellPadding: 5 },
    });

    // Totales
    const fy = doc.lastAutoTable.finalY + 12;
    const subtotal = Number(sale.subtotal) || 0;
    const itbis = Number(sale.itbis_total) || 0;
    const total = Number(sale.total) || 0;

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text("Subtotal:", 140, fy);
    doc.text(`$${subtotal.toLocaleString("es-DO")}`, 170, fy, { align: "right" });

    doc.setTextColor(220, 38, 38);
    doc.text("ITBIS:", 140, fy + 7);
    doc.text(`$${itbis.toLocaleString("es-DO")}`, 170, fy + 7, { align: "right" });

    doc.setDrawColor(226, 232, 240);
    doc.line(140, fy + 11, 196, fy + 11);

    doc.setFontSize(13);
    doc.setTextColor(5, 150, 105);
    doc.text("Total:", 140, fy + 20);
    doc.text(`$${total.toLocaleString("es-DO")}`, 170, fy + 20, { align: "right" });

    // Método de pago
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    const methodLabels = { efectivo: "Efectivo", tarjeta: "Tarjeta", transferencia: "Transferencia" };
    doc.text(`Método de pago: ${methodLabels[sale.payment_method] || sale.payment_method}`, 14, fy + 10);

    // NCF info
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    const ncfTypes = { B01: "Factura de Crédito Fiscal", B02: "Factura de Consumo" };
    doc.text(`NCF Tipo: ${sale.ncf_type || "B02"} — ${ncfTypes[sale.ncf_type] || ""}`, 14, fy + 16);
    doc.text(`Generado por StockFlow RD — ${new Date().toLocaleString("es-DO")}`, 14, fy + 22);

    doc.save(`factura-${sale.ncf || sale.sale_id || "unknown"}.pdf`);
  };

  return { exportProducts, exportSales, exportInvoice };
}