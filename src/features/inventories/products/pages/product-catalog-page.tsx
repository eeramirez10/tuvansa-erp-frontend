import AlertCircleIcon from "@hugeicons/core-free-icons/AlertCircleIcon"
import Delete01Icon from "@hugeicons/core-free-icons/Delete01Icon"
import InformationCircleIcon from "@hugeicons/core-free-icons/InformationCircleIcon"
import { zodResolver } from "@hookform/resolvers/zod"
import { HugeiconsIcon } from "@hugeicons/react"
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { useEffect, useId, useState } from "react"
import { useForm } from "react-hook-form"
import { useNavigate, useParams } from "react-router"

import { paths } from "@/app/router/paths"
import { InventoryMovementsDialog } from "@/features/inventories/movements/components/inventory-movements-dialog"
import { movementSearchWindowId, movementWindowId } from "@/features/inventories/movements/model"
import { actionPanels, purchasesProductionPanels } from "@/features/inventories/products/constants"
import { ProductActionDialog } from "@/features/inventories/products/components/product-action-dialog"
import { ProductCatalogDetails } from "@/features/inventories/products/components/product-catalog-details"
import { ProductClassificationsDialog } from "@/features/inventories/products/components/product-classifications-dialog"
import { ProductCustomerOrdersDialog } from "@/features/inventories/products/components/product-customer-orders-dialog"
import { ProductCustomerOrdersStarDialog } from "@/features/inventories/products/components/product-customer-orders-star-dialog"
import { ProductCustomerQuotesDialog } from "@/features/inventories/products/components/product-customer-quotes-dialog"
import { ProductCustomerSalesDialog } from "@/features/inventories/products/components/product-customer-sales-dialog"
import { ProductLedgerDialog } from "@/features/inventories/products/components/product-ledger-dialog"
import { ProductOtherDataDialog } from "@/features/inventories/products/components/product-other-data-dialog"
import { ProductPurchasesProductionDialog } from "@/features/inventories/products/components/product-purchases-production-dialog"
import { ProductQueryDialog } from "@/features/inventories/products/components/product-query-dialog"
import { ProductQueriesPanel } from "@/features/inventories/products/components/product-queries-panel"
import { ProductSearchDialog } from "@/features/inventories/products/components/product-search-dialog"
import { ProductPanelButtons } from "@/features/inventories/products/components/product-side-panels"
import { ProductToolbar } from "@/features/inventories/products/components/product-toolbar"
import {
  getNewProductCatalog,
  productEditOptionsQueryOptions,
  productKeys,
  productQueryOptions,
  toProductCatalogCreateInput,
  toProductCatalogEditInput,
} from "@/features/inventories/products/logic"
import {
  productCatalogFormSchema,
  productCreateFields,
  type Product,
  type ProductCatalogDraft,
  type ProductCatalogEditInput,
  type ProductCatalogValues,
  type ProductMutationInput,
  type ProductPanelDefinition,
} from "@/features/inventories/products/model"
import {
  createProduct,
  deleteProduct,
  getAdjacentProduct,
  updateProduct,
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
import { Button } from "@/shared/ui/button"
import { Spinner } from "@/shared/ui/spinner"
import {
  DesktopWindowIdentity,
  useDesktopWindowCollection,
} from "@/shared/ui/desktop-window-context"
import { selectRestoreDesktopWindow, useDesktopWindowStore, type DesktopWindowEntry } from "@/shared/ui/desktop-window-store"

type Notice = {
  kind: "success" | "error"
  title: string
  message: string
}

type ProductPanelWindow = {
  panel: ProductPanelDefinition
  product: Product
}

type ProductCapture = { mode: "create"; fromProductId: number } | { mode: "edit"; product: Product }
type SaveProduct =
  | { mode: "create"; input: ProductMutationInput }
  | { mode: "edit"; id: number; input: ProductCatalogEditInput }

function OpenProductPanel({
  id,
  window,
  onClose,
}: {
  id: string
  window: ProductPanelWindow
  onClose: () => void
}) {
  const { panel, product } = window
  const onOpenChange = (open: boolean) => {
    if (!open) onClose()
  }

  let content
  if (panel.key === "ledger") {
    content = <ProductLedgerDialog onOpenChange={onOpenChange} product={product} />
  } else if (panel.key === "classifications") {
    content = <ProductClassificationsDialog onOpenChange={onOpenChange} product={product} />
  } else if (panel.key === "other-data") {
    content = <ProductOtherDataDialog onOpenChange={onOpenChange} product={product} />
  } else if (panel.key === "customer-orders") {
    content = <ProductCustomerOrdersDialog onOpenChange={onOpenChange} product={product} />
  } else if (panel.key === "customer-orders-star") {
    content = <ProductCustomerOrdersStarDialog onOpenChange={onOpenChange} product={product} />
  } else if (panel.key === "customer-quotes") {
    content = <ProductCustomerQuotesDialog onOpenChange={onOpenChange} product={product} />
  } else if (panel.key === "customer-sales" || panel.key === "customer-sales-star" || panel.key === "sales-by-branch") {
    content = <ProductCustomerSalesDialog panel={panel.key} onOpenChange={onOpenChange} product={product} />
  } else if (panel.section === "queries") {
    content = <ProductQueryDialog onOpenChange={onOpenChange} panel={panel} product={product} />
  } else if (panel.section === "actions") {
    content = <ProductActionDialog onOpenChange={onOpenChange} panel={panel} product={product} />
  } else {
    content = <ProductPurchasesProductionDialog onOpenChange={onOpenChange} panel={panel} product={product} />
  }

  return <DesktopWindowIdentity id={id}>{content}</DesktopWindowIdentity>
}

export function ProductCatalogPage() {
  const params = useParams()
  const productId = Number(params.productId)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: product } = useSuspenseQuery(productQueryOptions(productId))
  const [searchOpen, setSearchOpen] = useState(false)
  const [movementsOpen, setMovementsOpen] = useState(false)
  const [movementSearchOpen, setMovementSearchOpen] = useState(false)
  const [capture, setCapture] = useState<ProductCapture | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const {
    windows: panelWindows,
    openWindow: openPanelWindow,
    closeWindow: closePanelWindow,
  } = useDesktopWindowCollection<ProductPanelWindow>()
  const [notice, setNotice] = useState<Notice | null>(null)
  const creating = capture?.mode === "create" && capture.fromProductId === product.id
  const editing = capture?.mode === "edit" && capture.product.id === product.id ? capture.product : null
  const capturing = creating || Boolean(editing)
  const captureTitle = creating ? "Alta de productos" : "Cambio de producto"
  const formId = useId()
  const form = useForm<ProductCatalogDraft, unknown, ProductCatalogValues>({
    defaultValues: { mode: "edit", changes: {} },
    resolver: zodResolver(productCatalogFormSchema),
  })
  const { setFocus: focusField } = form
  const editOptions = useQuery({
    ...productEditOptionsQueryOptions(product.id),
    enabled: creating || Boolean(editing?.editing?.editableFields.includes("unitId")),
  })
  const units = editOptions.data?.units ?? []
  const newProduct = creating ? getNewProductCatalog(units) : null
  const saveMutation = useMutation({
    mutationFn: (operation: SaveProduct) => operation.mode === "create"
      ? createProduct(operation.input)
      : updateProduct(operation.id, operation.input),
    onSuccess: (savedProduct, { mode }) => {
      queryClient.setQueryData(productKeys.detail(savedProduct.id), savedProduct)
      setCapture(null)
      setNotice({
        kind: "success",
        title: mode === "create" ? "Producto creado" : "Producto actualizado",
        message: `${savedProduct.code} · ${savedProduct.description}`,
      })
      if (mode === "create") void navigate(paths.inventoryProduct(savedProduct.id))
      void queryClient.invalidateQueries({ queryKey: productKeys.all })
    },
    onError: (error, operation) => {
      if (operation.mode === "edit" && isAxiosError(error) && error.response?.status === 409) {
        void queryClient.invalidateQueries({ queryKey: productKeys.detail(operation.id), exact: true })
      }
    },
  })
  useEffect(() => {
    if (creating) focusField("code")
    else if (editing?.editing?.editableFields.includes("description")) {
      focusField("changes.description", { shouldSelect: true })
    }
  }, [creating, editing, focusField])

  function startCreating() {
    saveMutation.reset()
    form.reset({ mode: "create", changes: {} })
    setNotice(null)
    setCapture({ mode: "create", fromProductId: product.id })
  }

  function startEditing() {
    if (!product.editing?.writable) return
    saveMutation.reset()
    form.reset({ mode: "edit", changes: {} })
    setNotice(null)
    setCapture({ mode: "edit", product })
  }

  function cancelCapture() {
    saveMutation.reset()
    form.reset({ mode: "edit", changes: {} })
    setCapture(null)
  }

  const saveDisabled = saveMutation.isPending || (creating && units.length === 0)
  const saveCapture = form.handleSubmit(({ changes, code, mode }) => {
    if (saveDisabled) return
    if (newProduct && mode === "create" && code) {
      const input = toProductCatalogCreateInput(code, {
        ...changes,
        unitId: changes.unitId ?? newProduct.classification.unit.id,
      })
      saveMutation.mutate({ mode, input })
      return
    }
    if (!editing || mode !== "edit") return
    const input = toProductCatalogEditInput(editing, changes)
    if (input) saveMutation.mutate({ mode, id: editing.id, input })
    else cancelCapture()
  })
  const restoreWindow = useDesktopWindowStore(selectRestoreDesktopWindow)
  const documentSearchActive = useDesktopWindowStore(({ windows }) => {
    let active: DesktopWindowEntry | undefined
    for (const window of windows) {
      if (!window.minimized && (active === undefined || active.zIndex < window.zIndex)) active = window
    }
    return active?.id === movementWindowId || active?.id === movementSearchWindowId
  })

  function openMovementSearch() {
    restoreWindow(movementSearchWindowId)
    setMovementSearchOpen(true)
  }

  function closeMovementSearch() {
    setMovementSearchOpen(false)
    restoreWindow(movementWindowId)
  }

  function openQueryPanel(panel: ProductPanelDefinition) {
    if (panel.key === "documents") {
      restoreWindow(movementWindowId)
      setMovementsOpen(true)
      return
    }
    openPanelWindow(`inventory:${product.id}:${panel.key}`, { panel, product })
  }

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

  const controlsDisabled = capturing || navigationMutation.isPending || deleteMutation.isPending

  return (
    <section className="mx-auto flex w-full min-w-0 max-w-[1800px] flex-1 flex-col gap-2">
      <ProductToolbar
        disabled={controlsDisabled}
        editDisabled={!product.editing?.writable}
        onCreate={startCreating}
        onDelete={() => setDeleteOpen(true)}
        onEdit={startEditing}
        onNext={() => navigationMutation.mutate("next")}
        onPrevious={() => navigationMutation.mutate("previous")}
        onSearch={documentSearchActive ? openMovementSearch : () => setSearchOpen(true)}
        searchLabel={documentSearchActive ? "Buscar documento" : "Buscar producto"}
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

      {capturing && (
        <div className="grid gap-2">
          <h2 className="border-b pb-1 text-xs font-semibold">{captureTitle}</h2>
          {saveMutation.isError && (
            <Alert variant="destructive">
              <AlertTitle>No fue posible guardar el producto</AlertTitle>
              <AlertDescription>{getApiErrorMessage(saveMutation.error)}</AlertDescription>
            </Alert>
          )}
          {editOptions.isError && (
            <Alert variant="destructive">
              <AlertTitle>No fue posible cargar las unidades</AlertTitle>
              <AlertDescription>{getApiErrorMessage(editOptions.error)}</AlertDescription>
              <Button className="w-fit" onClick={() => void editOptions.refetch()} size="xs" type="button" variant="outline">Reintentar</Button>
            </Alert>
          )}
        </div>
      )}

      <div className="grid min-w-0 items-start gap-2 xl:grid-cols-[10rem_minmax(0,1fr)_14rem]">
        <aside className="grid min-w-0 gap-2 sm:grid-cols-2 xl:grid-cols-1">
          <ProductPanelButtons
            hideActions={capturing}
            onSelect={(panel) =>
              openPanelWindow(`inventory:${product.id}:${panel.key}`, {
                panel,
                product,
              })
            }
            panels={actionPanels}
            title="Acciones"
          />
          <ProductPanelButtons
            hideActions={capturing}
            onSelect={(panel) =>
              openPanelWindow(`inventory:${product.id}:${panel.key}`, {
                panel,
                product,
              })
            }
            panels={purchasesProductionPanels}
            title="Compras/Prod"
          />
          {capturing && (
            <div className="flex gap-1 sm:col-span-2 xl:col-span-1">
              <Button disabled={saveDisabled} form={formId} size="sm" type="submit">
                {saveMutation.isPending && <Spinner data-icon="inline-start" />}
                OK
              </Button>
              <Button disabled={saveMutation.isPending} onClick={cancelCapture} size="sm" type="button" variant="outline">Cancelar</Button>
            </div>
          )}
        </aside>

        <form
          aria-label={capturing ? captureTitle : "Catálogo de productos"}
          className="min-w-0 data-[editing=true]:[&_input[readonly]]:bg-neutral-300 dark:data-[editing=true]:[&_input[readonly]]:bg-neutral-600"
          data-editing={capturing}
          id={formId}
          onSubmit={saveCapture}
        >
          <ProductCatalogDetails
            editor={capturing ? {
              control: form.control,
              disabled: saveMutation.isPending,
              fields: creating ? productCreateFields : new Set(editing?.editing?.editableFields),
              units,
            } : undefined}
            product={newProduct ?? editing ?? product}
          />
        </form>

        <aside className="min-w-0">
          <ProductQueriesPanel disabled={capturing} onSelect={openQueryPanel} />
        </aside>
      </div>

      {movementsOpen && (
        <DesktopWindowIdentity id={movementWindowId}>
          <InventoryMovementsDialog
            onClose={() => {
              setMovementsOpen(false)
              setMovementSearchOpen(false)
            }}
            onCloseSearch={closeMovementSearch}
            onSearch={openMovementSearch}
            searchOpen={movementSearchOpen}
          />
        </DesktopWindowIdentity>
      )}

      {searchOpen && (
        <DesktopWindowIdentity id="inventory:search">
          <ProductSearchDialog
            onOpenChange={setSearchOpen}
            onSelect={(selectedProduct) => {
              setSearchOpen(false)
              setNotice(null)
              openProduct(selectedProduct)
            }}
          />
        </DesktopWindowIdentity>
      )}

      {panelWindows.map((window) => (
        <OpenProductPanel
          id={window.id}
          key={window.id}
          onClose={() => closePanelWindow(window.id)}
          window={window.payload}
        />
      ))}

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
