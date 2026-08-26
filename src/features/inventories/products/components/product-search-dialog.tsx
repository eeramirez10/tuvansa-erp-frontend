import InformationCircleIcon from "@hugeicons/core-free-icons/InformationCircleIcon"
import { HugeiconsIcon } from "@hugeicons/react"
import { useQuery } from "@tanstack/react-query"
import { useDeferredValue, useState } from "react"

import { productSearchQueryOptions } from "@/features/inventories/products/logic"
import type { Product } from "@/features/inventories/products/model"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import {
  ErpDataDialog,
  ErpDataDialogBody,
  ErpDataTableViewport,
} from "@/shared/ui/erp-data-dialog"
import { Spinner } from "@/shared/ui/spinner"
import { cn } from "@/shared/utils/cn"

type ProductSearchDialogProps = {
  onOpenChange: (open: boolean) => void
  onSelect: (product: Product) => void
}

const compactButtonClass = "h-5 min-w-16 px-2 text-[9px]"

export function ProductSearchDialog({
  onOpenChange,
  onSelect,
}: ProductSearchDialogProps) {
  const [code, setCode] = useState("")
  const [description, setDescription] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const searchText = useDeferredValue((code || description).trim())
  const resultsQuery = useQuery({
    ...productSearchQueryOptions({
      q: searchText,
      status: "all",
      page: 1,
      pageSize: 100,
    }),
    enabled: searchText.length > 0,
  })
  const products = resultsQuery.data?.data ?? []

  const chooseProduct = (product: Product) => {
    onSelect(product)
  }

  return (
    <ErpDataDialog
      className="sm:max-w-[31rem]"
      description="Buscar un producto por código o descripción."
      onOpenChange={onOpenChange}
      title="Encuentra producto"
    >
      <ErpDataDialogBody>
        <div
          className="grid gap-0.5"
          style={{ gridTemplateColumns: "7rem minmax(0, 1fr)" }}
        >
          <label className="grid gap-0.5">
            <span className="px-1">Código</span>
            <input
              autoFocus
              autoComplete="off"
              className="h-5 border border-input bg-background px-1 text-[9px] shadow-inner outline-none focus:border-module-inventory"
              onChange={(event) => {
                setCode(event.target.value)
                setSelectedProduct(null)
                if (event.target.value) setDescription("")
              }}
              name="inventory-product-code-search"
              value={code}
            />
          </label>
          <label className="grid gap-0.5">
            <span className="px-1">Descripción</span>
            <input
              className="h-5 border border-input bg-background px-1 text-[9px] shadow-inner outline-none focus:border-module-inventory"
              autoComplete="off"
              onChange={(event) => {
                setDescription(event.target.value)
                setSelectedProduct(null)
                if (event.target.value) setCode("")
              }}
              name="inventory-product-description-search"
              value={description}
            />
          </label>
        </div>

        {resultsQuery.isError && (
          <Alert className="mt-1" variant="destructive">
            <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} />
            <AlertTitle>No fue posible buscar productos</AlertTitle>
            <AlertDescription>{getApiErrorMessage(resultsQuery.error)}</AlertDescription>
          </Alert>
        )}

        <ErpDataTableViewport axes="y" className="mt-1" style={{ height: "17rem" }}>
          <table className="w-full table-fixed border-collapse text-[9px]/none">
            <colgroup>
              <col className="w-28" />
              <col />
            </colgroup>
            <tbody>
              {products.map((product) => (
                <tr
                  className={cn(
                    "h-4 cursor-default hover:bg-module-inventory/20",
                    selectedProduct?.id === product.id &&
                      "bg-module-inventory text-module-inventory-foreground",
                  )}
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                  onDoubleClick={() => chooseProduct(product)}
                >
                  <td className="truncate border-r border-input px-1" title={product.code}>
                    {product.code}
                  </td>
                  <td className="truncate px-1" title={product.description}>
                    {product.description}
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td className="h-60 text-center text-muted-foreground" colSpan={2}>
                    {resultsQuery.isFetching ? (
                      <span className="inline-flex items-center gap-1">
                        <Spinner /> Buscando…
                      </span>
                    ) : searchText ? (
                      "Sin productos"
                    ) : (
                      ""
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </ErpDataTableViewport>

        <footer className="mt-1 flex items-center justify-between">
          <Button className={compactButtonClass} type="button" variant="outline">
            ✓ Familias
          </Button>
          <div className="flex gap-1">
            <Button
              className={compactButtonClass}
              disabled={!selectedProduct}
              onClick={() => selectedProduct && chooseProduct(selectedProduct)}
              type="button"
              variant="outline"
            >
              ✓ OK
            </Button>
            <Button
              className={compactButtonClass}
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              × Cancelar
            </Button>
          </div>
        </footer>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
