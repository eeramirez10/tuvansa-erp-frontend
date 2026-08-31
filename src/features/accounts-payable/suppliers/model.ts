export type Supplier = {
  id: number
  code: string
  name: string
  isActive: boolean
  deactivatedAt: string | null
  address: {
    street: string
    neighborhood: string
    city: string
    state: string
    postalCode: string
  }
  contact: {
    name: string
    phone: string
    phone2: string
    fax: string
    email: string
  }
  fiscal: {
    taxId: string
    curp: string
    accountingAccount: string
  }
  terms: {
    priceList: number
    discounts: [number, number]
    paymentTermDays: number
    applyToSupplierCode: string
    creditLimit: number
    currencyId: number
    type: number
  }
  totals: {
    actualPaymentTermDays: number
    previousBalance: number
    currentBalance: number
    accumulatedPurchases: number
    lastPurchaseAt: string | null
    lastPaymentAt: string | null
  }
  indicators: { hasEvents: boolean }
  notes: string
  createdAt: string | null
}

export type SupplierSearchResponse = {
  data: Supplier[]
  pagination: { page: number; pageSize: number; total: number }
}

export type SupplierPanelDefinition = {
  key: string
  label: string
  title: string
  section: "actions" | "queries"
  ct?: boolean
  path: string
  columns: readonly SupplierPanelColumn[]
}

export type SupplierPanelColumn = {
  key: string
  label: string
  width?: string
  format?: "text" | "number" | "money" | "date" | "boolean"
}

export type SupplierPanelResponse = {
  data: {
    supplier: Pick<Supplier, "id" | "code" | "name"> & { currentBalance: number }
    items: Array<Record<string, unknown>>
    summary?: Record<string, unknown>
    detail?: Record<string, unknown>
    unavailableReason?: string
  }
}

export type SupplierClassificationsResponse = {
  data: {
    supplier: Pick<Supplier, "id" | "code" | "name"> & { currentBalance: number }
    classifications: Array<{ position: number; label: string; code: string; description: string }>
    selectedPosition: number
    options: Array<{ id: number; code: string; description: string; number: string; type: string }>
  }
}
