import type { ClientPanelDefinition } from "@/features/accounts-receivable/clients/model"

const text = (key: string, label: string, width = "7rem") => ({ key, label, width } as const)
const date = (key: string, label: string, width = "6rem") => ({ key, label, width, format: "date" as const })
const number = (key: string, label: string, width = "5rem") => ({ key, label, width, format: "number" as const, align: "right" as const })
const money = (key: string, label: string, width = "7rem") => ({ key, label, width, format: "money" as const, align: "right" as const })
const bool = (key: string, label: string, width = "4rem") => ({ key, label, width, format: "boolean" as const, align: "center" as const })

export const clientActionPanels: readonly ClientPanelDefinition[] = [
  {
    key: "classifications", label: "Clasificar", title: "Clasificación del cliente", section: "actions",
    path: "actions/classifications", dataKey: "classifications",
    columns: [number("position", "No.", "3rem"), text("label", "Clasificación", "8rem"), text("code", "Código", "5rem"), text("description", "Descripción", "16rem")],
  },
  {
    key: "destinations", label: "Enviar a", title: "Enviar cliente a", section: "actions",
    path: "actions/destinations", dataKey: "destinations", columns: [],
  },
  {
    key: "block-status", label: "Bloquear", title: "Bloqueo del cliente", section: "actions",
    path: "actions/block-status", dataKey: "blockStatus", columns: [],
  },
  {
    key: "discounts", label: "Descuentos", title: "Descuentos especiales", section: "actions",
    path: "actions/discounts", dataKey: "discounts",
    columns: [text("key", "Llave", "8rem"), number("discount1", "Desc. 1"), number("discount2", "Desc. 2"), number("discount3", "Desc. 3"), date("startsAt", "Inicio"), date("endsAt", "Fin"), number("quantityFrom", "Cant. desde"), number("quantityTo", "Cant. hasta"), text("department", "Depto.")],
  },
  {
    key: "events", label: "Eventos *", title: "Eventos del cliente", section: "actions",
    path: "actions/events", dataKey: "events",
    columns: [date("date", "Fecha"), text("title", "Título", "8rem"), text("description", "Descripción", "22rem"), date("followUpAt", "Seguimiento"), date("dueAt", "Vencimiento"), text("responsible", "Responsable", "8rem"), bool("done", "Hecho"), text("project", "Proyecto", "8rem")],
  },
  {
    key: "branches", label: "Sucursales", title: "Sucursales del cliente", section: "actions",
    path: "actions/branches", dataKey: "branches",
    columns: [text("code", "Sucursal", "6rem"), text("name", "Nombre", "18rem")],
  },
  {
    key: "contacts", label: "Contactos", title: "Contactos del cliente", section: "actions",
    path: "actions/contacts", dataKey: "contacts",
    columns: [text("name", "Nombre", "13rem"), text("position", "Puesto", "10rem"), text("phones", "Teléfonos", "10rem"), text("extension", "Ext.", "4rem"), text("mobile", "Celular", "8rem"), text("email", "Correo", "15rem"), date("birthday", "Cumpleaños"), bool("receivesInvoices", "Facturas"), bool("receivesAccountStatement", "Estado cta.")],
  },
]

export const clientQueryPanels: readonly ClientPanelDefinition[] = [
  {
    key: "balance", label: "Saldo", title: "Saldo del cliente", section: "queries", path: "balance", dataKey: "documents",
    columns: [text("number", "Documento"), date("date", "Fecha"), date("dueDate", "Vence"), number("daysOverdue", "Días"), money("amountInBaseCurrency", "Importe M.N."), money("amount", "Importe"), text("currency.name", "Moneda"), number("exchangeRate", "T.C."), text("reference", "Referencia"), text("customerOrder", "Pedido cliente"), text("deliveryReceipt", "Talón")],
  },
  {
    key: "movements", label: "Movimientos", title: "Movimientos del cliente", section: "queries", path: "movements", dataKey: "movements",
    columns: [date("date", "Fecha"), text("movementType.code", "Tipo", "4rem"), text("movementType.description", "Movimiento", "9rem"), text("document.number", "Documento"), money("charge", "Cargo"), money("credit", "Abono"), money("runningBalance", "Saldo"), text("paymentReference", "Referencia", "9rem"), number("exchangeRate", "T.C."), text("policy", "Póliza")],
  },
  {
    key: "invoices", label: "Facturas", title: "Facturas del cliente", section: "queries", path: "invoices", dataKey: "items",
    columns: [text("number", "Factura"), date("date", "Fecha"), date("dueDate", "Vence"), money("amount", "Importe"), text("reference", "Referencia"), date("paymentDate", "Pago"), text("customerOrder", "Pedido cliente", "9rem"), text("deliveryReceipt", "Talón"), number("exchangeRate", "T.C."), number("currencyId", "Mon.", "4rem"), text("department", "Depto.")],
  },
  {
    key: "orders", label: "Pedidos", title: "Pedidos del cliente", section: "queries", path: "orders", dataKey: "items",
    columns: [text("number", "Pedido"), date("date", "Fecha"), date("dueDate", "Entrega"), text("customerOrder", "Pedido cliente", "10rem"), money("gross", "Bruto"), money("discount", "Descuento"), money("total", "Total"), number("fulfilled", "Surtido"), text("parameter9", "Estado")],
  },
  {
    key: "ordered-products", label: "Productos pedidos", title: "Productos pedidos por el cliente", section: "queries", path: "products/ordered", dataKey: "items",
    columns: [text("productCode", "Producto"), text("description", "Descripción", "20rem"), number("orderedQuantity", "Pedido"), number("fulfilledQuantity", "Surtido"), number("stock", "Existencia"), number("inventoryAssigned", "Asignado"), text("orderNumber", "Pedido"), text("customerOrder", "Pedido cliente", "10rem"), number("branch", "Suc.", "4rem")],
  },
  {
    key: "quoted-products", label: "Productos cotizados", title: "Productos cotizados al cliente", section: "queries", path: "products/quoted", dataKey: "items",
    columns: [text("productCode", "Producto"), text("description", "Descripción", "20rem"), number("quotedQuantity", "Cotizado"), number("fulfilledQuantity", "Surtido"), number("stock", "Existencia"), number("inventoryAssigned", "Asignado"), text("quoteNumber", "Cotización"), date("quoteDate", "Fecha"), money("unitPrice", "Precio")],
  },
  {
    key: "sold-products", label: "Productos vendidos", title: "Productos vendidos al cliente", section: "queries", path: "products/sold", dataKey: "items",
    columns: [text("productCode", "Producto"), text("description", "Descripción", "22rem"), number("quantity", "Cantidad"), money("unitPrice", "Precio")],
  },
  {
    key: "sold-products-detail", label: "Ventas desglosadas", title: "Ventas desglosadas por producto", section: "queries", path: "products/sold-detail", dataKey: "items",
    columns: [date("date", "Fecha"), text("documentNumber", "Documento"), text("productCode", "Producto"), text("description", "Descripción", "18rem"), number("quantity", "Cantidad"), money("unitPrice", "Precio"), number("discount", "Desc."), money("cost", "Costo"), text("customerOrder", "Pedido cliente"), text("deliveryReceipt", "Talón"), number("branch", "Suc.")],
  },
  {
    key: "annual-sales", label: "Ventas anuales", title: "Ventas anuales", section: "queries", path: "sales/annual", dataKey: "items",
    columns: [date("date", "Fecha"), text("productCode", "Producto"), text("description", "Descripción", "22rem"), number("quantity", "Cantidad"), money("unitPrice", "Precio"), number("vatPercentage", "IVA %")],
  },
  {
    key: "annual-sales-summary", label: "Ventas anuales resumen", title: "Resumen de ventas anuales", section: "queries", path: "sales/annual-summary", dataKey: "items",
    columns: [date("date", "Fecha"), money("gross", "Venta bruta"), money("discount", "Descuento")],
  },
  {
    key: "sales-by-branch", label: "Ventas por sucursal", title: "Ventas por sucursal", section: "queries", path: "sales/by-branch", dataKey: "items",
    columns: [number("branch", "Sucursal"), text("productCode", "Producto"), text("description", "Descripción", "22rem"), number("quantity", "Cantidad"), money("unitPrice", "Precio")],
  },
  {
    key: "edi-sales", label: "Ventas E.D.I.", title: "Ventas E.D.I.", section: "queries", path: "sales/edi", dataKey: "items",
    columns: [text("productCode", "Producto"), text("description", "Descripción", "20rem"), date("deliveryDate", "Entrega"), number("requestedQuantity", "Solicitado"), number("suppliedQuantity", "Surtido"), number("branch", "Sucursal"), text("type", "Tipo")],
  },
  {
    key: "work-in-progress", label: "W.I.P.", title: "Trabajo en proceso", section: "queries", path: "work-in-progress", dataKey: "items",
    columns: [text("operationNumber", "Operación"), text("article", "Artículo"), number("quantity", "Cantidad"), number("fulfilledQuantity", "Surtido"), text("productCode", "Producto"), date("startDate", "Inicio"), date("endDate", "Fin"), text("machine", "Máquina"), text("orderNumber", "Pedido")],
  },
  {
    key: "ct-ordered-products", label: "Productos pedidos", title: "CT · Productos pedidos", section: "queries", path: "ct/products/ordered", dataKey: "items",
    columns: [text("productCode", "Producto"), text("description", "Descripción", "20rem"), number("orderedQuantity", "Pedido"), number("fulfilledQuantity", "Surtido"), text("orderNumber", "Pedido"), text("customerOrder", "Pedido cliente"), date("dueDate", "Entrega")],
  },
  {
    key: "ct-sold-products", label: "Productos vendidos", title: "CT · Productos vendidos", section: "queries", path: "ct/products/sold", dataKey: "items",
    columns: [text("productCode", "Producto"), text("description", "Descripción", "22rem"), number("quantity", "Cantidad"), money("unitPrice", "Precio")],
  },
  {
    key: "ct-work-in-progress", label: "W.I.P.", title: "CT · Trabajo en proceso", section: "queries", path: "ct/work-in-progress", dataKey: "items",
    columns: [text("operationNumber", "Operación"), text("article", "Artículo"), number("quantity", "Cantidad"), number("fulfilledQuantity", "Surtido"), text("productCode", "Producto"), date("startDate", "Inicio"), date("endDate", "Fin"), text("machine", "Máquina"), text("orderNumber", "Pedido")],
  },
]
