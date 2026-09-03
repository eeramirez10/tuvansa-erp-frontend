import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate, useParams } from "react-router"
import { paths } from "@/app/router/paths"
import { PurchaseOrderActionButtons } from "@/features/purchasing/purchase-orders/components/purchase-order-action-buttons"
import { PurchaseOrderActionDialog } from "@/features/purchasing/purchase-orders/components/purchase-order-action-dialog"
import { PurchaseOrderDetails } from "@/features/purchasing/purchase-orders/components/purchase-order-details"
import { PurchaseOrderSearchDialog } from "@/features/purchasing/purchase-orders/components/purchase-order-search-dialog"
import { PurchaseOrderToolbar } from "@/features/purchasing/purchase-orders/components/purchase-order-toolbar"
import { purchaseOrderActions } from "@/features/purchasing/purchase-orders/constants"
import { purchaseOrderKeys, purchaseOrderQueryOptions } from "@/features/purchasing/purchase-orders/logic"
import type { PurchaseOrder, PurchaseOrderAction } from "@/features/purchasing/purchase-orders/model"
import { getAdjacentPurchaseOrder } from "@/features/purchasing/purchase-orders/services/purchase-order-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { DesktopWindowIdentity, useDesktopWindowCollection } from "@/shared/ui/desktop-window-context"

type Notice = { title: string; message: string; error?: boolean }
type PurchaseOrderActionWindow = { purchaseOrder: PurchaseOrder; action: PurchaseOrderAction }

export function PurchaseOrderCatalogPage() {
  const id = Number(useParams().purchaseOrderId)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: purchaseOrder } = useSuspenseQuery(purchaseOrderQueryOptions(id))
  const [searchOpen, setSearchOpen] = useState(false)
  const { windows: actionWindows, openWindow: openActionWindow, closeWindow: closeActionWindow } = useDesktopWindowCollection<PurchaseOrderActionWindow>()
  const [notice, setNotice] = useState<Notice | null>(null)

  const openPurchaseOrder = (next: PurchaseOrder) => {
    queryClient.setQueryData(purchaseOrderKeys.detail(next.id), next)
    void navigate(paths.purchaseOrder(next.id))
  }

  const navigation = useMutation({
    mutationFn: (direction: "previous" | "next") => getAdjacentPurchaseOrder(purchaseOrder.id, direction),
    onSuccess: (next, direction) => next
      ? openPurchaseOrder(next)
      : setNotice({ title: "Fin del catálogo", message: direction === "previous" ? "Esta es la primera orden disponible." : "Esta es la última orden disponible." }),
    onError: (error) => setNotice({ title: "No fue posible navegar", message: getApiErrorMessage(error), error: true }),
  })

  return (
    <main className="grid min-w-[74rem] grid-cols-[9rem_minmax(0,1fr)] items-start gap-2 p-2">
      <PurchaseOrderToolbar
        disabled={navigation.isPending}
        onNext={() => navigation.mutate("next")}
        onPrevious={() => navigation.mutate("previous")}
        onSearch={() => setSearchOpen(true)}
      />
      <aside><PurchaseOrderActionButtons actions={purchaseOrderActions} onSelect={(action) => openActionWindow(`purchase-orders:${purchaseOrder.id}:${action.key}`, { purchaseOrder, action })} /></aside>
      <section className="min-w-0">
        {notice && <Alert className="mb-2" variant={notice.error ? "destructive" : "default"}><AlertTitle>{notice.title}</AlertTitle><AlertDescription>{notice.message}</AlertDescription></Alert>}
        <PurchaseOrderDetails purchaseOrder={purchaseOrder} />
      </section>

      {searchOpen && (
        <DesktopWindowIdentity id="purchase-orders:search"><PurchaseOrderSearchDialog
          onOpenChange={setSearchOpen}
          onSelect={(selected) => { setSearchOpen(false); void navigate(paths.purchaseOrder(selected.id)) }}
        /></DesktopWindowIdentity>
      )}
      {actionWindows.map((window) => <DesktopWindowIdentity id={window.id} key={window.id}><PurchaseOrderActionDialog action={window.payload.action} onClose={() => closeActionWindow(window.id)} purchaseOrder={window.payload.purchaseOrder} /></DesktopWindowIdentity>)}
    </main>
  )
}
