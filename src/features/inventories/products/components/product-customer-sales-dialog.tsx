import InformationCircleIcon from "@hugeicons/core-free-icons/InformationCircleIcon"
import { HugeiconsIcon } from "@hugeicons/react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { useState } from "react"

import { ProductQueryTable } from "@/features/inventories/products/components/product-query-table"
import { productCustomerSalesQueryOptions } from "@/features/inventories/products/logic"
import type { Product, ProductCustomerSalesSort } from "@/features/inventories/products/model"
import {
  formatMoney,
  formatNumber,
  type QueryColumn,
} from "@/features/inventories/products/query-formatters"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody, ErpDataMetric } from "@/shared/ui/erp-data-dialog"
import { Spinner } from "@/shared/ui/spinner"

type ProductCustomerSalesDialogProps = {
  product: Product
  onOpenChange: (open: boolean) => void
}

const salesColumns: (QueryColumn & { sort: ProductCustomerSalesSort })[] = [
  { key: "customerCode", label: "Código", width: "5rem", sort: "code" },
  { key: "customerName", label: "Cliente", width: "12rem", sort: "name" },
  { key: "quantity", label: "Cantidad", width: "5rem", align: "right", render: (row) => formatNumber(row.quantity), sort: "quantity" },
  { key: "amount", label: "Importe", width: "6rem", align: "right", render: (row) => formatMoney(row.amount), sort: "amount" },
]

export function ProductCustomerSalesDialog({
  product,
  onOpenChange,
}: ProductCustomerSalesDialogProps) {
  const [sort, setSort] = useState<ProductCustomerSalesSort>("code")
  const sales = useInfiniteQuery(productCustomerSalesQueryOptions(product.id, sort))
  const rows = sales.data?.pages.flatMap((page) => page.data.items) ?? []
  const totals = sales.data?.pages[0]?.data.customerSalesTotals

  return (
    <ErpDataDialog
      className="sm:max-w-[31rem]"
      description={`Ventas por cliente del producto ${product.code}.`}
      onOpenChange={onOpenChange}
      title="Ventas por cliente"
    >
      <ErpDataDialogBody>
        {sales.isPending ? (
          <div className="flex h-64 items-center justify-center gap-1.5 border border-input bg-background text-muted-foreground">
            <Spinner />
            Cargando ventas por cliente…
          </div>
        ) : sales.isLoadingError ? (
          <Alert className="min-h-48" variant="destructive">
            <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} />
            <AlertTitle>No fue posible cargar las ventas</AlertTitle>
            <AlertDescription>
              {getApiErrorMessage(sales.error)}
              <Button disabled={sales.isFetching} onClick={() => void sales.refetch()} size="sm" type="button" variant="outline">
                Reintentar
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <ProductQueryTable
            axes="y"
            className="h-[min(52vh,20rem)]"
            columns={salesColumns}
            rows={rows}
            sorting={{
              key: salesColumns.find((column) => column.sort === sort)?.key ?? "customerCode",
              onSort: (key) => setSort(salesColumns.find((column) => column.key === key)?.sort ?? "code"),
            }}
            tableClassName="w-[28rem]"
          />
        )}
        <footer className="mt-1">
          <div className="flex items-end justify-end gap-1">
            <span className="mr-6">Total</span>
            <ErpDataMetric label="" value={totals === undefined ? "—" : formatMoney(totals.quantity)} />
            <ErpDataMetric label="" value={totals === undefined ? "—" : formatMoney(totals.amount)} />
          </div>
          {sales.hasNextPage && (
            <div className="mt-1 flex justify-end">
              <Button
                disabled={sales.isFetching}
                onClick={() => void sales.fetchNextPage()}
                size="sm"
                type="button"
                variant="outline"
              >
                {sales.isFetchingNextPage
                  ? "Cargando ventas…"
                  : sales.isFetchNextPageError ? "Reintentar" : "Cargar más ventas"}
              </Button>
            </div>
          )}
          {sales.isFetchNextPageError && (
            <p className="text-right text-destructive" role="alert">
              {getApiErrorMessage(sales.error)}
            </p>
          )}
        </footer>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
