import { z } from "zod"

export type ProductType =
  | "rawMaterial"
  | "finishedProduct"
  | "set"
  | "assembly"
  | "service"
  | "unknown"

export type Product = {
  id: number
  code: string
  description: string
  isActive: boolean
  deactivatedAt: string | null
  classification: {
    type: ProductType
    familyCode: string
    unit: {
      id: number
      code: string
      description: string
    }
    usesColorAndSize: boolean
    hasPhoto: boolean
  }
  prices: {
    sale: [
      { amount: number; currencyId: number },
      { amount: number; currencyId: number },
      { amount: number; currencyId: number },
    ]
    costs: {
      average: number
      last: number
      previous: number
      currencyId: number
      adValorem: number
    }
  }
  warehouse: {
    minimum: number
    maximum: number
    location: string
    ean: string
    upc: string
    accounts: {
      primary: string
      secondary: string
      costOfSales: string
    }
  }
  accumulated: {
    lastPurchaseAt: string | null
    lastSaleAt: string | null
    assigned: number
    confirmed: number
    customerOrders: number
    customerQuotes: number
    supplierOrders: number
    supplierQuotes: number
    currentStock: number
    previousStock: number
    accumulatedStock: number
    previousQuantity: number
    accumulatedQuantity: number
    pieceStock: number
    salesLastSixMonths: number
    inventoryDays: number
  }
  createdAt: string | null
}

export type ProductSearchResponse = {
  data: Product[]
  pagination: {
    page: number
    pageSize: number
    total: number
  }
}

export type ProductPanelSection = "actions" | "purchases-production" | "queries"

export type ProductPanelKey =
  | "warehouses"
  | "color-size-registration"
  | "block-status"
  | "classifications"
  | "extended-description"
  | "customer-discounts"
  | "supplier-discounts"
  | "other-data"
  | "specifications"
  | "photo"
  | "ct-inventory"
  | "prices"
  | "skus"
  | "prepacks"
  | "alternates"
  | "components"
  | "quality-specifications"
  | "implosion"
  | "lots"
  | "inventory-layers"
  | "ledger"
  | "customer-orders"
  | "customer-orders-star"
  | "customer-orders-ct"
  | "customer-quotes"
  | "customer-sales"
  | "customer-sales-star"
  | "customer-sales-ct"
  | "customer-sales-detail"
  | "sales-by-branch"
  | "annual-sales"
  | "annual-sales-summary"
  | "supplier-orders"
  | "supplier-orders-ct"
  | "supplier-quotes"
  | "supplier-purchases"
  | "supplier-purchases-dt"
  | "supplier-purchases-detail"
  | "annual-purchases"
  | "annual-purchases-summary"
  | "pieces"
  | "fulfilled-pieces"
  | "work-in-progress"
  | "work-in-progress-ct"
  | "edi"
  | "pending-enablements"
  | "documents"

export type ProductPanel = {
  product: Pick<Product, "id" | "code" | "description">
  key: ProductPanelKey
  section: ProductPanelSection
  button: string
  available: boolean
  source: "mysql" | "product-cache" | "not-available"
  items: Array<Record<string, unknown>>
  reason?: string
}

export type ProductPanelResponse = {
  data: ProductPanel
  pagination: {
    page: number
    pageSize: number
    returned: number
  }
}

export type ProductLedgerItem = {
  id: number
  date: string
  document: string
  movementType: string
  cost: number
  quantity: number
  warehouse: string
  lotId: number
  userId: number
  revaluation: number
}

export type ProductPanelDefinition = {
  key: ProductPanelKey
  label: string
  section: ProductPanelSection
}

export const productFormSchema = z.object({
  code: z.string().trim().min(1, "El código es obligatorio").max(13),
  description: z.string().trim().min(1, "La descripción es obligatoria").max(60),
  type: z.enum(["rawMaterial", "finishedProduct", "set", "assembly", "service"]),
  unitId: z.number().int().positive("La unidad debe ser mayor que cero"),
  familyCode: z.string().trim().max(16),
  hasPhoto: z.boolean(),
  salePrice1: z.number().nonnegative(),
  salePrice2: z.number().nonnegative(),
  salePrice3: z.number().nonnegative(),
  saleCurrency1: z.number().int().nonnegative(),
  saleCurrency2: z.number().int().nonnegative(),
  saleCurrency3: z.number().int().nonnegative(),
  averageCost: z.number().nonnegative(),
  lastCost: z.number().nonnegative(),
  previousCost: z.number().nonnegative(),
  costCurrency: z.number().int().nonnegative(),
  adValorem: z.number().nonnegative(),
  minimum: z.number().nonnegative(),
  maximum: z.number().nonnegative(),
  location: z.string().trim().max(30),
  ean: z.string().trim().max(30),
  upc: z.string().trim().max(13),
  primaryAccount: z.string().trim().max(16),
  secondaryAccount: z.string().trim().max(16),
  costOfSalesAccount: z.string().trim().max(16),
})

export type ProductFormValues = z.infer<typeof productFormSchema>

export type ProductMutationInput = {
  code: string
  description: string
  classification: {
    type: Exclude<ProductType, "unknown">
    unitId: number
    familyCode: string
    hasPhoto: boolean
  }
  prices: {
    sale: [
      { amount: number; currencyId: number },
      { amount: number; currencyId: number },
      { amount: number; currencyId: number },
    ]
    costs: {
      average: number
      last: number
      previous: number
      currencyId: number
      adValorem: number
    }
  }
  warehouse: {
    minimum: number
    maximum: number
    location: string
    ean: string
    upc: string
    accounts: {
      primary: string
      secondary: string
      costOfSales: string
    }
  }
}
