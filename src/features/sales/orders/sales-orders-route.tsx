import type { LoaderFunctionArgs } from "react-router"
import { redirect } from "react-router"
import { queryClient } from "@/app/providers/query-client"
import { paths } from "@/app/router/paths"
import { orderQueryOptions, orderSearchQueryOptions } from "@/features/sales/orders/logic"
import { OrderCatalogPage } from "@/features/sales/orders/pages/order-catalog-page"

export async function loader({ params }: LoaderFunctionArgs) {
  if (params.orderId === undefined) {
    const captured = await queryClient.ensureQueryData(orderSearchQueryOptions({ q: "P010773", page: 1, pageSize: 1 }))
    const order = captured.data[0] ?? (await queryClient.ensureQueryData(orderSearchQueryOptions({ page: 1, pageSize: 1 }))).data[0]
    if (!order) throw new Response("No hay pedidos disponibles", { status: 404 })
    return redirect(paths.salesOrder(order.id))
  }
  const orderId = Number(params.orderId)
  if (!Number.isInteger(orderId) || orderId <= 0) throw new Response("Identificador de pedido inválido", { status: 400 })
  await queryClient.ensureQueryData(orderQueryOptions(orderId)); return null
}
export function Component() { return <OrderCatalogPage /> }
