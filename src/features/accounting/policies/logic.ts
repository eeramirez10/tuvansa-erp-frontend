import { queryOptions } from "@tanstack/react-query"
import {
  getAccountingPolicy,
  getAccountingPolicyClassifications,
  getDuplicatePolicyPreview,
  getManualPolicyCaptureOptions,
  getManualPolicyPreview,
  searchManualPolicyAccounts,
  searchAccountingPolicies,
  type AccountingPolicySearchCriteria,
} from "@/features/accounting/policies/services/accounting-policy-service"

export const accountingPolicyKeys = {
  all: ["accounting", "policies"] as const,
  detail: (id: number) => [...accountingPolicyKeys.all, "detail", id] as const,
  search: (criteria: AccountingPolicySearchCriteria) => [...accountingPolicyKeys.all, "search", criteria] as const,
  classifications: (id: number) => [...accountingPolicyKeys.detail(id), "classifications"] as const,
  capture: () => [...accountingPolicyKeys.all, "capture"] as const,
  accounts: (q: string) => [...accountingPolicyKeys.capture(), "accounts", q] as const,
  manual: (id: number) => [...accountingPolicyKeys.detail(id), "manual"] as const,
  duplicate: (id: number) => [...accountingPolicyKeys.detail(id), "duplicate"] as const,
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

export const manualPolicyCaptureQueryOptions = () => queryOptions({
  queryKey: accountingPolicyKeys.capture(),
  queryFn: ({ signal }) => getManualPolicyCaptureOptions(signal),
  refetchOnMount: "always",
  retry: false,
})

export const manualPolicyAccountsQueryOptions = (q: string) => queryOptions({
  queryKey: accountingPolicyKeys.accounts(q),
  queryFn: ({ signal }) => searchManualPolicyAccounts(q, signal),
  enabled: q.length > 0,
  retry: false,
})

export const manualPolicyPreviewQueryOptions = (id: number) => queryOptions({
  queryKey: accountingPolicyKeys.manual(id),
  queryFn: ({ signal }) => getManualPolicyPreview(id, signal),
  refetchOnMount: "always",
  retry: false,
})

export const duplicatePolicyPreviewQueryOptions = (id: number) => queryOptions({
  queryKey: accountingPolicyKeys.duplicate(id),
  queryFn: ({ signal }) => getDuplicatePolicyPreview(id, signal),
  refetchOnMount: "always",
  retry: false,
})
