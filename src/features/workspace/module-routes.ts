import { paths } from "@/app/router/paths"

export type ErpModuleId = "accounting" | "inventories" | "accounts-receivable" | "accounts-payable"
  | "purchase-orders" | "purchase-receptions" | "sales-orders" | "sales-invoicing" | "banking"

export const erpModuleNames: Record<ErpModuleId, string> = {
  accounting: "Contabilidad",
  inventories: "Inventarios",
  "accounts-receivable": "Cuentas por cobrar",
  "accounts-payable": "Cuentas por pagar",
  "purchase-orders": "Órdenes de compra",
  "purchase-receptions": "Recepciones",
  "sales-orders": "Pedidos",
  "sales-invoicing": "Facturación",
  banking: "Bancos",
}

const moduleRoutes: ReadonlyArray<{ id: ErpModuleId; prefix: string }> = [
  { id: "accounting", prefix: "/contabilidad" },
  { id: "inventories", prefix: "/inventarios" },
  { id: "accounts-receivable", prefix: "/cuentas-por-cobrar" },
  { id: "accounts-payable", prefix: "/cuentas-por-pagar" },
  { id: "purchase-orders", prefix: paths.purchaseOrders },
  { id: "purchase-receptions", prefix: paths.purchaseReceptions },
  { id: "sales-orders", prefix: paths.salesOrders },
  { id: "sales-invoicing", prefix: paths.salesInvoices },
  { id: "banking", prefix: paths.bankAccounts },
]

export function getErpModuleForPath(pathname: string): ErpModuleId | null {
  return moduleRoutes.find(({ prefix }) => pathname === prefix || pathname.startsWith(prefix + "/"))?.id ?? null
}
