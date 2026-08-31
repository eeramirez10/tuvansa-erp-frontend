import type { LoaderFunctionArgs } from "react-router"
import { redirect } from "react-router"
import { queryClient } from "@/app/providers/query-client"
import { paths } from "@/app/router/paths"
import {
  purchaseOrderKeys,
  purchaseOrderQueryOptions,
  purchaseOrderSearchQueryOptions,
} from "@/features/purchasing/purchase-orders/logic"
import { PurchaseOrderCatalogPage } from "@/features/purchasing/purchase-orders/pages/purchase-order-catalog-page"

export async function loader({ params }: LoaderFunctionArgs) {
  if (params.purchaseOrderId === undefined) {
    const result = await queryClient.ensureQueryData(purchaseOrderSearchQueryOptions({ page: 1, pageSize: 1 }))
    const purchaseOrder = result.data[0]
    if (!purchaseOrder) throw new Response("No hay órdenes de compra disponibles", { status: 404 })
    queryClient.setQueryData(purchaseOrderKeys.detail(purchaseOrder.id), purchaseOrder)
    return redirect(paths.purchaseOrder(purchaseOrder.id))
  }
  const id = Number(params.purchaseOrderId)
  if (!Number.isInteger(id) || id <= 0) throw new Response("Identificador de orden inválido", { status: 400 })
  await queryClient.ensureQueryData(purchaseOrderQueryOptions(id))
  return null
}

export function Component() {
  return <PurchaseOrderCatalogPage />
}
