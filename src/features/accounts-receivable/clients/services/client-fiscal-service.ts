import { apiClient } from "@/shared/api/api-client"
import type { ClientFiscal, FiscalValues, ClientFiscalVerificationResponse } from "@/features/accounts-receivable/clients/fiscal-model"

const path = (id: number) => `/accounts-receivable/clients/${id}/actions/fiscal-verification`
export async function getClientFiscal(id: number, signal?: AbortSignal) {
  return (await apiClient.get<{ data: ClientFiscal }>(path(id), { signal })).data.data
}
export async function saveClientFiscal(id: number, values: FiscalValues, expectedVersion: string) {
  return (await apiClient.patch<{ data: ClientFiscal; message: string }>(path(id), { values, expectedVersion })).data
}
export async function verifyClientFiscal(id: number) {
  return (await apiClient.post<ClientFiscalVerificationResponse>(`${path(id)}/verify`, {})).data
}
