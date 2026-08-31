import type { LoaderFunctionArgs } from "react-router"
import { redirect } from "react-router"
import { queryClient } from "@/app/providers/query-client"
import { paths } from "@/app/router/paths"
import { firstSupplierQueryOptions, supplierKeys, supplierQueryOptions } from "@/features/accounts-payable/suppliers/logic"
import { SupplierCatalogPage } from "@/features/accounts-payable/suppliers/pages/supplier-catalog-page"

export async function loader({ params }: LoaderFunctionArgs) {
  if (params.supplierId === undefined) {
    const firstSupplier = await queryClient.ensureQueryData(firstSupplierQueryOptions())
    queryClient.setQueryData(supplierKeys.detail(firstSupplier.id), firstSupplier)
    return redirect(paths.accountsPayableSupplier(firstSupplier.id))
  }

  const supplierId = Number(params.supplierId)
  if (!Number.isInteger(supplierId) || supplierId <= 0) {
    throw new Response("Identificador de proveedor inválido", { status: 400 })
  }
  await queryClient.ensureQueryData(supplierQueryOptions(supplierId))
  return null
}

export function Component() {
  return <SupplierCatalogPage />
}
