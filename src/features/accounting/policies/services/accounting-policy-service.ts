import type {
  AccountingPolicy,
  AccountingPolicyClassificationInput,
  AccountingPolicyClassifications,
  AccountingPolicyComments,
  AccountingPolicyCommentsInput,
  AccountingPolicySearchResponse,
  DuplicatePolicyInput,
  DuplicatePolicyPreview,
  ManualPolicyAccount,
  ManualPolicyActionInput,
  ManualPolicyCaptureOptions,
  ManualPolicyInput,
  ManualPolicyOperation,
  ManualPolicyPreview,
  PolicyLiabilityDraft,
  PolicyLiabilityInput,
  PolicyLiabilityOptions,
  PolicyLiabilityPreview,
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

const policyPath = "/accounting/policies"

export async function saveAccountingPolicyClassification(id: number, input: AccountingPolicyClassificationInput) {
  await apiClient.patch(`${policyPath}/${id}/actions/classifications`, input)
}

export async function getAccountingPolicyComments(id: number, signal?: AbortSignal) {
  const { data } = await apiClient.get<ItemResponse<AccountingPolicyComments>>(`${policyPath}/${id}/actions/comments`, { signal })
  return data.data
}

export async function updateAccountingPolicyComments(id: number, input: AccountingPolicyCommentsInput) {
  const { data } = await apiClient.patch<ItemResponse<AccountingPolicy>>(`${policyPath}/${id}/actions/comments`, input)
  return data.data
}

export async function getManualPolicyCaptureOptions(signal?: AbortSignal) {
  const { data } = await apiClient.get<ItemResponse<ManualPolicyCaptureOptions>>(`${policyPath}/capture`, { signal })
  return data.data
}

export async function searchManualPolicyAccounts(q: string, signal?: AbortSignal) {
  const { data } = await apiClient.get<ItemResponse<{ accounts: ManualPolicyAccount[] }>>(`${policyPath}/capture/accounts`, { params: { q }, signal })
  return data.data.accounts
}

export async function getManualPolicyPreview(id: number, signal?: AbortSignal) {
  const { data } = await apiClient.get<ItemResponse<ManualPolicyPreview>>(`${policyPath}/${id}/actions/manual`, { signal })
  return data.data
}

export async function getDuplicatePolicyPreview(id: number, signal?: AbortSignal) {
  const { data } = await apiClient.get<ItemResponse<DuplicatePolicyPreview>>(`${policyPath}/${id}/actions/duplicate`, { signal })
  return data.data
}

export async function duplicateAccountingPolicy(id: number, input: DuplicatePolicyInput) {
  const { data } = await apiClient.post<ItemResponse<AccountingPolicy>>(`${policyPath}/${id}/actions/duplicate`, input)
  return data.data
}

function policyLiabilityPath(id: number) {
  return `${policyPath}/${id}/actions/duplicate-liability`
}

export async function getPolicyLiabilityOptions(id: number, signal?: AbortSignal) {
  const { data } = await apiClient.get<ItemResponse<PolicyLiabilityOptions>>(policyLiabilityPath(id), { signal })
  return data.data
}

export async function previewPolicyLiability(id: number, input: PolicyLiabilityDraft) {
  const { data } = await apiClient.get<ItemResponse<PolicyLiabilityPreview>>(`${policyLiabilityPath(id)}/preview`, { params: input })
  return data.data
}

export async function duplicatePolicyLiability(id: number, input: PolicyLiabilityInput) {
  const { data } = await apiClient.post<ItemResponse<AccountingPolicy>>(policyLiabilityPath(id), input)
  return data.data
}

export async function createManualPolicy(input: ManualPolicyInput) {
  const { data } = await apiClient.post<ItemResponse<AccountingPolicy>>(policyPath, input)
  return data.data
}

export async function updateManualPolicy(id: number, input: ManualPolicyInput & { revision: number }) {
  const { data } = await apiClient.patch<ItemResponse<AccountingPolicy>>(`${policyPath}/${id}`, input)
  return data.data
}

export async function actOnManualPolicy(id: number, operation: ManualPolicyOperation, input: ManualPolicyActionInput) {
  const path = `${policyPath}/${id}`
  const response = operation === "delete"
    ? await apiClient.delete<ItemResponse<AccountingPolicy>>(path, { data: input })
    : await apiClient.post<ItemResponse<AccountingPolicy>>(`${path}/actions/${operation}`, input)
  return response.data.data
}
