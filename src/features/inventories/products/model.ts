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
  editing?: {
    writable: boolean
    revision: string
    editableFields: string[]
  }
  classification: {
    type: ProductType
    familyCode: string
    unit: {
      id: number
      code: string
      description: string
      catalogOption?: { code: string; description: string } | null
    }
    usesColorAndSize: boolean
    hasPhoto: boolean
  }
  prices: {
    hasActiveOffer?: boolean
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
    salesLastSixWeeks?: number
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
  openingStock?: number
  lotTotals?: { count: number; entries: number; exits: number; net: number }
  customerOrdersTotals?: { assigned: number; remaining: number }
  supplierOrdersTotals?: { remaining: number }
  customerSalesTotals?: { quantity: number; amount: number }
  annualSalesDetails?: { fromDate: string | null; totals: Record<string, number> }
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

export type ProductClassificationOption = {
  id: number
  code: string
  number: string
  description: string
  parentCode: string
}

export type ProductClassificationGroup = {
  key: string
  label: string
  selectedCode: string
  selectedNumber: string
  selectedDescription: string
  selectedFlag: string
  options: ProductClassificationOption[]
}

export type ProductClassification = {
  revision: number
  writable: boolean
  familyCode: string
  groups: ProductClassificationGroup[]
}

export type ProductClassificationResponse = Omit<ProductPanelResponse, "data"> & {
  data: ProductPanel & { classification: ProductClassification }
}

export const productClassificationFormSchema = z.object({
  changes: z.record(z.string().min(1), z.string().min(1)),
})

export type ProductClassificationForm = z.infer<typeof productClassificationFormSchema>
export type ProductClassificationUpdate = ProductClassificationForm & { revision: number; rebuildFamily?: boolean }

const productOtherDataValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()])

export type ProductOtherDataValue = z.infer<typeof productOtherDataValueSchema>

export const productOtherDataFormSchema = z.object({
  changes: z.record(z.string(), productOtherDataValueSchema.optional()),
})

export type ProductOtherDataForm = z.infer<typeof productOtherDataFormSchema>
export type ProductOtherDataUpdate = { revision: number; changes: Record<string, ProductOtherDataValue> }

export type ProductOtherData = {
  revision: number
  writable: boolean
  editableFields: string[]
  values: Record<string, ProductOtherDataValue>
  miscLabels: string[]
  tariffs: Array<{ code: string; description: string; percentage: number | null }>
}

export type ProductOtherDataResponse = Omit<ProductPanelResponse, "data"> & {
  data: ProductPanel & { otherData: ProductOtherData }
}

export type ProductLedgerFilters = {
  warehouse?: string
  movementType?: "R"
  openingMovementType?: "R"
  lotId?: number
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

export type ProductCustomerOrderItem = {
  id: number
  customerCode: string
  customerName: string
  orderedAt: string
  orderNumber: string
  quantity: number
  fulfilled: number
  assigned: number
  externalNumber: string
  price: number
  factor: number
}

export type ProductOrderListFilters = {
  excludeFulfilled?: boolean
}

export type ProductCustomerOrdersStarSort = "code" | "name" | "order" | "date"

export type ProductCustomerOrdersStarFilters = {
  classifier?: number
  sort: ProductCustomerOrdersStarSort
}

export type ProductCustomerSalesPanel = "customer-sales" | "customer-sales-star" | "sales-by-branch"

export type ProductCustomerSalesSort = "branch" | "code" | "name" | "quantity" | "amount"

export type ProductCustomerSalesFilters = {
  classifier?: number
  sort: ProductCustomerSalesSort
}

export type ProductPanelDefinition = {
  key: ProductPanelKey
  label: string
  section: ProductPanelSection
}

export const productCodeSchema = z.string().trim().toUpperCase().min(1, "El código es obligatorio").max(13)

const productFormSchema = z.object({
  code: productCodeSchema,
  description: z.string().trim().min(1, "La descripción es obligatoria").max(60),
  type: z.enum(["rawMaterial", "finishedProduct", "set", "assembly", "service"]),
  unitId: z.number().int().positive("La unidad debe ser mayor que cero"),
  familyCode: z.string().trim().max(16),
  hasPhoto: z.boolean(),
  usesColorAndSize: z.boolean(),
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
  salesLastSixWeeks: z.number().int().nonnegative(),
  inventoryDays: z.number().int().nonnegative(),
})

export type ProductFormValues = z.infer<typeof productFormSchema>

const editDecimal = z.string().trim().regex(/^-?(?:\d+(?:\.\d*)?|\.\d+)$/, "Captura un número válido")
  .transform(Number).pipe(z.number())
const nonnegativeEditInteger = z.number().int("Captura un entero").min(0)
const editInteger = editDecimal.pipe(nonnegativeEditInteger.max(2_147_483_647))
const editWarehouseLimit = editDecimal.pipe(nonnegativeEditInteger)
const editAmountLimit = Number.MAX_SAFE_INTEGER / 10_000
const editPrice = editDecimal.pipe(z.number().min(0).max(editAmountLimit).multipleOf(0.0001, "Captura hasta cuatro decimales"))
const editCost = editDecimal.pipe(z.number().min(-editAmountLimit).max(editAmountLimit).multipleOf(0.0001, "Captura hasta cuatro decimales"))

const productCatalogChangesSchema = productFormSchema.omit({ code: true, hasPhoto: true }).extend({
  familyCode: z.string().trim().toUpperCase().max(16),
  salePrice1: editPrice,
  salePrice2: editPrice,
  salePrice3: editPrice,
  saleCurrency1: editInteger,
  saleCurrency2: editInteger,
  saleCurrency3: editInteger,
  averageCost: editCost,
  lastCost: editCost,
  previousCost: editCost,
  costCurrency: editInteger,
  adValorem: editDecimal.pipe(z.number().min(0).multipleOf(0.01, "Captura hasta dos decimales")),
  minimum: editWarehouseLimit,
  maximum: editWarehouseLimit,
  location: z.string().trim().toUpperCase().max(30),
  ean: z.string().trim().toUpperCase().max(30),
  upc: z.string().trim().toUpperCase().max(13),
  salesLastSixWeeks: editInteger,
  inventoryDays: editInteger,
}).partial()

export const productCreateFields = new Set(["code", ...Object.keys(productCatalogChangesSchema.shape)])

export const productCatalogFormSchema = z.object({
  mode: z.enum(["create", "edit"]),
  code: productCodeSchema.optional(),
  changes: productCatalogChangesSchema,
}).superRefine(({ mode, code, changes }, context) => {
  if (mode !== "create") return
  if (!code) context.addIssue({ code: "custom", path: ["code"], message: "El código es obligatorio" })
  if (!changes.description) {
    context.addIssue({ code: "custom", path: ["changes", "description"], message: "La descripción es obligatoria" })
  }
  for (const field of ["averageCost", "lastCost", "previousCost"] as const) {
    if ((changes[field] ?? 0) < 0) {
      context.addIssue({ code: "custom", path: ["changes", field], message: "Captura un costo mayor o igual a cero" })
    }
  }
})

export type ProductCatalogDraft = z.input<typeof productCatalogFormSchema>
export type ProductCatalogValues = z.output<typeof productCatalogFormSchema>
export type ProductCatalogEditChanges = ProductCatalogValues["changes"]
export type ProductCatalogEditField = keyof ProductCatalogEditChanges
export type ProductCatalogDetailsData = Omit<Product, "id" | "editing">

export type ProductEditOptions = {
  units: Array<Pick<Product["classification"]["unit"], "id" | "code" | "description">>
}

export type ProductCreateOptions = ProductEditOptions & { canWrite: boolean; reason: string | null }

export type ProductRemovalPreview = {
  id: number
  code: string
  revision: string | null
  canDelete: boolean
  reason: string | null
}

export type ProductRemovalInput = { code: string; revision: string }

export type ProductMutationInput = {
  code: string
  description: string
  classification: {
    type: Exclude<ProductType, "unknown">
    unitId: number
    familyCode: string
    hasPhoto: boolean
    usesColorAndSize: boolean
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
    salesLastSixWeeks: number
    inventoryDays: number
  }
}

type ProductEditSalePrice = Partial<ProductMutationInput["prices"]["sale"][number]>

export type ProductCatalogEditInput = {
  revision: string
  code?: string
  description?: string
  classification?: Partial<Omit<ProductMutationInput["classification"], "hasPhoto">> & { usesColorAndSize?: boolean }
  prices?: {
    sale?: [ProductEditSalePrice, ProductEditSalePrice, ProductEditSalePrice]
    costs?: Partial<ProductMutationInput["prices"]["costs"]>
  }
  warehouse?: Partial<Omit<ProductMutationInput["warehouse"], "accounts">> & {
    accounts?: Partial<ProductMutationInput["warehouse"]["accounts"]>
  }
  accumulated?: Partial<Pick<Product["accumulated"], "salesLastSixWeeks" | "inventoryDays">>
}
