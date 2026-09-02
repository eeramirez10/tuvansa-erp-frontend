import { queryOptions } from "@tanstack/react-query"
import {
  getAccountingPolicy,
  getAccountingPolicyClassifications,
  searchAccountingPolicies,
  type AccountingPolicySearchCriteria,
} from "@/features/accounting/policies/services/accounting-policy-service"

export const accountingPolicyKeys = {
  all: ["accounting", "policies"] as const,
  detail: (id: number) => [...accountingPolicyKeys.all, "detail", id] as const,
  search: (criteria: AccountingPolicySearchCriteria) => [...accountingPolicyKeys.all, "search", criteria] as const,
  classifications: (id: number) => [...accountingPolicyKeys.detail(id), "classifications"] as const,
}

export const accountingPolicyQueryOptions = (id: number) => queryOptions({
  queryKey: accountingPolicyKeys.detail(id),
  queryFn: ({ signal }) => getAccountingPolicy(id, signal),
})

export const accountingPolicySearchQueryOptions = (criteria: AccountingPolicySearchCriteria) => queryOptions({
  queryKey: accountingPolicyKeys.search(criteria),
  queryFn: ({ signal }) => searchAccountingPolicies(criteria, signal),
})

export const accountingPolicyClassificationsQueryOptions = (id: number) => queryOptions({
  queryKey: accountingPolicyKeys.classifications(id),
  queryFn: ({ signal }) => getAccountingPolicyClassifications(id, signal),
})
