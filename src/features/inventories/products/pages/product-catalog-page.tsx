import AlertCircleIcon from "@hugeicons/core-free-icons/AlertCircleIcon"
import InformationCircleIcon from "@hugeicons/core-free-icons/InformationCircleIcon"
import { zodResolver } from "@hookform/resolvers/zod"
import { HugeiconsIcon } from "@hugeicons/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { useEffect, useId, useRef, useState } from "react"
import { useForm, type SubmitHandler } from "react-hook-form"
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
import { ProductRemovalDialog } from "@/features/inventories/products/components/product-removal-dialog"
import { ProductSearchDialog } from "@/features/inventories/products/components/product-search-dialog"
import { ProductPanelButtons } from "@/features/inventories/products/components/product-side-panels"
import { ProductToolbar } from "@/features/inventories/products/components/product-toolbar"
import {
  getNewProductCatalog,
  productCodeAvailabilityQueryOptions,
  productCreateOptionsQueryOptions,
  productEditOptionsQueryOptions,
  productKeys,
  productQueryOptions,
  toProductCatalogCreateInput,
  toProductCatalogEditInput,
} from "@/features/inventories/products/logic"
import {
  productCatalogFormSchema,
  productCodeSchema,
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
  getAdjacentProduct,
  updateProduct,
} from "@/features/inventories/products/services/product-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
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

function apiErrorCode(error: unknown) {
  return isAxiosError<{ error?: { code?: string } }>(error) ? error.response?.data.error?.code : undefined
}

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
  const productId = Number(params.productId ?? 0)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const productQuery = useQuery({ ...productQueryOptions(productId), enabled: productId > 0 })
  const product = productQuery.data
  const [searchOpen, setSearchOpen] = useState(false)
  const [movementsOpen, setMovementsOpen] = useState(false)
  const [movementSearchOpen, setMovementSearchOpen] = useState(false)
  const [capture, setCapture] = useState<ProductCapture | null>(null)
  const [removing, setRemoving] = useState<Product | null>(null)
  const {
    windows: panelWindows,
    openWindow: openPanelWindow,
    closeWindow: closePanelWindow,
  } = useDesktopWindowCollection<ProductPanelWindow>()
  const [notice, setNotice] = useState<Notice | null>(null)
  const creating = capture?.mode === "create" && capture.fromProductId === productId
  const editing = capture?.mode === "edit" && capture.product.id === productId ? capture.product : null
  const capturing = creating || Boolean(editing)
  const captureTitle = creating ? "Alta de productos" : "Cambio de producto"
  const formId = useId()
  const codeValidationRequest = useRef(0)
  const saveLock = useRef(false)
  const captureGeneration = useRef(0)
  const form = useForm<ProductCatalogDraft, unknown, ProductCatalogValues>({
    defaultValues: { mode: "edit", changes: {} },
    resolver: zodResolver(productCatalogFormSchema),
  })
  const { setFocus: focusField } = form
  useEffect(() => () => {
    codeValidationRequest.current += 1
    captureGeneration.current += 1
  }, [productId])

  function resetCodeValidation() {
    codeValidationRequest.current += 1
    if (form.getFieldState("code").error?.type === "availability") form.clearErrors("code")
  }

  function rejectDuplicateCode(code: string, clearCode: boolean) {
    if (clearCode) form.setValue("code", "", { shouldDirty: true })
    form.setError("code", {
      type: "availability",
      message: `El código ${code} ya existe. Captura otro código.`,
    }, { shouldFocus: true })
  }

  async function validateCode(value: string, mode: "create" | "edit") {
    const parsed = productCodeSchema.safeParse(value)
    if (!parsed.success) return false
    if (mode === "edit" && parsed.data === editing?.code.trim().toUpperCase()) return true
    const request = ++codeValidationRequest.current
    try {
      const available = await queryClient.fetchQuery(productCodeAvailabilityQueryOptions(parsed.data))
      if (request !== codeValidationRequest.current) return false
      if (!available) rejectDuplicateCode(parsed.data, mode === "create")
      return available
    } catch {
      if (request === codeValidationRequest.current) {
        form.setError("code", {
          type: "availability",
          message: "No fue posible validar el código. Inténtalo de nuevo.",
        }, { shouldFocus: true })
      }
      return false
    }
  }

  const createOptions = useQuery({ ...productCreateOptionsQueryOptions(), enabled: creating })
  const editOptions = useQuery({ ...productEditOptionsQueryOptions(productId), enabled: Boolean(editing) })
  const options = creating ? createOptions : editOptions
  const units = options.data?.units ?? []
  const newProduct = creating ? getNewProductCatalog(units) : null
  const createBlocked = creating && createOptions.data?.canWrite === false

  function invalidateCatalogConsumers() {
    void queryClient.invalidateQueries({ queryKey: ["inventories", "reports"] })
    void queryClient.invalidateQueries({ queryKey: ["sales", "orders", "capture", "product"] })
    void queryClient.invalidateQueries({ queryKey: ["sales", "orders", "capture", "product-matches"] })
    void queryClient.invalidateQueries({ queryKey: ["purchasing", "purchase-receptions", "general-expenses", "catalog", "productCode"] })
  }

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
      invalidateCatalogConsumers()
    },
    onError: (error, operation) => {
      if (operation.mode === "edit" && apiErrorCode(error) === "PRODUCT_EDIT_STALE") {
        void queryClient.invalidateQueries({ queryKey: productKeys.detail(operation.id), exact: true })
      }
      if (operation.input.code && apiErrorCode(error) === "PRODUCT_CODE_EXISTS") {
        rejectDuplicateCode(operation.input.code, operation.mode === "create")
      }
    },
  })
  useEffect(() => {
    if (creating && !createBlocked) focusField("code")
    else if (editing?.editing?.editableFields.includes("code")) focusField("code", { shouldSelect: true })
    else if (editing?.editing?.editableFields.includes("description")) {
      focusField("changes.description", { shouldSelect: true })
    }
  }, [createBlocked, creating, editing, focusField])

  function startCreating() {
    resetCodeValidation()
    saveMutation.reset()
    form.reset({ mode: "create", changes: {} })
    setNotice(null)
    setCapture({ mode: "create", fromProductId: productId })
  }

  function startEditing(current: Product | undefined) {
    if (!current?.editing?.writable) return
    resetCodeValidation()
    saveMutation.reset()
    form.reset({ mode: "edit", changes: {} })
    setNotice(null)
    setCapture({ mode: "edit", product: current })
  }

  function cancelCapture() {
    if (saveLock.current) return
    captureGeneration.current += 1
    resetCodeValidation()
    saveMutation.reset()
    form.reset({ mode: "edit", changes: {} })
    setCapture(null)
  }

  const staleEdit = Boolean(editing && (editing.editing?.revision !== product?.editing?.revision
    || apiErrorCode(saveMutation.error) === "PRODUCT_EDIT_STALE"))
  const saving = form.formState.isSubmitting || saveMutation.isPending
  const saveDisabled = saving || staleEdit || options.isFetching || options.isError
    || (creating && (createOptions.data?.canWrite !== true || units.length === 0))

  async function reloadEditing() {
    if (saveLock.current || productQuery.isFetching) return
    const generation = captureGeneration.current
    const current = await productQuery.refetch()
    if (generation !== captureGeneration.current) return
    if (current.isSuccess && current.data.editing?.writable) startEditing(current.data)
    else if (current.isSuccess) {
      cancelCapture()
      setNotice({ kind: "error", title: "Cambio no disponible", message: "La ficha actual ya no admite cambios." })
    } else {
      setNotice({ kind: "error", title: "No fue posible recargar la ficha", message: getApiErrorMessage(current.error) })
    }
  }

  const saveCapture: SubmitHandler<ProductCatalogValues> = async ({ changes, code, mode }) => {
    if (saveDisabled || saveLock.current) return
    const input = editing && mode === "edit" ? toProductCatalogEditInput(editing, changes, code) : null
    if (mode === "edit" && !input) {
      cancelCapture()
      return
    }
    const generation = captureGeneration.current
    saveLock.current = true
    try {
      if (newProduct && mode === "create" && code) {
        const unitId = changes.unitId ?? newProduct.classification.unit.id
        if (!units.some(unit => unit.id === unitId)) {
          form.setError("changes.unitId", { type: "required", message: "Selecciona una unidad del catálogo." }, { shouldFocus: true })
          return
        }
        if (!(await validateCode(code, "create")) || generation !== captureGeneration.current) return
        await saveMutation.mutateAsync({ mode, input: toProductCatalogCreateInput(code, { ...changes, unitId }) })
      } else if (editing && mode === "edit" && input) {
        if (input.code && (!(await validateCode(input.code, "edit")) || generation !== captureGeneration.current)) return
        await saveMutation.mutateAsync({ mode, id: editing.id, input })
      }
    } catch {
      // The mutation error keeps the capture open and is rendered with the form.
    } finally {
      saveLock.current = false
    }
  }
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
    if (!product) return
    if (panel.key === "documents") {
      restoreWindow(movementWindowId)
      setMovementsOpen(true)
      return
    }
    openPanelWindow(`inventory:${product.id}:${panel.key}`, { panel, product })
  }

  const openProduct = (nextProduct: Product) => {
    void navigate(paths.inventoryProduct(nextProduct.id))
  }

  const navigationMutation = useMutation({
    mutationFn: (direction: "previous" | "next") => getAdjacentProduct(productId, direction),
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

  async function onProductRemoved(removed: Product) {
    for (const window of panelWindows) {
      if (window.payload.product.id === removed.id) closePanelWindow(window.id)
    }
    void queryClient.invalidateQueries({
      queryKey: productKeys.all,
      predicate: ({ queryKey }) => queryKey[2] !== "detail" || queryKey[3] !== removed.id,
    })
    invalidateCatalogConsumers()
    setNotice({ kind: "success", title: "Producto dado de baja", message: `${removed.code} · ${removed.description}` })
    setRemoving(null)
    await navigate(paths.inventoryProducts, { replace: true })
    queryClient.removeQueries({ queryKey: productKeys.detail(removed.id), type: "inactive" })
  }

  const controlsDisabled = capturing || navigationMutation.isPending || Boolean(removing)
  const shownProduct = newProduct ?? editing ?? product
  const codeError = form.formState.errors.code?.type
  useEffect(() => {
    if (!saving && codeError === "availability") focusField("code")
  }, [codeError, focusField, saving])

  return (
    <section className="mx-auto flex w-full min-w-0 max-w-[1800px] flex-1 flex-col gap-2">
      <ProductToolbar
        disabled={controlsDisabled}
        editDisabled={!product?.editing?.writable}
        onCreate={startCreating}
        hasProduct={Boolean(product)}
        onDelete={() => { if (product) setRemoving(product) }}
        onEdit={() => startEditing(product)}
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
          {saveMutation.isError && !staleEdit && (
            <Alert variant="destructive">
              <AlertTitle>No fue posible guardar el producto</AlertTitle>
              <AlertDescription>{getApiErrorMessage(saveMutation.error)}</AlertDescription>
            </Alert>
          )}
          {staleEdit && (
            <Alert variant="destructive">
              <AlertTitle>La ficha cambió desde que abriste la captura</AlertTitle>
              <AlertDescription>Tu borrador sigue visible. Recarga la ficha para comenzar con la revisión vigente.</AlertDescription>
              <Button className="w-fit" disabled={saving || productQuery.isFetching} onClick={() => void reloadEditing()}
                size="xs" type="button" variant="outline">Descartar cambios y recargar</Button>
            </Alert>
          )}
          {options.isError && (
            <Alert variant="destructive">
              <AlertTitle>No fue posible consultar el catálogo para la captura</AlertTitle>
              <AlertDescription>{getApiErrorMessage(options.error)}</AlertDescription>
              <Button className="w-fit" onClick={() => void options.refetch()} size="xs" type="button" variant="outline">Reintentar</Button>
            </Alert>
          )}
          {createBlocked && <Alert role="status"><AlertDescription>{createOptions.data?.reason || "El alta no está disponible."}</AlertDescription></Alert>}
          {creating && createOptions.data?.canWrite && units.length === 0 && (
            <Alert role="status"><AlertDescription>No hay unidades activas para registrar el producto.</AlertDescription></Alert>
          )}
          {options.isPending && <p className="flex items-center gap-1 text-muted-foreground" role="status"><Spinner /> Consultando catálogo…</p>}
        </div>
      )}

      {shownProduct ? <div className="grid min-w-0 items-start gap-2 xl:grid-cols-[10rem_minmax(0,1fr)_14rem]">
        <aside className="grid min-w-0 gap-2 sm:grid-cols-2 xl:grid-cols-1">
          {product && (
            <>
              <ProductPanelButtons hideActions={capturing || Boolean(removing)} onSelect={openQueryPanel}
                panels={actionPanels} title="Acciones" />
              <ProductPanelButtons hideActions={capturing || Boolean(removing)} onSelect={openQueryPanel}
                panels={purchasesProductionPanels} title="Compras/Prod" />
            </>
          )}
          {capturing && (
            <div className="flex gap-1 sm:col-span-2 xl:col-span-1">
              <Button disabled={saveDisabled} form={formId} size="sm" type="submit">
                {saving && <Spinner data-icon="inline-start" />}
                OK
              </Button>
              <Button disabled={saving} onClick={cancelCapture} size="sm" type="button" variant="outline">Cancelar</Button>
            </div>
          )}
        </aside>

        <form
          aria-label={capturing ? captureTitle : "Catálogo de productos"}
          className="min-w-0 data-[editing=true]:[&_input[readonly]]:bg-neutral-300 dark:data-[editing=true]:[&_input[readonly]]:bg-neutral-600"
          data-editing={capturing}
          id={formId}
          onSubmit={(event) => { void form.handleSubmit(saveCapture)(event) }}
        >
          <ProductCatalogDetails
            editor={capturing ? {
              control: form.control,
              disabled: saving || createBlocked,
              fields: creating ? productCreateFields : new Set(editing?.editing?.editableFields),
              units,
              codeValidation: creating || editing?.editing?.editableFields.includes("code") ? {
                onBlur: (value) => { void validateCode(value, creating ? "create" : "edit") },
                onChange: resetCodeValidation,
              } : undefined,
            } : undefined}
            product={shownProduct}
          />
        </form>

        <aside className="min-w-0">
          <ProductQueriesPanel disabled={capturing || Boolean(removing)} onSelect={openQueryPanel} />
        </aside>
      </div> : (
        <Alert>
          <AlertDescription>{productId > 0
            ? (productQuery.isError ? getApiErrorMessage(productQuery.error) : "Consultando producto…")
            : "No hay productos activos en el catálogo."}</AlertDescription>
        </Alert>
      )}

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

      {removing && (
        <DesktopWindowIdentity id={`inventory:${removing.id}:removal`}>
          <ProductRemovalDialog key={removing.id} onClose={() => setRemoving(null)} onDeleted={onProductRemoved} product={removing} />
        </DesktopWindowIdentity>
      )}
    </section>
  )
}
