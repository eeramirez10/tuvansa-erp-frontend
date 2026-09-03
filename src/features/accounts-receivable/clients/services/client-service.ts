import { apiClient } from "@/shared/api/api-client"
import type {
  Client,
  ClientAnalyticsCriteria,
  ClientAnalyticsResponse,
  ClientClassificationsResponse,
  ClientMutationInput,
  ClientPanelDefinition,
  ClientPanelResponse,
  ClientSearchResponse,
} from "@/features/accounts-receivable/clients/model"

type ItemResponse<T> = { data: T }
type RawPanelResponse = {
  data: Record<string, unknown> & { client: ClientPanelResponse["data"]["client"] }
  pagination?: ClientPanelResponse["pagination"]
}

export type ClientSearchCriteria = {
  q?: string
  status?: "active" | "inactive" | "all"
  page?: number
  pageSize?: number
}

export async function searchClients(criteria: ClientSearchCriteria, signal?: AbortSignal) {
  const response = await apiClient.get<ClientSearchResponse>("/accounts-receivable/clients", {
    params: criteria,
    signal,
  })
  return response.data
}

export async function getClient(clientId: number, signal?: AbortSignal) {
  const response = await apiClient.get<ItemResponse<Client>>(
    `/accounts-receivable/clients/${clientId}`,
    { signal },
  )
  return response.data.data
}

export async function getFirstActiveClient(signal?: AbortSignal) {
  const response = await apiClient.get<ItemResponse<Client>>(
    "/accounts-receivable/clients/first",
    { signal },
  )
  return response.data.data
}

export async function getAdjacentClient(clientId: number, direction: "previous" | "next") {
  const response = await apiClient.get<ItemResponse<Client | null>>(
    `/accounts-receivable/clients/${clientId}/${direction}`,
  )
  return response.data.data
}

export async function createClient(input: ClientMutationInput) {
  const response = await apiClient.post<ItemResponse<Client>>("/accounts-receivable/clients", input)
  return response.data.data
}

export async function updateClient(clientId: number, input: ClientMutationInput) {
  const response = await apiClient.patch<ItemResponse<Client>>(
    `/accounts-receivable/clients/${clientId}`,
    input,
  )
  return response.data.data
}

export async function deleteClient(clientId: number) {
  await apiClient.delete(`/accounts-receivable/clients/${clientId}`)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export async function getClientPanel(
  clientId: number,
  panel: ClientPanelDefinition,
  signal?: AbortSignal,
): Promise<ClientPanelResponse> {
  const response = await apiClient.get<RawPanelResponse>(
    `/accounts-receivable/clients/${clientId}/${panel.path}`,
    { params: { page: 1, pageSize: 100 }, signal },
  )
  const payload = response.data.data
  const rawData = payload[panel.dataKey]
  const items = Array.isArray(rawData) ? rawData.filter(isRecord) : []
  const detail = isRecord(rawData) ? rawData : undefined
  const unavailableReason = detail?.available === false && typeof detail.reason === "string"
    ? detail.reason
    : undefined
  const secondaryItems = Array.isArray(payload.availableAgentOptions)
    ? payload.availableAgentOptions.filter(isRecord)
    : undefined
  const summary = isRecord(payload.summary) ? payload.summary : undefined

  return {
    data: {
      client: payload.client,
      items,
      ...(summary ? { summary } : {}),
      ...(secondaryItems ? { secondaryItems } : {}),
      ...(detail ? { detail } : {}),
      ...(unavailableReason ? { unavailableReason } : {}),
    },
    ...(response.data.pagination ? { pagination: response.data.pagination } : {}),
  }
}

export async function getClientClassifications(
  clientId: number,
  position: number,
  signal?: AbortSignal,
) {
  const response = await apiClient.get<ClientClassificationsResponse>(
    `/accounts-receivable/clients/${clientId}/actions/classifications`,
    { params: { position }, signal },
  )
  return response.data
}

export async function getClientAnalytics(
  criteria: ClientAnalyticsCriteria,
  signal?: AbortSignal,
) {
  const response = await apiClient.get<ClientAnalyticsResponse>(
    "/accounts-receivable/clients/reports/analytics",
    { params: criteria, signal },
  )
  return response.data
}
