import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate, useParams } from "react-router"
import { paths } from "@/app/router/paths"
import { PostingReversalDialog } from "@/features/accounts-payable/components/posting-reversal-dialog"
import { GeneralExpensesDialog } from "@/features/purchasing/purchase-receptions/components/general-expenses-dialog"
import { PurchaseReceptionActionButtons } from "@/features/purchasing/purchase-receptions/components/purchase-reception-action-buttons"
import { PurchaseReceptionActionDialog } from "@/features/purchasing/purchase-receptions/components/purchase-reception-action-dialog"
import { PurchaseReceptionCreateDialog } from "@/features/purchasing/purchase-receptions/components/purchase-reception-create-dialog"
import { PurchaseReceptionDetails } from "@/features/purchasing/purchase-receptions/components/purchase-reception-details"
import { PurchaseReceptionSearchDialog } from "@/features/purchasing/purchase-receptions/components/purchase-reception-search-dialog"
import { PurchaseReceptionToolbar } from "@/features/purchasing/purchase-receptions/components/purchase-reception-toolbar"
import { purchaseReceptionActions } from "@/features/purchasing/purchase-receptions/constants"
import { purchaseReceptionKeys, purchaseReceptionQueryOptions } from "@/features/purchasing/purchase-receptions/logic"
import type { PurchaseReception, PurchaseReceptionAction, PurchaseReceptionCancellationKind } from "@/features/purchasing/purchase-receptions/model"
import {
  cancelPurchaseReception,
  getAdjacentPurchaseReception,
  getPurchaseReceptionCancellationPreview,
} from "@/features/purchasing/purchase-receptions/services/purchase-reception-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { DesktopWindowIdentity, useDesktopWindowCollection } from "@/shared/ui/desktop-window-context"

type Notice = { title: string; message: string; error?: boolean }
type PurchaseReceptionActionWindow = { reception: PurchaseReception; action: PurchaseReceptionAction }
type CancellationWindow = { id: number; kind: PurchaseReceptionCancellationKind }

function cancellationKind(reception: PurchaseReception): PurchaseReceptionCancellationKind | null {
  if (reception.number.startsWith("GAW") && reception.totals.expenseTaxes) return "expense"
  return /^RW\d{8}$/.test(reception.number) && reception.id >= 6_700_000_000_000 && reception.id < 6_700_100_000_000
    ? "reception"
    : null
}

export function PurchaseReceptionCatalogPage() {
  const id = Number(useParams().purchaseReceptionId)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: reception } = useQuery({ ...purchaseReceptionQueryOptions(id), enabled: id > 0 })
  const [searchOpen, setSearchOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [generalExpensesOpen, setGeneralExpensesOpen] = useState(false)
  const { windows: actionWindows, openWindow: openActionWindow, closeWindow: closeActionWindow } = useDesktopWindowCollection<PurchaseReceptionActionWindow>()
  const { windows: cancellationWindows, openWindow: openCancellation, closeWindow: closeCancellation } = useDesktopWindowCollection<CancellationWindow>()
  const [notice, setNotice] = useState<Notice | null>(null)
  const kind = reception ? cancellationKind(reception) : null

  const openReception = (next: PurchaseReception) => {
    queryClient.setQueryData(purchaseReceptionKeys.detail(next.id), next)
    void navigate(paths.purchaseReception(next.id))
  }

  const navigation = useMutation({
    mutationFn: (direction: "previous" | "next") => getAdjacentPurchaseReception(id, direction),
    onSuccess: (next, direction) => next
      ? openReception(next)
      : setNotice({ title: "Fin del catálogo", message: direction === "previous" ? "Esta es la primera recepción disponible." : "Esta es la última recepción disponible." }),
    onError: (error) => setNotice({ title: "No fue posible navegar", message: getApiErrorMessage(error), error: true }),
  })

  return (
    <main className="grid min-w-[74rem] grid-cols-[9rem_minmax(0,1fr)] items-start gap-2 p-2">
      <PurchaseReceptionToolbar
        disabled={navigation.isPending}
        hasReception={Boolean(reception)}
        onCreate={() => setCreateOpen(true)}
        onGeneralExpenses={() => setGeneralExpensesOpen(true)}
        onNext={() => navigation.mutate("next")}
        onPrevious={() => navigation.mutate("previous")}
        onSearch={() => setSearchOpen(true)}
      />
      <aside>{reception && <PurchaseReceptionActionButtons actions={purchaseReceptionActions}
        onSelect={(action) => openActionWindow(`purchase-receptions:${reception.id}:${action.key}`, { reception, action })} />}</aside>
      <section className="min-w-0">
        {notice && <Alert className="mb-2" variant={notice.error ? "destructive" : "default"}><AlertTitle>{notice.title}</AlertTitle><AlertDescription>{notice.message}</AlertDescription></Alert>}
        {reception && <PurchaseReceptionDetails
          onCancel={kind
            ? () => openCancellation(`purchase-receptions:${reception.id}:cancel-${kind}`, { id: reception.id, kind })
            : undefined}
          reception={reception}
        />}
      </section>

      {searchOpen && (
        <DesktopWindowIdentity id="purchase-receptions:search"><PurchaseReceptionSearchDialog
          onOpenChange={setSearchOpen}
          onSelect={(selected) => { setSearchOpen(false); void navigate(paths.purchaseReception(selected.id)) }}
        /></DesktopWindowIdentity>
      )}
      {createOpen && (
        <DesktopWindowIdentity id="purchase-receptions:create">
          <PurchaseReceptionCreateDialog
            onClose={() => setCreateOpen(false)}
            onCreated={(next) => { setCreateOpen(false); setNotice(null); openReception(next) }}
          />
        </DesktopWindowIdentity>
      )}
      {generalExpensesOpen && <DesktopWindowIdentity id="purchase-receptions:general-expenses">
        <GeneralExpensesDialog onClose={() => setGeneralExpensesOpen(false)} />
      </DesktopWindowIdentity>}
      {cancellationWindows.map(({ id: windowId, payload: { id: receptionId, kind } }) => (
        <DesktopWindowIdentity id={windowId} key={windowId}>
          <PostingReversalDialog
            kind={kind}
            load={signal => getPurchaseReceptionCancellationPreview(receptionId, kind, signal)}
            onClose={() => closeCancellation(windowId)}
            queryKey={purchaseReceptionKeys.cancellation(receptionId, kind)}
            record={input => cancelPurchaseReception(receptionId, kind, input)}
          />
        </DesktopWindowIdentity>
      ))}
      {actionWindows.map((window) => <DesktopWindowIdentity id={window.id} key={window.id}><PurchaseReceptionActionDialog action={window.payload.action} onClose={() => closeActionWindow(window.id)} reception={window.payload.reception} /></DesktopWindowIdentity>)}
    </main>
  )
}
