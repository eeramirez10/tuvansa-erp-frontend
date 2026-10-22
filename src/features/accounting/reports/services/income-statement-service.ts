import { apiClient } from "@/shared/api/api-client"
import type { IncomeStatement, IncomeStatementCriteria, IncomeStatementOptions, MexicoIncomeStatementCriteria, MexicoIncomeStatementOptions, BranchIncomeStatements, BranchIncomeStatementsOptions } from "@/features/accounting/reports/model"

export async function getIncomeStatementOptions(signal?: AbortSignal) {
  return (await apiClient.get<{data:IncomeStatementOptions}>("/accounting/reports/income-statement/options",{signal})).data.data
}
export async function getIncomeStatement(criteria: IncomeStatementCriteria, signal?: AbortSignal) {
  return (await apiClient.get<{data:IncomeStatement}>("/accounting/reports/income-statement",{params:criteria,signal})).data.data
}

export async function getMexicoIncomeStatementOptions(signal?: AbortSignal) {
  return (await apiClient.get<{data:MexicoIncomeStatementOptions}>("/accounting/reports/income-statement/mexico/options",{signal})).data.data
}
export async function getMexicoIncomeStatement(criteria: MexicoIncomeStatementCriteria, signal?: AbortSignal) {
  return (await apiClient.get<{data:IncomeStatement}>("/accounting/reports/income-statement/mexico",{params:criteria,signal})).data.data
}

export async function getBranchIncomeStatementOptions(signal?:AbortSignal) {
  return (await apiClient.get<{data:BranchIncomeStatementsOptions}>("/accounting/reports/income-statement/branches/options",{signal})).data.data
}
export async function getBranchIncomeStatements(criteria:MexicoIncomeStatementCriteria,signal?:AbortSignal) {
  return (await apiClient.get<{data:BranchIncomeStatements}>("/accounting/reports/income-statement/branches",{params:criteria,signal})).data.data
}
