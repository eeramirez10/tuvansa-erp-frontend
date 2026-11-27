import AlertCircleIcon from "@hugeicons/core-free-icons/AlertCircleIcon"
import InformationCircleIcon from "@hugeicons/core-free-icons/InformationCircleIcon"
import { HugeiconsIcon } from "@hugeicons/react"
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate, useParams } from "react-router"

import { paths } from "@/app/router/paths"
import { InvoiceCatalogDetails } from "@/features/sales/invoicing/components/invoice-catalog-details"
import { InvoiceFromOrderDialog } from "@/features/sales/invoicing/components/invoice-from-order-dialog"
import { InvoicePanelDialog } from "@/features/sales/invoicing/components/invoice-panel-dialog"
import { InvoiceSearchDialog } from "@/features/sales/invoicing/components/invoice-search-dialog"
import { InvoicePanelButtons } from "@/features/sales/invoicing/components/invoice-side-panels"
import { InvoiceToolbar } from "@/features/sales/invoicing/components/invoice-toolbar"
import { RemissionCancellationDialog } from "@/features/sales/invoicing/components/remission-cancellation-dialog"
import { invoiceActionPanels, invoiceSummaryPanels } from "@/features/sales/invoicing/constants"
import { invoiceKeys, invoiceQueryOptions, isLocalRemission } from "@/features/sales/invoicing/logic"
import type { Invoice, InvoicePanelDefinition } from "@/features/sales/invoicing/model"
import { getAdjacentInvoice } from "@/features/sales/invoicing/services/invoice-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { DesktopWindowIdentity, useDesktopWindowCollection } from "@/shared/ui/desktop-window-context"

type Notice = { kind: "success" | "error"; title: string; message: string }
type InvoicePanelWindow = { invoice: Invoice; panel: InvoicePanelDefinition; lineId?: number }

export function InvoiceCatalogPage() {
  const invoiceId = Number(useParams().invoiceId)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: invoice } = useSuspenseQuery(invoiceQueryOptions(invoiceId))
  const [searchOpen, setSearchOpen] = useState(false)
  const [fromOrderOpen, setFromOrderOpen] = useState(false)
  const { windows: panelWindows, openWindow: openPanelWindow, closeWindow: closePanelWindow } = useDesktopWindowCollection<InvoicePanelWindow>()
  const { windows: cancellationWindows, openWindow: openCancellation, closeWindow: closeCancellation } = useDesktopWindowCollection<number>()
  const [notice, setNotice] = useState<Notice | null>(null)
  const [selectedLineId, setSelectedLineId] = useState<number>()
  const selectedLine = invoice.lines.find((line) => line.id === selectedLineId) ?? invoice.lines[0]
  const cancellationAvailable = isLocalRemission(invoice) || invoice.cancellationAvailable === true

  const openPanel = (panel: InvoicePanelDefinition) => {
    const key = `invoices:${invoice.id}:${panel.key}`
    if (panel.key === "edit-pieces" && selectedLine) {
      openPanelWindow(`${key}:${selectedLine.id}`, { invoice, panel, lineId: selectedLine.id })
      return
    }
    openPanelWindow(key, { invoice, panel })
  }

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
    <section className="flex w-full min-w-0 flex-1 flex-col gap-2">
      <InvoiceToolbar
        disabled={navigation.isPending}
        onFromOrder={() => setFromOrderOpen(true)}
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

      <div className="grid min-w-0 items-start gap-2 @min-[70rem]/erp:grid-cols-[10rem_minmax(0,1fr)]">
        <aside className="grid gap-2 sm:grid-cols-2 @min-[70rem]/erp:grid-cols-1">
          <InvoicePanelButtons onSelect={openPanel} panels={invoiceActionPanels} title="Acciones" />
          <InvoicePanelButtons onSelect={openPanel} panels={invoiceSummaryPanels} title="Sumarios" />
        </aside>
        <InvoiceCatalogDetails invoice={invoice} onCancelRemission={cancellationAvailable
          ? () => openCancellation(`invoices:${invoice.id}:cancel-remission`, invoice.id)
          : undefined} onSelectLine={setSelectedLineId} selectedLineId={selectedLine?.id} />
      </div>

      {searchOpen && (
        <DesktopWindowIdentity id="invoices:search"><InvoiceSearchDialog onOpenChange={setSearchOpen} onSelect={selectSearchResult} /></DesktopWindowIdentity>
      )}
      {fromOrderOpen && (
        <DesktopWindowIdentity id="invoices:from-order">
          <InvoiceFromOrderDialog onClose={() => setFromOrderOpen(false)} onCreated={({ invoice: saved, orderComplete }) => {
            setFromOrderOpen(false)
            setNotice({
              kind: "success",
              title: `Remisión ${saved.number} registrada`,
              message: orderComplete ? "El pedido quedó surtido." : "El pedido conserva partidas por surtir.",
            })
            openFullInvoice(saved)
          }} />
        </DesktopWindowIdentity>
      )}
      {panelWindows.map(({ id, payload }) => (
        <DesktopWindowIdentity id={id} key={id}>
          <InvoicePanelDialog {...payload} onOpenChange={(open) => { if (!open) closePanelWindow(id) }} />
        </DesktopWindowIdentity>
      ))}
      {cancellationWindows.map(({ id, payload }) => (
        <DesktopWindowIdentity id={id} key={id}>
          <RemissionCancellationDialog invoiceId={payload} onClose={() => closeCancellation(id)} />
        </DesktopWindowIdentity>
      ))}
    </section>
  )
}
