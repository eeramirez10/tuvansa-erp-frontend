import AlertCircleIcon from "@hugeicons/core-free-icons/AlertCircleIcon"
import InformationCircleIcon from "@hugeicons/core-free-icons/InformationCircleIcon"
import { HugeiconsIcon } from "@hugeicons/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import { paths } from "@/app/router/paths"
import { BankAccountDetails } from "@/features/treasury/banking/components/bank-account-details"
import { BankAccountFormDialog } from "@/features/treasury/banking/components/bank-account-form-dialog"
import { BankAccountRemovalDialog } from "@/features/treasury/banking/components/bank-account-removal-dialog"
import { BankAccountSearchDialog } from "@/features/treasury/banking/components/bank-account-search-dialog"
import { BankAccountToolbar } from "@/features/treasury/banking/components/bank-account-toolbar"
import { BankActionButtons } from "@/features/treasury/banking/components/bank-action-buttons"
import { BankPanelDialog } from "@/features/treasury/banking/components/bank-panel-dialog"
import { bankAccountKeys } from "@/features/treasury/banking/logic"
import type { BankAccount, BankPanelDefinition } from "@/features/treasury/banking/model"
import { getAdjacentBankAccount } from "@/features/treasury/banking/services/bank-account-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { DesktopWindowIdentity, useDesktopWindowCollection } from "@/shared/ui/desktop-window-context"

type Notice = { kind: "success" | "error"; title: string; message: string }
type BankPanelWindow = { account: BankAccount; panel: BankPanelDefinition }
type EditorWindow = { mode: "create" } | { mode: "edit"; account: BankAccount } | { mode: "delete"; account: BankAccount }
export function BankAccountCatalogPage({ account }: { account?: BankAccount }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchOpen, setSearchOpen] = useState(false)
  const [editor, setEditor] = useState<EditorWindow | null>(null)
  const { windows: panelWindows, openWindow: openPanelWindow, closeWindow: closePanelWindow } = useDesktopWindowCollection<BankPanelWindow>()
  const [notice, setNotice] = useState<Notice | null>(null)
  const open = (next: BankAccount) => { queryClient.setQueryData(bankAccountKeys.detail(next.id), next); void navigate(paths.bankAccount(next.id)) }
  const navigation = useMutation({
    mutationFn: ({ id, direction }: { id: number; direction: "previous" | "next" }) => getAdjacentBankAccount(id, direction),
    onSuccess: (next, { direction }) => next ? (setNotice(null), open(next)) : setNotice({
      kind: "success", title: "Fin del catálogo",
      message: direction === "previous" ? "Esta es la primera cuenta disponible." : "Esta es la última cuenta disponible.",
    }),
    onError: (error) => setNotice({ kind: "error", title: "No fue posible navegar", message: getApiErrorMessage(error) }),
  })

  async function handleDeletion(removed: BankAccount) {
    setEditor(null)
    setSearchOpen(false)
    setNotice(null)
    for (const window of panelWindows) {
      if (window.payload.account.id === removed.id) closePanelWindow(window.id)
    }
    await queryClient.invalidateQueries({ queryKey: bankAccountKeys.all, refetchType: "none" })
    toast.success("Cuenta dada de baja", { description: `${removed.code} · ${removed.name}` })
    await navigate(paths.bankAccounts, { replace: true })
    queryClient.removeQueries({ queryKey: bankAccountKeys.detail(removed.id) })
    queryClient.removeQueries({ queryKey: bankAccountKeys.form(removed.id) })
  }

  return <section className="mx-auto flex w-full min-w-0 max-w-[1800px] flex-1 flex-col gap-2">
    <BankAccountToolbar disabled={navigation.isPending || Boolean(editor)}
      hasAccount={account !== undefined} onCreate={() => setEditor({ mode: "create" })}
      onDelete={() => { if (account) setEditor({ mode: "delete", account }) }}
      onEdit={() => { if (account) setEditor({ mode: "edit", account }) }}
      onNext={() => { if (account) navigation.mutate({ id: account.id, direction: "next" }) }}
      onPrevious={() => { if (account) navigation.mutate({ id: account.id, direction: "previous" }) }}
      onSearch={() => setSearchOpen(true)} />
    {notice && <Alert variant={notice.kind === "error" ? "destructive" : "default"}><HugeiconsIcon icon={notice.kind === "error" ? AlertCircleIcon : InformationCircleIcon} /><AlertTitle>{notice.title}</AlertTitle><AlertDescription>{notice.message}</AlertDescription></Alert>}
    {account
      ? <div className="grid min-w-0 items-start gap-2 xl:grid-cols-[10rem_minmax(0,1fr)]"><aside><BankActionButtons onSelect={(panel) => openPanelWindow(`banking:${account.id}:${panel.key}`, { account, panel })} /></aside><BankAccountDetails account={account} /></div>
      : <Alert><AlertDescription>No hay cuentas bancarias disponibles.</AlertDescription></Alert>}
    {searchOpen && <DesktopWindowIdentity id="banking:search"><BankAccountSearchDialog onOpenChange={setSearchOpen} onSelect={(selected) => { setSearchOpen(false); setNotice(null); void navigate(paths.bankAccount(selected.id)) }} /></DesktopWindowIdentity>}
    {editor?.mode === "delete" && <DesktopWindowIdentity id={`banking:${editor.account.id}:baja`}>
      <BankAccountRemovalDialog account={editor.account} onClose={() => setEditor(null)}
        onDeleted={() => { void handleDeletion(editor.account) }} />
    </DesktopWindowIdentity>}
    {editor && editor.mode !== "delete" && <DesktopWindowIdentity id={editor.mode === "create" ? "banking:alta" : `banking:${editor.account.id}:cambio`}>
      <BankAccountFormDialog {...editor} onClose={() => setEditor(null)} onSaved={(saved) => {
        setEditor(null)
        setNotice({
          kind: "success",
          title: editor.mode === "create" ? "Cuenta dada de alta" : "Cambio guardado",
          message: `${saved.code} · ${saved.name}`,
        })
        open(saved)
      }} />
    </DesktopWindowIdentity>}
    {panelWindows.map((window) => <DesktopWindowIdentity id={window.id} key={window.id}><BankPanelDialog account={window.payload.account} onOpenChange={(value) => { if (!value) closePanelWindow(window.id) }} panel={window.payload.panel} /></DesktopWindowIdentity>)}
  </section>
}
