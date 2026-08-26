import InformationCircleIcon from "@hugeicons/core-free-icons/InformationCircleIcon"
import PrinterIcon from "@hugeicons/core-free-icons/PrinterIcon"
import { HugeiconsIcon } from "@hugeicons/react"
import { useQuery } from "@tanstack/react-query"

import { productPanelQueryOptions } from "@/features/inventories/products/logic"
import type {
  Product,
  ProductCustomerOrderItem,
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

type ProductCustomerOrdersDialogProps = {
  product: Product
  onOpenChange: (open: boolean) => void
}

type CustomerOrderRow = ProductCustomerOrderItem & {
  remaining: number
}

function numberValue(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function textValue(value: unknown) {
  return value === null || value === undefined ? "" : String(value)
}

function toCustomerOrder(item: Record<string, unknown>): CustomerOrderRow {
  const quantity = numberValue(item.quantity)
  const fulfilled = numberValue(item.fulfilled)

  return {
    id: numberValue(item.id),
    customerCode: textValue(item.customerCode),
    customerName: textValue(item.customerName),
    orderedAt: textValue(item.orderedAt),
    orderNumber: textValue(item.orderNumber),
    quantity,
    fulfilled,
    remaining: quantity - fulfilled,
    assigned: numberValue(item.assigned),
    externalNumber: textValue(item.externalNumber),
    price: numberValue(item.price),
    factor: numberValue(item.factor),
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

export function ProductCustomerOrdersDialog({
  product,
  onOpenChange,
}: ProductCustomerOrdersDialogProps) {
  const ordersQuery = useQuery(
    productPanelQueryOptions(product.id, "customer-orders"),
  )
  const rows = (ordersQuery.data?.data.items ?? []).map(toCustomerOrder)
  const assigned = product.accumulated.assigned
  const stock = product.accumulated.currentStock
  const available = stock - assigned
  const total = rows.reduce((sum, row) => sum + row.remaining, 0)
  const missing = Math.max(total - available, 0)

  return (
    <ErpDataDialog
      className="sm:max-w-[59rem]"
      description={`Pedidos por cliente del producto ${product.code}.`}
      onOpenChange={onOpenChange}
      title="Pedidos por cliente"
    >
      <ErpDataDialogBody>
        {ordersQuery.isPending ? (
          <div className="flex min-h-72 items-center justify-center gap-1.5 border border-input bg-background text-muted-foreground">
            <Spinner />
            Cargando pedidos por cliente…
          </div>
        ) : ordersQuery.isError ? (
          <Alert className="min-h-72" variant="destructive">
            <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} />
            <AlertTitle>No fue posible cargar los pedidos</AlertTitle>
            <AlertDescription>
              {getApiErrorMessage(ordersQuery.error)}
            </AlertDescription>
          </Alert>
        ) : (
          <ErpDataTableViewport className="h-[min(45vh,17rem)] min-h-64">
            <table className="w-[57.5rem] min-w-full table-fixed border-collapse text-[9px]/none tabular-nums">
              <colgroup>
                <col className="w-[5rem]" />
                <col className="w-[12rem]" />
                <col className="w-[4.8rem]" />
                <col className="w-[5.4rem]" />
                <col className="w-[4.2rem]" />
                <col className="w-[4.2rem]" />
                <col className="w-[3.2rem]" />
                <col className="w-[4.2rem]" />
                <col className="w-[7.4rem]" />
                <col className="w-[5.2rem]" />
                <col className="w-[3.2rem]" />
              </colgroup>
              <thead className="sticky top-0 z-10 bg-background">
                <tr className="h-4 border-b border-input text-left font-normal">
                  <th className="border-r border-input px-1 font-normal">Código</th>
                  <th className="border-r border-input px-1 font-normal">Descripción</th>
                  <th className="border-r border-input px-1 font-normal">Fecha E.</th>
                  <th className="border-r border-input px-1 font-normal">Núm.</th>
                  <th className="border-r border-input px-1 text-right font-normal">Pedido</th>
                  <th className="border-r border-input px-1 text-right font-normal">Surtido</th>
                  <th className="border-r border-input px-1 text-right font-normal">Resta</th>
                  <th className="border-r border-input px-1 text-right font-normal">Asignado</th>
                  <th className="border-r border-input px-1 font-normal">Núm ellos</th>
                  <th aria-label="Precio" className="border-r border-input px-1 font-normal" />
                  <th aria-label="Factor" className="px-1 font-normal" />
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
                    <td className="truncate border-r border-input px-1">{row.customerCode}</td>
                    <td className="truncate border-r border-input px-1">{row.customerName}</td>
                    <td className="truncate border-r border-input px-1">{formatDate(row.orderedAt)}</td>
                    <td className="truncate border-r border-input px-1">{row.orderNumber}</td>
                    <td className="border-r border-input px-1 text-right">{formatCompactNumber(row.quantity)}</td>
                    <td className="border-r border-input px-1 text-right">{formatCompactNumber(row.fulfilled)}</td>
                    <td className="border-r border-input px-1 text-right">{formatCompactNumber(row.remaining)}</td>
                    <td className="border-r border-input px-1 text-right">{formatCompactNumber(row.assigned)}</td>
                    <td className="truncate border-r border-input px-1">{row.externalNumber}</td>
                    <td className="border-r border-input px-1 text-right">{row.price.toFixed(5)}</td>
                    <td className="px-1 text-right">{formatCompactNumber(row.factor)}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td className="h-64 text-center text-muted-foreground" colSpan={11}>
                      Sin pedidos para este producto
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </ErpDataTableViewport>
        )}

        <footer className="mt-1 min-h-14">
          <div className="flex items-end gap-2">
            <ErpDataMetric label="Asignado" value={assigned.toFixed(3)} />
            <ErpDataMetric label="Disponible" value={available.toFixed(3)} />
            <ErpDataMetric label="Stock" value={stock.toFixed(3)} />
            <ErpDataMetric label="Total" value={total.toFixed(3)} />
            <ErpDataMetric label="Faltante" value={formatCompactNumber(missing)} />
            <Button
              aria-label="Documento"
              className="ml-12"
              size="icon-sm"
              title="Documento"
              type="button"
              variant="outline"
            >
              <HugeiconsIcon icon={PrinterIcon} strokeWidth={2} />
            </Button>
          </div>
          <div className="mt-1 flex gap-6">
            <Button className="w-32" size="sm" type="button" variant="outline">
              Filtrar pedidos surtidos
            </Button>
            <Button className="w-17" size="sm" type="button" variant="outline">
              Asignar
            </Button>
            <Button className="w-17" size="sm" type="button" variant="outline">
              Traspasar
            </Button>
          </div>
        </footer>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
