import { useMutation } from "@tanstack/react-query"
import { useRef } from "react"
import type { Client } from "@/features/accounts-receivable/clients/model"
import { deleteClient, getAdjacentClient } from "@/features/accounts-receivable/clients/services/client-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"
import { Spinner } from "@/shared/ui/spinner"

export function ClientRemovalDialog({ client, onClose, onRemoved }: {
  client: Client
  onClose: () => void
  onRemoved: (next: Client | null) => Promise<void>
}) {
  const inFlight = useRef(false)
  const mutation = useMutation({
    mutationFn: async () => {
      const next = await getAdjacentClient(client.id, "next").catch(() => null)
      await deleteClient(client.id)
      return next
    },
    onSuccess: onRemoved,
    onSettled: () => { inFlight.current = false },
  })
  const close = () => { if (!inFlight.current) onClose() }
  function confirm() {
    if (inFlight.current) return
    inFlight.current = true
    mutation.mutate()
  }

  return (
    <ErpDataDialog defaultWidth={462} title="Baja de cliente" description={`Baja de ${client.code}`} tone="receivable"
      onOpenChange={open => { if (!open) close() }}>
      <ErpDataDialogBody className="grid gap-2 text-[10px]/normal" onKeyDown={event => {
        if (event.key === "Escape") { event.stopPropagation(); close() }
      }}>
        <p className="font-medium">{client.code} · {client.name}</p>
        <p>¿Quieres dar de baja este cliente?</p>
        {mutation.isError && <Alert variant="destructive">
          <AlertTitle>No fue posible dar de baja el cliente</AlertTitle><AlertDescription>{getApiErrorMessage(mutation.error)}</AlertDescription>
        </Alert>}
        <footer className="flex justify-end gap-1 border-t pt-2">
          <Button autoFocus disabled={mutation.isPending} onClick={close} size="sm" type="button" variant="outline">No</Button>
          <Button disabled={mutation.isPending} onClick={confirm} size="sm" type="button" variant="destructive">
            {mutation.isPending && <Spinner />}Sí, dar de baja
          </Button>
        </footer>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
