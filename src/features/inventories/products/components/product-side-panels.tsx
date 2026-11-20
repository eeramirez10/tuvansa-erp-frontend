import type { ProductPanelDefinition } from "@/features/inventories/products/model"
import { Button } from "@/shared/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card"

type ProductPanelButtonsProps = {
  title: string
  panels: readonly ProductPanelDefinition[]
  hideActions?: boolean
  onSelect: (panel: ProductPanelDefinition) => void
}

export function ProductPanelButtons({
  title,
  panels,
  hideActions,
  onSelect,
}: ProductPanelButtonsProps) {
  return (
    <Card size="sm">
      <CardHeader className="border-b">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent aria-hidden={hideActions || undefined} className={hideActions ? "invisible grid gap-0.5" : "grid gap-0.5"}>
        {panels.map((panel) => (
          <Button
            className="w-full justify-start"
            disabled={hideActions}
            key={panel.key}
            onClick={() => onSelect(panel)}
            size="xs"
            variant="outline"
          >
            {panel.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
