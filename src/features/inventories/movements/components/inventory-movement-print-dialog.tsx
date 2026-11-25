import { useMutation, useQuery } from "@tanstack/react-query"

import { buildInventoryMovementPrintDocument } from "@/features/inventories/movements/components/inventory-movement-print-document"
import { movementPrintQueryOptions } from "@/features/inventories/movements/logic"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"
import { Spinner } from "@/shared/ui/spinner"
import { printHtmlDocument } from "@/shared/utils/print-html-document"

export function InventoryMovementPrintDialog({ id, document, onClose }: {
  id: number
  document: string
  onClose: () => void
}) {
  const report = useQuery(movementPrintQueryOptions(id))
  const print = useMutation({
    mutationFn: (html: string) => printHtmlDocument(html, "Documento de inventario"),
  })
  const data = !report.isFetching && !report.isError ? report.data : undefined
  const html = data ? buildInventoryMovementPrintDocument(data) : undefined
  const error = print.error ?? report.error
  return (
    <ErpDataDialog defaultWidth={860} description={document} title="Imprimir documento"
      onOpenChange={(open) => { if (!open && !print.isPending) onClose() }}>
      <ErpDataDialogBody className="grid gap-2">
        {report.isFetching && <div className="grid h-32 place-items-center"><Spinner /></div>}
        {error && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(error)}</AlertDescription></Alert>}
        {html && (
          <iframe className="h-[min(64vh,44rem)] w-full rounded-sm border bg-white" sandbox=""
            srcDoc={html} title="Vista previa de documento de inventario" />
        )}
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
