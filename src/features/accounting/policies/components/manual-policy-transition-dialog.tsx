import { useMutation, useQuery } from "@tanstack/react-query"
import { useRef } from "react"
import { manualPolicyPreviewQueryOptions } from "@/features/accounting/policies/logic"
import type { AccountingPolicy, ManualPolicyActionInput, ManualPolicyOperation } from "@/features/accounting/policies/model"
import { actOnManualPolicy } from "@/features/accounting/policies/services/accounting-policy-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody, ErpDataMetric } from "@/shared/ui/erp-data-dialog"
import { Spinner } from "@/shared/ui/spinner"

const labels = {
  apply: { title: "Aplicar póliza", text: "¿Aplicar la póliza de diario?", button: "Aplicar", capability: "canApply", fallback: "La póliza ya está aplicada." },
  unapply: { title: "Desaplicar póliza", text: "¿Desaplicar la póliza de diario?", button: "Desaplicar", capability: "canUnapply", fallback: "La póliza está pendiente de aplicar." },
  delete: { title: "Baja de póliza", text: "¿Dar de baja la póliza de diario?", button: "Dar de baja", capability: "canDelete", fallback: "La baja no está disponible." },
} as const

export function ManualPolicyTransitionDialog({ policy, operation, onClose, onSaved, tone }: {
  policy: Pick<AccountingPolicy, "id" | "number" | "date">
  operation: ManualPolicyOperation
  onClose: () => void
  onSaved: (policy: AccountingPolicy, operation: ManualPolicyOperation) => void
  tone?: "banking"
}) {
  const query = useQuery(manualPolicyPreviewQueryOptions(policy.id))
  const inFlight = useRef(false)
  const request = useRef<{ revision: number; key: string } | null>(null)
  const change = useMutation({
    mutationFn: (input: ManualPolicyActionInput) => actOnManualPolicy(policy.id, operation, input),
    onSuccess: result => onSaved(result, operation),
    onSettled: () => { inFlight.current = false },
  })
  const text = labels[operation]
  const preview = query.data
  const allowed = preview?.[text.capability] === true && !query.isFetching && !query.isError
  const close = () => { if (!inFlight.current) onClose() }

  function confirm() {
    if (!allowed || !preview || inFlight.current || change.isError) return
    if (request.current?.revision !== preview.revision) request.current = { revision: preview.revision, key: crypto.randomUUID() }
    inFlight.current = true
    change.mutate({ requestKey: request.current.key, revision: preview.revision, confirmed: true })
  }

  return (
    <ErpDataDialog defaultWidth={455} description={`${text.title} ${policy.number}`} title={text.title} tone={tone}
      onOpenChange={open => { if (!open) close() }}>
      <ErpDataDialogBody className="grid gap-2 text-[10px]/normal" onKeyDown={event => {
        if (event.key === "Escape") { event.stopPropagation(); close() }
      }}>
        <div className="grid grid-cols-2 gap-1">
          <ErpDataMetric label="Póliza" value={policy.number} />
          <ErpDataMetric label="Fecha" value={policy.date ?? ""} />
        </div>
        {query.isFetching && <p className="flex items-center gap-1" role="status"><Spinner /> Verificando la póliza…</p>}
        {query.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(query.error)}</AlertDescription></Alert>}
        {allowed && <p>{text.text}</p>}
        {preview && !allowed && !query.isError && !query.isFetching && <Alert role="status">
          <AlertDescription>{preview.reason || text.fallback}</AlertDescription>
        </Alert>}
        {change.isError && <Alert variant="destructive">
          <AlertTitle>No fue posible registrar la operación</AlertTitle><AlertDescription>{getApiErrorMessage(change.error)}</AlertDescription>
        </Alert>}
        <footer className="flex flex-wrap justify-end gap-1">
          <Button autoFocus disabled={change.isPending} onClick={close} size="xs" type="button" variant="outline">
            {allowed ? "Cancelar" : "Cerrar"}
          </Button>
          {(query.isError || change.isError) && <Button disabled={query.isFetching || change.isPending} onClick={() => {
            change.reset()
            void query.refetch()
          }} size="xs" type="button" variant="outline">Volver a verificar</Button>}
          {allowed && <Button disabled={change.isPending || change.isError} onClick={confirm} size="xs" type="button"
            variant={operation === "delete" ? "destructive" : "default"}>
            {change.isPending && <Spinner />}{text.button}
          </Button>}
        </footer>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
