import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRef, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import { supplierKeys, supplierPanelQueryOptions } from "@/features/accounts-payable/suppliers/logic"
import type { Supplier, SupplierPanelDefinition, SupplierVariousUpdate } from "@/features/accounts-payable/suppliers/model"
import { saveSupplierVarious } from "@/features/accounts-payable/suppliers/services/supplier-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { Checkbox } from "@/shared/ui/checkbox"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group"
import { Spinner } from "@/shared/ui/spinner"

const bankText = [
  ["branch", "Sucursal", 4], ["bankAccount", "Número de cuenta", 20], ["bankCode", "Clave de banco", 5],
  ["city", "CD", 4], ["state", "Estado", 2], ["cieReference", "REF CIE", 20], ["internetPassword", "Password internet", 8],
] as const
const taxText = [["thirdPartyType", "Tipo de tercero", 2], ["operationType", "Tipo de operación", 2], ["countryCode", "Código país", 2]] as const
const numbers = [
  ["multiCompany", "Multicia", "1"], ["deliveryDays", "Tiempo de entrega en días", "1"],
  ["purchaseFrequencyDays", "Frecuencia de compras en días", "1"], ["tolerancePercent", "% Tolerancia O.C.", "1"],
  ["vatWithholdingPercent", "% Retención I.V.A.", "0.0001"], ["incomeTaxWithholdingPercent", "% Retención I.S.R.", "0.0001"],
] as const
const taxOptions = ["Normal", "Frontera", "Exportación"] as const
const bankOptions = ["Cheques", "Plasticos", "Interbancos"] as const
const schema = z.object({
  banamexId: z.int().min(0).max(2).optional(),
  branch: z.string().max(4), bankAccount: z.string().max(20), bankCode: z.string().max(5),
  city: z.string().max(4), state: z.string().max(2), cieReference: z.string().max(20), internetPassword: z.string().max(8),
  multiCompany: z.int().min(0).max(255), interCompany: z.int().min(0).max(1),
  deliveryDays: z.int().nonnegative(), purchaseFrequencyDays: z.int().nonnegative(), tolerancePercent: z.int().nonnegative(),
  vatType: z.int().min(0).max(2), vatWithholdingPercent: z.number().min(0).max(100), incomeTaxWithholdingPercent: z.number().min(0).max(100),
  thirdPartyType: z.string().max(2), operationType: z.string().max(2), countryCode: z.string().max(2),
  minimums: z.array(z.number()).length(8), values: z.array(z.number()).length(12),
})

function valuesFrom(data: Record<string, unknown>): z.infer<typeof schema> {
  const banamexId = Number(data.banamexId)
  return {
    banamexId: bankOptions[banamexId] ? banamexId : undefined,
    branch: String(data.branch ?? ""), bankAccount: String(data.bankAccount ?? ""), bankCode: String(data.bankCode ?? ""),
    city: String(data.city ?? ""), state: String(data.state ?? ""), cieReference: String(data.cieReference ?? ""),
    internetPassword: String(data.internetPassword ?? ""), multiCompany: Number(data.multiCompany ?? 0),
    interCompany: Number(data.interCompany ?? 0), deliveryDays: Number(data.deliveryDays ?? 0),
    purchaseFrequencyDays: Number(data.purchaseFrequencyDays ?? 0), tolerancePercent: Number(data.tolerancePercent ?? 0),
    vatType: Number(data.vatType ?? 0), vatWithholdingPercent: Number(data.vatWithholdingPercent ?? 0),
    incomeTaxWithholdingPercent: Number(data.incomeTaxWithholdingPercent ?? 0), thirdPartyType: String(data.thirdPartyType ?? ""),
    operationType: String(data.operationType ?? ""), countryCode: String(data.countryCode ?? ""),
    minimums: Array.isArray(data.minimums) ? data.minimums.map(Number) : Array<number>(8).fill(0),
    values: Array.isArray(data.values) ? data.values.map(Number) : Array<number>(12).fill(0),
  }
}

function VariousForm({ data, readonly, busy, onEdit, onCancel, onSave }: {
  data: Record<string, unknown>
  readonly: boolean
  busy: boolean
  onEdit: () => void
  onCancel: () => void
  onSave: (values: z.infer<typeof schema>) => void
}) {
  const form = useForm({ resolver: zodResolver(schema), defaultValues: valuesFrom(data) })
  const canChange = data.canWrite === true
  const locked = readonly || busy
  const labels = Array.isArray(data.labels) ? data.labels.map(String) : []
  const inputClass = "h-6 text-[10px]"
  return (
    <form className="grid gap-2 text-[10px]" onSubmit={form.handleSubmit(values => { if (!locked) onSave(values) })}>
      <Controller control={form.control} name="banamexId" render={({ field }) => (
        <RadioGroup aria-label="ID Banamex" className="flex w-auto gap-3" disabled={locked}
          value={field.value === undefined ? "" : String(field.value)} onValueChange={value => field.onChange(Number(value))}>
          {bankOptions.map((option, index) => <label className="flex items-center gap-1" key={option}>
            <RadioGroupItem value={String(index)} />{option}
          </label>)}
        </RadioGroup>
      )} />
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {bankText.map(([name, label, length]) => (
          <label className="grid gap-0.5" key={name}><span>{label}</span>
            <Input type={name === "internetPassword" ? "password" : "text"} autoComplete={name === "internetPassword" ? "off" : undefined}
              className={inputClass} maxLength={length} readOnly={locked} {...form.register(name)} />
          </label>
        ))}
        {numbers.map(([name, label, step]) => (
          <label className="grid gap-0.5" key={name}><span>{label}</span>
            <Input className={inputClass} type="number" step={step} readOnly={locked} {...form.register(name, { valueAsNumber: true })} />
          </label>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Controller control={form.control} name="interCompany" render={({ field }) => (
          <label className="flex items-center gap-1"><Checkbox checked={field.value === 1} disabled={locked}
            onCheckedChange={checked => field.onChange(checked ? 1 : 0)} /> Intercia</label>
        )} />
        <Controller control={form.control} name="vatType" render={({ field }) => (
          <RadioGroup aria-label="I.V.A." className="flex w-auto gap-3" disabled={locked} value={String(field.value)}
            onValueChange={value => field.onChange(Number(value))}>
            {taxOptions.map((option, index) => <label className="flex items-center gap-1" key={option}>
              <RadioGroupItem value={String(index)} />{option}
            </label>)}
          </RadioGroup>
        )} />
      </div>
      <fieldset className="grid grid-cols-4 gap-1 sm:grid-cols-8">
        <legend>Min x día</legend>
        {Array.from({ length: 8 }, (_, index) => <Input aria-label={`Mínimo ${index + 1}`} className={inputClass} key={index}
          type="number" step={index === 1 || index === 2 ? "0.01" : "1"} readOnly={locked}
          {...form.register(`minimums.${index}`, { valueAsNumber: true })} />)}
      </fieldset>
      <fieldset className="grid grid-cols-4 gap-1 sm:grid-cols-6">
        <legend>Varios</legend>
        {Array.from({ length: 12 }, (_, index) => <label className="grid min-w-0 gap-0.5" key={index}>
          {labels[index] || `Valor ${index + 1}`}
          <Input className={inputClass} type="number" step="0.01" readOnly={locked}
            {...form.register(`values.${index}`, { valueAsNumber: true })} />
        </label>)}
      </fieldset>
      <fieldset className="grid grid-cols-3 gap-1">
        <legend>Informativa SAT</legend>
        {taxText.map(([name, label, length]) => <label className="grid gap-0.5" key={name}>{label}
          <Input className={inputClass} maxLength={length} readOnly={locked} {...form.register(name)} />
        </label>)}
      </fieldset>
      {Object.keys(form.formState.errors).length > 0 && <p className="text-destructive">Revisa los campos y sus importes.</p>}
      <footer className="flex justify-end gap-1">
        {readonly ? <Button disabled={!canChange} onClick={onEdit} size="xs" type="button" variant="outline">Cambio</Button>
          : <>
            <Button disabled={busy || !form.formState.isDirty} size="xs" type="submit">{busy && <Spinner />}OK</Button>
            <Button disabled={busy} size="xs" type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
          </>}
      </footer>
    </form>
  )
}

export function SupplierVariousDialog({ supplier, panel, onOpenChange }: {
  supplier: Supplier
  panel: SupplierPanelDefinition
  onOpenChange: (open: boolean) => void
}) {
  const [editor, setEditor] = useState<Record<string, unknown>>()
  const pending = useRef(false)
  const request = useRef<{ signature: string; values: SupplierVariousUpdate }>(null)
  const client = useQueryClient()
  const query = useQuery(supplierPanelQueryOptions(supplier.id, panel))
  const data = query.data?.data.detail
  const save = useMutation({
    mutationFn: (input: SupplierVariousUpdate) => saveSupplierVarious(supplier.id, input),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: supplierKeys.all })
      request.current = null
      setEditor(undefined)
    },
    onSettled: () => { pending.current = false },
  })

  function finish(fields: z.infer<typeof schema>) {
    if (!editor || pending.current || editor.canWrite !== true) return
    const signature = JSON.stringify(fields)
    if (request.current?.signature !== signature) {
      const { banamexId, ...settings } = fields
      const changes = banamexId === undefined ? settings : { ...settings, banamexId }
      request.current = { signature, values: { fields: changes, revision: Number(editor.revision), requestKey: crypto.randomUUID() } }
    }
    pending.current = true
    save.mutate(request.current.values)
  }

  return (
    <ErpDataDialog defaultWidth={760} description={supplier.code} title="Enviar a" tone="payable"
      onOpenChange={open => { if (open || !pending.current) onOpenChange(open) }}>
      <ErpDataDialogBody>
        {query.isPending && <div className="grid place-items-center py-8"><Spinner /></div>}
        {(query.error || save.error) && <Alert variant="destructive"><AlertDescription>
          {getApiErrorMessage(query.error ?? save.error)}
        </AlertDescription></Alert>}
        {data && <VariousForm data={editor ?? data} readonly={!editor} busy={save.isPending}
          key={`${editor ? "edit" : "view"}/${String((editor ?? data).revision ?? 0)}`}
          onEdit={() => { setEditor(data); save.reset() }}
          onCancel={() => { setEditor(undefined); request.current = null; save.reset() }} onSave={finish} />}
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
