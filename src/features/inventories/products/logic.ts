import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query"

import type {
  Product,
  ProductCatalogEditChanges,
  ProductCatalogEditInput,
  ProductCustomerOrdersStarFilters,
  ProductCustomerSalesFilters,
  ProductCustomerSalesPanel,
  ProductFormValues,
  ProductLedgerFilters,
  ProductMutationInput,
  ProductPanelKey,
} from "@/features/inventories/products/model"
import {
  getProduct,
  getProductClassification,
  getProductEditOptions,
  getFirstActiveProduct,
  getProductOtherData,
  getProductPanel,
  searchProducts,
  type ProductSearchCriteria,
} from "@/features/inventories/products/services/product-service"

export const productKeys = {
  all: ["inventories", "products"] as const,
  firstActive: () => [...productKeys.all, "first-active"] as const,
  detail: (productId: number) => [...productKeys.all, "detail", productId] as const,
  editOptions: (productId: number) => [...productKeys.detail(productId), "edit-options"] as const,
  search: (criteria: ProductSearchCriteria) =>
    [...productKeys.all, "search", criteria] as const,
  panel: (productId: number, panel: ProductPanelKey) =>
    [...productKeys.detail(productId), "panel", panel] as const,
}

export function productQueryOptions(productId: number) {
  return queryOptions({
    queryKey: productKeys.detail(productId),
    queryFn: ({ signal }) => getProduct(productId, signal),
  })
}

export function productEditOptionsQueryOptions(productId: number) {
  return queryOptions({
    queryKey: productKeys.editOptions(productId),
    queryFn: ({ signal }) => getProductEditOptions(productId, signal),
  })
}

export function firstActiveProductQueryOptions() {
  return queryOptions({
    queryKey: productKeys.firstActive(),
    queryFn: ({ signal }) => getFirstActiveProduct(signal),
  })
}

export function productSearchQueryOptions(criteria: ProductSearchCriteria) {
  return queryOptions({
    queryKey: productKeys.search(criteria),
    queryFn: ({ signal }) => searchProducts(criteria, signal),
  })
}

export function productPanelQueryOptions(
  productId: number,
  panel: ProductPanelKey,
) {
  return queryOptions({
    queryKey: productKeys.panel(productId, panel),
    queryFn: ({ signal }) => getProductPanel(productId, panel, signal),
  })
}

export function productClassificationQueryOptions(productId: number) {
  return queryOptions({
    queryKey: productKeys.panel(productId, "classifications"),
    queryFn: ({ signal }) => getProductClassification(productId, signal),
  })
}

export function productOtherDataQueryOptions(productId: number) {
  return queryOptions({
    queryKey: productKeys.panel(productId, "other-data"),
    queryFn: ({ signal }) => getProductOtherData(productId, signal),
  })
}

export function productLedgerQueryOptions(productId: number, filters: ProductLedgerFilters) {
  return infiniteQueryOptions({
    queryKey: [...productKeys.panel(productId, "ledger"), "pages", filters],
    queryFn: ({ pageParam, signal }) =>
      getProductPanel(productId, "ledger", signal, pageParam, filters),
    initialPageParam: 1,
    getNextPageParam: ({ pagination }) =>
      pagination.returned === pagination.pageSize ? pagination.page + 1 : undefined,
  })
}

export function productOrderListQueryOptions(
  productId: number,
  panel: "customer-orders" | "customer-quotes" | "supplier-orders",
  excludeFulfilled: boolean,
) {
  return infiniteQueryOptions({
    queryKey: [...productKeys.panel(productId, panel), "pages", excludeFulfilled],
    queryFn: ({ pageParam, signal }) =>
      getProductPanel(productId, panel, signal, pageParam,
        excludeFulfilled ? { excludeFulfilled: true } : undefined),
    initialPageParam: 1,
    getNextPageParam: ({ pagination }) =>
      pagination.returned === pagination.pageSize ? pagination.page + 1 : undefined,
  })
}

export function productCustomerOrdersStarQueryOptions(
  productId: number,
  filters: ProductCustomerOrdersStarFilters,
) {
  return infiniteQueryOptions({
    queryKey: [...productKeys.panel(productId, "customer-orders-star"), "pages", filters],
    queryFn: ({ pageParam, signal }) =>
      getProductPanel(productId, "customer-orders-star", signal, pageParam, filters),
    initialPageParam: 1,
    getNextPageParam: ({ pagination }) =>
      pagination.returned === pagination.pageSize ? pagination.page + 1 : undefined,
  })
}

export function productCustomerSalesQueryOptions(
  productId: number,
  panel: ProductCustomerSalesPanel,
  filters: ProductCustomerSalesFilters,
) {
  return infiniteQueryOptions({
    queryKey: [...productKeys.panel(productId, panel), "pages", filters],
    queryFn: ({ pageParam, signal }) =>
      getProductPanel(productId, panel, signal, pageParam, filters),
    initialPageParam: 1,
    getNextPageParam: ({ pagination }) =>
      pagination.returned === pagination.pageSize ? pagination.page + 1 : undefined,
  })
}

export function productAnnualSalesQueryOptions(productId: number, panel: "annual-sales" | "annual-sales-summary") {
  return infiniteQueryOptions({
    queryKey: [...productKeys.panel(productId, panel), "pages"],
    queryFn: ({ pageParam, signal }) => getProductPanel(productId, panel, signal, pageParam),
    initialPageParam: 1,
    getNextPageParam: ({ pagination }) =>
      pagination.returned === pagination.pageSize ? pagination.page + 1 : undefined,
  })
}

export function getProductFormDefaults(product?: Product): ProductFormValues {
  return {
    code: product?.code ?? "",
    description: product?.description ?? "",
    type:
      product?.classification.type === "unknown"
        ? "finishedProduct"
        : (product?.classification.type ?? "finishedProduct"),
    unitId: product?.classification.unit.id ?? 1,
    familyCode: product?.classification.familyCode ?? "",
    hasPhoto: product?.classification.hasPhoto ?? false,
    salePrice1: product?.prices.sale[0].amount ?? 0,
    salePrice2: product?.prices.sale[1].amount ?? 0,
    salePrice3: product?.prices.sale[2].amount ?? 0,
    saleCurrency1: product?.prices.sale[0].currencyId ?? 1,
    saleCurrency2: product?.prices.sale[1].currencyId ?? 0,
    saleCurrency3: product?.prices.sale[2].currencyId ?? 0,
    averageCost: product?.prices.costs.average ?? 0,
    lastCost: product?.prices.costs.last ?? 0,
    previousCost: product?.prices.costs.previous ?? 0,
    costCurrency: product?.prices.costs.currencyId ?? 1,
    adValorem: product?.prices.costs.adValorem ?? 0,
    minimum: product?.warehouse.minimum ?? 0,
    maximum: product?.warehouse.maximum ?? 0,
    location: product?.warehouse.location ?? "",
    ean: product?.warehouse.ean ?? "",
    upc: product?.warehouse.upc ?? "",
    primaryAccount: product?.warehouse.accounts.primary ?? "",
    secondaryAccount: product?.warehouse.accounts.secondary ?? "",
    costOfSalesAccount: product?.warehouse.accounts.costOfSales ?? "",
  }
}

export function toProductMutationInput(
  values: ProductFormValues,
): ProductMutationInput {
  return {
    code: values.code,
    description: values.description,
    classification: {
      type: values.type,
      unitId: values.unitId,
      familyCode: values.familyCode,
      hasPhoto: values.hasPhoto,
    },
    prices: {
      sale: [
        { amount: values.salePrice1, currencyId: values.saleCurrency1 },
        { amount: values.salePrice2, currencyId: values.saleCurrency2 },
        { amount: values.salePrice3, currencyId: values.saleCurrency3 },
      ],
      costs: {
        average: values.averageCost,
        last: values.lastCost,
        previous: values.previousCost,
        currencyId: values.costCurrency,
        adValorem: values.adValorem,
      },
    },
    warehouse: {
      minimum: values.minimum,
      maximum: values.maximum,
      location: values.location,
      ean: values.ean,
      upc: values.upc,
      accounts: {
        primary: values.primaryAccount,
        secondary: values.secondaryAccount,
        costOfSales: values.costOfSalesAccount,
      },
    },
  }
}

function hasEditValues(values: object) {
  return Object.values(values).some((value) => value !== undefined)
}

export function toProductCatalogEditInput(
  product: Product,
  changes: ProductCatalogEditChanges,
): ProductCatalogEditInput | null {
  if (!product.editing?.writable) return null

  const initial = {
    ...getProductFormDefaults(product),
    type: product.classification.type,
    usesColorAndSize: product.classification.usesColorAndSize,
    salesLastSixWeeks: product.accumulated.salesLastSixWeeks ?? product.accumulated.salesLastSixMonths,
    inventoryDays: product.accumulated.inventoryDays,
  }
  const editable = new Set(product.editing.editableFields)
  const changesOnly = Object.fromEntries(Object.entries(changes).filter(([name, value]) => (
    editable.has(name) && value !== initial[name as keyof ProductCatalogEditChanges]
  ))) as ProductCatalogEditChanges
  if (!hasEditValues(changesOnly)) return null

  const c = changesOnly
  const classification = { type: c.type, unitId: c.unitId, familyCode: c.familyCode, usesColorAndSize: c.usesColorAndSize }
  const sale: NonNullable<NonNullable<ProductCatalogEditInput["prices"]>["sale"]> = [
    { amount: c.salePrice1, currencyId: c.saleCurrency1 },
    { amount: c.salePrice2, currencyId: c.saleCurrency2 },
    { amount: c.salePrice3, currencyId: c.saleCurrency3 },
  ]
  const costs = { average: c.averageCost, last: c.lastCost, previous: c.previousCost, currencyId: c.costCurrency, adValorem: c.adValorem }
  const accounts = { primary: c.primaryAccount, secondary: c.secondaryAccount, costOfSales: c.costOfSalesAccount }
  const warehouse = {
    minimum: c.minimum, maximum: c.maximum, location: c.location, ean: c.ean, upc: c.upc,
    accounts: hasEditValues(accounts) ? accounts : undefined,
  }
  const accumulated = { salesLastSixWeeks: c.salesLastSixWeeks, inventoryDays: c.inventoryDays }
  const prices = { sale: sale.some(hasEditValues) ? sale : undefined, costs: hasEditValues(costs) ? costs : undefined }

  return {
    revision: product.editing.revision,
    description: c.description,
    classification: hasEditValues(classification) ? classification : undefined,
    prices: hasEditValues(prices) ? prices : undefined,
    warehouse: hasEditValues(warehouse) ? warehouse : undefined,
    accumulated: hasEditValues(accumulated) ? accumulated : undefined,
  }
}
