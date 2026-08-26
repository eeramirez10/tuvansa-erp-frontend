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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/ui/tooltip"

type ProductToolbarProps = {
  disabled?: boolean
  onCreate: () => void
  onDelete: () => void
  onEdit: () => void
  onNext: () => void
  onPrevious: () => void
  onSearch: () => void
}

type ToolbarButtonProps = {
  label: string
  icon: typeof ArrowLeft01Icon
  onClick: () => void
  disabled?: boolean
  destructive?: boolean
}

function ToolbarButton({
  label,
  icon,
  onClick,
  disabled,
  destructive,
}: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
            size="icon-lg"
            variant={destructive ? "destructive" : "outline"}
          />
        }
      >
        <HugeiconsIcon
          className="size-4"
          data-icon="inline-start"
          icon={icon}
          strokeWidth={2}
        />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export function ProductToolbar({
  disabled,
  onCreate,
  onDelete,
  onEdit,
  onNext,
  onPrevious,
  onSearch,
}: ProductToolbarProps) {
  return (
    <ErpModuleToolbarPortal>
      <div
        aria-label="Navegación y acciones del producto"
        className="flex items-center gap-1"
        role="toolbar"
      >
        <ToolbarButton
          disabled={disabled}
          icon={ArrowLeft01Icon}
          label="Producto anterior"
          onClick={onPrevious}
        />
        <ToolbarButton
          disabled={disabled}
          icon={Search01Icon}
          label="Buscar producto"
          onClick={onSearch}
        />
        <ToolbarButton
          disabled={disabled}
          icon={ArrowRight01Icon}
          label="Producto siguiente"
          onClick={onNext}
        />
        <Separator className="mx-0.5 h-5" orientation="vertical" />
        <ToolbarButton
          disabled={disabled}
          icon={FileAddIcon}
          label="Nuevo producto"
          onClick={onCreate}
        />
        <ToolbarButton
          destructive
          disabled={disabled}
          icon={Delete01Icon}
          label="Eliminar producto"
          onClick={onDelete}
        />
        <ToolbarButton
          disabled={disabled}
          icon={Edit02Icon}
          label="Editar producto"
          onClick={onEdit}
        />
      </div>
    </ErpModuleToolbarPortal>
  )
}
