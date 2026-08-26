import { useId, type ComponentProps } from "react"

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
  const inputId = useId()

  return (
    <Field
      className={cn("min-w-0 items-center gap-1", className)}
      orientation="horizontal"
    >
      <FieldLabel className="shrink-0 whitespace-nowrap" htmlFor={inputId}>
        {label}
      </FieldLabel>
      <Input
        className="h-5 min-w-0 flex-1 px-1 text-[9px]/tight"
        id={inputId}
        inputMode={inputMode}
        readOnly
        value={value ?? ""}
      />
    </Field>
  )
}
