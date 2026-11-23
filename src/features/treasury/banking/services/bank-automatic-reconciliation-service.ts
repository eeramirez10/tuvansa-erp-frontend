import type { BankPanel } from "@/features/treasury/banking/model"
import { apiClient } from "@/shared/api/api-client"

export async function getBankAutomaticReconciliation(id: number, asOfDate: string, signal?: AbortSignal) {
  const response = await apiClient.get<BankPanel>(`/treasury/bank-accounts/${id}/actions/automatic-reconciliation`, {
    params: { asOfDate }, signal,
  })
  return response.data
}
