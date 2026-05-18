import { useState, useEffect } from "react";
import { salesAPI, productsAPI, clientsAPI } from "../services/api";
import Navbar from "../components/Navbar";
import Pagination from "../components/Pagination";
import { TableSkeleton } from "../components/Skeleton";
import toast from "react-hot-toast";
import { useExportPDF } from "../hooks/usePDF";

const PAGE_LIMIT = 50;

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [items, setItems] = useState([{ product_id: "", quantity: 1 }]);
  const [formLoading, setFormLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showCanceled, setShowCanceled] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("efectivo");
  const [received, setReceived] = useState("");
  const [reference, setReference] = useState("");
  const [clientId, setClientId] = useState("");
  const { exportSales, exportInvoice, exportCreditNote } = useExportPDF();
  const [invoicePreview, setInvoicePreview] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({ client_id: "", payment_method: "" });
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const loadData = (p = 1) => {
    setLoading(true);
    setPage(p);
    Promise.all([salesAPI.getAll({ page: p, limit: PAGE_LIMIT }), productsAPI.getAll(), clientsAPI.getAll()])
      .then(([salesData, productsData, clientsData]) => {
        const list = salesData.data || salesData || [];
        setSales(Array.isArray(list) ? list : []);
        setTotal(salesData.total || 0);
        setTotalPages(salesData.totalPages || 1);
        setProducts(Array.isArray(productsData.data || productsData) ? (productsData.data || productsData) : []);
        setClients(Array.isArray(clientsData.data || clientsData) ? (clientsData.data || clientsData) : []);
      })
      .catch(() => toast.error("Error cargando datos"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(1); }, []);

  const openModal = () => {
    setItems([{ product_id: "", quantity: 1 }]);
    setPaymentMethod("efectivo");
    setReceived("");
    setReference("");
    setClientId("");
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

  const getSubtotal = () => {
    return items.reduce((sum, item) => {
      const product = products.find((p) => p.id === Number(item.product_id));
      if (!product) return sum;
      return sum + Number(product.price) * Number(item.quantity);
    }, 0);
  };

  const getItbisTotal = () => {
    return items.reduce((sum, item) => {
      const product = products.find((p) => p.id === Number(item.product_id));
      if (!product) return sum;
      const itbisRate = Number(product.itbis || 18);
      const itemSubtotal = Number(product.price) * Number(item.quantity);
      return sum + itemSubtotal * (itbisRate / 100);
    }, 0);
  };

  const getTotal = () => getSubtotal() + getItbisTotal();

  const getChange = () => {
    const total = getTotal();
    const rec = Number(received || 0);
    return rec - total;
  };

  const getStockError = () => {
    for (const item of items) {
      if (!item.product_id || !item.quantity) continue;
      const product = products.find((p) => p.id === Number(item.product_id));
      if (product && Number(item.quantity) > product.stock) {
        return `Stock insuficiente para "${product.name}": disponible ${product.stock}, solicitado ${item.quantity}`;
      }
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const stockError = getStockError();
    if (stockError) {
      toast.error(stockError);
      return;
    }
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
        client_id: clientId ? Number(clientId) : null,
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
      loadData(page);
    } catch (err) {
      toast.error(err.message || "Error registrando venta");
    } finally {
      setFormLoading(false);
    }
  };

  const filterSales = (sales) => {
    const now = new Date();
    return sales.filter((s) => {
      if (!showCanceled && s.canceled) return false;
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
    }).filter((s) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (s.ncf && s.ncf.toLowerCase().includes(q)) ||
        (s.client_name && s.client_name.toLowerCase().includes(q)) ||
        (s.user_name && s.user_name.toLowerCase().includes(q));
    });
  };

  const filtered = filterSales(sales);
  const filterTotal = filtered.reduce((sum, s) => sum + Number(s.total), 0);

  const handleInvoice = async (saleId) => {
    try {
      const data = await salesAPI.getById(saleId);
      setInvoicePreview(data);
    } catch (err) {
      toast.error(err.message || "Error cargando factura");
    }
  };

  const closeInvoicePreview = () => setInvoicePreview(null);

  const downloadInvoice = async () => {
    if (!invoicePreview) return;
    await exportInvoice(invoicePreview, invoicePreview.company);
    toast.success("PDF descargado correctamente");
  };

  const methodLabels = {
    efectivo: "Efectivo",
    tarjeta: "Tarjeta",
    transferencia: "Transferencia",
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    try {
      await salesAPI.cancel(cancelTarget.sale_id ?? cancelTarget.id);
      toast.success("Venta anulada correctamente. Stock restaurado.");
      setCancelTarget(null);
      loadData(page);
    } catch (err) {
      toast.error(err.message || "Error anulando venta");
    }
  };

  const downloadCreditNote = async (sale) => {
    try {
      const data = await salesAPI.getById(sale.sale_id ?? sale.id);
      await exportCreditNote(data, data.company);
      toast.success("Nota de crédito descargada");
    } catch (err) {
      toast.error(err.message || "Error descargando nota de crédito");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await salesAPI.delete(deleteTarget.sale_id ?? deleteTarget.id);
      toast.success("Venta eliminada permanentemente");
      setDeleteTarget(null);
      loadData(page);
    } catch (err) {
      toast.error(err.message || "Error eliminando venta");
    }
  };

  const openEdit = (sale) => {
    setEditTarget(sale);
    setEditForm({
      client_id: "",
      payment_method: sale.payment_method || "efectivo",
    });
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editTarget) return;
    try {
      await salesAPI.update(editTarget.sale_id ?? editTarget.id, {
        client_id: editForm.client_id ? Number(editForm.client_id) : null,
        payment_method: editForm.payment_method,
      });
      toast.success("Venta actualizada correctamente");
      setEditTarget(null);
      loadData(page);
    } catch (err) {
      toast.error(err.message || "Error actualizando venta");
    }
  };

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
            <button
              onClick={() => setShowCanceled(!showCanceled)}
              style={{
                ...styles.filterBtn,
                background: showCanceled ? "#fef2f2" : "#fff",
                color: showCanceled ? "#dc2626" : "#64748b",
                border: showCanceled ? "1.5px solid #fca5a5" : "1.5px solid #e2e8f0",
              }}
            >
              {showCanceled ? "Ocultar anuladas" : `Mostrar anuladas (${sales.filter(s => s.canceled).length})`}
            </button>
          </div>
          <div style={{ position: "relative", flex: 1, maxWidth: 280 }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13 }}>🔍</span>
            <input
              type="text" placeholder="Buscar por NCF, cliente..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%", padding: "8px 12px 8px 34px", border: "1.5px solid #e2e8f0",
                borderRadius: 8, fontSize: 13, outline: "none", color: "#0f172a", background: "#fff",
              }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{
                position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 12,
              }}>✕</button>
            )}
          </div>
          {filter !== "all" && (
            <div style={styles.totalPill}>
              Total: <strong>${filterTotal.toLocaleString("es-DO")}</strong>
            </div>
          )}
        </div>

        {loading && <TableSkeleton rows={8} cols={9} />}

        {!loading && (
          <div style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {["NCF", "Vendedor", "Cliente", "Subtotal", "ITBIS", "Total", "Método", "Fecha", "Acciones"].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                  {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={styles.empty}>
                      No hay ventas en este período.
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => (
                    <tr key={s.sale_id ?? s.id} style={styles.tr}>
                      <td style={{ ...styles.td, fontFamily: "monospace", fontSize: 12 }}>
                        {s.ncf || `#${s.sale_id ?? s.id}`}
                      </td>
                      <td style={styles.td}>{s.user_name}</td>
                      <td style={styles.td}>{s.client_name || "—"}</td>
                      <td style={styles.td}>
                        ${Number(s.subtotal || s.total).toLocaleString("es-DO")}
                      </td>
                      <td style={{ ...styles.td, color: "#dc2626" }}>
                        ${Number(s.itbis_total || 0).toLocaleString("es-DO")}
                      </td>
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
                      <td style={styles.td}>
                        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                          {s.canceled ? (
                            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                              <span style={{
                                padding: "3px 8px", background: "#fef2f2", color: "#dc2626",
                                borderRadius: 6, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap",
                              }}>
                                Anulada
                              </span>
                              <button
                                onClick={() => downloadCreditNote(s)}
                                style={styles.creditBtn}
                                title="Descargar nota de crédito"
                              >
                                📄
                              </button>
                              {user.role === "admin" && (
                                <button
                                  onClick={() => setDeleteTarget(s)}
                                  style={styles.dangerBtn}
                                  title="Eliminar permanentemente"
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => openEdit(s)}
                                style={styles.actionBtn}
                                title="Editar venta"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => setCancelTarget(s)}
                                style={styles.dangerBtn}
                                title="Anular venta"
                              >
                                🚫
                              </button>
                              <button
                                onClick={() => handleInvoice(s.sale_id ?? s.id)}
                                style={styles.actionBtn}
                                title="Ver factura"
                              >
                                🧾
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <Pagination page={page} totalPages={totalPages} total={total} limit={PAGE_LIMIT} onChange={loadData} />
          </div>
        )}
      </div>

      {showModal && (
        <div style={styles.overlay} onClick={closeModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Nueva venta</h2>
            <form onSubmit={handleSubmit} style={styles.form}>

              {/* Cliente */}
              <div style={styles.field}>
                <label style={styles.label}>Cliente (opcional)</label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  style={styles.select}
                >
                  <option value="">Sin cliente / Venta general</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `— ${c.phone}` : ""}
                    </option>
                  ))}
                </select>
              </div>

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
                  {(() => {
                    const product = products.find((p) => p.id === Number(item.product_id));
                    const overstock = product && Number(item.quantity) > product.stock;
                    return overstock ? (
                      <span style={{ fontSize: 11, color: "#dc2626", whiteSpace: "nowrap" }}>
                        Stock: {product.stock}
                      </span>
                    ) : null;
                  })()}
                  <button type="button" onClick={() => removeItem(index)} style={styles.removeBtn}>
                    ✕
                  </button>
                </div>
              ))}

              <button type="button" onClick={addItem} style={styles.addItemBtn}>
                + Agregar producto
              </button>

              {/* Total con ITBIS */}
              <div style={styles.totalBox}>
                <div>
                  <div style={styles.totalRow}>
                    <span style={styles.totalLabel}>Subtotal</span>
                    <span style={styles.totalSubValue}>
                      ${getSubtotal().toLocaleString("es-DO")}
                    </span>
                  </div>
                  <div style={styles.totalRow}>
                    <span style={styles.totalLabel}>ITBIS (18%)</span>
                    <span style={styles.totalSubValue}>
                      ${getItbisTotal().toLocaleString("es-DO")}
                    </span>
                  </div>
                  <div style={{ ...styles.totalRow, marginTop: 6, paddingTop: 6, borderTop: "1px solid #e2e8f0" }}>
                    <span style={{ ...styles.totalLabel, fontWeight: 700, color: "#0f172a" }}>Total</span>
                    <span style={styles.totalValue}>
                      ${getTotal().toLocaleString("es-DO")}
                    </span>
                  </div>
                </div>
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

      {/* Modal preview factura */}
      {invoicePreview && (
        <div style={styles.overlay} onClick={closeInvoicePreview}>
          <div style={styles.invoiceModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.invoiceHeader}>
              <h2 style={styles.invoiceTitle}>Previsualización de Factura</h2>
              <button onClick={closeInvoicePreview} style={styles.invoiceCloseBtn}>✕</button>
            </div>

            <div style={styles.invoicePaper}>
              {/* Empresa */}
              <div style={styles.invCompany}>
                <div>
                  <h3 style={styles.invCompanyName}>
                    {invoicePreview.company?.company_name || "StockFlow RD"}
                  </h3>
                  {invoicePreview.company?.rnc && (
                    <p style={styles.invSmall}>RNC: {invoicePreview.company.rnc}</p>
                  )}
                  {invoicePreview.company?.phone && (
                    <p style={styles.invSmall}>Tel: {invoicePreview.company.phone}</p>
                  )}
                  {invoicePreview.company?.address && (
                    <p style={styles.invSmall}>{invoicePreview.company.address}</p>
                  )}
                </div>
                <div style={styles.invFiscalBox}>
                  <h3 style={styles.invFiscalTitle}>FACTURA</h3>
                  <p style={styles.invNcf}>{invoicePreview.ncf}</p>
                  <p style={styles.invSmall}>
                    {new Date(invoicePreview.created_at).toLocaleDateString("es-DO", {
                      day: "2-digit", month: "long", year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* Cliente */}
              <div style={styles.invDivider} />
              <div style={styles.invClient}>
                <p style={styles.invClientLabel}>Cliente:</p>
                <p style={styles.invClientName}>
                  {invoicePreview.client_name || "Consumidor Final"}
                </p>
              </div>

              {/* Tabla productos */}
              <div style={styles.invDivider} />
              <table style={styles.invTable}>
                <thead>
                  <tr>
                    <th style={styles.invTh}>Producto</th>
                    <th style={styles.invThRight}>Cant.</th>
                    <th style={styles.invThRight}>Precio</th>
                    <th style={styles.invThRight}>ITBIS</th>
                    <th style={styles.invThRight}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoicePreview.items || []).map((item, i) => {
                    const qty = Number(item.quantity) || 1;
                    const price = Number(item.price) || 0;
                    const itbisRate = Number(item.itbis_rate || 18);
                    const itemSubtotal = price * qty;
                    const itemItbis = itemSubtotal * (itbisRate / 100);
                    return (
                      <tr key={i}>
                        <td style={styles.invTd}>{item.product_name}</td>
                        <td style={styles.invTdRight}>{qty}</td>
                        <td style={styles.invTdRight}>${price.toLocaleString("es-DO")}</td>
                        <td style={{ ...styles.invTdRight, color: "#dc2626" }}>
                          ${itemItbis.toLocaleString("es-DO")}
                        </td>
                        <td style={{ ...styles.invTdRight, fontWeight: 600 }}>
                          ${(itemSubtotal + itemItbis).toLocaleString("es-DO")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Totales */}
              <div style={styles.invTotals}>
                <div style={styles.invTotalRow}>
                  <span>Subtotal</span>
                  <span>${Number(invoicePreview.subtotal || 0).toLocaleString("es-DO")}</span>
                </div>
                <div style={{ ...styles.invTotalRow, color: "#dc2626" }}>
                  <span>ITBIS</span>
                  <span>${Number(invoicePreview.itbis_total || 0).toLocaleString("es-DO")}</span>
                </div>
                <div style={styles.invDivider} />
                <div style={{ ...styles.invTotalRow, fontWeight: 700, fontSize: 16, color: "#059669" }}>
                  <span>Total</span>
                  <span>${Number(invoicePreview.total || 0).toLocaleString("es-DO")}</span>
                </div>
              </div>

              {/* Método de pago */}
              <p style={styles.invMethod}>
                Método de pago: {methodLabels[invoicePreview.payment_method] || invoicePreview.payment_method}
              </p>
              <p style={styles.invNcfType}>
                NCF Tipo: {invoicePreview.ncf_type || "B02"} —{" "}
                {invoicePreview.ncf_type === "B01"
                  ? "Factura de Crédito Fiscal"
                  : "Factura de Consumo"}
              </p>
            </div>

            <div style={styles.invoiceActions}>
              <button onClick={closeInvoicePreview} style={styles.cancelBtn}>
                Cerrar
              </button>
              <button onClick={downloadInvoice} style={styles.saveBtn}>
                ⬇ Descargar PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar anulación */}
      {cancelTarget && (
        <div style={styles.overlay} onClick={() => setCancelTarget(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Anular venta</h2>
            <p style={{ fontSize: 15, color: "#334155", marginBottom: 16, lineHeight: 1.6 }}>
              ¿Estás seguro de anular la venta <strong>#{cancelTarget.sale_id ?? cancelTarget.id}</strong>?
            </p>
            <div style={{
              background: "#fffbeb", border: "1px solid #fde68a",
              borderRadius: 10, padding: "14px 16px", fontSize: 14, color: "#92400e",
              lineHeight: 1.6, marginBottom: 20,
            }}>
              ⚠️ El stock de todos los productos será restaurado automáticamente.
              Esta acción no se puede deshacer.
            </div>
            <div style={styles.modalBtns}>
              <button onClick={() => setCancelTarget(null)} style={styles.cancelBtn}>
                Cancelar
              </button>
              <button onClick={handleCancel} style={{
                padding: "10px 20px", background: "#dc2626", color: "#fff",
                border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}>
                Sí, anular venta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminación de venta anulada */}
      {deleteTarget && (
        <div style={styles.overlay} onClick={() => setDeleteTarget(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Eliminar venta anulada</h2>
            <p style={{ fontSize: 15, color: "#334155", marginBottom: 16, lineHeight: 1.6 }}>
              ¿Estás seguro de eliminar permanentemente la venta <strong>#{deleteTarget.sale_id ?? deleteTarget.id}</strong>?
            </p>
            <div style={{
              background: "#fef2f2", border: "1px solid #fca5a5",
              borderRadius: 10, padding: "14px 16px", fontSize: 14, color: "#991b1b",
              lineHeight: 1.6, marginBottom: 20,
            }}>
              🗑️ Esta venta ya estaba anulada y el stock fue restaurado.
              Se eliminará definitivamente de la base de datos.
              Esta acción no se puede deshacer.
            </div>
            <div style={styles.modalBtns}>
              <button onClick={() => setDeleteTarget(null)} style={styles.cancelBtn}>
                Cancelar
              </button>
              <button onClick={handleDelete} style={{
                padding: "10px 20px", background: "#dc2626", color: "#fff",
                border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}>
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal editar venta */}
      {editTarget && (
        <div style={styles.overlay} onClick={() => setEditTarget(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Editar venta #{editTarget.sale_id ?? editTarget.id}</h2>
            <form onSubmit={handleEdit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={styles.field}>
                <label style={styles.label}>Cliente</label>
                <select
                  value={editForm.client_id}
                  onChange={(e) => setEditForm({ ...editForm, client_id: e.target.value })}
                  style={styles.select}
                >
                  <option value="">Sin cliente</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Método de pago</label>
                <div style={styles.paymentBtns}>
                  {paymentMethods.map((pm) => (
                    <button
                      key={pm.value}
                      type="button"
                      onClick={() => setEditForm({ ...editForm, payment_method: pm.value })}
                      style={{
                        ...styles.paymentBtn,
                        background: editForm.payment_method === pm.value ? "#4f46e5" : "#f8fafc",
                        color: editForm.payment_method === pm.value ? "#fff" : "#64748b",
                        border: editForm.payment_method === pm.value ? "1.5px solid #4f46e5" : "1.5px solid #e2e8f0",
                      }}
                    >
                      {pm.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={styles.modalBtns}>
                <button type="button" onClick={() => setEditTarget(null)} style={styles.cancelBtn}>
                  Cancelar
                </button>
                <button type="submit" style={styles.saveBtn}>
                  Guardar cambios
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
  invoiceBtn: {
    background: "#eef2ff", border: "none", borderRadius: 8,
    padding: "6px 10px", cursor: "pointer", fontSize: 16,
    transition: "all 0.2s",
  },
  actionBtn: {
    background: "#eef2ff", border: "none", borderRadius: 8,
    padding: "6px 8px", cursor: "pointer", fontSize: 14,
  },
  dangerBtn: {
    background: "#fef2f2", border: "none", borderRadius: 8,
    padding: "6px 8px", cursor: "pointer", fontSize: 14,
  },
  creditBtn: {
    background: "#fff7ed", border: "none", borderRadius: 8,
    padding: "6px 8px", cursor: "pointer", fontSize: 14,
  },
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
  field: { display: "flex", flexDirection: "column", gap: 8 },
  label: { fontSize: 13, fontWeight: 600, color: "#374151" },
  select: {
    flex: 1, padding: "10px 12px", border: "1.5px solid #e2e8f0",
    borderRadius: 10, fontSize: 14, outline: "none", color: "#0f172a", background: "#fff",
  },
  itemRow: { display: "flex", gap: 10, alignItems: "center" },
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
    background: "#f8fafc", borderRadius: 10, padding: "14px 16px",
    border: "1px solid #e2e8f0",
  },
  totalRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
  },
  totalLabel: { fontSize: 14, color: "#64748b", fontWeight: 500 },
  totalSubValue: { fontSize: 16, fontWeight: 600, color: "#334155" },
  totalValue: { fontSize: 22, fontWeight: 700, color: "#059669" },
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
  invoiceModal: {
    background: "#fff", borderRadius: 20, padding: "24px",
    width: "100%", maxWidth: 680, boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
    maxHeight: "90vh", display: "flex", flexDirection: "column",
  },
  invoiceHeader: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", marginBottom: 16,
  },
  invoiceTitle: { fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 },
  invoiceCloseBtn: {
    background: "none", border: "none", fontSize: 20,
    color: "#94a3b8", cursor: "pointer", padding: "4px",
  },
  invoicePaper: {
    background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12,
    padding: "28px", flex: 1, overflowY: "auto", marginBottom: 16,
  },
  invCompany: {
    display: "flex", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: 20,
  },
  invCompanyName: { fontSize: 18, fontWeight: 700, color: "#4f46e5", margin: "0 0 6px" },
  invSmall: { fontSize: 12, color: "#64748b", margin: "2px 0" },
  invFiscalBox: { textAlign: "right" },
  invFiscalTitle: { fontSize: 20, fontWeight: 700, color: "#0f172a", margin: "0 0 4px" },
  invNcf: {
    fontSize: 14, fontWeight: 600, color: "#4f46e5",
    fontFamily: "monospace", margin: "0 0 4px",
  },
  invDivider: { height: 1, background: "#e2e8f0", margin: "12px 0" },
  invClient: { marginBottom: 8 },
  invClientLabel: { fontSize: 12, color: "#64748b", margin: "0 0 2px" },
  invClientName: { fontSize: 14, fontWeight: 600, color: "#0f172a", margin: 0 },
  invTable: { width: "100%", borderCollapse: "collapse", marginTop: 8 },
  invTh: {
    textAlign: "left", fontSize: 11, fontWeight: 600, color: "#64748b",
    textTransform: "uppercase", padding: "8px 6px",
    borderBottom: "2px solid #e2e8f0",
  },
  invThRight: {
    textAlign: "right", fontSize: 11, fontWeight: 600, color: "#64748b",
    textTransform: "uppercase", padding: "8px 6px",
    borderBottom: "2px solid #e2e8f0",
  },
  invTd: { padding: "10px 6px", fontSize: 13, color: "#0f172a", borderBottom: "1px solid #f1f5f9" },
  invTdRight: {
    padding: "10px 6px", fontSize: 13, color: "#334155",
    borderBottom: "1px solid #f1f5f9", textAlign: "right",
  },
  invTotals: {
    marginTop: 16, marginLeft: "auto", width: 240,
    display: "flex", flexDirection: "column", gap: 6,
  },
  invTotalRow: {
    display: "flex", justifyContent: "space-between",
    fontSize: 14, color: "#334155",
  },
  invMethod: { fontSize: 12, color: "#94a3b8", marginTop: 16, marginBottom: 2 },
  invNcfType: { fontSize: 11, color: "#cbd5e1", margin: 0 },
  invoiceActions: { display: "flex", gap: 12, justifyContent: "flex-end" },
};