import type { BankAccount, BankAccountSearchResponse, BankPanel, BankPanelKey } from "@/features/treasury/banking/model"
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

export async function getBankPanel(id: number, key: BankPanelKey, signal?: AbortSignal) {
  const response = await apiClient.get<BankPanel>(`/treasury/bank-accounts/${id}/${panelPaths[key]}`, { signal })
  return response.data
}
