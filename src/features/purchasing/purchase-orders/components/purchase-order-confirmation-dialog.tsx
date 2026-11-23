import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { purchaseOrderConfirmationQueryOptions, purchaseOrderKeys } from "@/features/purchasing/purchase-orders/logic"
import type { PurchaseOrder, PurchaseOrderConfirmation, PurchaseOrderConfirmationMode } from "@/features/purchasing/purchase-orders/model"
import { confirmPurchaseOrder } from "@/features/purchasing/purchase-orders/services/purchase-order-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"
import { Spinner } from "@/shared/ui/spinner"

export function PurchaseOrderConfirmationDialog({ purchaseOrder, initialMode, onClose }: {
  purchaseOrder: PurchaseOrder
  initialMode: PurchaseOrderConfirmationMode
  onClose: () => void
}) {
  const [mode, setMode] = useState(initialMode)
  const queryClient = useQueryClient()
  const { id, number } = purchaseOrder
  const query = useQuery(purchaseOrderConfirmationQueryOptions(id))
  const confirmation = useMutation({
    mutationFn: (data: PurchaseOrderConfirmation) => confirmPurchaseOrder(id, mode, data),
    onSuccess: async (order) => {
      const detail = purchaseOrderKeys.detail(id)
      await queryClient.cancelQueries({ queryKey: detail })
      queryClient.setQueryData(detail, order)
      onClose()
      void queryClient.invalidateQueries({ queryKey: detail, predicate: (entry) => entry.queryKey.length > detail.length })
      void queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.searches() })
      void queryClient.invalidateQueries({ queryKey: ["inventories", "products"] })
    },
  })
  const ready = query.data?.canWrite && !query.isFetching && !query.isError
  const error = confirmation.isError ? getApiErrorMessage(confirmation.error) : query.isError ? getApiErrorMessage(query.error) : ""
  return (
    <ErpDataDialog defaultWidth={435} description={number} title={mode === "confirm" ? "Confirmar todo" : "Desconfirmar todo"}
      onOpenChange={(open) => { if (!open && !confirmation.isPending) onClose() }}>
      <ErpDataDialogBody>
        <form className="grid gap-2" onSubmit={(event) => {
          event.preventDefault()
          if (ready && query.data && !confirmation.isPending) confirmation.mutate(query.data)
        }} onKeyDown={(event) => {
          if (event.key === "Escape" && !confirmation.isPending) {
            event.preventDefault()
            event.stopPropagation()
            onClose()
          }
        }}>
          {query.isFetching && <div className="flex min-h-12 items-center justify-center"><Spinner /></div>}
          {ready && <p>{mode === "confirm" ? "¿Desea asignar todo el pedido?" : "¿Desea des-asignar todo el pedido?"}</p>}
          {query.data && !query.data.canWrite && !query.isFetching && <Alert><AlertDescription>{query.data.reason}</AlertDescription></Alert>}
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          <div className="flex justify-end gap-1">
            {ready && mode === "confirm" && query.data?.hasAssignments && (
              <Button className="mr-auto" disabled={confirmation.isPending} onClick={() => { confirmation.reset(); setMode("unconfirm") }}
                size="sm" type="button" variant="outline">Desconfirmar todo</Button>
            )}
            <Button autoFocus disabled={confirmation.isPending} onClick={onClose} size="sm" type="button" variant="outline">{ready ? "No" : "Cerrar"}</Button>
            {ready && <Button disabled={confirmation.isPending} size="sm" type="submit">{confirmation.isPending && <Spinner />}Sí</Button>}
          </div>
        </form>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
