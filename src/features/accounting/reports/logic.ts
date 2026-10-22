import { queryOptions } from "@tanstack/react-query"
import type { IncomeStatementCriteria, MexicoIncomeStatementCriteria } from "@/features/accounting/reports/model"
import { getIncomeStatement, getIncomeStatementOptions, getMexicoIncomeStatement, getMexicoIncomeStatementOptions } from "@/features/accounting/reports/services/income-statement-service"

export const incomeStatementOptionsQuery = () => queryOptions({
  queryKey:["accounting","reports","income-statement","options"], queryFn:({signal})=>getIncomeStatementOptions(signal),staleTime:0,
})
export const incomeStatementQuery = (criteria: IncomeStatementCriteria) => queryOptions({
  queryKey:["accounting","reports","income-statement",criteria],queryFn:({signal})=>getIncomeStatement(criteria,signal),staleTime:0,retry:false,
})

export const mexicoIncomeStatementOptionsQuery = () => queryOptions({
  queryKey:["accounting","reports","income-statement","mexico","options"], queryFn:({signal})=>getMexicoIncomeStatementOptions(signal),staleTime:0,
})
export const mexicoIncomeStatementQuery = (criteria: MexicoIncomeStatementCriteria) => queryOptions({
  queryKey:["accounting","reports","income-statement","mexico",criteria], queryFn:({signal})=>getMexicoIncomeStatement(criteria,signal),staleTime:0,retry:false,
})
