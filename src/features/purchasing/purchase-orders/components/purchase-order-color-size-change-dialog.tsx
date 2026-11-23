import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useId, useState } from "react"

import { purchaseOrderKeys, refreshPurchaseOrder } from "@/features/purchasing/purchase-orders/logic"
import type { PurchaseOrder } from "@/features/purchasing/purchase-orders/model"
import {
  changePurchaseOrderColorSize,
  getPurchaseOrderColorSizeEditor,
} from "@/features/purchasing/purchase-orders/services/purchase-order-color-size-change-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataTableViewport } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Spinner } from "@/shared/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

const amountFormat = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 3 })
const minimum = -2147483648
const maximum = 2147483647

type Draft = { lineId: number; value: string; revision: number; legacyVersion: string }

export function PurchaseOrderColorSizeChange({ purchaseOrder, root, onClose }: {
  purchaseOrder: PurchaseOrder
  root: string
  onClose: () => void
}) {
  const headingId = useId()
  const [selectedId, setSelectedId] = useState<number>()
  const [draft, setDraft] = useState<Draft>()
  const queryClient = useQueryClient()
  const { id } = purchaseOrder
  const editor = useQuery({
    queryKey: [...purchaseOrderKeys.detail(id), "ct-editor"],
    queryFn: ({ signal }) => getPurchaseOrderColorSizeEditor(id, signal),
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  })
  const change = useMutation({
    mutationFn: (input: Draft) => changePurchaseOrderColorSize(id, {
      lineId: input.lineId,
      quantity: Number(input.value),
      revision: input.revision,
      legacyVersion: input.legacyVersion,
    }),
    onSuccess: (order) => {
      onClose()
      void refreshPurchaseOrder(queryClient, order)
      void queryClient.invalidateQueries({ queryKey: ["inventories", "products"] })
    },
  })
  const cells = editor.data?.cells.filter((cell) => cell.root === root) ?? []
  const selected = cells.find((cell) => cell.lineId === selectedId) ?? cells[0]
  const currentDraft = draft?.lineId === selected?.lineId ? draft : undefined
  const value = currentDraft?.value ?? String(selected?.quantity ?? "")
  const amount = Number(value)
  const valid = /^[+-]?\d+$/.test(value) && amount >= minimum && amount <= maximum
  const ready = Boolean(editor.data?.canWrite && selected && !editor.isFetching && !editor.isError)
  const error = change.error ?? editor.error

  return (
    <form aria-labelledby={headingId} className="grid gap-2" onSubmit={(event) => {
      event.preventDefault()
      if (!ready || !valid || !selected || !editor.data || change.isPending) return
      change.mutate(currentDraft ?? {
        lineId: selected.lineId,
        value,
        revision: editor.data.revision,
        legacyVersion: editor.data.legacyVersion,
      })
    }} onKeyDown={(event) => {
      if (event.key !== "Escape") return
      event.preventDefault()
      event.stopPropagation()
      if (!change.isPending) onClose()
    }}>
      <h3 className="text-xs font-medium" id={headingId}>Cambio de CT</h3>
      {editor.isFetching && <div className="flex min-h-10 items-center justify-center"><Spinner /></div>}
      {editor.data?.reason && <Alert><AlertDescription>{editor.data.reason}</AlertDescription></Alert>}
      {editor.data?.canWrite && !selected && <Alert><AlertDescription>El producto no tiene celdas editables.</AlertDescription></Alert>}
      {ready && (
        <ErpDataTableViewport axes="xy" className="max-h-48">
          <Table className="text-[9px]">
            <TableHeader>
              <TableRow>
                <TableHead className="h-5 px-1" scope="col">Producto</TableHead>
                <TableHead className="h-5 px-1" scope="col">Color</TableHead>
                <TableHead className="h-5 px-1" scope="col">Talla</TableHead>
                <TableHead className="h-5 px-1 text-right" scope="col">Surtido</TableHead>
                <TableHead className="h-5 px-1 text-right" scope="col">Pedido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cells.map((cell) => (
                <TableRow key={cell.lineId} data-state={selected?.lineId === cell.lineId ? "selected" : undefined}>
                  <TableCell className="px-1 py-0.5">
                    <Button aria-pressed={selected?.lineId === cell.lineId} className="px-1 font-mono" disabled={change.isPending}
                      onClick={() => {
                        if (selected?.lineId === cell.lineId) return
                        change.reset()
                        setDraft(undefined)
                        setSelectedId(cell.lineId)
                      }} size="xs" type="button" variant="ghost">{cell.productCode}</Button>
                  </TableCell>
                  <TableCell className="px-1 py-0.5">{cell.color}</TableCell>
                  <TableCell className="px-1 py-0.5">{cell.size}</TableCell>
                  <TableCell className="px-1 py-0.5 text-right">{amountFormat.format(cell.fulfilled)}</TableCell>
                  <TableCell className="px-1 py-0.5 text-right">
                    {selected?.lineId === cell.lineId ? (
                      <Input aria-invalid={currentDraft ? !valid : undefined} aria-label={`Pedido de ${cell.productCode}`} autoFocus
                        className="ml-auto h-6 w-28 text-right" disabled={change.isPending} type="text" value={value}
                        onChange={(event) => {
                          if (!editor.data) return
                          change.reset()
                          setDraft({
                            lineId: cell.lineId,
                            value: event.target.value,
                            revision: currentDraft?.revision ?? editor.data.revision,
                            legacyVersion: currentDraft?.legacyVersion ?? editor.data.legacyVersion,
                          })
                        }} />
                    ) : amountFormat.format(cell.quantity)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ErpDataTableViewport>
      )}
      {ready && currentDraft && !valid && <Alert variant="destructive"><AlertDescription>Ingresa una cantidad entera válida.</AlertDescription></Alert>}
      {error && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(error)}</AlertDescription></Alert>}
      <div className="flex justify-end gap-1">
        <Button disabled={change.isPending} onClick={onClose} size="sm" type="button" variant="outline">Cancelar</Button>
        {ready && <Button disabled={!valid || change.isPending} size="sm" type="submit">{change.isPending && <Spinner />}OK</Button>}
      </div>
    </form>
  )
}
