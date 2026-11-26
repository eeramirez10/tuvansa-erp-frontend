import { useRef } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { orderKeys } from "@/features/sales/orders/logic"
import type { Order, OrderDuplicatePreview } from "@/features/sales/orders/model"
import { duplicateOrder, getOrderDuplicatePreview } from "@/features/sales/orders/services/order-service"
import { companySessionKey } from "@/features/startup/multicia/logic"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody, ErpDataTableViewport } from "@/shared/ui/erp-data-dialog"
import { Spinner } from "@/shared/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

type Props = { order: Order; onOpenChange: (open: boolean) => void; onSaved: (order: Order) => void }

export function OrderDuplicateDialog({ order, onOpenChange, onSaved }: Props) {
  const client = useQueryClient()
  const companyId = Number(sessionStorage.getItem(companySessionKey) ?? "1")
  const requestKeys = useRef(new Map<string, string>())
  const preview = useQuery({
    queryKey: [...orderKeys.detail(order.id), "duplicate-preview", companyId],
    queryFn: ({ signal }) => getOrderDuplicatePreview(order.id, companyId, signal),
    staleTime: 0,
    retry: false,
  })
  const save = useMutation({
    mutationFn: ({ revision, orderedAt }: OrderDuplicatePreview["summary"]) => {
      const requestKey = requestKeys.current.get(revision) ?? crypto.randomUUID()
      requestKeys.current.set(revision, requestKey)
      return duplicateOrder(order.id, companyId, { revision, orderedAt, requestKey })
    },
    retry: false,
    onSuccess: saved => {
      void client.invalidateQueries({ queryKey: orderKeys.all })
      void client.invalidateQueries({ queryKey: ["inventories", "products"] })
      onSaved(saved)
    },
  })
  const data = preview.data?.summary?.revision ? preview.data : undefined
  const total = data?.summary.total.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <ErpDataDialog title="Duplica Pedido" description={`Copia del pedido ${order.number}`} tone="sales"
      className="sm:max-w-xl" onOpenChange={open => { if (!save.isPending) onOpenChange(open) }}>
      <ErpDataDialogBody className="grid gap-2">
        {preview.isPending && <Spinner />}
        {(preview.isError || save.isError) && <Alert variant="destructive">
          <AlertDescription>{getApiErrorMessage(save.error ?? preview.error)}</AlertDescription>
        </Alert>}
        {preview.isSuccess && !data && <Alert variant="destructive"><AlertDescription>La API todavía no ofrece la vista previa de Duplicar.</AlertDescription></Alert>}
        {data && <>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <div><dt>Origen</dt><dd className="font-medium">{data.order.number}</dd></div>
            <div><dt>Fecha</dt><dd>{data.summary.orderedAt}</dd></div>
            <div><dt>Cliente</dt><dd>{data.summary.customer.code} · {data.summary.customer.name}</dd></div>
            <div><dt>Almacén</dt><dd>{data.summary.warehouse}</dd></div>
            <div><dt>Sucursal</dt><dd>{data.summary.branch}</dd></div>
            <div><dt>Agente</dt><dd>{data.summary.agent}</dd></div>
          </dl>
          {data.items.length === 0 && <p className="text-sm">La copia se creará sin partidas. El origen no tiene cantidades para copiar.</p>}
          {data.items.length > 0 && <ErpDataTableViewport className="max-h-56">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Código</TableHead><TableHead>Descripción</TableHead>
                <TableHead className="text-right">Cantidad</TableHead><TableHead>U.M.</TableHead>
              </TableRow></TableHeader>
              <TableBody>{data.items.map((line, index) => <TableRow key={index}>
                <TableCell>{line.productCode}</TableCell><TableCell>{line.description}</TableCell>
                <TableCell className="text-right">{line.quantity}</TableCell><TableCell>{line.unit}</TableCell>
              </TableRow>)}</TableBody>
            </Table>
          </ErpDataTableViewport>}
          <p className="text-right text-xs font-medium">Total {total} {data.summary.currency}</p>
        </>}
        <footer className="flex justify-end gap-2">
          {(preview.isError || save.isError) && <Button size="sm" variant="outline" disabled={save.isPending || preview.isFetching}
            onClick={() => { save.reset(); void preview.refetch() }}>Actualizar vista previa</Button>}
          <Button size="sm" disabled={!data || preview.isError || preview.isFetching || save.isPending}
            onClick={() => { if (data) save.mutate(data.summary) }}>{save.isPending && <Spinner />}OK</Button>
          <Button size="sm" variant="outline" disabled={save.isPending} onClick={() => onOpenChange(false)}>Cancelar</Button>
        </footer>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
