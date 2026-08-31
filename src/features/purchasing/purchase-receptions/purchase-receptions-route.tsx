import type { LoaderFunctionArgs } from "react-router"
import { redirect } from "react-router"
import { queryClient } from "@/app/providers/query-client"
import { paths } from "@/app/router/paths"
import { purchaseReceptionQueryOptions, purchaseReceptionSearchQueryOptions } from "@/features/purchasing/purchase-receptions/logic"
import { PurchaseReceptionCatalogPage } from "@/features/purchasing/purchase-receptions/pages/purchase-reception-catalog-page"

export async function loader({ params }: LoaderFunctionArgs) {
  if (params.purchaseReceptionId === undefined) {
    const result = await queryClient.ensureQueryData(purchaseReceptionSearchQueryOptions({ page: 1, pageSize: 1 }))
    const reception = result.data[0]
    if (!reception) throw new Response("No hay recepciones disponibles", { status: 404 })
    await queryClient.ensureQueryData(purchaseReceptionQueryOptions(reception.id))
    return redirect(paths.purchaseReception(reception.id))
  }
  const id = Number(params.purchaseReceptionId)
  if (!Number.isInteger(id) || id <= 0) throw new Response("Identificador de recepción inválido", { status: 400 })
  await queryClient.ensureQueryData(purchaseReceptionQueryOptions(id))
  return null
}

export function Component() {
  return <PurchaseReceptionCatalogPage />
}
