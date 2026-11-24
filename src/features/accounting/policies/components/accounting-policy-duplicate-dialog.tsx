import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useId, useRef } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { duplicatePolicyPreviewQueryOptions } from "@/features/accounting/policies/logic"
import type { AccountingPolicy, DuplicatePolicyInput, DuplicatePolicyPreview } from "@/features/accounting/policies/model"
import { duplicateAccountingPolicy } from "@/features/accounting/policies/services/accounting-policy-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody, ErpDataMetric } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Spinner } from "@/shared/ui/spinner"

const schema = z.object({ date: z.iso.date("Captura la fecha de la póliza.") })

function DuplicatePolicyForm({ preview, disabled, saving, onCancel, onSubmit }: {
  preview: DuplicatePolicyPreview
  disabled: boolean
  saving: boolean
  onCancel: () => void
  onSubmit: (date: string) => void
}) {
  const dateId = useId()
  const { register, handleSubmit, formState } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema), defaultValues: { date: preview.date },
  })

  return (
    <form className="grid gap-2" onSubmit={handleSubmit(({ date }) => onSubmit(date))}>
      <div className="grid gap-1">
        <Label htmlFor={dateId}>Fecha de la póliza</Label>
        <Input className="h-7" disabled={disabled} id={dateId} max={preview.fiscalEnd ?? undefined}
          min={preview.fiscalStart ?? undefined} required type="date" {...register("date")} />
        {formState.errors.date && <p role="alert">{formState.errors.date.message}</p>}
      </div>
      <footer className="flex flex-wrap justify-end gap-1">
        <Button disabled={saving} onClick={onCancel} size="xs" type="button" variant="outline">Cancelar</Button>
        <Button disabled={disabled} size="xs" type="submit">{saving && <Spinner />}Duplicar</Button>
      </footer>
    </form>
  )
}

export function AccountingPolicyDuplicateDialog({ policy, onClose, onSaved }: {
  policy: AccountingPolicy
  onClose: () => void
  onSaved: (policy: AccountingPolicy) => void
}) {
  const query = useQuery(duplicatePolicyPreviewQueryOptions(policy.id))
  const request = useRef<DuplicatePolicyInput | null>(null)
  const inFlight = useRef(false)
  const save = useMutation({
    mutationFn: (input: DuplicatePolicyInput) => duplicateAccountingPolicy(policy.id, input),
    onSuccess: onSaved,
    onSettled: () => { inFlight.current = false },
  })
  const preview = query.data
  const ready = preview?.canWrite === true && !query.isError && !query.isFetching
  const close = () => { if (!inFlight.current) onClose() }

  function submit(date: string) {
    if (!ready || !preview || inFlight.current) return
    if (request.current?.date !== date || request.current.revision !== preview.revision) {
      request.current = { date, revision: preview.revision, requestKey: crypto.randomUUID(), confirmed: true }
    }
    inFlight.current = true
    save.mutate(request.current)
  }

  return (
    <ErpDataDialog defaultWidth={390} description={`Duplicar la póliza ${policy.number}`}
      onOpenChange={open => { if (!open) close() }} title="Duplicar póliza">
      <ErpDataDialogBody className="grid gap-2 text-[10px]/normal">
        <ErpDataMetric label="Póliza original" value={policy.number} />
        {query.isFetching && <p className="flex items-center gap-1" role="status"><Spinner /> Verificando la póliza…</p>}
        {query.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(query.error)}</AlertDescription></Alert>}
        {preview && !preview.canWrite && !query.isFetching && !query.isError && <Alert role="status">
          <AlertDescription>{preview.reason ?? "La copia de esta póliza no está disponible."}</AlertDescription>
        </Alert>}
        {save.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(save.error)}</AlertDescription></Alert>}
        {(save.isError || query.isError) && <div className="flex justify-end">
          <Button disabled={query.isFetching || save.isPending} onClick={() => { save.reset(); void query.refetch() }}
            size="xs" type="button" variant="outline">Volver a verificar</Button>
        </div>}
        {preview?.canWrite ? <DuplicatePolicyForm disabled={!ready || save.isPending} key={preview.revision}
          onCancel={close} onSubmit={submit} preview={preview} saving={save.isPending} />
          : <div className="flex justify-end"><Button onClick={close} size="xs" type="button" variant="outline">Cerrar</Button></div>}
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
