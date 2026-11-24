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

type ClientToolbarProps = {
  disabled?: boolean
  hasClient: boolean
  onCreate: () => void
  onDelete: () => void
  onEdit: () => void
  onNext: () => void
  onPrevious: () => void
  onSearch: () => void
}

function ToolbarButton({ label, icon, onClick, disabled, destructive }: {
  label: string
  icon: typeof ArrowLeft01Icon
  onClick: () => void
  disabled?: boolean
  destructive?: boolean
}) {
  return (
    <Tooltip>
      <TooltipTrigger render={
        <Button aria-label={label} disabled={disabled} onClick={onClick} size="icon-lg" variant={destructive ? "destructive" : "outline"} />
      }>
        <HugeiconsIcon className="size-4" icon={icon} strokeWidth={2} />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export function ClientToolbar(props: ClientToolbarProps) {
  return (
    <ErpModuleToolbarPortal>
      <div aria-label="Navegación y acciones del cliente" className="flex items-center gap-1" role="toolbar">
        <ToolbarButton disabled={props.disabled || !props.hasClient} icon={ArrowLeft01Icon} label="Cliente anterior" onClick={props.onPrevious} />
        <ToolbarButton disabled={props.disabled} icon={Search01Icon} label="Buscar cliente" onClick={props.onSearch} />
        <ToolbarButton disabled={props.disabled || !props.hasClient} icon={ArrowRight01Icon} label="Cliente siguiente" onClick={props.onNext} />
        <Separator className="mx-0.5 h-5" orientation="vertical" />
        <ToolbarButton disabled={props.disabled} icon={FileAddIcon} label="Alta de clientes" onClick={props.onCreate} />
        <ToolbarButton destructive disabled={props.disabled || !props.hasClient} icon={Delete01Icon} label="Baja de cliente" onClick={props.onDelete} />
        <ToolbarButton disabled={props.disabled || !props.hasClient} icon={Edit02Icon} label="Cambio al cliente actual" onClick={props.onEdit} />
      </div>
    </ErpModuleToolbarPortal>
  )
}
