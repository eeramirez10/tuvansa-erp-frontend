import { queryPanelRows } from "@/features/inventories/products/constants"
import type { ProductPanelDefinition } from "@/features/inventories/products/model"
import { Button } from "@/shared/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card"

type ProductQueriesPanelProps = {
  onSelect: (panel: ProductPanelDefinition) => void
}

export function ProductQueriesPanel({ onSelect }: ProductQueriesPanelProps) {
  return (
    <Card size="sm">
      <CardHeader className="border-b">
        <CardTitle>Consultas</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-0.5">
        {queryPanelRows.map((row) => (
          <div className="flex min-w-0 gap-0.5" key={row.primary.key}>
            <Button
              className="min-w-0 flex-1 justify-start"
              onClick={() => onSelect(row.primary)}
              size="xs"
              variant="outline"
            >
              <span className="truncate">{row.primary.label}</span>
            </Button>
            {row.shortcuts?.map((shortcut) => (
              <Button
                aria-label={`${row.primary.label} ${shortcut.label}`}
                key={shortcut.key}
                onClick={() => onSelect(shortcut)}
                size="icon-xs"
                variant="outline"
              >
                {shortcut.label}
              </Button>
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
