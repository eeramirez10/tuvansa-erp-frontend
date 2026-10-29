import type { InventoryByFamily } from "@/features/inventories/reports/model"
import { downloadFile } from "@/shared/utils/download-file"
export async function downloadInventoryByFamily(report: InventoryByFamily) {
  const { createInventoryByFamilyWorkbook } = await import("@/features/inventories/reports/services/inventory-by-family-workbook")
  const buffer = await createInventoryByFamilyWorkbook(report).xlsx.writeBuffer()
  downloadFile(new Blob([new Uint8Array(buffer).buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `inventario-familia-${report.criteria.warehouse}-${report.criteria.asOf}.xlsx`)
}
