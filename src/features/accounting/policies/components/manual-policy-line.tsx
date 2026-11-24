import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef } from "react"
import { Controller, useController, useWatch, type UseFormReturn } from "react-hook-form"
import { manualPolicyAccountsQueryOptions } from "@/features/accounting/policies/logic"
import type { ManualPolicyDraft, ManualPolicyValues } from "@/features/accounting/policies/manual-policy-form"
import type { ManualPolicyCaptureOptions } from "@/features/accounting/policies/model"
import { Button } from "@/shared/ui/button"
import { FieldError } from "@/shared/ui/field"
import { Input } from "@/shared/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { TableCell, TableRow } from "@/shared/ui/table"

type Props = {
  form: UseFormReturn<ManualPolicyDraft, unknown, ManualPolicyValues>
  index: number
  centers: ManualPolicyCaptureOptions["costCenters"]
  disabled: boolean
  canRemove: boolean
  onRemove: () => void
  onSearch: () => void
}

export function ManualPolicyLine({ form, index, centers, disabled, canRemove, onRemove, onSearch }: Props) {
  const queryClient = useQueryClient()
  const indexRef = useRef(index)
  const lookupRequest = useRef(0)
  const codePath = `lines.${index}.accountCode` as const
  const accountName = useWatch({ control: form.control, name: `lines.${index}.accountName` })
  const { field, fieldState } = useController({ control: form.control, name: codePath })
  const errors = form.formState.errors.lines?.[index]
  const centerItems = centers.map(center => ({ value: center.code, label: `${center.code} · ${center.name}` }))
  useEffect(() => { indexRef.current = index }, [index])
  useEffect(() => () => { lookupRequest.current += 1 }, [])

  async function lookup(value: string) {
    const code = value.trim().toUpperCase()
    if (!code || accountName || disabled) return
    const request = ++lookupRequest.current
    try {
      const accounts = await queryClient.fetchQuery(manualPolicyAccountsQueryOptions(code))
      const liveCode = `lines.${indexRef.current}.accountCode` as const
      if (request !== lookupRequest.current || form.getValues(liveCode)?.trim().toUpperCase() !== code) return
      const account = accounts.find(item => item.code.trim().toUpperCase() === code)
      if (account) {
        form.setValue(`lines.${indexRef.current}.accountName`, account.name)
        form.clearErrors(liveCode)
      } else form.setError(liveCode, { type: "catalog", message: "La cuenta no está disponible para captura." })
    } catch {
      if (request === lookupRequest.current) form.setError(`lines.${indexRef.current}.accountCode`, {
        type: "catalog", message: "No fue posible consultar la cuenta.",
      })
    }
  }

  return (
    <TableRow className="align-top">
      <TableCell className="w-40">
        <div className="flex gap-1">
          <Input aria-invalid={fieldState.invalid} aria-label={`Código partida ${index + 1}`} className="h-6 min-w-14 px-1 uppercase"
            disabled={disabled} maxLength={16} {...field} onChange={event => {
              lookupRequest.current += 1
              form.setValue(`lines.${index}.accountName`, "")
              form.clearErrors(codePath)
              field.onChange(event.currentTarget.value)
            }} onBlur={event => {
              field.onBlur()
              void lookup(event.currentTarget.value)
            }} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); void lookup(event.currentTarget.value) } }} />
          <Button aria-label={`Buscar cuenta partida ${index + 1}`} disabled={disabled} onClick={onSearch} size="xs" type="button" variant="outline">Buscar</Button>
        </div>
        <FieldError errors={[fieldState.error]} />
      </TableCell>
      <TableCell className="min-w-36">{accountName}</TableCell>
      <TableCell className="w-24">
        <Input aria-label={`Cargos partida ${index + 1}`} aria-invalid={Boolean(errors?.debit)} className="h-6 px-1 text-right"
          disabled={disabled} inputMode="decimal" {...form.register(`lines.${index}.debit`)} />
        <FieldError errors={[errors?.debit]} />
      </TableCell>
      <TableCell className="w-24">
        <Input aria-label={`Abonos partida ${index + 1}`} aria-invalid={Boolean(errors?.credit)} className="h-6 px-1 text-right"
          disabled={disabled} inputMode="decimal" {...form.register(`lines.${index}.credit`)} />
        <FieldError errors={[errors?.credit]} />
      </TableCell>
      <TableCell className="w-32">
        <Controller control={form.control} name={`lines.${index}.costCenter`} render={({ field }) => (
          <Select disabled={disabled} items={centerItems} value={field.value} onValueChange={value => { if (value !== null) field.onChange(value) }}>
            <SelectTrigger aria-label={`Centro de costo partida ${index + 1}`} aria-invalid={Boolean(errors?.costCenter)} className="h-6"
              onBlur={field.onBlur} ref={field.ref}>
              <SelectValue placeholder="Selecciona un centro" />
            </SelectTrigger>
            <SelectContent>{centerItems.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
          </Select>
        )} />
        <FieldError errors={[errors?.costCenter]} />
      </TableCell>
      <TableCell className="min-w-32">
        <Input aria-label={`Referencia partida ${index + 1}`} aria-invalid={Boolean(errors?.reference)} className="h-6 px-1"
          disabled={disabled} maxLength={45} {...form.register(`lines.${index}.reference`)} />
        <FieldError errors={[errors?.reference]} />
      </TableCell>
      <TableCell className="w-16">
        <Button aria-label={`Quitar partida ${index + 1}`} disabled={disabled || !canRemove} onClick={onRemove}
          size="xs" type="button" variant="ghost">Quitar</Button>
      </TableCell>
    </TableRow>
  )
}
