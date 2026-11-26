import { useMutation, useQuery } from "@tanstack/react-query"

import { buildOrderPrintDocument } from "@/features/sales/orders/components/order-print-document"
import { orderQueryOptions } from "@/features/sales/orders/logic"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"
import { Spinner } from "@/shared/ui/spinner"
import { printHtmlDocument } from "@/shared/utils/print-html-document"

export function OrderPrintDialog({ id, number, onClose }: { id: number; number: string; onClose: () => void }) {
  const report = useQuery({
    ...orderQueryOptions(id),
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    retry: false,
  })
  const order = !report.isFetching && !report.isError ? report.data : undefined
  const html = order ? buildOrderPrintDocument(order) : undefined
  const print = useMutation({
    mutationFn: ({ document, folio }: { document: string; folio: string }) => printHtmlDocument(document, folio),
  })
  const error = print.error ?? report.error

  return (
    <ErpDataDialog defaultWidth={900} description={number} title="Imprimir"
      tone="sales" onOpenChange={open => { if (!open && !print.isPending) onClose() }}>
      <ErpDataDialogBody className="grid gap-2">
        {report.isFetching && <div className="grid h-32 place-items-center"><Spinner /></div>}
        {error && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(error)}</AlertDescription></Alert>}
        {html && <iframe title="Vista previa del folio" sandbox="" srcDoc={html}
          className="h-[min(64vh,44rem)] w-full rounded-sm border bg-white" />}
        <footer className="flex justify-end gap-2">
          {report.isError && <Button size="sm" variant="outline" disabled={report.isFetching}
            onClick={() => { print.reset(); void report.refetch() }}>Reintentar</Button>}
          <Button size="sm" variant="outline" disabled={print.isPending} onClick={onClose}>Cerrar</Button>
          <Button size="sm" disabled={!order || !html || print.isPending}
            onClick={() => { if (order && html) print.mutate({ document: html, folio: order.number }) }}>
            {print.isPending && <Spinner />}Imprimir
          </Button>
        </footer>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
