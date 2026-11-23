import type { LoaderFunctionArgs } from "react-router"
import { useSuspenseQuery } from "@tanstack/react-query"
import { redirect, useParams } from "react-router"
import { queryClient } from "@/app/providers/query-client"
import { paths } from "@/app/router/paths"
import { bankAccountKeys, bankAccountQueryOptions, firstBankAccountQueryOptions } from "@/features/treasury/banking/logic"
import { BankAccountCatalogPage } from "@/features/treasury/banking/pages/bank-account-catalog-page"

export async function loader({ params }: LoaderFunctionArgs) {
  if (params.bankAccountId === undefined) {
    const account = await queryClient.fetchQuery(firstBankAccountQueryOptions())
    if (!account) return null
    queryClient.setQueryData(bankAccountKeys.detail(account.id), account)
    return redirect(paths.bankAccount(account.id))
  }
  const id = Number(params.bankAccountId)
  if (!Number.isInteger(id) || id <= 0) throw new Response("Identificador de cuenta bancaria inválido", { status: 400 })
  await queryClient.ensureQueryData(bankAccountQueryOptions(id))
  return null
}

function BankAccountDetail({ id }: { id: number }) {
  const { data: account } = useSuspenseQuery(bankAccountQueryOptions(id))
  return <BankAccountCatalogPage account={account} />
}

export function Component() {
  const { bankAccountId } = useParams()
  return bankAccountId ? <BankAccountDetail id={Number(bankAccountId)} /> : <BankAccountCatalogPage />
}
