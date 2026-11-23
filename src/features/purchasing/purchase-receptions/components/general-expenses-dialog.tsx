import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRef } from "react"
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form"
import { Link } from "react-router"
import { paths } from "@/app/router/paths"
import { supplierKeys } from "@/features/accounts-payable/suppliers/logic"
import { GeneralExpenseLineRow } from "@/features/purchasing/purchase-receptions/components/general-expense-line-row"
import {
  generalExpensesDraftSchema,
  generalExpensesPayload,
  generalExpenseTotals,
  generalExpensesTaxFields,
  newGeneralExpenseLine,
  usesGeneralExpenseTax,
  type GeneralExpensesDraft,
} from "@/features/purchasing/purchase-receptions/general-expenses-form"
import { generalExpensesPreviewQueryOptions, purchaseReceptionKeys } from "@/features/purchasing/purchase-receptions/logic"
import type { GeneralExpensesInput, GeneralExpensesPreview, GeneralExpensesResult } from "@/features/purchasing/purchase-receptions/model"
import { createGeneralExpenses } from "@/features/purchasing/purchase-receptions/services/general-expenses-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody, ErpDataMetric, ErpDataTableViewport } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Spinner } from "@/shared/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

const fieldClass = "h-6 min-w-0 rounded-sm px-1 text-[10px]"
const currency = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" })

function ErrorText({ message }: { message?: string }) {
  return message ? <span className="text-destructive" role="alert">{message}</span> : null
}

function GeneralExpensesForm({ preview, saving, onSubmit, onClose }: {
  preview: GeneralExpensesPreview
  saving: boolean
  onSubmit: (input: Omit<GeneralExpensesInput, "requestKey">) => void
  onClose: () => void
}) {
  const { control, formState: { errors }, handleSubmit, register, setValue } = useForm<GeneralExpensesDraft>({
    resolver: zodResolver(generalExpensesDraftSchema(preview)),
    defaultValues: {
      date: preview.defaults.date, reference: "", beneficiary: "", description: "",
      lines: [newGeneralExpenseLine(preview)],
      taxAccounts: {
        vat: preview.defaultTaxAccounts?.vat ?? "",
        vatWithholding: preview.defaultTaxAccounts?.vatWithholding ?? "",
        incomeWithholding: preview.defaultTaxAccounts?.incomeWithholding ?? "",
      },
    },
  })
  const { fields, append, remove } = useFieldArray({ control, name: "lines" })
  const lines = useWatch({ control, name: "lines" }) ?? []
  const totals = generalExpenseTotals(lines)
  const relevantAccounts = generalExpensesTaxFields.filter(({ key }) => usesGeneralExpenseTax(lines, key))

  return <form className="grid min-w-0 gap-2" noValidate onSubmit={handleSubmit((values) => onSubmit(generalExpensesPayload(values)))}>
    <fieldset className="grid min-w-0 gap-2" disabled={saving}>
      <div className="grid min-w-0 gap-1.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(8rem,0.6fr)]">
        <label className="grid gap-0.5"><span>Tipo</span><Input className={fieldClass} readOnly value={preview.defaults.type + " · Gastos MEX"} /></label>
        <label className="grid gap-0.5"><span>Ref.</span><Input className={fieldClass} maxLength={13}
          aria-invalid={Boolean(errors.reference)} {...register("reference")} /><ErrorText message={errors.reference?.message} /></label>
        <label className="grid gap-0.5"><span>Fecha</span><Input className={fieldClass} type="date"
          min={preview.fiscalStart ?? undefined} max={preview.fiscalEnd ?? undefined}
          aria-invalid={Boolean(errors.date)} {...register("date")} /><ErrorText message={errors.date?.message} /></label>
        <label className="grid gap-0.5"><span>Beneficiario</span><Input className={fieldClass} maxLength={85}
          aria-invalid={Boolean(errors.beneficiary)} {...register("beneficiary")} /><ErrorText message={errors.beneficiary?.message} /></label>
        <label className="grid gap-0.5 sm:col-span-2"><span>Concepto</span><Input className={fieldClass} maxLength={90}
          aria-invalid={Boolean(errors.description)} {...register("description")} /><ErrorText message={errors.description?.message} /></label>
      </div>

      <ErpDataTableViewport axes="xy" className="max-h-[43vh]">
        <Table aria-label="Partidas de gastos múltiples" className="min-w-[58rem] table-fixed text-[10px]">
          <TableHeader><TableRow>
            <TableHead className="h-6 w-32 px-1">Proveedor</TableHead>
            <TableHead className="h-6 w-36 px-1">Gasto</TableHead>
            <TableHead className="h-6 w-28 px-1">Refer.</TableHead>
            <TableHead className="h-6 w-24 px-1 text-right">Importe</TableHead>
            {generalExpensesTaxFields.map(({ key, label }) => <TableHead className="h-6 w-24 px-1 text-right" key={key}>{label}</TableHead>)}
            <TableHead className="h-6 w-32 px-1">C.C.</TableHead>
            <TableHead className="h-6 w-8"><span className="sr-only">Acciones</span></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {fields.map(({ id }, index) => <GeneralExpenseLineRow key={id} control={control} register={register} setValue={setValue}
              index={index} errors={errors.lines?.[index]} costCenters={preview.costCenters} saving={saving}
              canRemove={fields.length > 1} onRemove={() => remove(index)} />)}
          </TableBody>
        </Table>
      </ErpDataTableViewport>
      <ErrorText message={errors.lines?.root?.message ?? errors.lines?.message} />
      <div><Button size="sm" type="button" variant="outline" onClick={() => append(newGeneralExpenseLine(preview), {
        focusName: `lines.${fields.length}.supplierCode`,
      })}>Añadir partida</Button></div>

      <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,16rem)]">
        <div className="grid content-start gap-1.5">
          {relevantAccounts.map(({ key, accountLabel }) => {
            const configured = preview.defaultTaxAccounts?.[key]
            const available = preview.taxAccounts[key]
            const options = configured && !available.some(({ code }) => code === configured)
              ? [{ code: configured, name: configured }, ...available]
              : available
            return <div className="grid gap-0.5" key={key}>
              <span>{accountLabel}</span>
              <Controller control={control} name={`taxAccounts.${key}`} render={({ field }) => (
                <Select disabled={saving || !options.length} value={field.value || null} onValueChange={(value) => field.onChange(value ?? "")}>
                  <SelectTrigger aria-label={accountLabel} aria-invalid={Boolean(errors.taxAccounts?.[key])}
                    className="w-full" onBlur={field.onBlur} ref={field.ref} size="sm">
                    <SelectValue placeholder="Selecciona una cuenta" />
                  </SelectTrigger>
                  <SelectContent>{options.map(({ code, name }) => <SelectItem key={code} value={code}>{code} · {name}</SelectItem>)}</SelectContent>
                </Select>
              )} />
              <ErrorText message={errors.taxAccounts?.[key]?.message ?? (options.length === 0
                ? "No hay una cuenta contable habilitada para este impuesto." : undefined)} />
            </div>
          })}
        </div>
        <div className="grid gap-0.5" aria-label="Totales de gastos">
          <ErpDataMetric label="Importe" value={currency.format(totals.base / 100)} />
          {generalExpensesTaxFields.map(({ key, label }) => <ErpDataMetric key={key} label={label} value={currency.format(totals[key] / 100)} />)}
          <ErpDataMetric className="font-semibold" label="Total" value={currency.format(totals.total / 100)} />
        </div>
      </div>
    </fieldset>

    <footer className="flex justify-end gap-1.5">
      <Button disabled={saving} size="sm" type="submit">{saving && <Spinner />}OK</Button>
      <Button disabled={saving} onClick={onClose} size="sm" type="button" variant="outline">Cancelar</Button>
    </footer>
  </form>
}

function GeneralExpensesConfirmation({ result, onNavigate }: { result: GeneralExpensesResult; onNavigate: () => void }) {
  return <div className="grid min-w-0 gap-2">
    <Alert>
      <AlertTitle>Gastos registrados</AlertTitle>
      <AlertDescription><Link className="text-primary underline" onClick={onNavigate} to={paths.accountingPolicy(result.id)}>Ver póliza {result.policyNumber}</Link></AlertDescription>
    </Alert>
    <ErpDataTableViewport axes="xy" className="max-h-[48vh]">
      <Table aria-label="Documentos registrados" className="min-w-[35rem] text-[10px]">
        <TableHeader><TableRow>
          <TableHead>Documento</TableHead><TableHead>Proveedor</TableHead>
          <TableHead>Referencia</TableHead><TableHead className="text-right">Total</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {result.documents.map((document) => <TableRow key={document.id}>
            <TableCell><Link className="text-primary underline" onClick={onNavigate} to={paths.purchaseReception(document.id)}>{document.number}</Link></TableCell>
            <TableCell><Link className="text-primary underline" onClick={onNavigate} to={paths.accountsPayableSupplier(document.supplierId)}>
              {document.supplierCode} · {document.supplierName}
            </Link></TableCell>
            <TableCell>{document.reference}</TableCell>
            <TableCell className="text-right tabular-nums">{currency.format(document.total)}</TableCell>
          </TableRow>)}
        </TableBody>
      </Table>
    </ErpDataTableViewport>
  </div>
}

export function GeneralExpensesDialog({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const preview = useQuery(generalExpensesPreviewQueryOptions())
  const requestKeys = useRef(new Map<string, string>())
  const inFlight = useRef(false)
  const save = useMutation({
    mutationFn: createGeneralExpenses,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: purchaseReceptionKeys.all })
      void queryClient.invalidateQueries({ queryKey: supplierKeys.all })
      void queryClient.invalidateQueries({ queryKey: ["accounting"] })
    },
    onSettled: () => { inFlight.current = false },
  })

  function dismiss() {
    if (!inFlight.current) onClose()
  }

  function submit(payload: Omit<GeneralExpensesInput, "requestKey">) {
    if (inFlight.current || preview.isFetching || !preview.data?.canWrite) return
    const signature = JSON.stringify(payload)
    const requestKey = requestKeys.current.get(signature) ?? crypto.randomUUID()
    requestKeys.current.set(signature, requestKey)
    inFlight.current = true
    save.mutate({ ...payload, requestKey })
  }

  return <ErpDataDialog title="Recepción de gastos múltiples" description="Captura de gastos y generación de documentos por proveedor"
    defaultWidth={1080} tone="payable" onOpenChange={(open) => { if (!open) dismiss() }}>
    <ErpDataDialogBody className="grid min-w-0 gap-2">
      {save.data ? <>
        <GeneralExpensesConfirmation result={save.data} onNavigate={dismiss} />
        <div className="flex justify-end"><Button size="sm" onClick={dismiss} variant="outline">Cerrar</Button></div>
      </> : <>
        {preview.isPending && <div className="flex items-center gap-1.5" role="status"><Spinner /> Cargando configuración de gastos…</div>}
        {preview.isError && <Alert variant="destructive">
          <AlertDescription>{getApiErrorMessage(preview.error)}</AlertDescription>
          <Button disabled={preview.isFetching} size="xs" type="button" variant="outline" onClick={() => { void preview.refetch() }}>Reintentar</Button>
        </Alert>}
        {preview.data && !preview.data.canWrite && <Alert>
          <AlertDescription>{preview.data.reason ?? "La captura de gastos no está disponible."}</AlertDescription>
        </Alert>}
        {save.isError && <Alert variant="destructive">
          <AlertTitle>No fue posible registrar los gastos</AlertTitle><AlertDescription>{getApiErrorMessage(save.error)}</AlertDescription>
        </Alert>}
        {preview.data?.canWrite ? <GeneralExpensesForm preview={preview.data} saving={save.isPending || preview.isFetching}
          onClose={dismiss} onSubmit={submit} /> : <div className="flex justify-end">
          <Button onClick={dismiss} size="sm" type="button" variant="outline">Cancelar</Button>
        </div>}
      </>}
    </ErpDataDialogBody>
  </ErpDataDialog>
}
