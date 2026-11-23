import { useMutation, useQuery } from "@tanstack/react-query"

import { purchaseOrderKeys } from "@/features/purchasing/purchase-orders/logic"
import type { PurchaseOrder } from "@/features/purchasing/purchase-orders/model"
import {
  buildPurchaseOrderPrintDocument,
  printPurchaseOrder,
  type PurchaseOrderPrintDetails,
} from "@/features/purchasing/purchase-orders/components/purchase-order-print"
import { apiClient } from "@/shared/api/api-client"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"
import { Spinner } from "@/shared/ui/spinner"

export function PurchaseOrderPrintDialog({ id, number, confirmed, onClose }: {
  id: number
  number: string
  confirmed: boolean
  onClose: () => void
}) {
  const action = confirmed ? "print-confirmation" : "print"
  const report = useQuery({
    queryKey: [...purchaseOrderKeys.detail(id), action],
    queryFn: async ({ signal }) => {
      const response = await apiClient.get<{ data: { order: PurchaseOrder; details: PurchaseOrderPrintDetails } }>(
        `/purchasing/purchase-orders/${id}/actions/${action}`, { signal },
      )
      return response.data.data
    },
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  })
  const print = useMutation({
    mutationFn: ({ order, details }: NonNullable<typeof report.data>) => printPurchaseOrder(order, { confirmed, details }),
  })
  const title = confirmed ? "Imprimir Conf." : "Imprimir"
  const data = !report.isFetching && !report.isError ? report.data : undefined
  const error = print.error ?? report.error
  return (
    <ErpDataDialog defaultWidth={1000} description={number} title={title} onOpenChange={(open) => { if (!open && !print.isPending) onClose() }}>
      <ErpDataDialogBody className="grid gap-2">
        {report.isFetching && <div className="grid h-32 place-items-center"><Spinner /></div>}
        {error && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(error)}</AlertDescription></Alert>}
        {data && (
          <iframe className="h-[min(64vh,44rem)] w-full rounded-sm border bg-white" sandbox=""
            srcDoc={buildPurchaseOrderPrintDocument(data.order, { confirmed, details: data.details })}
            title={confirmed ? "Vista previa de orden confirmada" : "Vista previa de orden de compra"} />
        )}
        <div className="flex justify-end gap-1">
          <Button disabled={print.isPending} onClick={onClose} size="sm" type="button" variant="outline">Cerrar</Button>
          <Button disabled={!data || print.isPending} onClick={() => { if (data) print.mutate(data) }} size="sm" type="button">
            {print.isPending && <Spinner />}Imprimir
          </Button>
        </div>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
