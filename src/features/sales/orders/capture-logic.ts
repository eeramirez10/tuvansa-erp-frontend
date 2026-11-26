import { normalizeOrderWarehouse } from "@/features/sales/orders/order-warehouse"
import { queryOptions } from "@tanstack/react-query"
import type { CaptureCustomerSearchCriteria, CaptureFamilyCalculation, CaptureProductSearchCriteria } from "@/features/sales/orders/capture-model"
import { orderKeys } from "@/features/sales/orders/logic"
import { getCaptureCustomer, getCaptureOptions, getCaptureProduct, getCaptureProductFamilies, searchCaptureCustomers, searchCaptureProducts } from "@/features/sales/orders/services/order-capture-service"

export const captureOptionsQuery = (companyId: number) => queryOptions({ queryKey: [...orderKeys.all, "capture", "options", companyId], queryFn: ({signal}) => getCaptureOptions(companyId, signal), staleTime: 0 })
export const captureCustomerQuery = (code: string) => queryOptions({ queryKey: [...orderKeys.all, "capture", "customer", code], queryFn: ({signal}) => getCaptureCustomer(code, signal), staleTime: 0 })
export const captureCustomerMatchesQuery = (criteria: CaptureCustomerSearchCriteria) => queryOptions({ queryKey: [...orderKeys.all, "capture", "customer-matches", criteria.code ?? "", criteria.name ?? "", criteria.taxId ?? ""], queryFn: ({signal}) => searchCaptureCustomers(criteria, signal), staleTime: 0 })
export const captureProductQuery = (code: string, warehouse: string, typeCode: string, customerCode: string) => {
  const warehouseCode = normalizeOrderWarehouse(warehouse)
  return queryOptions({ queryKey: [...orderKeys.all, "capture", "product", code, warehouseCode, typeCode, customerCode], queryFn: ({signal}) => getCaptureProduct(code, warehouseCode, typeCode, customerCode, signal), staleTime: 0 })
}
export const captureProductMatchesQuery = (criteria: CaptureProductSearchCriteria, warehouse: string) => {
  const warehouseCode = normalizeOrderWarehouse(warehouse)
  return queryOptions({ queryKey: [...orderKeys.all, "capture", "product-matches", warehouseCode, criteria.code ?? "", criteria.description ?? "", criteria.supplierCode ?? "", criteria.familyPattern ?? "", criteria.exactCode ?? "", criteria.codePrefix ?? ""], queryFn: ({signal}) => searchCaptureProducts(criteria, warehouseCode, signal), staleTime: 0 })
}

export function parseCaptureFamilyCalculation(value: string): CaptureFamilyCalculation | null {
  const expression = value.trim()
  if (!expression || expression === "1") return {}
  const exactCode = /^ICOD\s*=\s*'([^']{1,13})'$/i.exec(expression)?.[1]?.trim()
  if (exactCode) return { exactCode }

  const prefixExpression = /^mid\s*\(\s*ICOD\s*,\s*1\s*,\s*(\d{1,2})\s*\)\s*=\s*'([^']{1,13})'$/i.exec(expression)
  if (!prefixExpression) return null
  const [, length, codePrefix] = prefixExpression
  return codePrefix.trim() === codePrefix && codePrefix.length === Number(length) ? { codePrefix } : null
}

export const captureProductFamiliesQuery = () => queryOptions({
  queryKey: [...orderKeys.all, "capture", "product-families"],
  queryFn: ({ signal }) => getCaptureProductFamilies(signal),
})
