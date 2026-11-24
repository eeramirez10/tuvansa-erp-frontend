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

export function AccountingPolicyToolbar({ disabled, hasPolicy, canEdit, canDelete, onPrevious, onSearch, onNext, onCreate, onEdit, onDelete }: {
  disabled?: boolean
  hasPolicy: boolean
  canEdit: boolean
  canDelete: boolean
  onPrevious: () => void
  onSearch: () => void
  onNext: () => void
  onCreate: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <ErpModuleToolbarPortal><div aria-label="Navegación de pólizas" className="flex items-center gap-1" role="toolbar">
      <Tool disabled={disabled || !hasPolicy} icon={ArrowLeft01Icon} label="Póliza anterior" onClick={onPrevious} />
      <Tool disabled={disabled} icon={Search01Icon} label="Buscar póliza" onClick={onSearch} />
      <Tool disabled={disabled || !hasPolicy} icon={ArrowRight01Icon} label="Póliza siguiente" onClick={onNext} />
      <Separator className="mx-0.5 h-5" orientation="vertical" />
      <Tool disabled={disabled} icon={FileAddIcon} label="Alta de póliza de diario" onClick={onCreate} />
      <Tool disabled={disabled || !canDelete} icon={Delete01Icon} label="Baja de póliza" onClick={onDelete} />
      <Tool disabled={disabled || !canEdit} icon={Edit02Icon} label="Cambio de póliza" onClick={onEdit} />
    </div></ErpModuleToolbarPortal>
  )
}
