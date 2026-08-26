import AlertCircleIcon from "@hugeicons/core-free-icons/AlertCircleIcon"
import Delete01Icon from "@hugeicons/core-free-icons/Delete01Icon"
import InformationCircleIcon from "@hugeicons/core-free-icons/InformationCircleIcon"
import { HugeiconsIcon } from "@hugeicons/react"
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate, useParams } from "react-router"

import { paths } from "@/app/router/paths"
import { actionPanels, purchasesProductionPanels } from "@/features/inventories/products/constants"
import { ProductCatalogDetails } from "@/features/inventories/products/components/product-catalog-details"
import { ProductCustomerOrdersDialog } from "@/features/inventories/products/components/product-customer-orders-dialog"
import { ProductCustomerOrdersStarDialog } from "@/features/inventories/products/components/product-customer-orders-star-dialog"
import { ProductFormDialog } from "@/features/inventories/products/components/product-form-dialog"
import { ProductLedgerDialog } from "@/features/inventories/products/components/product-ledger-dialog"
import { ProductPanelDialog } from "@/features/inventories/products/components/product-panel-dialog"
import { ProductQueriesPanel } from "@/features/inventories/products/components/product-queries-panel"
import { ProductSearchDialog } from "@/features/inventories/products/components/product-search-dialog"
import { ProductPanelButtons } from "@/features/inventories/products/components/product-side-panels"
import { ProductToolbar } from "@/features/inventories/products/components/product-toolbar"
import { productKeys, productQueryOptions } from "@/features/inventories/products/logic"
import type { Product, ProductPanelDefinition } from "@/features/inventories/products/model"
import {
  deleteProduct,
  getAdjacentProduct,
} from "@/features/inventories/products/services/product-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Spinner } from "@/shared/ui/spinner"

type Notice = {
  kind: "success" | "error"
  title: string
  message: string
}

export function ProductCatalogPage() {
  const params = useParams()
  const productId = Number(params.productId)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: product } = useSuspenseQuery(productQueryOptions(productId))
  const [searchOpen, setSearchOpen] = useState(false)
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedPanel, setSelectedPanel] =
    useState<ProductPanelDefinition | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)

  const openProduct = (nextProduct: Product) => {
    queryClient.setQueryData(productKeys.detail(nextProduct.id), nextProduct)
    void navigate(paths.inventoryProduct(nextProduct.id))
  }

  const navigationMutation = useMutation({
    mutationFn: (direction: "previous" | "next") =>
      getAdjacentProduct(product.id, direction),
    onSuccess: (nextProduct, direction) => {
      if (!nextProduct) {
        setNotice({
          kind: "success",
          title: "Fin del catálogo",
          message:
            direction === "previous"
              ? "Este es el primer producto disponible."
              : "Este es el último producto disponible.",
        })
        return
      }
      setNotice(null)
      openProduct(nextProduct)
    },
    onError: (error) => {
      setNotice({
        kind: "error",
        title: "No fue posible navegar",
        message: getApiErrorMessage(error),
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteProduct(product.id),
    onSuccess: async () => {
      setDeleteOpen(false)
      await queryClient.invalidateQueries({ queryKey: productKeys.all })
      void navigate(paths.inventoryProducts, { replace: true })
    },
    onError: (error) => {
      setDeleteOpen(false)
      setNotice({
        kind: "error",
        title: "No fue posible eliminar el producto",
        message: getApiErrorMessage(error),
      })
    },
  })

  const controlsDisabled = navigationMutation.isPending || deleteMutation.isPending

  return (
    <section className="mx-auto flex w-full min-w-0 max-w-[1800px] flex-1 flex-col gap-2">
      <ProductToolbar
        disabled={controlsDisabled}
        onCreate={() => setFormMode("create")}
        onDelete={() => setDeleteOpen(true)}
        onEdit={() => setFormMode("edit")}
        onNext={() => navigationMutation.mutate("next")}
        onPrevious={() => navigationMutation.mutate("previous")}
        onSearch={() => setSearchOpen(true)}
      />

      {notice && (
        <Alert variant={notice.kind === "error" ? "destructive" : "default"}>
          <HugeiconsIcon
            icon={notice.kind === "error" ? AlertCircleIcon : InformationCircleIcon}
            strokeWidth={2}
          />
          <AlertTitle>{notice.title}</AlertTitle>
          <AlertDescription>{notice.message}</AlertDescription>
        </Alert>
      )}

      <div className="grid min-w-0 items-start gap-2 xl:grid-cols-[10rem_minmax(0,1fr)_14rem]">
        <aside className="grid min-w-0 gap-2 sm:grid-cols-2 xl:grid-cols-1">
          <ProductPanelButtons
            onSelect={setSelectedPanel}
            panels={actionPanels}
            title="Acciones"
          />
          <ProductPanelButtons
            onSelect={setSelectedPanel}
            panels={purchasesProductionPanels}
            title="Compras/Prod"
          />
        </aside>

        <ProductCatalogDetails product={product} />

        <aside className="min-w-0">
          <ProductQueriesPanel onSelect={setSelectedPanel} />
        </aside>
      </div>

      {searchOpen && (
        <ProductSearchDialog
          onOpenChange={setSearchOpen}
          onSelect={(selectedProduct) => {
            setSearchOpen(false)
            setNotice(null)
            openProduct(selectedProduct)
          }}
        />
      )}

      {formMode && (
        <ProductFormDialog
          key={`${formMode}-${product.id}`}
          mode={formMode}
          onOpenChange={(open) => {
            if (!open) setFormMode(null)
          }}
          onSaved={(savedProduct, mode) => {
            setFormMode(null)
            setNotice({
              kind: "success",
              title: mode === "create" ? "Producto creado" : "Producto actualizado",
              message: `${savedProduct.code} · ${savedProduct.description}`,
            })
            openProduct(savedProduct)
          }}
          product={formMode === "edit" ? product : undefined}
        />
      )}

      {selectedPanel?.key === "ledger" && (
        <ProductLedgerDialog
          key={`${product.id}-ledger`}
          onOpenChange={(open) => {
            if (!open) setSelectedPanel(null)
          }}
          product={product}
        />
      )}

      {selectedPanel?.key === "customer-orders" && (
        <ProductCustomerOrdersDialog
          key={`${product.id}-customer-orders`}
          onOpenChange={(open) => {
            if (!open) setSelectedPanel(null)
          }}
          product={product}
        />
      )}

      {selectedPanel?.key === "customer-orders-star" && (
        <ProductCustomerOrdersStarDialog
          key={`${product.id}-customer-orders-star`}
          onOpenChange={(open) => {
            if (!open) setSelectedPanel(null)
          }}
          product={product}
        />
      )}

      {selectedPanel &&
        selectedPanel.key !== "ledger" &&
        selectedPanel.key !== "customer-orders" &&
        selectedPanel.key !== "customer-orders-star" && (
        <ProductPanelDialog
          key={`${product.id}-${selectedPanel.key}`}
          onOpenChange={(open) => {
            if (!open) setSelectedPanel(null)
          }}
          panel={selectedPanel}
          productId={product.id}
        />
      )}

      <AlertDialog onOpenChange={setDeleteOpen} open={deleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} />
            </AlertDialogMedia>
            <AlertDialogTitle>¿Eliminar este producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Se dará de baja {product.code}. La API impedirá la operación si el
              producto tiene relaciones que no permiten eliminarlo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
              variant="destructive"
            >
              {deleteMutation.isPending && <Spinner data-icon="inline-start" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
