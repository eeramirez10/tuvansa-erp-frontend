import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { purchaseOrderConversionQueryOptions, refreshPurchaseOrder } from "@/features/purchasing/purchase-orders/logic"
import type { PurchaseOrder, PurchaseOrderConversion } from "@/features/purchasing/purchase-orders/model"
import { convertPurchaseOrder } from "@/features/purchasing/purchase-orders/services/purchase-order-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"
import { Spinner } from "@/shared/ui/spinner"

export function PurchaseOrderConversionDialog({ purchaseOrder, onClose }: {
  purchaseOrder: PurchaseOrder
  onClose: () => void
}) {
  const { id, number } = purchaseOrder
  const queryClient = useQueryClient()
  const query = useQuery(purchaseOrderConversionQueryOptions(id))
  const conversion = useMutation({
    mutationFn: (data: PurchaseOrderConversion) =>
      convertPurchaseOrder(id, data.documentKind === "order" ? "quote" : "order", data),
    onSuccess: (order) => {
      onClose()
      void refreshPurchaseOrder(queryClient, order)
      void queryClient.invalidateQueries({ queryKey: ["inventories", "products"] })
    },
  })
  const ready = query.data?.canWrite && !query.isFetching && !query.isError
  const error = conversion.error ?? query.error
  return (
    <ErpDataDialog defaultWidth={425} description={number} title="Cotiz"
      onOpenChange={(open) => { if (!open && !conversion.isPending) onClose() }}>
      <ErpDataDialogBody>
        <form className="grid gap-2" onSubmit={(event) => {
          event.preventDefault()
          if (ready && query.data && !conversion.isPending) conversion.mutate(query.data)
        }}>
          {query.isFetching && <div className="flex min-h-12 items-center justify-center"><Spinner /></div>}
          {ready && <p>¿Convertir {number} en {query.data?.documentKind === "order" ? "cotización" : "pedido"}?</p>}
          {!query.isFetching && query.data?.reason && <Alert><AlertDescription>{query.data.reason}</AlertDescription></Alert>}
          {error && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(error)}</AlertDescription></Alert>}
          <div className="flex justify-end gap-1">
            <Button autoFocus disabled={conversion.isPending} onClick={onClose} size="sm" type="button" variant="outline">Cancelar</Button>
            {ready && <Button disabled={conversion.isPending} size="sm" type="submit">{conversion.isPending && <Spinner />}OK</Button>}
          </div>
        </form>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
