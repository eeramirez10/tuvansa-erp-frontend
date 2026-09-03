import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react"
import { createPortal } from "react-dom"
import { Rnd } from "react-rnd"

import { selectInterfaceSize, useAppStore } from "@/app/store"
import { Button } from "@/shared/ui/button"
import { useDesktopWindowId } from "@/shared/ui/desktop-window-context"
import {
  selectFocusDesktopWindow,
  selectMinimizeDesktopWindow,
  selectRegisterDesktopWindow,
  selectToggleMaximizeDesktopWindow,
  selectUnregisterDesktopWindow,
  useDesktopWindowStore,
} from "@/shared/ui/desktop-window-store"
import { cn } from "@/shared/utils/cn"

let nextWindowOffset = 0

type ErpDataDialogProps = {
  title: string
  description: string
  onOpenChange: (open: boolean) => void
  children: ReactNode
  className?: string
  tone?: "inventory" | "receivable" | "payable" | "sales" | "banking"
  windowId?: string
}

export function ErpDataDialog({
  title,
  description,
  onOpenChange,
  children,
  className,
  tone = "inventory",
  windowId: providedWindowId,
}: ErpDataDialogProps) {
  const generatedWindowId = useId()
  const interfaceSize = useAppStore(selectInterfaceSize)
  const interfaceScale = interfaceSize === "large" ? 1.2 : 1
  const availableWidth = (window.innerWidth - 16) / interfaceScale
  const availableHeight = (window.innerHeight - 48) / interfaceScale
  const windowId = useDesktopWindowId(
    providedWindowId ?? `erp-window-${generatedWindowId}`,
  )
  const descriptionId = useId()
  const titleId = useId()
  const registerWindow = useDesktopWindowStore(selectRegisterDesktopWindow)
  const unregisterWindow = useDesktopWindowStore(selectUnregisterDesktopWindow)
  const focusWindow = useDesktopWindowStore(selectFocusDesktopWindow)
  const minimizeWindow = useDesktopWindowStore(selectMinimizeDesktopWindow)
  const toggleMaximizeWindow = useDesktopWindowStore(
    selectToggleMaximizeDesktopWindow,
  )
  const windowState = useDesktopWindowStore((state) =>
    state.windows.find((window) => window.id === windowId),
  )
  const [position, setPosition] = useState(() => {
    const offset = (nextWindowOffset++ % 7) * 24
    return { x: 8 + offset, y: 80 + offset }
  })
  const [size, setSize] = useState<{
    width: number | string
    height: number | string
  } | null>(null)
  const rndRef = useRef<Rnd>(null)

  useEffect(() => {
    registerWindow(windowId, title)
    return () => unregisterWindow(windowId)
  }, [registerWindow, title, unregisterWindow, windowId])

  if (windowState?.minimized) return null

  const maximized = windowState?.maximized ?? false
  const toggleMaximized = () => {
    if (!maximized) {
      const element = rndRef.current?.getSelfElement()
      if (element) {
        setSize({ width: element.offsetWidth, height: element.offsetHeight })
      }
    }
    toggleMaximizeWindow(windowId)
  }
  const toneClasses =
    tone === "banking"
      ? "border-module-banking/70"
      : tone === "payable"
        ? "border-module-payable/70"
        : tone === "receivable"
          ? "border-module-receivable/70"
          : tone === "sales"
            ? "border-module-sales/70"
            : "border-module-inventory/70"

  return createPortal(
    <Rnd
      ref={rndRef}
      bounds="window"
      cancel=".erp-window-controls"
      className={cn(
        "fixed flex max-h-[calc(100vh-3rem)] w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-sm border bg-muted text-[9px]/none shadow-2xl [font-family:Tahoma,'Segoe_UI',sans-serif]",
        "sm:max-w-[46rem]",
        toneClasses,
        maximized && "!max-w-none",
        className,
      )}
      default={{
        x: position.x,
        y: position.y,
        width: availableWidth,
        height: "auto",
      }}
      disableDragging={maximized}
      dragHandleClassName="erp-window-drag-handle"
      enableResizing={!maximized}
      maxHeight={availableHeight}
      maxWidth={availableWidth}
      minHeight={120}
      minWidth={320}
      onDragStart={() => focusWindow(windowId)}
      onDragStop={(_, data) => setPosition({ x: data.x, y: data.y })}
      onMouseDown={() => focusWindow(windowId)}
      onResizeStart={() => focusWindow(windowId)}
      onResizeStop={(_, __, element, ___, nextPosition) => {
        setPosition(nextPosition)
        setSize({ width: element.offsetWidth, height: element.offsetHeight })
      }}
      position={maximized ? { x: 8, y: 8 } : position}
      scale={interfaceScale}
      size={
        maximized
          ? {
              width: availableWidth,
              height: availableHeight,
            }
          : (size ?? undefined)
      }
      style={{ zIndex: windowState?.zIndex ?? 100 }}
    >
      <section
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        className="flex min-h-0 flex-1 flex-col overflow-auto"
        role="dialog"
      >
        <header
          className={cn(
            "erp-window-drag-handle flex h-7 shrink-0 cursor-move items-center justify-between border-b bg-gradient-to-b px-1.5 select-none",
            tone === "banking"
              ? "border-module-banking/50 from-module-banking/35 to-module-banking/15"
              : tone === "payable"
                ? "border-module-payable/50 from-module-payable/35 to-module-payable/15"
                : tone === "receivable"
                  ? "border-module-receivable/50 from-module-receivable/35 to-module-receivable/15"
                  : tone === "sales"
                    ? "border-module-sales/50 from-module-sales/35 to-module-sales/15"
                    : "border-module-inventory/50 from-module-inventory/35 to-module-inventory/15",
          )}
          onDoubleClick={toggleMaximized}
        >
          <h2 className="truncate text-[10px] font-normal" id={titleId}>
            {title}
          </h2>
          <div className="erp-window-controls flex items-center gap-0.5">
            <Button
              aria-label="Minimizar"
              className="h-4.5 w-7 border-foreground/25 bg-background/55 p-0 text-[11px]"
              onClick={() => minimizeWindow(windowId)}
              title="Minimizar"
              type="button"
              variant="outline"
            >
              <span aria-hidden className="-translate-y-0.5">—</span>
            </Button>
            <Button
              aria-label={maximized ? "Restaurar" : "Maximizar"}
              className="h-4.5 w-7 border-foreground/25 bg-background/55 p-0 text-[10px]"
              onClick={toggleMaximized}
              title={maximized ? "Restaurar" : "Maximizar"}
              type="button"
              variant="outline"
            >
              <span aria-hidden>{maximized ? "❐" : "□"}</span>
            </Button>
            <Button
              aria-label="Cerrar"
              className="h-4.5 w-7 border-destructive/50 bg-destructive/80 p-0 text-[12px] text-white hover:bg-destructive"
              onClick={() => onOpenChange(false)}
              title="Cerrar"
              type="button"
              variant="destructive"
            >
              <span aria-hidden>×</span>
            </Button>
          </div>
        </header>

        <p className="sr-only" id={descriptionId}>
          {description}
        </p>

        {children}
      </section>
    </Rnd>,
    document.body,
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
