import InformationCircleIcon from "@hugeicons/core-free-icons/InformationCircleIcon"
import { HugeiconsIcon } from "@hugeicons/react"
import { useInfiniteQuery } from "@tanstack/react-query"

import { productLedgerQueryOptions } from "@/features/inventories/products/logic"
import type { Product, ProductLedgerItem } from "@/features/inventories/products/model"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import {
  ErpDataDialog,
  ErpDataDialogBody,
  ErpDataTableViewport,
} from "@/shared/ui/erp-data-dialog"
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

function optionalNumberValue(value: unknown) {
  if (value == null || value === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
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
    pieces: optionalNumberValue(item.pieces),
    route: textValue(item.route),
    ellosReference: textValue(item.ellosReference),
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
  const ledgerQuery = useInfiniteQuery(productLedgerQueryOptions(product.id))
  const openingStock = product.accumulated.previousStock
  const items = ledgerQuery.data?.pages.flatMap((page) => page.data.items) ?? []
  const rows = buildLedgerRows(items, openingStock)

  return (
    <ErpDataDialog
      description={`Auxiliar de movimientos del producto ${product.code}.`}
      defaultHeight={415}
      fillHeight
      onOpenChange={onOpenChange}
      title="Auxiliar"
    >
        <ErpDataDialogBody className="flex min-h-0 flex-1 flex-col">
          <div className="mb-1 flex h-5 shrink-0 items-center justify-center gap-2">
            <span>Stock anterior</span>
            <output className="flex h-4 min-w-16 items-center justify-end border border-input bg-background px-1 tabular-nums shadow-inner">
              {openingStock.toFixed(2)}
            </output>
          </div>

          {ledgerQuery.isPending ? (
            <div className="flex flex-1 items-center justify-center gap-1.5 border border-input bg-background text-muted-foreground">
              <Spinner />
              Cargando auxiliar…
            </div>
          ) : ledgerQuery.isLoadingError ? (
            <Alert className="flex-1" variant="destructive">
              <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} />
              <AlertTitle>No fue posible cargar el auxiliar</AlertTitle>
              <AlertDescription>
                {getApiErrorMessage(ledgerQuery.error)}
              </AlertDescription>
            </Alert>
          ) : (
            <ErpDataTableViewport className="min-h-0 flex-1">
              <table className="w-[61rem] min-w-full table-fixed border-collapse text-[9px]/none tabular-nums">
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
                  <col className="w-[4rem]" />
                  <col className="w-[5rem]" />
                  <col className="w-[9rem]" />
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
                    <th className="px-1 text-right font-normal">Pzas</th>
                    <th className="px-1 font-normal">Ruta</th>
                    <th className="px-1 font-normal">Referencia ellos</th>
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
                      <td className="px-1 text-right">{row.pieces ?? ""}</td>
                      <td className="truncate px-1" title={row.route}>{row.route}</td>
                      <td className="truncate px-1" title={row.ellosReference}>
                        {row.ellosReference}
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td className="h-64 text-center text-muted-foreground" colSpan={14}>
                        Sin movimientos para este producto
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </ErpDataTableViewport>
          )}

          <footer className="flex shrink-0 flex-wrap items-center gap-2 pt-1">
            <Button disabled size="sm" type="button" variant="outline">
              Filtrar almacén
            </Button>
            <Button disabled size="sm" type="button" variant="outline">
              Filtrar T'S
            </Button>
            <Button disabled size="sm" type="button" variant="outline">
              TST
            </Button>
            {ledgerQuery.hasNextPage && (
              <Button
                className="ml-auto"
                disabled={ledgerQuery.isFetching}
                onClick={() => void ledgerQuery.fetchNextPage()}
                size="sm"
                type="button"
                variant="outline"
              >
                {ledgerQuery.isFetchingNextPage
                  ? "Cargando movimientos…"
                  : ledgerQuery.isFetchNextPageError ? "Reintentar" : "Cargar más movimientos"}
              </Button>
            )}
            {ledgerQuery.isFetchNextPageError && (
              <p className="w-full text-right text-destructive" role="alert">
                {getApiErrorMessage(ledgerQuery.error)}
              </p>
            )}
          </footer>
        </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
