import AlertCircleIcon from "@hugeicons/core-free-icons/AlertCircleIcon"
import Delete01Icon from "@hugeicons/core-free-icons/Delete01Icon"
import InformationCircleIcon from "@hugeicons/core-free-icons/InformationCircleIcon"
import { HugeiconsIcon } from "@hugeicons/react"
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router"
import { paths } from "@/app/router/paths"
import { signInPath, userDirectoryKey, webSessionKey } from "@/features/general-data/users/logic"
import { OrderCatalogDetails } from "@/features/sales/orders/components/order-catalog-details"
import { OrderAssignmentDialog } from "@/features/sales/orders/components/order-assignment-dialog"
import { OrderFormDialog } from "@/features/sales/orders/components/order-form-dialog"
import { OrderDuplicateDialog } from "@/features/sales/orders/components/order-duplicate-dialog"
import { OrderCaptureDialog } from "@/features/sales/orders/components/order-capture-dialog"
import { setOrderAuthorization, toggleOrderQuote } from "@/features/sales/orders/services/order-capture-service"
import { OrderPanelDialog } from "@/features/sales/orders/components/order-panel-dialog"
import { OrderSearchDialog } from "@/features/sales/orders/components/order-search-dialog"
import { OrderPanelButtons } from "@/features/sales/orders/components/order-side-panels"
import { OrderToolbar } from "@/features/sales/orders/components/order-toolbar"
import { orderActionPanels, orderDocumentTitles, orderSecondaryActionPanels } from "@/features/sales/orders/constants"
import { orderKeys, orderQueryOptions } from "@/features/sales/orders/logic"
import type { Order, OrderPanelDefinition } from "@/features/sales/orders/model"
import type { CaptureCustomerMatch, CaptureProductMatch } from "@/features/sales/orders/capture-model"
import { OrderCustomerMatchesDialog } from "@/features/sales/orders/components/order-customer-matches-dialog"
import { OrderProductMatchesDialog } from "@/features/sales/orders/components/order-product-matches-dialog"
import { deleteOrder, getAdjacentOrder } from "@/features/sales/orders/services/order-service"
import { getApiErrorMessage, isApiSessionRequired } from "@/shared/api/api-error"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle } from "@/shared/ui/alert-dialog"
import { Spinner } from "@/shared/ui/spinner"
import { DesktopWindowIdentity, useDesktopWindowCollection } from "@/shared/ui/desktop-window-context"
import { isTypingOrInDialog } from "@/shared/ui/erp-shortcuts"

type Notice = { kind: "success" | "error"; title: string; message: string }
type OrderPanelWindow = { order: Order; panel: OrderPanelDefinition }
type CustomerSearchWindow = { initialCode: string; onSelect: (match: CaptureCustomerMatch) => void }
type ProductSearchWindow = { initialCode: string; warehouse: string; onSelect: (match: CaptureProductMatch) => void }
export function OrderCatalogPage() {
  const orderId = Number(useParams().orderId)
  const navigate = useNavigate(); const queryClient = useQueryClient()
  const location = useLocation()
  const { data: order } = useSuspenseQuery(orderQueryOptions(orderId))
  const [searchOpen, setSearchOpen] = useState(false)
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [conversionOpen, setConversionOpen] = useState(false)
  const [assignmentOpen, setAssignmentOpen] = useState(false)
  const [customerSearch, setCustomerSearch] = useState<CustomerSearchWindow | null>(null)
  const [productSearch, setProductSearch] = useState<ProductSearchWindow | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const { windows: panelWindows, openWindow: openPanelWindow, closeWindow: closePanelWindow } = useDesktopWindowCollection<OrderPanelWindow>()
  const [notice, setNotice] = useState<Notice | null>(null)
  const { mutate: authorize, isPending: authorizing } = useMutation({
    networkMode: "always",
    retry: false,
    mutationFn: () => setOrderAuthorization(order.id, order.authorization !== "O.K.", order.storage?.revision ?? 0),
    onSuccess: saved => {
      queryClient.setQueryData(orderKeys.detail(saved.id), saved)
      void queryClient.invalidateQueries({ queryKey: orderKeys.all })
      setNotice({ kind: "success", title: "Autorizar", message: saved.authorization === "O.K." ? "Pedido autorizado: O.K." : "Pedido desautorizado." })
    },
    onError: error => {
      if (isApiSessionRequired(error)) {
        queryClient.setQueryData(webSessionKey, null)
        queryClient.removeQueries({ queryKey: userDirectoryKey })
        void navigate(signInPath(location.pathname + location.search + location.hash))
        return
      }
      void queryClient.invalidateQueries({ queryKey: orderKeys.detail(order.id) })
      setNotice({ kind: "error", title: "Autorización de pedido", message: getApiErrorMessage(error) })
    },
  })
  const conversion = useMutation({
    mutationFn: () => toggleOrderQuote(order.id),
    onSuccess: next => {
      queryClient.setQueryData(orderKeys.detail(next.id), next)
      setConversionOpen(false)
      setNotice({ kind: "success", title: "Cotiz", message: `${next.number} convertido a ${orderDocumentTitles[next.documentKind]}.` })
      void queryClient.invalidateQueries({ queryKey: orderKeys.all })
      void queryClient.invalidateQueries({ queryKey: ["inventories", "products"] })
    },
    onError: error => {
      setConversionOpen(false)
      setNotice({ kind: "error", title: "No fue posible convertir", message: getApiErrorMessage(error) })
    },
  })
  const openAssignment = () => {
    if (order.authorization !== "O.K.") { setWarning("Para asignar un pedido es necesario autorizarlo antes."); return }
    setAssignmentOpen(true)
  }
  const openEdit = () => {
    if (order.authorization === "O.K.") { setWarning("No se puede cambiar un pedido ya autorizado."); return }
    setProductSearch(null)
    setFormMode("edit")
  }
  const selectPanel = (panel: OrderPanelDefinition) => {
    if (panel.key === "quote-conversion") { setConversionOpen(true); return }
    if (panel.key === "authorize") { if (!authorizing) authorize(); return }
    if (panel.key === "assign-all") { openAssignment(); return }
    openPanelWindow(`orders:${order.id}:${panel.key}`, { order, panel })
  }
  const openOrder = (next: Order) => { queryClient.setQueryData(orderKeys.detail(next.id), next); void navigate(paths.salesOrder(next.id)) }
  const openSearchResult = (selectedOrderId: number) => {
    setSearchOpen(false)
    queryClient.removeQueries({ queryKey: orderKeys.detail(selectedOrderId), exact: true })
    void navigate(paths.salesOrder(selectedOrderId))
  }
  const navigation = useMutation({ mutationFn: (direction: "previous" | "next") => getAdjacentOrder(order.id, direction), onSuccess: (next, direction) => next ? openOrder(next) : setNotice({ kind: "success", title: "Fin del catálogo", message: direction === "previous" ? "Este es el primer pedido disponible." : "Este es el último pedido disponible." }), onError: (error) => setNotice({ kind: "error", title: "No fue posible navegar", message: getApiErrorMessage(error) }) })
  const deletion = useMutation({ mutationFn: () => deleteOrder(order.id), onSuccess: async () => { setDeleteOpen(false); await queryClient.invalidateQueries({ queryKey: orderKeys.all }); void navigate(paths.salesOrders, { replace: true }) }, onError: (error) => { setDeleteOpen(false); setNotice({ kind: "error", title: "No fue posible eliminar el pedido", message: getApiErrorMessage(error) }) } })
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if (event.defaultPrevented || !event.ctrlKey || event.altKey || event.metaKey || event.shiftKey || event.repeat ||
        isTypingOrInDialog(event) || formMode || searchOpen || assignmentOpen || authorizing || conversionOpen || deleteOpen || warning || panelWindows.length) return
      const key=event.key.toLowerCase()
      if (key === "a") { event.preventDefault(); authorize() }
      if (key === "p") {
        event.preventDefault()
        if (order.authorization !== "O.K.") setWarning("Para asignar un pedido es necesario autorizarlo antes.")
        else setAssignmentOpen(true)
      }
    }
    window.addEventListener("keydown", shortcut)
    return () => window.removeEventListener("keydown", shortcut)
  }, [assignmentOpen, authorize, authorizing, conversionOpen, deleteOpen, formMode, order, panelWindows.length, searchOpen, warning])
  return (
    <section className="flex w-full min-w-0 flex-1 flex-col gap-2">
      <OrderToolbar disabled={navigation.isPending || deletion.isPending || authorizing || conversion.isPending} onCreate={() => { setCustomerSearch(null); setProductSearch(null); setFormMode("create") }} onDelete={() => setDeleteOpen(true)} onEdit={openEdit} onNext={() => navigation.mutate("next")} onPrevious={() => navigation.mutate("previous")} onSearch={() => setSearchOpen(true)} />
      {notice && <Alert variant={notice.kind === "error" ? "destructive" : "default"}><HugeiconsIcon icon={notice.kind === "error" ? AlertCircleIcon : InformationCircleIcon} /><AlertTitle>{notice.title}</AlertTitle><AlertDescription>{notice.message}</AlertDescription></Alert>}
      <div className="grid min-w-0 items-start gap-2 @min-[70rem]/erp:grid-cols-[10rem_minmax(0,1fr)]">
        <aside className="grid gap-2 sm:grid-cols-2 @min-[70rem]/erp:grid-cols-1">
          <OrderPanelButtons authorization={{ pressed: order.authorization === "O.K.", pending: authorizing }} onSelect={selectPanel} panels={orderActionPanels} title="Acciones" />
          <OrderPanelButtons onSelect={selectPanel} panels={orderSecondaryActionPanels} title="Acciones sec" />
        </aside>
        <OrderCatalogDetails order={order} />
      </div>
      {searchOpen && <DesktopWindowIdentity id="orders:search"><OrderSearchDialog onOpenChange={setSearchOpen} onSelect={openSearchResult} /></DesktopWindowIdentity>}
      {formMode === "create" && <DesktopWindowIdentity id="orders:create:new"><OrderCaptureDialog onCustomerSearch={(initialCode, onSelect) => setCustomerSearch({ initialCode, onSelect })} onProductSearch={(initialCode, warehouse, onSelect) => setProductSearch({initialCode,warehouse,onSelect})} onOpenChange={open => { if (!open) { setCustomerSearch(null); setProductSearch(null); setFormMode(null) } }} onSaved={saved => { setCustomerSearch(null); setProductSearch(null); setFormMode(null); setNotice({ kind: "success", title: "Alta guardada", message: saved.number }); openOrder(saved) }} /></DesktopWindowIdentity>}
      {formMode === "create" && customerSearch && <DesktopWindowIdentity id="orders:capture:customer-search"><OrderCustomerMatchesDialog initialCode={customerSearch.initialCode} onOpenChange={open => { if (!open) setCustomerSearch(null) }} onSelect={match => { const select = customerSearch.onSelect; setCustomerSearch(null); select(match) }} /></DesktopWindowIdentity>}
      {formMode !== null && productSearch && <DesktopWindowIdentity id="orders:capture:product-search"><OrderProductMatchesDialog initialCode={productSearch.initialCode} warehouse={productSearch.warehouse} onOpenChange={open => { if (!open) setProductSearch(null) }} onSelect={match => { const select = productSearch.onSelect; setProductSearch(null); select(match) }} /></DesktopWindowIdentity>}
      {formMode === "edit" && <DesktopWindowIdentity id={`orders:edit:${order.id}`}><OrderFormDialog onProductSearch={(initialCode, warehouse, onSelect) => setProductSearch({initialCode,warehouse,onSelect})} onOpenChange={(open) => { if (!open) { setProductSearch(null); setFormMode(null) } }} onSaved={(saved) => { setProductSearch(null); setFormMode(null); setNotice({ kind: "success", title: "Pedido actualizado", message: saved.number }); openOrder(saved) }} order={order} /></DesktopWindowIdentity>}
      {assignmentOpen && <DesktopWindowIdentity id={`orders:assignment:${order.id}`}><OrderAssignmentDialog onOpenChange={setAssignmentOpen} onSaved={saved => { setAssignmentOpen(false); setNotice({kind:"success",title:"Asignación de Pedido",message:saved.status || "Pedido sin asignación."}); openOrder(saved) }} order={order} /></DesktopWindowIdentity>}
      {panelWindows.map((window) => <DesktopWindowIdentity id={window.id} key={window.id}>{window.payload.panel.key === "duplicate"
        ? <OrderDuplicateDialog order={window.payload.order} onOpenChange={open => { if (!open) closePanelWindow(window.id) }}
            onSaved={saved => { closePanelWindow(window.id); setNotice({ kind: "success", title: "Pedido duplicado", message: saved.number }); openOrder(saved) }} />
        : <OrderPanelDialog onOpenChange={(open) => { if (!open) closePanelWindow(window.id) }} order={window.payload.order} panel={window.payload.panel} />}</DesktopWindowIdentity>)}
      <AlertDialog open={conversionOpen} onOpenChange={open => { if (!conversion.isPending) setConversionOpen(open) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cotización</AlertDialogTitle>
            <AlertDialogDescription>¿Desea convertir el pedido/cotización {order.number}?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={conversion.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={conversion.isPending} onClick={() => conversion.mutate()}>
              {conversion.isPending && <Spinner />}OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog onOpenChange={setDeleteOpen} open={deleteOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogMedia><HugeiconsIcon icon={Delete01Icon} /></AlertDialogMedia><AlertDialogTitle>¿Eliminar el pedido {order.number}?</AlertDialogTitle><AlertDialogDescription>Se eliminarán el encabezado y sus partidas si no existen facturas ni cantidades surtidas.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction disabled={deletion.isPending} onClick={() => deletion.mutate()} variant="destructive">{deletion.isPending && <Spinner />}Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      <AlertDialog open={warning !== null} onOpenChange={open => { if (!open) setWarning(null) }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Pedidos</AlertDialogTitle><AlertDialogDescription>{warning}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogAction onClick={() => setWarning(null)}>OK</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </section>
  )
}
