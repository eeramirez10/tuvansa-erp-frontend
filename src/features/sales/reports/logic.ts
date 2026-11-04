import { queryOptions } from "@tanstack/react-query"
import type { SalesByFamily, SalesCriteria, SalesMeasure } from "@/features/sales/reports/model"
import { getSalesByFamily, getSalesReportOptions } from "@/features/sales/reports/services/sales-reports-service"
export const salesReportOptionsQuery = () => queryOptions({ queryKey: ["sales", "reports", "by-family", "options"], queryFn: ({ signal }) => getSalesReportOptions(signal), staleTime: 0 })
export const salesByFamilyQuery = (criteria: SalesCriteria) => queryOptions({ queryKey: ["sales", "reports", "by-family", criteria], queryFn: ({ signal }) => getSalesByFamily(criteria, signal), staleTime: 0, retry: false })
export const salesMoney = (amount: number) => "$" + amount.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const salesQuantity = (amount: number) => amount.toLocaleString("es-MX", { minimumFractionDigits: 3, maximumFractionDigits: 3 })
export const salesDate = (date: string) => date.split("-").reverse().join("/")
export const salesPercentage = (value: number | null) => value === null ? "—" : value.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%"
export function salesMatrix(report: SalesByFamily, measure: SalesMeasure) {
  return { rows: report.groups.map(group => ({ code: group.code, name: group.name, amount: measure === "amount" ? group.amount : group.meters,
    percentage: measure === "amount" ? group.percentage : group.meterPercentage,
    cells: group.cells.map(cell => ({ branch: cell.branch, amount: measure === "amount" ? cell.amount : cell.meters, percentage: measure === "amount" ? cell.percentage : cell.meterPercentage })) })),
    totals: report.totals.map(cell => ({ branch: cell.branch, amount: measure === "amount" ? cell.amount : cell.meters, percentage: measure === "amount" ? cell.percentage : cell.meterPercentage })),
    total: measure === "amount" ? report.amount : report.meters }
}
