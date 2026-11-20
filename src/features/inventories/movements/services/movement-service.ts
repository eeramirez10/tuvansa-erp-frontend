import type { InventoryMovement, MovementSearchCriteria, MovementSearchResponse } from "@/features/inventories/movements/model"
import { apiClient } from "@/shared/api/api-client"

const movementPath = "/inventories/movements"

export async function getMovements(criteria: MovementSearchCriteria, page: number, signal?: AbortSignal) {
  const response = await apiClient.get<MovementSearchResponse>(movementPath, {
    params: { ...criteria, page, pageSize: 25 },
    signal,
  })
  return response.data
}

export async function getMovement(id: number, signal?: AbortSignal) {
  const response = await apiClient.get<{ data: InventoryMovement }>(`${movementPath}/${id}`, { signal })
  return response.data.data
}

export async function cancelMovement(id: number) {
  await apiClient.delete(`${movementPath}/${id}`)
}
