import { z } from "zod"

export type Client = {
  id: number
  code: string
  name: string
  isActive: boolean
  deactivatedAt: string | null
  address: {
    street: string
    exteriorNumber: string
    interiorNumber: string
    neighborhood: string
    borough: string
    city: string
    state: string
    postalCode: string
    countryCode: string
  }
  contact: {
    name: string
    phones: string
    fax: string
    email: string
    website: string
  }
  fiscal: {
    taxId: string
    curp: string
    branch: string
    accountingAccount: string
  }
  indicators: {
    hasEvents: boolean
  }
  terms: {
    priceList: number
    discounts: [number, number, number]
    paymentTermDays: number
    creditLimit: number
    creditExpiresAt: string | null
    reviewDay: string
    reviewTime: string
    paymentDay: string
    paymentTime: string
    applyToClientCode: string
    reviewStartsFromInvoice: boolean
  }
  totals: {
    actualPaymentTermDays: number
    previousBalance: number
    currentBalance: number
    availableCredit: number
    accumulatedSales: number
    lastPurchaseAt: string | null
    lastPaymentAt: string | null
    lastOrderAt: string | null
  }
  createdAt: string | null
}

export type ClientIdentity = Pick<Client, "id" | "code" | "name"> & {
  currentBalance: number
}

export type ClientSearchResponse = {
  data: Client[]
  pagination: { page: number; pageSize: number; total: number }
}

const optionalText = (maximum: number) => z.string().trim().max(maximum)

export const clientFormSchema = z.object({
  code: z.string().trim().min(1, "El código es obligatorio").max(6),
  name: z.string().trim().min(1, "La razón social es obligatoria").max(255),
  street: optionalText(45),
  exteriorNumber: optionalText(31),
  interiorNumber: optionalText(31),
  neighborhood: optionalText(60),
  borough: optionalText(50),
  city: optionalText(45),
  state: optionalText(16),
  postalCode: optionalText(12),
  countryCode: optionalText(3),
  contactName: optionalText(20),
  phones: optionalText(35),
  fax: optionalText(35),
  email: optionalText(75),
  website: optionalText(35),
  taxId: optionalText(15),
  curp: optionalText(35),
  branch: optionalText(15),
  accountingAccount: optionalText(13),
  priceList: z.number().int().nonnegative(),
  discount1: z.number(),
  discount2: z.number(),
  discount3: z.number(),
  paymentTermDays: z.number().int().nonnegative(),
  creditLimit: z.number().nonnegative(),
  creditExpiresAt: z.string(),
  reviewDay: optionalText(9),
  reviewTime: optionalText(15),
  paymentDay: optionalText(9),
  paymentTime: optionalText(15),
  applyToClientCode: optionalText(6),
  reviewStartsFromInvoice: z.boolean(),
})

export type ClientFormValues = z.infer<typeof clientFormSchema>

export type ClientMutationInput = {
  code: string
  name: string
  address: Client["address"]
  contact: Client["contact"]
  fiscal: Client["fiscal"]
  terms: Client["terms"]
}

export type ClientPanelSection = "actions" | "queries"

export type ClientPanelKey =
  | "classifications"
  | "destinations"
  | "block-status"
  | "discounts"
  | "events"
  | "branches"
  | "contacts"
  | "balance"
  | "movements"
  | "invoices"
  | "orders"
  | "ordered-products"
  | "quoted-products"
  | "sold-products"
  | "sold-products-detail"
  | "annual-sales"
  | "annual-sales-summary"
  | "sales-by-branch"
  | "edi-sales"
  | "work-in-progress"
  | "ct-ordered-products"
  | "ct-sold-products"
  | "ct-work-in-progress"

export type ClientColumnFormat = "text" | "number" | "money" | "date" | "boolean"

export type ClientPanelColumn = {
  key: string
  label: string
  width?: string
  align?: "left" | "center" | "right"
  format?: ClientColumnFormat
}

export type ClientPanelDefinition = {
  key: ClientPanelKey
  label: string
  title: string
  section: ClientPanelSection
  path: string
  dataKey: string
  columns: readonly ClientPanelColumn[]
}

export type ClientPanelData = {
  client: ClientIdentity
  items: Array<Record<string, unknown>>
  summary?: Record<string, unknown>
  secondaryItems?: Array<Record<string, unknown>>
  detail?: Record<string, unknown>
  unavailableReason?: string
}

export type ClientPanelResponse = {
  data: ClientPanelData
  pagination?: { page: number; pageSize: number; total: number }
}
