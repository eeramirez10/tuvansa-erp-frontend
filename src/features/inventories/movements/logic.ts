import { queryOptions } from "@tanstack/react-query"
import { z } from "zod"

import { movementSearchFields, type MovementSearchCriteria } from "@/features/inventories/movements/model"
import { getMovement, getMovementCaptureOptions, getMovements } from "@/features/inventories/movements/services/movement-service"

export const movementKeys = {
  all: ["inventories", "movements"] as const,
  search: (criteria: MovementSearchCriteria, page: number) =>
    [...movementKeys.all, "search", criteria, page] as const,
  detail: (id: number | null) => [...movementKeys.all, "detail", id] as const,
  capture: () => [...movementKeys.all, "capture"] as const,
}

export function movementCaptureQueryOptions() {
  return queryOptions({
    queryKey: movementKeys.capture(),
    queryFn: ({ signal }) => getMovementCaptureOptions(signal),
    refetchOnMount: "always",
    retry: false,
  })
}

export function movementSearchQueryOptions(criteria: MovementSearchCriteria, page: number) {
  return queryOptions({
    queryKey: movementKeys.search(criteria, page),
    queryFn: ({ signal }) => getMovements(criteria, page, signal),
  })
}

export function movementDetailsQueryOptions(id: number | null) {
  return queryOptions({
    queryKey: movementKeys.detail(id),
    queryFn: ({ signal }) => id === null ? Promise.resolve(null) : getMovement(id, signal),
    enabled: id !== null,
  })
}

const isoDate = z.iso.date()

export function normalizeMovementSearch(criteria: MovementSearchCriteria) {
  const normalized: MovementSearchCriteria = {}
  for (const { key } of movementSearchFields) {
    const value = criteria[key]?.trim()
    if (value) normalized[key] = value
  }

  if (normalized.date) {
    const spanishDate = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(normalized.date)
    if (spanishDate) {
      const [, day, month, year] = spanishDate
      normalized.date = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
    }
    if (!isoDate.safeParse(normalized.date).success) {
      throw new Error("Escribe la fecha en formato día/mes/año.")
    }
  }

  return normalized
}
