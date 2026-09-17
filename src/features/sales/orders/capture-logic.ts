import { queryOptions } from "@tanstack/react-query"
import { orderKeys } from "@/features/sales/orders/logic"
import { getCaptureCustomer, getCaptureOptions, getCaptureProduct, searchCaptureCustomers } from "@/features/sales/orders/services/order-capture-service"

export const captureOptionsQuery = () => queryOptions({ queryKey: [...orderKeys.all, "capture", "options"], queryFn: ({signal}) => getCaptureOptions(signal), staleTime: 0 })
export const captureCustomerQuery = (code: string) => queryOptions({ queryKey: [...orderKeys.all, "capture", "customer", code], queryFn: ({signal}) => getCaptureCustomer(code, signal), staleTime: 0 })
export const captureCustomerMatchesQuery = (query: string) => queryOptions({ queryKey: [...orderKeys.all, "capture", "customer-matches", query], queryFn: ({signal}) => searchCaptureCustomers(query, signal), staleTime: 0 })
export const captureProductQuery = (code: string, warehouse: string, typeCode: string, customerCode: string) => queryOptions({ queryKey: [...orderKeys.all, "capture", "product", code, warehouse, typeCode, customerCode], queryFn: ({signal}) => getCaptureProduct(code, warehouse, typeCode, customerCode, signal), staleTime: 0 })
