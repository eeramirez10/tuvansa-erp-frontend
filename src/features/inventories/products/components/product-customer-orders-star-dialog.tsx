import InformationCircleIcon from "@hugeicons/core-free-icons/InformationCircleIcon"
import { HugeiconsIcon } from "@hugeicons/react"
import { useQuery } from "@tanstack/react-query"

import { productPanelQueryOptions } from "@/features/inventories/products/logic"
import type {
  Product,
  ProductCustomerOrderItem,
  ProductCustomerOrderSummary,
} from "@/features/inventories/products/model"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import {
  ErpDataDialog,
  ErpDataDialogBody,
  ErpDataMetric,
  ErpDataTableViewport,
} from "@/shared/ui/erp-data-dialog"
import { Spinner } from "@/shared/ui/spinner"

type ProductCustomerOrdersStarDialogProps = {
  product: Product
  onOpenChange: (open: boolean) => void
}

type PendingCustomerOrder = ProductCustomerOrderItem & {
  remaining: number
}

function numberValue(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function textValue(value: unknown) {
  return value === null || value === undefined ? "" : String(value)
}

function toPendingOrder(
  item: Record<string, unknown>,
): PendingCustomerOrder | null {
  const quantity = numberValue(item.quantity)
  const fulfilled = numberValue(item.fulfilled)
  const remaining = quantity - fulfilled
  if (remaining <= 0) return null

  return {
    id: numberValue(item.id),
    customerCode: textValue(item.customerCode),
    customerName: textValue(item.customerName),
    orderedAt: textValue(item.orderedAt),
    orderNumber: textValue(item.orderNumber),
    quantity,
    fulfilled,
    remaining,
    assigned: numberValue(item.assigned),
    externalNumber: textValue(item.externalNumber),
    price: numberValue(item.price),
    factor: numberValue(item.factor),
  }
}

function toSummary(item?: Record<string, unknown>): ProductCustomerOrderSummary {
  return {
    ordered: numberValue(item?.ordered),
    assigned: numberValue(item?.assigned),
    stock: numberValue(item?.stock),
    pending: numberValue(item?.pending),
  }
}

function formatDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value
}

function formatCompactNumber(value: number) {
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")
}

const filterButtons = [
  ["AGENTE", "GIRO O SECTOR", "SUCURSAL", "", ""],
  ["", "FLETE", "ORIGEN", "PROYECTO", ""],
] as const

export function ProductCustomerOrdersStarDialog({
  product,
  onOpenChange,
}: ProductCustomerOrdersStarDialogProps) {
  const summaryQuery = useQuery(
    productPanelQueryOptions(product.id, "customer-orders-star"),
  )
  const ordersQuery = useQuery(
    productPanelQueryOptions(product.id, "customer-orders"),
  )
  const rows = (ordersQuery.data?.data.items ?? [])
    .map(toPendingOrder)
    .filter((row): row is PendingCustomerOrder => row !== null)
  const summary = toSummary(summaryQuery.data?.data.items[0])
  const available = summary.stock - summary.assigned
  const missing = summary.ordered - available
  const isPending = summaryQuery.isPending || ordersQuery.isPending
  const queryError = summaryQuery.error ?? ordersQuery.error

  return (
    <ErpDataDialog
      className="sm:max-w-[33rem]"
      description={`Pedidos pendientes por cliente del producto ${product.code}.`}
      onOpenChange={onOpenChange}
      title="Pedidos por *"
    >
      <ErpDataDialogBody>
        {isPending ? (
          <div className="flex min-h-48 items-center justify-center gap-1.5 border border-input bg-background text-muted-foreground">
            <Spinner />
            Cargando pedidos pendientes…
          </div>
        ) : queryError ? (
          <Alert className="min-h-48" variant="destructive">
            <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} />
            <AlertTitle>No fue posible cargar los pedidos</AlertTitle>
            <AlertDescription>{getApiErrorMessage(queryError)}</AlertDescription>
          </Alert>
        ) : (
          <ErpDataTableViewport axes="y" className="h-[12.5rem]">
            <table className="w-full table-fixed border-collapse text-[9px]/none tabular-nums">
              <colgroup>
                <col className="w-[4rem]" />
                <col className="w-[6.4rem]" />
                <col className="w-[3.8rem]" />
                <col className="w-[3.6rem]" />
                <col className="w-[3.1rem]" />
                <col className="w-[3.1rem]" />
                <col className="w-[2.5rem]" />
                <col className="w-[3.8rem]" />
              </colgroup>
              <thead className="sticky top-0 z-10 bg-background">
                <tr className="h-4 border-b border-input text-left font-normal">
                  <th className="px-1 font-normal">Código</th>
                  <th className="px-1 font-normal">Nombre</th>
                  <th className="px-1 font-normal">Pedido#</th>
                  <th className="px-1 font-normal">Fecha</th>
                  <th className="px-1 text-right font-normal">Pedido</th>
                  <th className="px-1 text-right font-normal">Surtido</th>
                  <th className="px-1 text-right font-normal">Resta</th>
                  <th className="px-1 text-right font-normal">Asignado</th>
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
                    <td className="truncate px-1">{row.customerCode}</td>
                    <td className="truncate px-1">{row.customerName}</td>
                    <td className="truncate px-1">{row.orderNumber}</td>
                    <td className="truncate px-1">{formatDate(row.orderedAt)}</td>
                    <td className="px-1 text-right">{formatCompactNumber(row.quantity)}</td>
                    <td className="px-1 text-right">{formatCompactNumber(row.fulfilled)}</td>
                    <td className="px-1 text-right">{formatCompactNumber(row.remaining)}</td>
                    <td className="px-1 text-right">{formatCompactNumber(row.assigned)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ErpDataTableViewport>
        )}

        <footer className="mt-1">
          <div className="grid grid-cols-5 gap-1">
            <ErpDataMetric label="Asignado" value={summary.assigned.toFixed(3)} />
            <ErpDataMetric label="Por Asignar" value={available.toFixed(3)} />
            <ErpDataMetric label="Stock" value={summary.stock.toFixed(3)} />
            <ErpDataMetric label="Total" value={summary.ordered.toFixed(3)} />
            <ErpDataMetric label="Faltante" value={missing.toFixed(3)} />
          </div>
          <div className="mt-1 grid grid-cols-5 gap-0.5">
            {filterButtons.flatMap((buttonRow, rowIndex) =>
              buttonRow.map((label, columnIndex) =>
                label ? (
                  <Button
                    className="h-6 px-1 text-[9px]"
                    key={`${rowIndex}-${label}`}
                    type="button"
                    variant="outline"
                  >
                    {label}
                  </Button>
                ) : (
                  <span
                    aria-hidden
                    className="h-6 border border-input bg-background/50 shadow-inner"
                    key={`${rowIndex}-${columnIndex}`}
                  />
                ),
              ),
            )}
          </div>
        </footer>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
