import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

import { ProductQueryTable } from "@/features/inventories/products/components/product-query-table"
import { productPanelQueryOptions } from "@/features/inventories/products/logic"
import { formatMoney, formatNumber, textValue, type QueryColumn } from "@/features/inventories/products/query-formatters"
import { captureProductMatchesQuery } from "@/features/sales/orders/capture-logic"
import type { CaptureProductMatch } from "@/features/sales/orders/capture-model"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"
import { Spinner } from "@/shared/ui/spinner"

const columns: QueryColumn[] = [
  { key: "alternateCode", label: "Producto", width: "8rem" },
  { key: "alternateDescription", label: "Descripción", width: "18rem" },
  { key: "stock", label: "Cantidad", align: "right", render: (row) => formatNumber(row.stock) },
  ...Array.from({ length: 10 }, (_, index): QueryColumn => ({
    key: `price${index + 1}`, label: `Lista ${index + 1}`, align: "right",
    render: (row) => formatMoney(row[`price${index + 1}`]),
  })),
]

export function OrderProductAlternatesDialog({ product, warehouse, onClose, onSelect }: {
  product: CaptureProductMatch
  warehouse: string
  onClose: () => void
  onSelect: (product: CaptureProductMatch) => void
}) {
  const client = useQueryClient()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const query = useQuery(productPanelQueryOptions(product.id, "alternates"))
  const rows = query.data?.data.items ?? []
  const selected = rows.find((row) => row.id === selectedId) ?? rows[0]
  const resolve = useMutation({
    mutationFn: async (code: string) => {
      const matches = await client.fetchQuery(captureProductMatchesQuery({ code }, warehouse))
      const match = matches.find((candidate) => candidate.code.trim().toUpperCase() === code.toUpperCase())
      if (!match) throw new Error(`El producto ${code} no está disponible en el almacén ${warehouse}.`)
      return match
    },
    onSuccess: onSelect,
  })
  const error = query.error ?? resolve.error
  const choose = (id: number) => {
    const row = rows.find((item) => item.id === id)
    const code = textValue(row?.alternateCode).trim()
    if (code && !resolve.isPending) resolve.mutate(code)
  }
  const close = () => { if (!resolve.isPending) onClose() }
  return (
    <ErpDataDialog defaultWidth={770} description={product.code} onOpenChange={close} title="Alternos" tone="sales">
      <ErpDataDialogBody className="grid gap-2">
        {query.isPending && <div className="grid min-h-24 place-items-center"><Spinner /></div>}
        {error && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(error)}</AlertDescription></Alert>}
        {!query.isPending && !query.isError && <ProductQueryTable rows={rows} columns={columns} emptyMessage="Sin productos alternos"
          selection={{ id: typeof selected?.id === "number" ? selected.id : null, column: "alternateCode",
            label: (row) => textValue(row.alternateCode), onSelect: setSelectedId, onActivate: choose }} />}
        <footer className="flex justify-end gap-1">
          <Button type="button" size="sm" variant="outline" disabled={resolve.isPending} onClick={close}>Cancelar</Button>
          <Button type="button" size="sm" disabled={typeof selected?.id !== "number" || resolve.isPending}
            onClick={() => { if (typeof selected?.id === "number") choose(selected.id) }}>
            {resolve.isPending && <Spinner />}OK
          </Button>
        </footer>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
