import { useMutation, useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"

import {
  buildPurchaseOrderLabelsDocument,
  purchaseOrderLabelTypes,
  type PurchaseOrderLabelLine,
  type PurchaseOrderLabelType,
} from "@/features/purchasing/purchase-orders/components/purchase-order-labels"
import { printPurchaseOrderDocument } from "@/features/purchasing/purchase-orders/components/purchase-order-print"
import { purchaseOrderKeys } from "@/features/purchasing/purchase-orders/logic"
import { apiClient } from "@/shared/api/api-client"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Spinner } from "@/shared/ui/spinner"

export function PurchaseOrderLabelsDialog({ id, number, selectedLineIds, onClose }: {
  id: number
  number: string
  selectedLineIds?: readonly number[]
  onClose: () => void
}) {
  const [type, setType] = useState<PurchaseOrderLabelType>("A")
  const labels = useQuery({
    queryKey: [...purchaseOrderKeys.detail(id), "labels"],
    queryFn: async ({ signal }) => {
      const response = await apiClient.get<{ data: { lines: PurchaseOrderLabelLine[] } }>(
        `/purchasing/purchase-orders/${id}/actions/labels`, { signal },
      )
      return response.data.data.lines
    },
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  })
  const print = useMutation({
    mutationFn: (html: string) => printPurchaseOrderDocument(html, "Etiquetas de la orden de compra"),
  })
  const lines = !labels.isFetching && !labels.isError ? labels.data : undefined
  const preview = useMemo(() => {
    if (!lines) return {}
    try {
      return { html: buildPurchaseOrderLabelsDocument(lines, { type, orderNumber: number, selectedLineIds }) }
    } catch (error) {
      return { error: error instanceof Error ? error.message : "No fue posible preparar etiquetas." }
    }
  }, [lines, number, selectedLineIds, type])
  const error = print.error ?? labels.error
  return (
    <ErpDataDialog defaultWidth={840} description={number} title="Etiquetas"
      onOpenChange={(open) => { if (!open && !print.isPending) onClose() }}>
      <ErpDataDialogBody className="grid gap-2">
        <Select value={type} onValueChange={(value) => { if (value) { setType(value); print.reset() } }}>
          <SelectTrigger aria-label="Formato de etiqueta" className="w-full max-w-sm" size="sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            {purchaseOrderLabelTypes.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
          </SelectContent>
        </Select>
        {labels.isFetching && <div className="grid h-32 place-items-center"><Spinner /></div>}
        {error && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(error)}</AlertDescription></Alert>}
        {preview.error && <Alert><AlertDescription>{preview.error}</AlertDescription></Alert>}
        {preview.html && <iframe className="h-[min(60vh,38rem)] w-full rounded-sm border bg-white" sandbox=""
          srcDoc={preview.html} title="Vista previa de etiquetas" />}
        <div className="flex justify-end gap-1">
          <Button disabled={print.isPending} onClick={onClose} size="sm" type="button" variant="outline">Cerrar</Button>
          <Button disabled={!preview.html || print.isPending} onClick={() => { if (preview.html) print.mutate(preview.html) }} size="sm" type="button">
            {print.isPending && <Spinner />}Imprimir
          </Button>
        </div>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
