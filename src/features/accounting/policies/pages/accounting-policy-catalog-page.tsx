import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate, useParams } from "react-router"
import { paths } from "@/app/router/paths"
import { AccountingPolicyActionButtons } from "@/features/accounting/policies/components/accounting-policy-action-buttons"
import { AccountingPolicyActionDialog } from "@/features/accounting/policies/components/accounting-policy-action-dialog"
import { AccountingPolicyDetails } from "@/features/accounting/policies/components/accounting-policy-details"
import { AccountingPolicyDuplicateDialog } from "@/features/accounting/policies/components/accounting-policy-duplicate-dialog"
import { AccountingPolicySearchDialog } from "@/features/accounting/policies/components/accounting-policy-search-dialog"
import { AccountingPolicyToolbar } from "@/features/accounting/policies/components/accounting-policy-toolbar"
import { ManualPolicyCaptureDialog } from "@/features/accounting/policies/components/manual-policy-capture-dialog"
import { ManualPolicyTransitionDialog } from "@/features/accounting/policies/components/manual-policy-transition-dialog"
import { primaryAccountingPolicyActions, secondaryAccountingPolicyActions } from "@/features/accounting/policies/constants"
import { accountingPolicyKeys, accountingPolicyQueryOptions } from "@/features/accounting/policies/logic"
import type { AccountingPolicy, AccountingPolicyAction, ManualPolicyOperation } from "@/features/accounting/policies/model"
import { getAdjacentAccountingPolicy } from "@/features/accounting/policies/services/accounting-policy-service"
import { bankAccountKeys } from "@/features/treasury/banking/logic"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { DesktopWindowIdentity, useDesktopWindowCollection } from "@/shared/ui/desktop-window-context"

type Notice = { title: string; message: string; error?: boolean }
type AccountingPolicyActionWindow = { policy: AccountingPolicy; action: AccountingPolicyAction }

export function AccountingPolicyCatalogPage() {
  const id = Number(useParams().policyId ?? 0)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const query = useQuery({ ...accountingPolicyQueryOptions(id), enabled: id > 0 })
  const policy = query.data
  const [searchOpen, setSearchOpen] = useState(false)
  const [capture, setCapture] = useState<{ id?: number } | null>(null)
  const [transition, setTransition] = useState<{ policy: AccountingPolicy; operation: ManualPolicyOperation } | null>(null)
  const { windows: actionWindows, openWindow: openActionWindow, closeWindow: closeActionWindow } = useDesktopWindowCollection<AccountingPolicyActionWindow>()
  const [notice, setNotice] = useState<Notice | null>(null)

  const openPolicy = (next: AccountingPolicy) => {
    queryClient.setQueryData(accountingPolicyKeys.detail(next.id), next)
    void navigate(paths.accountingPolicy(next.id))
  }

  const navigation = useMutation({
    mutationFn: (direction: "previous" | "next") => getAdjacentAccountingPolicy(id, direction),
    onSuccess: (next, direction) => next
      ? openPolicy(next)
      : setNotice({ title: "Fin del catálogo", message: direction === "previous" ? "Esta es la primera póliza disponible." : "Esta es la última póliza disponible." }),
    onError: (error) => setNotice({ title: "No fue posible navegar", message: getApiErrorMessage(error), error: true }),
  })

  function saved(result: AccountingPolicy, operation: "create" | "edit" | "duplicate" | ManualPolicyOperation) {
    const titles = { create: "Póliza registrada", edit: "Póliza actualizada", duplicate: "Póliza duplicada",
      apply: "Póliza aplicada", unapply: "Póliza desaplicada", delete: "Póliza dada de baja" }
    queryClient.setQueryData(accountingPolicyKeys.detail(result.id), result)
    setCapture(null)
    setTransition(null)
    setNotice({ title: titles[operation], message: result.number })
    void queryClient.invalidateQueries({ queryKey: accountingPolicyKeys.all })
    void queryClient.invalidateQueries({ queryKey: ["accounting", "reports"] })
    void queryClient.invalidateQueries({ queryKey: bankAccountKeys.all })
    if (operation === "create" || operation === "duplicate") void navigate(paths.accountingPolicy(result.id))
  }

  const busy = Boolean(capture || transition) || navigation.isPending
  const manual = policy?.manual
  return (
    <main className="grid min-w-[74rem] grid-cols-[9rem_minmax(0,1fr)] items-start gap-2 p-2">
      <AccountingPolicyToolbar canDelete={Boolean(manual && !manual.canceled)} canEdit={Boolean(manual && !manual.canceled && !policy?.applied)}
        disabled={busy} hasPolicy={Boolean(policy)} onCreate={() => { setNotice(null); setCapture({}) }}
        onDelete={() => { if (policy?.manual) setTransition({ policy, operation: "delete" }) }}
        onEdit={() => { if (policy?.manual && !policy.applied) setCapture({ id: policy.id }) }}
        onNext={() => navigation.mutate("next")} onPrevious={() => navigation.mutate("previous")} onSearch={() => setSearchOpen(true)} />
      <aside className="grid gap-2">{policy && <>
        <AccountingPolicyActionButtons actions={primaryAccountingPolicyActions} onSelect={(action) => openActionWindow(`accounting:${policy.id}:${action.key}`, { policy, action })} />
        <AccountingPolicyActionButtons actions={secondaryAccountingPolicyActions} disabled={!manual || manual.canceled || busy}
          onSelect={action => {
            if (manual && (action.key === "apply" || action.key === "unapply")) setTransition({ policy, operation: action.key })
          }} />
      </>}</aside>
      <section className="min-w-0">
        {notice && <Alert className="mb-2" variant={notice.error ? "destructive" : "default"}><AlertTitle>{notice.title}</AlertTitle><AlertDescription>{notice.message}</AlertDescription></Alert>}
        {policy ? <AccountingPolicyDetails policy={policy} /> : <Alert><AlertDescription>{id > 0
          ? (query.isError ? getApiErrorMessage(query.error) : "Consultando póliza…")
          : "No hay pólizas disponibles."}</AlertDescription></Alert>}
      </section>

      {searchOpen && <DesktopWindowIdentity id="accounting:search"><AccountingPolicySearchDialog onOpenChange={setSearchOpen} onSelect={(selected) => { setSearchOpen(false); void navigate(paths.accountingPolicy(selected.id)) }} /></DesktopWindowIdentity>}
      {actionWindows.map((window) => <DesktopWindowIdentity id={window.id} key={window.id}>
        {window.payload.action.key === "duplicate" ? <AccountingPolicyDuplicateDialog
          onClose={() => closeActionWindow(window.id)} onSaved={result => {
            closeActionWindow(window.id)
            saved(result, "duplicate")
          }} policy={window.payload.policy} />
          : <AccountingPolicyActionDialog action={window.payload.action} onClose={() => closeActionWindow(window.id)} policy={window.payload.policy} />}
      </DesktopWindowIdentity>)}
      {capture && <DesktopWindowIdentity id={`accounting:manual-capture:${capture.id ?? "new"}`}>
        <ManualPolicyCaptureDialog onClose={() => setCapture(null)} onSaved={result => saved(result, capture.id ? "edit" : "create")} policyId={capture.id} />
      </DesktopWindowIdentity>}
      {transition && <DesktopWindowIdentity id={`accounting:${transition.policy.id}:manual:${transition.operation}`}>
        <ManualPolicyTransitionDialog onClose={() => setTransition(null)} onSaved={saved} operation={transition.operation} policy={transition.policy} />
      </DesktopWindowIdentity>}
    </main>
  )
}
