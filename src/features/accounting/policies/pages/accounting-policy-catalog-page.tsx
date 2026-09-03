import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate, useParams } from "react-router"
import { paths } from "@/app/router/paths"
import { AccountingPolicyActionButtons } from "@/features/accounting/policies/components/accounting-policy-action-buttons"
import { AccountingPolicyActionDialog } from "@/features/accounting/policies/components/accounting-policy-action-dialog"
import { AccountingPolicyDetails } from "@/features/accounting/policies/components/accounting-policy-details"
import { AccountingPolicySearchDialog } from "@/features/accounting/policies/components/accounting-policy-search-dialog"
import { AccountingPolicyToolbar } from "@/features/accounting/policies/components/accounting-policy-toolbar"
import { primaryAccountingPolicyActions, secondaryAccountingPolicyActions } from "@/features/accounting/policies/constants"
import { accountingPolicyKeys, accountingPolicyQueryOptions } from "@/features/accounting/policies/logic"
import type { AccountingPolicy, AccountingPolicyAction } from "@/features/accounting/policies/model"
import { getAdjacentAccountingPolicy } from "@/features/accounting/policies/services/accounting-policy-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { DesktopWindowIdentity, useDesktopWindowCollection } from "@/shared/ui/desktop-window-context"

type Notice = { title: string; message: string; error?: boolean }
type AccountingPolicyActionWindow = { policy: AccountingPolicy; action: AccountingPolicyAction }

export function AccountingPolicyCatalogPage() {
  const id = Number(useParams().policyId)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: policy } = useSuspenseQuery(accountingPolicyQueryOptions(id))
  const [searchOpen, setSearchOpen] = useState(false)
  const { windows: actionWindows, openWindow: openActionWindow, closeWindow: closeActionWindow } = useDesktopWindowCollection<AccountingPolicyActionWindow>()
  const [notice, setNotice] = useState<Notice | null>(null)

  const openPolicy = (next: AccountingPolicy) => {
    queryClient.setQueryData(accountingPolicyKeys.detail(next.id), next)
    void navigate(paths.accountingPolicy(next.id))
  }

  const navigation = useMutation({
    mutationFn: (direction: "previous" | "next") => getAdjacentAccountingPolicy(policy.id, direction),
    onSuccess: (next, direction) => next
      ? openPolicy(next)
      : setNotice({ title: "Fin del catálogo", message: direction === "previous" ? "Esta es la primera póliza disponible." : "Esta es la última póliza disponible." }),
    onError: (error) => setNotice({ title: "No fue posible navegar", message: getApiErrorMessage(error), error: true }),
  })

  return (
    <main className="grid min-w-[74rem] grid-cols-[9rem_minmax(0,1fr)] items-start gap-2 p-2">
      <AccountingPolicyToolbar disabled={navigation.isPending} onNext={() => navigation.mutate("next")} onPrevious={() => navigation.mutate("previous")} onSearch={() => setSearchOpen(true)} />
      <aside className="grid gap-2">
        <AccountingPolicyActionButtons actions={primaryAccountingPolicyActions} onSelect={(action) => openActionWindow(`accounting:${policy.id}:${action.key}`, { policy, action })} />
        <AccountingPolicyActionButtons actions={secondaryAccountingPolicyActions} onSelect={(action) => openActionWindow(`accounting:${policy.id}:${action.key}`, { policy, action })} />
      </aside>
      <section className="min-w-0">
        {notice && <Alert className="mb-2" variant={notice.error ? "destructive" : "default"}><AlertTitle>{notice.title}</AlertTitle><AlertDescription>{notice.message}</AlertDescription></Alert>}
        <AccountingPolicyDetails policy={policy} />
      </section>

      {searchOpen && <DesktopWindowIdentity id="accounting:search"><AccountingPolicySearchDialog onOpenChange={setSearchOpen} onSelect={(selected) => { setSearchOpen(false); void navigate(paths.accountingPolicy(selected.id)) }} /></DesktopWindowIdentity>}
      {actionWindows.map((window) => <DesktopWindowIdentity id={window.id} key={window.id}><AccountingPolicyActionDialog action={window.payload.action} onClose={() => closeActionWindow(window.id)} policy={window.payload.policy} /></DesktopWindowIdentity>)}
    </main>
  )
}
