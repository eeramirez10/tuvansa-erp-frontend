import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import Delete01Icon from "@hugeicons/core-free-icons/Delete01Icon"
import Edit02Icon from "@hugeicons/core-free-icons/Edit02Icon"
import FileAddIcon from "@hugeicons/core-free-icons/FileAddIcon"
import Search01Icon from "@hugeicons/core-free-icons/Search01Icon"
import { HugeiconsIcon } from "@hugeicons/react"
import { ErpModuleToolbarPortal } from "@/features/workspace/components/erp-module-toolbar-portal"
import { Button } from "@/shared/ui/button"
import { Separator } from "@/shared/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip"

function Tool({ label, icon, onClick, disabled }: { label: string; icon: typeof ArrowLeft01Icon; onClick?: () => void; disabled?: boolean }) {
  return (
    <Tooltip><TooltipTrigger render={<Button aria-label={label} disabled={disabled} onClick={onClick} size="icon-lg" variant="outline" />}>
      <HugeiconsIcon className="size-5" icon={icon} strokeWidth={2} />
    </TooltipTrigger><TooltipContent>{label}</TooltipContent></Tooltip>
  )
}

export function PurchaseOrderToolbar({ disabled, onPrevious, onSearch, onNext }: {
  disabled?: boolean
  onPrevious: () => void
  onSearch: () => void
  onNext: () => void
}) {
  return (
    <ErpModuleToolbarPortal><div aria-label="Navegación de órdenes de compra" className="flex items-center gap-1" role="toolbar">
      <Tool disabled={disabled} icon={ArrowLeft01Icon} label="Orden anterior" onClick={onPrevious} />
      <Tool disabled={disabled} icon={Search01Icon} label="Buscar orden" onClick={onSearch} />
      <Tool disabled={disabled} icon={ArrowRight01Icon} label="Orden siguiente" onClick={onNext} />
      <Separator className="mx-0.5 h-5" orientation="vertical" />
      <Tool disabled icon={FileAddIcon} label="Nueva orden (escritura pendiente)" />
      <Tool disabled icon={Delete01Icon} label="Eliminar orden (escritura pendiente)" />
      <Tool disabled icon={Edit02Icon} label="Editar orden (escritura pendiente)" />
    </div></ErpModuleToolbarPortal>
  )
}
