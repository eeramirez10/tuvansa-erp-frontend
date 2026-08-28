import type { LoaderFunctionArgs } from "react-router"
import { redirect } from "react-router"
import { queryClient } from "@/app/providers/query-client"
import { paths } from "@/app/router/paths"
import {
  firstInvoiceQueryOptions,
  invoiceKeys,
  invoiceQueryOptions,
} from "@/features/sales/invoicing/logic"
import { InvoiceCatalogPage } from "@/features/sales/invoicing/pages/invoice-catalog-page"

export async function loader({ params }: LoaderFunctionArgs) {
  if (params.invoiceId === undefined) {
    const invoice = await queryClient.ensureQueryData(firstInvoiceQueryOptions())
    queryClient.setQueryData(invoiceKeys.detail(invoice.id), invoice)
    return redirect(paths.salesInvoice(invoice.id))
  }

  const invoiceId = Number(params.invoiceId)
  if (!Number.isInteger(invoiceId) || invoiceId <= 0) {
    throw new Response("Identificador de factura inválido", { status: 400 })
  }
  await queryClient.ensureQueryData(invoiceQueryOptions(invoiceId))
  return null
}

export function Component() {
  return <InvoiceCatalogPage />
}
