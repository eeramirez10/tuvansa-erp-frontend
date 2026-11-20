import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query"

import type {
  Product,
  ProductCustomerOrdersStarFilters,
  ProductCustomerSalesFilters,
  ProductFormValues,
  ProductLedgerFilters,
  ProductMutationInput,
  ProductPanelKey,
} from "@/features/inventories/products/model"
import {
  getProduct,
  getFirstActiveProduct,
  getProductPanel,
  searchProducts,
  type ProductSearchCriteria,
} from "@/features/inventories/products/services/product-service"

export const productKeys = {
  all: ["inventories", "products"] as const,
  firstActive: () => [...productKeys.all, "first-active"] as const,
  detail: (productId: number) => [...productKeys.all, "detail", productId] as const,
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

export function productCustomerOrdersQueryOptions(
  productId: number,
  excludeFulfilled: boolean,
  panel: "customer-orders" | "customer-quotes" = "customer-orders",
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
  panel: "customer-sales" | "customer-sales-star",
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
