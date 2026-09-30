import { normalizeOrderWarehouse } from "@/features/sales/orders/order-warehouse"
import { queryOptions } from "@tanstack/react-query"
import type { CaptureCustomerSearchCriteria, CaptureProductSearchCriteria } from "@/features/sales/orders/capture-model"
import { orderKeys } from "@/features/sales/orders/logic"
import { getCaptureCustomer, getCaptureOptions, getCaptureProduct, searchCaptureCustomers, searchCaptureProducts } from "@/features/sales/orders/services/order-capture-service"

export const captureOptionsQuery = () => queryOptions({ queryKey: [...orderKeys.all, "capture", "options"], queryFn: ({signal}) => getCaptureOptions(signal), staleTime: 0 })
export const captureCustomerQuery = (code: string) => queryOptions({ queryKey: [...orderKeys.all, "capture", "customer", code], queryFn: ({signal}) => getCaptureCustomer(code, signal), staleTime: 0 })
export const captureCustomerMatchesQuery = (criteria: CaptureCustomerSearchCriteria) => queryOptions({ queryKey: [...orderKeys.all, "capture", "customer-matches", criteria.code ?? "", criteria.name ?? "", criteria.taxId ?? ""], queryFn: ({signal}) => searchCaptureCustomers(criteria, signal), staleTime: 0 })
export const captureProductQuery = (code: string, warehouse: string, typeCode: string, customerCode: string) => {
  const warehouseCode = normalizeOrderWarehouse(warehouse)
  return queryOptions({ queryKey: [...orderKeys.all, "capture", "product", code, warehouseCode, typeCode, customerCode], queryFn: ({signal}) => getCaptureProduct(code, warehouseCode, typeCode, customerCode, signal), staleTime: 0 })
}
export const captureProductMatchesQuery = (criteria: CaptureProductSearchCriteria, warehouse: string) => {
  const warehouseCode = normalizeOrderWarehouse(warehouse)
  return queryOptions({ queryKey: [...orderKeys.all, "capture", "product-matches", warehouseCode, criteria.code ?? "", criteria.description ?? "", criteria.supplierCode ?? ""], queryFn: ({signal}) => searchCaptureProducts(criteria, warehouseCode, signal), staleTime: 0 })
}
