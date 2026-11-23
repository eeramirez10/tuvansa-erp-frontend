import { useState } from "react"
import type { PurchaseOrderWarehouse } from "@/features/purchasing/purchase-orders/model"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody, ErpDataTableViewport } from "@/shared/ui/erp-data-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

export function PurchaseOrderWarehouseDialog({ warehouses, initial, onSelect, onCancel }: {
  warehouses: PurchaseOrderWarehouse[]
  initial: string
  onSelect: (code: string) => void
  onCancel: () => void
}) {
  const [selected, setSelected] = useState(initial)

  return (
    <ErpDataDialog title="Almacén" description="Almacén de la orden de compra" defaultWidth={390}
      onOpenChange={(open) => { if (!open) onCancel() }}>
      <ErpDataDialogBody>
        <form className="grid gap-1.5" onSubmit={(event) => { event.preventDefault(); onSelect(selected) }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault()
              event.stopPropagation()
              onCancel()
            }
          }}>
          <ErpDataTableViewport className="h-40">
            <Table aria-label="Almacenes de compra">
              <TableHeader>
                <TableRow><TableHead className="w-20">Almacén</TableHead><TableHead>Descripción</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {warehouses.map(({ code, description }, index) => (
                  <TableRow data-state={code === selected ? "selected" : undefined} key={code}
                    onClick={() => setSelected(code)} onDoubleClick={() => onSelect(code)}>
                    <TableCell className="p-0">
                      <Button aria-label={`${code} ${description}`} aria-pressed={code === selected} autoFocus={code === initial}
                        className="w-full justify-start px-2 font-mono" data-warehouse-option onFocus={() => setSelected(code)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault()
                            onSelect(code)
                          } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                            event.preventDefault()
                            const next = index + (event.key === "ArrowUp" ? -1 : 1)
                            const options = event.currentTarget.closest("table")?.querySelectorAll<HTMLButtonElement>("[data-warehouse-option]")
                            options?.[next]?.focus()
                          }
                        }} size="xs" type="button" variant="ghost">
                        {code}
                      </Button>
                    </TableCell>
                    <TableCell>{description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ErpDataTableViewport>
          <div className="flex justify-end gap-1">
            <Button onClick={onCancel} size="sm" type="button" variant="outline">Cancelar</Button>
            <Button disabled={!selected} size="sm" type="submit">OK</Button>
          </div>
        </form>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
