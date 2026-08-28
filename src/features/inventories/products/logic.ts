import { queryOptions } from "@tanstack/react-query"

import type {
  Product,
  ProductFormValues,
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
