import { z } from "zod"

export const groupIds = Array.from({ length: 42 }, (_, group) => group)
export const identificationSchema = z.string().trim().min(1, "Ingresa una identificación").max(32)
  .regex(/^[\p{L}\p{N}_.@-]+$/u, "Usa letras, números, punto, guion o @")

export type WebSession = {
  user: { id: string; identification: string; name: string; group: number; legacyId: number | null; administrator: boolean }
  capabilities: { generalData: boolean; users: boolean; authorizeOrders: boolean }
}

export const profileSchema = z.object({
  identification: identificationSchema,
  name: z.string().trim().min(1, "Ingresa el nombre").max(46),
  group: z.number().int().min(0).max(41),
  active: z.boolean(),
  administrator: z.boolean(),
})

export type UserProfile = z.infer<typeof profileSchema>
export type DirectoryUser = UserProfile & {
  id: string; legacyId: number | null; legacyIdentification: string | null
  shared: boolean; legacyActive: boolean | null; revision: number; configured: boolean; effectiveActive: boolean
}

export type DirectoryFilters = {
  search: string; group?: number; state?: "active" | "inactive" | "pending"; offset: number; limit: number
}

export type Permission = {
  key: string; label: string; module: string; inherited: boolean; override: boolean | null
  allowed: boolean; requiresSupervisor: boolean
}
export type PermissionGroup = { revision: number; items: Permission[] }
export type PermissionChange = { key: string; allowed: boolean | null }
