import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRef, type ComponentProps } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { accountingPolicyCommentsQueryOptions, accountingPolicyKeys } from "@/features/accounting/policies/logic"
import type { AccountingPolicy, AccountingPolicyComments, AccountingPolicyCommentsInput } from "@/features/accounting/policies/model"
import { updateAccountingPolicyComments } from "@/features/accounting/policies/services/accounting-policy-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Spinner } from "@/shared/ui/spinner"
import { Textarea } from "@/shared/ui/textarea"

const optionalDate = z.union([z.iso.date(), z.literal("")])
const schema = z.object({
  date: optionalDate, cheque: z.string().max(13), report: z.string().max(15),
  postDate: optionalDate, origin: z.string().max(10), beneficiary: z.string().max(85),
  family: z.string().max(20), concept: z.string().max(90), amountInWords: z.string().max(111),
  comments: z.tuple([z.string().max(100), z.string().max(100), z.string().max(100),
    z.string().max(140), z.string().max(3000), z.string().max(350)]),
})

type FormFields = z.infer<typeof schema>
const inputClass = "h-6 min-w-0 px-1.5 text-[10px]"
const commentLengths = [100, 100, 100, 140, 3000, 350] as const
const commentPositions = [0, 1, 2, 3, 4, 5] as const
const title = "Comentarios de recepción"

function Field({ label, ...input }: ComponentProps<typeof Input> & { label: string }) {
  return <label className="grid min-w-0 gap-0.5">
    <span>{label}</span><Input className={inputClass} {...input} />
  </label>
}

function PolicyCommentsForm({ editor, onClose }: { editor: AccountingPolicyComments; onClose: () => void }) {
  const queryClient = useQueryClient()
  const { fields, policy, revision, canWrite, reason, userId, auditAt, exchangeRate } = editor
  const { register, handleSubmit, formState } = useForm<FormFields>({
    resolver: zodResolver(schema),
    defaultValues: { ...fields, date: fields.date ?? "", postDate: fields.postDate ?? "" },
  })
  const request = useRef<{ snapshot: string; input: AccountingPolicyCommentsInput } | null>(null)
  const inFlight = useRef(false)
  const save = useMutation({
    mutationFn: (input: AccountingPolicyCommentsInput) => updateAccountingPolicyComments(policy.id, input),
    onSuccess: async (result) => {
      const detail = accountingPolicyKeys.detail(policy.id)
      await queryClient.cancelQueries({ queryKey: detail })
      queryClient.setQueryData(detail, result)
      onClose()
      void queryClient.invalidateQueries({ queryKey: accountingPolicyKeys.all })
    },
    onSettled: () => { inFlight.current = false },
  })
  const close = () => { if (!inFlight.current) onClose() }
  const readOnly = !canWrite || save.isPending

  function submit(values: FormFields) {
    if (!canWrite || revision === null || !values.date || inFlight.current) return
    const snapshot = JSON.stringify(values)
    if (request.current?.snapshot !== snapshot) {
      request.current = {
        snapshot, input: { fields: { ...values, postDate: values.postDate || null }, revision, requestKey: crypto.randomUUID() },
      }
    }
    inFlight.current = true
    save.mutate(request.current.input)
  }

  return (
    <ErpDataDialog defaultWidth={760} description={policy.number} title={title} onOpenChange={open => { if (!open) close() }}>
      <ErpDataDialogBody>
        <form className="grid gap-1.5 text-[10px]" onSubmit={event => { void handleSubmit(submit)(event) }}>
          {reason && <Alert><AlertDescription>{reason}</AlertDescription></Alert>}
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
            <Field label="Fecha" readOnly={readOnly} required={canWrite} type="date" {...register("date")} />
            <Field label="Número" readOnly value={policy.number} />
            <Field label="Cheque" maxLength={13} readOnly={readOnly} {...register("cheque")} />
            <Field label="Reporte" maxLength={15} readOnly={readOnly} {...register("report")} />
            <Field label="Fecha post" readOnly={readOnly} type="date" {...register("postDate")} />
            <Field label="Origen" maxLength={10} readOnly={readOnly} {...register("origin")} />
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_10rem] gap-1.5">
            <Field label="Beneficiario" maxLength={85} readOnly={readOnly} {...register("beneficiary")} />
            <Field label="Familia" maxLength={20} readOnly={readOnly} {...register("family")} />
          </div>
          <Field label="Concepto" maxLength={90} readOnly={readOnly} {...register("concept")} />
          <Input aria-label="Importe con letra" className={inputClass} maxLength={111} readOnly={readOnly} {...register("amountInWords")} />
          <fieldset className="grid gap-0.5">
            <legend>Comentarios</legend>
            {commentPositions.map(index => (
              <label className="grid grid-cols-[1rem_minmax(0,1fr)] items-center gap-1" key={index}>
                <span>{index + 1}</span>
                {index === 4 ? <Textarea aria-label="Comentario 5" className="min-h-10 text-[10px]" maxLength={commentLengths[index]}
                  readOnly={readOnly} rows={2} {...register("comments.4")} />
                  : <Input aria-label={`Comentario ${index + 1}`} className={inputClass} maxLength={commentLengths[index]}
                    readOnly={readOnly} {...register(`comments.${index}`)} />}
              </label>
            ))}
          </fieldset>
          {(save.isError || Object.keys(formState.errors).length > 0) && <Alert variant="destructive"><AlertDescription>
            {save.isError ? getApiErrorMessage(save.error) : "Revisa los datos de la póliza."}
          </AlertDescription></Alert>}
          <footer className="flex flex-wrap items-end justify-between gap-2">
            <div className="flex gap-1">
              {canWrite && <Button disabled={!formState.isDirty || save.isPending} size="sm" type="submit">
                {save.isPending && <Spinner />}OK
              </Button>}
              <Button disabled={save.isPending} onClick={close} size="sm" type="button" variant="outline">
                {canWrite ? "Cancelar" : "Cerrar"}
              </Button>
            </div>
            <div className="grid grid-cols-[3.5rem_auto_4rem] gap-1">
              <Field label="Usr" readOnly value={userId} />
              <Field label="Captura" readOnly value={auditAt ?? ""} />
              <Field label="Cambio" readOnly value={exchangeRate} />
            </div>
          </footer>
        </form>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}

export function AccountingPolicyCommentsDialog({ policy, onClose }: { policy: AccountingPolicy; onClose: () => void }) {
  const query = useQuery(accountingPolicyCommentsQueryOptions(policy.id))
  if (query.data && query.isFetchedAfterMount && !query.isError && !query.data.applied) {
    return <PolicyCommentsForm editor={query.data} onClose={onClose} />
  }
  return (
    <ErpDataDialog defaultWidth={420} description={policy.number} title={title} onOpenChange={open => { if (!open) onClose() }}>
      <ErpDataDialogBody className="grid gap-2">
        {query.isError
          ? <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(query.error)}</AlertDescription></Alert>
          : query.isFetchedAfterMount && query.data?.applied
            ? <Alert><AlertDescription>{query.data.reason}</AlertDescription></Alert>
            : <div className="grid min-h-28 place-items-center"><Spinner /></div>}
        <div className="flex justify-end"><Button onClick={onClose} size="sm" variant="outline">Cerrar</Button></div>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
