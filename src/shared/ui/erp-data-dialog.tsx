import type { ComponentProps, ReactNode } from "react"
import { useId } from "react"

import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui/dialog"
import { cn } from "@/shared/utils/cn"

type ErpDataDialogProps = {
  title: string
  description: string
  onOpenChange: (open: boolean) => void
  children: ReactNode
  className?: string
  tone?: "inventory" | "receivable" | "sales"
}

export function ErpDataDialog({
  title,
  description,
  onOpenChange,
  children,
  className,
  tone = "inventory",
}: ErpDataDialogProps) {
  const descriptionId = useId()

  return (
    <Dialog onOpenChange={onOpenChange} open>
      <DialogContent
        aria-describedby={descriptionId}
        className={cn(
          "gap-0 overflow-hidden rounded-sm bg-muted p-0 text-[9px]/none shadow-2xl sm:max-w-[46rem]",
          tone === "receivable"
            ? "border border-module-receivable/70"
            : tone === "sales"
              ? "border border-module-sales/70"
              : "border border-module-inventory/70",
          className,
        )}
        overlayClassName="bg-transparent backdrop-blur-none supports-backdrop-filter:backdrop-blur-none"
        showCloseButton={false}
      >
        <header
          className={cn(
            "flex h-7 items-center justify-between border-b bg-gradient-to-b px-1.5 [font-family:Tahoma,'Segoe_UI',sans-serif]",
            tone === "receivable"
              ? "border-module-receivable/50 from-module-receivable/35 to-module-receivable/15"
              : tone === "sales"
                ? "border-module-sales/50 from-module-sales/35 to-module-sales/15"
                : "border-module-inventory/50 from-module-inventory/35 to-module-inventory/15",
          )}
        >
          <DialogTitle className="text-[10px] font-normal">{title}</DialogTitle>
          <div className="flex items-center gap-0.5">
            <Button
              aria-label="Minimizar"
              className="h-4.5 w-7 border-foreground/25 bg-background/55 p-0 text-[11px]"
              title="Minimizar"
              type="button"
              variant="outline"
            >
              <span aria-hidden className="-translate-y-0.5">—</span>
            </Button>
            <Button
              aria-label="Maximizar"
              className="h-4.5 w-7 border-foreground/25 bg-background/55 p-0 text-[10px]"
              title="Maximizar"
              type="button"
              variant="outline"
            >
              <span aria-hidden>□</span>
            </Button>
            <DialogClose
              render={
                <Button
                  aria-label="Cerrar"
                  className="h-4.5 w-7 border-destructive/50 bg-destructive/80 p-0 text-[12px] text-white hover:bg-destructive"
                  title="Cerrar"
                  type="button"
                  variant="destructive"
                />
              }
            >
              <span aria-hidden>×</span>
            </DialogClose>
          </div>
        </header>

        <DialogDescription className="sr-only" id={descriptionId}>
          {description}
        </DialogDescription>

        {children}
      </DialogContent>
    </Dialog>
  )
}

export function ErpDataDialogBody({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "min-w-0 bg-muted p-1.5 [font-family:Tahoma,'Segoe_UI',sans-serif]",
        className,
      )}
      {...props}
    />
  )
}

type ErpDataTableViewportProps = ComponentProps<"div"> & {
  axes?: "xy" | "x" | "y"
}

export function ErpDataTableViewport({
  axes = "xy",
  className,
  ...props
}: ErpDataTableViewportProps) {
  const overflowClass =
    axes === "x"
      ? "overflow-x-scroll overflow-y-hidden"
      : axes === "y"
        ? "overflow-x-hidden overflow-y-scroll"
        : "overflow-scroll"

  return (
    <div
      className={cn(
        "w-full min-w-0 max-w-full border border-input bg-background shadow-inner [scrollbar-color:var(--border)_var(--muted)] [scrollbar-width:auto]",
        overflowClass,
        className,
      )}
      {...props}
    />
  )
}

type ErpDataMetricProps = {
  label: string
  value: string
  className?: string
}

export function ErpDataMetric({ label, value, className }: ErpDataMetricProps) {
  return (
    <label className={cn("grid min-w-20 gap-0.5", className)}>
      <span className="px-1">{label}</span>
      <output className="flex h-4 items-center justify-end border border-input bg-background px-1 tabular-nums shadow-inner">
        {value}
      </output>
    </label>
  )
}
