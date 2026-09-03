import { selectInterfaceSize, selectToggleInterfaceSize, useAppStore } from "@/app/store"
import { Button } from "@/shared/ui/button"

export function InterfaceSizeToggle() {
  const interfaceSize = useAppStore(selectInterfaceSize)
  const toggleInterfaceSize = useAppStore(selectToggleInterfaceSize)
  const isLarge = interfaceSize === "large"

  return (
    <Button
      aria-label={isLarge ? "Restaurar tamaño original" : "Ampliar interfaz"}
      aria-pressed={isLarge}
      className="h-8 min-w-36 gap-2 border-foreground/20 bg-background px-3 shadow-sm"
      onClick={toggleInterfaceSize}
      title={isLarge ? "Restaurar tamaño original" : "Ampliar texto y controles"}
      type="button"
      variant="outline"
    >
      <span aria-hidden className="text-base/tight font-bold">
        {isLarge ? "A−" : "A+"}
      </span>
      <span className="text-[11px]/tight">
        {isLarge ? "Tamaño original" : "Ampliar interfaz"}
      </span>
    </Button>
  )
}
