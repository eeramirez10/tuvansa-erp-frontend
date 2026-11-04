import type { SalesByFamily, SalesMeasure } from "@/features/sales/reports/model"
import { downloadFile } from "@/shared/utils/download-file"
export async function downloadSalesByFamily(report: SalesByFamily, measure: SalesMeasure) {
  const { createSalesByFamilyWorkbook } = await import("@/features/sales/reports/services/sales-by-family-workbook")
  const buffer = await createSalesByFamilyWorkbook(report, measure).xlsx.writeBuffer()
  downloadFile(new Blob([new Uint8Array(buffer).buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `ventas-brutas-familia-${report.criteria.branch}-${report.criteria.from}-${report.criteria.to}-${measure}.xlsx`)
}
