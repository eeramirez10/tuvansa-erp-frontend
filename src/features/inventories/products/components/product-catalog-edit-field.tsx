import { useId, type ComponentProps } from "react"
import { Controller, type Control } from "react-hook-form"

import { ReadonlyProductField } from "@/features/inventories/products/components/readonly-product-field"
import type {
  Product,
  ProductCatalogEditDraft,
  ProductCatalogEditField,
  ProductCatalogEditValues,
  ProductEditOptions,
} from "@/features/inventories/products/model"
import { Field, FieldError, FieldLabel } from "@/shared/ui/field"
import { Input } from "@/shared/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { cn } from "@/shared/utils/cn"

export type ProductCatalogEditor = {
  control: Control<ProductCatalogEditDraft, unknown, ProductCatalogEditValues>
  fields: ReadonlySet<string>
  units: ProductEditOptions["units"]
  disabled: boolean
}

export function CatalogEditField({ editor, name, ...props }: ComponentProps<typeof ReadonlyProductField> & {
  editor?: ProductCatalogEditor
  name: Exclude<ProductCatalogEditField, "unitId" | "type" | "usesColorAndSize">
}) {
  const id = useId()
  if (!editor?.fields.has(name)) return <ReadonlyProductField {...props} />

  const numeric = props.inputMode === "decimal" || props.inputMode === "numeric"
  const initialValue = String(props.value ?? "")
  const initial = numeric ? initialValue.replaceAll(",", "") : initialValue
  return (
    <Controller
      control={editor.control}
      name={`changes.${name}`}
      render={({ field, fieldState }) => (
        <Field className={cn("min-w-0 items-center gap-1", props.className)} data-invalid={fieldState.invalid} orientation="horizontal">
          <FieldLabel className="shrink-0 whitespace-nowrap" htmlFor={id}>{props.label}</FieldLabel>
          <div className="min-w-0 flex-1">
            <Input
              aria-invalid={fieldState.invalid}
              className="h-5 min-w-0 px-1 text-[9px]/tight"
              disabled={editor.disabled}
              id={id}
              inputMode={props.inputMode}
              name={field.name}
              onBlur={field.onBlur}
              onChange={(event) => field.onChange(event.target.value)}
              ref={field.ref}
              value={field.value ?? initial}
            />
            <FieldError errors={[fieldState.error]} />
          </div>
        </Field>
      )}
    />
  )
}

export function CatalogUnitField({ unit, value, editor, className }: {
  unit: Product["classification"]["unit"]
  value: string
  editor?: ProductCatalogEditor
  className?: string
}) {
  const id = useId()
  if (!editor?.fields.has("unitId")) return <ReadonlyProductField className={className} label="Unidad" value={value} />

  return (
    <Controller
      control={editor.control}
      name="changes.unitId"
      render={({ field, fieldState }) => {
        const chosen = editor.units.find((option) => option.id === (field.value ?? unit.id))
        return (
          <Field className={cn("min-w-0 items-center gap-1", className)} data-invalid={fieldState.invalid} orientation="horizontal">
            <FieldLabel className="shrink-0" htmlFor={id}>Unidad</FieldLabel>
            <div className="min-w-0 flex-1">
              <Select
                disabled={editor.disabled || editor.units.length === 0}
                onValueChange={(next) => { if (next !== null) field.onChange(next) }}
                value={chosen?.id ?? null}
              >
                <SelectTrigger aria-invalid={fieldState.invalid} className="h-5 w-full min-w-0 px-1 text-[9px]/tight" id={id} onBlur={field.onBlur} ref={field.ref} size="sm">
                  <SelectValue>{chosen ? `${chosen.code} · ${chosen.description}` : value}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {editor.units.map(({ id: unitId, code, description }) => (
                    <SelectItem key={unitId} value={unitId}>{code} · {description}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={[fieldState.error]} />
            </div>
          </Field>
        )
      }}
    />
  )
}
