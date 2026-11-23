import MinusSignIcon from "@hugeicons/core-free-icons/MinusSignIcon"
import { HugeiconsIcon } from "@hugeicons/react"
import { useQuery } from "@tanstack/react-query"
import { useRef, useState } from "react"
import { Controller, useWatch, type Control, type FieldErrors, type UseFormRegister, type UseFormSetValue } from "react-hook-form"
import {
  generalExpenseCents,
  generalExpensesTaxFields,
  normalizeGeneralExpenseCode,
  type GeneralExpenseDraftLine,
  type GeneralExpensesDraft,
} from "@/features/purchasing/purchase-receptions/general-expenses-form"
import { generalExpensesCatalogQueryOptions } from "@/features/purchasing/purchase-receptions/logic"
import type { GeneralExpensesPreview, GeneralExpensesTaxAccount } from "@/features/purchasing/purchase-receptions/model"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { TableCell, TableRow } from "@/shared/ui/table"

const fieldClass = "h-6 min-w-0 rounded-sm px-1 text-[10px]"
const totalClass = fieldClass + " text-right tabular-nums"
const cellClass = "align-top px-1 py-0.5"

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-0.5 text-destructive" role="alert">{message}</p> : null
}

function LookupStatus({ pending, unavailable, name }: { pending: boolean; unavailable?: string; name?: string }) {
  if (pending) return <p className="mt-0.5 text-muted-foreground" role="status">Consultando…</p>
  if (unavailable) return <FieldError message={unavailable} />
  return name ? <p className="mt-0.5 truncate text-muted-foreground" title={name}>{name}</p> : null
}

type Props = {
  control: Control<GeneralExpensesDraft>
  register: UseFormRegister<GeneralExpensesDraft>
  setValue: UseFormSetValue<GeneralExpensesDraft>
  index: number
  errors?: FieldErrors<GeneralExpenseDraftLine>
  costCenters: GeneralExpensesPreview["costCenters"]
  saving: boolean
  canRemove: boolean
  onRemove: () => void
}

export function GeneralExpenseLineRow({ control, register, setValue, index, errors, costCenters, saving, canRemove, onRemove }: Props) {
  const line = useWatch({ control, name: `lines.${index}` })
  const [supplierLookup, setSupplierLookup] = useState("")
  const [productLookup, setProductLookup] = useState("")
  const manuallyEntered = useRef(new Set<GeneralExpensesTaxAccount>())
  const taxBasis = useRef("")
  const supplierCode = normalizeGeneralExpenseCode(line?.supplierCode ?? "")
  const productCode = normalizeGeneralExpenseCode(line?.productCode ?? "")
  const supplierQuery = useQuery(generalExpensesCatalogQueryOptions("supplierCode", supplierLookup === supplierCode ? supplierLookup : ""))
  const productQuery = useQuery(generalExpensesCatalogQueryOptions("productCode", productLookup === productCode ? productLookup : ""))
  const supplier = supplierQuery.data?.supplier
  const product = productQuery.data?.product
  const supplierField = register(`lines.${index}.supplierCode`)
  const productField = register(`lines.${index}.productCode`)
  const baseField = register(`lines.${index}.base`)

  function suggestTaxes(value: string) {
    const cents = generalExpenseCents(value)
    if (!value.trim() || cents === null || !supplier?.calculateTaxes || !product
      || typeof product.vatExempt !== "boolean" || typeof product.retentionsEligible !== "boolean") return
    const basis = `${supplier.id}/${product.id}/${cents}`
    if (taxBasis.current === basis) return
    taxBasis.current = basis
    const rates = {
      vat: product.vatExempt ? 0 : supplier.vatRate,
      vatWithholding: product.retentionsEligible ? supplier.vatWithholdingRate : 0,
      incomeWithholding: product.retentionsEligible ? supplier.incomeWithholdingRate : 0,
    }
    for (const { key } of generalExpensesTaxFields) {
      if (manuallyEntered.current.has(key) || !Number.isFinite(rates[key])) continue
      const tax = Math.sign(cents) * Math.round(Math.abs(cents) * rates[key] / 100)
      setValue(`lines.${index}.${key}`, (tax / 100).toFixed(2), { shouldDirty: true, shouldValidate: true })
    }
  }

  const number = index + 1
  const unknownSupplier = supplierLookup === supplierCode && supplierCode.length > 0 && supplierQuery.isSuccess && !supplier
  const unknownProduct = productLookup === productCode && productCode.length > 0 && productQuery.isSuccess && !product

  return <TableRow>
    <TableCell className={cellClass}>
      <Input
        aria-invalid={Boolean(errors?.supplierCode || supplierQuery.isError || unknownSupplier)}
        aria-label={`Proveedor de la partida ${number}`}
        className={fieldClass} maxLength={6}
        {...supplierField}
        onBlur={(event) => { void supplierField.onBlur(event); setSupplierLookup(normalizeGeneralExpenseCode(event.target.value)) }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault()
            if (supplierLookup && supplierLookup === supplierCode) void supplierQuery.refetch()
            else setSupplierLookup(supplierCode)
          }
        }}
      />
      <LookupStatus pending={supplierQuery.isFetching} name={supplier?.name}
        unavailable={supplierQuery.isError ? getApiErrorMessage(supplierQuery.error) : unknownSupplier ? "Proveedor no encontrado." : undefined} />
      <FieldError message={errors?.supplierCode?.message} />
    </TableCell>
    <TableCell className={cellClass}>
      <Input
        aria-invalid={Boolean(errors?.productCode || productQuery.isError || unknownProduct)}
        aria-label={`Gasto de la partida ${number}`}
        className={fieldClass} maxLength={13}
        {...productField}
        onBlur={(event) => { void productField.onBlur(event); setProductLookup(normalizeGeneralExpenseCode(event.target.value)) }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault()
            if (productLookup && productLookup === productCode) void productQuery.refetch()
            else setProductLookup(productCode)
          }
        }}
      />
      <LookupStatus pending={productQuery.isFetching} name={product?.name}
        unavailable={productQuery.isError ? getApiErrorMessage(productQuery.error) : unknownProduct ? "Gasto no encontrado." : undefined} />
      <FieldError message={errors?.productCode?.message} />
    </TableCell>
    <TableCell className={cellClass}>
      <Input aria-invalid={Boolean(errors?.reference)} aria-label={`Referencia de la partida ${number}`}
        className={fieldClass} maxLength={23} {...register(`lines.${index}.reference`)} />
      <FieldError message={errors?.reference?.message} />
    </TableCell>
    <TableCell className={cellClass}>
      <Input aria-invalid={Boolean(errors?.base)} aria-label={`Importe de la partida ${number}`}
        className={totalClass} inputMode="decimal" placeholder="0.00" {...baseField}
        onBlur={(event) => { void baseField.onBlur(event); suggestTaxes(event.target.value) }} />
      <FieldError message={errors?.base?.message} />
    </TableCell>
    {generalExpensesTaxFields.map(({ key, label }) => {
      const registered = register(`lines.${index}.${key}`)
      return <TableCell className={cellClass} key={key}>
        <Input aria-invalid={Boolean(errors?.[key])} aria-label={`${label} de la partida ${number}`}
          className={totalClass} inputMode="decimal" placeholder="0.00" {...registered}
          onChange={(event) => { manuallyEntered.current.add(key); void registered.onChange(event) }} />
        <FieldError message={errors?.[key]?.message} />
      </TableCell>
    })}
    <TableCell className={cellClass}>
      <Controller control={control} name={`lines.${index}.costCenter`} render={({ field }) => (
        <Select disabled={saving} value={field.value || null} onValueChange={(value) => field.onChange(value ?? "")}>
          <SelectTrigger aria-invalid={Boolean(errors?.costCenter)} aria-label={`Centro de costos de la partida ${number}`}
            className="w-full" onBlur={field.onBlur} ref={field.ref} size="sm">
            <SelectValue placeholder="C.C." />
          </SelectTrigger>
          <SelectContent>{costCenters.map(({ code, name }) => <SelectItem key={code} value={code}>{code} · {name}</SelectItem>)}</SelectContent>
        </Select>
      )} />
      <FieldError message={errors?.costCenter?.message} />
    </TableCell>
    <TableCell className={cellClass}>
      <Button aria-label={`Eliminar partida ${number}`} disabled={saving || !canRemove} onClick={onRemove}
        size="icon-xs" type="button" variant="ghost"><HugeiconsIcon icon={MinusSignIcon} /></Button>
    </TableCell>
  </TableRow>
}
