import AlertCircleIcon from "@hugeicons/core-free-icons/AlertCircleIcon"
import Delete01Icon from "@hugeicons/core-free-icons/Delete01Icon"
import InformationCircleIcon from "@hugeicons/core-free-icons/InformationCircleIcon"
import { HugeiconsIcon } from "@hugeicons/react"
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate, useParams } from "react-router"
import { paths } from "@/app/router/paths"
import { OrderCatalogDetails } from "@/features/sales/orders/components/order-catalog-details"
import { OrderFormDialog } from "@/features/sales/orders/components/order-form-dialog"
import { OrderPanelDialog } from "@/features/sales/orders/components/order-panel-dialog"
import { OrderSearchDialog } from "@/features/sales/orders/components/order-search-dialog"
import { OrderPanelButtons } from "@/features/sales/orders/components/order-side-panels"
import { OrderToolbar } from "@/features/sales/orders/components/order-toolbar"
import { orderActionPanels, orderSecondaryActionPanels } from "@/features/sales/orders/constants"
import { orderKeys, orderQueryOptions } from "@/features/sales/orders/logic"
import type { Order, OrderPanelDefinition } from "@/features/sales/orders/model"
import { deleteOrder, getAdjacentOrder } from "@/features/sales/orders/services/order-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle } from "@/shared/ui/alert-dialog"
import { Spinner } from "@/shared/ui/spinner"

type Notice = { kind: "success" | "error"; title: string; message: string }
export function OrderCatalogPage() {
  const orderId = Number(useParams().orderId)
  const navigate = useNavigate(); const queryClient = useQueryClient()
  const { data: order } = useSuspenseQuery(orderQueryOptions(orderId))
  const [searchOpen, setSearchOpen] = useState(false)
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [panel, setPanel] = useState<OrderPanelDefinition | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  const openOrder = (next: Order) => { queryClient.setQueryData(orderKeys.detail(next.id), next); void navigate(paths.salesOrder(next.id)) }
  const navigation = useMutation({ mutationFn: (direction: "previous" | "next") => getAdjacentOrder(order.id, direction), onSuccess: (next, direction) => next ? openOrder(next) : setNotice({ kind: "success", title: "Fin del catálogo", message: direction === "previous" ? "Este es el primer pedido disponible." : "Este es el último pedido disponible." }), onError: (error) => setNotice({ kind: "error", title: "No fue posible navegar", message: getApiErrorMessage(error) }) })
  const deletion = useMutation({ mutationFn: () => deleteOrder(order.id), onSuccess: async () => { setDeleteOpen(false); await queryClient.invalidateQueries({ queryKey: orderKeys.all }); void navigate(paths.salesOrders, { replace: true }) }, onError: (error) => { setDeleteOpen(false); setNotice({ kind: "error", title: "No fue posible eliminar el pedido", message: getApiErrorMessage(error) }) } })
  return (
    <section className="mx-auto flex w-full min-w-0 max-w-[1800px] flex-1 flex-col gap-2">
      <OrderToolbar disabled={navigation.isPending || deletion.isPending} onCreate={() => setFormMode("create")} onDelete={() => setDeleteOpen(true)} onEdit={() => setFormMode("edit")} onNext={() => navigation.mutate("next")} onPrevious={() => navigation.mutate("previous")} onSearch={() => setSearchOpen(true)} />
      {notice && <Alert variant={notice.kind === "error" ? "destructive" : "default"}><HugeiconsIcon icon={notice.kind === "error" ? AlertCircleIcon : InformationCircleIcon} /><AlertTitle>{notice.title}</AlertTitle><AlertDescription>{notice.message}</AlertDescription></Alert>}
      <div className="grid min-w-0 items-start gap-2 xl:grid-cols-[10rem_minmax(0,1fr)]">
        <aside className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1"><OrderPanelButtons onSelect={setPanel} panels={orderActionPanels} title="Acciones" /><OrderPanelButtons onSelect={setPanel} panels={orderSecondaryActionPanels} title="Acciones sec" /></aside>
        <OrderCatalogDetails order={order} />
      </div>
      {searchOpen && <OrderSearchDialog onOpenChange={setSearchOpen} onSelect={(selected) => { setSearchOpen(false); openOrder(selected) }} />}
      {formMode && <OrderFormDialog mode={formMode} onOpenChange={(open) => { if (!open) setFormMode(null) }} onSaved={(saved) => { setFormMode(null); setNotice({ kind: "success", title: formMode === "create" ? "Pedido creado" : "Pedido actualizado", message: saved.number }); openOrder(saved) }} order={formMode === "edit" ? order : undefined} />}
      {panel && <OrderPanelDialog key={`${order.id}-${panel.key}`} onOpenChange={(open) => { if (!open) setPanel(null) }} order={order} panel={panel} />}
      <AlertDialog onOpenChange={setDeleteOpen} open={deleteOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogMedia><HugeiconsIcon icon={Delete01Icon} /></AlertDialogMedia><AlertDialogTitle>¿Eliminar el pedido {order.number}?</AlertDialogTitle><AlertDialogDescription>Se eliminarán el encabezado y sus partidas si no existen facturas ni cantidades surtidas.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction disabled={deletion.isPending} onClick={() => deletion.mutate()} variant="destructive">{deletion.isPending && <Spinner />}Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </section>
  )
}
