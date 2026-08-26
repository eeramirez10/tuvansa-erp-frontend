export type ModuleStatus = "api-ready" | "planned"

export type ErpModule = {
  id: "accounts-receivable" | "finished-goods-inventory"
  name: string
  description: string
  legacyShortcut: string
  status: ModuleStatus
}

export const erpModules: readonly ErpModule[] = [
  {
    id: "accounts-receivable",
    name: "Cuentas por cobrar",
    description: "Catálogo de clientes, acciones y consultas del cliente.",
    legacyShortcut: "Catálogo de clientes",
    status: "api-ready",
  },
  {
    id: "finished-goods-inventory",
    name: "Inventarios PT",
    description: "Catálogo de productos, compras, producción y consultas.",
    legacyShortcut: "F2",
    status: "api-ready",
  },
]
