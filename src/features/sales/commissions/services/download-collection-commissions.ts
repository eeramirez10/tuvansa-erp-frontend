import type { CollectionCommissions } from "@/features/sales/commissions/model"
import { downloadFile } from "@/shared/utils/download-file"
export async function downloadCollectionCommissions(report: CollectionCommissions) {
  const { createCollectionCommissionsWorkbook } = await import("@/features/sales/commissions/services/collection-commissions-workbook")
  const buffer = await createCollectionCommissionsWorkbook(report).xlsx.writeBuffer()
  downloadFile(new Blob([new Uint8Array(buffer).buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `comisiones-cobranza-${report.criteria.branch}-${report.criteria.from}-${report.criteria.to}${report.criteria.agent === "all" ? "" : `-agente-${report.criteria.agent}`}${report.criteria.customerId === undefined ? "" : `-cliente-${report.criteria.customerId}`}.xlsx`)
}
