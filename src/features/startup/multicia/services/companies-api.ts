import { apiClient } from "@/shared/api/api-client"
import type { Company, CompanyContext } from "@/features/startup/multicia/model"

export async function getCompanies(signal: AbortSignal) {
  const response = await apiClient.get<{ data: Company[] }>("/companies", { signal })
  return response.data.data
}

export async function getCompanyContext(id: number, signal: AbortSignal) {
  const response = await apiClient.get<{ data: CompanyContext }>(
    `/companies/${id}/context`,
    { signal },
  )
  return response.data.data
}
