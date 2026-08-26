import { apiClient } from "@/shared/api/api-client"
import type {
  Product,
  ProductMutationInput,
  ProductPanelKey,
  ProductPanelResponse,
  ProductSearchResponse,
} from "@/features/inventories/products/model"

type ItemResponse<T> = {
  data: T
}

export type ProductSearchCriteria = {
  q?: string
  status?: "active" | "inactive" | "all"
  page?: number
  pageSize?: number
}

const productPanelPaths: Record<ProductPanelKey, string> = {
  warehouses: "actions/warehouses",
  "color-size-registration": "actions/color-size-registration",
  "block-status": "actions/block-status",
  classifications: "actions/classifications",
  "extended-description": "actions/extended-description",
  "customer-discounts": "actions/discounts/customers",
  "supplier-discounts": "actions/discounts/suppliers",
  "other-data": "actions/other-data",
  specifications: "actions/specifications",
  photo: "actions/photo",
  "ct-inventory": "actions/ct-inventory",
  prices: "actions/prices",
  skus: "actions/skus",
  prepacks: "actions/prepacks",
  alternates: "purchases-production/alternates",
  components: "purchases-production/components",
  "quality-specifications": "purchases-production/quality-specifications",
  implosion: "purchases-production/implosion",
  lots: "purchases-production/lots",
  "inventory-layers": "purchases-production/inventory-layers",
  ledger: "queries/ledger",
  "customer-orders": "queries/customer-orders",
  "customer-orders-star": "queries/customer-orders/star",
  "customer-orders-ct": "queries/customer-orders/ct",
  "customer-quotes": "queries/customer-quotes",
  "customer-sales": "queries/customer-sales",
  "customer-sales-star": "queries/customer-sales/star",
  "customer-sales-ct": "queries/customer-sales/ct",
  "customer-sales-detail": "queries/customer-sales/detail",
  "sales-by-branch": "queries/sales/by-branch",
  "annual-sales": "queries/sales/annual",
  "annual-sales-summary": "queries/sales/annual-summary",
  "supplier-orders": "queries/supplier-orders",
  "supplier-orders-ct": "queries/supplier-orders/ct",
  "supplier-quotes": "queries/supplier-quotes",
  "supplier-purchases": "queries/supplier-purchases",
  "supplier-purchases-dt": "queries/supplier-purchases/dt",
  "supplier-purchases-detail": "queries/supplier-purchases/detail",
  "annual-purchases": "queries/purchases/annual",
  "annual-purchases-summary": "queries/purchases/annual-summary",
  pieces: "queries/pieces",
  "fulfilled-pieces": "queries/pieces/fulfilled",
  "work-in-progress": "queries/work-in-progress",
  "work-in-progress-ct": "queries/work-in-progress/ct",
  edi: "queries/edi",
  "pending-enablements": "queries/pending-enablements",
  documents: "queries/documents",
}

export async function searchProducts(
  criteria: ProductSearchCriteria,
  signal?: AbortSignal,
) {
  const response = await apiClient.get<ProductSearchResponse>(
    "/inventories/products",
    { params: criteria, signal },
  )
  return response.data
}

export async function getProduct(productId: number, signal?: AbortSignal) {
  const response = await apiClient.get<ItemResponse<Product>>(
    `/inventories/products/${productId}`,
    { signal },
  )
  return response.data.data
}

export async function getAdjacentProduct(
  productId: number,
  direction: "previous" | "next",
) {
  const response = await apiClient.get<ItemResponse<Product | null>>(
    `/inventories/products/${productId}/${direction}`,
  )
  return response.data.data
}

export async function createProduct(input: ProductMutationInput) {
  const response = await apiClient.post<ItemResponse<Product>>(
    "/inventories/products",
    input,
  )
  return response.data.data
}

export async function updateProduct(
  productId: number,
  input: ProductMutationInput,
) {
  const response = await apiClient.patch<ItemResponse<Product>>(
    `/inventories/products/${productId}`,
    input,
  )
  return response.data.data
}

export async function deleteProduct(productId: number) {
  await apiClient.delete(`/inventories/products/${productId}`)
}

export async function getProductPanel(
  productId: number,
  panel: ProductPanelKey,
  signal?: AbortSignal,
) {
  const pageSize = panel === "ledger" || panel === "customer-orders" ? 100 : 25
  const response = await apiClient.get<ProductPanelResponse>(
    `/inventories/products/${productId}/${productPanelPaths[panel]}`,
    { params: { page: 1, pageSize }, signal },
  )
  return response.data
}
