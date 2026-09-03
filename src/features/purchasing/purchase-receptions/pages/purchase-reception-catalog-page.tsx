import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate, useParams } from "react-router"
import { paths } from "@/app/router/paths"
import { PurchaseReceptionActionButtons } from "@/features/purchasing/purchase-receptions/components/purchase-reception-action-buttons"
import { PurchaseReceptionActionDialog } from "@/features/purchasing/purchase-receptions/components/purchase-reception-action-dialog"
import { PurchaseReceptionDetails } from "@/features/purchasing/purchase-receptions/components/purchase-reception-details"
import { PurchaseReceptionSearchDialog } from "@/features/purchasing/purchase-receptions/components/purchase-reception-search-dialog"
import { PurchaseReceptionToolbar } from "@/features/purchasing/purchase-receptions/components/purchase-reception-toolbar"
import { purchaseReceptionActions } from "@/features/purchasing/purchase-receptions/constants"
import { purchaseReceptionKeys, purchaseReceptionQueryOptions } from "@/features/purchasing/purchase-receptions/logic"
import type { PurchaseReception, PurchaseReceptionAction } from "@/features/purchasing/purchase-receptions/model"
import { getAdjacentPurchaseReception } from "@/features/purchasing/purchase-receptions/services/purchase-reception-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { DesktopWindowIdentity, useDesktopWindowCollection } from "@/shared/ui/desktop-window-context"

type Notice = { title: string; message: string; error?: boolean }
type PurchaseReceptionActionWindow = { reception: PurchaseReception; action: PurchaseReceptionAction }

export function PurchaseReceptionCatalogPage() {
  const id = Number(useParams().purchaseReceptionId)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: reception } = useSuspenseQuery(purchaseReceptionQueryOptions(id))
  const [searchOpen, setSearchOpen] = useState(false)
  const { windows: actionWindows, openWindow: openActionWindow, closeWindow: closeActionWindow } = useDesktopWindowCollection<PurchaseReceptionActionWindow>()
  const [notice, setNotice] = useState<Notice | null>(null)

  const openReception = (next: PurchaseReception) => {
    queryClient.setQueryData(purchaseReceptionKeys.detail(next.id), next)
    void navigate(paths.purchaseReception(next.id))
  }

  const navigation = useMutation({
    mutationFn: (direction: "previous" | "next") => getAdjacentPurchaseReception(reception.id, direction),
    onSuccess: (next, direction) => next
      ? openReception(next)
      : setNotice({ title: "Fin del catálogo", message: direction === "previous" ? "Esta es la primera recepción disponible." : "Esta es la última recepción disponible." }),
    onError: (error) => setNotice({ title: "No fue posible navegar", message: getApiErrorMessage(error), error: true }),
  })

  return (
    <main className="grid min-w-[74rem] grid-cols-[9rem_minmax(0,1fr)] items-start gap-2 p-2">
      <PurchaseReceptionToolbar
        disabled={navigation.isPending}
        onNext={() => navigation.mutate("next")}
        onPrevious={() => navigation.mutate("previous")}
        onSearch={() => setSearchOpen(true)}
      />
      <aside><PurchaseReceptionActionButtons actions={purchaseReceptionActions} onSelect={(action) => openActionWindow(`purchase-receptions:${reception.id}:${action.key}`, { reception, action })} /></aside>
      <section className="min-w-0">
        {notice && <Alert className="mb-2" variant={notice.error ? "destructive" : "default"}><AlertTitle>{notice.title}</AlertTitle><AlertDescription>{notice.message}</AlertDescription></Alert>}
        <PurchaseReceptionDetails reception={reception} />
      </section>

      {searchOpen && (
        <DesktopWindowIdentity id="purchase-receptions:search"><PurchaseReceptionSearchDialog
          onOpenChange={setSearchOpen}
          onSelect={(selected) => { setSearchOpen(false); void navigate(paths.purchaseReception(selected.id)) }}
        /></DesktopWindowIdentity>
      )}
      {actionWindows.map((window) => <DesktopWindowIdentity id={window.id} key={window.id}><PurchaseReceptionActionDialog action={window.payload.action} onClose={() => closeActionWindow(window.id)} reception={window.payload.reception} /></DesktopWindowIdentity>)}
    </main>
  )
}
