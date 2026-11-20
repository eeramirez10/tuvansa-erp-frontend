import InformationCircleIcon from "@hugeicons/core-free-icons/InformationCircleIcon"
import { HugeiconsIcon } from "@hugeicons/react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { useState } from "react"

import { ProductCustomerClassifiers } from "@/features/inventories/products/components/product-customer-classifiers"
import { ProductQueryTable } from "@/features/inventories/products/components/product-query-table"
import { productCustomerSalesQueryOptions } from "@/features/inventories/products/logic"
import type {
  Product,
  ProductCustomerSalesFilters,
  ProductCustomerSalesPanel,
  ProductCustomerSalesSort,
} from "@/features/inventories/products/model"
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
  panel: ProductCustomerSalesPanel
  onOpenChange: (open: boolean) => void
}

const salesColumns: (QueryColumn & { sort: ProductCustomerSalesSort })[] = [
  { key: "customerCode", label: "Código", width: "5rem", sort: "code" },
  { key: "customerName", label: "Cliente", width: "12rem", sort: "name" },
  { key: "quantity", label: "Cantidad", width: "5rem", align: "right", render: (row) => formatNumber(row.quantity), sort: "quantity" },
  { key: "amount", label: "Importe", width: "6rem", align: "right", render: (row) => formatMoney(row.amount), sort: "amount" },
]

const classifiedSalesColumns = salesColumns.map((column) =>
  column.key === "customerName" ? { ...column, label: "Nombre" } : column,
)

const branchSalesColumns: typeof salesColumns = [
  { key: "branch", label: "Suc.", width: "3rem", sort: "branch" },
  ...salesColumns,
]

const salesViews = {
  "customer-sales": {
    title: "Ventas por cliente",
    columns: salesColumns,
    defaultSort: "code",
    dialogClassName: "sm:max-w-[31rem]",
    viewportClassName: "h-[min(52vh,20rem)]",
    tableClassName: "w-[28rem]",
  },
  "customer-sales-star": {
    title: "Ventas por *",
    columns: classifiedSalesColumns,
    defaultSort: "code",
    dialogClassName: "sm:max-w-[32rem]",
    viewportClassName: "h-44",
    tableClassName: "w-[29rem]",
  },
  "sales-by-branch": {
    title: "Producto vendidos por sucursal",
    columns: branchSalesColumns,
    defaultSort: "branch",
    dialogClassName: "sm:max-w-[41rem]",
    viewportClassName: "h-[min(44vh,17rem)]",
    tableClassName: "w-[38rem]",
  },
} as const

export function ProductCustomerSalesDialog({
  product,
  panel,
  onOpenChange,
}: ProductCustomerSalesDialogProps) {
  const view = salesViews[panel]
  const [filters, setFilters] = useState<ProductCustomerSalesFilters>({ sort: view.defaultSort })
  const sales = useInfiniteQuery(productCustomerSalesQueryOptions(product.id, panel, filters))
  const rows = sales.data?.pages.flatMap((page) => page.data.items) ?? []
  const totals = sales.data?.pages[0]?.data.customerSalesTotals
  const { title, columns, defaultSort } = view
  const classified = panel === "customer-sales-star"

  return (
    <ErpDataDialog
      className={view.dialogClassName}
      description={`${title} del producto ${product.code}.`}
      onOpenChange={onOpenChange}
      title={title}
    >
      <ErpDataDialogBody>
        {sales.isPending ? (
          <div className="flex h-64 items-center justify-center gap-1.5 border border-input bg-background text-muted-foreground">
            <Spinner />
            Cargando ventas…
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
            className={view.viewportClassName}
            columns={columns}
            emptyMessage={classified && filters.classifier === undefined ? "" : undefined}
            rows={rows}
            sorting={{
              key: columns.find((column) => column.sort === filters.sort)?.key ?? "",
              onSort: (key) => setFilters((current) => ({
                ...current, sort: columns.find((column) => column.key === key)?.sort ?? defaultSort,
              })),
            }}
            tableClassName={view.tableClassName}
          />
        )}
        <footer className="mt-1">
          <div className="flex items-end justify-end gap-1">
            {panel !== "sales-by-branch" && <span className="mr-6">Total</span>}
            <ErpDataMetric label="" value={totals === undefined ? "—" : formatMoney(totals.quantity)} />
            <ErpDataMetric label="" value={totals === undefined ? "—" : formatMoney(totals.amount)} />
          </div>
          {classified && (
            <ProductCustomerClassifiers
              onSelect={(classifier) => setFilters({ classifier, sort: defaultSort })}
              selected={filters.classifier}
            />
          )}
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
