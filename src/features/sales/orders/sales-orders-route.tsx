import type { LoaderFunctionArgs } from "react-router"
import { redirect } from "react-router"
import { queryClient } from "@/app/providers/query-client"
import { paths } from "@/app/router/paths"
import { webSessionKey } from "@/features/general-data/users/logic"
import type { WebSession } from "@/features/general-data/users/model"
import { orderByNumberQueryOptions, orderKeys, orderQueryOptions } from "@/features/sales/orders/logic"
import { OrderCatalogPage } from "@/features/sales/orders/pages/order-catalog-page"
import { searchOrders } from "@/features/sales/orders/services/order-service"

export async function loader({ params }: LoaderFunctionArgs) {
  if (params.orderId === undefined) {
    if (queryClient.getQueryData<WebSession | null>(webSessionKey)?.user.access?.ownCustomersOnly) {
      const result = await searchOrders({ page: 1, pageSize: 1 })
      const first = result.data[0]
      if (!first) throw new Response("No hay pedidos de tus clientes.", { status: 404 })
      return redirect(paths.salesOrder(first.id))
    }
    const order = await queryClient.ensureQueryData(orderByNumberQueryOptions("P010773"))
    queryClient.setQueryData(orderKeys.detail(order.id), order)
    return redirect(paths.salesOrder(order.id))
  }
  const orderId = Number(params.orderId)
  if (!Number.isInteger(orderId) || orderId <= 0) throw new Response("Identificador de pedido inválido", { status: 400 })
  await queryClient.ensureQueryData(orderQueryOptions(orderId)); return null
}
export function Component() { return <OrderCatalogPage /> }
