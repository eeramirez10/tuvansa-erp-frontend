import { paths } from "@/app/router/paths"
import type { ErpModuleId } from "@/features/workspace/module-routes"

type ReportGroup = { label: string; reports: ReadonlyArray<{ label: string; path: string | null }> }
const salesReports: readonly ReportGroup[] = [{ label: "Comisiones", reports: [{ label: "Reporte Comisiones x Cobranza", path: paths.collectionCommissions }] }]
export const reportMenuLabels: Partial<Record<ErpModuleId, string>> = {
  sales: "Reportes de Ventas", "sales-orders": "Reportes de Ventas", "sales-invoicing": "Reportes de Ventas",
}

// Register each report only in its owning module. Missing modules have no report menu.
export const reportGroupsByModule: Partial<Record<ErpModuleId, readonly ReportGroup[]>> = {
  accounting: [
    { label: "Reportes Financieros", reports: [
      { label: "Estado de resultados", path: paths.incomeStatement },
      { label: "Ventas por familia", path: paths.salesByFamily },
      { label: "Inventario por familia", path: paths.inventoryByFamily },
    ] },
  ],
  sales: salesReports,
  "sales-orders": salesReports,
  "sales-invoicing": salesReports,
}
