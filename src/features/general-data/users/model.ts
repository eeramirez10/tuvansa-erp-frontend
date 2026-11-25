import { z } from "zod"

export const groupIds = Array.from({ length: 42 }, (_, group) => group)
export const identificationSchema = z.string().trim().min(1, "Ingresa una identificación").max(32)
  .regex(/^[\p{L}\p{N}_.@-]+$/u, "Usa letras, números, punto, guion o @")

export type WebSession = {
  user: { id: string; identification: string; name: string; group: number; legacyId: number | null; administrator: boolean
    access?: Pick<UserSettings, "hideCosts" | "hideBalances" | "ownCustomersOnly"> }
  capabilities: { generalData: boolean; users: boolean; authorizeOrders: boolean }
}

const text = (length: number) => z.string().trim().max(length).nullable().transform(value => value || null)
const number = (max: number) => z.number().int().min(0).max(max).nullable()
export const userSettingsSchema = z.object({
  company: number(2147483647), department: number(255), multiCompany: number(1), notes: text(40),
  hideCosts: z.boolean(), hideBalances: z.boolean(), ownCustomersOnly: z.boolean(),
  parameter: text(4), classifier: z.number().int().min(1).max(9).nullable(),
  printer: text(1000), labelPrinter: number(2147483647), supplierClassifiers: text(300),
  captureFrom: z.iso.date().nullable(), captureUntil: z.iso.date().nullable(),
  store: text(3), payrollNumber: text(8), position: text(50),
}).superRefine((value, ctx) => {
  if (value.ownCustomersOnly && (!value.classifier || !value.parameter)) {
    ctx.addIssue({ code: "custom", path: ["parameter"], message: "Indica el clasificador y su parámetro." })
  }
  if (value.supplierClassifiers && !value.classifier) {
    ctx.addIssue({ code: "custom", path: ["classifier"], message: "Indica el clasificador de proveedores." })
  }
  if (value.captureFrom && value.captureUntil && value.captureFrom > value.captureUntil) {
    ctx.addIssue({ code: "custom", path: ["captureUntil"], message: "La fecha final debe ser posterior o igual a la inicial." })
  }
})
export type UserSettings = z.infer<typeof userSettingsSchema>
export const defaultUserSettings: UserSettings = {
  company: null, department: null, multiCompany: null, notes: null,
  hideCosts: false, hideBalances: false, ownCustomersOnly: false, parameter: null, classifier: null,
  printer: null, labelPrinter: null, supplierClassifiers: null, captureFrom: null, captureUntil: null,
  store: null, payrollNumber: null, position: null,
}

export const profileSchema = z.object({
  identification: identificationSchema,
  name: z.string().trim().min(1, "Ingresa el nombre").max(46),
  group: z.number().int().min(0).max(41),
  active: z.boolean(),
  administrator: z.boolean(),
  settings: userSettingsSchema,
})

export type UserProfile = z.infer<typeof profileSchema>
export type UserProfileUpdate = Omit<UserProfile, "settings"> & { settings?: Partial<UserSettings> }
export type DirectoryUser = Omit<UserProfile, "settings"> & {
  id: string; legacyId: number | null; legacyIdentification: string | null
  shared: boolean; legacyActive: boolean | null; revision: number; configured: boolean; effectiveActive: boolean
}

export type GermanUserDetails = {
  company: number | null; department: number | null; multiCompany: number | null; notes: string | null
  hideCosts: boolean | null; hideBalances: boolean | null; ownCustomersOnly: boolean | null
  parameter: string | null; printer: string | null; labelPrinter: number | null; supplierClassifiers: string | null
  classifier?: number | null
  captureFrom: string | null; captureUntil: string | null; store: string | null; payrollNumber: string | null; position: string | null
}

export type DirectoryUserDetail = DirectoryUser & {
  legacyDetails: GermanUserDetails | null
  settings: UserSettings
  activationExpiresAt: string | null
}
export type SavedDirectoryUser = DirectoryUser & { settings: UserSettings }

export type DirectoryFilters = {
  search: string; group?: number; state?: "active" | "inactive" | "pending"; offset: number; limit: number
}

export type DirectoryResult = { items: DirectoryUser[]; total: number }
export type DirectoryDirection = "previous" | "next"
export type DirectoryPosition = { filters: DirectoryFilters; index: number | null; total: number | null }

export type Permission = {
  key: string; label: string; module: string; inherited: boolean; override: boolean | null
  allowed: boolean; requiresSupervisor: boolean
}
export type PermissionGroup = { revision: number; items: Permission[] }
export type PermissionChange = { key: string; allowed: boolean | null }
