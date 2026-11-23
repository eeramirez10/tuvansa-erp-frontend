import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import Edit02Icon from "@hugeicons/core-free-icons/Edit02Icon"
import FileAddIcon from "@hugeicons/core-free-icons/FileAddIcon"
import Search01Icon from "@hugeicons/core-free-icons/Search01Icon"
import Delete02Icon from "@hugeicons/core-free-icons/Delete02Icon"
import { HugeiconsIcon } from "@hugeicons/react"
import { ErpModuleToolbarPortal } from "@/features/workspace/components/erp-module-toolbar-portal"
import { Button } from "@/shared/ui/button"
import { Separator } from "@/shared/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip"

type Props = {
  disabled?: boolean
  hasAccount: boolean
  onNext: () => void
  onPrevious: () => void
  onSearch: () => void
  onCreate: () => void
  onEdit: () => void
  onDelete: () => void
}
function Tool({ label, icon, onClick, disabled }: { label: string; icon: typeof ArrowLeft01Icon; onClick: () => void; disabled?: boolean }) {
  return <Tooltip><TooltipTrigger render={<Button aria-label={label} disabled={disabled} onClick={onClick} size="icon-lg" variant="outline" />}><HugeiconsIcon className="size-5" icon={icon} strokeWidth={2} /></TooltipTrigger><TooltipContent>{label}</TooltipContent></Tooltip>
}
export function BankAccountToolbar(props: Props) {
  return <ErpModuleToolbarPortal><div className="flex items-center gap-1" role="toolbar" aria-label="Navegación y mantenimiento de cuentas bancarias">
    <Tool disabled={props.disabled || !props.hasAccount} icon={ArrowLeft01Icon} label="Cuenta anterior" onClick={props.onPrevious} />
    <Tool disabled={props.disabled} icon={Search01Icon} label="Buscar cuenta" onClick={props.onSearch} />
    <Tool disabled={props.disabled || !props.hasAccount} icon={ArrowRight01Icon} label="Cuenta siguiente" onClick={props.onNext} />
    <Separator className="mx-0.5 h-5" orientation="vertical" />
    <Tool disabled={props.disabled} icon={FileAddIcon} label="Alta" onClick={props.onCreate} />
    <Tool disabled={props.disabled || !props.hasAccount} icon={Edit02Icon} label="Cambio" onClick={props.onEdit} />
    <Tool disabled={props.disabled || !props.hasAccount} icon={Delete02Icon} label="Baja" onClick={props.onDelete} />
  </div></ErpModuleToolbarPortal>
}
