import type { LoaderFunctionArgs } from "react-router"
import { redirect } from "react-router"
import { queryClient } from "@/app/providers/query-client"
import { paths } from "@/app/router/paths"
import { accountingPolicyQueryOptions, accountingPolicySearchQueryOptions } from "@/features/accounting/policies/logic"
import { AccountingPolicyCatalogPage } from "@/features/accounting/policies/pages/accounting-policy-catalog-page"

export async function loader({ params }: LoaderFunctionArgs) {
  if (params.policyId === undefined) {
    const result = await queryClient.ensureQueryData(accountingPolicySearchQueryOptions({ page: 1, pageSize: 1 }))
    const policy = result.data[0]
    if (!policy) throw new Response("No hay pólizas disponibles", { status: 404 })
    await queryClient.ensureQueryData(accountingPolicyQueryOptions(policy.id))
    return redirect(paths.accountingPolicy(policy.id))
  }
  const id = Number(params.policyId)
  if (!Number.isInteger(id) || id <= 0) throw new Response("Identificador de póliza inválido", { status: 400 })
  await queryClient.ensureQueryData(accountingPolicyQueryOptions(id))
  return null
}

export function Component() {
  return <AccountingPolicyCatalogPage />
}
