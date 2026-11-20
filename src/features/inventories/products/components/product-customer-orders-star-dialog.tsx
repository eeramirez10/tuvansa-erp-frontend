import InformationCircleIcon from "@hugeicons/core-free-icons/InformationCircleIcon"
import { HugeiconsIcon } from "@hugeicons/react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { useState } from "react"

import { ProductCustomerClassifiers } from "@/features/inventories/products/components/product-customer-classifiers"
import { productCustomerOrdersStarQueryOptions } from "@/features/inventories/products/logic"
import type {
  Product,
  ProductCustomerOrdersStarFilters,
  ProductCustomerOrdersStarSort,
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

function numberValue(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function textValue(value: unknown) {
  return value === null || value === undefined ? "" : String(value)
}

function toClassifiedOrder(item: Record<string, unknown>) {
  const quantity = numberValue(item.quantity)
  const fulfilled = numberValue(item.fulfilled)
  const remaining = Number((quantity - fulfilled).toFixed(6))
  return {
    id: numberValue(item.id),
    classifierCode: textValue(item.classifierCode),
    classifierName: textValue(item.classifierName).slice(0, 20),
    orderedAt: textValue(item.orderedAt),
    orderNumber: textValue(item.orderNumber),
    quantity,
    fulfilled,
    remaining,
    assigned: numberValue(item.assigned),
  }
}

function formatDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value
}

const sortColumns = [
  { label: "Código", sort: "code" },
  { label: "Nombre", sort: "name" },
  { label: "Pedido#", sort: "order" },
  { label: "Fecha", sort: "date" },
] as const satisfies readonly { label: string; sort: ProductCustomerOrdersStarSort }[]

export function ProductCustomerOrdersStarDialog({
  product,
  onOpenChange,
}: ProductCustomerOrdersStarDialogProps) {
  const [filters, setFilters] = useState<ProductCustomerOrdersStarFilters>({ sort: "date" })
  const ordersQuery = useInfiniteQuery(
    productCustomerOrdersStarQueryOptions(product.id, filters),
  )
  const rows = ordersQuery.data?.pages.flatMap((page) => page.data.items.map(toClassifiedOrder)) ?? []
  const totals = ordersQuery.data?.pages[0]?.data.customerOrdersTotals
  const stock = product.accumulated.currentStock
  const available = totals === undefined ? undefined : stock - totals.assigned
  const missing = totals === undefined ? undefined : totals.remaining - stock

  return (
    <ErpDataDialog
      className="sm:max-w-[33rem]"
      description={`Pedidos pendientes por cliente del producto ${product.code}.`}
      onOpenChange={onOpenChange}
      title="Pedidos por *"
    >
      <ErpDataDialogBody>
        {ordersQuery.isPending ? (
          <div className="flex min-h-48 items-center justify-center gap-1.5 border border-input bg-background text-muted-foreground">
            <Spinner />
            Cargando pedidos pendientes…
          </div>
        ) : ordersQuery.isLoadingError ? (
          <Alert className="min-h-48" variant="destructive">
            <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} />
            <AlertTitle>No fue posible cargar los pedidos</AlertTitle>
            <AlertDescription>
              {getApiErrorMessage(ordersQuery.error)}
              <Button
                disabled={ordersQuery.isFetching}
                onClick={() => void ordersQuery.refetch()}
                size="sm"
                type="button"
                variant="outline"
              >
                Reintentar
              </Button>
            </AlertDescription>
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
                  {sortColumns.map(({ label, sort }) => (
                    <th
                      aria-sort={filters.sort === sort ? "ascending" : "none"}
                      className="px-1 font-normal"
                      key={sort}
                      scope="col"
                    >
                      <Button
                        className="h-4 w-full justify-start rounded-none px-0 text-[9px] font-normal disabled:opacity-100"
                        disabled={filters.classifier === undefined}
                        onClick={() => setFilters((current) => ({ ...current, sort }))}
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        {label}
                      </Button>
                    </th>
                  ))}
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
                    <td className="truncate px-1">{row.classifierCode}</td>
                    <td className="truncate px-1">{row.classifierName}</td>
                    <td className="truncate px-1">{row.orderNumber}</td>
                    <td className="truncate px-1">{formatDate(row.orderedAt)}</td>
                    <td className="px-1 text-right">{Math.trunc(row.quantity)}</td>
                    <td className="px-1 text-right">{Math.trunc(row.fulfilled)}</td>
                    <td className="px-1 text-right">{Math.trunc(row.remaining)}</td>
                    <td className="px-1 text-right">
                      {row.assigned}{row.assigned !== row.remaining && "*"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ErpDataTableViewport>
        )}

        <footer className="mt-1">
          <div className="grid grid-cols-5 gap-1">
            <ErpDataMetric label="Asignado" value={totals?.assigned.toFixed(3) ?? "—"} />
            <ErpDataMetric label="Por Asignar" value={available?.toFixed(3) ?? "—"} />
            <ErpDataMetric label="Stock" value={stock.toFixed(3)} />
            <ErpDataMetric label="Total" value={totals?.remaining.toFixed(3) ?? "—"} />
            <ErpDataMetric label="Faltante" value={missing?.toFixed(3) ?? "—"} />
          </div>
          <ProductCustomerClassifiers
            onSelect={(classifier) => setFilters({ classifier, sort: "date" })}
            selected={filters.classifier}
          />
          {ordersQuery.hasNextPage && (
            <div className="mt-1 flex justify-end">
              <Button
                disabled={ordersQuery.isFetching}
                onClick={() => void ordersQuery.fetchNextPage()}
                size="sm"
                type="button"
                variant="outline"
              >
                {ordersQuery.isFetchingNextPage
                  ? "Cargando pedidos…"
                  : ordersQuery.isFetchNextPageError ? "Reintentar" : "Cargar más pedidos"}
              </Button>
            </div>
          )}
          {ordersQuery.isFetchNextPageError && (
            <p className="mt-1 text-right text-destructive" role="alert">
              {getApiErrorMessage(ordersQuery.error)}
            </p>
          )}
        </footer>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
