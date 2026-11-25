import type {
  BankAccount, BankAccountFormPreview, BankAccountSearchResponse, BankPanel, BankPanelKey, BankPostdateInput, BankReconciliation,
  BankReconciliationInput, BankTransfer, BankTransferInput, BankTransferPreview, BankTransitInput, CreateBankAccountInput, UpdateBankAccountInput,
} from "@/features/treasury/banking/model"
import { apiClient } from "@/shared/api/api-client"

type ItemResponse<T> = { data: T }

export type BankAccountSearchCriteria = {
  q?: string
  code?: string
  accountNumber?: string
  name?: string
  page?: number
  pageSize?: number
}

const panelPaths: Record<BankPanelKey, string> = {
  movements: "actions/movements",
  deposits: "actions/deposits",
  payments: "actions/payments",
  auxiliary: "actions/auxiliary",
  reconciliation: "actions/reconciliation",
  "automatic-reconciliation": "actions/automatic-reconciliation",
  "supplier-expenses": "actions/supplier-expenses",
  "general-ledger": "actions/general-ledger",
  "cost-center-ledger": "actions/cost-center-ledger",
  "authorization-review": "actions/authorization-review",
  classifiers: "actions/classifiers",
  transfer: "actions/transfer",
  "unapplied-auxiliary": "actions/unapplied-auxiliary",
}

export async function searchBankAccounts(criteria: BankAccountSearchCriteria, signal?: AbortSignal) {
  const response = await apiClient.get<BankAccountSearchResponse>("/treasury/bank-accounts", { params: criteria, signal })
  return response.data
}

export async function getBankAccount(id: number, signal?: AbortSignal) {
  const response = await apiClient.get<ItemResponse<BankAccount>>(`/treasury/bank-accounts/${id}`, { signal })
  return response.data.data
}

export async function getFirstBankAccount(signal?: AbortSignal) {
  const response = await apiClient.get<ItemResponse<BankAccount | null>>("/treasury/bank-accounts/first", { signal })
  return response.data.data
}

export async function getAdjacentBankAccount(id: number, direction: "previous" | "next") {
  const response = await apiClient.get<ItemResponse<BankAccount | null>>(`/treasury/bank-accounts/${id}/${direction}`)
  return response.data.data
}

export async function getBankAccountFormPreview(id: number | null, signal?: AbortSignal) {
  const path = id === null ? "/treasury/bank-accounts/create" : `/treasury/bank-accounts/${id}/edit`
  const response = await apiClient.get<ItemResponse<BankAccountFormPreview>>(path, { signal })
  return response.data.data
}

export async function createBankAccount(input: CreateBankAccountInput) {
  const response = await apiClient.post<ItemResponse<BankAccount>>("/treasury/bank-accounts", input)
  return response.data.data
}

export async function updateBankAccount(id: number, input: UpdateBankAccountInput) {
  const response = await apiClient.patch<ItemResponse<BankAccount>>(`/treasury/bank-accounts/${id}`, input)
  return response.data.data
}

export async function deactivateBankAccount(id: number, revision: string) {
  await apiClient.delete(`/treasury/bank-accounts/${id}`, { data: { revision, confirmed: true } })
}

export async function getBankPanel(id: number, key: BankPanelKey, signal?: AbortSignal, costCenter?: string) {
  const response = await apiClient.get<BankPanel>(`/treasury/bank-accounts/${id}/${panelPaths[key]}`, {
    signal, ...(costCenter ? { params: { costCenter } } : {}),
  })
  return response.data
}

export async function getBankReconciliationDetail(id: number, movementId: number, signal?: AbortSignal) {
  const response = await apiClient.get<BankPanel>(`/treasury/bank-accounts/${id}/actions/reconciliation/detail`, {
    signal, params: { movementId },
  })
  return response.data
}

export async function registerBankReconciliation(id: number, input: BankReconciliationInput) {
  const response = await apiClient.post<ItemResponse<BankReconciliation>>(
    `/treasury/bank-accounts/${id}/${panelPaths.reconciliation}`,
    input,
  )
  return response.data.data
}

export async function setBankTransit(id: number, input: BankTransitInput) {
  const response = await apiClient.patch<ItemResponse<BankTransitInput>>(
    `/treasury/bank-accounts/${id}/actions/reconciliation/transit`, input,
  )
  return response.data.data
}

export async function setBankPostdate(id: number, input: BankPostdateInput) {
  const response = await apiClient.patch<ItemResponse<Pick<BankPostdateInput, "policyId" | "revision" | "postDate">>>(
    `/treasury/bank-accounts/${id}/actions/reconciliation/postdate`, input,
  )
  return response.data.data
}

const bankTransferPath = (id: number) => `/treasury/bank-accounts/${id}/${panelPaths.transfer}`

export async function getBankTransferPreview(id: number, signal?: AbortSignal) {
  const response = await apiClient.get<ItemResponse<BankTransferPreview>>(`${bankTransferPath(id)}/capture`, {
    params: { direction: "outgoing" }, signal,
  })
  return response.data.data
}

export async function createBankTransfer(id: number, input: BankTransferInput) {
  const response = await apiClient.post<ItemResponse<BankTransfer>>(bankTransferPath(id), input)
  return response.data.data
}
