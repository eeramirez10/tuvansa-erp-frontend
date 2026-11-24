import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { useId, useRef, useState } from "react"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { ManualPolicyAccountSearch } from "@/features/accounting/policies/components/manual-policy-account-search"
import { ManualPolicyLine } from "@/features/accounting/policies/components/manual-policy-line"
import { accountingPolicyQueryOptions, manualPolicyCaptureQueryOptions, manualPolicyPreviewQueryOptions } from "@/features/accounting/policies/logic"
import {
  manualPolicyBlankLine, manualPolicyDefaults, manualPolicyLineLimit, manualPolicyPayload, manualPolicySchema, manualPolicyTotals,
  type ManualPolicyDraft, type ManualPolicyValues,
} from "@/features/accounting/policies/manual-policy-form"
import type { AccountingPolicy, ManualPolicyCaptureOptions, ManualPolicyPreview } from "@/features/accounting/policies/model"
import { createManualPolicy, updateManualPolicy } from "@/features/accounting/policies/services/accounting-policy-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { DesktopWindowIdentity, useDesktopWindowId } from "@/shared/ui/desktop-window-context"
import { ErpDataDialog, ErpDataDialogBody, ErpDataMetric, ErpDataTableViewport } from "@/shared/ui/erp-data-dialog"
import { FieldError } from "@/shared/ui/field"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Spinner } from "@/shared/ui/spinner"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

const money = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fields = [
  { key: "beneficiary", label: "Beneficiario", maxLength: 85 },
  { key: "family", label: "Familia", maxLength: 20 },
  { key: "concept", label: "Concepto", maxLength: 90 },
] as const

function CaptureEditor({ initialPolicy, options, preview, loading, saving, onClose, onReload, onSubmit }: {
  initialPolicy?: AccountingPolicy
  options: ManualPolicyCaptureOptions
  preview?: ManualPolicyPreview
  loading: boolean
  saving: boolean
  onClose: () => void
  onReload: () => void
  onSubmit: (values: ManualPolicyValues, revision?: number) => void
}) {
  const [base] = useState(initialPolicy)
  const revision = base?.manual?.revision
  const stale = Boolean(base && preview && preview.revision !== revision)
  const blocked = Boolean(base && preview && !preview.canEdit)
  const form = useForm<ManualPolicyDraft, unknown, ManualPolicyValues>({
    resolver: zodResolver(manualPolicySchema(options)),
    defaultValues: manualPolicyDefaults(options, base),
  })
  const lines = useWatch({ control: form.control, name: "lines" })
  const totals = manualPolicyTotals(lines)
  const rows = useFieldArray({ control: form.control, name: "lines" })
  const [searchRow, setSearchRow] = useState<string | null>(null)
  const searchIndex = rows.fields.findIndex(field => field.id === searchRow)
  const errors = form.formState.errors
  const id = useId()
  const windowId = useDesktopWindowId("accounting:manual-capture")
  const disabled = saving || Boolean(searchRow)
  const canSave = !disabled && !loading && !stale && !blocked && options.canWrite

  return (
    <>
      {stale && <Alert variant="destructive">
        <AlertTitle>La póliza cambió en otra sesión</AlertTitle>
        <AlertDescription>El borrador sigue visible. Recarga la ficha para usar la revisión vigente.</AlertDescription>
        <Button className="w-fit" disabled={loading || saving} onClick={onReload} size="xs" type="button" variant="outline">Descartar cambios y recargar</Button>
      </Alert>}
      {blocked && <Alert role="status"><AlertDescription>{preview?.reason || "Desaplica la póliza para cambiarla."}</AlertDescription></Alert>}
      <form className="grid gap-2" noValidate onSubmit={form.handleSubmit(values => {
        if (canSave) onSubmit(values, revision)
      })}>
        <div className="grid gap-2 sm:grid-cols-[8rem_10rem_minmax(0,1fr)_10rem]">
          <ErpDataMetric label="Tipo" value="3 · Diario" />
          <div className="grid content-start gap-1">
            <Label htmlFor={`${id}-date`}>Fecha</Label>
            <Input aria-invalid={Boolean(errors.date)} className="h-6" disabled={disabled} id={`${id}-date`}
              min={options.fiscalStart ?? undefined} max={options.fiscalEnd ?? undefined} type="date" {...form.register("date")} />
            <FieldError errors={[errors.date]} />
          </div>
          {fields.map(({ key, label, maxLength }) => <div className={`grid content-start gap-1 ${key === "concept" ? "sm:col-span-4" : ""}`} key={key}>
            <Label htmlFor={`${id}-${key}`}>{label}</Label>
            <Input aria-invalid={Boolean(errors[key])} className="h-6" disabled={disabled} id={`${id}-${key}`}
              maxLength={maxLength} {...form.register(key)} />
            <FieldError errors={[errors[key]]} />
          </div>)}
        </div>
        <ErpDataTableViewport axes="xy" className="max-h-72">
          <Table className="min-w-[740px]">
            <TableHeader className="sticky top-0 z-[1] bg-muted"><TableRow>
              <TableHead>Código</TableHead><TableHead>Cuenta</TableHead>
              <TableHead className="text-right">Cargos</TableHead><TableHead className="text-right">Abonos</TableHead>
              <TableHead>C.C.</TableHead><TableHead>Refer.</TableHead><TableHead />
            </TableRow></TableHeader>
            <TableBody>{rows.fields.map((field, index) => <ManualPolicyLine
              canRemove={rows.fields.length > 2} centers={options.costCenters} disabled={disabled} form={form} index={index}
              key={field.id} onRemove={() => rows.remove(index)} onSearch={() => setSearchRow(field.id)} />)}</TableBody>
          </Table>
        </ErpDataTableViewport>
        <FieldError errors={[errors.lines?.root ?? errors.lines]} />
        <div className="flex flex-wrap items-end justify-between gap-2">
          <Button disabled={disabled || rows.fields.length >= manualPolicyLineLimit}
            onClick={() => rows.append(manualPolicyBlankLine(), { focusName: `lines.${rows.fields.length}.accountCode` })}
            size="xs" type="button" variant="outline">Agregar partida</Button>
          <div className="flex gap-1">
            <ErpDataMetric label="Total cargos" value={money.format(totals.debit / 100)} />
            <ErpDataMetric label="Total abonos" value={money.format(totals.credit / 100)} />
            <ErpDataMetric label="Diferencia" value={money.format((totals.debit - totals.credit) / 100)} />
          </div>
        </div>
        <footer className="flex justify-end gap-1 border-t pt-2">
          <Button disabled={disabled} onClick={onClose} size="xs" type="button" variant="outline">Cancelar</Button>
          <Button disabled={!canSave} size="xs" type="submit">{saving && <Spinner />}OK</Button>
        </footer>
      </form>
      {searchIndex >= 0 && (
        <DesktopWindowIdentity id={`${windowId}:account`}>
          <ManualPolicyAccountSearch initialCode={form.getValues(`lines.${searchIndex}.accountCode`).trim()}
            onClose={() => setSearchRow(null)} onSelect={account => {
              form.setValue(`lines.${searchIndex}.accountCode`, account.code, { shouldDirty: true })
              form.setValue(`lines.${searchIndex}.accountName`, account.name)
              form.clearErrors(`lines.${searchIndex}.accountCode`)
              setSearchRow(null)
            }} />
        </DesktopWindowIdentity>
      )}
    </>
  )
}

export function ManualPolicyCaptureDialog({ policyId, onClose, onSaved }: {
  policyId?: number
  onClose: () => void
  onSaved: (policy: AccountingPolicy) => void
}) {
  const [generation, setGeneration] = useState(0)
  const options = useQuery(manualPolicyCaptureQueryOptions())
  const policy = useQuery({ ...accountingPolicyQueryOptions(policyId ?? 0), enabled: policyId !== undefined, refetchOnMount: "always" })
  const preview = useQuery({ ...manualPolicyPreviewQueryOptions(policyId ?? 0), enabled: policyId !== undefined })
  const inFlight = useRef(false)
  const request = useRef<{ signature: string; key: string } | null>(null)
  const editing = policyId !== undefined
  const loading = options.isFetching || (editing && (policy.isFetching || preview.isFetching))
  const error = options.error ?? (editing ? policy.error ?? preview.error : null)
  const manual = preview.data
  const capture = options.data
  const title = editing ? "Cambio de póliza" : "Alta de póliza de diario"
  const ready = capture?.canWrite && (!editing || Boolean(policy.data?.manual && manual))
  const close = () => { if (!inFlight.current) onClose() }

  async function refresh(discardDraft: boolean) {
    if (!editing) {
      await options.refetch()
      return
    }
    const results = await Promise.all([policy.refetch(), preview.refetch(), options.refetch()])
    if (discardDraft && results.every(result => result.isSuccess)) setGeneration(value => value + 1)
  }

  const save = useMutation({
    mutationFn: ({ values, revision }: { values: ManualPolicyValues; revision?: number }) => {
      const payload = manualPolicyPayload(values)
      const signature = JSON.stringify([payload, revision])
      if (request.current?.signature !== signature) request.current = { signature, key: crypto.randomUUID() }
      const input = { ...payload, requestKey: request.current.key }
      return policyId === undefined || revision === undefined ? createManualPolicy(input) : updateManualPolicy(policyId, { ...input, revision })
    },
    onSuccess: onSaved,
    onError: problem => {
      if (editing && isAxiosError(problem) && problem.response?.status === 409) void refresh(false)
    },
    onSettled: () => { inFlight.current = false },
  })

  function submit(values: ManualPolicyValues, revision?: number) {
    if (inFlight.current || loading || error || !ready || (editing && (!manual?.canEdit || manual.revision !== revision))) return
    inFlight.current = true
    save.mutate({ values, revision })
  }

  return (
    <ErpDataDialog defaultWidth={890} description="Captura de póliza de diario en pesos." title={title}
      onOpenChange={open => { if (!open) close() }}>
      <ErpDataDialogBody className="grid gap-2 text-[10px]/normal" onKeyDown={event => {
        if (event.key === "Escape") { event.stopPropagation(); close() }
      }}>
        {loading && !ready && <p className="flex items-center gap-1" role="status"><Spinner /> Consultando póliza…</p>}
        {error && <Alert variant="destructive">
          <AlertTitle>No fue posible consultar la información</AlertTitle>
          <AlertDescription>{getApiErrorMessage(error)}</AlertDescription>
          <Button className="w-fit" onClick={() => void refresh(false)} size="xs" type="button" variant="outline">Reintentar</Button>
        </Alert>}
        {capture && !capture.canWrite && <Alert role="status"><AlertDescription>{manual?.reason || capture.reason || "La captura no está disponible."}</AlertDescription></Alert>}
        {save.isError && <Alert variant="destructive">
          <AlertTitle>No fue posible guardar la póliza</AlertTitle><AlertDescription>{getApiErrorMessage(save.error)}</AlertDescription>
        </Alert>}
        {capture && ready ? (
          <CaptureEditor initialPolicy={policy.data} key={generation} loading={loading || Boolean(error)}
            onClose={close} onReload={() => void refresh(true)} onSubmit={submit} options={capture} preview={manual} saving={save.isPending} />
        ) : <Button className="justify-self-end" onClick={close} size="xs" type="button" variant="outline">Cerrar</Button>}
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
