import type { LoaderFunctionArgs } from "react-router"
import { redirect } from "react-router"

import { queryClient } from "@/app/providers/query-client"
import { paths } from "@/app/router/paths"
import { clientQueryOptions, firstActiveClientQueryOptions } from "@/features/accounts-receivable/clients/logic"
import { ClientCatalogPage } from "@/features/accounts-receivable/clients/pages/client-catalog-page"

export async function loader({ params }: LoaderFunctionArgs) {
  if (params.clientId === undefined) {
    const firstClient = await queryClient.fetchQuery(firstActiveClientQueryOptions())
    if (!firstClient) return null
    return redirect(paths.accountsReceivableClient(firstClient.id))
  }

  const clientId = Number(params.clientId)
  if (!Number.isInteger(clientId) || clientId <= 0) {
    throw new Response("Identificador de cliente inválido", { status: 400 })
  }
  await queryClient.ensureQueryData(clientQueryOptions(clientId))
  return null
}

export function Component() {
  return <ClientCatalogPage />
}
