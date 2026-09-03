import { Button } from "@/shared/ui/button"
import {
  selectDesktopWindows,
  selectRestoreDesktopWindow,
  useDesktopWindowStore,
} from "@/shared/ui/desktop-window-store"

export function DesktopWindowTaskbar() {
  const windows = useDesktopWindowStore(selectDesktopWindows)
  const restoreWindow = useDesktopWindowStore(selectRestoreDesktopWindow)
  const minimizedWindows = windows.filter((window) => window.minimized)

  if (minimizedWindows.length === 0) return null

  return (
    <div
      aria-label="Ventanas minimizadas"
      className="fixed inset-x-0 bottom-0 z-[10000] flex min-h-9 items-center gap-1 overflow-x-auto border-t bg-card/98 px-2 py-1 shadow-[0_-3px_12px_rgba(0,0,0,0.18)] backdrop-blur"
      role="toolbar"
    >
      {minimizedWindows.map((window) => (
        <Button
          className="max-w-56 justify-start gap-1.5 px-2 shadow-sm"
          key={window.id}
          onClick={() => restoreWindow(window.id)}
          title={`Restaurar ${window.title}`}
          type="button"
          variant="outline"
        >
          <span aria-hidden className="size-2 shrink-0 rounded-full bg-primary" />
          <span className="truncate">{window.title}</span>
        </Button>
      ))}
    </div>
  )
}

