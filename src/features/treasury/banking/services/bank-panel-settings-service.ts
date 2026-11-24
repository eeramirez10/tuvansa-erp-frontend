import type { AccountingPolicy } from "@/features/accounting/policies/model"
import { apiClient } from "@/shared/api/api-client"
import type { ApiItemResponse } from "@/shared/types/api"

export async function saveBankClassifiers(id: number, revision: number, values: string[]) {
  const { data } = await apiClient.patch(`/treasury/bank-accounts/${id}/actions/classifiers`, { revision, values })
  return data
}

export async function saveBankBudget(id: number, revision: number, values: number[], costCenter?: string) {
  const path = costCenter ? "cost-center-ledger" : "general-ledger"
  const { data } = await apiClient.patch(`/treasury/bank-accounts/${id}/actions/${path}`,
    { revision, values }, { params: costCenter ? { costCenter } : undefined })
  return data
}

export async function saveBankReview(id: number, revision: number, movementIds: number[], mark: "" | "+" | "*") {
  await apiClient.patch(`/treasury/bank-accounts/${id}/actions/authorization-review`, { revision, movementIds, mark })
}

export type BankReviewTransferInput = {
  revision: number
  movementIds: number[]
  requestKey: string
  date: string
  destinationBankAccountId: number
}

export async function transferBankReview(id: number, input: BankReviewTransferInput) {
  const response = await apiClient.post<ApiItemResponse<AccountingPolicy>>(
    `/treasury/bank-accounts/${id}/actions/authorization-review/transfer`, input,
  )
  return response.data.data
}
