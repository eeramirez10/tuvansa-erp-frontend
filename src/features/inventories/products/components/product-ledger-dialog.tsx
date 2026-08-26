import InformationCircleIcon from "@hugeicons/core-free-icons/InformationCircleIcon"
import { HugeiconsIcon } from "@hugeicons/react"
import { useQuery } from "@tanstack/react-query"

import { productPanelQueryOptions } from "@/features/inventories/products/logic"
import type { Product, ProductLedgerItem } from "@/features/inventories/products/model"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui/dialog"
import { Spinner } from "@/shared/ui/spinner"

type ProductLedgerDialogProps = {
  product: Product
  onOpenChange: (open: boolean) => void
}

type LedgerRow = ProductLedgerItem & {
  incoming: number | null
  outgoing: number | null
  stock: number
}

function numberValue(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function textValue(value: unknown) {
  return value === null || value === undefined ? "" : String(value)
}

function toLedgerItem(item: Record<string, unknown>): ProductLedgerItem {
  return {
    id: numberValue(item.id),
    date: textValue(item.date),
    document: textValue(item.document),
    movementType: textValue(item.movementType),
    cost: numberValue(item.cost),
    quantity: numberValue(item.quantity),
    warehouse: textValue(item.warehouse),
    lotId: numberValue(item.lotId),
    userId: numberValue(item.userId),
    revaluation: numberValue(item.revaluation),
  }
}

function buildLedgerRows(
  items: Array<Record<string, unknown>>,
  openingStock: number,
) {
  let stock = openingStock

  return items.map<LedgerRow>((item) => {
    const ledgerItem = toLedgerItem(item)
    stock += ledgerItem.quantity

    return {
      ...ledgerItem,
      incoming: ledgerItem.quantity > 0 ? ledgerItem.quantity : null,
      outgoing: ledgerItem.quantity < 0 ? Math.abs(ledgerItem.quantity) : null,
      stock,
    }
  })
}

function formatDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value
}

function formatQuantity(value: number | null) {
  return value === null ? "" : value.toFixed(3)
}

function formatOptional(value: number, decimals: number) {
  return value === 0 ? "" : value.toFixed(decimals)
}

export function ProductLedgerDialog({
  product,
  onOpenChange,
}: ProductLedgerDialogProps) {
  const ledgerQuery = useQuery(productPanelQueryOptions(product.id, "ledger"))
  const openingStock = product.accumulated.previousStock
  const rows = buildLedgerRows(ledgerQuery.data?.data.items ?? [], openingStock)

  return (
    <Dialog onOpenChange={onOpenChange} open>
      <DialogContent
        aria-describedby="product-ledger-description"
        className="gap-0 overflow-hidden rounded-sm border border-module-inventory/70 bg-muted p-0 text-[9px]/none shadow-2xl sm:max-w-[46rem]"
        overlayClassName="bg-transparent backdrop-blur-none supports-backdrop-filter:backdrop-blur-none"
        showCloseButton={false}
      >
        <header className="flex h-7 items-center justify-between border-b border-module-inventory/50 bg-gradient-to-b from-module-inventory/35 to-module-inventory/15 px-1.5 [font-family:Tahoma,'Segoe_UI',sans-serif]">
          <DialogTitle className="text-[10px] font-normal">Auxiliar</DialogTitle>
          <div className="flex items-center gap-0.5">
            <Button
              aria-label="Minimizar"
              className="h-4.5 w-7 border-foreground/25 bg-background/55 p-0 text-[11px]"
              title="Minimizar"
              type="button"
              variant="outline"
            >
              <span aria-hidden className="-translate-y-0.5">—</span>
            </Button>
            <Button
              aria-label="Maximizar"
              className="h-4.5 w-7 border-foreground/25 bg-background/55 p-0 text-[10px]"
              title="Maximizar"
              type="button"
              variant="outline"
            >
              <span aria-hidden>□</span>
            </Button>
            <DialogClose
              render={
                <Button
                  aria-label="Cerrar"
                  className="h-4.5 w-7 border-destructive/50 bg-destructive/80 p-0 text-[12px] text-white hover:bg-destructive"
                  title="Cerrar"
                  type="button"
                  variant="destructive"
                />
              }
            >
              <span aria-hidden>×</span>
            </DialogClose>
          </div>
        </header>

        <DialogDescription className="sr-only" id="product-ledger-description">
          Auxiliar de movimientos del producto {product.code}.
        </DialogDescription>

        <div className="bg-muted p-1.5 [font-family:Tahoma,'Segoe_UI',sans-serif]">
          <div className="mb-1 flex h-5 items-center justify-center gap-2">
            <span>Stock anterior</span>
            <output className="flex h-4 min-w-16 items-center justify-end border border-input bg-background px-1 tabular-nums shadow-inner">
              {openingStock.toFixed(2)}
            </output>
          </div>

          {ledgerQuery.isPending ? (
            <div className="flex min-h-72 items-center justify-center gap-1.5 border border-input bg-background text-muted-foreground">
              <Spinner />
              Cargando auxiliar…
            </div>
          ) : ledgerQuery.isError ? (
            <Alert className="min-h-72" variant="destructive">
              <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} />
              <AlertTitle>No fue posible cargar el auxiliar</AlertTitle>
              <AlertDescription>
                {getApiErrorMessage(ledgerQuery.error)}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="h-[min(52vh,20rem)] min-h-64 overflow-auto border border-input bg-background shadow-inner">
              <table className="w-[43rem] min-w-full table-fixed border-collapse text-[9px]/none tabular-nums">
                <colgroup>
                  <col className="w-[4.6rem]" />
                  <col className="w-[5.8rem]" />
                  <col className="w-[3rem]" />
                  <col className="w-[4.4rem]" />
                  <col className="w-[4.1rem]" />
                  <col className="w-[4.1rem]" />
                  <col className="w-[4.1rem]" />
                  <col className="w-[2.7rem]" />
                  <col className="w-[2.8rem]" />
                  <col className="w-[2.8rem]" />
                  <col className="w-[4.4rem]" />
                </colgroup>
                <thead className="sticky top-0 z-10 bg-background">
                  <tr className="h-4 border-b border-input text-left font-normal">
                    <th className="px-1 font-normal">Fecha</th>
                    <th className="px-1 font-normal">Doc.</th>
                    <th className="px-1 font-normal">T.M.</th>
                    <th className="px-1 text-right font-normal">Costo</th>
                    <th className="px-1 text-right font-normal">Entradas</th>
                    <th className="px-1 text-right font-normal">Salidas</th>
                    <th className="px-1 text-right font-normal">Stock</th>
                    <th className="px-1 text-center font-normal">Alm</th>
                    <th className="px-1 text-right font-normal">Lote</th>
                    <th className="px-1 text-right font-normal">Usr</th>
                    <th className="px-1 text-right font-normal">Reval</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr
                      className={
                        index === 0
                          ? "h-4 bg-module-inventory text-module-inventory-foreground"
                          : "h-4 hover:bg-muted/55"
                      }
                      key={row.id}
                    >
                      <td className="truncate px-1">{formatDate(row.date)}</td>
                      <td className="truncate px-1">{row.document}</td>
                      <td className="truncate px-1">{row.movementType}</td>
                      <td className="px-1 text-right">{formatOptional(row.cost, 4)}</td>
                      <td className="px-1 text-right">{formatQuantity(row.incoming)}</td>
                      <td className="px-1 text-right">{formatQuantity(row.outgoing)}</td>
                      <td className="px-1 text-right">{row.stock.toFixed(3)}</td>
                      <td className="truncate px-1 text-center">{row.warehouse}</td>
                      <td className="px-1 text-right">{row.lotId}</td>
                      <td className="px-1 text-right">{row.userId}</td>
                      <td className="px-1 text-right">
                        {formatOptional(row.revaluation, 2)}
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td className="h-64 text-center text-muted-foreground" colSpan={11}>
                        Sin movimientos para este producto
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <footer className="flex h-7 items-end gap-2 pl-8">
            <Button className="w-32" size="sm" type="button" variant="outline">
              Filtrar almacen
            </Button>
            <Button className="w-32" size="sm" type="button" variant="outline">
              Filtrar XXX
            </Button>
          </footer>
        </div>
      </DialogContent>
    </Dialog>
  )
}
