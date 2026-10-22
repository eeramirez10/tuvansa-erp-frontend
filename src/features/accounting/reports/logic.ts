import { queryOptions } from "@tanstack/react-query"
import type { IncomeStatementCriteria } from "@/features/accounting/reports/model"
import { getIncomeStatement, getIncomeStatementOptions } from "@/features/accounting/reports/services/income-statement-service"

export const incomeStatementOptionsQuery = () => queryOptions({
  queryKey:["accounting","reports","income-statement","options"], queryFn:({signal})=>getIncomeStatementOptions(signal),staleTime:0,
})
export const incomeStatementQuery = (criteria: IncomeStatementCriteria) => queryOptions({
  queryKey:["accounting","reports","income-statement",criteria],queryFn:({signal})=>getIncomeStatement(criteria,signal),staleTime:0,retry:false,
})
