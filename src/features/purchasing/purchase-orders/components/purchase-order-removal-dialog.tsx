import { useMutation, useQuery } from "@tanstack/react-query"
import { purchaseOrderRemovalQueryOptions } from "@/features/purchasing/purchase-orders/logic"
import type { PurchaseOrderRemovalResult, PurchaseOrderRemoveInput } from "@/features/purchasing/purchase-orders/model"
import { removePurchaseOrder } from "@/features/purchasing/purchase-orders/services/purchase-order-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"
import { Spinner } from "@/shared/ui/spinner"

export function PurchaseOrderRemovalDialog({ id, onClose, onRemoved }: {
  id: number
  onClose: () => void
  onRemoved: (result: PurchaseOrderRemovalResult) => void
}) {
  const query = useQuery(purchaseOrderRemovalQueryOptions(id))
  const removal = useMutation({
    mutationFn: (confirmation: PurchaseOrderRemoveInput) => removePurchaseOrder(id, confirmation),
    onSuccess: onRemoved,
  })
  const request = query.data
  const canRemove = request?.canRemove && !query.isError && !query.isFetching
  const error = removal.isError ? getApiErrorMessage(removal.error) : query.isError ? getApiErrorMessage(query.error) : ""

  return (
    <ErpDataDialog defaultWidth={442} title="Baja de orden de compra" description={request?.number ?? "Confirmación"}
      onOpenChange={(open) => { if (!open && !removal.isPending) onClose() }}>
      <ErpDataDialogBody>
        <form className="grid gap-2" onSubmit={(event) => {
          event.preventDefault()
          if (request && canRemove && !removal.isPending) {
            const { number, revision, legacyVersion } = request
            removal.mutate({ number, revision, legacyVersion })
          }
        }} onKeyDown={(event) => {
          if (event.key === "Escape" && !removal.isPending) {
            event.preventDefault()
            event.stopPropagation()
            onClose()
          }
        }}>
          {query.isFetching && <div className="flex min-h-12 items-center justify-center"><Spinner /></div>}
          {request && !query.isFetching && !query.isError && (request.canRemove
            ? <p>¿Está seguro de querer dar de baja la orden de compra <strong>{request.number}</strong> de <strong>{request.supplier.code}</strong>?</p>
            : <Alert><AlertDescription>{request.reason}</AlertDescription></Alert>)}
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          <div className="flex justify-end gap-1">
            <Button autoFocus disabled={removal.isPending} onClick={onClose} size="sm" type="button" variant="outline">
              {canRemove ? "No" : "Cerrar"}
            </Button>
            {canRemove && <Button disabled={removal.isPending} size="sm" type="submit" variant="destructive">
              {removal.isPending && <Spinner />}Sí
            </Button>}
          </div>
        </form>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
