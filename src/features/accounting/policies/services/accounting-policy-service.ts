import type {
  AccountingPolicy,
  AccountingPolicyClassifications,
  AccountingPolicySearchResponse,
} from "@/features/accounting/policies/model"
import { apiClient } from "@/shared/api/api-client"

type ItemResponse<T> = { data: T }

export type AccountingPolicySearchCriteria = {
  q?: string
  number?: string
  date?: string
  applied?: boolean
  family?: string
  cheque?: string
  page?: number
  pageSize?: number
}

export async function searchAccountingPolicies(criteria: AccountingPolicySearchCriteria, signal?: AbortSignal) {
  const response = await apiClient.get<AccountingPolicySearchResponse>("/accounting/policies", { params: criteria, signal })
  return response.data
}

export async function getAccountingPolicy(id: number, signal?: AbortSignal) {
  const response = await apiClient.get<ItemResponse<AccountingPolicy>>(`/accounting/policies/${id}`, { signal })
  return response.data.data
}

export async function getAdjacentAccountingPolicy(id: number, direction: "previous" | "next") {
  const response = await apiClient.get<ItemResponse<AccountingPolicy | null>>(`/accounting/policies/${id}/${direction}`)
  return response.data.data
}

export async function getAccountingPolicyClassifications(id: number, signal?: AbortSignal) {
  const response = await apiClient.get<ItemResponse<AccountingPolicyClassifications>>(
    `/accounting/policies/${id}/actions/classifications`,
    { signal },
  )
  return response.data.data
}
