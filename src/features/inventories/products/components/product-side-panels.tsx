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
  onSelect: (panel: ProductPanelDefinition) => void
}

export function ProductPanelButtons({
  title,
  panels,
  onSelect,
}: ProductPanelButtonsProps) {
  return (
    <Card size="sm">
      <CardHeader className="border-b">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-1">
        {panels.map((panel) => (
          <Button
            className="w-full justify-start"
            key={panel.key}
            onClick={() => onSelect(panel)}
            size="sm"
            variant="outline"
          >
            {panel.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
