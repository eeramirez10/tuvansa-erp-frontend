import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { useController, useWatch, type UseFormReturn } from "react-hook-form"
import { movementCaptureProduct, type MovementCaptureDraft, type MovementCaptureValues } from "@/features/inventories/movements/movement-capture-form"
import { productSearchQueryOptions } from "@/features/inventories/products/logic"
import { Button } from "@/shared/ui/button"
import { FieldError } from "@/shared/ui/field"
import { Input } from "@/shared/ui/input"
import { TableCell, TableRow } from "@/shared/ui/table"

type Props = {
  form: UseFormReturn<MovementCaptureDraft, unknown, MovementCaptureValues>
  index: number
  disabled: boolean
  canRemove: boolean
  onSearch: () => void
  onRemove: () => void
}

export function MovementCaptureLine({ form, index, disabled, canRemove, onSearch, onRemove }: Props) {
  const queryClient = useQueryClient()
  const request = useRef(0)
  const liveIndex = useRef(index)
  const [lookupPending, setLookupPending] = useState(false)
  const codePath = `lines.${index}.code` as const
  const productPath = `lines.${index}.product` as const
  const { field, fieldState } = useController({ control: form.control, name: codePath })
  const product = useWatch({ control: form.control, name: productPath })
  const errors = form.formState.errors.lines?.[index]
  useEffect(() => { liveIndex.current = index }, [index])
  useEffect(() => () => { request.current += 1 }, [])

  async function lookup(rawCode: string) {
    const code = rawCode.trim().toUpperCase()
    if (!code || product?.code.trim().toUpperCase() === code || disabled) return
    const current = ++request.current
    setLookupPending(true)
    try {
      const { data } = await queryClient.fetchQuery(productSearchQueryOptions({ q: code, status: "active", page: 1, pageSize: 100 }))
      const currentPath = `lines.${liveIndex.current}.code` as const
      if (current !== request.current || form.getValues(currentPath)?.trim().toUpperCase() !== code) return
      const matches = data.filter(item => item.isActive && item.code.trim().toUpperCase() === code)
      if (matches.length === 1) {
        form.setValue(`lines.${liveIndex.current}.product`, movementCaptureProduct(matches[0]), { shouldDirty: true })
        form.clearErrors(currentPath)
      } else {
        form.setError(currentPath, { type: "lookup", message: matches.length ? "Elige el producto en la búsqueda." : "El código no corresponde a un producto activo." })
      }
    } catch {
      if (current === request.current) form.setError(`lines.${liveIndex.current}.code`, {
        type: "lookup",
        message: "No fue posible consultar el producto.",
      })
    } finally {
      if (current === request.current) setLookupPending(false)
    }
  }

  return (
    <TableRow className="align-top">
      <TableCell className="w-44">
        <div className="flex items-center gap-1">
          <Input aria-invalid={fieldState.invalid} aria-label={`Código partida ${index + 1}`} className="h-6 min-w-14 px-1 uppercase"
            disabled={disabled} maxLength={13} {...field} onChange={event => {
              request.current += 1
              setLookupPending(false)
              const value = event.currentTarget.value
              if (value.trim().toUpperCase() !== product?.code.trim().toUpperCase()) form.setValue(productPath, null)
              form.clearErrors(codePath)
              field.onChange(value)
            }} onBlur={event => {
              field.onBlur()
              void lookup(event.currentTarget.value)
            }} onKeyDown={event => {
              if (event.key === "Enter") {
                event.preventDefault()
                void lookup(event.currentTarget.value)
              }
            }} />
          <Button aria-label={`Buscar producto partida ${index + 1}`} disabled={disabled} onClick={onSearch} size="xs" type="button" variant="outline">Buscar</Button>
        </div>
        {lookupPending && <p className="text-muted-foreground" role="status">Consultando…</p>}
        <FieldError errors={[fieldState.error]} />
      </TableCell>
      <TableCell className="min-w-36">{product?.description}</TableCell>
      <TableCell>{product?.unit}</TableCell>
      <TableCell className="w-28">
        <Input aria-invalid={Boolean(errors?.quantity)} aria-label={`Cantidad partida ${index + 1}`} className="h-6 px-1 text-right"
          disabled={disabled} inputMode="decimal" {...form.register(`lines.${index}.quantity`)} />
        <FieldError errors={[errors?.quantity]} />
      </TableCell>
      <TableCell className="w-28">
        <Input aria-invalid={Boolean(errors?.cost)} aria-label={`Costo partida ${index + 1}`} className="h-6 px-1 text-right"
          disabled={disabled} inputMode="decimal" placeholder="Catálogo" {...form.register(`lines.${index}.cost`)} />
        <FieldError errors={[errors?.cost]} />
      </TableCell>
      <TableCell className="w-16">
        <Button aria-label={`Quitar partida ${index + 1}`} disabled={disabled || !canRemove} onClick={onRemove} size="xs" type="button" variant="ghost">Quitar</Button>
      </TableCell>
    </TableRow>
  )
}
