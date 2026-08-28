import type { LoaderFunctionArgs } from "react-router"
import { redirect } from "react-router"
import { queryClient } from "@/app/providers/query-client"
import { paths } from "@/app/router/paths"
import { orderByNumberQueryOptions, orderKeys, orderQueryOptions } from "@/features/sales/orders/logic"
import { OrderCatalogPage } from "@/features/sales/orders/pages/order-catalog-page"

export async function loader({ params }: LoaderFunctionArgs) {
  if (params.orderId === undefined) {
    const order = await queryClient.ensureQueryData(orderByNumberQueryOptions("P010773"))
    queryClient.setQueryData(orderKeys.detail(order.id), order)
    return redirect(paths.salesOrder(order.id))
  }
  const orderId = Number(params.orderId)
  if (!Number.isInteger(orderId) || orderId <= 0) throw new Response("Identificador de pedido inválido", { status: 400 })
  await queryClient.ensureQueryData(orderQueryOptions(orderId)); return null
}
export function Component() { return <OrderCatalogPage /> }
