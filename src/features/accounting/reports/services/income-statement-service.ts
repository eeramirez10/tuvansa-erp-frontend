import { apiClient } from "@/shared/api/api-client"
import type { IncomeStatement, IncomeStatementCriteria, IncomeStatementOptions } from "@/features/accounting/reports/model"

export async function getIncomeStatementOptions(signal?: AbortSignal) {
  return (await apiClient.get<{data:IncomeStatementOptions}>("/accounting/reports/income-statement/options",{signal})).data.data
}
export async function getIncomeStatement(criteria: IncomeStatementCriteria, signal?: AbortSignal) {
  return (await apiClient.get<{data:IncomeStatement}>("/accounting/reports/income-statement",{params:criteria,signal})).data.data
}
