import AlertCircleIcon from "@hugeicons/core-free-icons/AlertCircleIcon"
import InformationCircleIcon from "@hugeicons/core-free-icons/InformationCircleIcon"
import { HugeiconsIcon } from "@hugeicons/react"
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate, useParams } from "react-router"

import { paths } from "@/app/router/paths"
import { InvoiceCatalogDetails } from "@/features/sales/invoicing/components/invoice-catalog-details"
import { InvoicePanelDialog } from "@/features/sales/invoicing/components/invoice-panel-dialog"
import { InvoiceSearchDialog } from "@/features/sales/invoicing/components/invoice-search-dialog"
import { InvoicePanelButtons } from "@/features/sales/invoicing/components/invoice-side-panels"
import { InvoiceToolbar } from "@/features/sales/invoicing/components/invoice-toolbar"
import { invoiceActionPanels, invoiceSummaryPanels } from "@/features/sales/invoicing/constants"
import { invoiceKeys, invoiceQueryOptions } from "@/features/sales/invoicing/logic"
import type { Invoice, InvoicePanelDefinition } from "@/features/sales/invoicing/model"
import { getAdjacentInvoice } from "@/features/sales/invoicing/services/invoice-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { DesktopWindowIdentity, useDesktopWindowCollection } from "@/shared/ui/desktop-window-context"

type Notice = { kind: "success" | "error"; title: string; message: string }
type InvoicePanelWindow = { invoice: Invoice; panel: InvoicePanelDefinition }

export function InvoiceCatalogPage() {
  const invoiceId = Number(useParams().invoiceId)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: invoice } = useSuspenseQuery(invoiceQueryOptions(invoiceId))
  const [searchOpen, setSearchOpen] = useState(false)
  const { windows: panelWindows, openWindow: openPanelWindow, closeWindow: closePanelWindow } = useDesktopWindowCollection<InvoicePanelWindow>()
  const [notice, setNotice] = useState<Notice | null>(null)

  const openFullInvoice = (next: Invoice) => {
    queryClient.setQueryData(invoiceKeys.detail(next.id), next)
    void navigate(paths.salesInvoice(next.id))
  }

  const navigation = useMutation({
    mutationFn: (direction: "previous" | "next") => getAdjacentInvoice(invoice.id, direction),
    onSuccess: (next, direction) => {
      if (next) {
        setNotice(null)
        openFullInvoice(next)
        return
      }
      setNotice({
        kind: "success",
        title: "Fin del catálogo",
        message: direction === "previous"
          ? "Esta es la primera factura disponible."
          : "Esta es la última factura disponible.",
      })
    },
    onError: (error) => setNotice({
      kind: "error",
      title: "No fue posible navegar",
      message: getApiErrorMessage(error),
    }),
  })

  const selectSearchResult = (selected: Invoice) => {
    setSearchOpen(false)
    setNotice(null)
    // El buscador devuelve un resumen sin partidas. La ruta solicita la ficha completa.
    void navigate(paths.salesInvoice(selected.id))
  }

  return (
    <section className="mx-auto flex w-full min-w-0 max-w-[1800px] flex-1 flex-col gap-2">
      <InvoiceToolbar
        disabled={navigation.isPending}
        onNext={() => navigation.mutate("next")}
        onPrevious={() => navigation.mutate("previous")}
        onSearch={() => setSearchOpen(true)}
      />

      {notice && (
        <Alert variant={notice.kind === "error" ? "destructive" : "default"}>
          <HugeiconsIcon icon={notice.kind === "error" ? AlertCircleIcon : InformationCircleIcon} />
          <AlertTitle>{notice.title}</AlertTitle>
          <AlertDescription>{notice.message}</AlertDescription>
        </Alert>
      )}

      <div className="grid min-w-0 items-start gap-2 xl:grid-cols-[10rem_minmax(0,1fr)]">
        <aside className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
          <InvoicePanelButtons onSelect={(panel) => openPanelWindow(`invoices:${invoice.id}:${panel.key}`, { invoice, panel })} panels={invoiceActionPanels} title="Acciones" />
          <InvoicePanelButtons onSelect={(panel) => openPanelWindow(`invoices:${invoice.id}:${panel.key}`, { invoice, panel })} panels={invoiceSummaryPanels} title="Sumarios" />
        </aside>
        <InvoiceCatalogDetails invoice={invoice} />
      </div>

      {searchOpen && (
        <DesktopWindowIdentity id="invoices:search"><InvoiceSearchDialog onOpenChange={setSearchOpen} onSelect={selectSearchResult} /></DesktopWindowIdentity>
      )}
      {panelWindows.map((window) => <DesktopWindowIdentity id={window.id} key={window.id}><InvoicePanelDialog invoice={window.payload.invoice} onOpenChange={(open) => { if (!open) closePanelWindow(window.id) }} panel={window.payload.panel} /></DesktopWindowIdentity>)}
    </section>
  )
}
