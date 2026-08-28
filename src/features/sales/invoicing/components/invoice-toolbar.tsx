import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import Search01Icon from "@hugeicons/core-free-icons/Search01Icon"
import { HugeiconsIcon } from "@hugeicons/react"
import { ErpModuleToolbarPortal } from "@/features/workspace/components/erp-module-toolbar-portal"
import { Button } from "@/shared/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip"

type Props = {
  disabled?: boolean
  onNext: () => void
  onPrevious: () => void
  onSearch: () => void
}

function Tool({
  label,
  icon,
  onClick,
  disabled,
}: {
  label: string
  icon: typeof ArrowLeft01Icon
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
            size="icon-lg"
            variant="outline"
          />
        }
      >
        <HugeiconsIcon className="size-5" icon={icon} strokeWidth={2} />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export function InvoiceToolbar(props: Props) {
  return (
    <ErpModuleToolbarPortal>
      <div className="flex items-center gap-1" role="toolbar" aria-label="Navegación de facturas">
        <Tool disabled={props.disabled} icon={ArrowLeft01Icon} label="Factura anterior" onClick={props.onPrevious} />
        <Tool disabled={props.disabled} icon={Search01Icon} label="Buscar factura" onClick={props.onSearch} />
        <Tool disabled={props.disabled} icon={ArrowRight01Icon} label="Factura siguiente" onClick={props.onNext} />
      </div>
    </ErpModuleToolbarPortal>
  )
}
