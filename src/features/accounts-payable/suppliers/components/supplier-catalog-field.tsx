import { useId, type ComponentProps } from "react"
import type { FieldPath, UseFormReturn } from "react-hook-form"
import { ReadonlySupplierField } from "@/features/accounts-payable/suppliers/components/readonly-supplier-field"
import type { SupplierCatalogFields } from "@/features/accounts-payable/suppliers/model"
import { supplierFieldWidths } from "@/features/accounts-payable/suppliers/supplier-catalog-form"
import { Field, FieldError, FieldLabel } from "@/shared/ui/field"
import { Input } from "@/shared/ui/input"
import { cn } from "@/shared/utils/cn"

export type SupplierCatalogEditor = {
  form: UseFormReturn<SupplierCatalogFields>
  disabled: boolean
  codeEditable: boolean
  onCodeBlur: (value: string) => void
  onCodeChange: () => void
}

export type SupplierCatalogFieldProps = ComponentProps<typeof ReadonlySupplierField> & {
  field: FieldPath<SupplierCatalogFields>
  editor?: SupplierCatalogEditor
  numeric?: boolean
  decimal?: boolean
}

export function SupplierCatalogField({ editor, field, numeric, decimal, ...props }: SupplierCatalogFieldProps) {
  const id = useId()
  if (!editor || (field === "code" && !editor.codeEditable)) return <ReadonlySupplierField {...props} />
  const { form } = editor
  const { error } = form.getFieldState(field, form.formState)
  const isCode = field === "code"
  const maxLength = supplierFieldWidths[field as keyof typeof supplierFieldWidths]
  const registration = form.register(field, { valueAsNumber: numeric || decimal })

  return (
    <Field className={cn("min-w-0 items-center gap-1", props.className)} data-invalid={Boolean(error)} orientation="horizontal">
      <FieldLabel className="shrink-0 whitespace-nowrap" htmlFor={id}>{props.label}</FieldLabel>
      <div className="min-w-0 flex-1">
        <Input aria-invalid={Boolean(error)} className={cn("h-5 min-w-0 px-1 text-[9px]/tight", isCode && "uppercase")}
          disabled={editor.disabled} id={id} inputMode={props.inputMode} maxLength={maxLength}
          type={numeric || decimal ? "number" : "text"} step={decimal ? "0.01" : numeric ? "1" : undefined}
          {...registration}
          onBlur={event => {
            const value = event.currentTarget.value
            void registration.onBlur(event)
            if (isCode) editor.onCodeBlur(value)
          }}
          onChange={event => {
            if (isCode) editor.onCodeChange()
            void registration.onChange(event)
          }}
        />
        <FieldError errors={[error]} />
      </div>
    </Field>
  )
}
