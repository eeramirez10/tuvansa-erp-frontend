import type { BranchIncomeStatements } from "@/features/accounting/reports/model"
import { downloadFile } from "@/shared/utils/download-file"

export async function downloadIncomeStatementExcel(data:BranchIncomeStatements) {
  const {createIncomeStatementWorkbook}=await import("@/features/accounting/reports/services/income-statement-workbook")
  const workbook=await createIncomeStatementWorkbook(data)
  const buffer=await workbook.xlsx.writeBuffer()
  const blob=new Blob([new Uint8Array(buffer).buffer],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"})
  downloadFile(blob,"estado-resultados-sucursales-"+data.year+"-"+String(data.month).padStart(2,"0")+".xlsx")
}
