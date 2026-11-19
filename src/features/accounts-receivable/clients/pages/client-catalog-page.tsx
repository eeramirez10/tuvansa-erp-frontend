import { ClientFiscalAction } from "@/features/accounts-receivable/clients/components/client-fiscal-action"
import AlertCircleIcon from "@hugeicons/core-free-icons/AlertCircleIcon"
import InformationCircleIcon from "@hugeicons/core-free-icons/InformationCircleIcon"
import { HugeiconsIcon } from "@hugeicons/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate, useParams } from "react-router"

import { paths } from "@/app/router/paths"
import { ClientBlockDialog } from "@/features/accounts-receivable/clients/components/client-block-dialog"
import { ClientCatalogCapture } from "@/features/accounts-receivable/clients/components/client-catalog-capture"
import { ClientCatalogDetails } from "@/features/accounts-receivable/clients/components/client-catalog-details"
import { ClientPanelButtons } from "@/features/accounts-receivable/clients/components/client-panel-buttons"
import { ClientPanelDialog } from "@/features/accounts-receivable/clients/components/client-panel-dialog"
import { ClientRemovalDialog } from "@/features/accounts-receivable/clients/components/client-removal-dialog"
import { ClientSearchDialog } from "@/features/accounts-receivable/clients/components/client-search-dialog"
import { ClientToolbar } from "@/features/accounts-receivable/clients/components/client-toolbar"
import { clientActionPanels, clientQueryPanels } from "@/features/accounts-receivable/clients/constants"
import { clientKeys, clientQueryOptions } from "@/features/accounts-receivable/clients/logic"
import type { Client, ClientPanelDefinition } from "@/features/accounts-receivable/clients/model"
import { getAdjacentClient } from "@/features/accounts-receivable/clients/services/client-service"
import { invoiceKeys } from "@/features/sales/invoicing/logic"
import { orderKeys } from "@/features/sales/orders/logic"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { notifications } from "@/shared/notifications/notifications"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import {
  DesktopWindowIdentity,
  useDesktopWindowCollection,
} from "@/shared/ui/desktop-window-context"

type Notice = { kind: "success" | "error"; title: string; message: string }
type ClientPanelWindow = { client: Client; panel: ClientPanelDefinition }
type Capture = { fromId: number; client: Client | null }

export function ClientCatalogPage() {
  const params = useParams()
  const clientId = Number(params.clientId ?? 0)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const clientQuery = useQuery({ ...clientQueryOptions(clientId), enabled: clientId > 0 })
  const client = clientQuery.data
  const [searchOpen, setSearchOpen] = useState(false)
  const [capture, setCapture] = useState<Capture | null>(null)
  const [removing, setRemoving] = useState<Client | null>(null)
  const activeCapture = capture?.fromId === clientId ? capture : null
  const {
    windows: panelWindows,
    openWindow: openPanelWindow,
    closeWindow: closePanelWindow,
  } = useDesktopWindowCollection<ClientPanelWindow>()
  const [notice, setNotice] = useState<Notice | null>(null)

  const openClient = (nextClient: Client) => {
    void navigate(paths.accountsReceivableClient(nextClient.id))
  }

  const navigationMutation = useMutation({
    mutationFn: (direction: "previous" | "next") => getAdjacentClient(clientId, direction),
    onSuccess: (nextClient, direction) => {
      if (!nextClient) {
        setNotice({
          kind: "success",
          title: "Fin del catálogo",
          message: direction === "previous" ? "Este es el primer cliente disponible." : "Este es el último cliente disponible.",
        })
        return
      }
      setNotice(null)
      openClient(nextClient)
    },
    onError: (error) => setNotice({ kind: "error", title: "No fue posible navegar", message: getApiErrorMessage(error) }),
  })

  function refresh(removedId?: number) {
    void queryClient.invalidateQueries({
      queryKey: clientKeys.all,
      predicate: ({ queryKey }) => queryKey[2] !== "detail" || queryKey[3] !== removedId,
    })
    void queryClient.invalidateQueries({ queryKey: orderKeys.all })
    void queryClient.invalidateQueries({ queryKey: invoiceKeys.all })
  }

  function saved(entry: Client, mode: "create" | "edit") {
    queryClient.setQueryData(clientKeys.detail(entry.id), entry)
    setCapture(null)
    setNotice({ kind: "success", title: mode === "create" ? "Cliente dado de alta" : "Cliente actualizado", message: `${entry.code} · ${entry.name}` })
    refresh()
    if (mode === "create") openClient(entry)
  }

  async function removed(entry: Client, next: Client | null) {
    for (const window of panelWindows) {
      if (window.payload.client.id === entry.id) closePanelWindow(window.id)
    }
    setRemoving(null)
    setNotice({ kind: "success", title: "Cliente dado de baja", message: `${entry.code} · ${entry.name}` })
    refresh(entry.id)
    await navigate(next ? paths.accountsReceivableClient(next.id) : paths.accountsReceivableClients, { replace: true })
    queryClient.removeQueries({ queryKey: clientKeys.detail(entry.id), type: "inactive" })
  }

  const controlsDisabled = navigationMutation.isPending || Boolean(activeCapture) || Boolean(removing)
  const email = client?.contact.email.trim() ?? ""

  async function copyEmail() {
    if (!email) return

    try {
      await navigator.clipboard.writeText(email)
      notifications.success("Correo copiado")
    } catch {
      notifications.error("No se pudo copiar el correo", {
        description: "Comprueba los permisos del portapapeles del navegador.",
      })
    }
  }

  return (
    <section className="mx-auto flex w-full min-w-0 max-w-[1800px] flex-1 flex-col gap-2">
      <ClientToolbar
        disabled={controlsDisabled}
        hasClient={Boolean(client)}
        onCreate={() => { setNotice(null); setCapture({ fromId: clientId, client: null }) }}
        onDelete={() => { if (client) setRemoving(client) }}
        onEdit={() => { if (client) { setNotice(null); setCapture({ fromId: clientId, client }) } }}
        onNext={() => navigationMutation.mutate("next")}
        onPrevious={() => navigationMutation.mutate("previous")}
        onSearch={() => setSearchOpen(true)}
      />

      {notice && (
        <Alert variant={notice.kind === "error" ? "destructive" : "default"}>
          <HugeiconsIcon icon={notice.kind === "error" ? AlertCircleIcon : InformationCircleIcon} strokeWidth={2} />
          <AlertTitle>{notice.title}</AlertTitle>
          <AlertDescription>{notice.message}</AlertDescription>
        </Alert>
      )}

      {activeCapture ? <ClientCatalogCapture client={activeCapture.client} onClose={() => setCapture(null)} onSaved={saved} />
        : client ? <div className="grid min-w-0 items-start gap-2 xl:grid-cols-[10rem_minmax(0,1fr)_14rem]">
        <aside className="min-w-0">
          <ClientPanelButtons onSelect={(panel) => openPanelWindow(`clients:${client.id}:${panel.key}`, { client, panel })} panels={clientActionPanels} title="Acciones">
            <Button
              className="w-full justify-start"
              disabled={controlsDisabled || !email}
              onClick={copyEmail}
              size="xs"
              title={email ? undefined : "El cliente no tiene correo registrado"}
              type="button"
              variant="outline"
            >
              Copiar e-mail
            </Button>
            <ClientFiscalAction key={client.id} clientId={client.id} />
          </ClientPanelButtons>
        </aside>
        <ClientCatalogDetails client={client} />
        <aside className="min-w-0">
          <ClientPanelButtons onSelect={(panel) => openPanelWindow(panel.key === "client-analytics" ? "clients:analytics" : `clients:${client.id}:${panel.key}`, { client, panel })} panels={clientQueryPanels} title="Consultas" />
        </aside>
      </div> : <Alert><AlertDescription>{clientId > 0
        ? (clientQuery.isError ? getApiErrorMessage(clientQuery.error) : "Consultando cliente…")
        : "No hay clientes activos en el catálogo."}</AlertDescription></Alert>}

      {searchOpen && <DesktopWindowIdentity id="clients:search"><ClientSearchDialog onOpenChange={setSearchOpen} onSelect={(selectedClient) => { setSearchOpen(false); setNotice(null); openClient(selectedClient) }} /></DesktopWindowIdentity>}
      {panelWindows.map((window) => (
        <DesktopWindowIdentity id={window.id} key={window.id}>
          {window.payload.panel.key === "block-status" ? (
            <ClientBlockDialog client={window.payload.client} onClose={() => closePanelWindow(window.id)} />
          ) : <ClientPanelDialog
            client={window.payload.client}
            onOpenChange={(open) => { if (!open) closePanelWindow(window.id) }}
            panel={window.payload.panel}
          />}
        </DesktopWindowIdentity>
      ))}

      {removing && <DesktopWindowIdentity id={`clients:${removing.id}:removal`}>
        <ClientRemovalDialog client={removing} onClose={() => setRemoving(null)} onRemoved={next => removed(removing, next)} />
      </DesktopWindowIdentity>}
    </section>
  )
}
