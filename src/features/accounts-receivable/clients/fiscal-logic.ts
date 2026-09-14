import { queryOptions } from "@tanstack/react-query"
import { clientKeys } from "@/features/accounts-receivable/clients/logic"
import { getClientFiscal } from "@/features/accounts-receivable/clients/services/client-fiscal-service"

export const clientFiscalQueryOptions = (id: number) => queryOptions({
  queryKey: [...clientKeys.detail(id), "fiscal-verification"],
  queryFn: ({ signal }) => getClientFiscal(id, signal),
  staleTime: 0,
})
