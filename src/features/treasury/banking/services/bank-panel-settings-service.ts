import { apiClient } from "@/shared/api/api-client"

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

export async function saveBankReview(id: number, revision: number, movementIds: number[]) {
  await apiClient.patch(`/treasury/bank-accounts/${id}/actions/authorization-review`, { revision, movementIds })
}
