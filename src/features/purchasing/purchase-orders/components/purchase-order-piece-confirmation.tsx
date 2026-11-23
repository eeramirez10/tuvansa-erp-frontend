import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useId } from "react"

import { purchaseOrderKeys, refreshPurchaseOrder } from "@/features/purchasing/purchase-orders/logic"
import type { PurchaseOrder } from "@/features/purchasing/purchase-orders/model"
import {
  confirmPurchaseOrderPieces,
  getPurchaseOrderPieceConfirmation,
} from "@/features/purchasing/purchase-orders/services/purchase-order-piece-confirmation-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { Spinner } from "@/shared/ui/spinner"

export function PurchaseOrderPieceConfirmation({ purchaseOrder, onClose }: {
  purchaseOrder: PurchaseOrder
  onClose: () => void
}) {
  const headingId = useId()
  const queryClient = useQueryClient()
  const { id } = purchaseOrder
  const preview = useQuery({
    queryKey: [...purchaseOrderKeys.detail(id), "pieces-confirmation"],
    queryFn: ({ signal }) => getPurchaseOrderPieceConfirmation(id, signal),
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  })
  const confirmation = useMutation({
    mutationFn: (input: Parameters<typeof confirmPurchaseOrderPieces>[1]) => confirmPurchaseOrderPieces(id, input),
    onSuccess: async (order) => {
      await Promise.all([
        refreshPurchaseOrder(queryClient, order),
        queryClient.invalidateQueries({ queryKey: ["inventories", "products"] }),
      ])
      onClose()
    },
  })
  const loading = preview.isPending || preview.isFetching
  const ready = preview.data?.canWrite && !loading && !preview.isError
  const error = confirmation.error ?? preview.error
  const count = preview.data?.pieceCount ?? 0

  return (
    <form aria-labelledby={headingId} className="grid gap-2" onSubmit={(event) => {
      event.preventDefault()
      if (ready && preview.data && !confirmation.isPending) confirmation.mutate(preview.data)
    }} onKeyDown={(event) => {
      if (event.key !== "Escape") return
      event.preventDefault()
      event.stopPropagation()
      if (!confirmation.isPending) onClose()
    }}>
      <h3 className="text-xs font-medium" id={headingId}>Confirmar piezas</h3>
      {loading && <div className="flex min-h-10 items-center justify-center"><Spinner /></div>}
      {ready && <p>{count === 1 ? "¿Confirmar el registro de la pieza?" : `¿Confirmar los ${count} registros de piezas?`}</p>}
      {!loading && preview.data?.reason && <Alert><AlertDescription>{preview.data.reason}</AlertDescription></Alert>}
      {error && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(error)}</AlertDescription></Alert>}
      <div className="flex justify-end gap-1">
        <Button autoFocus disabled={confirmation.isPending} onClick={onClose} size="sm" type="button" variant="outline">Cancelar</Button>
        {ready && <Button disabled={confirmation.isPending} size="sm" type="submit">{confirmation.isPending && <Spinner />}OK</Button>}
      </div>
    </form>
  )
}
