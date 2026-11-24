import { useMutation, useQuery } from "@tanstack/react-query"

import { printPurchaseOrderDocument } from "@/features/purchasing/purchase-orders/components/purchase-order-print"
import { buildPurchaseReceptionPedimentoReport } from "@/features/purchasing/purchase-receptions/components/purchase-reception-pedimento-report"
import { purchaseReceptionPedimentoReportQueryOptions } from "@/features/purchasing/purchase-receptions/logic"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"
import { Spinner } from "@/shared/ui/spinner"

export function PurchaseReceptionPedimentoReportDialog({ id, number, onClose }: {
  id: number
  number: string
  onClose: () => void
}) {
  const report = useQuery(purchaseReceptionPedimentoReportQueryOptions(id))
  const print = useMutation({ mutationFn: (html: string) => printPurchaseOrderDocument(html, "Reporte pedimento") })
  const html = report.data && !report.isFetching && !report.isError
    ? buildPurchaseReceptionPedimentoReport(report.data) : undefined
  const error = report.error ?? print.error

  return (
    <ErpDataDialog defaultWidth={1050} description={number} title="Reporte pedimento"
      onOpenChange={(open) => { if (!open && !print.isPending) onClose() }}>
      <ErpDataDialogBody className="grid gap-2">
        {report.isFetching && <div className="grid h-32 place-items-center"><Spinner /></div>}
        {error && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(error)}</AlertDescription></Alert>}
        {html && <iframe className="h-[min(64vh,44rem)] w-full rounded-sm border bg-white" sandbox=""
          srcDoc={html} title="Vista previa de Reporte pedimento" />}
        <div className="flex justify-end gap-1">
          <Button disabled={print.isPending} onClick={onClose} size="sm" type="button" variant="outline">Cerrar</Button>
          <Button disabled={!html || print.isPending} onClick={() => { if (html) print.mutate(html) }} size="sm" type="button">
            {print.isPending && <Spinner />}Imprimir
          </Button>
        </div>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
