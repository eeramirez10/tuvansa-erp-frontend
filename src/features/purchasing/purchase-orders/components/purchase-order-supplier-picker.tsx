import { useQuery } from "@tanstack/react-query"
import { useState } from "react"

import { purchaseOrderKeys } from "@/features/purchasing/purchase-orders/logic"
import type { PurchaseOrderCreateSupplier } from "@/features/purchasing/purchase-orders/model"
import { searchPurchaseOrderCreateSuppliers } from "@/features/purchasing/purchase-orders/services/purchase-order-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody, ErpDataTableViewport } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Table, TableBody, TableCell, TableRow } from "@/shared/ui/table"

export function PurchaseOrderSupplierPicker({ description, initial, onSelect, onClose }: {
  description: string
  initial: string
  onSelect: (supplier: PurchaseOrderCreateSupplier) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState(initial)
  const [submitted, setSubmitted] = useState(initial)
  const suppliers = useQuery({
    queryKey: [...purchaseOrderKeys.all, "create", "suppliers", submitted],
    queryFn: ({ signal }) => searchPurchaseOrderCreateSuppliers(submitted, signal),
    enabled: submitted !== "",
  })
  return (
    <ErpDataDialog title="Buscar proveedor" description={description} defaultWidth={550} onOpenChange={(open) => !open && onClose()}>
      <ErpDataDialogBody className="grid gap-1.5">
        <form className="flex gap-1" onSubmit={(event) => { event.preventDefault(); setSubmitted(query.trim()) }}>
          <Input aria-label="Código o nombre" autoFocus value={query} onChange={(event) => setQuery(event.target.value)} maxLength={60} />
          <Button disabled={!query.trim() || suppliers.isFetching} type="submit" size="sm">Buscar</Button>
        </form>
        {suppliers.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(suppliers.error)}</AlertDescription></Alert>}
        <ErpDataTableViewport className="h-48">
          <Table className="min-w-96">
            <TableBody>
              {suppliers.data?.map((supplier) => <TableRow key={supplier.id}><TableCell className="p-0">
                <Button className="flex w-full justify-start text-left" onClick={() => onSelect(supplier)} variant="ghost" size="xs">
                  <span className="w-20 shrink-0 font-mono">{supplier.code}</span>{supplier.name}
                </Button>
              </TableCell></TableRow>)}
              {suppliers.data?.length === 0 && <TableRow><TableCell>Sin proveedores activos</TableCell></TableRow>}
            </TableBody>
          </Table>
        </ErpDataTableViewport>
        <div className="flex justify-end"><Button onClick={onClose} variant="outline" size="sm">Cancelar</Button></div>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
