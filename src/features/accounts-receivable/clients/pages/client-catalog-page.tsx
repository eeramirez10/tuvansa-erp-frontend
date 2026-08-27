import AlertCircleIcon from "@hugeicons/core-free-icons/AlertCircleIcon"
import Delete01Icon from "@hugeicons/core-free-icons/Delete01Icon"
import InformationCircleIcon from "@hugeicons/core-free-icons/InformationCircleIcon"
import { HugeiconsIcon } from "@hugeicons/react"
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate, useParams } from "react-router"

import { paths } from "@/app/router/paths"
import { ClientCatalogDetails } from "@/features/accounts-receivable/clients/components/client-catalog-details"
import { ClientFormDialog } from "@/features/accounts-receivable/clients/components/client-form-dialog"
import { ClientPanelButtons } from "@/features/accounts-receivable/clients/components/client-panel-buttons"
import { ClientPanelDialog } from "@/features/accounts-receivable/clients/components/client-panel-dialog"
import { ClientSearchDialog } from "@/features/accounts-receivable/clients/components/client-search-dialog"
import { ClientToolbar } from "@/features/accounts-receivable/clients/components/client-toolbar"
import { clientActionPanels, clientQueryPanels } from "@/features/accounts-receivable/clients/constants"
import { clientKeys, clientQueryOptions } from "@/features/accounts-receivable/clients/logic"
import type { Client, ClientPanelDefinition } from "@/features/accounts-receivable/clients/model"
import { deleteClient, getAdjacentClient } from "@/features/accounts-receivable/clients/services/client-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog"
import { Spinner } from "@/shared/ui/spinner"

type Notice = { kind: "success" | "error"; title: string; message: string }

export function ClientCatalogPage() {
  const params = useParams()
  const clientId = Number(params.clientId)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: client } = useSuspenseQuery(clientQueryOptions(clientId))
  const [searchOpen, setSearchOpen] = useState(false)
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedPanel, setSelectedPanel] = useState<ClientPanelDefinition | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)

  const openClient = (nextClient: Client) => {
    queryClient.setQueryData(clientKeys.detail(nextClient.id), nextClient)
    void navigate(paths.accountsReceivableClient(nextClient.id))
  }

  const navigationMutation = useMutation({
    mutationFn: (direction: "previous" | "next") => getAdjacentClient(client.id, direction),
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

  const deleteMutation = useMutation({
    mutationFn: () => deleteClient(client.id),
    onSuccess: async () => {
      setDeleteOpen(false)
      await queryClient.invalidateQueries({ queryKey: clientKeys.all })
      void navigate(paths.accountsReceivableClients, { replace: true })
    },
    onError: (error) => {
      setDeleteOpen(false)
      setNotice({ kind: "error", title: "No fue posible eliminar el cliente", message: getApiErrorMessage(error) })
    },
  })

  const controlsDisabled = navigationMutation.isPending || deleteMutation.isPending

  return (
    <section className="mx-auto flex w-full min-w-0 max-w-[1800px] flex-1 flex-col gap-2">
      <ClientToolbar
        disabled={controlsDisabled}
        onCreate={() => setFormMode("create")}
        onDelete={() => setDeleteOpen(true)}
        onEdit={() => setFormMode("edit")}
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

      <div className="grid min-w-0 items-start gap-2 xl:grid-cols-[10rem_minmax(0,1fr)_14rem]">
        <aside className="min-w-0">
          <ClientPanelButtons onSelect={setSelectedPanel} panels={clientActionPanels} title="Acciones" />
        </aside>
        <ClientCatalogDetails client={client} />
        <aside className="min-w-0">
          <ClientPanelButtons onSelect={setSelectedPanel} panels={clientQueryPanels} title="Consultas" />
        </aside>
      </div>

      {searchOpen && <ClientSearchDialog onOpenChange={setSearchOpen} onSelect={(selectedClient) => { setSearchOpen(false); setNotice(null); openClient(selectedClient) }} />}
      {formMode && (
        <ClientFormDialog
          client={formMode === "edit" ? client : undefined}
          key={`${formMode}-${client.id}`}
          mode={formMode}
          onOpenChange={(open) => { if (!open) setFormMode(null) }}
          onSaved={(savedClient, mode) => {
            setFormMode(null)
            setNotice({ kind: "success", title: mode === "create" ? "Cliente creado" : "Cliente actualizado", message: `${savedClient.code} · ${savedClient.name}` })
            openClient(savedClient)
          }}
        />
      )}
      {selectedPanel && <ClientPanelDialog client={client} key={`${client.id}-${selectedPanel.key}`} onOpenChange={(open) => { if (!open) setSelectedPanel(null) }} panel={selectedPanel} />}

      <AlertDialog onOpenChange={setDeleteOpen} open={deleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia><HugeiconsIcon icon={Delete01Icon} strokeWidth={2} /></AlertDialogMedia>
            <AlertDialogTitle>¿Eliminar este cliente?</AlertDialogTitle>
            <AlertDialogDescription>Se intentará eliminar {client.code}. La API impedirá la operación si tiene documentos, movimientos u otras relaciones.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate()} variant="destructive">
              {deleteMutation.isPending && <Spinner data-icon="inline-start" />}Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
