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

type Props = { disabled?: boolean; onCreate: () => void; onDelete: () => void; onEdit: () => void; onNext: () => void; onPrevious: () => void; onSearch: () => void }
function Tool({ label, icon, onClick, disabled, destructive }: { label: string; icon: typeof ArrowLeft01Icon; onClick: () => void; disabled?: boolean; destructive?: boolean }) {
  return (
    <Tooltip><TooltipTrigger render={<Button aria-label={label} disabled={disabled} onClick={onClick} size="icon-lg" variant={destructive ? "destructive" : "outline"} />}>
      <HugeiconsIcon className="size-4" icon={icon} strokeWidth={2} />
    </TooltipTrigger><TooltipContent>{label}</TooltipContent></Tooltip>
  )
}
export function OrderToolbar(props: Props) {
  return (
    <ErpModuleToolbarPortal><div className="flex items-center gap-1" role="toolbar" aria-label="Navegación y acciones del pedido">
      <Tool disabled={props.disabled} icon={ArrowLeft01Icon} label="Pedido anterior" onClick={props.onPrevious} />
      <Tool disabled={props.disabled} icon={Search01Icon} label="Buscar pedido" onClick={props.onSearch} />
      <Tool disabled={props.disabled} icon={ArrowRight01Icon} label="Pedido siguiente" onClick={props.onNext} />
      <Separator className="mx-0.5 h-5" orientation="vertical" />
      <Tool disabled={props.disabled} icon={FileAddIcon} label="Nuevo pedido" onClick={props.onCreate} />
      <Tool destructive disabled={props.disabled} icon={Delete01Icon} label="Eliminar pedido" onClick={props.onDelete} />
      <Tool disabled={props.disabled} icon={Edit02Icon} label="Editar pedido" onClick={props.onEdit} />
    </div></ErpModuleToolbarPortal>
  )
}
