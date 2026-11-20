import type { ComponentProps } from "react"
import { cn } from "@/shared/utils/cn"

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-16 w-full rounded-md border border-input bg-input/20 px-2 py-1.5 text-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-50 dark:bg-input/30",
        className,
      )}
      {...props}
    />
  )
}
