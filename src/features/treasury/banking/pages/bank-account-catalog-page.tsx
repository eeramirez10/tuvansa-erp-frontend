import AlertCircleIcon from "@hugeicons/core-free-icons/AlertCircleIcon"
import InformationCircleIcon from "@hugeicons/core-free-icons/InformationCircleIcon"
import { HugeiconsIcon } from "@hugeicons/react"
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate, useParams } from "react-router"
import { paths } from "@/app/router/paths"
import { BankAccountDetails } from "@/features/treasury/banking/components/bank-account-details"
import { BankAccountSearchDialog } from "@/features/treasury/banking/components/bank-account-search-dialog"
import { BankAccountToolbar } from "@/features/treasury/banking/components/bank-account-toolbar"
import { BankActionButtons } from "@/features/treasury/banking/components/bank-action-buttons"
import { BankPanelDialog } from "@/features/treasury/banking/components/bank-panel-dialog"
import { bankAccountKeys, bankAccountQueryOptions } from "@/features/treasury/banking/logic"
import type { BankAccount, BankPanelDefinition } from "@/features/treasury/banking/model"
import { getAdjacentBankAccount } from "@/features/treasury/banking/services/bank-account-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { DesktopWindowIdentity, useDesktopWindowCollection } from "@/shared/ui/desktop-window-context"

type Notice = { kind: "success" | "error"; title: string; message: string }
type BankPanelWindow = { account: BankAccount; panel: BankPanelDefinition }
export function BankAccountCatalogPage() {
  const id = Number(useParams().bankAccountId)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: account } = useSuspenseQuery(bankAccountQueryOptions(id))
  const [searchOpen, setSearchOpen] = useState(false)
  const { windows: panelWindows, openWindow: openPanelWindow, closeWindow: closePanelWindow } = useDesktopWindowCollection<BankPanelWindow>()
  const [notice, setNotice] = useState<Notice | null>(null)
  const open = (next: BankAccount) => { queryClient.setQueryData(bankAccountKeys.detail(next.id), next); void navigate(paths.bankAccount(next.id)) }
  const navigation = useMutation({ mutationFn: (direction: "previous" | "next") => getAdjacentBankAccount(account.id, direction), onSuccess: (next, direction) => next ? (setNotice(null), open(next)) : setNotice({ kind: "success", title: "Fin del catálogo", message: direction === "previous" ? "Esta es la primera cuenta disponible." : "Esta es la última cuenta disponible." }), onError: (error) => setNotice({ kind: "error", title: "No fue posible navegar", message: getApiErrorMessage(error) }) })
  return <section className="mx-auto flex w-full min-w-0 max-w-[1800px] flex-1 flex-col gap-2">
    <BankAccountToolbar disabled={navigation.isPending} onNext={() => navigation.mutate("next")} onPrevious={() => navigation.mutate("previous")} onSearch={() => setSearchOpen(true)} />
    {notice && <Alert variant={notice.kind === "error" ? "destructive" : "default"}><HugeiconsIcon icon={notice.kind === "error" ? AlertCircleIcon : InformationCircleIcon} /><AlertTitle>{notice.title}</AlertTitle><AlertDescription>{notice.message}</AlertDescription></Alert>}
    <div className="grid min-w-0 items-start gap-2 xl:grid-cols-[10rem_minmax(0,1fr)]"><aside><BankActionButtons onSelect={(panel) => openPanelWindow(`banking:${account.id}:${panel.key}`, { account, panel })} /></aside><BankAccountDetails account={account} /></div>
    {searchOpen && <DesktopWindowIdentity id="banking:search"><BankAccountSearchDialog onOpenChange={setSearchOpen} onSelect={(selected) => { setSearchOpen(false); setNotice(null); void navigate(paths.bankAccount(selected.id)) }} /></DesktopWindowIdentity>}
    {panelWindows.map((window) => <DesktopWindowIdentity id={window.id} key={window.id}><BankPanelDialog account={window.payload.account} onOpenChange={(value) => { if (!value) closePanelWindow(window.id) }} panel={window.payload.panel} /></DesktopWindowIdentity>)}
  </section>
}
