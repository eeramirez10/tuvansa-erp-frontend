import InformationCircleIcon from "@hugeicons/core-free-icons/InformationCircleIcon"
import { HugeiconsIcon } from "@hugeicons/react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { useState } from "react"

import { ProductQueryTable } from "@/features/inventories/products/components/product-query-table"
import { productOrderListQueryOptions } from "@/features/inventories/products/logic"
import type { Product } from "@/features/inventories/products/model"
import {
  formatDate,
  formatNumber,
  numberValue,
  type QueryColumn,
} from "@/features/inventories/products/query-formatters"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody, ErpDataMetric } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Spinner } from "@/shared/ui/spinner"

type ProductCustomerQuotesDialogProps = {
  product: Product
  onOpenChange: (open: boolean) => void
}

const quoteColumns: QueryColumn[] = [
  { key: "customerCode", label: "Código", width: "5rem" },
  { key: "customerName", label: "Descripción", width: "12rem" },
  { key: "quotedAt", label: "Fecha E.", width: "5rem", render: (row) => formatDate(row.quotedAt) },
  { key: "quoteNumber", label: "Núm.", width: "5rem" },
  { key: "quantity", label: "Pedido", width: "4.5rem", align: "right", render: (row) => formatNumber(row.quantity) },
  { key: "fulfilled", label: "Surtido", width: "4.5rem", align: "right", render: (row) => formatNumber(row.fulfilled) },
  {
    key: "remaining",
    label: "Resta",
    width: "4rem",
    align: "right",
    render: (row) => formatNumber(numberValue(row.quantity) - numberValue(row.fulfilled)),
  },
  { key: "assigned", label: "Asignado", width: "4.5rem", align: "right", render: (row) => formatNumber(row.assigned) },
  { key: "externalNumber", label: "Num ellos", width: "7rem" },
]

export function ProductCustomerQuotesDialog({
  product,
  onOpenChange,
}: ProductCustomerQuotesDialogProps) {
  const [excludeFulfilled, setExcludeFulfilled] = useState(false)
  const quotes = useInfiniteQuery(productOrderListQueryOptions(product.id, "customer-quotes", excludeFulfilled))
  const rows = quotes.data?.pages.flatMap((page) => page.data.items) ?? []
  const total = quotes.data?.pages[0]?.data.customerOrdersTotals?.remaining

  return (
    <ErpDataDialog
      className="sm:max-w-[54rem]"
      description={`Cotizaciones por cliente del producto ${product.code}.`}
      onOpenChange={onOpenChange}
      title="Pedidos por cliente"
    >
      <ErpDataDialogBody>
        {quotes.isPending ? (
          <div className="flex h-64 items-center justify-center gap-1.5 border border-input bg-background text-muted-foreground">
            <Spinner />
            Cargando cotizaciones por cliente…
          </div>
        ) : quotes.isLoadingError ? (
          <Alert className="min-h-48" variant="destructive">
            <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} />
            <AlertTitle>No fue posible cargar las cotizaciones</AlertTitle>
            <AlertDescription>
              {getApiErrorMessage(quotes.error)}
              <Button disabled={quotes.isFetching} onClick={() => void quotes.refetch()} size="sm" type="button" variant="outline">
                Reintentar
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <ProductQueryTable
            className="h-[min(42vh,16rem)]"
            columns={quoteColumns}
            emptyMessage="Sin cotizaciones para este producto"
            rows={rows}
            tableClassName="w-[52rem]"
          />
        )}
        <footer className="mt-1">
          <div className="grid grid-cols-5 gap-1">
            <ErpDataMetric label="Asignado" value="—" />
            <ErpDataMetric label="Disponible" value="—" />
            <ErpDataMetric label="Stock" value={product.accumulated.currentStock.toFixed(3)} />
            <ErpDataMetric label="Total" value={total?.toFixed(3) ?? "—"} />
            <ErpDataMetric label="Faltante" value="—" />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <Button
              className="mr-4"
              disabled={excludeFulfilled || quotes.isPending}
              onClick={() => setExcludeFulfilled(true)}
              size="sm"
              type="button"
              variant="outline"
            >
              Filtrar pedidos surtidos
            </Button>
            <Button className="min-w-16" disabled size="sm" type="button" variant="outline">
              Asignar
            </Button>
            <Button className="min-w-16" disabled size="sm" type="button" variant="outline">
              Traspasar
            </Button>
            <Input aria-label="Destino del traspaso" className="h-5 w-14" disabled />
            {quotes.hasNextPage && (
              <Button
                className="ml-auto"
                disabled={quotes.isFetching}
                onClick={() => void quotes.fetchNextPage()}
                size="sm"
                type="button"
                variant="outline"
              >
                {quotes.isFetchingNextPage
                  ? "Cargando cotizaciones…"
                  : quotes.isFetchNextPageError ? "Reintentar" : "Cargar más cotizaciones"}
              </Button>
            )}
          </div>
          {quotes.isFetchNextPageError && (
            <p className="text-right text-destructive" role="alert">
              {getApiErrorMessage(quotes.error)}
            </p>
          )}
        </footer>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
