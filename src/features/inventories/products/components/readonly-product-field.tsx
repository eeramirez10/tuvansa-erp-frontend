import type { ComponentProps } from "react"

import { cn } from "@/shared/utils/cn"
import { Field, FieldLabel } from "@/shared/ui/field"
import { Input } from "@/shared/ui/input"

type ReadonlyProductFieldProps = {
  label: string
  value: string | number | null
  inputMode?: ComponentProps<typeof Input>["inputMode"]
  className?: string
}

export function ReadonlyProductField({
  label,
  value,
  inputMode,
  className,
}: ReadonlyProductFieldProps) {
  return (
    <Field className={cn(className)}>
      <FieldLabel>{label}</FieldLabel>
      <Input inputMode={inputMode} readOnly value={value ?? ""} />
    </Field>
  )
}
